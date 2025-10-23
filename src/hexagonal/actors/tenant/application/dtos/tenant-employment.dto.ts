/**
 * Tenant Employment DTOs
 * Data transfer objects for tenant employment information
 */

import {
  IsString,
  IsNumber,
  IsEmail,
  IsEnum,
  IsOptional,
  Min,
  Length,
  Matches,
  IsNotEmpty
} from 'class-validator';
import { EmploymentStatus } from '@/hexagonal/actors/shared/domain/entities/actor-types';

/**
 * DTO for creating/updating employment information
 */
export class TenantEmploymentDto {
  @IsEnum(EmploymentStatus, { message: 'Invalid employment status' })
  @IsNotEmpty({ message: 'Employment status is required' })
  employmentStatus!: EmploymentStatus;

  @IsString()
  @IsNotEmpty({ message: 'Occupation is required' })
  @Length(2, 100, { message: 'Occupation must be between 2 and 100 characters' })
  occupation!: string;

  // Required for EMPLOYED status
  @IsString()
  @IsOptional()
  @Length(2, 200)
  employerName?: string;

  @IsString()
  @IsOptional()
  employerAddressId?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  position?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+52)?[1-9][0-9]{9}$/, {
    message: 'Invalid work phone number'
  })
  workPhone?: string;

  @IsEmail({}, { message: 'Invalid work email' })
  @IsOptional()
  workEmail?: string;

  // Income Information
  @IsNumber()
  @Min(0, { message: 'Monthly income cannot be negative' })
  @IsNotEmpty({ message: 'Monthly income is required' })
  monthlyIncome!: number;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  incomeSource?: string;
}

/**
 * DTO for verifying employment
 */
export class VerifyEmploymentDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsOptional()
  verificationMethod?: string; // 'document', 'phone', 'email', 'reference'

  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @IsString()
  @IsOptional()
  verifiedBy?: string;
}

/**
 * Employment verification result
 */
export class EmploymentVerificationResultDto {
  tenantId!: string;
  isVerified!: boolean;
  verificationDate?: Date;
  verificationMethod?: string;
  verifiedBy?: string;

  employmentDetails?: {
    status: string;
    employer?: string;
    position?: string;
    monthlyIncome: number;
    yearsEmployed?: number;
  };

  issues?: string[];
  notes?: string;
}

// UpdateEmployerAddressDto is now imported from shared module

/**
 * Self-employed specific DTO
 */
export class SelfEmployedDetailsDto {
  @IsString()
  @IsNotEmpty({ message: 'Business name is required for self-employed' })
  @Length(2, 200)
  businessName!: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  businessType?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  yearsInBusiness?: number;

  @IsString()
  @IsOptional()
  @Matches(/^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/, {
    message: 'Invalid business RFC'
  })
  businessRfc?: string;

  @IsNumber()
  @Min(0, { message: 'Average monthly income cannot be negative' })
  averageMonthlyIncome!: number;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  incomeDescription?: string;
}

/**
 * Income proof DTO
 */
export class IncomeProofDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsEnum(['payslip', 'bank_statement', 'tax_return', 'employment_letter', 'other'])
  proofType!: string;

  @IsString()
  @IsOptional()
  documentId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  verifiedIncome?: number;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;
}

/**
 * Tenant-specific employment summary response
 */
export class TenantEmploymentSummaryResponse {
  tenantId!: string;
  hasEmployment!: boolean;
  isComplete!: boolean;

  status?: string;
  occupation?: string;
  employer?: string;
  position?: string;
  monthlyIncome?: number;

  hasEmployerAddress!: boolean;
  hasIncomeProof!: boolean;
  isVerified!: boolean;

  lastUpdated?: Date;
}
