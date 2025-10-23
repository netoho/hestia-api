/**
 * JointObligor Domain Entity
 * Represents a flexible guarantor that can use either income or property as guarantee
 */

import { BaseActor, PersonActor, CompanyActor } from '../../../shared/domain/entities/base-actor.entity';
import { PropertyAddress } from '../../../../core/domain/entities/address.entity';
import { PersonalReference, CommercialReference } from '../../../../core/domain/entities/reference.entity';
import { ActorDocument } from '../../../../core/domain/entities/document.entity';
import { EmploymentStatus, MaritalStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';

/**
 * Guarantee Method Types
 */
export type GuaranteeMethod = 'income' | 'property';

/**
 * Property Guarantee Information
 * OPTIONAL for JointObligor - only required if guaranteeMethod is 'property'
 */
export interface PropertyGuaranteeInfo {
  hasPropertyGuarantee: boolean; // Can be false for JointObligor (unlike Aval)
  propertyValue?: number;
  propertyDeedNumber?: string;
  propertyRegistry?: string;
  propertyTaxAccount?: string;
  propertyUnderLegalProceeding: boolean;
  propertyAddress?: string; // Legacy string format
  guaranteePropertyAddressId?: string; // Structured address (required if property method)
  guaranteePropertyDetails?: PropertyAddress;
}

/**
 * Income Guarantee Information
 * Required if guaranteeMethod is 'income'
 */
export interface IncomeGuaranteeInfo {
  monthlyIncome?: number;
  incomeSource?: string;
  bankName?: string;
  accountHolder?: string;
  hasProperties: boolean; // Additional properties as backing
}

/**
 * Marriage Information for Property Co-ownership
 * Only relevant if property guarantee is chosen
 */
export interface JointObligorMarriage {
  maritalStatus?: MaritalStatus;
  spouseName?: string;
  spouseRfc?: string; // 12-13 chars
  spouseCurp?: string; // 18 chars
}

/**
 * Employment Information for JointObligor
 */
export interface JointObligorEmployment {
  employmentStatus?: EmploymentStatus;
  occupation?: string;
  employerName?: string;
  position?: string;
  monthlyIncome?: number;
  incomeSource?: string;
  employerAddress?: string; // Legacy string format
  employerAddressId?: string; // Structured address
  employerAddressDetails?: PropertyAddress;
}

/**
 * Person JointObligor Entity
 * Individual person acting as guarantor with flexible guarantee method
 */
export interface PersonJointObligor extends PersonActor, PropertyGuaranteeInfo, IncomeGuaranteeInfo, JointObligorMarriage, JointObligorEmployment {
  relationshipToTenant: string; // Required - relationship to the tenant
  guaranteeMethod?: GuaranteeMethod; // 'income' or 'property'

  // Three potential address types
  addressId?: string; // Current residence
  addressDetails?: PropertyAddress;

  // Employer address (relevant for income guarantee)
  employerAddressId?: string;
  employerAddressDetails?: PropertyAddress;

  // Property guarantee address (only if property method)
  guaranteePropertyAddressId?: string;
  guaranteePropertyDetails?: PropertyAddress;

  // References
  references?: PersonalReference[]; // 3 required for submission

  // Documents
  documents?: ActorDocument[];
}

/**
 * Company JointObligor Entity
 * Company acting as guarantor with flexible guarantee method
 */
export interface CompanyJointObligor extends CompanyActor, PropertyGuaranteeInfo, IncomeGuaranteeInfo {
  relationshipToTenant: string; // Required - relationship to the tenant
  guaranteeMethod?: GuaranteeMethod; // 'income' or 'property'

  // Two address types for companies
  addressId?: string; // Company address
  addressDetails?: PropertyAddress;

  // Property guarantee address (only if property method)
  guaranteePropertyAddressId?: string;
  guaranteePropertyDetails?: PropertyAddress;

  // References
  commercialReferences?: CommercialReference[]; // Required for companies

  // Documents
  documents?: ActorDocument[];
}

/**
 * JointObligor Entity
 * Union type that can be either a person or company joint obligor
 */
export type JointObligor = PersonJointObligor | CompanyJointObligor;

/**
 * Type guards for JointObligor entity
 */
export function isPersonJointObligor(jo: JointObligor): jo is PersonJointObligor {
  return !jo.isCompany;
}

export function isCompanyJointObligor(jo: JointObligor): jo is CompanyJointObligor {
  return jo.isCompany === true;
}

/**
 * Check if JointObligor uses property guarantee
 */
export function usesPropertyGuarantee(jo: JointObligor): boolean {
  return jo.guaranteeMethod === 'property' || jo.hasPropertyGuarantee === true;
}

/**
 * Check if JointObligor uses income guarantee
 */
export function usesIncomeGuarantee(jo: JointObligor): boolean {
  return jo.guaranteeMethod === 'income' && !jo.hasPropertyGuarantee;
}

/**
 * Helper functions for JointObligor entity
 */
export function isJointObligorComplete(jo: JointObligor): boolean {
  // Basic information
  if (!jo.email || !jo.phone) return false;
  if (!jo.relationshipToTenant) return false;
  if (!jo.guaranteeMethod) return false;

  // Check guarantee method requirements
  if (usesPropertyGuarantee(jo)) {
    // Property guarantee requirements
    if (!jo.propertyValue || !jo.propertyDeedNumber || !jo.guaranteePropertyAddressId) {
      return false;
    }
  } else if (usesIncomeGuarantee(jo)) {
    // Income guarantee requirements
    if (!jo.monthlyIncome || !jo.incomeSource) {
      return false;
    }
  }

  if (isPersonJointObligor(jo)) {
    // Person-specific validation
    if (!jo.fullName) return false;

    // Check nationality-based ID requirements
    if (jo.nationality === 'MEXICAN' && !jo.curp) return false;
    if (jo.nationality === 'FOREIGN' && !jo.passport) return false;

    // Check if has at least one reference
    if (!jo.references || jo.references.length === 0) return false;

  } else if (isCompanyJointObligor(jo)) {
    // Company-specific validation
    if (!jo.companyName || !jo.companyRfc) return false;
    if (!jo.legalRepName || !jo.legalRepEmail || !jo.legalRepPhone) return false;

    // Check if has at least one commercial reference
    if (!jo.commercialReferences || jo.commercialReferences.length === 0) return false;
  }

  return true;
}

/**
 * Check if JointObligor has valid guarantee (either type)
 */
export function hasValidGuarantee(jo: JointObligor): boolean {
  if (usesPropertyGuarantee(jo)) {
    return !!(
      jo.propertyValue &&
      jo.propertyValue > 0 &&
      jo.propertyDeedNumber &&
      jo.guaranteePropertyAddressId
    );
  } else if (usesIncomeGuarantee(jo)) {
    return !!(
      jo.monthlyIncome &&
      jo.monthlyIncome > 0 &&
      jo.incomeSource
    );
  }
  return false;
}

// requiresSpouseConsent is now imported from shared helper

/**
 * Calculate income-to-rent ratio for income guarantee
 */
export function getIncomeToRentRatio(jo: JointObligor, monthlyRent: number): number | null {
  if (!usesIncomeGuarantee(jo)) return null;
  if (!jo.monthlyIncome || monthlyRent <= 0) return null;

  return jo.monthlyIncome / monthlyRent;
}

/**
 * Get JointObligor completion percentage
 */
export function getJointObligorCompletionPercentage(jo: JointObligor): number {
  let completed = 0;
  let total = 0;

  // Basic information (25%)
  total += 4;
  if (jo.email) completed++;
  if (jo.phone) completed++;
  if (jo.relationshipToTenant) completed++;
  if (jo.guaranteeMethod) completed++;

  // Guarantee information (40%)
  if (usesPropertyGuarantee(jo)) {
    total += 4;
    if (jo.propertyValue) completed++;
    if (jo.propertyDeedNumber) completed++;
    if (jo.guaranteePropertyAddressId) completed++;
    if (jo.propertyRegistry || jo.propertyTaxAccount) completed++;
  } else if (usesIncomeGuarantee(jo)) {
    total += 4;
    if (jo.monthlyIncome) completed++;
    if (jo.incomeSource) completed++;
    if (jo.bankName) completed++;
    if (jo.employerAddressId) completed++;
  }

  if (isPersonJointObligor(jo)) {
    // Person-specific fields (25%)
    total += 5;
    if (jo.fullName) completed++;
    if (jo.curp || jo.passport) completed++;
    if (jo.addressId) completed++;
    if (jo.employmentStatus) completed++;
    if (jo.occupation) completed++;

    // References (10%)
    total += 1;
    if (jo.references && jo.references.length >= 3) completed++;

  } else if (isCompanyJointObligor(jo)) {
    // Company-specific fields (25%)
    total += 4;
    if (jo.companyName) completed++;
    if (jo.companyRfc) completed++;
    if (jo.legalRepName) completed++;
    if (jo.addressId) completed++;

    // References (10%)
    total += 1;
    if (jo.commercialReferences && jo.commercialReferences.length > 0) completed++;
  }

  return Math.round((completed / total) * 100);
}

/**
 * JointObligor validation errors
 */
export interface JointObligorValidationError {
  field: string;
  message: string;
  code: 'REQUIRED' | 'INVALID_FORMAT' | 'BUSINESS_RULE' | 'INSUFFICIENT';
}

/**
 * Validate JointObligor for submission
 */
export function validateJointObligorForSubmission(jo: JointObligor): JointObligorValidationError[] {
  const errors: JointObligorValidationError[] = [];

  // Basic validation
  if (!jo.email) {
    errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
  }
  if (!jo.phone) {
    errors.push({ field: 'phone', message: 'Phone is required', code: 'REQUIRED' });
  }
  if (!jo.relationshipToTenant) {
    errors.push({ field: 'relationshipToTenant', message: 'Relationship to tenant is required', code: 'REQUIRED' });
  }
  if (!jo.guaranteeMethod) {
    errors.push({ field: 'guaranteeMethod', message: 'Guarantee method must be selected', code: 'REQUIRED' });
  }

  // Guarantee method specific validation
  if (jo.guaranteeMethod === 'property') {
    if (!jo.propertyValue || jo.propertyValue <= 0) {
      errors.push({ field: 'propertyValue', message: 'Valid property value is required', code: 'REQUIRED' });
    }
    if (!jo.propertyDeedNumber) {
      errors.push({ field: 'propertyDeedNumber', message: 'Property deed number is required', code: 'REQUIRED' });
    }
    if (!jo.guaranteePropertyAddressId) {
      errors.push({ field: 'guaranteePropertyAddress', message: 'Property address is required', code: 'REQUIRED' });
    }
  } else if (jo.guaranteeMethod === 'income') {
    if (!jo.monthlyIncome || jo.monthlyIncome <= 0) {
      errors.push({ field: 'monthlyIncome', message: 'Monthly income is required', code: 'REQUIRED' });
    }
    if (!jo.incomeSource) {
      errors.push({ field: 'incomeSource', message: 'Income source is required', code: 'REQUIRED' });
    }
    // Check income ratio (typically should be 3x rent minimum)
    // This would need the rent amount passed in to validate
  }

  // Type-specific validation
  if (isPersonJointObligor(jo)) {
    if (!jo.fullName) {
      errors.push({ field: 'fullName', message: 'Full name is required', code: 'REQUIRED' });
    }
    if (jo.nationality === 'MEXICAN' && !jo.curp) {
      errors.push({ field: 'curp', message: 'CURP is required for Mexican nationals', code: 'REQUIRED' });
    }
    if (jo.nationality === 'FOREIGN' && !jo.passport) {
      errors.push({ field: 'passport', message: 'Passport is required for foreign nationals', code: 'REQUIRED' });
    }
    if (!jo.references || jo.references.length < 3) {
      errors.push({ field: 'references', message: 'At least 3 personal references are required', code: 'BUSINESS_RULE' });
    }
  } else if (isCompanyJointObligor(jo)) {
    if (!jo.companyName) {
      errors.push({ field: 'companyName', message: 'Company name is required', code: 'REQUIRED' });
    }
    if (!jo.companyRfc) {
      errors.push({ field: 'companyRfc', message: 'Company RFC is required', code: 'REQUIRED' });
    }
    if (!jo.legalRepName) {
      errors.push({ field: 'legalRepName', message: 'Legal representative name is required', code: 'REQUIRED' });
    }
    if (!jo.commercialReferences || jo.commercialReferences.length === 0) {
      errors.push({ field: 'commercialReferences', message: 'At least one commercial reference is required', code: 'BUSINESS_RULE' });
    }
  }

  return errors;
}
