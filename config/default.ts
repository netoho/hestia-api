// istanbul ignore file
import dotenv from 'dotenv';

import { version } from '../package.json';
import { IConfigApp } from '../src/core/domain/config.interface';
import { DeepPartial } from '../src/core/domain/types/deep-partial';

// eslint-disable-next-line no-unused-expressions
dotenv.config().parsed;

const defaultConfig: DeepPartial<IConfigApp> = {
  dbConnectionString: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  environment: process.env.NODE_ENV,
  port: parseInt(process.env.PORT!) || 8000,
  appVersion: version,
  localTimezone: process.env.LOCAL_TIME_ZONE || 'America/Mexico_City',
  appName: process.env.APP_NAME || 'NODE_BASE',
  auth: {
    jwt: {
      secret: process.env.AUTH_JWT_SECRET || 'secret',
      ttl: parseInt(process.env.AUTH_JWT_EXPIRATION ?? '3600'),
      origin: process.env.AUTH_JWT_ORIGIN || 'finance-api',
    },
  },
  logger: { level: process.env.LOG_LEVEL || 'info' },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_S3_REGION,
    bucket: process.env.AWS_S3_BUCKET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT!),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromAddress: process.env.EMAIL_FROM,
  },
  whatsappNumber: process.env.WHATSAPP_NUMBER,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
};

module.exports = defaultConfig;

