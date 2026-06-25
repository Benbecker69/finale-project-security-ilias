import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Verifies the Bearer JWT and attaches req.user = { id, role, ... }.
// VULNERABLE: token signed with a weak secret and (by default) no expiration,
// so a leaked/guessed token is valid forever.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', detail: err.message });
  }
}

// NOTE (VULNERABLE): there is intentionally NO working role-enforcement middleware
// applied on the admin routes in this branch. Admin endpoints only call requireAuth,
// so any authenticated user (role "user") can reach them => Broken Access Control.
// The secure branch introduces and applies a real requireAdmin middleware.
