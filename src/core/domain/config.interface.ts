export interface IConfigApp {
  environment: string;
  appVersion: string;
  appName: string;
  port: number;
  dbConnectionString: string;
  localTimezone: string;
  googleMapsApiKey: string;
  whatsappNumber: string;
  jwtSecret: string;
  stripe: {
    publishableKey: string;
    webhookSecret: string;
    secretKey: string;
  },
  smtp: {
    fromAddress: string;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  },
  auth: {
    jwt: {
      secret: string;
      ttl: number;
      origin: string;
    };
  };
  logger: {
    level: string;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
}
