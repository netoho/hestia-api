/**
 * Reference Entities
 * Represents personal and commercial references for actors
 */

/**
 * Personal Reference
 * Used by individuals (tenants, joint obligors, avals)
 */
export interface PersonalReference {
  id: string;

  // Reference Information
  name: string;
  phone: string;
  homePhone?: string;
  cellPhone?: string;
  email?: string;
  relationship: string;         // friend, family, colleague, etc.
  occupation?: string;
  address?: string;              // Optional address

  // Owner Information (polymorphic - only one will be set)
  tenantId?: string;
  jointObligorId?: string;
  avalId?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Commercial Reference
 * Used by companies or for business relationships
 */
export interface CommercialReference {
  id: string;

  // Company Information
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  relationship: string;          // supplier, client, partner, etc.
  yearsOfRelationship?: number;

  // Owner Information (polymorphic - only one will be set)
  tenantId?: string;
  jointObligorId?: string;
  avalId?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reference relationship types
 */
export enum ReferenceRelationshipType {
  // Personal
  FAMILY = 'FAMILY',
  FRIEND = 'FRIEND',
  COLLEAGUE = 'COLLEAGUE',
  NEIGHBOR = 'NEIGHBOR',

  // Commercial
  SUPPLIER = 'SUPPLIER',
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
  PROVIDER = 'PROVIDER',

  OTHER = 'OTHER'
}

/**
 * Reference validation requirements
 */
export interface ReferenceRequirements {
  minimumPersonal: number;       // Minimum personal references required
  minimumCommercial: number;     // Minimum commercial references required
  requireEmail: boolean;         // Whether email is mandatory
  requireAddress: boolean;       // Whether address is mandatory
}

/**
 * Reference collection for an actor
 */
export interface ActorReferences {
  personal: PersonalReference[];
  commercial: CommercialReference[];
}

/**
 * Create Reference Inputs
 */
export type CreatePersonalReference = Omit<PersonalReference, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateCommercialReference = Omit<CommercialReference, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update Reference Inputs
 */
export type UpdatePersonalReference = Partial<CreatePersonalReference>;
export type UpdateCommercialReference = Partial<CreateCommercialReference>;