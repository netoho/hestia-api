import { IsString, IsNumber, IsOptional, IsEnum, ValidateNested, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentStatus } from '../../domain/entities/actor-types';

/**
 * Shared DTO for employment summary information
 * Used by both Tenant and Aval modules
 */
export class EmploymentSummaryDto {
  @IsString()
  companyName!: string;

  @IsString()
  position!: string;

  @IsNumber()
  @Min(0)
  monthlyIncome!: number;

  @IsEnum(EmploymentStatus)
  status!: EmploymentStatus;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

/**
 * Shared DTO for updating employer address
 * Used by both Tenant and Aval modules
 */
export class UpdateEmployerAddressDto {
  @IsString()
  street!: string;

  @IsString()
  exteriorNumber!: string;

  @IsOptional()
  @IsString()
  interiorNumber?: string;

  @IsString()
  neighborhood!: string;

  @IsString()
  municipality!: string;

  @IsString()
  state!: string;

  @IsString()
  postalCode!: string;

  @IsString()
  country!: string;
}

/**
 * Shared DTO for employment verification
 */
export class EmploymentVerificationDto {
  @IsBoolean()
  isVerified!: boolean;

  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @IsOptional()
  @IsString()
  verifiedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}