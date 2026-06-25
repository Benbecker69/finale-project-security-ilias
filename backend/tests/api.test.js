import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seed } from '../src/seed.js';

let app;

beforeAll(async () => {
  await seed();
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

  it('logs in a seeded user (bcrypt)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@shopsec.local', password: 'Alice123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('user');
    // SECURED: no password field in the auth response.
    expect(res.body.user.password).toBeUndefined();
  });

  it('lists products and a single product', async () => {
    const list = await request(app).get('/api/products');
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);
    const one = await request(app).get('/api/products/1');
    expect(one.body.id).toBe(1);
  });

  it('lists the authenticated user own orders', async () => {
    const token = await login('alice@shopsec.local', 'Alice123!');
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('requires a token for protected routes', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('ShopSec API — security regression (fixes)', () => {
  it('VULN-01 IDOR: cannot read another user order (404)', async () => {
    const alice = await login('alice@shopsec.local', 'Alice123!');
    const res = await request(app).get('/api/orders/2').set('Authorization', `Bearer ${alice}`);
    expect(res.status).toBe(404); // order #2 belongs to bob
  });

  it('VULN-02 SQLi: UNION payload returns no leaked rows', async () => {
    const payload = "zzz' UNION SELECT id, username, email, password, role, 'x', created_at FROM users -- ";
    const res = await request(app).get('/api/products').query({ search: payload });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0); // injection treated as literal text
  });

  it('VULN-04 weak auth: generic error, no user enumeration', async () => {
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@x.com', password: 'x' });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'alice@shopsec.local', password: 'x' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error).toBe(wrong.body.error); // identical message
  });

  it('VULN-05 mass assignment: role cannot be set at register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'mallory', email: `m${Date.now()}@x.com`, password: 'x', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });

  it('VULN-05 mass assignment: role cannot be changed via PUT /users/me', async () => {
    const bob = await login('bob@shopsec.local', 'Bob123!');
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${bob}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('user');
  });

  it('VULN-06 info disclosure: /api/debug is removed (404)', async () => {
    const res = await request(app).get('/api/debug');
    expect(res.status).toBe(404);
  });

  it('VULN-06 info disclosure: /api/users/me does not leak the password hash', async () => {
    const alice = await login('alice@shopsec.local', 'Alice123!');
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${alice}`);
    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
  });

  it('VULN-06 security headers: Helmet sets a CSP and X-Frame-Options', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toBeTruthy();
    expect(res.headers['x-frame-options']).toBeTruthy();
  });

  it('VULN-07 broken access control: a normal user gets 403 on admin route', async () => {
    const alice = await login('alice@shopsec.local', 'Alice123!');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${alice}`);
    expect(res.status).toBe(403);
  });

  it('VULN-07: an admin can access the admin route (200, no password field)', async () => {
    const admin = await login('admin@shopsec.local', 'Admin123!');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(200);
    expect(res.body[0].password).toBeUndefined();
  });

  it('VULN-09 token: a token forged with the old weak secret is rejected', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const forged = jwt.sign({ id: 999, role: 'admin' }, 'secret123');
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });
});
