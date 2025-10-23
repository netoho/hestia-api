export enum PolicyStatus {
  DRAFT = 'DRAFT',
  INFO_COMPLETE = 'INFO_COMPLETE',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  CONTRACT_PENDING = 'CONTRACT_PENDING',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum PolicyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHECK = 'check',
  OTHER = 'other'
}

export interface PolicyFinancialDetails {
  hasIVA: boolean;
  issuesTaxReceipts: boolean;
  securityDeposit?: number;
  maintenanceFee?: number;
  maintenanceIncludedInRent: boolean;
  rentIncreasePercentage?: number;
  paymentMethod?: PaymentMethod | string;
}

export interface PropertyDetails {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  hasParking?: boolean;
  hasPets?: boolean;
  hasPool?: boolean;
  hasGym?: boolean;
}

export interface Policy {
  id: string;
  status: PolicyStatus;
  type: PolicyType;
  propertyDetailsId?: string;
  propertyDetails?: PropertyDetails;
  rentAmount: number;
  depositAmount: number;
  startDate: Date;
  endDate: Date;

  // Actor references
  primaryLandlordId?: string;
  additionalLandlordIds?: string[];
  tenantIds?: string[];
  jointObligorIds?: string[];
  avalId?: string;

  // Payment info
  packageId?: string;
  stripePaymentIntentId?: string;
  paymentStatus?: string;

  // Financial Details (from Landlord)
  hasIVA: boolean;
  issuesTaxReceipts: boolean;
  securityDeposit?: number;  // Amount in months (0-3 max)
  maintenanceFee?: number;
  maintenanceIncludedInRent: boolean;
  rentIncreasePercentage?: number;  // For contracts > 1 year (max 10%)
  paymentMethod?: string;  // bank_transfer, cash, check, other

  // Investigation
  investigationId?: string;
  riskLevel?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;

  // Progress tracking
  progress?: number;
  completedSteps?: string[];
}