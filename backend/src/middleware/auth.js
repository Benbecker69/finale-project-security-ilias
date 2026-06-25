import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// SECURED: verifies the Bearer JWT with a strong secret; tokens expire (see config).
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    // SECURED: generic message, no error detail leaked.
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// SECURED: enforces the admin role on sensitive routes (server-side check).
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
