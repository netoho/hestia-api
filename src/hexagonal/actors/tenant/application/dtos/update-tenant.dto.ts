/**
 * Update Tenant DTOs
 * Data transfer objects for updating tenants
 */

import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  Length,
  Matches,
  Min
} from 'class-validator';

/**
 * DTO for updating person tenant information
 */
export class UpdatePersonTenantDto {
  // Personal Information
  @IsString()
  @IsOptional()
  @Length(2, 200)
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/, {
    message: 'Invalid CURP format'
  })
  curp?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/, {
    message: 'Invalid RFC format'
  })
  rfc?: string;

  @IsString()
  @IsOptional()
  @Length(6, 20)
  passport?: string;

  // Contact Information
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+52)?[1-9][0-9]{9}$/)
  phone?: string;

  @IsEmail()
  @IsOptional()
  personalEmail?: string;

  // Additional Info
  @IsNumber()
  @IsOptional()
  @Min(1)
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
 * DTO for updating company tenant information
 */
export class UpdateCompanyTenantDto {
  // Company Information
  @IsString()
  @IsOptional()
  @Length(2, 200)
  companyName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-ZÑ&]{3}[0-9]{6}[A-Z0-9]{3}$/, {
    message: 'Invalid RFC format'
  })
  companyRfc?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  businessType?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  employeeCount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  yearsInBusiness?: number;

  // Legal Representative
  @IsString()
  @IsOptional()
  @Length(2, 200)
  legalRepName?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  legalRepId?: string;

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
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+52)?[1-9][0-9]{9}$/)
  phone?: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  additionalInfo?: string;
}

/**
 * General update DTO for any tenant type
 */
export class UpdateTenantDto {
  @IsOptional()
  personData?: UpdatePersonTenantDto;

  @IsOptional()
  companyData?: UpdateCompanyTenantDto;
}