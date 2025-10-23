/**
 * Actor Types and Enums
 * Shared types for all actor entities
 */

/**
 * Actor Types in the system
 */
export enum ActorType {
  LANDLORD = 'LANDLORD',
  TENANT = 'TENANT',
  JOINT_OBLIGOR = 'JOINT_OBLIGOR',
  AVAL = 'AVAL'
}

/**
 * Actor Verification Status
 */
export enum ActorVerificationStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_CHANGES = 'REQUIRES_CHANGES'
}

/**
 * Nationality Types
 */
export enum NationalityType {
  MEXICAN = 'MEXICAN',
  FOREIGN = 'FOREIGN'
}

/**
 * Tenant Type (specific to tenants)
 */
export enum TenantType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  COUPLE = 'COUPLE',
  ROOMMATES = 'ROOMMATES'
}

/**
 * Relationship Types for references
 */
export enum ReferenceRelationshipType {
  FAMILY = 'FAMILY',
  FRIEND = 'FRIEND',
  COLLEAGUE = 'COLLEAGUE',
  EMPLOYER = 'EMPLOYER',
  LANDLORD = 'LANDLORD',
  OTHER = 'OTHER'
}

/**
 * Payment Methods
 */
export enum PaymentMethod {
  MONTHLY = 'MONTHLY',
  BIANNUAL = 'BIANNUAL',
  ANNUAL = 'ANNUAL',
  OTHER = 'OTHER'
}

/**
 * Employment Status
 */
export enum EmploymentStatus {
  EMPLOYED = 'EMPLOYED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  UNEMPLOYED = 'UNEMPLOYED',
  RETIRED = 'RETIRED',
  STUDENT = 'STUDENT',
  OTHER = 'OTHER'
}

/**
 * Marital Status
 */
export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  MARRIED_JOINT = 'married_joint',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated',
  COMMON_LAW = 'common_law'
}

/**
 * Marital Regime
 */
export enum MarriageRegime {
  CONJUGAL_PARTNERSHIP = 'conjugal_partnership',
}

/**
 * Guarantee Method (for Joint Obligor)
 */
export enum GuaranteeMethod {
  INCOME = 'INCOME',           // Guarantees with income
  PROPERTY = 'PROPERTY',       // Guarantees with property
  BOTH = 'BOTH'               // Both income and property
}

/**
 * Common fields for person actors
 */
export interface PersonActorFields {
  // Personal Information
  fullName: string;
  rfc?: string;
  curp?: string;
  nationality?: NationalityType;
  passport?: string;  // For foreign nationals

  // Work Information
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  employmentStatus?: EmploymentStatus;

  // Additional Contact
  personalEmail?: string;
  workEmail?: string;
  workPhone?: string;
}

/**
 * Common fields for company actors
 */
export interface CompanyActorFields {
  // Company Information
  companyName: string;
  companyRfc: string;

  // Legal Representative
  legalRepName: string;
  legalRepPosition: string;
  legalRepRfc?: string;
  legalRepPhone: string;
  legalRepEmail: string;
  legalRepId?: string;  // ID document of legal rep

  // Additional Contact
  workEmail?: string;
  workPhone?: string;
}

/**
 * Bank Information (common to multiple actors)
 */
export interface BankInformation {
  bankName?: string;
  accountNumber?: string;
  clabe?: string;
  accountHolder?: string;  // If different from actor name
}

/**
 * CFDI Information (for fiscal invoicing)
 */
export interface CfdiInformation {
  requiresCFDI: boolean;
  cfdiData?: {
    razonSocial?: string;
    rfc?: string;
    usoCFDI?: string;
    regimenFiscal?: string;
    domicilioFiscal?: string;
  };
}

/**
 * Token Access Information
 */
export interface TokenAccess {
  accessToken?: string;
  tokenExpiry?: Date;
  lastAccessedAt?: Date;
  accessCount?: number;
}

/**
 * Verification Information
 */
export interface VerificationInfo {
  verificationStatus: ActorVerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  requiresChanges?: string[];  // List of required changes
}

/**
 * Activity Log Entry
 */
export interface ActivityLogEntry {
  action: string;
  performedBy: string;  // User ID or 'SELF_SERVICE'
  performedAt: Date;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}
