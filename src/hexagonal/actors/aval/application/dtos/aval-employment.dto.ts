/**
 * Aval Employment DTO
 * Data transfer objects for managing employment information for individual Avals
 */

import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto, UpdateAddressDto } from '../../../../core/application/dtos/address.dto';

/**
 * DTO for Aval employment information (individuals only)
 */
export class AvalEmploymentDto {
  @IsEnum(['employed', 'self_employed', 'retired', 'unemployed', 'student'], {
    message: 'Invalid employment status'
  })
  @IsOptional()
  employmentStatus?: 'employed' | 'self_employed' | 'retired' | 'unemployed' | 'student';

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  employerName?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsNumber()
  @IsPositive({ message: 'Monthly income must be positive' })
  @Min(1000, { message: 'Monthly income must be at least $1,000' })
  @IsOptional()
  monthlyIncome?: number;

  @IsString()
  @IsOptional()
  incomeSource?: string;

  @IsString()
  @IsOptional()
  employerAddress?: string; // Legacy string field

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  employerAddressDetails?: CreateAddressDto;
}

// UpdateEmployerAddressDto is now imported from shared module

/**
 * Aval-specific employment summary response
 */
export class AvalEmploymentSummaryResponse {
  avalId!: string;
  employmentStatus?: string;
  occupation?: string;
  employerName?: string;
  position?: string;
  monthlyIncome?: number;
  incomeSource?: string;
  employerAddress?: string;
  employerAddressDetails?: any; // PropertyAddress entity

  // Calculated fields
  isEmployed!: boolean;
  hasIncomeDetails!: boolean;
  hasEmployerAddress!: boolean;
  annualIncome?: number;
  incomeVerificationRequired?: boolean;
}

/**
 * DTO for income verification
 */
export class IncomeVerificationDto {
  @IsEnum(['payslip', 'tax_return', 'bank_statement', 'employer_letter', 'other'], {
    message: 'Invalid verification method'
  })
  verificationType!: string;

  @IsNumber()
  @IsPositive({ message: 'Verified income must be positive' })
  verifiedIncome!: number;

  @IsString()
  @IsOptional()
  verificationDate?: string;

  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'Tax year must be 4 digits' })
  @IsOptional()
  taxYear?: string; // For tax return verification
}