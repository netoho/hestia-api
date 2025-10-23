/**
 * Simple filter conditions that can be applied to a field
 * Designed to be developer-friendly without requiring MongoDB knowledge
 */
export interface SimpleFilter {
  /** Check if field equals a value */
  equals?: any;
  /** Check if field does not equal a value */
  notEquals?: any;
  /** Check if field is null */
  isNull?: boolean;
  /** Check if field is not null */
  notNull?: boolean;
  /** Check if field exists */
  exists?: boolean;
  /** Check if field is greater than a value */
  gt?: number | Date;
  /** Check if field is greater than or equal to a value */
  gte?: number | Date;
  /** Check if field is less than a value */
  lt?: number | Date;
  /** Check if field is less than or equal to a value */
  lte?: number | Date;
  /** Check if field value is in an array of values */
  in?: any[];
  /** Check if field value is not in an array of values */
  notIn?: any[];
  /** Check if string field contains text (case-insensitive) */
  contains?: string;
  /** Check if string field starts with text (case-insensitive) */
  startsWith?: string;
  /** Check if string field ends with text (case-insensitive) */
  endsWith?: string;
  /** Check if field value is between min and max (inclusive) */
  between?: { min: number | Date; max: number | Date };
}

/**
 * Simple filters object where keys are field names
 */
export type SimpleFilters<T = any> = {
  [K in keyof T]?: SimpleFilter | T[K];
};

/**
 * FilterBuilder converts simple, developer-friendly filter syntax
 * into MongoDB aggregation pipeline stages
 *
 * @example
 * ```typescript
 * // Simple usage without MongoDB knowledge:
 * const filters = {
 *   status: 'active',
 *   amount: { gt: 100 },
 *   description: { contains: 'payment' },
 *   series: { notNull: true }
 * };
 *
 * const pipeline = FilterBuilder.buildPipeline(filters);
 * // Returns: [{ $match: { status: 'active', amount: { $gt: 100 }, ... } }]
 * ```
 */
export class FilterBuilder {
  /**
   * Convert simple filters to MongoDB pipeline stages
   */
  public static buildPipeline<T = any>(filters: SimpleFilters<T>): any[] {
    if (!filters || Object.keys(filters).length === 0) {
      return [];
    }

    const matchStage = this.buildMatchStage(filters);
    if (Object.keys(matchStage).length === 0) {
      return [];
    }

    return [{ $match: matchStage }];
  }

  /**
   * Build a MongoDB $match stage from simple filters
   */
  private static buildMatchStage<T = any>(filters: SimpleFilters<T>): any {
      const matchStage: any = {};

      for (const [field, condition] of Object.entries(filters)) {
          if (condition === undefined || condition === '') {
              continue;
          }

          // Handle direct value assignment (shorthand for equals)
          if (
              condition === null ||
              typeof condition === 'string' ||
              typeof condition === 'number' ||
              typeof condition === 'boolean' ||
              condition instanceof Date
          ) {
              matchStage[field] = condition;
              continue;
          } else if (Array.isArray(condition)) {
              matchStage[field] = { $in: condition };
          }

          // Handle SimpleFilter object
          if (typeof condition === 'object' && !Array.isArray(condition)) {
              const filter = condition as SimpleFilter;
              const mongoCondition = this.convertSimpleFilter(field, filter);

              if (mongoCondition) {
                  // Merge conditions for the same field
                  if (matchStage[field] && typeof matchStage[field] === 'object') {
                      Object.assign(matchStage[field], mongoCondition[field]);
                  } else {
                      Object.assign(matchStage, mongoCondition);
                  }
              }
              console.warn(`Unsupported filter condition for field "${field}": ${JSON.stringify(condition)} , check convertSimpleFilter`);
          }
      }

      return matchStage;
  }

