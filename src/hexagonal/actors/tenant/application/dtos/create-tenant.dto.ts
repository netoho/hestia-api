/**
 * Create Tenant DTOs
 * Data transfer objects for creating new tenants
 */

import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  ValidateNested,
  Length,
  Matches,
  Min,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { NationalityType, TenantType } from '../../../shared/domain/entities/actor-types';

/**
 * DTO for creating a person (individual) tenant
 */
export class CreatePersonTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Policy ID is required' })
  policyId!: string;

  // Personal Information
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @Length(2, 200, { message: 'Name must be between 2 and 200 characters' })
  fullName!: string;

  @IsEnum(NationalityType, { message: 'Invalid nationality type' })
  nationality!: NationalityType;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/, {
    message: 'Invalid CURP format (18 characters, uppercase)'
  })
  curp?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, {
    message: 'Invalid RFC format for individuals (13 characters)'
  })
  rfc?: string;

  @IsString()
  @IsOptional()
  @Length(6, 20, { message: 'Passport must be between 6 and 20 characters' })
  passport?: string;

  // Contact Information
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  @Matches(/^(\+52)?[1-9][0-9]{9}$/, {
    message: 'Invalid phone number (10 digits, optional +52)'
  })
  phone!: string;

  @IsEmail({}, { message: 'Invalid personal email format' })
  @IsOptional()
  personalEmail?: string;

  // Additional Info
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Number of occupants must be at least 1' })
  numberOfOccupants?: number;

  @IsBoolean()
  @IsOptional()
  hasPets?: boolean;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  petDescription?: string;

  @IsBoolean()
  @IsOptional()
  hasVehicles?: boolean;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  vehicleDescription?: string;

  // Emergency Contact
  @IsString()
  @IsOptional()
  @Length(2, 100)
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+52)?[1-9][0-9]{9}$/)
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  emergencyContactRelationship?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  additionalInfo?: string;
}

/**
 * DTO for creating a company tenant
 */
export class CreateCompanyTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Policy ID is required' })
  policyId!: string;

  // Company Information
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @Length(2, 200, { message: 'Company name must be between 2 and 200 characters' })
  companyName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Company RFC is required' })
  @Matches(/^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/, {
    message: 'Invalid RFC format for companies (12 characters)'
  })
  companyRfc!: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  businessType?: string;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Employee count must be at least 1' })
  employeeCount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Years in business cannot be negative' })
  yearsInBusiness?: number;

  // Legal Representative
  @IsString()
  @IsNotEmpty({ message: 'Legal representative name is required' })
  @Length(2, 200)
  legalRepName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Legal representative ID is required' })
  @Length(2, 50)
  legalRepId!: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  legalRepPosition?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/)
  legalRepRfc?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+52)?[1-9][0-9]{9}$/)
  legalRepPhone?: string;

  @IsEmail()
  @IsOptional()
  legalRepEmail?: string;

  // Contact Information
  @IsEmail({}, { message: 'Invalid company email format' })
  @IsNotEmpty({ message: 'Company email is required' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Company phone is required' })
  @Matches(/^(\+52)?[1-9][0-9]{9}$/, {
    message: 'Invalid phone number'
  })
  phone!: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  additionalInfo?: string;
}

/**
 * Unified DTO for creating a tenant (person or company)
 */
export class CreateTenantDto {
  @IsEnum(TenantType, { message: 'Invalid tenant type' })
  tenantType!: TenantType;

  @ValidateNested()
  @Type(() => CreatePersonTenantDto)
  @IsOptional()
  personData?: CreatePersonTenantDto;

  @ValidateNested()
  @Type(() => CreateCompanyTenantDto)
  @IsOptional()
  companyData?: CreateCompanyTenantDto;
}