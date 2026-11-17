import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { DATA_DIR, PersistenceUnavailableError, isProductionMode } from './db.ts';
import type { MediaFolder, MediaKind } from './types.ts';

export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const QUOTE_ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
export const PDF_LOCAL_PATH = path.join(DATA_DIR, 'catalogue-2027.pdf');

export type R2BucketScope = 'public' | 'private';

const PUBLIC_ALLOWED_FOLDERS = new Set<string>([
  'products',
  'realisations',
  'editorial',
  'illustrations',
  'documents',
  'catalogues',
]);

export function ensureLocalStorageDirs(): void {
  if (isProductionMode()) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(QUOTE_ATTACHMENTS_DIR, { recursive: true });
}

export function getPublicBucketName(): string {
  return (process.env.CLOUDFLARE_R2_PUBLIC_BUCKET || process.env.CLOUDFLARE_R2_BUCKET || '').trim();
}

export function getPrivateBucketName(): string {
  return (process.env.CLOUDFLARE_R2_PRIVATE_BUCKET || '').trim();
}

export function isR2Configured(): boolean {
  const pub = getPublicBucketName();
  const priv = getPrivateBucketName();
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      pub &&
      priv &&
      pub !== priv,
  );
}

export function getR2ConfigError(): string | null {
  const pub = getPublicBucketName();
  const priv = getPrivateBucketName();
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) return 'CLOUDFLARE_ACCOUNT_ID manquant.';
  if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID) return 'CLOUDFLARE_R2_ACCESS_KEY_ID manquant.';
  if (!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) return 'CLOUDFLARE_R2_SECRET_ACCESS_KEY manquant.';
  if (!pub) return 'CLOUDFLARE_R2_PUBLIC_BUCKET (4ever-public-media) manquant.';
  if (!priv) return 'CLOUDFLARE_R2_PRIVATE_BUCKET (4ever-private-files) manquant.';
  if (pub === priv) {
    return 'Sécurité : CLOUDFLARE_R2_PUBLIC_BUCKET et CLOUDFLARE_R2_PRIVATE_BUCKET doivent être deux buckets distincts.';
  }
  return null;
}

export function isFileStorageAvailable(): boolean {
  return isR2Configured() || !isProductionMode();
}

export function getStorageDriver(): 'r2' | 'local' | 'unconfigured' {
  if (isR2Configured()) return 'r2';
  if (isProductionMode()) return 'unconfigured';
  return 'local';
}

function assertStorageConfiguredForEnv(): 'r2' | 'local' {
  if (isR2Configured()) return 'r2';
  if (isProductionMode()) {
    throw new PersistenceUnavailableError(
      `Téléversement temporairement désactivé en production : Cloudflare R2 non activé (${getR2ConfigError()}). Repli sur disque local strictement interdit.`,
    );
  }
  return 'local';
}

function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucketForScope(scope: R2BucketScope): string {
  return scope === 'public' ? getPublicBucketName() : getPrivateBucketName();
}

export function isAllowedPublicKey(key: string): boolean {
  if (!key || key.includes('..') || key.startsWith('/')) return false;
  const firstSegment = key.split('/')[0];
  return PUBLIC_ALLOWED_FOLDERS.has(firstSegment);
}

export function sanitizeFilename(originalName: string): { safeName: string; ext: string } {
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return {
    safeName: `${Date.now()}_${crypto.randomBytes(3).toString('hex')}_${base || 'fichier'}${ext}`,
    ext,
  };
}

/**
 * Contrôle réel de signature binaire (magic bytes) / contenu pour prévenir les fichiers falsifiés.
 */
export function validateFileMagicBytes(buffer: Buffer, ext: string): string | null {
  if (buffer.length === 0) {
    return 'Fichier vide rejeté.';
  }
  const cleanExt = ext.toLowerCase();

  if (cleanExt === '.jpg' || cleanExt === '.jpeg') {
    if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return 'Le contenu ne correspond pas à une image JPEG valide.';
    }
    return null;
  }

  if (cleanExt === '.png') {
    const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (buffer.length < 8 || !pngSig.every((b, i) => buffer[i] === b)) {
      return 'Le contenu ne correspond pas à une image PNG valide.';
    }
    return null;
  }

  if (cleanExt === '.webp') {
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    if (buffer.length < 12 || riff !== 'RIFF' || webp !== 'WEBP') {
      return 'Le contenu ne correspond pas à une image WEBP valide.';
    }
    return null;
  }

  if (cleanExt === '.pdf') {
    const header = buffer.subarray(0, 5).toString('ascii');
    if (header !== '%PDF-') {
      return 'Le contenu ne correspond pas à un document PDF valide.';
    }
    return null;
  }

  if (cleanExt === '.svg') {
    const text = buffer.toString('utf-8').trim().toLowerCase();
    if (!text.includes('<svg')) {
      return 'Le fichier SVG est invalide.';
    }
    if (/<script[\s>]|javascript:|on\w+\s*=/i.test(text)) {
      return 'Le fichier SVG contient des scripts ou attributs non autorisés.';
    }
    return null;
  }

  if (cleanExt === '.zip') {
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return 'Le fichier ZIP est invalide.';
    }
    return null;
  }

  return null;
}

