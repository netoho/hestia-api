/**
 * Property Ownership Details DTOs
 * Enhanced DTOs for property ownership with co-owners
 */

import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { CoOwnerSummaryDto } from './co-owner.dto';
import { PropertyOwnershipType } from '../../../shared/domain/entities/property-types';

/**
 * Complete property ownership details
 */
export class PropertyOwnershipDetailsDto {
  @IsString()
  @IsNotEmpty()
  landlordId: string;

  // Property identification
  @IsString()
  @IsNotEmpty()
  propertyDeedNumber: string;

  @IsString()
  @IsOptional()
  propertyRegistryFolio?: string;

  // Ownership structure
  @IsEnum(PropertyOwnershipType)
  @IsOptional()
  ownershipType?: PropertyOwnershipType;

  @IsNumber()
  @Min(0)
  @Max(100)
  primaryOwnerPercentage: number;

  @IsBoolean()
  hasMultipleOwners: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoOwnerSummaryDto)
  @IsOptional()
  coOwners?: CoOwnerSummaryDto[];

  // Legal restrictions
  @IsBoolean()
  @IsOptional()
  hasMortgage?: boolean;

  @IsString()
  @IsOptional()
  mortgageInstitution?: string;

  @IsBoolean()
  @IsOptional()
  hasLiens?: boolean;

  @IsBoolean()
  @IsOptional()
  hasRestrictions?: boolean;

  @IsString()
  @IsOptional()
  restrictionDetails?: string;

  // Rental authorization
  @IsBoolean()
  canRent: boolean;

  @IsBoolean()
  @IsOptional()
  requiresCoOwnerConsent?: boolean;

  @IsArray()
  @IsOptional()
  consentingCoOwners?: string[];  // IDs of co-owners who have consented

  // Special conditions
  @IsString()
  @IsOptional()
  specialConditions?: string;

  @IsString()
  @IsOptional()
  notaryPublicNumber?: string;

  @IsString()
  @IsOptional()
  notaryLocation?: string;
}

/**
 * Update property ownership details
 */
export class UpdatePropertyOwnershipDto {
  @IsString()
  @IsOptional()
  propertyDeedNumber?: string;

  @IsString()
  @IsOptional()
  propertyRegistryFolio?: string;

  @IsEnum(PropertyOwnershipType)
  @IsOptional()
  ownershipType?: PropertyOwnershipType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  primaryOwnerPercentage?: number;

  @IsBoolean()
  @IsOptional()
  hasMortgage?: boolean;

  @IsString()
  @IsOptional()
  mortgageInstitution?: string;

  @IsBoolean()
  @IsOptional()
  hasLiens?: boolean;

  @IsBoolean()
  @IsOptional()
  hasRestrictions?: boolean;

  @IsString()
  @IsOptional()
  restrictionDetails?: string;

  @IsBoolean()
  @IsOptional()
  canRent?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresCoOwnerConsent?: boolean;

  @IsString()
  @IsOptional()
  specialConditions?: string;

  @IsString()
  @IsOptional()
  notaryPublicNumber?: string;

  @IsString()
  @IsOptional()
  notaryLocation?: string;
}

/**
 * Co-owner consent tracking
 */
export class CoOwnerConsentDto {
  @IsString()
  @IsNotEmpty()
  landlordId: string;

  @IsString()
  @IsNotEmpty()
  coOwnerId: string;

  @IsBoolean()
  hasConsented: boolean;

  @IsString()
  @IsOptional()
  consentDate?: string;

  @IsString()
  @IsOptional()
  consentDocument?: string;  // Reference to uploaded consent document

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Property title verification
 */
export class PropertyTitleVerificationDto {
  @IsString()
  @IsNotEmpty()
  landlordId: string;

  @IsString()
  @IsNotEmpty()
  propertyDeedNumber: string;

  @IsBoolean()
  isDeedVerified: boolean;

  @IsBoolean()
  @IsOptional()
  isRegistryVerified?: boolean;

  @IsString()
  @IsOptional()
  verificationDate?: string;

  @IsString()
  @IsOptional()
  verifiedBy?: string;

  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @IsArray()
  @IsOptional()
  verificationDocuments?: string[];  // Document IDs or URLs
}

/**
 * Ownership transfer details (for tracking changes)
 */
export class OwnershipTransferDto {
  @IsString()
  @IsNotEmpty()
  landlordId: string;

  @IsString()
  @IsNotEmpty()
  fromCoOwnerId: string;

  @IsString()
  @IsNotEmpty()
  toCoOwnerId: string;

  @IsNumber()
  @Min(CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE)
  @Max(CoOwnershipValidationRules.MAX_OWNERSHIP_PERCENTAGE)
  percentageTransferred: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  transferDocument?: string;

  @IsString()
  @IsOptional()
  effectiveDate?: string;
}

// Import validation rules from co-owner entity
import { CoOwnershipValidationRules } from '../../domain/entities/co-owner.entity';
