import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seed } from '../src/seed.js';

let app;

beforeAll(() => {
  seed();
  app = createApp();
});

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

describe('ShopSec API — functional', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('logs in a seeded user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@shopsec.local', password: 'Alice123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('user');
  });

  it('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@shopsec.local', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('lists products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns a single product', async () => {
    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('lists the authenticated user own orders', async () => {
    const token = await login('alice@shopsec.local', 'Alice123!');
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('creates and lists a review', async () => {
    const token = await login('alice@shopsec.local', 'Alice123!');
    const create = await request(app)
      .post('/api/products/1/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Solid product', rating: 4 });
    expect(create.status).toBe(201);
    const list = await request(app).get('/api/products/1/reviews');
    expect(list.status).toBe(200);
    expect(list.body.some((r) => r.content === 'Solid product')).toBe(true);
  });

  it('requires a token for protected routes', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});
