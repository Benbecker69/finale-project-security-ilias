import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

  // SECURED (Security headers): Helmet sets CSP, HSTS, X-Frame-Options,
  // X-Content-Type-Options, Referrer-Policy, etc. A strict default-src 'self' CSP is
  // defense-in-depth against XSS.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'img-src': ["'self'", 'data:', 'https:'],
          'script-src': ["'self'"],
          'object-src': ["'none'"],
          'frame-ancestors': ["'none'"],
        },
      },
    })
  );

  // SECURED (CORS): explicit allowlist of origins, no wildcard reflection.
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '100kb' }));

  // SECURED (Information Disclosure): minimal request logging WITHOUT the Authorization header.
  app.use((req, _res, next) => {
    console.log(`[req] ${req.method} ${req.originalUrl}`);
    next();
  });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // SECURED: the /api/debug endpoint that leaked config/secrets has been REMOVED.

  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
