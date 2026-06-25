import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// VULNERABLE: weak fallback secret + secret loaded from a committed .env file.
// There is also NO token expiration by default (JWT_EXPIRES_IN empty).
export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'secret123',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '', // empty => token never expires
  corsOrigin: process.env.CORS_ORIGIN || '*',
  // Exposed on purpose through the /api/debug endpoint (Information Disclosure)
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
};

export const dbPath = path.join(__dirname, '..', 'data', 'shopsec.sqlite');
