/**
 * JointObligor Guarantee DTOs
 * Data transfer objects for managing flexible guarantee methods (income or property)
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
 * DTO for setting or changing guarantee method
 */
export class SetGuaranteeMethodDto {
  @IsEnum(['income', 'property'], { message: 'Guarantee method must be income or property' })
  @IsNotEmpty({ message: 'Guarantee method is required' })
  guaranteeMethod!: 'income' | 'property';

  @IsBoolean()
  @IsOptional()
  clearPreviousData?: boolean; // Clear data from previous method
}

/**
 * DTO for property guarantee information
 * Used when guaranteeMethod is 'property'
 */
export class JointObligorPropertyGuaranteeDto {
  @IsBoolean()
  @IsOptional()
  hasPropertyGuarantee?: boolean;

  @IsNumber()
  @IsPositive({ message: 'Property value must be positive' })
  @IsNotEmpty({ message: 'Property value is required for property guarantee' })
  @Min(100000, { message: 'Property value must be at least $100,000' })
  propertyValue!: number;

  @IsString()
  @IsNotEmpty({ message: 'Property deed number is required for property guarantee' })
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
  @IsNotEmpty({ message: 'Property address details are required for property guarantee' })
  guaranteePropertyDetails!: CreateAddressDto;
}

/**
 * DTO for income guarantee information
 * Used when guaranteeMethod is 'income'
 */
export class JointObligorIncomeGuaranteeDto {
  @IsNumber()
  @IsPositive({ message: 'Monthly income must be positive' })
  @IsNotEmpty({ message: 'Monthly income is required for income guarantee' })
  @Min(5000, { message: 'Monthly income must be at least $5,000' })
  monthlyIncome!: number;

  @IsString()
  @IsNotEmpty({ message: 'Income source is required for income guarantee' })
  incomeSource!: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountHolder?: string;

  @IsBoolean()
  @IsOptional()
  hasProperties?: boolean; // Additional properties as backing

  // Employment details for income verification
  @IsEnum(['employed', 'self_employed', 'retired', 'other'], { message: 'Invalid employment status' })
  @IsOptional()
  employmentStatus?: string;

  @IsString()
  @IsOptional()
  employerName?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  employerAddressDetails?: CreateAddressDto;
}

/**
 * DTO for validating income requirements
 */
export class ValidateIncomeRequirementsDto {
  @IsString()
  @IsNotEmpty({ message: 'JointObligor ID is required' })
  jointObligorId!: string;

  @IsNumber()
  @IsPositive({ message: 'Monthly rent must be positive' })
  @IsNotEmpty({ message: 'Monthly rent is required for validation' })
  monthlyRent!: number;

  @IsNumber()
  @IsPositive({ message: 'Minimum ratio must be positive' })
  @IsOptional()
  minRatio?: number; // Default: 3 (income should be 3x rent)
}

/**
 * Response DTO for income requirements validation
 */
export class IncomeRequirementsResponseDto {
  meetsRequirement!: boolean;
  currentRatio!: number;
  requiredIncome!: number;
  currentIncome?: number;
  deficit?: number;
  message?: string;
}

/**
 * Response DTO for guarantee setup status
 */
export class GuaranteeSetupStatusDto {
  jointObligorId!: string;
  guaranteeMethod?: 'income' | 'property';
  hasPropertyGuarantee!: boolean;
  hasIncomeVerification!: boolean;
  isComplete!: boolean;

  // Property guarantee details (if applicable)
  propertyValue?: number;
  propertyDeedNumber?: string;
  hasPropertyAddress?: boolean;

  // Income guarantee details (if applicable)
  monthlyIncome?: number;
  incomeSource?: string;
  incomeRatio?: number; // Income to rent ratio

  // Validation
  meetsRequirements?: boolean;
  missingFields?: string[];
}

/**
 * DTO for switching guarantee method
 */
export class SwitchGuaranteeMethodDto {
  @IsEnum(['income', 'property'], { message: 'New method must be income or property' })
  @IsNotEmpty({ message: 'New guarantee method is required' })
  newMethod!: 'income' | 'property';

  @IsBoolean()
  @IsOptional()
  confirmDataLoss?: boolean; // Confirm loss of previous method data
}

/**
 * DTO for batch guarantee validation
 */
export class BatchGuaranteeValidationDto {
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
  securityDepositMonths?: number;

  @IsNumber()
  @IsPositive({ message: 'Minimum income ratio must be positive' })
  @IsOptional()
  minIncomeRatio?: number; // Default: 3

  @IsNumber()
  @IsPositive({ message: 'Minimum property value ratio must be positive' })
  @IsOptional()
  minPropertyValueRatio?: number; // Default: 24 (months of rent)
}