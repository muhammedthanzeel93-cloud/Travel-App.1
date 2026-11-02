import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
dotenv.config();

const environment = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;

if (environment === 'production' && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
}

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/travel_buddy',
  jwtSecret: jwtSecret || randomBytes(48).toString('base64url'),
  environment,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4550'
};
