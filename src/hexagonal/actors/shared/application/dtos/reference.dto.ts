/**
 * Shared Reference DTOs
 * Data transfer objects for personal and commercial references
 * Used across all actor modules (Tenant, Aval, JointObligor)
 */

import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
  IsEnum,
  Length
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReferenceRelationshipType } from '../../domain/entities/actor-types';

/**
 * DTO for creating/updating personal references
 * Used for individual actors (persons)
 */
export class PersonalReferenceDto {
  @IsString()
  @IsNotEmpty({ message: 'Reference name is required' })
  @MaxLength(100, { message: 'Name must be less than 100 characters' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Reference phone is required' })
  @Matches(/^\d{10,}$/, { message: 'Phone must have at least 10 digits' })
  phone!: string;

  @IsString()
  @Matches(/^\d{10,}$/, { message: 'Home phone must have at least 10 digits' })
  @IsOptional()
  homePhone?: string;

  @IsString()
  @Matches(/^\d{10,}$/, { message: 'Cell phone must have at least 10 digits' })
  @IsOptional()
  cellPhone?: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Relationship is required' })
  @MaxLength(50, { message: 'Relationship must be less than 50 characters' })
  relationship!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Occupation must be less than 100 characters' })
  occupation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Address must be less than 255 characters' })
  address?: string;

  // Optional fields for additional metadata
  @IsOptional()
  @IsEnum(ReferenceRelationshipType)
  relationshipType?: ReferenceRelationshipType;

  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

/**
 * DTO for creating/updating commercial references
 * Used for company actors
 */
export class CommercialReferenceDto {
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @MaxLength(100, { message: 'Company name must be less than 100 characters' })
  companyName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Contact name is required' })
  @MaxLength(100, { message: 'Contact name must be less than 100 characters' })
  contactName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  @Matches(/^\d{10,}$/, { message: 'Phone must have at least 10 digits' })
  phone!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Business relationship is required' })
  @MaxLength(100, { message: 'Relationship must be less than 100 characters' })
  relationship!: string;

  @IsNumber()
  @IsPositive({ message: 'Years of relationship must be positive' })
  @Min(0, { message: 'Years cannot be negative' })
  @IsOptional()
  yearsOfRelationship?: number;

  // Optional fields for additional metadata
  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

/**
 * DTO for batch saving personal references
 * The actorId field should be set by the service layer
 */
export class SavePersonalReferencesDto {
  @ValidateNested({ each: true })
  @Type(() => PersonalReferenceDto)
  references!: PersonalReferenceDto[];
}

/**
 * DTO for batch saving commercial references
 * The actorId field should be set by the service layer
 */
export class SaveCommercialReferencesDto {
  @ValidateNested({ each: true })
  @Type(() => CommercialReferenceDto)
  references!: CommercialReferenceDto[];
}

/**
 * Response DTO for references summary
 * Generic structure that can be used by any actor type
 */
export class ReferencesSummaryDto {
  actorId!: string;
  actorType!: string;
  isCompany!: boolean;

  // Personal references (for individuals)
  personalReferences?: {
    total: number;
    references: PersonalReferenceDto[];
    meetsRequirement: boolean;
    requiredCount: number;
  };

  // Commercial references (for companies)
  commercialReferences?: {
    total: number;
    references: CommercialReferenceDto[];
    meetsRequirement: boolean;
    requiredCount: number;
  };

  // Overall status
  hasRequiredReferences!: boolean;
  missingReferencesCount?: number;
}

/**
 * DTO for validating reference requirements
 * Generic structure for any actor type
 */
export class ValidateReferencesDto {
  actorId!: string;
  actorType!: string;
  isCompany!: boolean;
  isValid!: boolean;
  personalReferencesCount?: number;
  commercialReferencesCount?: number;
  requiredPersonalReferences?: number;
  requiredCommercialReferences?: number;
  missingPersonalReferences?: number;
  missingCommercialReferences?: number;
}

/**
 * DTO for reference verification status
 * Used to track verification of references
 */
export class ReferenceVerificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Reference ID is required' })
  referenceId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Verification status is required' })
  verificationStatus!: 'pending' | 'verified' | 'failed' | 'unreachable';

  @IsString()
  @IsOptional()
  verificationDate?: string;

  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @IsString()
  @IsOptional()
  verifiedBy?: string;
}

/**
 * Simplified DTO for creating personal references (backwards compatibility)
 */
export class CreatePersonalReferenceDto extends PersonalReferenceDto {}

/**
 * Simplified DTO for creating commercial references (backwards compatibility)
 */
export class CreateCommercialReferenceDto extends CommercialReferenceDto {}

/**
 * DTO for updating personal references
 */
export class UpdatePersonalReferenceDto extends PersonalReferenceDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}

/**
 * DTO for updating commercial references
 */
export class UpdateCommercialReferenceDto extends CommercialReferenceDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}