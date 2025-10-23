import { ErrorCode } from '@cliengo/logger';
import { BaseError } from '@Errors/base-error';
import { HttpStatusCode } from '@Src/core/infrastructure/httpClient/http-status-code.enum';
import { ValidationError } from 'class-validator';

export class BadRequestError extends BaseError {
  constructor(message: string, errors: ValidationError[] | null = null) {
    super(ErrorCode.INVALID_BODY, HttpStatusCode.BAD_REQUEST, message, errors);
  }
}
