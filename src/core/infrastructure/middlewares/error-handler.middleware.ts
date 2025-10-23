import { ErrorCode } from '@cliengo/logger';
import { BaseError } from '@Errors/index';
import { flatValidationErrorMessage } from '@Src/core/application/validation-errors-normalizer';
import { envConfigs } from '@Src/core/infrastructure/get-configs';
import { HttpStatusCode } from '@Src/core/infrastructure/httpClient/http-status-code.enum';
import { logger } from '@Src/core/infrastructure/logger';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';


@Service()
@Middleware({ type: 'after' })
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: BaseError, request: Request, response: Response, next: (err?: unknown) => unknown): void {
    try {
      if (
        Array.isArray(error.errors) &&
        !error.errors.some((element: unknown) => !(element instanceof ValidationError))
      ) {
        response.status(HttpStatusCode.BAD_REQUEST).send({
          name: error.name,
          message: flatValidationErrorMessage(error.errors),
        });
      } else if (error.httpCode === HttpStatusCode.BAD_REQUEST) {
        response.status(error.httpCode).send({
          name: error.name,
          message: error.message,
        });
      } else if (error.httpCode) {
        logger.exception({
          message: error.message,
          errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
        });

        response.status(error.httpCode).json({
          name: error.name,
          message: error.message,
        });
      } else {
        logger.exception({
          message: error.message,
          metadata: {
            stack: error.stack,
            error,
          },
          errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
        });

        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          name: 'InternalServerError',
          message: 'Internal server error',
          extra: error?.message,
        });
      }
    } catch (err) {
      logger.exception({
        message: 'Error on ErrorHandlerMiddleware',
        metadata: err,
        errorCode: ErrorCode.UNCAUGHT_EXCEPTION,
      });

      response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        name: 'InternalServerError',
        message: 'Internal server error',
      });
    }

    next();
  }
}
