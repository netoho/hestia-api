/**
 * Create JointObligor DTOs
 * Data transfer objects for creating new JointObligors (person and company variants)
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
 * Base DTO for creating a JointObligor
 */
export class CreateJointObligorBaseDto {
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

  // Guarantee method - flexible for JointObligor
  @IsEnum(['income', 'property'], { message: 'Guarantee method must be income or property' })
  @IsOptional() // Can be set later
  guaranteeMethod?: 'income' | 'property';

  @IsBoolean()
  @IsOptional()
  hasPropertyGuarantee?: boolean = false; // Default false for JointObligor (unlike Aval)

  // Property guarantee fields (only if guaranteeMethod is 'property')
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
  propertyUnderLegalProceeding?: boolean = false;

  @IsString()
  @IsOptional()
  propertyAddress?: string; // Legacy field

  // Income guarantee fields (only if guaranteeMethod is 'income')
  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  accountHolder?: string;

  @IsBoolean()
  @IsOptional()
  hasProperties?: boolean = false; // Additional properties as backing

  // Addresses
  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  addressDetails?: CreateAddressDto; // Current address

  @ValidateNested()
  @Type(() => CreateAddressDto)
  @IsOptional()
  guaranteePropertyDetails?: CreateAddressDto; // Only if property method
}

/**
 * DTO for creating a Person JointObligor
 */
export class CreatePersonJointObligorDto extends CreateJointObligorBaseDto {
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

  // Employment information (important for income guarantee)
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

  // Marriage information (relevant for property guarantee)
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
 * DTO for creating a Company JointObligor
 */
export class CreateCompanyJointObligorDto extends CreateJointObligorBaseDto {
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

  // Companies can also have income for guarantee
  @IsNumber()
  @IsPositive({ message: 'Monthly income must be positive' })
  @IsOptional()
  monthlyIncome?: number;

  @IsString()
  @IsOptional()
  incomeSource?: string;
}

/**
 * Union type for creating either person or company joint obligor
 */
export type CreateJointObligorDto = CreatePersonJointObligorDto | CreateCompanyJointObligorDto;