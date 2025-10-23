import { ErrorCode } from '@cliengo/logger';
import { BaseError } from '@Errors/base-error';
import { HttpStatusCode } from '@Src/core/infrastructure/httpClient/http-status-code.enum';

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(ErrorCode.NOT_FOUND, HttpStatusCode.NOT_FOUND, message);
  }
}
