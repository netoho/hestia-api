/**
 * Update Landlord DTO
 * Data validation for updating existing landlords
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
import { UpdateActorDto } from '@/hexagonal/actors/shared/application/dtos/base-actor.dto';

/**
 * DTO for updating a landlord (partial update)
 */
export class UpdateLandlordDto extends UpdateActorDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

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

  // Bank information updates
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

  // CFDI updates
  @IsOptional()
  @IsBoolean()
  requiresCFDI?: boolean;

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