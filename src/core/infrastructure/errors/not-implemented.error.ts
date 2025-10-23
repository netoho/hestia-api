import { BaseError } from '@Errors/base-error';
import { CustomErrorCode } from '@Errors/custom-errors.enum';
import { HttpStatusCode } from '@Src/core/infrastructure/httpClient/http-status-code.enum';

export class NotImplementedError extends BaseError {
  constructor(message = 'Method is not implemented yet') {
    super(CustomErrorCode.NOT_IMPLEMENTED, HttpStatusCode.NOT_IMPLEMENTED, message);
  }
}