export function inferMediaKind(mimeType: string, ext: string, folder: MediaFolder): MediaKind {
  if (ext === '.pdf' || mimeType === 'application/pdf') return 'pdf';
  if (folder === 'illustrations') return 'illustration';
  if (folder === 'documents') return 'document';
  if (mimeType.startsWith('image/')) return 'photo';
  return 'document';
}

export function buildPublicMediaUrl(r2Key: string, driver: 'r2' | 'local', localFilename?: string): string {
  if (driver === 'r2') {
    if (r2Key === 'catalogues/catalogue-2027.pdf') {
      return '/api/catalogue-pdf';
    }
    const publicBase = (process.env.CLOUDFLARE_R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
    if (publicBase) {
      return `${publicBase}/${r2Key}`;
    }
    return `/api/media/object/${encodeURIComponent(r2Key)}`;
  }
  if (r2Key === 'catalogues/catalogue-2027.pdf') {
    return '/api/catalogue-pdf';
  }
  return `/uploads/${localFilename || path.basename(r2Key)}`;
}

export async function putPublicObject(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder: MediaFolder;
  fixedKey?: string;
}): Promise<{
  r2Key: string;
  filename: string;
  publicUrl: string;
  storageDriver: 'r2' | 'local';
}> {
  const driver = assertStorageConfiguredForEnv();
  const { safeName } = sanitizeFilename(params.originalName);
  const r2Key = params.fixedKey || `${params.folder}/${safeName}`;
  const filename = path.basename(r2Key);

  if (driver === 'r2') {
    try {
      const client = getR2Client();
      const bucket = getBucketForScope('public');
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: r2Key,
          Body: params.buffer,
          ContentType: params.mimeType,
          CacheControl: params.folder === 'catalogues' ? 'public, max-age=3600' : 'public, max-age=604800',
        }),
      );
      return {
        r2Key,
        filename,
        publicUrl: buildPublicMediaUrl(r2Key, 'r2', filename),
        storageDriver: 'r2',
      };
    } catch (err) {
      throw new PersistenceUnavailableError(
        `Échec d'écriture sur le bucket public R2 (${getPublicBucketName()}) : ${
          err instanceof Error ? err.message : 'erreur R2'
        }`,
      );
    }
  }

  ensureLocalStorageDirs();
  if (r2Key === 'catalogues/catalogue-2027.pdf') {
    fs.writeFileSync(PDF_LOCAL_PATH, params.buffer);
    return {
      r2Key,
      filename: 'catalogue-2027.pdf',
      publicUrl: '/api/catalogue-pdf',
      storageDriver: 'local',
    };
  }

  const localPath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(localPath, params.buffer);
  return {
    r2Key,
    filename,
    publicUrl: `/uploads/${filename}`,
    storageDriver: 'local',
  };
}

export async function putPrivateQuoteAttachment(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}): Promise<{
  attachmentKey: string;
  storageDriver: 'r2' | 'local';
}> {
  const driver = assertStorageConfiguredForEnv();
  const { safeName } = sanitizeFilename(params.originalName);
  const key = `quotes/${safeName}`;

  if (driver === 'r2') {
    try {
      const client = getR2Client();
      const bucket = getBucketForScope('private');
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: params.buffer,
          ContentType: params.mimeType || 'application/octet-stream',
          CacheControl: 'private, no-store',
        }),
      );
      return { attachmentKey: key, storageDriver: 'r2' };
    } catch (err) {
      throw new PersistenceUnavailableError(
        `Échec d'écriture sur le bucket privé R2 (${getPrivateBucketName()}) : ${
          err instanceof Error ? err.message : 'erreur R2'
        }`,
      );
    }
  }

  ensureLocalStorageDirs();
  const localPath = path.join(QUOTE_ATTACHMENTS_DIR, safeName);
  fs.writeFileSync(localPath, params.buffer);
  return { attachmentKey: localPath, storageDriver: 'local' };
}

export async function getObjectBuffer(
  keyOrPath: string,
  scope: R2BucketScope,
  driverHint?: 'r2' | 'local',
): Promise<{ buffer: Buffer; contentType?: string } | null> {
  if (!keyOrPath) return null;

  const activeDriver = driverHint || (isR2Configured() ? 'r2' : isProductionMode() ? 'r2' : 'local');

  if (activeDriver === 'r2') {
    if (!isR2Configured()) {
      throw new PersistenceUnavailableError('Cloudflare R2 non configuré en mode production.');
    }
    if (path.isAbsolute(keyOrPath)) return null;

    // Normalize legacy prefixed keys if migrated
    const normalizedKey =
      scope === 'public' && keyOrPath.startsWith('public/')
        ? keyOrPath.slice('public/'.length)
        : scope === 'private' && keyOrPath.startsWith('private/')
          ? keyOrPath.slice('private/'.length)
          : keyOrPath;

    try {
      const client = getR2Client();
      const out = await client.send(
        new GetObjectCommand({
          Bucket: getBucketForScope(scope),
          Key: normalizedKey,
        }),
      );
      if (!out.Body) return null;
      const bytes = await out.Body.transformToByteArray();
      return { buffer: Buffer.from(bytes), contentType: out.ContentType };
    } catch {
      return null;
    }
  }

  if (isProductionMode()) {
    throw new PersistenceUnavailableError('Lecture sur disque local interdite en mode production.');
  }

  let localPath = keyOrPath;
  if (!path.isAbsolute(localPath)) {
    if (localPath === 'catalogues/catalogue-2027.pdf' || localPath === 'public/catalogues/catalogue-2027.pdf') {
      localPath = PDF_LOCAL_PATH;
    } else if (scope === 'private') {
      localPath = path.join(QUOTE_ATTACHMENTS_DIR, path.basename(localPath));
    } else {
      localPath = path.join(UPLOADS_DIR, path.basename(localPath));
    }
  }

  if (!fs.existsSync(localPath)) return null;
  return { buffer: fs.readFileSync(localPath) };
}

