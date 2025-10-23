/**
 * Landlord Property DTOs
 * Data validation for property-related information
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Matches,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyOwnershipType } from '../../../shared/domain/entities/property-types';

/**
 * DTO for property ownership details
 */
export class PropertyOwnershipDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{1,10}(-\d{4})?$/, {
    message: 'Property deed number must be in format: 12345 or 12345-2024'
  })
  propertyDeedNumber!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]?\d{1,10}$/, {
    message: 'Registry folio must be in format: F123456789 or 123456789'
  })
  propertyRegistryFolio?: string;

  @IsOptional()
  @IsEnum(PropertyOwnershipType)
  ownershipType?: PropertyOwnershipType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  propertyPercentageOwnership?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coOwnershipAgreement?: string;

  @IsOptional()
  @IsString()
  notaryNumber?: string;

  @IsOptional()
  @IsString()
  notaryName?: string;

  @IsOptional()
  @IsString()
  notaryCity?: string;

  @IsOptional()
  @IsString()
  deedDate?: string;  // ISO date string

  @IsOptional()
  @IsString()
  catastralReference?: string;  // Referencia catastral

  @IsOptional()
  @IsNumber()
  @Min(0)
  propertyValue?: number;  // Declared property value

  @IsOptional()
  @IsString()
  propertyTaxAccount?: string;  // Cuenta predial
}

/**
 * DTO for co-owner information
 */
export class CoOwnerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/, {
    message: 'RFC must be a valid Mexican tax ID'
  })
  rfc?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipPercentage!: number;

  @IsOptional()
  @IsString()
  relationship?: string;  // Relationship to primary landlord

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  requiresConsent?: boolean;  // Requires consent for rental
}

/**
 * DTO for multiple property owners
 */
export class MultipleOwnersDto {
  @IsBoolean()
  hasMultipleOwners!: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoOwnerDto)
  coOwners?: CoOwnerDto[];

  @IsOptional()
  @IsString()
  ownershipAgreementType?: 'UNANIMOUS' | 'MAJORITY' | 'SINGLE_REPRESENTATIVE';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialConditions?: string;
}

/**
 * DTO for property restrictions and encumbrances
 */
export class PropertyRestrictionsDto {
  @IsBoolean()
  hasMortgage!: boolean;

  @IsOptional()
  @IsString()
  mortgageBank?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mortgageBalance?: number;

  @IsOptional()
  @IsBoolean()
  hasLiens?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  liensDescription?: string;

  @IsOptional()
  @IsBoolean()
  hasUsufruct?: boolean;

  @IsOptional()
  @IsString()
  usufructBeneficiary?: string;

  @IsOptional()
  @IsBoolean()
  hasRestrictions?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  restrictionsDescription?: string;

  @IsOptional()
  @IsBoolean()
  canRent?: boolean;  // Legal ability to rent

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rentRestrictions?: string;  // Any rental restrictions
}

/**
 * Complete property details DTO
 */
export class LandlordPropertyDetailsDto {
  @ValidateNested()
  @Type(() => PropertyOwnershipDto)
  ownership!: PropertyOwnershipDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultipleOwnersDto)
  multipleOwners?: MultipleOwnersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyRestrictionsDto)
  restrictions?: PropertyRestrictionsDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalNotes?: string;
}
