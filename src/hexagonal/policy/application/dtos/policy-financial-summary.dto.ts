/**
 * Policy Financial Summary DTOs
 * Read-only DTOs for policy financial information
 */

import { PaymentMethod } from '@/hexagonal/policy';

/**
 * Financial summary for policy
 */
export class PolicyFinancialSummaryDto {
  // Tax configuration
  hasIVA: boolean;
  issuesTaxReceipts: boolean;
  ivaAmount?: number;
  totalWithIVA?: number;

  // Deposit and fees
  securityDeposit?: number;
  securityDepositAmount?: number;  // Actual amount based on rent
  maintenanceFee?: number;
  maintenanceIncludedInRent: boolean;

  // Rent configuration
  baseRent: number;
  rentIncreasePercentage?: number;
  projectedRentIncrease?: number;  // Amount of increase

  // Payment preferences
  paymentMethod?: PaymentMethod | string;
  paymentMethodDisplay?: string;  // Human-readable payment method

  // Calculated totals
  totalMonthlyPayment: number;  // Rent + maintenance (if not included)
  totalInitialPayment: number;  // First month + deposit

  // Status indicators
  isComplete: boolean;
  missingFields?: string[];
}

/**
 * Detailed financial breakdown
 */
export class PolicyFinancialBreakdownDto {
  // Base amounts
  baseRent: number;
  maintenanceFee?: number;

  // IVA breakdown
  hasIVA: boolean;
  ivaRate: number;
  rentIVA: number;
  maintenanceIVA: number;
  totalIVA: number;

  // Monthly totals
  rentWithIVA: number;
  maintenanceWithIVA: number;
  totalMonthlyPayment: number;

  // Initial payment breakdown
  firstMonthRent: number;
  securityDepositMonths?: number;
  securityDepositAmount: number;
  totalInitialPayment: number;

  // Multi-year projections (if applicable)
  contractLengthMonths?: number;
  yearlyIncreasePercentage?: number;
  projectedIncreases?: YearlyProjection[];
}

/**
 * Yearly rent projection for multi-year contracts
 */
export interface YearlyProjection {
  year: number;
  monthlyRent: number;
  yearlyTotal: number;
  increaseAmount: number;
  increasePercentage: number;
}

/**
 * Payment schedule information
 */
export class PaymentScheduleDto {
  policyId: string;
  frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';

  // Payment details
  baseAmount: number;
  ivaAmount: number;
  maintenanceFee?: number;
  totalAmount: number;

  // Payment method
  paymentMethod: PaymentMethod | string;
  bankDetails?: BankPaymentDetails;

  // Schedule
  nextPaymentDate: Date;
  paymentDueDay: number;  // Day of month (1-31)
  gracePeriodDays: number;
  latePaymentFee?: number;
}

/**
 * Bank payment details for transfers
 */
export interface BankPaymentDetails {
  bankName: string;
  accountHolder: string;
  accountNumber?: string;  // Masked for security
  clabe?: string;  // Masked for security
  reference?: string;  // Payment reference
}

/**
 * Financial validation result
 */
export class FinancialValidationResultDto {
  isValid: boolean;
  errors: string[];
  warnings: string[];

  // Specific validations
  securityDepositValid: boolean;
  rentIncreaseValid: boolean;
  maintenanceFeeValid: boolean;
  paymentMethodValid: boolean;
}

/**
 * Helper to create financial summary from policy
 */
export function createFinancialSummary(
  policy: any,
  includeCalculations: boolean = true
): PolicyFinancialSummaryDto {
  const summary = new PolicyFinancialSummaryDto();

  // Basic fields
  summary.hasIVA = policy.hasIVA || false;
  summary.issuesTaxReceipts = policy.issuesTaxReceipts || false;
  summary.securityDeposit = policy.securityDeposit;
  summary.maintenanceFee = policy.maintenanceFee;
  summary.maintenanceIncludedInRent = policy.maintenanceIncludedInRent || false;
  summary.baseRent = policy.rentAmount;
  summary.rentIncreasePercentage = policy.rentIncreasePercentage;
  summary.paymentMethod = policy.paymentMethod;

  // Human-readable payment method
  const paymentMethodMap: Record<string, string> = {
    'bank_transfer': 'Transferencia Bancaria',
    'cash': 'Efectivo',
    'check': 'Cheque',
    'other': 'Otro'
  };
  summary.paymentMethodDisplay = paymentMethodMap[policy.paymentMethod || ''] || policy.paymentMethod;

  if (includeCalculations && policy.rentAmount) {
    // Calculate IVA
    if (summary.hasIVA) {
      summary.ivaAmount = policy.rentAmount * 0.16;
      summary.totalWithIVA = policy.rentAmount * 1.16;
    }

    // Calculate security deposit amount
    if (summary.securityDeposit) {
      summary.securityDepositAmount = policy.rentAmount * summary.securityDeposit;
    }

    // Calculate projected rent increase
    if (summary.rentIncreasePercentage) {
      summary.projectedRentIncrease = policy.rentAmount * (summary.rentIncreasePercentage / 100);
    }

    // Calculate totals
    const rentWithIVA = summary.totalWithIVA || policy.rentAmount;
    const maintenanceAmount = (!summary.maintenanceIncludedInRent && summary.maintenanceFee)
      ? summary.maintenanceFee : 0;

    summary.totalMonthlyPayment = rentWithIVA + maintenanceAmount;
    summary.totalInitialPayment = summary.totalMonthlyPayment + (summary.securityDepositAmount || 0);
  }

  // Check completeness
  const missingFields: string[] = [];
  if (policy.securityDeposit === undefined || policy.securityDeposit === null) {
    missingFields.push('securityDeposit');
  }
  if (!policy.paymentMethod) {
    missingFields.push('paymentMethod');
  }

  summary.isComplete = missingFields.length === 0;
  summary.missingFields = missingFields.length > 0 ? missingFields : undefined;

  return summary;
}
