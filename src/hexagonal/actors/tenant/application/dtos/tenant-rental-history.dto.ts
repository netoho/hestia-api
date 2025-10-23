/**
 * Tenant Rental History DTOs
 * Data transfer objects for tenant rental history
 */

import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  Min,
  Max,
  Length,
  Matches,
  IsNotEmpty
} from 'class-validator';

/**
 * DTO for creating/updating rental history
 */
export class TenantRentalHistoryDto {
  // Previous Landlord Information
  @IsString()
  @IsNotEmpty({ message: 'Previous landlord name is required' })
  @Length(2, 200, { message: 'Landlord name must be between 2 and 200 characters' })
  previousLandlordName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Previous landlord phone is required' })
  @Matches(/^(\+52)?[1-9][0-9]{9}$/, {
    message: 'Invalid phone number (10 digits, optional +52)'
  })
  previousLandlordPhone!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  previousLandlordEmail?: string;

  // Rental Details
  @IsNumber()
  @Min(0, { message: 'Previous rent amount cannot be negative' })
  @IsNotEmpty({ message: 'Previous rent amount is required' })
  previousRentAmount!: number;

  @IsString()
  @IsOptional()
  previousRentalAddressId?: string;

  @IsNumber()
  @Min(0, { message: 'Rental history years cannot be negative' })
  @Max(50, { message: 'Rental history years seems too high' })
  @IsNotEmpty({ message: 'Rental history years is required' })
  rentalHistoryYears!: number;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  reasonForMoving?: string;

  // Additional Details
  @IsString()
  @IsOptional()
  @Length(0, 100)
  propertyType?: string; // apartment, house, room, etc.

  @IsString()
  @IsOptional()
  @Length(0, 500)
  rentalExperience?: string; // positive, neutral, negative with details

  @IsString()
  @IsOptional()
  paymentHistory?: string; // always on time, occasional delays, frequent issues

  @IsString()
  @IsOptional()
  @Length(0, 500)
  additionalNotes?: string;
}

/**
 * DTO for verifying rental history
 */
export class VerifyRentalHistoryDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsOptional()
  verificationMethod?: string; // 'phone', 'email', 'letter', 'visit'

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  verificationNotes?: string;

  @IsString()
  @IsOptional()
  verifiedBy?: string;

  @IsString()
  @IsOptional()
  landlordFeedback?: string;

  @IsString()
  @IsOptional()
  recommendationLevel?: string; // 'highly_recommended', 'recommended', 'neutral', 'not_recommended'
}

/**
 * Rental history verification result
 */
export class RentalHistoryVerificationResultDto {
  tenantId!: string;
  isVerified!: boolean;
  verificationDate?: Date;
  verificationMethod?: string;
  verifiedBy?: string;

  rentalDetails?: {
    landlordName: string;
    rentAmount: number;
    rentalPeriodYears: number;
    propertyAddress?: string;
  };

  landlordFeedback?: {
    paymentHistory: string;
    propertyCondition: string;
    wouldRentAgain: boolean;
    recommendationLevel: string;
    comments?: string;
  };

  issues?: string[];
  notes?: string;
}

/**
 * DTO for updating previous rental address
 */
export class UpdatePreviousRentalAddressDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  addressId!: string;
}

/**
 * Multiple rental history entries (for tenants with multiple previous rentals)
 */
export class MultipleRentalHistoryDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  rentalHistories!: RentalHistoryEntryDto[];
}

/**
 * Individual rental history entry
 */
export class RentalHistoryEntryDto {
  @IsString()
  @Length(2, 200)
  landlordName!: string;

  @IsString()
  @Matches(/^(\+52)?[1-9][0-9]{9}$/)
  landlordPhone!: string;

  @IsEmail()
  @IsOptional()
  landlordEmail?: string;

  @IsNumber()
  @Min(0)
  rentAmount!: number;

  @IsString()
  @IsOptional()
  addressId?: string;

  @IsNumber()
  @Min(0)
  @Max(50)
  rentalYears!: number;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  reasonForLeaving?: string;
}

/**
 * Rental history summary response
 */
export class RentalHistorySummaryDto {
  tenantId!: string;
  hasRentalHistory!: boolean;
  isComplete!: boolean;

  currentRental?: {
    landlordName: string;
    landlordContact: string;
    rentAmount: number;
    years: number;
    address?: string;
  };

  totalRentalYears!: number;
  averageRentAmount?: number;
  numberOfPreviousRentals!: number;

  isVerified!: boolean;
  verificationStatus?: string;
  lastUpdated?: Date;
}

/**
 * Landlord reference check DTO
 */
export class LandlordReferenceCheckDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  landlordName!: string;

  @IsString()
  @IsNotEmpty()
  contactMethod!: string; // 'phone', 'email', 'letter'

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  questions?: string; // Custom questions to ask

  @IsString()
  @IsOptional()
  requestedBy?: string;
}