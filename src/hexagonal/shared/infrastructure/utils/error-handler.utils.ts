/**
 * Shared error handling utilities
 * Provides consistent error responses across all controllers
 */

import { HttpError } from 'routing-controllers';

export class ApiError extends HttpError {
  constructor(httpCode: number, message: string, public details?: any) {
    super(httpCode, message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Map service errors to HTTP errors
 */
export function mapServiceError(error: any): ApiError {
  const message = error.message || 'An error occurred';

  if (message.includes('not found')) {
    return new NotFoundError(message.replace(' not found', ''));
  }

  if (message.includes('Invalid') || message.includes('required')) {
    return new BadRequestError(message);
  }

  if (message.includes('Unauthorized') || message.includes('token')) {
    return new UnauthorizedError(message);
  }

  if (message.includes('Forbidden') || message.includes('permission')) {
    return new ForbiddenError(message);
  }

  if (message.includes('already exists') || message.includes('duplicate')) {
    return new ConflictError(message);
  }

  // Default to 500
  return new ApiError(500, message);
}

/**
 * Handle errors in controller methods
 * Use this in try/catch blocks
 */
export function handleControllerError(error: any): never {
  if (error instanceof ApiError) {
    throw error;
  }

  throw mapServiceError(error);
}
