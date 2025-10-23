/**
 * Tenant Entity
 * Represents a tenant (inquilino) in the system
 */

import { BaseActor, PersonActor, CompanyActor } from '../../../shared/domain/entities/base-actor.entity';
import { EmploymentStatus, TenantType } from '../../../shared/domain/entities/actor-types';

/**
 * Payment method preferences
 */
export enum TenantPaymentMethod {
  MONTHLY = 'MONTHLY',
  BIANNUAL = 'BIANNUAL',
  ANNUAL = 'ANNUAL',
  OTHER = 'OTHER'
}

/**
 * Employment information for tenants
 */
export interface TenantEmployment {
  employmentStatus?: EmploymentStatus | string;
  occupation?: string;
  employerName?: string;
  employerAddressId?: string;
  position?: string;
  monthlyIncome?: number;
  incomeSource?: string;
  workPhone?: string;
  workEmail?: string;
}

/**
 * Rental history information
 */
export interface RentalHistory {
  previousLandlordName?: string;
  previousLandlordPhone?: string;
  previousLandlordEmail?: string;
  previousRentAmount?: number;
  previousRentalAddressId?: string;
  rentalHistoryYears?: number;
  reasonForMoving?: string;
}

/**
 * Payment and fiscal preferences
 */
export interface TenantPaymentPreferences {
  paymentMethod?: TenantPaymentMethod | string;
  requiresCFDI: boolean;
  cfdiData?: {
    rfc: string;
    businessName: string;
    fiscalAddress: string;
    email: string;
    cfdiUse?: string;
  };
}

/**
 * Additional tenant information
 */
export interface TenantAdditionalInfo {
  numberOfOccupants?: number;
  hasPets?: boolean;
  petDescription?: string;
  hasVehicles?: boolean;
  vehicleDescription?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  specialRequirements?: string;
}

/**
 * Base Tenant interface
 */
export interface BaseTenant extends BaseActor {
  tenantType: TenantType;

  // Contact Information
  personalEmail?: string;

  // Address IDs
  addressId?: string; // Current address
  employerAddressId?: string;
  previousRentalAddressId?: string;

  // Employment
  employment?: TenantEmployment;

  // Rental History
  rentalHistory?: RentalHistory;

  // Payment Preferences
  paymentPreferences?: TenantPaymentPreferences;

  // Additional Info
  additionalTenantInfo?: TenantAdditionalInfo;

  // Computed fields
  isEmployed?: boolean;
  hasRentalHistory?: boolean;
  hasReferences?: boolean;
  hasCommercialReferences?: boolean;
  referenceCount?: number;
}

/**
 * Person Tenant interface
 */
export interface PersonTenant extends BaseTenant, PersonActor {
  tenantType: TenantType.INDIVIDUAL;
  isCompany: false;
}

/**
 * Company Tenant interface
 */
export interface CompanyTenant extends BaseTenant, CompanyActor {
  tenantType: TenantType.COMPANY;
  isCompany: true;

  // Company-specific fields
  businessType?: string;
  employeeCount?: number;
  yearsInBusiness?: number;
  companyAddressId?: string;
}

/**
 * Union type for all tenant types
 */
export type Tenant = PersonTenant | CompanyTenant;

/**
 * Type guards
 */
export function isPersonTenant(tenant: Tenant): tenant is PersonTenant {
  return tenant.tenantType === TenantType.INDIVIDUAL;
}

export function isCompanyTenant(tenant: Tenant): tenant is CompanyTenant {
  return tenant.tenantType === TenantType.COMPANY;
}

/**
 * Helper to check if tenant employment information is complete
 */
export function isEmploymentComplete(tenant: Tenant): boolean {
  if (!tenant.employment) return false;

  const emp = tenant.employment;

  // Basic requirements for all
  if (!emp.employmentStatus || !emp.occupation) return false;

  // If employed, need employer details
  if (emp.employmentStatus === EmploymentStatus.EMPLOYED) {
    return !!(emp.employerName && emp.monthlyIncome && emp.employerAddressId);
  }

  // Self-employed or other statuses need income info
  if (emp.employmentStatus === EmploymentStatus.SELF_EMPLOYED) {
    return !!(emp.monthlyIncome && emp.incomeSource);
  }

  return true;
}

/**
 * Helper to check if rental history is complete
 */
export function isRentalHistoryComplete(tenant: Tenant): boolean {
  if (!tenant.rentalHistory) return false;

  const history = tenant.rentalHistory;
  return !!(
    history.previousLandlordName &&
    history.previousLandlordPhone &&
    history.previousRentAmount &&
    history.previousRentalAddressId &&
    history.rentalHistoryYears
  );
}

/**
 * Helper to check if tenant information is complete for submission
 */
export function isTenantComplete(tenant: Tenant): boolean {
  // Basic information
  if (!tenant.email || !tenant.phone) return false;

  // Person-specific checks
  if (isPersonTenant(tenant)) {
    if (!tenant.fullName || !tenant.nationality) return false;
    if (!tenant.rfc && !tenant.curp) return false; // Need at least one ID
  }

  // Company-specific checks
  if (isCompanyTenant(tenant)) {
    if (!tenant.companyName || !tenant.companyRfc) return false;
    if (!tenant.legalRepName || !tenant.legalRepId) return false;
  }

  // Current address is required
  if (!tenant.addressId) return false;

  // Employment information is required
  if (!isEmploymentComplete(tenant)) return false;

  // References are required (checked via hasReferences flag)
  if (!tenant.hasReferences) return false;

  return true;
}
