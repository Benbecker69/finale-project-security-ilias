import { createApp } from './app.js';
import { config } from './config.js';
import { db, initSchema } from './db.js';
import { seed } from './seed.js';

// Auto-seed on first run if the database is empty (developer convenience).
initSchema();
const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (userCount === 0) {
  console.log('[server] empty database detected, seeding...');
  await seed();
}

const app = createApp();
app.listen(config.port, () => {
  console.log(`[server] ShopSec API (SECURE build) listening on http://localhost:${config.port}`);
});
