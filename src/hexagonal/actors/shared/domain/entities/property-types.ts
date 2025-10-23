/**
 * Shared property-related types and enums
 * Used across multiple actor modules
 */

/**
 * Type of property ownership
 */
export enum PropertyOwnershipType {
  SOLE = 'SOLE',
  CO_OWNERSHIP = 'CO_OWNERSHIP',
  CONDOMINIUM = 'CONDOMINIUM',
  EJIDAL = 'EJIDAL'
}

/**
 * Property usage type
 */
export enum PropertyUsageType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  MIXED = 'MIXED',
  INDUSTRIAL = 'INDUSTRIAL'
}

/**
 * Property status
 */
export enum PropertyStatus {
  OWNED = 'OWNED',
  MORTGAGED = 'MORTGAGED',
  INHERITED = 'INHERITED',
  LEASED = 'LEASED'
}

/**
 * Interface for property details
 */
export interface PropertyDetails {
  ownershipType: PropertyOwnershipType;
  usageType?: PropertyUsageType;
  status?: PropertyStatus;
  registryFolio?: string;
  deedNumber?: string;
  ownershipPercentage?: number;
  estimatedValue?: number;
}

/**
 * Interface for co-owner information
 */
export interface CoOwnerInfo {
  name: string;
  rfc?: string;
  curp?: string;
  percentage: number;
  relationship?: string;
}