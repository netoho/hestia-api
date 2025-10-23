/**
 * Shared response utilities
 * Provides consistent API response formatting
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: any[];
  message?: string;
  meta?: Record<string, any>;
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, message?: string, meta?: Record<string, any>): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  };
}

/**
 * Create an error response
 */
export function errorResponse(error: string, errors?: any[]): ApiResponse {
  return {
    success: false,
    error,
    ...(errors && { errors })
  };
}

/**
 * Create a success response with message only (no data)
 */
export function messageResponse(message: string): ApiResponse {
  return {
    success: true,
    message
  };
}

/**
 * Create a list response with count metadata
 */
export function listResponse<T>(data: T[], total?: number): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      count: data.length,
      ...(total !== undefined && { total })
    }
  };
}
