import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
  Max,
  Length,
  IsPhoneNumber
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create Personal Reference DTO
 */
export class CreatePersonalReferenceDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  homePhone?: string;

  @IsOptional()
  @IsString()
  cellPhone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  relationship: string;         // friend, family, colleague, etc.

  @IsOptional()
  @IsString()
  @Length(2, 100)
  occupation?: string;

  @IsOptional()
  @IsString()
  @Length(5, 200)
  address?: string;

  // Owner Information (only one should be set)
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  jointObligorId?: string;

  @IsOptional()
  @IsUUID()
  avalId?: string;
}

/**
 * Update Personal Reference DTO
 */
export class UpdatePersonalReferenceDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  homePhone?: string;

  @IsOptional()
  @IsString()
  cellPhone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  relationship?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  occupation?: string;

  @IsOptional()
  @IsString()
  @Length(5, 200)
  address?: string;
}

/**
 * Create Commercial Reference DTO
 */
export class CreateCommercialReferenceDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  contactName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  relationship: string;          // supplier, client, partner, etc.

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  yearsOfRelationship?: number;

  // Owner Information (only one should be set)
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  jointObligorId?: string;

  @IsOptional()
  @IsUUID()
  avalId?: string;
}

/**
 * Update Commercial Reference DTO
 */
export class UpdateCommercialReferenceDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  contactName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  relationship?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  yearsOfRelationship?: number;
}

/**
 * Reference Response DTO
 */
export class PersonalReferenceResponseDto {
  id: string;
  name: string;
  phone: string;
  homePhone?: string;
  cellPhone?: string;
  email?: string;
  relationship: string;
  occupation?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommercialReferenceResponseDto {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
  relationship: string;
  yearsOfRelationship?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bulk References DTO
 * For creating multiple references at once
 */
export class BulkPersonalReferencesDto {
  @IsUUID()
  actorId: string;

  @IsString()
  @IsNotEmpty()
  actorType: 'tenant' | 'jointObligor' | 'aval';

  references: CreatePersonalReferenceDto[];
}

export class BulkCommercialReferencesDto {
  @IsUUID()
  actorId: string;

  @IsString()
  @IsNotEmpty()
  actorType: 'tenant' | 'jointObligor' | 'aval';

  references: CreateCommercialReferenceDto[];
}