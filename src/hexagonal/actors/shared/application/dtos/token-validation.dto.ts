/**
 * Token Validation DTOs
 * Data Transfer Objects for token operations
 */

import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsDateString
} from 'class-validator';
import { ActorType } from '../../domain/entities/actor-types';

/**
 * DTO for token generation request
 */
export class GenerateTokenDto {
  @IsUUID()
  actorId!: string;

  @IsEnum(ActorType)
  actorType!: ActorType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  expiryDays?: number;

  @IsOptional()
  @IsString()
  generatedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for token generation response
 */
export class TokenGeneratedDto {
  @IsString()
  token!: string;

  @IsDateString()
  expiry!: string;

  @IsString()
  link!: string;

  @IsString()
  actorId!: string;

  @IsEnum(ActorType)
  actorType!: ActorType;

  @IsOptional()
  @IsString()
  preview?: string;  // Token preview for display (first/last chars)
}

/**
 * DTO for token validation request
 */
export class ValidateTokenDto {
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  token!: string;
}

/**
 * DTO for token validation response
 */
export class TokenValidationResponseDto {
  @IsBoolean()
  isValid!: boolean;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsNumber()
  remainingHours?: number;

  @IsOptional()
  actor?: {
    id: string;
    policyId: string;
    actorType: ActorType;
    email: string;
    fullName?: string;
    companyName?: string;
    isCompany: boolean;
    informationComplete: boolean;
    verificationStatus: string;
  };

  @IsOptional()
  tokenInfo?: {
    expiresAt: string;
    expiresIn: string;
    expired: boolean;
  };
}

/**
 * DTO for token refresh request
 */
export class RefreshTokenDto {
  @IsUUID()
  actorId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  additionalDays?: number;

  @IsOptional()
  @IsString()
  refreshedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for token refresh response
 */
export class TokenRefreshedDto {
  @IsUUID()
  actorId!: string;

  @IsDateString()
  newExpiry!: string;

  @IsNumber()
  additionalDays!: number;

  @IsString()
  expiresIn!: string;
}

/**
 * DTO for token revocation request
 */
export class RevokeTokenDto {
  @IsUUID()
  actorId!: string;

  @IsOptional()
  @IsString()
  revokedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for batch token generation
 */
export class BatchGenerateTokensDto {
  @IsUUID({ each: true })
  actorIds!: string[];

  @IsEnum(ActorType)
  actorType!: ActorType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  expiryDays?: number;

  @IsOptional()
  @IsString()
  generatedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for batch token generation response
 */
export class BatchTokensGeneratedDto {
  @IsNumber()
  total!: number;

  @IsNumber()
  successful!: number;

  @IsNumber()
  failed!: number;

  tokens!: Array<{
    actorId: string;
    success: boolean;
    token?: string;
    link?: string;
    error?: string;
  }>;
}

/**
 * DTO for token usage statistics
 */
export class TokenUsageStatsDto {
  @IsUUID()
  actorId!: string;

  @IsNumber()
  totalAccess!: number;

  @IsOptional()
  @IsDateString()
  firstAccess?: string;

  @IsOptional()
  @IsDateString()
  lastAccess?: string;

  @IsBoolean()
  isExpired!: boolean;

  @IsOptional()
  @IsString()
  expiresIn?: string;

  activities!: Array<{
    action: string;
    performedAt: string;
    ipAddress?: string;
    userAgent?: string;
  }>;
}

/**
 * DTO for invitation email request
 */
export class SendInvitationDto {
  @IsUUID()
  actorId!: string;

  @IsEnum(ActorType)
  actorType!: ActorType;

  @IsOptional()
  @IsString()
  customMessage?: string;

  @IsOptional()
  @IsBoolean()
  includeInstructions?: boolean;

  @IsOptional()
  @IsString()
  language?: 'es' | 'en';
}

/**
 * DTO for invitation email response
 */
export class InvitationSentDto {
  @IsBoolean()
  sent!: boolean;

  @IsString()
  email!: string;

  @IsString()
  actorId!: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  error?: string;
}