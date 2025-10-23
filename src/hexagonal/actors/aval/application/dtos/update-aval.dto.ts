/**
 * Update Aval DTO
 * Data transfer object for updating existing Avals (partial updates)
 */

import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from '../../../../core/application/dtos/address.dto';

/**
 * DTO for updating an Aval (partial updates allowed)
 * All fields are optional to support partial updates
 */
export class UpdateAvalDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @Matches(/^\d{10,}$/, { message: 'Phone must have at least 10 digits' })
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  relationshipToTenant?: string;

  // Person-specific fields
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(['MEXICAN', 'FOREIGN'], { message: 'Invalid nationality' })
  @IsOptional()
  nationality?: 'MEXICAN' | 'FOREIGN';

  @IsString()
  @Length(18, 18, { message: 'CURP must be exactly 18 characters' })
  @Matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/, { message: 'Invalid CURP format' })
  @IsOptional()
  curp?: string;

  @IsString()
  @Length(12, 13, { message: 'RFC must be 12-13 characters' })
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]$/, { message: 'Invalid RFC format' })
  @IsOptional()
  rfc?: string;

  @IsString()
  @IsOptional()
  passport?: string;

  // Company-specific fields
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @Length(12, 13, { message: 'Company RFC must be 12-13 characters' })
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]$/, { message: 'Invalid company RFC format' })
  @IsOptional()
  companyRfc?: string;

  @IsString()
  @IsOptional()
  legalRepName?: string;

  @IsString()
  @IsOptional()
  legalRepPosition?: string;

  @IsString()
  @Length(12, 13, { message: 'Legal rep RFC must be 12-13 characters' })
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]$/, { message: 'Invalid legal rep RFC format' })
  @IsOptional()
  legalRepRfc?: string;

  @IsString()
  @Matches(/^\d{10,}$/, { message: 'Legal rep phone must have at least 10 digits' })
  @IsOptional()
  legalRepPhone?: string;

  @IsEmail({}, { message: 'Invalid legal representative email format' })
  @IsOptional()
  legalRepEmail?: string;

  // Property guarantee fields (can be updated)
  @IsBoolean()
  @IsOptional()
  hasPropertyGuarantee?: boolean;

  @IsEnum(['income', 'property'], { message: 'Invalid guarantee method' })
  @IsOptional()
  guaranteeMethod?: 'income' | 'property';

  @IsNumber()
  @IsPositive({ message: 'Property value must be positive' })
  @IsOptional()
  propertyValue?: number;

  @IsString()
  @IsOptional()
  propertyDeedNumber?: string;

  @IsString()
  @IsOptional()
  propertyRegistry?: string;

  @IsString()
  @IsOptional()
  propertyTaxAccount?: string;

  @IsBoolean()
  @IsOptional()
  propertyUnderLegalProceeding?: boolean;

  @IsString()
  @IsOptional()
  propertyAddress?: string;

  // Employment fields (for individuals)
  @IsEnum(['employed', 'self_employed', 'retired', 'unemployed', 'student'], { message: 'Invalid employment status' })
  @IsOptional()
  employmentStatus?: string;

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
  @IsOptional()
  monthlyIncome?: number;

  @IsString()
  @IsOptional()
  incomeSource?: string;

  @IsString()
  @IsOptional()
  employerAddress?: string;

  // Marriage information (for individuals)
  @IsEnum(['single', 'married_joint', 'married_separate', 'divorced', 'widowed'], { message: 'Invalid marital status' })
  @IsOptional()
  maritalStatus?: string;

  @IsString()
  @IsOptional()
  spouseName?: string;

  @IsString()
  @Length(12, 13, { message: 'Spouse RFC must be 12-13 characters' })
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]$/, { message: 'Invalid spouse RFC format' })
  @IsOptional()
  spouseRfc?: string;

  @IsString()
  @Length(18, 18, { message: 'Spouse CURP must be exactly 18 characters' })
  @Matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/, { message: 'Invalid spouse CURP format' })
  @IsOptional()
  spouseCurp?: string;

  // Optional contact fields
  @IsString()
  @IsOptional()
  workPhone?: string;

  @IsEmail({}, { message: 'Invalid personal email format' })
  @IsOptional()
  personalEmail?: string;

  @IsEmail({}, { message: 'Invalid work email format' })
  @IsOptional()
  workEmail?: string;

  // Address updates
  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  addressDetails?: CreateAddressDto;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  employerAddressDetails?: CreateAddressDto;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  guaranteePropertyDetails?: CreateAddressDto;

  // Status fields (typically set by system)
  @IsBoolean()
  @IsOptional()
  informationComplete?: boolean;

  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'IN_REVIEW'], { message: 'Invalid verification status' })
  @IsOptional()
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW';
}