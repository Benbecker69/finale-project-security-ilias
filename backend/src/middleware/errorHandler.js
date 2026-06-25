import { config } from '../config.js';

// SECURED: details are logged server-side only; the client receives a generic
// message with no stack trace (no Information Disclosure).
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[error]', err.message);
  const status = err.status || 500;
  const body = { error: status === 500 ? 'Internal server error' : err.message };
  // Stack is only ever included outside production, never in prod.
  if (config.nodeEnv !== 'production' && status === 500) {
    body.hint = 'See server logs for details';
  }
  res.status(status).json(body);
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}
