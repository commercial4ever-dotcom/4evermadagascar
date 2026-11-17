import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type DbDriverType = 'd1-worker' | 'd1-api' | 'sqlite-local' | 'unconfigured';

export const DATA_DIR = path.resolve(process.cwd(), 'data');
export const SQLITE_PATH = path.join(DATA_DIR, '4ever.sqlite');
export const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

let localDbInstance: DatabaseSync | null = null;
let initPromise: Promise<void> | null = null;

export class PersistenceUnavailableError extends Error {
  statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = 'PersistenceUnavailableError';
  }
}

export function isProductionMode(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getDbDriver(): DbDriverType {
  if (process.env.CLOUDFLARE_D1_BRIDGE_URL && process.env.CLOUDFLARE_D1_BRIDGE_TOKEN) {
    return 'd1-worker';
  }
  if (
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_D1_DATABASE_ID &&
    process.env.CLOUDFLARE_API_TOKEN
  ) {
    return 'd1-api';
  }
  if (isProductionMode()) {
    return 'unconfigured';
  }
  return 'sqlite-local';
}

export function assertDbConfiguredForEnv(): Exclude<DbDriverType, 'unconfigured'> {
  const driver = getDbDriver();
  if (driver === 'unconfigured') {
    throw new PersistenceUnavailableError(
      'Mode production : connexion Cloudflare D1 non configurée (CLOUDFLARE_D1_* requis). Repli SQLite local strictement interdit pour éviter toute perte de données.',
    );
  }
  return driver;
}

function getLocalDb(): DatabaseSync {
  if (isProductionMode()) {
    throw new PersistenceUnavailableError(
      'Accès SQLite local interdit en mode production.',
    );
  }
  if (!localDbInstance) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    localDbInstance = new DatabaseSync(SQLITE_PATH);
    localDbInstance.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  }
  return localDbInstance;
}

type SqlParam = string | number | null | Uint8Array;

function normalizeParams(params: unknown[]): SqlParam[] {
  return params.map((p) => {
    if (p === undefined || p === null) return null;
    if (typeof p === 'boolean') return p ? 1 : 0;
    if (typeof p === 'string' || typeof p === 'number' || p instanceof Uint8Array) return p;
    return String(p);
  });
}

async function queryD1Worker<T>(
  sql: string,
  params: SqlParam[],
  mode: 'all' | 'run',
): Promise<T[]> {
  const url = process.env.CLOUDFLARE_D1_BRIDGE_URL!;
  const token = process.env.CLOUDFLARE_D1_BRIDGE_TOKEN!;
  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sql, params, mode }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new PersistenceUnavailableError(
      `Cloudflare D1 Worker Bridge inaccessible : ${err instanceof Error ? err.message : 'erreur réseau'}`,
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new PersistenceUnavailableError(
      `Erreur Cloudflare D1 Worker Bridge (${res.status}) : ${errText}`,
    );
  }
  const json = (await res.json()) as { results?: T[]; error?: string };
  if (json.error) {
    throw new PersistenceUnavailableError(`Erreur D1 Worker Bridge : ${json.error}`);
  }
  return Array.isArray(json.results) ? json.results : [];
}

async function queryD1RestApi<T>(sql: string, params: SqlParam[]): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID!;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN!;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  let res: globalThis.Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ sql, params }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new PersistenceUnavailableError(
      `Cloudflare D1 API inaccessible : ${err instanceof Error ? err.message : 'erreur réseau'}`,
    );
  }

  const json = (await res.json()) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: Array<{ results?: T[]; success?: boolean }>;
  };

  if (!res.ok || !json.success) {
    const msg = json.errors?.map((e) => e.message).filter(Boolean).join('; ') || res.statusText;
    throw new PersistenceUnavailableError(`Erreur Cloudflare D1 API (${res.status}) : ${msg}`);
  }

  return Array.isArray(json.result?.[0]?.results) ? json.result[0].results : [];
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const driver = assertDbConfiguredForEnv();
  const cleanParams = normalizeParams(params);

  if (driver === 'd1-worker') {
    return queryD1Worker<T>(sql, cleanParams, 'all');
  }
  if (driver === 'd1-api') {
    return queryD1RestApi<T>(sql, cleanParams);
  }

  const db = getLocalDb();
  const stmt = db.prepare(sql);
  return stmt.all(...cleanParams) as T[];
}

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await dbAll<T>(sql, params);
  return rows[0] ?? null;
}

