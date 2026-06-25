import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { config } from '../config.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';

export const authRouter = Router();

function signToken(user) {
  const payload = { id: user.id, role: user.role, email: user.email };
  // VULNERABLE: weak secret, and no expiration when JWT_EXPIRES_IN is empty.
  const options = config.jwtExpiresIn ? { expiresIn: config.jwtExpiresIn } : {};
  return jwt.sign(payload, config.jwtSecret, options);
}

// POST /api/auth/register
// VULNERABLE (Mass Assignment): the "role" field is taken straight from the
// request body, so an attacker can register directly as an admin:
//   { "username":"x","email":"x@x","password":"x","role":"admin" }
authRouter.post('/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  const role = req.body.role || 'user'; // <-- attacker-controlled privilege
  try {
    const result = db
      .prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)')
      .run(username, email, hashPassword(password), role);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// POST /api/auth/login
// VULNERABLE (Weak Authentication):
//  - distinct error messages enable user enumeration,
//  - no rate limiting => brute force possible,
//  - weak token (see signToken).
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'No account found for this email' }); // enumeration
  }
  if (!verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Incorrect password' }); // enumeration
  }
  return res.json({ token: signToken(user), user });
});
