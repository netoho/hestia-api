/**
 * Aval Property Guarantee DTO
 * Data transfer object for managing the MANDATORY property guarantee for Avals
 */

import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto, UpdateAddressDto } from '../../../../core/application/dtos/address.dto';

/**
 * DTO for creating or updating property guarantee information
 * This is MANDATORY for all Avals
 */
export class AvalPropertyGuaranteeDto {
  @IsBoolean()
  @IsOptional()
  hasPropertyGuarantee?: boolean = true; // Always true for Aval

  @IsEnum(['income', 'property'], { message: 'Invalid guarantee method' })
  @IsOptional()
  guaranteeMethod?: 'income' | 'property';

  @IsNumber()
  @IsPositive({ message: 'Property value must be positive' })
  @IsNotEmpty({ message: 'Property value is required for Aval' })
  @Min(100000, { message: 'Property value must be at least $100,000' })
  propertyValue!: number;

  @IsString()
  @IsNotEmpty({ message: 'Property deed number is required for Aval' })
  propertyDeedNumber!: string;

  @IsString()
  @IsOptional()
  propertyRegistry?: string;

  @IsString()
  @IsOptional()
  propertyTaxAccount?: string;

  @IsBoolean()
  @IsOptional()
  propertyUnderLegalProceeding?: boolean = false;

  @IsString()
  @IsOptional()
  propertyAddress?: string; // Legacy string field

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsNotEmpty({ message: 'Property address details are required for Aval' })
  guaranteePropertyDetails!: CreateAddressDto;
}

/**
 * DTO for updating only the property guarantee address
 */
export class UpdatePropertyGuaranteeAddressDto {
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  @IsNotEmpty({ message: 'Property address details are required' })
  guaranteePropertyDetails!: UpdateAddressDto;
}

/**
 * DTO for property guarantee validation
 */
export class ValidatePropertyGuaranteeDto {
  @IsString()
  @IsNotEmpty({ message: 'Aval ID is required' })
  avalId!: string;

  @IsNumber()
  @IsPositive({ message: 'Policy rent amount must be positive' })
  @IsNotEmpty({ message: 'Policy rent amount is required for validation' })
  policyRentAmount!: number;

  @IsNumber()
  @IsPositive({ message: 'Minimum coverage ratio must be positive' })
  @IsOptional()
  minCoverageRatio?: number; // Default: property value should be at least 24x monthly rent
}

/**
 * DTO for property status verification
 */
export class PropertyStatusVerificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Property deed number is required' })
  propertyDeedNumber!: string;

  @IsString()
  @IsOptional()
  propertyRegistry?: string;

  @IsString()
  @IsOptional()
  propertyTaxAccount?: string;

  @IsBoolean()
  propertyUnderLegalProceeding!: boolean;
}

/**
 * Response DTO for property guarantee summary
 */
export class PropertyGuaranteeSummaryDto {
  avalId!: string;
  hasPropertyGuarantee!: boolean;
  guaranteeMethod?: 'income' | 'property';
  propertyValue?: number;
  propertyDeedNumber?: string;
  propertyRegistry?: string;
  propertyTaxAccount?: string;
  propertyUnderLegalProceeding!: boolean;
  propertyAddress?: string;
  guaranteePropertyDetails?: any; // PropertyAddress entity

  // Calculated fields
  estimatedCoverageMonths?: number; // How many months of rent the property can cover
  meetsMinimumRequirement?: boolean; // If property value meets policy requirements
  requiresAdditionalGuarantee?: boolean; // If additional guarantees are needed
}

/**
 * DTO for batch property guarantee validation
 */
export class BatchPropertyGuaranteeValidationDto {
  @IsString()
  @IsNotEmpty({ message: 'Policy ID is required' })
  policyId!: string;

  @IsNumber()
  @IsPositive({ message: 'Monthly rent must be positive' })
  @IsNotEmpty({ message: 'Monthly rent is required' })
  monthlyRent!: number;

  @IsNumber()
  @IsPositive({ message: 'Security deposit months must be positive' })
  @IsOptional()
  securityDepositMonths?: number; // Usually 1-3 months

  @IsBoolean()
  @IsOptional()
  includeMaintenanceFee?: boolean;

  @IsNumber()
  @IsPositive({ message: 'Maintenance fee must be positive' })
  @IsOptional()
  maintenanceFee?: number;
}