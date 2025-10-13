import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload) {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}