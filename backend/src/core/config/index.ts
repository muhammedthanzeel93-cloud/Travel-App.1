import dotenv from 'dotenv';
dotenv.config();

const environment = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;

// 🔒 FAIL-FAST ZERO-TRUST SECURITY: In production, require strict secrets from environment!
if (environment === 'production' && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('🛑 FATAL SECURITY CONFIGURATION: In production, JWT_SECRET must be set and be at least 32 characters long!');
}

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/travel_buddy',
  jwtSecret: jwtSecret || 'travel_super_secret_jwt_key_dev_mode_only_2026',
  environment,
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
