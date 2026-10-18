import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pg } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'formforge-dev-secret-key-123456789';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(email: string, password: string, name: string): Promise<AuthenticatedUser> {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Check if user already exists
  const existing = await pg.query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [normalizedEmail]
  );
  if (existing.rows.length > 0) {
    throw new Error('A user with this email address already exists.');
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();

  await pg.query(
    'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
    [id, normalizedEmail, passwordHash, name.trim()]
  );

  return {
    id,
    email: normalizedEmail,
    name: name.trim(),
  };
}

export async function authenticateUser(email: string, password: string): Promise<AuthenticatedUser> {
  const normalizedEmail = email.trim().toLowerCase();
  
  const result = await pg.query<{ id: string; email: string; name: string; password_hash: string }>(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1 LIMIT 1',
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password.');
  }

  const user = result.rows[0];
  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const result = await pg.query<{ id: string; email: string; name: string }>(
    'SELECT id, email, name FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      req.user = decoded;
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}
