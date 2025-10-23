/**
 * Co-owner DTOs
 * Data transfer objects for co-ownership operations
 */

import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDate,
  Min,
  Max,
  Length,
  Matches,
  IsArray,
  ValidateNested,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { CoOwnerRelationship, CoOwnershipValidationRules } from '../../domain/entities/co-owner.entity';

/**
 * DTO for creating a new co-owner
 */
export class CreateCoOwnerDto {
  @IsString()
  @IsNotEmpty({ message: 'Co-owner name is required' })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name!: string;

  @IsString()
  @IsOptional()
  @Matches(CoOwnershipValidationRules.RFC_PATTERN, {
    message: 'Invalid RFC format (e.g., ABC123456XYZ)'
  })
  rfc?: string;

  @IsString()
  @IsOptional()
  @Matches(CoOwnershipValidationRules.CURP_PATTERN, {
    message: 'Invalid CURP format (18 characters)'
  })
  curp?: string;

  @IsNumber()
  @Min(CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE, {
    message: `Ownership must be at least ${CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE}%`
  })
  @Max(CoOwnershipValidationRules.MAX_OWNERSHIP_PERCENTAGE, {
    message: `Ownership cannot exceed ${CoOwnershipValidationRules.MAX_OWNERSHIP_PERCENTAGE}%`
  })
  ownershipPercentage!: number;

  @IsString()
  @IsOptional()
  @IsEnum(CoOwnerRelationship, {
    message: 'Invalid relationship type'
  })
  relationship?: CoOwnerRelationship;

  @IsString()
  @IsOptional()
  @Matches(CoOwnershipValidationRules.PHONE_PATTERN, {
    message: 'Invalid phone number format (10 digits, optional +52)'
  })
  contactPhone?: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  contactEmail?: string;

  @IsBoolean()
  @IsOptional()
  hasLegalPower?: boolean;

  @IsString()
  @IsOptional()
  legalPowerDocument?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  agreementDate?: Date;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;
}

/**
 * DTO for updating a co-owner
 */
export class UpdateCoOwnerDto {
  @IsString()
  @IsOptional()
  @Length(2, 100)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(CoOwnershipValidationRules.RFC_PATTERN, {
    message: 'Invalid RFC format'
  })
  rfc?: string;

  @IsString()
  @IsOptional()
  @Matches(CoOwnershipValidationRules.CURP_PATTERN, {
    message: 'Invalid CURP format'
  })
  curp?: string;

  @IsNumber()
  @IsOptional()
  @Min(CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE)
  @Max(CoOwnershipValidationRules.MAX_OWNERSHIP_PERCENTAGE)
  ownershipPercentage?: number;

  @IsString()
  @IsOptional()
  @IsEnum(CoOwnerRelationship)
  relationship?: CoOwnerRelationship;

  @IsString()
  @IsOptional()
  @Matches(CoOwnershipValidationRules.PHONE_PATTERN)
  contactPhone?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsBoolean()
  @IsOptional()
  hasLegalPower?: boolean;

  @IsString()
  @IsOptional()
  legalPowerDocument?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  agreementDate?: Date;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO for adding a co-owner to a landlord
 */
export class AddCoOwnerDto {
  @IsString()
  @IsNotEmpty()
  landlordId!: string;

  @ValidateNested()
  @Type(() => CreateCoOwnerDto)
  coOwner!: CreateCoOwnerDto;
}

/**
 * DTO for updating multiple co-owner percentages
 */
export class UpdateOwnershipPercentagesDto {
  @IsString()
  @IsNotEmpty()
  landlordId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OwnershipPercentageUpdateDto)
  percentages!: OwnershipPercentageUpdateDto[];
}

/**
 * Individual ownership percentage update
 */
export class OwnershipPercentageUpdateDto {
  @IsString()
  @IsNotEmpty()
  coOwnerId!: string;

  @IsNumber()
  @Min(CoOwnershipValidationRules.MIN_OWNERSHIP_PERCENTAGE)
  @Max(CoOwnershipValidationRules.MAX_OWNERSHIP_PERCENTAGE)
  percentage!: number;
}

/**
 * DTO for removing a co-owner
 */
export class RemoveCoOwnerDto {
  @IsString()
  @IsNotEmpty()
  landlordId!: string;

  @IsString()
  @IsNotEmpty()
  coOwnerId!: string;

  @IsString()
  @IsOptional()
  @IsEnum(['proportional', 'equal', 'manual'])
  redistributionStrategy?: 'proportional' | 'equal' | 'manual';

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OwnershipPercentageUpdateDto)
  manualRedistribution?: OwnershipPercentageUpdateDto[];
}

/**
 * Response DTO for ownership breakdown
 */
export class OwnershipBreakdownDto {
  landlordId!: string;
  primaryOwnerName!: string;
  primaryOwnerPercentage!: number;

  coOwners!: CoOwnerSummaryDto[];

  totalPercentage!: number;
  isValid!: boolean;
  validationErrors?: string[];

  hasMultipleOwners!: boolean;
  coOwnerCount!: number;

  agreementType?: string;
  specialConditions?: string;
  lastModified?: Date;
}

/**
 * Co-owner summary for responses
 */
export class CoOwnerSummaryDto {
  id!: string;
  name!: string;
  ownershipPercentage!: number;
  relationship?: string;
  hasLegalPower?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

/**
 * DTO for validating ownership totals
 */
export class ValidateOwnershipDto {
  @IsString()
  @IsNotEmpty()
  policyId!: string;

  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean;
}

/**
 * Response DTO for ownership validation
 */
export class OwnershipValidationResultDto {
  policyId!: string;
  isValid!: boolean;
  totalPercentage!: number;
  errors!: string[];

  landlords!: {
    id: string;
    name: string;
    percentage: number;
    isPrimary: boolean;
    coOwnerCount: number;
  }[];
}

/**
 * DTO for bulk co-owner operations
 */
export class BulkCoOwnerOperationDto {
  @IsString()
  @IsNotEmpty()
  landlordId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCoOwnerDto)
  coOwners!: CreateCoOwnerDto[];

  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean;  // If true, removes all existing co-owners first

  @IsBoolean()
  @IsOptional()
  validateTotals?: boolean;  // If true, validates that total = 100%
}