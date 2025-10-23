/**
 * Aval Marriage Information DTO
 * Data transfer objects for managing marriage and spouse information for property co-ownership
 */

import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches
} from 'class-validator';

/**
 * DTO for marriage information
 * Important for property co-ownership and legal requirements
 */
export class AvalMarriageDto {
  @IsEnum(['single', 'married_joint', 'married_separate', 'divorced', 'widowed'], {
    message: 'Invalid marital status'
  })
  maritalStatus!: 'single' | 'married_joint' | 'married_separate' | 'divorced' | 'widowed';

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
}

/**
 * DTO for updating spouse details only
 */
export class UpdateSpouseDetailsDto {
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
}

/**
 * Response DTO for spouse consent requirement check
 */
export class SpouseConsentRequirementDto {
  avalId!: string;
  requiresSpouseConsent!: boolean;
  maritalStatus?: string;
  spouseName?: string;
  spouseRfc?: string;
  spouseCurp?: string;
  reason?: string; // Explanation of why consent is/isn't required
  consentDocumentsRequired?: string[]; // List of required documents if consent is needed
}

/**
 * DTO for validating marriage information completeness
 */
export class ValidateMarriageInfoDto {
  maritalStatus!: string;
  isComplete!: boolean;
  missingFields?: string[];
  requiresSpouseInfo!: boolean;
  hasSpouseInfo!: boolean;
}