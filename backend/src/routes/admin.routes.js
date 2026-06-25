import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const adminRouter = Router();

// GET /api/admin/users
// VULNERABLE (Broken Access Control): an "admin" endpoint protected only by
// requireAuth. Any authenticated user (role "user") can list every account,
// including password hashes.
adminRouter.get('/users', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM users').all();
  res.json(rows);
});

// DELETE /api/admin/users/:id
// VULNERABLE (Broken Access Control): any authenticated user can delete accounts.
adminRouter.delete('/users/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
