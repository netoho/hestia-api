import { ErrorCode } from '@cliengo/logger';
import { CustomErrorCode } from '@Errors/custom-errors.enum';
import { HttpStatusCode } from '@Src/core/infrastructure/httpClient/http-status-code.enum';
import { ValidationError } from 'class-validator';

export abstract class BaseError extends Error {
  public readonly name: ErrorCode | CustomErrorCode;
  public readonly httpCode: HttpStatusCode;
  public readonly errors: ValidationError[] | null;

  constructor(name: ErrorCode | CustomErrorCode, httpCode: HttpStatusCode, description: string, errors: ValidationError[] | null = null) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.httpCode = httpCode;
    this.errors = errors;

    Error.captureStackTrace(this);
  }
}