export async function dbRun(sql: string, params: unknown[] = []): Promise<void> {
  const driver = assertDbConfiguredForEnv();
  const cleanParams = normalizeParams(params);

  if (driver === 'd1-worker') {
    await queryD1Worker(sql, cleanParams, 'run');
    return;
  }
  if (driver === 'd1-api') {
    await queryD1RestApi(sql, cleanParams);
    return;
  }

  const db = getLocalDb();
  const stmt = db.prepare(sql);
  stmt.run(...cleanParams);
}

function splitSqlStatements(sqlContent: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inLineComment = false;

  for (let i = 0; i < sqlContent.length; i += 1) {
    const ch = sqlContent[i];
    const next = sqlContent[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (!inSingleQuote && ch === '-' && next === '-') {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === "'") {
      if (inSingleQuote && next === "'") {
        current += "''";
        i += 1;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += ch;
      continue;
    }

    if (!inSingleQuote && ch === ';') {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail.length > 0) {
    statements.push(tail);
  }
  return statements;
}

export async function ensureDatabaseInitialized(): Promise<void> {
  assertDbConfiguredForEnv();
  if (!initPromise) {
    initPromise = runMigrations().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

async function runMigrations(): Promise<void> {
  if (!fs.existsSync(MIGRATIONS_DIR)) return;
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const driver = assertDbConfiguredForEnv();

  await dbRun(
    'CREATE TABLE IF NOT EXISTS _schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
  );

  const appliedRows = await dbAll<{ version: string }>('SELECT version FROM _schema_migrations');
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  for (const file of files) {
    if (appliedSet.has(file)) continue;
    const rawSql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

    if (driver === 'sqlite-local') {
      getLocalDb().exec(rawSql);
    } else {
      const statements = splitSqlStatements(rawSql);
      for (const stmt of statements) {
        await dbRun(stmt);
      }
    }

    await dbRun(
      'INSERT OR IGNORE INTO _schema_migrations (version, applied_at) VALUES (?, ?)',
      [file, new Date().toISOString()],
    );
  }
}

export async function testDatabaseConnection(): Promise<{
  ok: boolean;
  configured: boolean;
  driver: DbDriverType;
  latencyMs: number;
  message: string;
}> {
  const driver = getDbDriver();
  const started = Date.now();
  if (driver === 'unconfigured') {
    return {
      ok: false,
      configured: false,
      driver,
      latencyMs: Date.now() - started,
      message:
        'Mode production : Cloudflare D1 non configuré. Repli SQLite bloqué pour empêcher toute perte de données.',
    };
  }

  try {
    await ensureDatabaseInitialized();
    const token = `check_${Date.now()}`;
    await dbRun(
      'INSERT INTO site_settings (key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at',
      ['_healthcheck_d1', JSON.stringify({ token }), new Date().toISOString()],
    );
    const row = await dbGet<{ value_json: string }>(
      'SELECT value_json FROM site_settings WHERE key = ?',
      ['_healthcheck_d1'],
    );
    await dbRun('DELETE FROM site_settings WHERE key = ?', ['_healthcheck_d1']);

    const valid = Boolean(row && row.value_json.includes(token));
    return {
      ok: valid,
      configured: driver !== 'sqlite-local',
      driver,
      latencyMs: Date.now() - started,
      message: valid
        ? driver === 'sqlite-local'
          ? 'Test lecture/écriture SQLite local réussi (développement local uniquement).'
          : `Test lecture/écriture et persistance Cloudflare D1 (${driver}) réussi.`
        : 'Vérification lecture/écriture incohérente.',
    };
  } catch (err) {
    return {
      ok: false,
      configured: driver !== 'sqlite-local',
      driver,
      latencyMs: Date.now() - started,
      message: err instanceof Error ? err.message : 'Erreur inconnue de connexion base de données.',
    };
  }
}
