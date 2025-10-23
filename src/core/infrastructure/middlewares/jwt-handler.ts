// istanbul ignore file
import { Request, Response, NextFunction } from 'express';
import { expressjwt } from 'express-jwt';
import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';

// This handler will create a "auth" prop in the req with the decoded jwt data
/** @see https://www.npmjs.com/package/express-jwt */
@Service()
@Middleware({ type: 'before' })
export class JwtMiddleware implements ExpressMiddlewareInterface {
  public use(req: Request, res: Response, next: NextFunction): void {
    const jwtMiddleware = expressjwt({
      secret: 'secret',
      algorithms: ['HS256'],
    });

    jwtMiddleware(req, res, next);
    }
}
