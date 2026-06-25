import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const ordersRouter = Router();

// GET /api/orders  — list the current user's own orders (this part is fine).
ordersRouter.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  res.json(rows);
});

// GET /api/orders/:id
// VULNERABLE (IDOR / BOLA): the order is fetched by id only, with no check that
// it belongs to the authenticated user. user1 can read user2's order:
//   GET /api/orders/2   Authorization: Bearer <alice_token>   -> returns bob's order
ordersRouter.get('/:id', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// POST /api/orders
// VULNERABLE (Mass Assignment): "status" and "total" are accepted from the body,
// so a buyer can mark an order as paid for a total of 0:
//   { "items":[{"product_id":3,"quantity":1}], "status":"paid", "total":0 }
ordersRouter.post('/', requireAuth, (req, res) => {
  const { items, status, total } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items are required' });
  }
  const orderTotal = total ?? items.reduce((sum, it) => {
    const p = db.prepare('SELECT price FROM products WHERE id = ?').get(it.product_id);
    return sum + (p ? p.price * (it.quantity || 1) : 0);
  }, 0);
  const orderStatus = status ?? 'pending'; // <-- attacker-controlled

  const result = db
    .prepare('INSERT INTO orders (user_id, status, total) VALUES (?, ?, ?)')
    .run(req.user.id, orderStatus, orderTotal);
  const orderId = result.lastInsertRowid;

  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
  );
  for (const it of items) {
    const p = db.prepare('SELECT price FROM products WHERE id = ?').get(it.product_id);
    insertItem.run(orderId, it.product_id, it.quantity || 1, p ? p.price : 0);
  }
  res.status(201).json(db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId));
});
