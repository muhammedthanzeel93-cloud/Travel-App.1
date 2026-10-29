import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/travel_buddy',
  jwtSecret: process.env.JWT_SECRET || 'travel_super_secret_jwt_key_2026',
  environment: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  airlineCodes: {
    EK: 'Emirates',
    AI: 'Air India',
    IX: 'Air India Express',
    FZ: 'Flydubai',
    '6E': 'IndiGo',
    QR: 'Qatar Airways'
  },
  railZones: {
    '421': 'Southern Railway (Calicut)',
    '126': 'Northern Railway (Delhi)',
    '234': 'South Central Railway (Secunderabad)'
  }
};
