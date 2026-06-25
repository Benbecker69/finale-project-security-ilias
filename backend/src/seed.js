import { db, initSchema } from './db.js';
import { hashPassword } from './utils/crypto.js';

// Re-creatable seed: wipes business tables and re-inserts deterministic demo data.
export function seed() {
  initSchema();

  db.exec('DELETE FROM reviews;');
  db.exec('DELETE FROM order_items;');
  db.exec('DELETE FROM orders;');
  db.exec('DELETE FROM products;');
  db.exec('DELETE FROM users;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users','products','orders','order_items','reviews');");

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
  );
  // Test accounts (documented in README)
  insertUser.run('admin', 'admin@shopsec.local', hashPassword('Admin123!'), 'admin');
  insertUser.run('alice', 'alice@shopsec.local', hashPassword('Alice123!'), 'user');
  insertUser.run('bob', 'bob@shopsec.local', hashPassword('Bob123!'), 'user');

  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)'
  );
  insertProduct.run('Mechanical Keyboard', 'Tactile RGB mechanical keyboard', 89.9, 25, 'https://picsum.photos/seed/kbd/400');
  insertProduct.run('Wireless Mouse', 'Ergonomic 2.4GHz wireless mouse', 29.5, 60, 'https://picsum.photos/seed/mouse/400');
  insertProduct.run('27\" Monitor', '27 inch QHD 144Hz monitor', 259.0, 12, 'https://picsum.photos/seed/mon/400');
  insertProduct.run('USB-C Hub', '7-in-1 USB-C hub', 39.9, 40, 'https://picsum.photos/seed/hub/400');

  // Orders: order #1 belongs to alice (id 2), order #2 belongs to bob (id 3).
  // order #2 is the IDOR target (alice tries to read bob's order).
  const insertOrder = db.prepare(
    'INSERT INTO orders (user_id, status, total) VALUES (?, ?, ?)'
  );
  insertOrder.run(2, 'paid', 119.4);   // order #1 -> alice
  insertOrder.run(3, 'paid', 259.0);   // order #2 -> bob (sensitive: IDOR target)

  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
  );
  insertItem.run(1, 1, 1, 89.9);
  insertItem.run(1, 2, 1, 29.5);
  insertItem.run(2, 3, 1, 259.0);

  const insertReview = db.prepare(
    'INSERT INTO reviews (product_id, user_id, author, content, rating) VALUES (?, ?, ?, ?, ?)'
  );
  insertReview.run(1, 2, 'alice', 'Great keyboard, very tactile!', 5);
  insertReview.run(1, 3, 'bob', 'A bit loud but solid.', 4);

  console.log('[seed] Database seeded:', dbStats());
}

function dbStats() {
  const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
  return {
    users: count('users'),
    products: count('products'),
    orders: count('orders'),
    reviews: count('reviews'),
  };
}

// Allow `npm run seed`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.js')) {
  seed();
}
