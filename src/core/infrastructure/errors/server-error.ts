import { ErrorCode } from '@cliengo/logger';
import { BaseError } from '@Errors/base-error';
import { HttpStatusCode } from '@Src/core/infrastructure/httpClient/http-status-code.enum';

export class ServerError extends BaseError {
  constructor(message: string) {
    super(ErrorCode.UNCAUGHT_EXCEPTION, HttpStatusCode.INTERNAL_SERVER_ERROR, message);
  }
}