export async function deleteStoredObject(
  keyOrPath: string,
  scope: R2BucketScope,
  driverHint?: 'r2' | 'local',
): Promise<void> {
  if (!keyOrPath) return;

  const activeDriver = driverHint || (isR2Configured() ? 'r2' : isProductionMode() ? 'r2' : 'local');

  if (activeDriver === 'r2') {
    if (!isR2Configured() || path.isAbsolute(keyOrPath)) return;
    const normalizedKey =
      scope === 'public' && keyOrPath.startsWith('public/')
        ? keyOrPath.slice('public/'.length)
        : scope === 'private' && keyOrPath.startsWith('private/')
          ? keyOrPath.slice('private/'.length)
          : keyOrPath;
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: getBucketForScope(scope),
        Key: normalizedKey,
      }),
    );
    return;
  }

  if (isProductionMode()) return;

  let localPath = keyOrPath;
  if (!path.isAbsolute(localPath)) {
    if (localPath === 'catalogues/catalogue-2027.pdf' || localPath === 'public/catalogues/catalogue-2027.pdf') {
      localPath = PDF_LOCAL_PATH;
    } else if (scope === 'private') {
      localPath = path.join(QUOTE_ATTACHMENTS_DIR, path.basename(localPath));
    } else {
      localPath = path.join(UPLOADS_DIR, path.basename(localPath));
    }
  }
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
}

async function testSingleBucket(bucket: string, scope: R2BucketScope): Promise<{
  ok: boolean;
  bucket: string;
  latencyMs: number;
  message: string;
}> {
  const started = Date.now();
  const key = `_healthcheck/ping_${scope}_${Date.now()}.txt`;
  const payload = `4ever-${scope}-check-${Date.now()}`;

  try {
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(payload),
        ContentType: 'text/plain',
      }),
    );
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const got = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const readText = got.Body ? Buffer.from(await got.Body.transformToByteArray()).toString('utf-8') : '';
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    const matches = readText === payload;
    return {
      ok: matches,
      bucket,
      latencyMs: Date.now() - started,
      message: matches
        ? `Bucket ${scope === 'public' ? 'public' : 'privé'} "${bucket}" vérifié (écriture, lecture et suppression).`
        : `Contenu incohérent lors de la lecture sur "${bucket}".`,
    };
  } catch (err) {
    return {
      ok: false,
      bucket,
      latencyMs: Date.now() - started,
      message: err instanceof Error ? err.message : `Erreur sur le bucket "${bucket}".`,
    };
  }
}

export async function testR2Connection(): Promise<{
  configured: boolean;
  ok: boolean;
  skipped?: boolean;
  driver: 'r2' | 'local' | 'unconfigured';
  latencyMs: number;
  message: string;
  publicBucket?: { ok: boolean; bucket: string; latencyMs: number; message: string };
  privateBucket?: { ok: boolean; bucket: string; latencyMs: number; message: string };
}> {
  const started = Date.now();
  const driver = getStorageDriver();

  if (!isR2Configured()) {
    const errReason = getR2ConfigError();
    return {
      configured: false,
      ok: false,
      skipped: isProductionMode(),
      driver,
      latencyMs: Date.now() - started,
      message: isProductionMode()
        ? `Cloudflare R2 temporairement reporté (${errReason}). Stockage fichiers désactivé en production sans bloquer Cloudflare D1.`
        : `Cloudflare R2 non configuré (${errReason}). Mode stockage disque local actif en développement.`,
    };
  }

  const [pubRes, privRes] = await Promise.all([
    testSingleBucket(getPublicBucketName(), 'public'),
    testSingleBucket(getPrivateBucketName(), 'private'),
  ]);

  const ok = pubRes.ok && privRes.ok;
  return {
    configured: true,
    ok,
    driver: 'r2',
    latencyMs: Date.now() - started,
    message: ok
      ? `Buckets R2 vérifiés (${pubRes.bucket} & ${privRes.bucket}).`
      : 'Au moins un des deux buckets R2 a échoué au test lecture/écriture.',
    publicBucket: pubRes,
    privateBucket: privRes,
  };
}
