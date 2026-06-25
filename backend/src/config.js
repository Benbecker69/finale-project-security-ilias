import dotenv from 'dotenv';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// SECURED: the JWT secret comes from the environment (never committed). In production
// it is REQUIRED; in dev we fall back to an ephemeral random secret so the app still
// runs without shipping a hardcoded secret in the repo.
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  jwtSecret = crypto.randomBytes(32).toString('hex');
  console.warn('[config] JWT_SECRET not set — using an ephemeral random secret for this run.');
}

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret,
  // SECURED: tokens always expire.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  // SECURED: explicit allowlist of origins (no wildcard reflection).
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export const dbPath = path.join(__dirname, '..', 'data', 'shopsec.sqlite');
