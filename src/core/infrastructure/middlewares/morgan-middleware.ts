import { logger } from '@Src/core/infrastructure/logger';
import { Request } from 'express';
import * as morgan from 'morgan';
import { Middleware, ExpressMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';

const morganStream = { write: (text: string) => { logger.system({ message: text }); } };

@Service()
@Middleware({ type: 'before' })
export class MorganMiddleware implements ExpressMiddlewareInterface {
  use = morgan.default(
    ':remote-addr :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    {
      stream: morganStream,
      skip: (req: Request) => req.url === '/',
    },
  );
}
