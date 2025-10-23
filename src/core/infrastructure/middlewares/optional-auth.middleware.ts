import { DecodedToken } from '@Src/core/domain/types/decoded-token.interface';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';

@Service()
@Middleware({ type: 'before' })
export class OptionalJwtDecodeMiddleware implements ExpressMiddlewareInterface {
  public use(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization;

    if (!token) {
      // No token provided - continue without user
      req.user = undefined;
      next();
      return;
    }

    try {
      const decoded = jwt.decode(token.replace('Bearer ', '')) as DecodedToken;
      if (decoded) {
        req.user = decoded;
      } else {
        req.user = undefined;
      }
      next();
    } catch (err) {
      // Invalid token - continue without user
      req.user = undefined;
      next();
    }
  }
}
