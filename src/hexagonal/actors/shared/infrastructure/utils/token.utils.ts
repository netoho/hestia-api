/**
 * Token Utilities
 * Helper functions for actor token management
 */

import { randomBytes } from 'crypto';

/**
 * Default token configuration
 */
export const TOKEN_CONFIG = {
  DEFAULT_EXPIRY_DAYS: 7,
  TOKEN_LENGTH: 32,  // Bytes, will be 64 chars when hex encoded
  MIN_EXPIRY_HOURS: 1,
  MAX_EXPIRY_DAYS: 30
};

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = TOKEN_CONFIG.TOKEN_LENGTH): string {
  return randomBytes(length).toString('hex');
}

/**
 * Calculate token expiry date
 */
export function calculateTokenExpiry(days: number = TOKEN_CONFIG.DEFAULT_EXPIRY_DAYS): Date {
  // Validate days is within acceptable range
  const validDays = Math.min(
    Math.max(days, TOKEN_CONFIG.MIN_EXPIRY_HOURS / 24),
    TOKEN_CONFIG.MAX_EXPIRY_DAYS
  );

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + validDays);
  return expiry;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiryDate: Date | string | null | undefined): boolean {
  if (!expiryDate) return true;

  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  return expiry <= new Date();
}

/**
 * Get remaining time until token expires
 */
export function getTokenRemainingTime(expiryDate: Date | string | null | undefined): {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  totalHours: number;
} {
  if (!expiryDate) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      totalHours: 0
    };
  }

  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      totalHours: 0
    };
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    expired: false,
    days,
    hours,
    minutes,
    totalHours
  };
}

/**
 * Format token for URL use (ensure URL-safe)
 */
export function formatTokenForUrl(token: string): string {
  // The hex token is already URL-safe, but we can add this for extra safety
  return encodeURIComponent(token);
}

/**
 * Validate token format (basic validation)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  // Check if it's a hex string of the expected length
  const expectedLength = TOKEN_CONFIG.TOKEN_LENGTH * 2;  // Hex encoding doubles the length
  const hexRegex = /^[a-f0-9]+$/i;

  return token.length === expectedLength && hexRegex.test(token);
}

/**
 * Generate actor invitation link
 */
export function generateInvitationLink(
  baseUrl: string,
  actorType: string,
  token: string
): string {
  // Ensure actor type is lowercase and hyphenated
  const actorPath = actorType.toLowerCase().replace(/_/g, '-');
  return `${baseUrl}/actor/${actorPath}/${formatTokenForUrl(token)}`;
}

/**
 * Extract token from invitation link
 */
export function extractTokenFromLink(link: string): string | null {
  // Match pattern: /actor/{type}/{token}
  const match = link.match(/\/actor\/[^/]+\/([a-f0-9]+)$/i);
  return match ? match[1] : null;
}

/**
 * Create token metadata for logging
 */
export function createTokenMetadata(token: string, expiryDate: Date): {
  tokenPreview: string;
  expiresAt: string;
  expiresIn: string;
} {
  const remaining = getTokenRemainingTime(expiryDate);

  return {
    tokenPreview: `${token.substring(0, 8)}...${token.substring(token.length - 8)}`,
    expiresAt: expiryDate.toISOString(),
    expiresIn: remaining.expired
      ? 'Expired'
      : `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m`
  };
}

/**
 * Refresh token expiry (extend current expiry)
 */
export function refreshTokenExpiry(
  currentExpiry: Date | string,
  additionalDays: number = TOKEN_CONFIG.DEFAULT_EXPIRY_DAYS
): Date {
  const current = typeof currentExpiry === 'string' ? new Date(currentExpiry) : currentExpiry;
  const now = new Date();

  // If token is expired, calculate from now
  if (current <= now) {
    return calculateTokenExpiry(additionalDays);
  }

  // Otherwise, add to current expiry
  const newExpiry = new Date(current);
  newExpiry.setDate(newExpiry.getDate() + additionalDays);

  // Don't exceed max expiry from now
  const maxExpiry = new Date();
  maxExpiry.setDate(maxExpiry.getDate() + TOKEN_CONFIG.MAX_EXPIRY_DAYS);

  return newExpiry > maxExpiry ? maxExpiry : newExpiry;
}