# Developer-Friendly MongoDB Filtering

## Overview

We've created a simple, intuitive filtering system that doesn't require MongoDB knowledge. Instead of complex MongoDB operators, you can use plain, readable JavaScript objects.

### Two Repository Options

1. **BaseMongooseRepository**: Basic CRUD operations for simple use cases
2. **EnhancedMongooseRepository**: Advanced filtering with support for:
   - Nested field filtering (filter on related models)
   - OR conditions
   - Automatic lookup generation
   - Text search across related fields

## Quick Start

### Basic Usage

```typescript
// Instead of MongoDB syntax like this:
const results = await model.find({
  series: { $ne: null, $exists: true },
  amount: { $gt: 100 },
  status: { $in: ['active', 'pending'] }
});

// You can now write:
const results = await repository.getPaginatedWithFilters(
  {
    series: { notNull: true },
    amount: { gt: 100 },
    status: { in: ['active', 'pending'] }
  },
  { offset: 0, limit: 10 }
);
```

## Available Filter Operations

### Equality Checks
```typescript
{
  // Direct value (equals)
  status: 'active',

  // Explicit equals
  status: { equals: 'active' },

  // Not equals
  status: { notEquals: 'inactive' }
}
```

### Null/Existence Checks
```typescript
{
  // Check if field is null
  deletedAt: { isNull: true },

  // Check if field is not null
  series: { notNull: true },

  // Check if field exists
  metadata: { exists: true }
}
```

### Numeric Comparisons
```typescript
{
  // Greater than
  amount: { gt: 100 },

  // Greater than or equal
  amount: { gte: 100 },

  // Less than
  quantity: { lt: 10 },

  // Less than or equal
  quantity: { lte: 10 },

  // Between range (inclusive)
  amount: { between: { min: 100, max: 500 } }
}
```

### Array Operations
```typescript
{
  // Value in array
  status: { in: ['active', 'pending', 'validated'] },

  // Value not in array
  status: { notIn: ['rejected', 'cancelled'] }
}
```

### Text Search
```typescript
{
  // Contains text (case-insensitive)
  description: { contains: 'payment' },

  // Starts with text
  folio: { startsWith: 'PAY-' },

  // Ends with text
  email: { endsWith: '@example.com' }
}
```

### Date Ranges
```typescript
{
  // Date between range
  created_at: {
    between: {
      min: new Date('2024-01-01'),
      max: new Date('2024-12-31')
    }
  },

  // Date after
  updated_at: { gt: new Date('2024-06-01') }
}
```

## Real-World Examples

### Example 1: Get Payment Trackers with Series
```typescript
public async getPaymentTrackersWithSeries(paginated?: IQueryPagination<T>) {
  return await this.getPaginatedWithFilters(
    {
      series: { notNull: true }
    },
    paginated || { offset: 0, limit: 10 }
  );
}
```

### Example 2: Get Validated Payments in Date Range
```typescript
public async getValidatedPaymentsInRange(startDate: Date, endDate: Date) {
  return await this.getPaginatedWithFilters(
    {
      status: PaymentStatus.VALIDATED,
      validated_at: { between: { min: startDate, max: endDate } },
      total_amount: { gt: 0 }
    },
    { offset: 0, limit: 20 }
  );
}
```

### Example 3: Text Search Across Multiple Fields
```typescript
public async searchPayments(searchText: string) {
  return await this.getPaginatedWithFilters(
    {},  // No specific filters
    { offset: 0, limit: 10 },
    {
      searchText,
      searchFields: ['folio', 'description', 'user_full_name', 'gateway']
    }
  );
}
```

### Example 4: Filter by Multiple Status Values (Array)
```typescript
// Get all payments that are either PAID or INVOICED
public async getPaidOrInvoicedPayments(paginated?: IQueryPagination<T>) {
  return await this.getPaginatedWithFilters(
    {
      status: { in: ['PAID', 'INVOICED'] }
    },
    paginated || { offset: 0, limit: 10 }
  );
}

// Alternative: You can also pass an array directly (shorthand for 'in')
public async getPaidOrInvoicedPaymentsShorthand(paginated?: IQueryPagination<T>) {
  return await this.getPaginatedWithFilters(
    {
      status: ['PAID', 'INVOICED']  // Array is automatically treated as 'in'
    },
    paginated || { offset: 0, limit: 10 }
  );
}
```

