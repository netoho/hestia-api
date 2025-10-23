/**
 * PropertyAddress Entity
 * Represents a physical address with Mexican address structure
 * Used by multiple actors and property details
 */

export interface PropertyAddress {
  id: string;

  // Street Information
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;

  // Location Information
  neighborhood: string;        // Colonia
  postalCode: string;
  municipality: string;         // Alcaldía/Municipio
  city: string;
  state: string;
  country: string;              // Default: México

  // Google Maps Integration
  placeId?: string;             // Google Places ID for validation
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;    // Full formatted address from Google

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address types for different contexts
 */
export enum AddressType {
  PERSONAL = 'PERSONAL',
  PROPERTY = 'PROPERTY',
  EMPLOYER = 'EMPLOYER',
  PREVIOUS_RENTAL = 'PREVIOUS_RENTAL',
  GUARANTEE_PROPERTY = 'GUARANTEE_PROPERTY',
  COMPANY = 'COMPANY'
}

/**
 * Create Address Input - for new addresses
 */
export type CreatePropertyAddress = Omit<PropertyAddress, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update Address Input - for partial updates
 */
export type UpdatePropertyAddress = Partial<CreatePropertyAddress>;