import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const usersRouter = Router();

// SECURED: never return the password hash — explicit column projection.
const PUBLIC_COLUMNS = 'id, username, email, role, created_at';

// GET /api/users/me — SECURED (Information Disclosure): no password field returned.
usersRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/users/me
// SECURED (Mass Assignment): only username and email can be updated. role/password are
// never accepted here, so a user cannot escalate privileges.
usersRouter.put('/me', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  const username = typeof req.body.username === 'string' ? req.body.username : existing.username;
  const email = typeof req.body.email === 'string' ? req.body.email : existing.email;
  db.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?').run(username, email, existing.id);
  res.json(db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`).get(existing.id));
});

// GET /api/users
// SECURED (Broken Access Control + Information Disclosure): admin only, no password.
usersRouter.get('/', requireAuth, requireAdmin, (req, res) => {
  res.json(db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM users`).all());
});
