import 'reflect-metadata';

import http from 'http';

import { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

import { expressApp } from './core/infrastructure/express-app';
import { envConfigs } from './core/infrastructure/get-configs';
import swaggerSpecGenerator from './core/infrastructure/swagger.config';

let httpServer: http.Server | undefined;
let isAppReady = false;

const startServer = async () => {
  const { port, appVersion } = envConfigs.getConfigs();
  const appServer = await expressApp();

  // Liveness probe - only checks if the app is running
  appServer.use('/liveness', (req: Request, res: Response) =>
    res.status(200).json({
      status: 'ok',
      appVersion,
      timestamp: new Date().toISOString(),
    }),
  );

  // Readiness probe - checks if app is ready to receive traffic
  appServer.use('/readiness', (req: Request, res: Response) => {
    const checks = {
      server: isAppReady,
    };

    const isReady = Object.values(checks).every(check => check === true);

    if (isReady) {
      res.status(200).json({
        status: 'pass',
        checks,
        appVersion,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(503).json({
      status: 'fail',
      checks,
      appVersion,
      timestamp: new Date().toISOString(),
    });
  });

  if (envConfigs.getConfigs().environment === 'localhost') {
    const swaggerOptions = swaggerSpecGenerator();
    appServer.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerOptions));
  }

  httpServer = new http.Server(appServer);

  httpServer.listen(port, () => {
    isAppReady = true;
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`✨ Open Swagger at http://localhost:${port}/swagger`);
    console.log(`🏥 Health check available at http://localhost:${port}/liveness`);
    console.log(`✅ Readiness check available at http://localhost:${port}/readiness`);
  });
};

startServer();

const dieGracefully = async (reason: string, error?: Error) => {
  console.log(error);
  console.error(`Terminating gracefully | Reason: ${reason} | Error: ${error}`);

  if (!httpServer) {
    console.log('⛔️ HTTP Server not started. Exiting without closing servers');
    if (error) {
      return process.exit(1);
    } else {
      return process.exit(0);
    }
  }

  httpServer.close((httpServerError) => {
    console.log('⛔️ HTTP Server closed');

    if (httpServerError) {
      console.error({ httpServerError });
    }
  });
};

/* process.on('unhandledRejection', (err: Error) =>
  dieGracefully('unhandledRejection', err)
);
process.on('uncaughtException', (err: Error) =>
  dieGracefully('unhandledException', err)
); */
process.on('SIGTERM', () => dieGracefully('SIGTERM'));
process.on('SIGINT', () => dieGracefully('SIGINT'));
