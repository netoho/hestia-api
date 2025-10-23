/**
 * Shared validation utilities
 * Extracted from Next.js adapters for reuse in Express controllers
 */

import { validate, ValidationError } from 'class-validator';
import { plainToClass, ClassConstructor } from 'class-transformer';

export interface ValidationResult {
  isValid: boolean;
  errors?: FormattedValidationError[];
}

export interface FormattedValidationError {
  field: string;
  constraints: Record<string, string>;
  children?: FormattedValidationError[];
}

/**
 * Validate a DTO and return formatted errors
 */
export async function validateDto<T extends object>(
  DtoClass: ClassConstructor<T>,
  data: any
): Promise<ValidationResult> {
  const dto = plainToClass(DtoClass, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    return {
      isValid: false,
      errors: formatValidationErrors(errors)
    };
  }

  return { isValid: true };
}

/**
 * Format validation errors for consistent API response
 */
export function formatValidationErrors(errors: ValidationError[]): FormattedValidationError[] {
  return errors.map(error => ({
    field: error.property,
    constraints: error.constraints || {},
    children: error.children?.length
      ? formatValidationErrors(error.children)
      : undefined
  }));
}

/**
 * Transform and validate DTO in one step
 */
export async function transformAndValidate<T extends object>(
  DtoClass: ClassConstructor<T>,
  data: any
): Promise<{ dto: T; errors?: FormattedValidationError[] }> {
  const dto = plainToClass(DtoClass, data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    return {
      dto,
      errors: formatValidationErrors(errors)
    };
  }

  return { dto };
}
