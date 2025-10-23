import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  IsUUID,
  IsMimeType
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentCategory } from '../../domain/entities/document.entity';

/**
 * Upload Document DTO
 * Used when uploading a new document
 */
export class UploadActorDocumentDto {
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsString()
  @IsNotEmpty()
  documentType: string;         // INE, passport, income_proof, etc.

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  fileSize: number;

  @IsMimeType()
  mimeType: string;

  // S3 Information
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @IsString()
  @IsNotEmpty()
  s3Bucket: string;

  @IsOptional()
  @IsString()
  s3Region?: string;

  // Actor Information (only one should be provided)
  @IsOptional()
  @IsUUID()
  landlordId?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  jointObligorId?: string;

  @IsOptional()
  @IsUUID()
  avalId?: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;          // User ID or "self"
}

/**
 * Upload Policy Document DTO
 */
export class UploadPolicyDocumentDto {
  @IsUUID()
  policyId: string;

  @IsString()
  @IsNotEmpty()
  category: string;             // contract, investigation_report, etc.

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  fileSize: number;

  @IsMimeType()
  mimeType: string;

  // S3 Information
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @IsString()
  @IsNotEmpty()
  s3Bucket: string;

  @IsOptional()
  @IsString()
  s3Region?: string;

  @IsString()
  @IsNotEmpty()
  uploadedBy: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  version?: number;
}

/**
 * Document Verification DTO
 */
export class VerifyDocumentDto {
  @IsUUID()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  verifiedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Document Rejection DTO
 */
export class RejectDocumentDto {
  @IsUUID()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  rejectedBy: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

/**
 * Document Query DTO
 */
export class QueryDocumentsDto {
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  actorType?: 'landlord' | 'tenant' | 'jointObligor' | 'aval';
}

/**
 * Document Response DTO
 */
export class DocumentResponseDto {
  id: string;
  category: DocumentCategory | string;
  documentType: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  downloadUrl?: string;         // Pre-signed URL for download
}

/**
 * Document Upload Response DTO
 */
export class DocumentUploadResponseDto {
  success: boolean;
  document?: DocumentResponseDto;
  uploadUrl?: string;           // Pre-signed URL for upload
  error?: string;
}