/**
 * Create Aval DTOs
 * Data transfer objects for creating new Avals (person and company variants)
 */

import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAddressDto } from '../../../../core/application/dtos/address.dto';

/**
 * Base DTO for creating an Aval
 */
export class CreateAvalBaseDto {
  @IsString()
  @IsNotEmpty({ message: 'Policy ID is required' })
  policyId!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  @Matches(/^\d{10,}$/, { message: 'Phone must have at least 10 digits' })
  phone!: string;

  @IsString()
  @IsNotEmpty({ message: 'Relationship to tenant is required' })
  relationshipToTenant!: string;

  // Property guarantee is MANDATORY for Aval
  @IsBoolean()
  @IsOptional()
  hasPropertyGuarantee?: boolean = true; // Default true for Aval

  @IsEnum(['income', 'property'], { message: 'Invalid guarantee method' })
  @IsOptional()
  guaranteeMethod?: 'income' | 'property';

  @IsNumber()
  @IsPositive({ message: 'Property value must be positive' })
  @IsOptional() // Optional in creation, required for submission
  propertyValue?: number;

  @IsString()
  @IsOptional() // Optional in creation, required for submission
  propertyDeedNumber?: string;

  @IsString()
  @IsOptional()
  propertyRegistry?: string;

  @IsString()
  @IsOptional()
  propertyTaxAccount?: string;

  @IsBoolean()
  @IsOptional()
  propertyUnderLegalProceeding?: boolean = false;

  @IsString()
  @IsOptional()
  propertyAddress?: string; // Legacy field

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  addressDetails?: CreateAddressDto; // Current address

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional() // Optional in creation, required for submission
  guaranteePropertyDetails?: CreateAddressDto; // MANDATORY for submission
}

/**
 * DTO for creating a Person Aval
 */
export class CreatePersonAvalDto extends CreateAvalBaseDto {
  @IsBoolean()
  isCompany: false = false;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

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

  // Employment information
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
  employerAddress?: string; // Legacy field

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  employerAddressDetails?: CreateAddressDto;

  // Marriage information
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
}

/**
 * DTO for creating a Company Aval
 */
export class CreateCompanyAvalDto extends CreateAvalBaseDto {
  @IsBoolean()
  isCompany: true = true;

  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  companyName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Company RFC is required' })
  @Length(12, 13, { message: 'Company RFC must be 12-13 characters' })
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]$/, { message: 'Invalid company RFC format' })
  companyRfc!: string;

  @IsString()
  @IsNotEmpty({ message: 'Legal representative name is required' })
  legalRepName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Legal representative position is required' })
  legalRepPosition!: string;

  @IsString()
  @Length(12, 13, { message: 'Legal rep RFC must be 12-13 characters' })
  @Matches(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2}[0-9A]$/, { message: 'Invalid legal rep RFC format' })
  @IsOptional()
  legalRepRfc?: string;

  @IsString()
  @IsNotEmpty({ message: 'Legal representative phone is required' })
  @Matches(/^\d{10,}$/, { message: 'Legal rep phone must have at least 10 digits' })
  legalRepPhone!: string;

  @IsEmail({}, { message: 'Invalid legal representative email format' })
  @IsNotEmpty({ message: 'Legal representative email is required' })
  legalRepEmail!: string;
}

/**
 * Union type for creating either person or company aval
 */
export type CreateAvalDto = CreatePersonAvalDto | CreateCompanyAvalDto;