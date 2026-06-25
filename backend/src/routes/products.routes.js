import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const productsRouter = Router();

// GET /api/products?search=...
// VULNERABLE (SQL Injection): the search term is concatenated directly into the
// SQL string. Example dump-users payload (products has 7 columns):
//   ?search=zzz' UNION SELECT id, username, email, password, role, 'x', created_at FROM users --
productsRouter.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM products';
  if (search !== undefined) {
    sql += ` WHERE name LIKE '%${search}%' OR description LIKE '%${search}%'`;
  }
  const rows = db.prepare(sql).all();
  res.json(rows);
});

// GET /api/products/:id
productsRouter.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products  (creation — should be admin-only)
// VULNERABLE (Broken Access Control): only requireAuth is applied, there is NO role
// check, so any logged-in "user" can create products.
productsRouter.post('/', requireAuth, (req, res) => {
  const { name, description, price, stock, image_url } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db
    .prepare('INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)')
    .run(name, description ?? '', Number(price) || 0, Number(stock) || 0, image_url ?? '');
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

// PUT /api/products/:id  (update — should be admin-only)
// VULNERABLE (Broken Access Control): no role check, so any user can change a
// product, including its price.
productsRouter.put('/:id', requireAuth, (req, res) => {
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

// DELETE /api/products/:id  (should be admin-only)
// VULNERABLE (Broken Access Control): no role check.
productsRouter.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// ----- Reviews (nested under a product) -----

// GET /api/products/:id/reviews
productsRouter.get('/:id/reviews', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC')
    .all(req.params.id);
  res.json(rows);
});

// POST /api/products/:id/reviews
// VULNERABLE (Stored XSS): review content is stored raw, with no sanitization or
// encoding. The Vue frontend renders it with v-html, so a payload such as
//   <img src=x onerror=alert(document.cookie)>
// executes for every visitor of the product page.
productsRouter.post('/:id/reviews', requireAuth, (req, res) => {
  const { content, rating } = req.body || {};
  if (!content) return res.status(400).json({ error: 'content is required' });
  const author = db.prepare('SELECT username FROM users WHERE id = ?').get(req.user.id)?.username;
  const result = db
    .prepare('INSERT INTO reviews (product_id, user_id, author, content, rating) VALUES (?, ?, ?, ?, ?)')
    .run(req.params.id, req.user.id, author ?? 'anon', content, Number(rating) || 5);
  res.status(201).json(db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid));
});
