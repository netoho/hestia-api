import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  Length,
  IsLatitude,
  IsLongitude,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create Address DTO
 * Used for creating new addresses with validation
 */
export class CreateAddressDto {
  // Street Information
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  street: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  exteriorNumber: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  interiorNumber?: string;

  // Location Information
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  neighborhood: string;        // Colonia

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}$/, { message: 'Postal code must be 5 digits' })
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  municipality: string;         // Alcaldía/Municipio

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string = 'México';

  // Google Maps Integration (optional)
  @IsOptional()
  @IsString()
  placeId?: string;

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  formattedAddress?: string;
}

/**
 * Update Address DTO
 * All fields are optional for partial updates
 */
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  street?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  exteriorNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  interiorNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Postal code must be 5 digits' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  municipality?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  placeId?: string;

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  formattedAddress?: string;
}

/**
 * Address Search DTO
 * Used for searching addresses
 */
export class SearchAddressDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Postal code must be 5 digits' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  street?: string;
}

/**
 * Google Maps Validation DTO
 */
export class GoogleMapsValidationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  placeId?: string;
}