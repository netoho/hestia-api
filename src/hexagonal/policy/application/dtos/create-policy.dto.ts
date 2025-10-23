import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PolicyType } from '@/hexagonal/policy';

export class PropertyDetailsDto {
  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  propertyType: string;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  squareFootage?: number;
}

export class CreatePolicyDto {
  @IsEnum(PolicyType)
  type: PolicyType;

  @IsNumber()
  rentAmount: number;

  @IsNumber()
  depositAmount: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyDetailsDto)
  propertyDetails?: PropertyDetailsDto;

  @IsOptional()
  @IsString()
  propertyDetailsId?: string;

  @IsOptional()
  @IsString()
  primaryLandlordId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalLandlordIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenantIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jointObligorIds?: string[];

  @IsOptional()
  @IsString()
  avalId?: string;

  @IsOptional()
  @IsString()
  packageId?: string;
}
