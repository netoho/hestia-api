import { BaseError } from '@Errors/base-error';
import { CustomErrorCode } from '@Errors/custom-errors.enum';
import { HttpStatusCode } from '@Src/core/infrastructure/httpClient/http-status-code.enum';

export class UnprocessableError extends BaseError {
  constructor(message: string) {
    super(CustomErrorCode.UNPROCESSABLE, HttpStatusCode.UNPROCESSABLE, message);
  }
}
