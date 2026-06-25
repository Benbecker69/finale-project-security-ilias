import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initSchema } from './db.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  initSchema();
  const app = express();

  // VULNERABLE (CORS misconfiguration): every origin is reflected AND credentials
  // are allowed. Combined with tokens, this lets any malicious site call the API
  // on behalf of a logged-in victim.
  app.use(cors({ origin: true, credentials: true }));

  // VULNERABLE (Security Misconfiguration): no Helmet / no security headers
  // (no CSP, no HSTS, no X-Frame-Options, no X-Content-Type-Options...).

  app.use(express.json());

  // VULNERABLE (Information Disclosure): verbose request logging that includes
  // the Authorization header (tokens end up in the logs).
  app.use((req, _res, next) => {
    console.log(`[req] ${req.method} ${req.originalUrl} auth=${req.headers.authorization || '-'}`);
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // VULNERABLE (Information Disclosure): unauthenticated debug endpoint exposing
  // configuration, secrets and the full process environment.
  app.get('/api/debug', (_req, res) => {
    res.json({
      nodeEnv: config.nodeEnv,
      jwtSecret: config.jwtSecret,
      jwtExpiresIn: config.jwtExpiresIn || '(none)',
      stripeSecretKey: config.stripeSecretKey,
      env: process.env,
      versions: process.versions,
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
