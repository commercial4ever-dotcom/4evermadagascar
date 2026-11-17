import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';
import { DATA_DIR, ensureDirectories, readDb } from './store.ts';

const SECRET_FILE = path.join(DATA_DIR, '.session_secret');
export const SESSION_COOKIE_NAME = '4ever_admin_session';

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  ensureDirectories();
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, 'utf-8').trim();
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, generated, { encoding: 'utf-8', mode: 0o600 });
  return generated;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

export function isAdminConfigured(): boolean {
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
    return true;
  }
  const db = readDb();
  return Boolean(db.admin && db.admin.email && db.admin.passwordHash);
}

export function getConfiguredAdmin(): { email: string; passwordHash: string } | null {
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
    return {
      email: process.env.ADMIN_EMAIL.trim().toLowerCase(),
      passwordHash: process.env.ADMIN_PASSWORD_HASH.trim(),
    };
  }
  const db = readDb();
  if (db.admin && db.admin.email && db.admin.passwordHash) {
    return {
      email: db.admin.email.trim().toLowerCase(),
      passwordHash: db.admin.passwordHash,
    };
  }
  return null;
}

interface SessionPayload {
  email: string;
  exp: number;
}

export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    email,
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload;
    if (!parsed.email || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

export function getAuthenticatedAdminEmail(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  const session = verifySessionToken(token);
  const configured = getConfiguredAdmin();
  if (!session || !configured) return null;
  if (session.email.toLowerCase() !== configured.email.toLowerCase()) return null;
  return configured.email;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const email = getAuthenticatedAdminEmail(req);
  if (!email) {
    res.status(401).json({ error: 'Authentification administrateur requise.' });
    return;
  }
  next();
}
