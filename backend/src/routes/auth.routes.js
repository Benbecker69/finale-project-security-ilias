import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { config } from '../config.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';

export const authRouter = Router();

// SECURED: rate limiting on auth endpoints to slow down brute force / enumeration.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
  // Disabled under the test runner so functional tests stay deterministic.
  skip: () => process.env.NODE_ENV === 'test',
});

function signToken(user) {
  const payload = { id: user.id, role: user.role, email: user.email };
  // SECURED: strong secret + expiration.
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

// Only expose safe user fields (never the password hash).
function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email, role: user.role };
}

// POST /api/auth/register
// SECURED (Mass Assignment): only an explicit whitelist of fields is read, and the
// role is ALWAYS forced to "user" — it can never be set from the request body.
authRouter.post('/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  try {
    const result = db
      .prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)')
      .run(username, email, await hashPassword(password), 'user');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// POST /api/auth/login
// SECURED (Weak Authentication): single generic error message (no user enumeration),
// bcrypt verification, rate limiting, expiring token.
authRouter.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const ok = user && (await verifyPassword(password, user.password));
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.json({ token: signToken(user), user: publicUser(user) });
});