### Example 5: Search in Related Collection (with Lookup)
```typescript
// Search for payments where the related invoice has RFC containing 'HUE'
public async searchPaymentsByInvoiceRFC(rfc: string, paginated?: IQueryPagination<T>) {
  return await this.getPaginatedWithFilters(
    {
      // Filter on main collection
      status: { notNull: true }
    },
    paginated || { offset: 0, limit: 10 },
    {
      // Add lookup and filter on related collection
      additionalStages: [
        // First, join with invoices collection
        {
          $lookup: {
            from: 'invoices',
            let: { paymentTrackerId: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$payment_tracker_id', '$$paymentTrackerId'] } } }
            ],
            as: 'invoice'
          }
        },
        // Flatten the invoice array
        {
          $addFields: {
            invoice: { $arrayElemAt: ['$invoice', 0] }
          }
        },
        // Filter by RFC in the joined invoice
        {
          $match: {
            'invoice.rfc': { $regex: rfc, $options: 'i' }
          }
        }
      ]
    }
  );
}

// More complete example with multiple invoice filters
public async searchPaymentsByInvoiceFields(
  filters: {
    rfc?: string;
    legalName?: string;
    invoiceStatus?: string;
  },
  paginated?: IQueryPagination<T>
) {
  const invoiceMatchConditions: any = {};

  if (filters.rfc) {
    invoiceMatchConditions['invoice.rfc'] = { $regex: filters.rfc, $options: 'i' };
  }
  if (filters.legalName) {
    invoiceMatchConditions['invoice.legal_name'] = { $regex: filters.legalName, $options: 'i' };
  }
  if (filters.invoiceStatus) {
    invoiceMatchConditions['invoice.status'] = filters.invoiceStatus;
  }

  return await this.getPaginatedWithFilters(
    {},  // No filters on main collection
    paginated || { offset: 0, limit: 10 },
    {
      additionalStages: [
        // Join with invoices
        {
          $lookup: {
            from: 'invoices',
            let: { paymentTrackerId: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$payment_tracker_id', '$$paymentTrackerId'] } } }
            ],
            as: 'invoice'
          }
        },
        // Flatten invoice
        {
          $addFields: {
            invoice: { $arrayElemAt: ['$invoice', 0] }
          }
        },
        // Apply invoice filters
        ...(Object.keys(invoiceMatchConditions).length > 0
          ? [{ $match: invoiceMatchConditions }]
          : [])
      ]
    }
  );
}
```

### Example 6: Date Range Filtering (Works Like Numbers)
```typescript
// Filter payments created in a specific date range
public async getPaymentsByDateRange(startDate: Date, endDate: Date) {
  return await this.getPaginatedWithFilters(
    {
      created_at: { between: { min: startDate, max: endDate } }
    },
    { offset: 0, limit: 10 }
  );
}

// Filter with multiple date conditions
public async getRecentlyValidatedPayments() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return await this.getPaginatedWithFilters(
    {
      // Validated in the last 30 days
      validated_at: { gte: thirtyDaysAgo },
      // But created more than 7 days ago
      created_at: { lt: sevenDaysAgo },
      status: PaymentStatus.VALIDATED
    },
    { offset: 0, limit: 10 }
  );
}

// Complex date filtering with multiple ranges
public async getPaymentsByMultipleDateCriteria() {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const endOfQ1 = new Date(new Date().getFullYear(), 2, 31);
  const startOfQ2 = new Date(new Date().getFullYear(), 3, 1);
  const now = new Date();

  return await this.getPaginatedWithFilters(
    {
      // Created in Q1
      created_at: { between: { min: startOfYear, max: endOfQ1 } },
      // Paid in Q2 or later
      paid_at: { gte: startOfQ2 },
      // Not yet invoiced (null check)
      invoiced_at: { isNull: true }
    },
    { offset: 0, limit: 10 }
  );
}
```

### Example 7: Filtering on Related Models (Nested Fields)

**New Feature**: Filter data based on fields in related collections using dot notation.

```typescript
// Example: Filter payment trackers by invoice status
public async getPaymentsByInvoiceStatus(
  invoiceStatuses: string[],
  paginated?: IQueryPagination<T>
) {
  return await this.getPaginatedWithFilters(
    {
      // Filter on main collection
      status: { in: ['PAID', 'INVOICED'] },

      // Filter on related invoice collection using dot notation
      'invoice.status': { notIn: ['CANCELLED', 'CANCELLED_BY_SYSTEM'] },
      'invoice.rfc': { contains: 'HUE' }
    },
    paginated || { offset: 0, limit: 10 }
  );
}
```

