/**
 * Landlord Entity
 * Represents a property owner in the rental guarantee system
 */

import {
  BaseActor,
  PersonActor,
  CompanyActor,
  ActorWithBankInfo,
  ActorWithCfdi,
  CreateBaseActor,
  UpdateBaseActor
} from '@/hexagonal/actors/shared/domain/entities/base-actor.entity';
import { ActorType } from '@/hexagonal/actors/shared/domain/entities/actor-types';
import { CoOwner, CoOwnershipAgreement } from './co-owner.entity';

/**
 * Landlord-specific fields
 */
export interface LandlordSpecificFields {
  // Primary landlord flag (only one per policy)
  isPrimary: boolean;

  // Property ownership details
  propertyDeedNumber?: string;      // Número de escritura
  propertyRegistryFolio?: string;   // Folio del registro público

  // Additional landlord info
  propertyPercentageOwnership?: number;  // Percentage if multiple owners
  coOwnershipAgreement?: string;        // Agreement details if co-owned (JSON string)

  // Co-ownership management
  coOwners?: CoOwner[];                 // Array of co-owners
  totalOwnershipPercentage?: number;    // Total ownership (should be 100%)
  coOwnershipType?: string;             // Type of co-ownership arrangement
}

/**
 * Landlord Entity - combines all landlord attributes
 */
export interface Landlord extends BaseActor, ActorWithBankInfo, ActorWithCfdi, LandlordSpecificFields {
  actorType: ActorType.LANDLORD;

  // Address relation
  addressId?: string;
}

/**
 * Person Landlord - individual property owner
 */
export interface PersonLandlord extends Landlord, PersonActor {
  actorType: ActorType.LANDLORD;
  isCompany: false;
}

/**
 * Company Landlord - corporate property owner
 */
export interface CompanyLandlord extends Landlord, CompanyActor {
  actorType: ActorType.LANDLORD;
  isCompany: true;
}

/**
 * Create Landlord Input
 */
export type CreateLandlord = CreateBaseActor<Landlord> & {
  isPrimary?: boolean;  // Default to false if not specified
};

/**
 * Update Landlord Input
 */
export type UpdateLandlord = UpdateBaseActor<Landlord>;

/**
 * Landlord with relations loaded
 */
export interface LandlordWithRelations extends Landlord {
  addressDetails?: any;  // PropertyAddress from Prisma
  documents?: any[];     // ActorDocument[] from Prisma
  policy?: any;         // Policy relation
}

/**
 * Type guard for person landlord
 */
export function isPersonLandlord(landlord: Landlord): landlord is PersonLandlord {
  return !landlord.isCompany;
}

/**
 * Type guard for company landlord
 */
export function isCompanyLandlord(landlord: Landlord): landlord is CompanyLandlord {
  return landlord.isCompany;
}

/**
 * Landlord validation rules
 */
export const LandlordValidationRules = {
  // Required documents
  requiredDocuments: {
    person: ['INE_IFE', 'PROOF_OF_ADDRESS', 'PROPERTY_DEED'],
    company: ['CONSTITUTIVE_ACT', 'LEGAL_REP_ID', 'LEGAL_REP_POWER', 'PROPERTY_DEED', 'RFC_DOCUMENT']
  },

  // Property deed number format (example: "12345-2024")
  propertyDeedFormat: /^\d{1,10}(-\d{4})?$/,

  // Registry folio format (example: "F123456789")
  registryFolioFormat: /^[A-Z]?\d{1,10}$/,

  // Minimum references (landlords don't require references)
  minimumReferences: {
    personal: 0,
    commercial: 0
  },

  // Maximum landlords per policy
  maxLandlordsPerPolicy: 10,

  // Ownership percentage (if specified, must be between 0-100)
  ownershipPercentage: {
    min: 0,
    max: 100
  },

  // Co-ownership rules
  maxCoOwners: 10,
  minOwnershipPercentage: 1,
  primaryLandlordMinPercentage: 25
};

