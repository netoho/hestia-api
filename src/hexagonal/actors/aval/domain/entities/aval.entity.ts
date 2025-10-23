/**
 * Aval Domain Entity
 * Represents a property-backed guarantor in the rental protection system
 */

import { BaseActor, PersonActor, CompanyActor } from '../../../shared/domain/entities/base-actor.entity';
import { PropertyAddress } from '../../../../core/domain/entities/address.entity';
import { PersonalReference, CommercialReference } from '../../../../core/domain/entities/reference.entity';
import { ActorDocument } from '../../../../core/domain/entities/document.entity';
import {EmploymentStatus} from "../../../shared/domain";

/**
 * Property Guarantee Information
 * MANDATORY for all Avals - this is what distinguishes them from JointObligors
 */
export interface PropertyGuarantee {
  hasPropertyGuarantee: boolean; // Always true for Aval
  guaranteeMethod?: 'income' | 'property'; // Can be either, but property is mandatory
  propertyValue?: number; // Required for submission
  propertyDeedNumber?: string; // Required for submission
  propertyRegistry?: string; // Optional but recommended
  propertyTaxAccount?: string; // Optional but recommended
  propertyUnderLegalProceeding: boolean; // Default false
  propertyAddress?: string; // Legacy string format
  guaranteePropertyAddressId?: string; // Structured address (MANDATORY)
  guaranteePropertyDetails?: PropertyAddress; // Structured address entity
}

/**
 * Marriage Information for Property Co-ownership
 */
export interface MarriageInformation {
  maritalStatus?: 'single' | 'married_joint' | 'married_separate' | 'divorced' | 'widowed';
  spouseName?: string;
  spouseRfc?: string; // 12-13 chars
  spouseCurp?: string; // 18 chars
}

/**
 * Employment Information for Individual Avals
 */
export interface AvalEmployment {
  employmentStatus?: EmploymentStatus
  occupation?: string;
  employerName?: string;
  position?: string;
  monthlyIncome?: number;
  incomeSource?: string;
  employerAddress?: string; // Legacy string format
  employerAddressId?: string; // Structured address
  employerAddressDetails?: PropertyAddress; // Structured address entity
}

/**
 * Person Aval Entity
 * Individual person acting as property guarantor
 */
export interface PersonAval extends PersonActor, PropertyGuarantee, MarriageInformation, AvalEmployment {
  relationshipToTenant?: string; // Required - relationship to the tenant

  // Three address types
  addressId?: string; // Current residence
  addressDetails?: PropertyAddress;

  // Employer address (optional for individuals)
  employerAddressId?: string;
  employerAddressDetails?: PropertyAddress;

  // Property guarantee address (MANDATORY)
  guaranteePropertyAddressId?: string;
  guaranteePropertyDetails?: PropertyAddress;

  // References
  references?: PersonalReference[]; // 3 required for submission

  // Documents
  documents?: ActorDocument[];
}

/**
 * Company Aval Entity
 * Company acting as property guarantor
 */
export interface CompanyAval extends CompanyActor, PropertyGuarantee {
  relationshipToTenant?: string; // Required - relationship to the tenant

  // Two address types for companies
  addressId?: string; // Company address
  addressDetails?: PropertyAddress;

  // Property guarantee address (MANDATORY)
  guaranteePropertyAddressId?: string;
  guaranteePropertyDetails?: PropertyAddress;

  // References
  commercialReferences?: CommercialReference[]; // Required for companies

  // Documents
  documents?: ActorDocument[];
}

/**
 * Aval Entity
 * Union type that can be either a person or company aval
 */
export type Aval = PersonAval | CompanyAval;

/**
 * Type guards for Aval entity
 */
export function isPersonAval(aval: Aval): aval is PersonAval {
  return !aval.isCompany;
}

export function isCompanyAval(aval: Aval): aval is CompanyAval {
  return aval.isCompany === true;
}

/**
 * Helper functions for Aval entity
 */
export function isAvalComplete(aval: Aval): boolean {
  // Basic information
  if (!aval.email || !aval.phone) return false;
  if (!aval.relationshipToTenant) return false;

  // Property guarantee is MANDATORY
  if (!aval.propertyValue || !aval.propertyDeedNumber || !aval.guaranteePropertyAddressId) {
    return false;
  }

  if (isPersonAval(aval)) {
    // Person-specific validation
    if (!aval.fullName) return false;

    // Check nationality-based ID requirements
    if (aval.nationality === 'MEXICAN' && !aval.curp) return false;
    if (aval.nationality === 'FOREIGN' && !aval.passport) return false;

    // Check if has at least one reference
    if (!aval.references || aval.references.length === 0) return false;

  } else if (isCompanyAval(aval)) {
    // Company-specific validation
    if (!aval.companyName || !aval.companyRfc) return false;
    if (!aval.legalRepName || !aval.legalRepEmail || !aval.legalRepPhone) return false;

    // Check if has at least one commercial reference
    if (!aval.commercialReferences || aval.commercialReferences.length === 0) return false;
  }

  return true;
}

