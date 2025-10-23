/**
 * Landlord Financial DTOs
 * Data validation for landlord financial information
 */

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  Matches,
  MinLength,
  MaxLength,
  Min,
  ValidateNested,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for landlord bank account information
 */
export class LandlordBankAccountDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(20)
  accountNumber!: string;

  @IsString()
  @Matches(/^\d{18}$/, {
    message: 'CLABE must be exactly 18 digits'
  })
  clabe!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  accountHolder?: string;  // If different from landlord name

  @IsOptional()
  @IsString()
  accountType?: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';

  @IsOptional()
  @IsString()
  swiftCode?: string;  // For international transfers

  @IsOptional()
  @IsString()
  routingNumber?: string;  // For US accounts
}

/**
 * DTO for CFDI (fiscal invoice) configuration
 */
export class LandlordCfdiConfigDto {
  @IsBoolean()
  requiresCFDI!: boolean;

  @ValidateNested()
  @Type(() => CfdiDataDto)
  @IsOptional()
  cfdiData?: CfdiDataDto;
}

/**
 * CFDI data details
 */
class CfdiDataDto {
  @IsString()
  @IsNotEmpty()
  razonSocial!: string;

  @IsString()
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/, {
    message: 'RFC must be a valid Mexican tax ID'
  })
  rfc!: string;

  @IsString()
  @IsNotEmpty()
  usoCFDI!: string;  // G03, P01, etc.

  @IsString()
  @IsNotEmpty()
  regimenFiscal!: string;  // 601, 612, etc.

  @IsString()
  @IsNotEmpty()
  domicilioFiscal!: string;

  @IsOptional()
  @IsString()
  email?: string;  // Email for sending invoices

  @IsOptional()
  @IsString()
  telefono?: string;
}

/**
 * DTO for updating financial details on the policy
 */
export class LandlordPolicyFinancialDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyRent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  securityDeposit?: number;

  @IsOptional()
  @IsString()
  paymentDay?: string;  // Day of month for rent payment (1-31)

  @IsOptional()
  @IsString()
  paymentMethod?: 'TRANSFER' | 'DEPOSIT' | 'CHECK' | 'CASH' | 'OTHER';

  @IsOptional()
  @IsBoolean()
  includesUtilities?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  utilitiesAmount?: number;

  @IsOptional()
  @IsBoolean()
  includesMaintenance?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maintenanceAmount?: number;
}

/**
 * DTO for landlord payment preferences
 */
export class LandlordPaymentPreferencesDto {
  @ValidateNested()
  @Type(() => LandlordBankAccountDto)
  bankAccount!: LandlordBankAccountDto;

  @ValidateNested()
  @Type(() => LandlordCfdiConfigDto)
  cfdiConfig!: LandlordCfdiConfigDto;

  @IsOptional()
  @IsString()
  preferredPaymentDay?: '1' | '15' | 'LAST' | 'OTHER';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  customPaymentDay?: number;

  @IsOptional()
  @IsBoolean()
  acceptsPartialPayments?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  latePaymentPenaltyRate?: number;  // Percentage

  @IsOptional()
  @IsNumber()
  @Min(0)
  gracePeriodDays?: number;

  @IsOptional()
  @IsString()
  paymentInstructions?: string;
}

/**
 * Response DTO for landlord financial summary
 */
export class LandlordFinancialSummaryDto {
  bankAccount?: {
    bankName: string;
    accountNumber: string;  // Masked for security
    clabe: string;  // Masked for security
    isComplete: boolean;
  };

  cfdiConfig?: {
    enabled: boolean;
    razonSocial?: string;
    rfc?: string;
    isComplete: boolean;
  };

  policyFinancials?: {
    monthlyRent?: number;
    securityDeposit?: number;
    totalMonthlyAmount?: number;
  };

  paymentPreferences?: {
    paymentDay?: string;
    acceptsPartialPayments?: boolean;
    hasLatePaymentPolicy?: boolean;
  };
}