/**
 * Landlord submission requirements
 */
export interface LandlordSubmissionRequirements {
  hasBasicInfo: boolean;
  hasPropertyInfo: boolean;
  hasBankInfo: boolean;
  hasAddress: boolean;
  hasRequiredDocuments: boolean;
  hasCfdiInfo: boolean;  // Only if requiresCFDI is true
  hasValidOwnership: boolean;  // Co-ownership totals 100%
  missingFields: string[];
}

/**
 * Check if landlord has complete information
 */
export function isLandlordComplete(landlord: Landlord): LandlordSubmissionRequirements {
  const missingFields: string[] = [];

  // Basic info
  const hasBasicInfo = !!(
    landlord.email &&
    landlord.phone &&
    (landlord.isCompany
      ? (landlord as CompanyLandlord).companyName && (landlord as CompanyLandlord).companyRfc
      : (landlord as PersonLandlord).fullName)
  );

  if (!hasBasicInfo) {
    if (!landlord.email) missingFields.push('Email');
    if (!landlord.phone) missingFields.push('Phone');
    if (landlord.isCompany) {
      if (!(landlord as CompanyLandlord).companyName) missingFields.push('Company name');
      if (!(landlord as CompanyLandlord).companyRfc) missingFields.push('Company RFC');
    } else {
      if (!(landlord as PersonLandlord).fullName) missingFields.push('Full name');
    }
  }

  // Property info (at least deed number should be present)
  const hasPropertyInfo = !!landlord.propertyDeedNumber;
  if (!hasPropertyInfo) {
    missingFields.push('Property deed number');
  }

  // Bank info (required for receiving rent)
  const hasBankInfo = !!(
    landlord.bankName &&
    landlord.accountNumber &&
    landlord.clabe
  );

  if (!hasBankInfo) {
    if (!landlord.bankName) missingFields.push('Bank name');
    if (!landlord.accountNumber) missingFields.push('Account number');
    if (!landlord.clabe) missingFields.push('CLABE');
  }

  // Address
  const hasAddress = !!landlord.addressId;
  if (!hasAddress) {
    missingFields.push('Address');
  }

  // CFDI info (only required if requiresCFDI is true)
  const hasCfdiInfo = !landlord.requiresCFDI || !!landlord.cfdiData;
  if (!hasCfdiInfo) {
    missingFields.push('CFDI information');
  }

  // Documents (would need to be checked via service)
  const hasRequiredDocuments = false;  // This needs to be checked via document service

  // Validate ownership percentages if co-owners exist
  let hasValidOwnership = true;
  if (landlord.coOwners && landlord.coOwners.length > 0) {
    const coOwnersTotal = landlord.coOwners.reduce((sum, owner) => sum + (owner.ownershipPercentage || 0), 0);
    const primaryPercentage = landlord.propertyPercentageOwnership || 0;
    const totalPercentage = primaryPercentage + coOwnersTotal;

    if (totalPercentage !== 100) {
      hasValidOwnership = false;
      missingFields.push(`Ownership percentages (total: ${totalPercentage}%, should be 100%)`);
    }

    if (primaryPercentage < LandlordValidationRules.primaryLandlordMinPercentage) {
      hasValidOwnership = false;
      missingFields.push(`Primary landlord ownership (${primaryPercentage}%, minimum: ${LandlordValidationRules.primaryLandlordMinPercentage}%)`);
    }
  } else if (landlord.propertyPercentageOwnership && landlord.propertyPercentageOwnership !== 100) {
    // If no co-owners, ownership should be 100%
    hasValidOwnership = false;
    missingFields.push(`Ownership percentage (${landlord.propertyPercentageOwnership}%, should be 100% for sole owner)`);
  }

  return {
    hasBasicInfo,
    hasPropertyInfo,
    hasBankInfo,
    hasAddress,
    hasRequiredDocuments,
    hasCfdiInfo,
    hasValidOwnership,
    missingFields
  };
}
