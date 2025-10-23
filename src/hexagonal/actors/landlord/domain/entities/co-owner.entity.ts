/**
 * Co-owner Entity
 * Represents a property co-owner for landlords with shared ownership
 */

/**
 * Co-owner relationship types
 */
export enum CoOwnerRelationship {
  SPOUSE = 'spouse',
  PARTNER = 'partner',
  RELATIVE = 'relative',
  INVESTOR = 'investor',
  COMPANY = 'company',
  OTHER = 'other'
}

/**
 * Co-owner entity
 */
export interface CoOwner {
  id?: string;
  landlordId: string;

  // Personal information
  name: string;
  rfc?: string;  // Mexican tax ID (12-13 characters)
  curp?: string;  // Mexican unique ID (18 characters)

  // Ownership details
  ownershipPercentage: number;  // 1-100
  relationship?: CoOwnerRelationship | string;

  // Contact information
  contactPhone?: string;
  contactEmail?: string;

  // Legal information
  hasLegalPower?: boolean;  // Has power to sign/act
  legalPowerDocument?: string;  // Reference to document
  agreementDate?: Date;

  // Additional info
  notes?: string;
  isActive?: boolean;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Co-ownership agreement details
 */
export interface CoOwnershipAgreement {
  coOwners: CoOwner[];
  agreementType?: 'joint_tenancy' | 'tenancy_in_common' | 'community_property' | 'other';
  specialConditions?: string;
  totalOwnershipPercentage?: number;  // Should always equal 100
  lastModified?: Date;
  modifiedBy?: string;
}

/**
 * Co-ownership validation rules
 */
export const CoOwnershipValidationRules = {
  MAX_CO_OWNERS: 10,
  MIN_OWNERSHIP_PERCENTAGE: 1,
  MAX_OWNERSHIP_PERCENTAGE: 100,
  PRIMARY_LANDLORD_MIN_PERCENTAGE: 25,

  // Format patterns
  RFC_PATTERN: /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/,  // Mexican RFC format
  CURP_PATTERN: /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/,  // Mexican CURP format
  PHONE_PATTERN: /^(\+52)?[1-9]\d{9}$/,  // Mexican phone
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

/**
 * Validate RFC format
 */
export function isValidRFC(rfc: string): boolean {
  if (!rfc) return false;
  return CoOwnershipValidationRules.RFC_PATTERN.test(rfc.toUpperCase());
}

/**
 * Validate CURP format
 */
export function isValidCURP(curp: string): boolean {
  if (!curp) return false;
  return CoOwnershipValidationRules.CURP_PATTERN.test(curp.toUpperCase());
}

/**
 * Validate ownership percentages total 100%
 */
export function validateOwnershipTotals(
  primaryOwnerPercentage: number,
  coOwners: CoOwner[]
): { isValid: boolean; total: number; errors: string[] } {
  const errors: string[] = [];

  // Calculate total
  const coOwnersTotal = coOwners.reduce((sum, owner) => sum + (owner.ownershipPercentage || 0), 0);
  const total = primaryOwnerPercentage + coOwnersTotal;

  // Validate total equals 100
  if (total !== 100) {
    errors.push(`Total ownership must equal 100%, current total: ${total}%`);
  }

  // Validate primary landlord minimum
  if (primaryOwnerPercentage < CoOwnershipValidationRules.PRIMARY_LANDLORD_MIN_PERCENTAGE) {
    errors.push(`Primary landlord must have at least ${CoOwnershipValidationRules.PRIMARY_LANDLORD_MIN_PERCENTAGE}% ownership`);
  }

  // Validate each co-owner percentage
  coOwners.forEach((owner, index) => {
    if (owner.ownershipPercentage < CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE) {
      errors.push(`Co-owner ${owner.name || index + 1} must have at least ${CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE}% ownership`);
    }
    if (owner.ownershipPercentage > CoOwnershipValidationRules.MAX_OWNERSHIP_PERCENTAGE) {
      errors.push(`Co-owner ${owner.name || index + 1} cannot have more than ${CoOwnershipValidationRules.MAX_OWNERSHIP_PERCENTAGE}% ownership`);
    }
  });

  // Check max co-owners
  if (coOwners.length > CoOwnershipValidationRules.MAX_CO_OWNERS) {
    errors.push(`Maximum ${CoOwnershipValidationRules.MAX_CO_OWNERS} co-owners allowed`);
  }

  return {
    isValid: errors.length === 0,
    total,
    errors
  };
}

/**
 * Calculate ownership redistribution when a co-owner is removed
 */
export function redistributeOwnership(
  removedPercentage: number,
  remainingCoOwners: CoOwner[],
  strategy: 'proportional' | 'equal' = 'proportional'
): CoOwner[] {
  if (remainingCoOwners.length === 0) {
    return [];
  }

  if (strategy === 'equal') {
    // Distribute equally among remaining owners
    const additionalPercentage = removedPercentage / remainingCoOwners.length;
    return remainingCoOwners.map(owner => ({
      ...owner,
      ownershipPercentage: owner.ownershipPercentage + additionalPercentage
    }));
  } else {
    // Distribute proportionally based on current ownership
    const currentTotal = remainingCoOwners.reduce((sum, owner) => sum + owner.ownershipPercentage, 0);

    return remainingCoOwners.map(owner => {
      const proportion = owner.ownershipPercentage / currentTotal;
      const additionalPercentage = removedPercentage * proportion;
      return {
        ...owner,
        ownershipPercentage: owner.ownershipPercentage + additionalPercentage
      };
    });
  }
}

/**
 * Create a new co-owner with validation
 */
export function createCoOwner(data: Partial<CoOwner>): { isValid: boolean; coOwner?: CoOwner; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!data.name) {
    errors.push('Co-owner name is required');
  }

  if (!data.landlordId) {
    errors.push('Landlord ID is required');
  }

  if (!data.ownershipPercentage || data.ownershipPercentage < CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE) {
    errors.push('Valid ownership percentage is required');
  }

  // Validate RFC if provided
  if (data.rfc && !isValidRFC(data.rfc)) {
    errors.push('Invalid RFC format');
  }

  // Validate CURP if provided
  if (data.curp && !isValidCURP(data.curp)) {
    errors.push('Invalid CURP format');
  }

  // Validate email if provided
  if (data.contactEmail && !CoOwnershipValidationRules.EMAIL_PATTERN.test(data.contactEmail)) {
    errors.push('Invalid email format');
  }

  // Validate phone if provided
  if (data.contactPhone && !CoOwnershipValidationRules.PHONE_PATTERN.test(data.contactPhone)) {
    errors.push('Invalid phone number format');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const coOwner: CoOwner = {
    ...data,
    id: data.id || generateId(),
    landlordId: data.landlordId!,
    name: data.name!,
    ownershipPercentage: data.ownershipPercentage!,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return { isValid: true, coOwner, errors: [] };
}

/**
 * Generate a unique ID (placeholder - replace with actual ID generation)
 */
function generateId(): string {
  return `co_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}