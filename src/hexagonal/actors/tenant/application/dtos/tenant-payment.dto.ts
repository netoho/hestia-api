/**
 * Tenant Payment DTOs
 * Data transfer objects for tenant payment preferences and CFDI
 */

import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Length,
  Matches,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { TenantPaymentMethod } from '../../domain/entities/tenant.entity';

/**
 * CFDI (Comprobante Fiscal Digital por Internet) data
 */
export class TenantCfdiDataDto {
  @IsString()
  @IsNotEmpty({ message: 'RFC is required for CFDI' })
  @Matches(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, {
    message: 'Invalid RFC format'
  })
  rfc!: string;

  @IsString()
  @IsNotEmpty({ message: 'Business name is required for CFDI' })
  @Length(2, 200)
  businessName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Fiscal address is required for CFDI' })
  @Length(10, 500)
  fiscalAddress!: string;

  @IsEmail({}, { message: 'Invalid CFDI email format' })
  @IsNotEmpty({ message: 'Email is required for CFDI' })
  email!: string;

  @IsString()
  @IsOptional()
  @Length(3, 10)
  cfdiUse?: string; // G03, D10, etc.

  @IsString()
  @IsOptional()
  @Length(5, 5)
  postalCode?: string;

  @IsString()
  @IsOptional()
  fiscalRegime?: string;
}

/**
 * Payment preferences DTO
 */
export class TenantPaymentPreferencesDto {
  @IsEnum(TenantPaymentMethod, { message: 'Invalid payment method' })
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod!: TenantPaymentMethod;

  @IsBoolean()
  requiresCFDI!: boolean;

  @ValidateNested()
  @Type(() => TenantCfdiDataDto)
  @IsOptional()
  cfdiData?: TenantCfdiDataDto;

  // Payment details
  @IsString()
  @IsOptional()
  @Length(2, 100)
  preferredPaymentDay?: string; // e.g., "1st of month", "15th of month"

  @IsString()
  @IsOptional()
  preferredPaymentType?: string; // transfer, cash, check, etc.

  @IsString()
  @IsOptional()
  @Length(0, 500)
  paymentNotes?: string;
}

/**
 * Update payment preferences DTO
 */
export class UpdatePaymentPreferencesDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsEnum(TenantPaymentMethod)
  @IsOptional()
  paymentMethod?: TenantPaymentMethod;

  @IsBoolean()
  @IsOptional()
  requiresCFDI?: boolean;

  @ValidateNested()
  @Type(() => TenantCfdiDataDto)
  @IsOptional()
  cfdiData?: TenantCfdiDataDto;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  preferredPaymentDay?: string;

  @IsString()
  @IsOptional()
  preferredPaymentType?: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  paymentNotes?: string;
}

/**
 * CFDI validation DTO
 */
export class ValidateCfdiDto {
  @IsString()
  @IsNotEmpty()
  rfc!: string;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsBoolean()
  @IsOptional()
  validateWithSAT?: boolean; // Validate with Mexican tax authority
}

/**
 * CFDI validation result
 */
export class CfdiValidationResultDto {
  isValid!: boolean;
  rfc!: string;

  validationDetails?: {
    rfcFormat: boolean;
    businessNameMatch?: boolean;
    satValidation?: boolean;
    fiscalStatus?: string;
  };

  errors?: string[];
  suggestions?: string[];
}

/**
 * Payment schedule DTO
 */
export class PaymentScheduleDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsEnum(TenantPaymentMethod)
  method!: TenantPaymentMethod;

  schedule!: {
    frequency: string; // monthly, biannual, annual
    dayOfMonth?: number;
    monthsIncluded?: number[]; // For biannual/annual
    nextPaymentDate?: Date;
    amount?: number;
  };

  discounts?: {
    earlyPayment?: number; // percentage
    annualPayment?: number;
  };

  penalties?: {
    latePayment?: number; // percentage or fixed amount
    gracePeriodDays?: number;
  };
}

/**
 * Payment capability assessment DTO
 */
export class PaymentCapabilityDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  monthlyIncome!: number;
  requestedRent!: number;

  analysis!: {
    incomeToRentRatio: number; // Should be >= 3 typically
    affordabilityScore: string; // 'excellent', 'good', 'acceptable', 'risky'
    monthlyDisposableIncome?: number;
    recommendedMaxRent?: number;
  };

  factors?: {
    hasStableEmployment: boolean;
    hasRentalHistory: boolean;
    hasGoodReferences: boolean;
    requiresGuarantor: boolean;
  };

  recommendation!: string;
}

/**
 * Payment preferences summary
 */
export class PaymentPreferencesSummaryDto {
  tenantId!: string;

  paymentMethod!: string;
  requiresCFDI!: boolean;
  hasCfdiData!: boolean;

  cfdiSummary?: {
    rfc: string;
    businessName: string;
    email: string;
  };

  preferences?: {
    paymentDay?: string;
    paymentType?: string;
  };

  isComplete!: boolean;
  lastUpdated?: Date;
}