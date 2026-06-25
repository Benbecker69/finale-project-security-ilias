// VULNERABLE: the global error handler leaks the full stack trace and error
// message to the client (Information Disclosure). This reveals file paths,
// library versions and internal logic. The secure branch returns a generic
// message and logs details server-side only.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message,
    stack: err.stack,
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}
