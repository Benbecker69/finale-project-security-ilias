import bcrypt from 'bcryptjs';

// SECURED: passwords are hashed with bcrypt (per-password salt + slow KDF).
// Replaces the unsalted SHA-256 of the vulnerable branch.
const ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), ROUNDS);
}

export async function verifyPassword(plain, stored) {
  try {
    return await bcrypt.compare(String(plain), stored);
  } catch {
    return false;
  }
}
