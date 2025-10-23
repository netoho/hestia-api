import { BaseMongooseRepository } from '@Database/document-db/base-mongoose.repository';
import { FilterBuilder, SimpleFilters } from '@Database/document-db/filter-builder';
import { IFacetedResult, IQueryPagination } from '@Database/document-db/types/base-repository.interface';
import { Document, Model } from 'mongoose';

interface LookupConfig {
    from: string;
    localField?: string;
    foreignField?: string;
    as: string;
    /** Whether to unwind the array result into a single object */
    unwind?: boolean;
}

interface EnhancedFilterOptions {
  /** Text to search across multiple fields */
  searchText?: string;
  /** Fields to search text in (supports nested fields like 'invoice.rfc') */
  searchFields?: string[];
  /** Additional MongoDB pipeline stages for complex operations */
  additionalStages?: any[];
  /** Collection lookup configurations (auto-generated from nested fields if not provided) */
  lookups?: LookupConfig[];
}

interface NestedFieldInfo {
  collection: string;
  field: string;
  fullPath: string;
}

/**
 * Enhanced Mongoose Repository with support for:
 * - Nested field filtering (e.g., 'invoice.status')
 * - OR conditions in filters
 * - Automatic lookup generation for related collections
 * - Text search in nested fields
 * - Developer-friendly API without MongoDB knowledge required
 */
export abstract class EnhancedMongooseRepository<T extends Document> extends BaseMongooseRepository<T> {
  constructor(model: Model<T>) {
    super(model);
  }

  /**
   * Executes an aggregation pipeline with pagination and count using $facet for optimal performance.
   * This method performs both count and data retrieval in a single aggregation query.
   *
   * @param pipelineStages - Array of aggregation pipeline stages to execute before pagination
   * @param paginated - Pagination parameters including offset, limit, orderBy, and sortOrder
   * @returns Promise resolving to paginated response with count and results
   */
  public async getPaginatedAggregation<TResult = any>(
    pipelineStages: any[],
    paginated: IQueryPagination<T>,
  ): Promise<IFacetedResult<TResult>> {
    const { offset = 0, limit = 10, orderBy = 'created_at', sortOrder = 'desc' } = paginated;
    const sortOrderKey = sortOrder === 'asc' ? 1 : -1;

    const pipeline = [
      ...pipelineStages,
      // Sort results
      { $sort: { [orderBy as string]: sortOrderKey } },
      // Facet for pagination and count in single query
      {
        $facet: {
          data: [
            { $skip: offset },
            { $limit: limit },
          ],
          count: [{ $count: 'total' }],
        },
      },
    ];

    const [result] = await this.model.aggregate(pipeline).exec();
    const count = result?.count[0]?.total || 0;
    const results = result?.data || [];

    return {
      count,
      results,
    };
  }