  /**
   * Convert a SimpleFilter to MongoDB query condition
   */
  private static convertSimpleFilter(field: string, filter: SimpleFilter): any {
      // Handle existence checks
      if (filter.isNull === true) {
          return { [field]: null };
      }
      if (filter.isNull === false) {
          return { [field]: { $ne: null, $exists: true } };
      }

      if (filter.notNull === true) {
          return { [field]: { $ne: null, $exists: true } };
      }
      if (filter.notNull === false) {
          return { [field]: null };
      }

      if (filter.exists === false) {
          return { [field]: { $exists: false } };
      }

      if (filter.exists === true) {
          return { [field]: { $exists: true } };
      }

      // Handle equality
      if (filter.equals !== undefined) {
          return { [field]: filter.equals };
      }

      if (filter.notEquals !== undefined) {
          return { [field]: { $ne: filter.notEquals } };
      }

      // Handle array operations
      if (filter.in !== undefined && Array.isArray(filter.in)) {
          return { [field]: { $in: filter.in } };
      }

      if (filter.notIn !== undefined && Array.isArray(filter.notIn)) {
          return { [field]: { $nin: filter.notIn } };
      }

      // Handle comparison operators
      const mongoField: any = {};

      if (filter.gt !== undefined) {
          mongoField.$gt = filter.gt;
      }

      if (filter.gte !== undefined) {
          mongoField.$gte = filter.gte;
      }

      if (filter.lt !== undefined) {
          mongoField.$lt = filter.lt;
      }

      if (filter.lte !== undefined) {
          mongoField.$lte = filter.lte;
      }

      // Handle between (range)
      if (filter.between !== undefined) {
          mongoField.$gte = filter.between.min;
          mongoField.$lte = filter.between.max;
      }

      // Handle text operations
      if (filter.contains !== undefined) {
          return { [field]: { $regex: filter.contains, $options: 'i' } };
      }

      if (filter.startsWith !== undefined) {
          return { [field]: { $regex: `^${filter.startsWith}`, $options: 'i' } };
      }

      if (filter.endsWith !== undefined) {
          return { [field]: { $regex: `${filter.endsWith}$`, $options: 'i' } };
      }

      // Return accumulated conditions
      if (Object.keys(mongoField).length > 0) {
          return { [field]: mongoField };
      }

      return null;
  }

  /**
   * Build text search conditions across multiple fields
   * @param searchText - Text to search for
   * @param fields - Array of field names to search in
   */
  public static buildTextSearch(searchText: string, fields: string[]): any {
    if (!searchText || !fields || fields.length === 0) {
      return {};
    }

    const searchRegex = new RegExp(searchText.trim(), 'i');
    const orConditions = fields.map((field) => ({ [field]: searchRegex }));

    return { $or: orConditions };
  }

  /**
   * Combine multiple filter stages with AND logic
   * @example
   * ```typescript
   * // Combine multiple conditions with AND
   * const filter1 = { status: 'active' };
   * const filter2 = { amount: { gt: 100 } };
   * const combined = FilterBuilder.combineFilters(filter1, filter2);
   * // Result: { status: 'active', amount: { $gt: 100 } }
   *
   * // Combine with OR conditions
   * const orFilter = {
   *   $or: [
   *     { created_at: { between: { min: startDate, max: endDate } } },
   *     { updated_at: { between: { min: startDate, max: endDate } } }
   *   ]
   * };
   * const combined = FilterBuilder.combineFilters(filter1, orFilter);
   * // Result will properly handle both AND and OR logic
   * ```
   */
  public static combineFilters(...filters: any[]): any {
    const combined: any = {};
    const orConditions: any[] = [];

    for (const filter of filters) {
      if (!filter || Object.keys(filter).length === 0) {
        continue;
      }

      // Handle $or conditions specially
      if (filter.$or) {
        orConditions.push(...filter.$or);
      } else {
        Object.assign(combined, filter);
      }
    }

    // Add OR conditions if present
    if (orConditions.length > 0) {
      combined.$or = orConditions;
    }

    return combined;
  }

  /**
   * Build an OR condition filter
   * @param conditions - Array of filter conditions to combine with OR
   * @example
   * ```typescript
   * const orFilter = FilterBuilder.buildOrFilter([
   *   { status: 'active' },
   *   { status: 'pending' },
   *   { priority: { gt: 5 } }
   * ]);
   * // Result: { $or: [{ status: 'active' }, { status: 'pending' }, { priority: { gt: 5 } }] }
   * ```
   */
  public static buildOrFilter(conditions: SimpleFilters[]): any {
    if (!conditions || conditions.length === 0) {
      return {};
    }

    return {
      $or: conditions,
    };
  }
}
