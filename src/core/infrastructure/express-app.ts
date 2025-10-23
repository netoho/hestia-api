import path from 'path';

import { ErrorHandlerMiddleware } from '@Src/core/infrastructure/middlewares/error-handler.middleware';
import { MorganMiddleware } from '@Src/core/infrastructure/middlewares/morgan-middleware';
import { createExpressServer, useContainer } from 'routing-controllers';
import Container from 'typedi';

/**
 * Application configuration
 * @returns Express application
 */

const topLevelRoutes = path.join(__dirname, '../../*/infrastructure/controllers/*.controller.{js,ts}');
const moduleLevelRoutes = path.join(__dirname, '../../*/*/infrastructure/controllers/*.controller.{js,ts}');

/* const currentUserChecker: CurrentUserChecker = async (action: Action) => {
  // `action.request.auth` se establece en el middleware express-jwt
  const authUser = {
    userId: action.request.auth.user,
  };
  return authUser;
}; */

export const expressApp = async () => {
  useContainer(Container);

  const app = createExpressServer({
    cors: true,
    defaultErrorHandler: false,
    controllers: [
        topLevelRoutes,
        moduleLevelRoutes,
    ],
    middlewares: [ErrorHandlerMiddleware, MorganMiddleware],
    // currentUserChecker,
    /* authorizationChecker: async (action: Action, roles: string[]) => {
      const user = action.request.auth;
      if (user && roles.every(role => user.privileges.includes(role))) {
        return true;
      }
      return false;
    } */
  });

  return app;
};
