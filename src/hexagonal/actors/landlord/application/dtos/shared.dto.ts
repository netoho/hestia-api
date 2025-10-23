/**
 * Property Ownership Details DTOs
 * Enhanced DTOs for property ownership with co-owners
 */

/**
 * Property ownership summary
 */
export class PropertyOwnershipSummaryDto {
  propertyDeedNumber?: string;
  propertyRegistryFolio?: string;
  ownershipType?: string;
  ownershipPercentage?: number;

  hasMultipleOwners: boolean;
  coOwnerCount: number;
  totalOwnershipPercentage: number;

  hasMortgage: boolean;
  hasRestrictions: boolean;
  canRent: boolean;

  isComplete: boolean;
  missingFields?: string[];
}