  /**
   * Developer-friendly method to get paginated results with enhanced filtering capabilities.
   * Supports nested field filtering, OR conditions, and automatic lookup generation.
   *
   * @example
   * ```typescript
   * // Filter with nested fields and OR conditions
   * const results = await repository.getPaginatedWithFilters(
   *   {
   *     status: ['PAID', 'INVOICED'],
   *     'invoice.status': { notIn: ['CANCELLED'] },
   *     $or: [
   *       { created_at: { between: { min: startDate, max: endDate } } },
   *       { updated_at: { between: { min: startDate, max: endDate } } }
   *     ]
   *   },
   *   { offset: 0, limit: 10 },
   *   {
   *     searchText: 'payment',
   *     searchFields: ['folio', 'invoice.rfc']
   *   }
   * );
   * ```
   */
  public async getPaginatedWithFilters<TResult = T>(
    filters: SimpleFilters<T> & { $or?: any[] },
    paginated: IQueryPagination<T>,
    options?: EnhancedFilterOptions,
  ): Promise<IFacetedResult<TResult>> {
    const pipelineStages: any[] = [];

    // Step 1: Separate nested and root filters
    const { rootFilters, nestedFilters, orConditions } = this.separateFilters(filters);

    // Step 2: Apply root level filters first
    if (Object.keys(rootFilters).length > 0) {
      const rootPipeline = FilterBuilder.buildPipeline(rootFilters);
      pipelineStages.push(...rootPipeline);
    }

    // Step 3: Generate and add lookup stages for nested fields
    const nestedFieldsInfo = this.extractNestedFieldsInfo(nestedFilters);
    const searchNestedFields = this.extractNestedFieldsFromSearch(options?.searchFields || []);
    const allNestedFields = [...nestedFieldsInfo, ...searchNestedFields];

    if (allNestedFields.length > 0 || options?.lookups) {
      const lookupStages = this.generateLookupStages(allNestedFields, options?.lookups);
      pipelineStages.push(...lookupStages);
    }

    // Step 4: Apply nested field filters after lookups
    if (Object.keys(nestedFilters).length > 0) {
      const nestedMatchStage = this.buildNestedMatchStage(nestedFilters);
      if (Object.keys(nestedMatchStage).length > 0) {
        pipelineStages.push({ $match: nestedMatchStage });
      }
    }

    // Step 5: Handle OR conditions
    if (orConditions && orConditions.length > 0) {
      const orStage = this.buildOrConditionStage(orConditions);
      if (orStage) {
        pipelineStages.push(orStage);
      }
    }

    // Step 6: Add text search if provided
    if (options?.searchText && options?.searchFields) {
      const textSearchStage = this.buildEnhancedTextSearch(
        options.searchText,
        options.searchFields,
      );
      if (Object.keys(textSearchStage).length > 0) {
        pipelineStages.push({ $match: textSearchStage });
      }
    }

    // Step 7: Add any additional custom stages
    if (options?.additionalStages) {
      pipelineStages.push(...options.additionalStages);
    }

    // Execute the aggregation with pagination
    return this.getPaginatedAggregation<TResult>(pipelineStages, paginated);
  }

  /**
   * Separates root fields, nested fields, and OR conditions from the filter object
   */
  private separateFilters(filters: any): {
    rootFilters: any;
    nestedFilters: any;
    orConditions: any[];
  } {
    const rootFilters: any = {};
    const nestedFilters: any = {};
    const orConditions: any[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (key === '$or' && Array.isArray(value)) {
        orConditions.push(...value);
      } else if (key.includes('.')) {
        nestedFilters[key] = value;
      } else {
        rootFilters[key] = value;
      }
    }

    return { rootFilters, nestedFilters, orConditions };
  }

  /**
   * Extracts nested field information from filter keys
   */
  private extractNestedFieldsInfo(nestedFilters: any): NestedFieldInfo[] {
    const nestedFields: NestedFieldInfo[] = [];

    for (const key of Object.keys(nestedFilters)) {
      if (key.includes('.')) {
        const [collection, ...fieldParts] = key.split('.');
        nestedFields.push({
          collection,
          field: fieldParts.join('.'),
          fullPath: key,
        });
      }
    }

    return nestedFields;
  }

  /**
   * Extracts nested fields from search fields array
   */
  private extractNestedFieldsFromSearch(searchFields: string[]): NestedFieldInfo[] {
    const nestedFields: NestedFieldInfo[] = [];

    for (const field of searchFields) {
      if (field.includes('.')) {
        const [collection, ...fieldParts] = field.split('.');
        nestedFields.push({
          collection,
          field: fieldParts.join('.'),
          fullPath: field,
        });
      }
    }

    return nestedFields;
  }

  /**
   * Generates MongoDB $lookup stages for related collections
   */
  private generateLookupStages(
    nestedFields: NestedFieldInfo[],
    customLookups?: LookupConfig[],
  ): any[] {
    const stages: any[] = [];
    const processedCollections = new Set<string>();

    // Add custom lookups first
    if (customLookups) {
      for (const lookup of customLookups) {
        const lookupStage: any = {
          $lookup: {
            from: lookup.from,
            as: lookup.as,
          },
        };

        if (lookup.localField && lookup.foreignField) {
          lookupStage.$lookup.localField = lookup.localField;
          lookupStage.$lookup.foreignField = lookup.foreignField;
        } else {
          // Use let/pipeline for more complex lookups (like ID type conversion)
          lookupStage.$lookup.let = { localId: { $toString: '$_id' } };
          lookupStage.$lookup.pipeline = [
            { $match: { $expr: { $eq: [`$${lookup.foreignField || 'payment_tracker_id'}`, '$$localId'] } } },
          ];
        }

        stages.push(lookupStage);

        if (lookup.unwind !== false) {
          stages.push({
            $addFields: {
              [lookup.as]: { $arrayElemAt: [`$${lookup.as}`, 0] },
            },
          });
        }

        processedCollections.add(lookup.as);
      }
    }

    // Auto-generate lookups for nested fields
    const uniqueCollections = [...new Set(nestedFields.map(f => f.collection))];

    for (const collection of uniqueCollections) {
      if (!processedCollections.has(collection)) {
        // Infer the collection name (pluralize if needed)
        const collectionName = this.inferCollectionName(collection);

        stages.push({
          $lookup: {
            from: collectionName,
            let: { localId: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [`$${this.inferForeignField(collection)}`, '$$localId'],
                  },
                },
              },
            ],
            as: collection,
          },
        });

