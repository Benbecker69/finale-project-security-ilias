import crypto from 'node:crypto';

// VULNERABLE: passwords are hashed with a single, unsalted SHA-256 pass.
// Fast hash + no salt => trivially brute-forced / rainbow-table-able.
// The secure branch replaces this with bcrypt (salted, slow KDF).
export function hashPassword(plain) {
  return crypto.createHash('sha256').update(String(plain)).digest('hex');
}

export function verifyPassword(plain, stored) {
  return hashPassword(plain) === stored;
}
