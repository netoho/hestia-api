/**
 * Tenant Reference DTOs
 * Data transfer objects for tenant references (personal and commercial)
 */

import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Length,
  Matches,
  IsNotEmpty,
  ArrayMinSize,
  ArrayMaxSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReferenceRelationshipType } from '../../../../core/domain/entities';

/**
 * DTO for creating a personal reference
 */
export class CreateTenantPersonalReferenceDto {
  @IsString()
  @IsNotEmpty({ message: 'Reference name is required' })
  @Length(2, 200, { message: 'Name must be between 2 and 200 characters' })
  name!: string;

  @IsEnum(ReferenceRelationshipType, { message: 'Invalid relationship type' })
  @IsNotEmpty({ message: 'Relationship type is required' })
  relationship!: ReferenceRelationshipType;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(\+52)?[1-9][0-9]{9}$/, {
    message: 'Invalid phone number (10 digits, optional +52)'
  })
  phone!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(2, 200)
  occupation?: string;

  @IsString()
  @IsOptional()
  @Length(2, 200)
  address?: string;

  @IsString()
  @IsOptional()
  @Length(0, 20)
  yearsKnown?: string;

  @IsBoolean()
  @IsOptional()
  canContact?: boolean;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;
}

/**
 * DTO for creating a commercial reference (for company tenants)
 */
export class CreateTenantCommercialReferenceDto {
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @Length(2, 200, { message: 'Company name must be between 2 and 200 characters' })
  companyName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Contact name is required' })
  @Length(2, 200)
  contactName!: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  position?: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^(\+52)?[1-9][0-9]{9}$/, {
    message: 'Invalid phone number'
  })
  phone!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(2, 200)
  address?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  businessRelationship?: string; // supplier, customer, partner, etc.

  @IsString()
  @IsOptional()
  @Length(0, 20)
  yearsOfRelationship?: string;

  @IsBoolean()
  @IsOptional()
  canContact?: boolean;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;
}

/**
 * DTO for updating a reference
 */
export class UpdateTenantReferenceDto {
  @IsString()
  @IsOptional()
  @Length(2, 200)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+52)?[1-9][0-9]{9}$/)
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(2, 200)
  occupation?: string;

  @IsString()
  @IsOptional()
  @Length(2, 200)
  address?: string;

  @IsBoolean()
  @IsOptional()
  canContact?: boolean;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;
}

/**
 * DTO for bulk saving personal references
 */
export class BulkPersonalReferencesDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTenantPersonalReferenceDto)
  @ArrayMinSize(1, { message: 'At least one personal reference is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 personal references allowed' })
  references!: CreateTenantPersonalReferenceDto[];

  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean; // If true, deletes all existing references first
}

/**
 * DTO for bulk saving commercial references
 */
export class BulkCommercialReferencesDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTenantCommercialReferenceDto)
  @ArrayMinSize(1, { message: 'At least one commercial reference is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 commercial references allowed' })
  references!: CreateTenantCommercialReferenceDto[];

  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean;
}

/**
 * Reference verification DTO
 */
export class VerifyReferenceDto {
  @IsString()
  @IsNotEmpty()
  referenceId!: string;

  @IsString()
  @IsNotEmpty()
  verificationMethod!: string; // 'phone', 'email', 'in_person'

  @IsBoolean()
  @IsNotEmpty()
  verified!: boolean;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  verificationNotes?: string;

  @IsString()
  @IsOptional()
  verifiedBy?: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  referenceFeedback?: string;
}

/**
 * Reference check request DTO
 */
export class ReferenceCheckRequestDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  referenceId!: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10)
  questions?: string[]; // Custom questions to ask the reference

  @IsString()
  @IsOptional()
  requestedBy?: string;
}

/**
 * Reference summary response
 */
export class ReferenceSummaryDto {
  tenantId!: string;

  personalReferences!: {
    count: number;
    verified: number;
    relationships: string[];
    canContactAll: boolean;
  };

  commercialReferences?: {
    count: number;
    verified: number;
    businessTypes: string[];
    canContactAll: boolean;
  };

  totalReferences!: number;
  minimumRequired!: number;
  hasMinimumReferences!: boolean;
  allVerified!: boolean;

  lastUpdated?: Date;
}

/**
 * Single reference response
 */
export class ReferenceResponseDto {
  id!: string;
  tenantId!: string;
  type!: 'personal' | 'commercial';

  // Common fields
  name!: string;
  phone!: string;
  email?: string;
  canContact!: boolean;

  // Personal reference fields
  relationship?: string;
  occupation?: string;
  yearsKnown?: string;

  // Commercial reference fields
  companyName?: string;
  position?: string;
  businessRelationship?: string;
  yearsOfRelationship?: string;

  // Verification
  isVerified!: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;

  createdAt!: Date;
  updatedAt!: Date;
}