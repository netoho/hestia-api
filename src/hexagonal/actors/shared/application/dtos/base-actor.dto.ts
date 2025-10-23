/**
 * Base Actor DTOs
 * Data Transfer Objects for actor operations
 */

import {
  IsEmail,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  ValidateIf,
  IsNotEmpty,
  Min,
  Max
} from 'class-validator';
import { ActorType, ActorVerificationStatus, NationalityType, EmploymentStatus } from '../../domain/entities/actor-types';

/**
 * Base DTO for all actors
 */
export class BaseActorDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  policyId!: string;

  @IsEnum(ActorType)
  actorType!: ActorType;

  @IsBoolean()
  isCompany!: boolean;

  @IsEmail()
  email!: string;

  @IsPhoneNumber('MX')
  phone!: string;

  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for creating a person actor
 */
export class CreatePersonActorDto extends BaseActorDto {
  @IsBoolean()
  isCompany: false = false;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(13)
  rfc?: string;

  @IsOptional()
  @IsString()
  @MinLength(18)
  @MaxLength(18)
  curp?: string;

  @IsOptional()
  @IsEnum(NationalityType)
  nationality?: NationalityType;

  @IsOptional()
  @IsString()
  passport?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  employerName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000000)
  monthlyIncome?: number;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsEmail()
  workEmail?: string;

  @IsOptional()
  @IsPhoneNumber('MX')
  workPhone?: string;
}

/**
 * DTO for creating a company actor
 */
export class CreateCompanyActorDto extends BaseActorDto {
  @IsBoolean()
  isCompany: true = true;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(13)
  companyRfc!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  legalRepName!: string;

  @IsString()
  @IsNotEmpty()
  legalRepPosition!: string;

  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(13)
  legalRepRfc?: string;

  @IsPhoneNumber('MX')
  legalRepPhone!: string;

  @IsEmail()
  legalRepEmail!: string;

  @IsOptional()
  @IsString()
  legalRepId?: string;

  @IsOptional()
  @IsEmail()
  workEmail?: string;

  @IsOptional()
  @IsPhoneNumber('MX')
  workPhone?: string;
}

/**
 * DTO for updating an actor (partial update)
 */
export class UpdateActorDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('MX')
  phone?: string;

  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Person fields
  @ValidateIf(o => o.isCompany === false)
  @IsOptional()
  @IsString()
  fullName?: string;

  @ValidateIf(o => o.isCompany === false)
  @IsOptional()
  @IsString()
  rfc?: string;

  @ValidateIf(o => o.isCompany === false)
  @IsOptional()
  @IsString()
  curp?: string;

  @ValidateIf(o => o.isCompany === false)
  @IsOptional()
  @IsString()
  occupation?: string;

  @ValidateIf(o => o.isCompany === false)
  @IsOptional()
  @IsString()
  employerName?: string;

  @ValidateIf(o => o.isCompany === false)
  @IsOptional()
  @IsNumber()
  monthlyIncome?: number;

  // Company fields
  @ValidateIf(o => o.isCompany === true)
  @IsOptional()
  @IsString()
  companyName?: string;

  @ValidateIf(o => o.isCompany === true)
  @IsOptional()
  @IsString()
  companyRfc?: string;

  @ValidateIf(o => o.isCompany === true)
  @IsOptional()
  @IsString()
  legalRepName?: string;

  @ValidateIf(o => o.isCompany === true)
  @IsOptional()
  @IsString()
  legalRepPosition?: string;

  @ValidateIf(o => o.isCompany === true)
  @IsOptional()
  @IsPhoneNumber('MX')
  legalRepPhone?: string;

  @ValidateIf(o => o.isCompany === true)
  @IsOptional()
  @IsEmail()
  legalRepEmail?: string;

  // Shared optional fields
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsEmail()
  workEmail?: string;

  @IsOptional()
  @IsPhoneNumber('MX')
  workPhone?: string;
}

/**
 * DTO for actor bank information
 */
export class ActorBankInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(18)
  @MaxLength(18)
  clabe?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  accountHolder?: string;
}

/**
 * DTO for actor CFDI information
 */
export class ActorCfdiDto {
  @IsBoolean()
  requiresCFDI!: boolean;

  @ValidateIf(o => o.requiresCFDI === true)
  @IsString()
  razonSocial?: string;

  @ValidateIf(o => o.requiresCFDI === true)
  @IsString()
  @MinLength(12)
  @MaxLength(13)
  rfc?: string;

  @ValidateIf(o => o.requiresCFDI === true)
  @IsString()
  usoCFDI?: string;

  @ValidateIf(o => o.requiresCFDI === true)
  @IsString()
  regimenFiscal?: string;

  @ValidateIf(o => o.requiresCFDI === true)
  @IsString()
  domicilioFiscal?: string;
}

/**
 * DTO for actor response (includes computed fields)
 */
export class ActorResponseDto extends BaseActorDto {
  @IsEnum(ActorVerificationStatus)
  verificationStatus!: ActorVerificationStatus;

  @IsBoolean()
  informationComplete!: boolean;

  @IsOptional()
  completedAt?: Date;

  @IsOptional()
  verifiedAt?: Date;

  @IsOptional()
  verifiedBy?: string;

  @IsOptional()
  rejectedAt?: Date;

  @IsOptional()
  rejectionReason?: string;

  @IsOptional()
  tokenExpiry?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * DTO for actor submission check
 */
export class ActorSubmissionCheckDto {
  @IsBoolean()
  canSubmit!: boolean;

  @IsBoolean()
  hasRequiredPersonalInfo!: boolean;

  @IsBoolean()
  hasRequiredDocuments!: boolean;

  @IsOptional()
  @IsBoolean()
  hasRequiredReferences?: boolean;

  @IsBoolean()
  hasAddress!: boolean;

  @IsBoolean()
  hasSpecificRequirements!: boolean;

  @IsString({ each: true })
  missingRequirements!: string[];
}

/**
 * DTO for actor list filters
 */
export class ActorFiltersDto {
  @IsOptional()
  @IsUUID()
  policyId?: string;

  @IsOptional()
  @IsEnum(ActorType)
  actorType?: ActorType;

  @IsOptional()
  @IsBoolean()
  isCompany?: boolean;

  @IsOptional()
  @IsEnum(ActorVerificationStatus)
  verificationStatus?: ActorVerificationStatus;

  @IsOptional()
  @IsBoolean()
  informationComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  hasToken?: boolean;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('MX')
  phone?: string;
}