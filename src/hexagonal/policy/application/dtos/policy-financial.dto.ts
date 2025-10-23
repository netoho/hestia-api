/**
 * Policy Financial DTOs
 * Input validation for policy financial details
 */

import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsString
} from 'class-validator';
import { PaymentMethod } from '@/hexagonal/policy';

/**
 * DTO for updating policy financial details
 */
export class UpdatePolicyFinancialDto {
  @IsBoolean()
  @IsOptional()
  hasIVA?: boolean;

  @IsBoolean()
  @IsOptional()
  issuesTaxReceipts?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Security deposit cannot be negative' })
  @Max(3, { message: 'Security deposit cannot exceed 3 months' })
  securityDeposit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Maintenance fee cannot be negative' })
  maintenanceFee?: number;

  @IsBoolean()
  @IsOptional()
  maintenanceIncludedInRent?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Rent increase percentage cannot be negative' })
  @Max(10, { message: 'Rent increase cannot exceed 10% per year' })
  rentIncreasePercentage?: number;

  @IsString()
  @IsOptional()
  @IsEnum(PaymentMethod, {
    message: 'Payment method must be one of: bank_transfer, cash, check, other'
  })
  paymentMethod?: PaymentMethod;
}

/**
 * DTO for creating policy with financial details
 */
export class CreatePolicyFinancialDto {
  @IsBoolean()
  hasIVA: boolean = false;

  @IsBoolean()
  issuesTaxReceipts: boolean = false;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(3)
  securityDeposit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maintenanceFee?: number;

  @IsBoolean()
  maintenanceIncludedInRent: boolean = false;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  rentIncreasePercentage?: number;

  @IsString()
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

/**
 * Business rules constants
 */
export const PolicyFinancialRules = {
  IVA_RATE: 0.16, // 16% IVA rate in Mexico
  MAX_SECURITY_DEPOSIT_MONTHS: 3,
  MAX_YEARLY_RENT_INCREASE: 10, // 10% max yearly increase
  DEFAULT_SECURITY_DEPOSIT: 1, // 1 month default
};

/**
 * Calculate IVA amount if applicable
 */
export function calculateIVA(amount: number, hasIVA: boolean): number {
  return hasIVA ? amount * PolicyFinancialRules.IVA_RATE : 0;
}

/**
 * Calculate total with IVA if applicable
 */
export function calculateTotalWithIVA(amount: number, hasIVA: boolean): number {
  return amount + calculateIVA(amount, hasIVA);
}

/**
 * Validate financial details against business rules
 */
export function validateFinancialRules(dto: UpdatePolicyFinancialDto): string[] {
  const errors: string[] = [];

  // Validate security deposit
  if (dto.securityDeposit !== undefined) {
    if (dto.securityDeposit < 0) {
      errors.push('Security deposit cannot be negative');
    }
    if (dto.securityDeposit > PolicyFinancialRules.MAX_SECURITY_DEPOSIT_MONTHS) {
      errors.push(`Security deposit cannot exceed ${PolicyFinancialRules.MAX_SECURITY_DEPOSIT_MONTHS} months`);
    }
  }

  // Validate rent increase for multi-year contracts
  if (dto.rentIncreasePercentage !== undefined) {
    if (dto.rentIncreasePercentage < 0) {
      errors.push('Rent increase percentage cannot be negative');
    }
    if (dto.rentIncreasePercentage > PolicyFinancialRules.MAX_YEARLY_RENT_INCREASE) {
      errors.push(`Rent increase cannot exceed ${PolicyFinancialRules.MAX_YEARLY_RENT_INCREASE}% per year`);
    }
  }

  // Validate maintenance fee
  if (dto.maintenanceFee !== undefined && dto.maintenanceFee < 0) {
    errors.push('Maintenance fee cannot be negative');
  }

  return errors;
}
