import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const productsRouter = Router();

// GET /api/products?search=...
// SECURED (SQL Injection): parameterized query (prepared statement). The search term
// is bound as a value and can never alter the SQL structure.
productsRouter.get('/', (req, res) => {
  const { search } = req.query;
  if (search !== undefined) {
    const like = `%${String(search)}%`;
    const rows = db
      .prepare('SELECT * FROM products WHERE name LIKE ? OR description LIKE ?')
      .all(like, like);
    return res.json(rows);
  }
  res.json(db.prepare('SELECT * FROM products').all());
});

// GET /api/products/:id
productsRouter.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products  — SECURED (Broken Access Control): admin only.
productsRouter.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, description, price, stock, image_url } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db
    .prepare('INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)')
    .run(name, description ?? '', Number(price) || 0, Number(stock) || 0, image_url ?? '');
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid));
});

// PUT /api/products/:id  — SECURED (Broken Access Control): admin only.
productsRouter.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const merged = {
    name: req.body.name ?? existing.name,
    description: req.body.description ?? existing.description,
    price: req.body.price ?? existing.price,
    stock: req.body.stock ?? existing.stock,
    image_url: req.body.image_url ?? existing.image_url,
  };
  db.prepare('UPDATE products SET name=?, description=?, price=?, stock=?, image_url=? WHERE id=?')
    .run(merged.name, merged.description, merged.price, merged.stock, merged.image_url, req.params.id);
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id));
});

// DELETE /api/products/:id  — SECURED (Broken Access Control): admin only.
productsRouter.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ----- Reviews -----

productsRouter.get('/:id/reviews', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC')
    .all(req.params.id);
  res.json(rows);
});

// POST /api/products/:id/reviews
// SECURED (Stored XSS): content is stored, but it is rendered as TEXT in the SPA
// (no v-html) and a strict Content-Security-Policy is enforced via Helmet. A length
// cap also limits abuse.
productsRouter.post('/:id/reviews', requireAuth, (req, res) => {
  const { content, rating } = req.body || {};
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content is required' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: 'content too long' });
  }
  const author = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id)?.username;
  const result = db
    .prepare('INSERT INTO reviews (product_id, user_id, author, content, rating) VALUES (?, ?, ?, ?, ?)')
    .run(req.params.id, req.user.id, author ?? 'anon', content, Number(rating) || 5);
  res.status(201).json(db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid));
});