The system automatically:
1. Detects nested fields (those with dots)
2. Generates the appropriate `$lookup` for the 'invoice' collection
3. Applies the filters on the joined data

### Example 8: Using OR Conditions

**New Feature**: Combine multiple conditions with OR logic.

```typescript
// Example: Find payments created OR updated in a date range
public async getPaymentsByDateActivity(
  startDate: Date,
  endDate: Date,
  paginated?: IQueryPagination<T>
) {
  return await this.getPaginatedWithFilters(
    {
      status: 'VALIDATED',
      // OR condition: matches if either condition is true
      $or: [
        { created_at: { between: { min: startDate, max: endDate } } },
        { updated_at: { between: { min: startDate, max: endDate } } }
      ]
    },
    paginated || { offset: 0, limit: 10 }
  );
}

// Example: Complex OR with multiple field conditions
public async getHighPriorityPayments(paginated?: IQueryPagination<T>) {
  return await this.getPaginatedWithFilters(
    {
      $or: [
        { total_amount: { gt: 10000 } },           // High value
        { status: 'URGENT' },                      // Urgent status
        { created_at: { lt: new Date('2024-01-01') } }  // Old payments
      ]
    },
    paginated || { offset: 0, limit: 10 }
  );
}
```

### Example 9: Using combineFilters Helper

The `FilterBuilder.combineFilters()` method helps you compose complex filters programmatically:

```typescript
import { FilterBuilder } from '@Database/document-db/filter-builder';

// Example: Combine multiple filter objects
public async getFilteredPayments(
  userFilters: any,
  dateFilters: any,
  statusFilters: any,
  paginated?: IQueryPagination<T>
) {
  // Combine all filters into one
  const combinedFilters = FilterBuilder.combineFilters(
    userFilters,    // e.g., { user_id: 123 }
    dateFilters,    // e.g., { created_at: { gte: startDate } }
    statusFilters   // e.g., { status: { in: ['PAID', 'INVOICED'] } }
  );

  return await this.getPaginatedWithFilters(
    combinedFilters,
    paginated || { offset: 0, limit: 10 }
  );
}

// Example: Combining with OR conditions
public async getComplexFilteredPayments(
  baseFilters: any,
  startDate: Date,
  endDate: Date,
  paginated?: IQueryPagination<T>
) {
  const dateOrFilter = {
    $or: [
      { created_at: { between: { min: startDate, max: endDate } } },
      { updated_at: { between: { min: startDate, max: endDate } } },
      { validated_at: { between: { min: startDate, max: endDate } } }
    ]
  };

  // Combine base filters with OR conditions
  const combinedFilters = FilterBuilder.combineFilters(
    baseFilters,
    dateOrFilter
  );

  return await this.getPaginatedWithFilters(
    combinedFilters,
    paginated || { offset: 0, limit: 10 }
  );
}
```

### Example 10: Search Across Related Fields

Search text across fields in both the main collection and related collections:

```typescript
// Example: Search in both payment tracker and invoice fields
public async searchPaymentsWithInvoices(
  searchText: string,
  paginated?: IQueryPagination<T>
) {
  return await this.getPaginatedWithFilters(
    {
      status: { notNull: true }
    },
    paginated || { offset: 0, limit: 10 },
    {
      searchText,
      searchFields: [
        // Main collection fields
        'folio',
        'description',
        'user_full_name',
        'gateway',
        'bank_account_name',

        // Related collection fields (automatically triggers lookup)
        'invoice.rfc',
        'invoice.legal_name',
        'invoice.email'
      ]
    }
  );
}
```

### Example 11: Real-World Implementation - listInvoicedPaginated

Here's a complete real-world example from the PaymentTrackerRepository:

