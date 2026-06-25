import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const adminRouter = Router();

// SECURED: every admin route now enforces requireAuth + requireAdmin, and never
// returns password hashes.
const PUBLIC_COLUMNS = 'id, username, email, role, created_at';

// GET /api/admin/users — admin only.
adminRouter.get('/users', requireAuth, requireAdmin, (req, res) => {
  res.json(db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM users`).all());
});

// DELETE /api/admin/users/:id — admin only.
adminRouter.delete('/users/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
