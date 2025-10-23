import { PermissionsEnum } from '@Src/core/domain/permissions.enums';
import { DecodedToken } from '@Src/core/domain/types/decoded-token.interface';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';

declare global {
    namespace Express {
      interface Request {
        user?: {
          user_id: number;
          user_full_name: string;
          username: string;
          mailbox: string | null;
          roles: string[];
          plans: any[];
          exp: number;
          real_user: string;
          orig_iat: number;
        };
      }
    }
  }

  export {};

@Service()
@Middleware({ type: 'before' })
export class JwtDecodeMiddleware implements ExpressMiddlewareInterface {
  public use(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization;

    if (!token) {
      res.status(401).send({ message: 'No token provided.' });
      return;
    }

    try {
      const decoded = jwt.decode(token.replace('Bearer ', '')) as DecodedToken;
      if (decoded) {
        req.user = decoded;
        next();
      } else {
        res.status(401).send({ message: 'Failed to decode token.' });
      }
    } catch (err) {
      res.status(401).send({ message: 'Invalid token.' });
    }
  }
}

export function Authorize(allowedRoles: PermissionsEnum[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const user = req.user as DecodedToken;

    if (!user) {
      res.status(401).send({ message: 'User not authenticated.' });
      return;
    }

    const userRoles = user.roles || [];
    const hasPermission = userRoles.some(role => allowedRoles.includes(role as PermissionsEnum));

    if (!hasPermission) {
      res.status(403).send({ message: 'Forbidden: Insufficient permissions.' });
      return;
    }

    next();
  };
}