        // Unwind to single object
        stages.push({
          $addFields: {
            [collection]: { $arrayElemAt: [`$${collection}`, 0] },
          },
        });
      }
    }

    return stages;
  }

  /**
   * Infers the MongoDB collection name from the alias
   */
  private inferCollectionName(alias: string): string {
    // Map common aliases to collection names
    const collectionMap: Record<string, string> = {
      invoice: 'invoices',
      user: 'users',
      payment: 'payments',
      // Add more mappings as needed
    };

    return collectionMap[alias] || `${alias}s`;
  }

  /**
   * Infers the foreign field for lookup based on collection
   */
  private inferForeignField(collection: string): string {
    // Map collection to foreign field
    const fieldMap: Record<string, string> = {
      invoice: 'payment_tracker_id',
      // Add more mappings as needed
    };

    return fieldMap[collection] || `${this.model.modelName.toLowerCase()}_id`;
  }

  /**
   * Builds a match stage for nested field filters
   */
  private buildNestedMatchStage(nestedFilters: any): any {
    const matchStage: any = {};

    for (const [fullPath, condition] of Object.entries(nestedFilters)) {
      if (condition === undefined || condition === '') {
        continue;
      }

      // Handle direct value assignment
      if (
        condition === null ||
        typeof condition === 'string' ||
        typeof condition === 'number' ||
        typeof condition === 'boolean' ||
        condition instanceof Date ||
        Array.isArray(condition)
      ) {
        matchStage[fullPath] = Array.isArray(condition) ? { $in: condition } : condition;
        continue;
      }

      // Handle SimpleFilter object
      if (typeof condition === 'object' && !Array.isArray(condition)) {
        const filterCondition = this.convertNestedFilter(fullPath, condition as any);
        Object.assign(matchStage, filterCondition);
      }
    }

    return matchStage;
  }

  /**
   * Converts a nested field filter to MongoDB syntax
   */
  private convertNestedFilter(fieldPath: string, filter: any): any {
    // Reuse FilterBuilder logic but with the full nested path
    const tempFilters = { [fieldPath]: filter };
    const pipeline = FilterBuilder.buildPipeline(tempFilters);

    if (pipeline.length > 0 && pipeline[0].$match) {
      return pipeline[0].$match;
    }

    return {};
  }

  /**
   * Builds an OR condition stage
   */
  private buildOrConditionStage(orConditions: any[]): any {
    if (!orConditions || orConditions.length === 0) {
      return null;
    }

    const orClauses: any[] = [];

    for (const condition of orConditions) {
      // Each condition can be a simple filter object
      const pipeline = FilterBuilder.buildPipeline(condition);
      if (pipeline.length > 0 && pipeline[0].$match) {
        // Extract just the match conditions
        const matchConditions = pipeline[0].$match;
        orClauses.push(matchConditions);
      }
    }

    if (orClauses.length > 0) {
      return { $match: { $or: orClauses } };
    }

    return null;
  }

  /**
   * Builds enhanced text search that supports nested fields
   */
  private buildEnhancedTextSearch(searchText: string, fields: string[]): any {
    if (!searchText || !fields || fields.length === 0) {
      return {};
    }

    const searchRegex = new RegExp(searchText.trim(), 'i');
    const orConditions = fields.map(field => ({ [field]: searchRegex }));

    return { $or: orConditions };
  }
}
