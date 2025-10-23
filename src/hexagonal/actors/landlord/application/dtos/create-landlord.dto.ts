/**
 * Create Landlord DTO
 * Data validation for creating new landlords
 */

import {
  IsBoolean,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Matches,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreatePersonActorDto,
  CreateCompanyActorDto,
  ActorBankInfoDto,
  ActorCfdiDto
} from '@/hexagonal/actors/shared/application/dtos/base-actor.dto';
import { ActorType } from '@/hexagonal/actors/shared/domain/entities/actor-types';

/**
 * Base Create Landlord DTO
 */
class CreateLandlordBaseDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,10}(-\d{4})?$/, {
    message: 'Property deed number must be in format: 12345 or 12345-2024'
  })
  propertyDeedNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]?\d{1,10}$/, {
    message: 'Registry folio must be in format: F123456789 or 123456789'
  })
  propertyRegistryFolio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  propertyPercentageOwnership?: number;

  @IsOptional()
  @IsString()
  coOwnershipAgreement?: string;

  // Bank information (required for landlords)
  @ValidateNested()
  @Type(() => ActorBankInfoDto)
  @IsObject()
  bankInfo!: ActorBankInfoDto;

  // CFDI information
  @ValidateNested()
  @Type(() => ActorCfdiDto)
  @IsObject()
  cfdiInfo!: ActorCfdiDto;
}

/**
 * DTO for creating a person landlord
 */
export class CreatePersonLandlordDto extends CreatePersonActorDto {
  // Override to set actor type
  actorType: ActorType.LANDLORD = ActorType.LANDLORD;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,10}(-\d{4})?$/, {
    message: 'Property deed number must be in format: 12345 or 12345-2024'
  })
  propertyDeedNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]?\d{1,10}$/, {
    message: 'Registry folio must be in format: F123456789 or 123456789'
  })
  propertyRegistryFolio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  propertyPercentageOwnership?: number;

  @IsOptional()
  @IsString()
  coOwnershipAgreement?: string;

  // Bank information
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{18}$/, {
    message: 'CLABE must be exactly 18 digits'
  })
  clabe?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  // CFDI
  @IsBoolean()
  requiresCFDI: boolean = false;

  @ValidateNested()
  @Type(() => Object)
  @IsOptional()
  cfdiData?: {
    razonSocial?: string;
    rfc?: string;
    usoCFDI?: string;
    regimenFiscal?: string;
    domicilioFiscal?: string;
  };
}

/**
 * DTO for creating a company landlord
 */
export class CreateCompanyLandlordDto extends CreateCompanyActorDto {
  // Override to set actor type
  actorType: ActorType.LANDLORD = ActorType.LANDLORD;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,10}(-\d{4})?$/, {
    message: 'Property deed number must be in format: 12345 or 12345-2024'
  })
  propertyDeedNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]?\d{1,10}$/, {
    message: 'Registry folio must be in format: F123456789 or 123456789'
  })
  propertyRegistryFolio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  propertyPercentageOwnership?: number;

  @IsOptional()
  @IsString()
  coOwnershipAgreement?: string;

  // Bank information
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{18}$/, {
    message: 'CLABE must be exactly 18 digits'
  })
  clabe?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  // CFDI
  @IsBoolean()
  requiresCFDI: boolean = false;

  @ValidateNested()
  @Type(() => Object)
  @IsOptional()
  cfdiData?: {
    razonSocial?: string;
    rfc?: string;
    usoCFDI?: string;
    regimenFiscal?: string;
    domicilioFiscal?: string;
  };
}

/**
 * Union type for creating any landlord
 */
export type CreateLandlordDto = CreatePersonLandlordDto | CreateCompanyLandlordDto;