/**
 * Check if Aval has valid property guarantee
 */
export function hasValidPropertyGuarantee(aval: Aval): boolean {
  return !!(
    aval.hasPropertyGuarantee &&
    aval.propertyValue &&
    aval.propertyValue > 0 &&
    aval.propertyDeedNumber &&
    aval.guaranteePropertyAddressId
  );
}

// requiresSpouseConsent is now imported from shared helper

/**
 * Get Aval completion percentage
 */
export function getAvalCompletionPercentage(aval: Aval): number {
  let completed = 0;
  let total = 0;

  // Basic information (30%)
  total += 3;
  if (aval.email) completed++;
  if (aval.phone) completed++;
  if (aval.relationshipToTenant) completed++;

  // Property guarantee (40%) - MANDATORY
  total += 4;
  if (aval.propertyValue) completed++;
  if (aval.propertyDeedNumber) completed++;
  if (aval.guaranteePropertyAddressId) completed++;
  if (aval.propertyRegistry || aval.propertyTaxAccount) completed++;

  if (isPersonAval(aval)) {
    // Person-specific fields (20%)
    total += 4;
    if (aval.fullName) completed++;
    if (aval.curp || aval.passport) completed++;
    if (aval.addressId) completed++;
    if (aval.employmentStatus) completed++;

    // References (10%)
    total += 1;
    if (aval.references && aval.references.length >= 3) completed++;

  } else if (isCompanyAval(aval)) {
    // Company-specific fields (20%)
    total += 4;
    if (aval.companyName) completed++;
    if (aval.companyRfc) completed++;
    if (aval.legalRepName) completed++;
    if (aval.addressId) completed++;

    // References (10%)
    total += 1;
    if (aval.commercialReferences && aval.commercialReferences.length > 0) completed++;
  }

  return Math.round((completed / total) * 100);
}

/**
 * Aval validation errors
 */
export interface AvalValidationError {
  field: string;
  message: string;
  code: 'REQUIRED' | 'INVALID_FORMAT' | 'BUSINESS_RULE';
}

/**
 * Validate Aval for submission
 */
export function validateAvalForSubmission(aval: Aval): AvalValidationError[] {
  const errors: AvalValidationError[] = [];

  // Basic validation
  if (!aval.email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
  }
  if (!aval.phone) {
    errors.push({ field: 'phone', message: 'Phone is required', code: 'REQUIRED' });
  }
  if (!aval.relationshipToTenant) {
    errors.push({ field: 'relationshipToTenant', message: 'Relationship to tenant is required', code: 'REQUIRED' });
  }

  // Property guarantee validation (MANDATORY)
  if (!aval.hasPropertyGuarantee) {
    errors.push({ field: 'hasPropertyGuarantee', message: 'Property guarantee is mandatory for Aval', code: 'BUSINESS_RULE' });
  }
  if (!aval.propertyValue || aval.propertyValue <= 0) {
    errors.push({ field: 'propertyValue', message: 'Valid property value is required', code: 'REQUIRED' });
  }
  if (!aval.propertyDeedNumber) {
    errors.push({ field: 'propertyDeedNumber', message: 'Property deed number is required', code: 'REQUIRED' });
  }
  if (!aval.guaranteePropertyAddressId) {
    errors.push({ field: 'guaranteePropertyAddress', message: 'Property address is required', code: 'REQUIRED' });
  }

  // Type-specific validation
  if (isPersonAval(aval)) {
    if (!aval.fullName) {
      errors.push({ field: 'fullName', message: 'Full name is required', code: 'REQUIRED' });
    }
    if (aval.nationality === 'MEXICAN' && !aval.curp) {
      errors.push({ field: 'curp', message: 'CURP is required for Mexican nationals', code: 'REQUIRED' });
    }
    if (aval.nationality === 'FOREIGN' && !aval.passport) {
      errors.push({ field: 'passport', message: 'Passport is required for foreign nationals', code: 'REQUIRED' });
    }
    if (!aval.references || aval.references.length < 3) {
      errors.push({ field: 'references', message: 'At least 3 personal references are required', code: 'BUSINESS_RULE' });
    }
  } else if (isCompanyAval(aval)) {
    if (!aval.companyName) {
      errors.push({ field: 'companyName', message: 'Company name is required', code: 'REQUIRED' });
    }
    if (!aval.companyRfc) {
      errors.push({ field: 'companyRfc', message: 'Company RFC is required', code: 'REQUIRED' });
    }
    if (!aval.legalRepName) {
      errors.push({ field: 'legalRepName', message: 'Legal representative name is required', code: 'REQUIRED' });
    }
    if (!aval.commercialReferences || aval.commercialReferences.length === 0) {
      errors.push({ field: 'commercialReferences', message: 'At least one commercial reference is required', code: 'BUSINESS_RULE' });
    }
  }

  return errors;
}