```typescript
public async listInvoicedPaginated(
  filters: Partial<PaymentTrackerFilterDTO>,
  paginated?: IQueryPagination<PaymentTrackerDocument>
): Promise<{ count: number; results: PaymentTrackerInvoiced[] }> {
  const enhancedFilters: any = {};

  // Basic filters on main collection
  if (filters.status?.length > 0) {
    enhancedFilters.status = filters.status;
  }

  // Filter on related invoice model
  if (filters.invoice_status?.length > 0) {
    enhancedFilters['invoice.status'] = { in: filters.invoice_status };
  }

  // Date range with OR (created_at OR updated_at)
  if (filters.start_date || filters.end_date) {
    const dateRange: any = {};
    if (filters.start_date) dateRange.min = new Date(filters.start_date);
    if (filters.end_date) dateRange.max = new Date(filters.end_date);

    enhancedFilters.$or = [
      { created_at: { between: dateRange } },
      { updated_at: { between: dateRange } }
    ];
  }

  const result = await this.getPaginatedWithFilters(
    enhancedFilters,
    paginated || { offset: 0, limit: 10 },
    {
      lookups: [{
        from: 'invoices',
        as: 'invoice',
        foreignField: 'payment_tracker_id',
        unwind: true
      }]
    }
  );

  return {
    count: result.count,
    results: result.results.map(doc => ({
      ...this.mapToEntity(doc),
      invoice: doc.invoice || null
    }))
  };
}
```

### Example 12: Combining All Techniques
```typescript
// Real-world complex query combining multiple techniques
public async getComplexFilteredPayments(
  searchText: string,
  startDate: Date,
  endDate: Date,
  minAmount: number,
  rfcPattern: string
) {
  return await this.getPaginatedWithFilters(
    {
      // Multiple status values
      status: { in: ['PAID', 'INVOICED', 'VALIDATED'] },

      // Date range
      created_at: { between: { min: startDate, max: endDate } },

      // Numeric comparison
      total_amount: { gte: minAmount },

      // Not null check
      series: { notNull: true }
    },
    { offset: 0, limit: 20 },
    {
      // Text search across fields
      searchText,
      searchFields: ['folio', 'description', 'user_full_name'],

      // Custom stages for related collection filtering
      additionalStages: [
        // Join with invoices
        {
          $lookup: {
            from: 'invoices',
            let: { paymentTrackerId: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$payment_tracker_id', '$$paymentTrackerId'] } } }
            ],
            as: 'invoice'
          }
        },
        // Flatten
        {
          $addFields: {
            invoice: { $arrayElemAt: ['$invoice', 0] }
          }
        },
        // Filter by RFC in related collection
        {
          $match: {
            'invoice.rfc': { $regex: rfcPattern, $options: 'i' }
          }
        }
      ]
    }
  );
}
```

## Migration Path

### Choosing the Right Repository

1. **BaseMongooseRepository**: Use for simple CRUD operations
   - Basic find, insert, update, delete
   - No complex filtering needed
   - No related model queries

2. **EnhancedMongooseRepository**: Use when you need:
   - Filtering on related models (nested fields)
   - OR conditions in queries
   - Text search across multiple collections
   - Developer-friendly filter syntax

### Gradual Migration

You can gradually migrate from complex MongoDB queries to simple filters:

1. **Start Simple**: Extend `EnhancedMongooseRepository` for new repositories
2. **Use Simple Syntax**: Replace MongoDB operators with SimpleFilter syntax
3. **Add Complexity**: Use nested fields and OR conditions as needed
4. **Full Power**: Use `getPaginatedAggregation` directly for very complex queries that don't fit the pattern

## Benefits

✅ **No MongoDB Syntax Knowledge Required** - Use intuitive JavaScript objects
✅ **Type-Safe** - Full TypeScript support with autocomplete
✅ **Readable** - Code is self-documenting
✅ **Performant** - Uses MongoDB aggregation with $facet for single-query pagination
✅ **Flexible** - Can combine with custom MongoDB stages when needed
✅ **Gradual Adoption** - Works alongside existing code

## When to Use What

### Repository Choice
- **BaseMongooseRepository**: Basic CRUD without complex filtering
- **EnhancedMongooseRepository**: Advanced filtering with related models

### Method Choice (in EnhancedMongooseRepository)
- **getPaginatedWithFilters**: For 90% of queries including:
  - Simple and complex conditions
  - Nested field filtering
  - OR conditions
  - Text search across collections
- **getPaginatedAggregation**: For very complex aggregations with:
  - Custom grouping
  - Multiple complex lookups
  - Advanced MongoDB operations not covered by SimpleFilter

## Technical Details

Under the hood, the `FilterBuilder` class converts your simple filters into MongoDB aggregation pipeline stages. The conversion is optimized and produces efficient MongoDB queries.

The pagination uses MongoDB's `$facet` stage to get both count and data in a single query, which is more efficient than making two separate queries.
