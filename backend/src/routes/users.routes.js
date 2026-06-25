import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const usersRouter = Router();

// GET /api/users/me
// VULNERABLE (Information Disclosure): returns the full user row, including the
// password hash. The API should never expose password material.
usersRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user); // includes password hash + role
});

// PUT /api/users/me
// VULNERABLE (Mass Assignment / Privilege Escalation): every field of req.body is
// merged into the user, so a normal user can promote themselves:
//   PUT /api/users/me   { "role":"admin" }
usersRouter.put('/me', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  const merged = { ...existing, ...req.body }; // <-- unfiltered merge
  db.prepare('UPDATE users SET username=?, email=?, password=?, role=? WHERE id=?')
    .run(merged.username, merged.email, merged.password, merged.role, existing.id);
  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id));
});

// GET /api/users
// VULNERABLE (Broken Access Control + Information Disclosure): no role check and
// returns sensitive columns for every user.
usersRouter.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, username, email, password, role, created_at FROM users').all();
  res.json(rows);
});
