/**
 * Document Entity
 * Represents uploaded documents for actors and policies
 * Stored in S3 with metadata
 */

export interface ActorDocument {
  id: string;

  // Document Information
  category: DocumentCategory;
  documentType: string;         // INE, passport, income_proof, etc.
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;

  // S3 Storage Information
  s3Key: string;                // Unique S3 identifier
  s3Bucket: string;
  s3Region?: string;

  // Owner Information (polymorphic - only one will be set)
  landlordId?: string;
  tenantId?: string;
  jointObligorId?: string;
  avalId?: string;

  // Metadata
  uploadedBy?: string;          // User ID or "self" for actor uploads
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document categories based on Mexican requirements
 */
export enum DocumentCategory {
  // Basic Documents
  IDENTIFICATION = 'IDENTIFICATION',
  INCOME_PROOF = 'INCOME_PROOF',
  ADDRESS_PROOF = 'ADDRESS_PROOF',
  BANK_STATEMENT = 'BANK_STATEMENT',

  // Property Documents
  PROPERTY_DEED = 'PROPERTY_DEED',
  PROPERTY_TAX_STATEMENT = 'PROPERTY_TAX_STATEMENT',    // Boleta predial
  PROPERTY_REGISTRY = 'PROPERTY_REGISTRY',              // Folio real del registro público
  PROPERTY_APPRAISAL = 'PROPERTY_APPRAISAL',           // Avalúo de propiedad

  // Tax & Financial
  TAX_RETURN = 'TAX_RETURN',
  TAX_STATUS_CERTIFICATE = 'TAX_STATUS_CERTIFICATE',    // Constancia de situación fiscal
  CREDIT_REPORT = 'CREDIT_REPORT',                      // Buró de crédito

  // Employment
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  PAYROLL_RECEIPT = 'PAYROLL_RECEIPT',                  // Recibo de nómina

  // Legal Documents
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  COMPANY_CONSTITUTION = 'COMPANY_CONSTITUTION',        // Escritura constitutiva
  LEGAL_POWERS = 'LEGAL_POWERS',                       // Poderes notariales

  // Immigration
  PASSPORT = 'PASSPORT',
  IMMIGRATION_DOCUMENT = 'IMMIGRATION_DOCUMENT',

  // Other
  UTILITY_BILL = 'UTILITY_BILL',
  OTHER = 'OTHER'
}

/**
 * Policy Document for contracts and reports
 */
export interface PolicyDocument {
  id: string;
  policyId: string;

  // Document Information
  category: string;             // contract, investigation_report, etc.
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;

  // S3 Storage
  s3Key: string;
  s3Bucket: string;
  s3Region?: string;

  // Metadata
  uploadedBy: string;
  version: number;
  isCurrent: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document upload result
 */
export interface DocumentUploadResult {
  document: ActorDocument | PolicyDocument;
  uploadUrl?: string;           // Pre-signed URL for download
}

/**
 * Document validation result
 */
export interface DocumentValidation {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Create Document Input
 */
export type CreateActorDocument = Omit<ActorDocument, 'id' | 'createdAt' | 'updatedAt'>;
export type CreatePolicyDocument = Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt'>;