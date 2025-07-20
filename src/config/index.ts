import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT ?? 3000,
  NODE_ENV: process.env.NODE_ENV,
  API_PREFIX: '/api/v1',
  WHITELIST_ORIGIN: [
    'http://localhost:3000',
  ],
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  jwt: {
    secret: process.env.JWT_SECRET as string,

    expiresIn: process.env.JWT_EXPIRATION ?? '1d',
  },
 
};


export default config;
