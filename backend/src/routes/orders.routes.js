import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const ordersRouter = Router();

// GET /api/orders — list the current user's own orders.
ordersRouter.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  res.json(rows);
});

// GET /api/orders/:id
// SECURED (IDOR / BOLA): the order is fetched with an ownership constraint, so a user
// can only read their own orders. A foreign id yields 404 (no existence leak).
ordersRouter.get('/:id', requireAuth, (req, res) => {
  const order = db
    .prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// POST /api/orders
// SECURED (Mass Assignment): status and total are NEVER taken from the body. The total
// is computed server-side from current product prices; status is forced to "pending".
ordersRouter.post('/', requireAuth, (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required' });
  }

  let orderTotal = 0;
  const priced = [];
  for (const it of items) {
    const p = db.prepare('SELECT id, price FROM products WHERE id = ?').get(it.product_id);
    if (!p) return res.status(400).json({ error: `Unknown product ${it.product_id}` });
    const qty = Math.max(1, Number(it.quantity) || 1);
    orderTotal += p.price * qty;
    priced.push({ product_id: p.id, quantity: qty, price: p.price });
  }

  const result = db
    .prepare('INSERT INTO orders (user_id, status, total) VALUES (?, ?, ?)')
    .run(req.user.id, 'pending', orderTotal); // status/total server-controlled
  const orderId = result.lastInsertRowid;

  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
  );
  for (const it of priced) insertItem.run(orderId, it.product_id, it.quantity, it.price);

  res.status(201).json(db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId));
});
