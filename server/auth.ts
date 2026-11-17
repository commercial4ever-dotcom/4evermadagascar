import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';
import { DATA_DIR, PersistenceUnavailableError, dbAll, dbGet, dbRun, isProductionMode } from './db.ts';
import { ensureLocalStorageDirs } from './r2.ts';
import { initializeStore, makeId, mapAdminUserRow, writeAuditLog } from './store.ts';
import type { AdminRole, AdminSessionRecord, AdminUserRecord, PublicAdminUser } from './types.ts';

const SECRET_FILE = path.join(DATA_DIR, '.session_secret');
export const SESSION_COOKIE_NAME = '4ever_admin_session';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUserRecord;
  adminSessionId?: string;
}

export function isSessionSecretConfigured(): boolean {
  return Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16);
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (isProductionMode()) {
    throw new PersistenceUnavailableError(
      'Mode production : variable serveur SESSION_SECRET requise (16 caractères min). Création de secret local interdite.',
    );
  }
  ensureLocalStorageDirs();
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

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) {
    return 'Le mot de passe doit contenir au moins 10 caractères.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
  }
  return null;
}

export function verifySetupToken(candidate: string): boolean {
  const expected = (process.env.ADMIN_SETUP_TOKEN || '').trim();
  if (!expected) return false;
  const a = Buffer.from(candidate.trim(), 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isSetupTokenConfigured(): boolean {
  return Boolean((process.env.ADMIN_SETUP_TOKEN || '').trim());
}

export async function isAdminConfigured(): Promise<boolean> {
  await initializeStore();
  const row = await dbGet<{ count: number }>('SELECT COUNT(*) AS count FROM admin_users');
  return Number(row?.count || 0) > 0;
}

export async function isSetupLocked(): Promise<boolean> {
  await initializeStore();
  if (await isAdminConfigured()) return true;
  const lockRow = await dbGet<{ value_json: string }>(
    'SELECT value_json FROM site_settings WHERE key = ?',
    ['_admin_setup_locked'],
  );
  return Boolean(lockRow);
}

export async function createInitialSuperAdmin(params: {
  email: string;
  name: string;
  password: string;
  ipAddress: string;
}): Promise<AdminUserRecord> {
  await initializeStore();
  if (await isSetupLocked()) {
    throw new Error('Initialisation déjà effectuée et verrouillée.');
  }

  const now = new Date().toISOString();
  const user: AdminUserRecord = {
    id: makeId('usr'),
    email: params.email.trim().toLowerCase(),
    name: params.name.trim() || 'Super Administrateur',
    role: 'SUPER_ADMIN',
    passwordHash: hashPassword(params.password),
    isActive: true,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await dbRun(
    `INSERT INTO admin_users (id, email, name, role, password_hash, is_active, last_login_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.email,
      user.name,
      user.role,
      user.passwordHash,
      1,
      user.lastLoginAt,
      user.createdAt,
      user.updatedAt,
    ],
  );

  // Permanently lock setup
  await dbRun(
    'INSERT OR IGNORE INTO site_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
    ['_admin_setup_locked', JSON.stringify({ lockedAt: now, superAdminId: user.id }), now],
  );

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ADMIN_SETUP',
    entityType: 'admin_users',
    entityId: user.id,
    summary: `Initialisation unique du compte Super Admin (${user.email}).`,
    ipAddress: params.ipAddress,
  });

  return user;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUserRecord | null> {
  await initializeStore();
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM admin_users WHERE email = ?', [
    email.trim().toLowerCase(),
  ]);
  return row ? mapAdminUserRow(row) : null;
}

export async function getAdminUserById(id: string): Promise<AdminUserRecord | null> {
  await initializeStore();
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM admin_users WHERE id = ?', [id]);
  return row ? mapAdminUserRow(row) : null;
}

export async function listPublicAdminUsers(): Promise<PublicAdminUser[]> {
  await initializeStore();
  const rows = await dbAll<Record<string, unknown>>(
    'SELECT id, email, name, role, is_active, last_login_at, created_at FROM admin_users ORDER BY created_at ASC',
  );
  return rows.map((r) => ({
    id: String(r.id),
    email: String(r.email),
    name: String(r.name || 'Collaborateur'),
    role: String(r.role || 'EDITOR') as AdminRole,
    isActive: Boolean(r.is_active),
    lastLoginAt: r.last_login_at ? String(r.last_login_at) : null,
    createdAt: String(r.created_at),
  }));
}

// ---------- BRUTE-FORCE PROTECTION ----------

export async function checkLoginLockout(
  identifier: string,
): Promise<{ locked: boolean; retryAfterSeconds: number }> {
  await initializeStore();
  const row = await dbGet<{ attempts: number; locked_until: string | null }>(
    'SELECT attempts, locked_until FROM login_attempts WHERE identifier = ?',
    [identifier],
  );
  if (!row || !row.locked_until) return { locked: false, retryAfterSeconds: 0 };
  const lockedUntilMs = Date.parse(row.locked_until);
  if (Number.isNaN(lockedUntilMs) || lockedUntilMs <= Date.now()) {
    await dbRun('DELETE FROM login_attempts WHERE identifier = ?', [identifier]);
    return { locked: false, retryAfterSeconds: 0 };
  }
  return {
    locked: true,
    retryAfterSeconds: Math.ceil((lockedUntilMs - Date.now()) / 1000),
  };
}

export async function recordFailedLogin(identifier: string): Promise<number> {
  await initializeStore();
  const row = await dbGet<{ attempts: number }>(
    'SELECT attempts FROM login_attempts WHERE identifier = ?',
    [identifier],
  );
  const attempts = Number(row?.attempts || 0) + 1;
  const now = new Date().toISOString();
  const lockedUntil =
    attempts >= MAX_FAILED_LOGIN_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
      : null;

  await dbRun(
    `INSERT INTO login_attempts (identifier, attempts, locked_until, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(identifier) DO UPDATE SET
       attempts = excluded.attempts,
       locked_until = excluded.locked_until,
       updated_at = excluded.updated_at`,
    [identifier, attempts, lockedUntil, now],
  );
  return attempts;
}

export async function clearFailedLogins(identifier: string): Promise<void> {
  await initializeStore();
  await dbRun('DELETE FROM login_attempts WHERE identifier = ?', [identifier]);
}

// ---------- REVOCABLE SESSIONS ----------

function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function signSessionIdAndSecret(sessionId: string, rawSecret: string): string {
  const payload = `${sessionId}.${rawSecret}`;
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function parseSignedCookie(cookieValue: string | undefined): { sessionId: string; rawSecret: string } | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split('.');
  if (parts.length !== 3) return null;
  const [sessionId, rawSecret, sig] = parts;
  if (!sessionId || !rawSecret || !sig) return null;

  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(`${sessionId}.${rawSecret}`)
    .digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { sessionId, rawSecret };
}

export async function createDbSession(params: {
  userId: string;
  ipAddress: string;
  userAgent: string;
}): Promise<{ cookieValue: string; sessionId: string }> {
  await initializeStore();
  const sessionId = makeId('ses');
  const rawSecret = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(rawSecret);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await dbRun(
    `INSERT INTO admin_sessions (id, user_id, token_hash, ip_address, user_agent, created_at, last_seen_at, expires_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      sessionId,
      params.userId,
      tokenHash,
      params.ipAddress.slice(0, 64),
      params.userAgent.slice(0, 240),
      now,
      now,
      expiresAt,
    ],
  );

  await dbRun('UPDATE admin_users SET last_login_at = ?, updated_at = ? WHERE id = ?', [
    now,
    now,
    params.userId,
  ]);

  return {
    cookieValue: signSessionIdAndSecret(sessionId, rawSecret),
    sessionId,
  };
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

export async function resolveAuthenticatedSession(
  req: Request,
): Promise<{ user: AdminUserRecord; session: AdminSessionRecord } | null> {
  await initializeStore();
  const cookies = parseCookies(req.headers.cookie);
  const parsed = parseSignedCookie(cookies[SESSION_COOKIE_NAME]);
  if (!parsed) return null;

  const sessionRow = await dbGet<Record<string, unknown>>(
    'SELECT * FROM admin_sessions WHERE id = ? AND revoked_at IS NULL',
    [parsed.sessionId],
  );
  if (!sessionRow) return null;

  const session: AdminSessionRecord = {
    id: String(sessionRow.id),
    userId: String(sessionRow.user_id),
    tokenHash: String(sessionRow.token_hash),
    ipAddress: String(sessionRow.ip_address || ''),
    userAgent: String(sessionRow.user_agent || ''),
    createdAt: String(sessionRow.created_at),
    lastSeenAt: String(sessionRow.last_seen_at),
    expiresAt: String(sessionRow.expires_at),
    revokedAt: sessionRow.revoked_at ? String(sessionRow.revoked_at) : null,
  };

  if (Date.parse(session.expiresAt) <= Date.now()) {
    return null;
  }

  const candidateHash = hashSessionToken(parsed.rawSecret);
  const a = Buffer.from(candidateHash, 'utf-8');
  const b = Buffer.from(session.tokenHash, 'utf-8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  const user = await getAdminUserById(session.userId);
  if (!user || !user.isActive) return null;

  // Throttle last_seen_at updates to once every 2 minutes
  if (Date.now() - Date.parse(session.lastSeenAt) > 120_000) {
    await dbRun('UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?', [
      new Date().toISOString(),
      session.id,
    ]);
  }

  return { user, session };
}

export async function revokeSessionById(sessionId: string, ownerUserId?: string): Promise<void> {
  await initializeStore();
  if (ownerUserId) {
    await dbRun(
      'UPDATE admin_sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
      [new Date().toISOString(), sessionId, ownerUserId],
    );
    return;
  }
  await dbRun('UPDATE admin_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL', [
    new Date().toISOString(),
    sessionId,
  ]);
}

export async function revokeOtherSessions(userId: string, currentSessionId?: string): Promise<void> {
  await initializeStore();
  const now = new Date().toISOString();
  if (currentSessionId) {
    await dbRun(
      'UPDATE admin_sessions SET revoked_at = ? WHERE user_id = ? AND id != ? AND revoked_at IS NULL',
      [now, userId, currentSessionId],
    );
  } else {
    await dbRun('UPDATE admin_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [
      now,
      userId,
    ]);
  }
}

export async function listUserActiveSessions(userId: string): Promise<AdminSessionRecord[]> {
  await initializeStore();
  const now = new Date().toISOString();
  const rows = await dbAll<Record<string, unknown>>(
    'SELECT * FROM admin_sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC',
    [userId, now],
  );
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    tokenHash: '',
    ipAddress: String(r.ip_address || ''),
    userAgent: String(r.user_agent || ''),
    createdAt: String(r.created_at),
    lastSeenAt: String(r.last_seen_at),
    expiresAt: String(r.expires_at),
    revokedAt: null,
  }));
}

export function getCookieOptions(req: Request) {
  const isHttps =
    process.env.NODE_ENV === 'production' ||
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isHttps,
    maxAge: SESSION_TTL_MS,
    path: '/',
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  resolveAuthenticatedSession(req)
    .then((resolved) => {
      if (!resolved) {
        res.status(401).json({ error: 'Authentification administrateur requise.' });
        return;
      }
      req.adminUser = resolved.user;
      req.adminSessionId = resolved.session.id;
      next();
    })
    .catch((err) => {
      if (err instanceof PersistenceUnavailableError) {
        res.status(503).json({
          error: err.message,
          code: 'PERSISTENCE_UNAVAILABLE',
        });
        return;
      }
      res.status(401).json({ error: 'Session invalide ou expirée.' });
    });
}

export function requireRole(allowedRoles: AdminRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    if (!allowedRoles.includes(req.adminUser.role)) {
      res.status(403).json({
        error: 'Droits insuffisants : action réservée au Super Administrateur ou rôle autorisé.',
      });
      return;
    }
    next();
  };
}
