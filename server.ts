import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import {
  PersistenceUnavailableError,
  ensureDatabaseInitialized,
  getDbDriver,
  isProductionMode,
  testDatabaseConnection,
} from './server/db.ts';
import {
  PDF_LOCAL_PATH,
  UPLOADS_DIR,
  deleteStoredObject,
  ensureLocalStorageDirs,
  getObjectBuffer,
  getPrivateBucketName,
  getPublicBucketName,
  getR2ConfigError,
  getStorageDriver,
  inferMediaKind,
  isAllowedPublicKey,
  isFileStorageAvailable,
  isR2Configured,
  putPrivateQuoteAttachment,
  putPublicObject,
  testR2Connection,
  validateFileMagicBytes,
} from './server/r2.ts';
import {
  OFFICIAL_REALISATION_CATEGORIES,
  createContact,
  createMediaAsset,
  createProduct,
  createQuote,
  createRealisation,
  deleteContact,
  deleteMediaAsset,
  deleteProduct,
  deleteRealisation,
  getMediaAssetById,
  getProductById,
  getQuoteById,
  getSiteSettings,
  initializeStore,
  listAuditLogs,
  listCategories,
  listContacts,
  listMediaAssets,
  listPoles,
  listProducts,
  listQuotes,
  listRealisations,
  makeId,
  replaceCategories,
  saveSiteSettings,
  updateContact,
  updateMediaAsset,
  updatePole,
  updateProduct,
  updateQuote,
  updateRealisation,
  writeAuditLog,
} from './server/store.ts';
import type {
  AdminRole,
  ContactMessage,
  ContactStatus,
  MediaFolder,
  ProductItem,
  QuoteProductLine,
  QuoteRequest,
  QuoteStatus,
  RealisationItem,
} from './server/types.ts';
import {
  SESSION_COOKIE_NAME,
  checkLoginLockout,
  clearFailedLogins,
  createDbSession,
  createInitialSuperAdmin,
  getAdminUserByEmail,
  getAdminUserById,
  getCookieOptions,
  hashPassword,
  isAdminConfigured,
  isSessionSecretConfigured,
  isSetupLocked,
  isSetupTokenConfigured,
  listPublicAdminUsers,
  listUserActiveSessions,
  recordFailedLogin,
  requireAuth,
  requireRole,
  resolveAuthenticatedSession,
  revokeOtherSessions,
  revokeSessionById,
  validatePasswordStrength,
  verifyPassword,
  verifySetupToken,
  type AuthenticatedRequest,
} from './server/auth.ts';
import {
  isSmtpConfigured,
  sendContactNotification,
  sendQuoteNotification,
} from './server/mailer.ts';
import { dbRun } from './server/db.ts';

function getCliArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1];
  }
  const prefix = `${flag}=`;
  const matched = process.argv.find((arg) => arg.startsWith(prefix));
  return matched ? matched.slice(prefix.length) : undefined;
}

const app = express();
app.set('trust proxy', 1);

const PORT = Number(getCliArgValue('--port') || process.env.PORT || 3000);
const HOST = getCliArgValue('--host') || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

ensureLocalStorageDirs();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve local uploaded public media ONLY in development/test (never in production)
if (!isProduction) {
  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
}

function asyncHandler(
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> | void,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
}

function sendErrorResponse(res: Response, err: unknown, fallbackMessage: string): void {
  if (err instanceof PersistenceUnavailableError) {
    res.status(503).json({
      error: err.message,
      code: 'PERSISTENCE_UNAVAILABLE',
    });
    return;
  }
  res.status(500).json({
    error: err instanceof Error ? err.message : fallbackMessage,
  });
}

// Simple in-memory rate limiter for public form submissions & auth endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg']);
const ALLOWED_MEDIA_FOLDERS = new Set<MediaFolder>([
  'products',
  'realisations',
  'editorial',
  'illustrations',
  'documents',
  'catalogues',
]);
const ALLOWED_ATTACHMENT_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.svg',
  '.ai',
  '.eps',
  '.zip',
]);

const uploadMediaMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXT.has(ext) && ext !== '.pdf') {
      cb(new Error('Format non autorisé (JPG, PNG, WEBP, SVG, PDF uniquement).'));
      return;
    }
    cb(null, true);
  },
});

const uploadQuoteAttachmentMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_ATTACHMENT_EXT.has(ext)) {
      cb(new Error('Format de pièce jointe non supporté (PDF, JPG, PNG, SVG, AI, EPS, ZIP).'));
      return;
    }
    cb(null, true);
  },
});

const uploadPdfMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      cb(new Error('Seuls les fichiers PDF (.pdf) sont acceptés.'));
      return;
    }
    cb(null, true);
  },
});

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 64);
}

// ---------- PUBLIC API ----------

app.get(
  '/api/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const prod = isProductionMode();
    const dbDriver = getDbDriver();
    const storageDriver = getStorageDriver();
    const fileStorageAvailable = isFileStorageAvailable();
    const sessionSecretReady = !prod || isSessionSecretConfigured();
    const issues: string[] = [];
    const warnings: string[] = [];

    if (prod && dbDriver === 'unconfigured') {
      issues.push('Base Cloudflare D1 non configurée en production.');
    }
    if (!sessionSecretReady) {
      issues.push('Variable SESSION_SECRET manquante ou trop courte en production.');
    }
    if (prod && storageDriver === 'unconfigured') {
      warnings.push(
        'Cloudflare R2 temporairement reporté : téléversements et pièces jointes désactivés en production (base Cloudflare D1 active).',
      );
    }

    let dbReachable = dbDriver !== 'unconfigured';
    if (dbReachable) {
      try {
        await ensureDatabaseInitialized();
      } catch (err) {
        dbReachable = false;
        issues.push(err instanceof Error ? err.message : 'Base de données inaccessible.');
      }
    }

    const persistenceReady =
      dbReachable && (!prod || (dbDriver !== 'sqlite-local' && sessionSecretReady));

    const payload = {
      status: persistenceReady ? 'ok' : 'unavailable',
      environment: prod ? 'production' : 'development',
      persistenceReady,
      fileStorageAvailable,
      dbDriver,
      storageDriver,
      publicBucket: getPublicBucketName() || null,
      privateBucket: getPrivateBucketName() || null,
      sessionSecretConfigured: sessionSecretReady,
      issues,
      warnings,
    };

    res.status(persistenceReady ? 200 : 503).json(payload);
  }),
);

app.get(
  '/api/public/bootstrap',
  asyncHandler(async (_req: Request, res: Response) => {
    const [categories, products, realisations, poles, settings] = await Promise.all([
      listCategories(),
      listProducts(true),
      listRealisations(true),
      listPoles(),
      getSiteSettings(),
    ]);

    res.json({
      categories,
      realisationCategories: OFFICIAL_REALISATION_CATEGORIES,
      products,
      realisations,
      poles,
      settings,
      smtpConfigured: isSmtpConfigured(),
      fileStorageAvailable: isFileStorageAvailable(),
    });
  }),
);

// Public proxy for R2 public bucket objects (strictly limited to public folders, never touches private bucket)
app.get(
  '/api/media/object/:encodedKey',
  asyncHandler(async (req: Request, res: Response) => {
    const rawKey = decodeURIComponent(req.params.encodedKey || '');
    const key = rawKey.startsWith('public/') ? rawKey.slice('public/'.length) : rawKey;
    if (!isAllowedPublicKey(key)) {
      res.status(403).json({ error: 'Accès interdit à cette ressource.' });
      return;
    }
    if (isProductionMode() && !isR2Configured()) {
      res.status(404).json({ error: 'Stockage média Cloudflare R2 temporairement reporté.' });
      return;
    }
    const obj = await getObjectBuffer(key, 'public');
    if (!obj) {
      res.status(404).json({ error: 'Média introuvable.' });
      return;
    }
    if (obj.contentType) {
      res.setHeader('Content-Type', obj.contentType);
    }
    if (key.toLowerCase().endsWith('.svg')) {
      res.setHeader('Content-Security-Policy', 'sandbox');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(obj.buffer);
  }),
);

app.get(
  '/api/catalogue-pdf',
  asyncHandler(async (req: Request, res: Response) => {
    if (isProductionMode() && !isR2Configured()) {
      res.status(404).json({
        available: false,
        error: "Le fichier PDF du Catalogue 2027 n'est pas disponible tant que Cloudflare R2 est reporté.",
      });
      return;
    }
    const settings = await getSiteSettings();
    const rawKey = settings.cataloguePdfKey || 'catalogues/catalogue-2027.pdf';
    const cleanKey = rawKey.startsWith('public/') ? rawKey.slice('public/'.length) : rawKey;
    const obj = await getObjectBuffer(cleanKey, 'public', settings.cataloguePdfDriver);

    if (!obj) {
      if (isProductionMode() || !fs.existsSync(PDF_LOCAL_PATH)) {
        res.status(404).json({
          available: false,
          error: "Le fichier PDF du Catalogue 2027 n'a pas encore été importé dans l'administration.",
        });
        return;
      }
      const download = req.query.download === '1';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader(
        'Content-Disposition',
        `${download ? 'attachment' : 'inline'}; filename="Catalogue-4EVER-Madagascar-2027.pdf"`,
      );
      res.sendFile(PDF_LOCAL_PATH);
      return;
    }

    const download = req.query.download === '1';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Disposition',
      `${download ? 'attachment' : 'inline'}; filename="Catalogue-4EVER-Madagascar-2027.pdf"`,
    );
    res.send(obj.buffer);
  }),
);

app.post(
  '/api/quotes',
  (req: Request, res: Response, next) => {
    uploadQuoteAttachmentMemory.single('attachment')(req, res, (err) => {
      if (err) {
        res.status(400).json({
          error: err instanceof Error ? err.message : 'Erreur lors du téléversement du fichier.',
        });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req: Request, res: Response) => {
    const ip = getClientIp(req);
    if (!checkRateLimit(`quote:${ip}`, 8, 60_000)) {
      res.status(429).json({ error: 'Trop de demandes envoyées. Veuillez patienter quelques instants.' });
      return;
    }

    const body = req.body as Record<string, string | undefined>;
    if (body.website && body.website.trim().length > 0) {
      res.status(400).json({ error: 'Requête rejetée par le filtre antispam.' });
      return;
    }

    const fullName = (body.fullName || '').trim();
    const company = (body.company || '').trim();
    const email = (body.email || '').trim();
    const phone = (body.phone || '').trim();
    const serviceOrCategory = (body.serviceOrCategory || '').trim();
    const dimensions = (body.dimensions || '').trim();
    const desiredMaterial = (body.desiredMaterial || '').trim();
    const customizationType = (body.customizationType || '').trim();
    const desiredDate = (body.desiredDate || '').trim();
    const description = (body.description || '').trim();

    if (!fullName || !email || !phone) {
      res.status(400).json({
        error: 'Veuillez renseigner votre nom, adresse e-mail et numéro de téléphone / WhatsApp.',
      });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
    }

    if (req.file) {
      if (!isFileStorageAvailable()) {
        res.status(503).json({
          error:
            "L'envoi de pièces jointes est temporairement désactivé tant que le stockage Cloudflare R2 n'est pas activé. Envoyez votre demande de devis sans fichier ou transmettez vos visuels à commercial4ever@gmail.com.",
          code: 'FILE_STORAGE_DISABLED',
        });
        return;
      }
      const ext = path.extname(req.file.originalname).toLowerCase();
      const magicErr = validateFileMagicBytes(req.file.buffer, ext);
      if (magicErr) {
        res.status(400).json({ error: magicErr });
        return;
      }
    }

    let products: QuoteProductLine[] = [];
    if (body.products) {
      try {
        const parsed = JSON.parse(body.products) as Array<Partial<QuoteProductLine>>;
        if (Array.isArray(parsed)) {
          products = parsed
            .filter((item) => item && (item.name || item.code))
            .map((item) => ({
              productId: item.productId || '',
              code: String(item.code || '').trim(),
              name: String(item.name || '').trim(),
              quantity: Math.max(1, Number(item.quantity) || 1),
            }));
        }
      } catch {
        // Ignore malformed products JSON
      }
    }

    let attachmentKey = '';
    let attachmentDriver: 'r2' | 'local' = 'local';
    if (req.file) {
      const stored = await putPrivateQuoteAttachment({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
      });
      attachmentKey = stored.attachmentKey;
      attachmentDriver = stored.storageDriver;
    }

    const now = new Date();
    const refNumber = `DEV-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const quote: QuoteRequest = {
      id: makeId('quote'),
      reference: refNumber,
      fullName,
      company,
      email,
      phone,
      serviceOrCategory,
      products,
      dimensions,
      desiredMaterial,
      customizationType,
      desiredDate,
      description,
      attachmentName: req.file ? req.file.originalname : '',
      attachmentKey,
      attachmentDriver,
      emailSent: false,
      emailDeliveryNote: '',
      status: 'Nouveau',
      adminNotes: '',
      createdAt: now.toISOString(),
    };

    const mailResult = await sendQuoteNotification(quote);
    quote.emailSent = mailResult.sent;
    quote.emailDeliveryNote = mailResult.note;

    await createQuote(quote);

    res.status(201).json({
      ok: true,
      reference: quote.reference,
      emailSent: quote.emailSent,
      emailDeliveryNote: quote.emailDeliveryNote,
      recipientEmail: process.env.QUOTE_RECIPIENT_EMAIL || 'commercial4ever@gmail.com',
    });
  }),
);

app.post(
  '/api/contact',
  asyncHandler(async (req: Request, res: Response) => {
    const ip = getClientIp(req);
    if (!checkRateLimit(`contact:${ip}`, 10, 60_000)) {
      res.status(429).json({ error: 'Trop de messages envoyés. Veuillez patienter.' });
      return;
    }

    const body = req.body as Record<string, string | undefined>;
    if (body.website && body.website.trim().length > 0) {
      res.status(400).json({ error: 'Requête rejetée par le filtre antispam.' });
      return;
    }

    const fullName = (body.fullName || '').trim();
    const email = (body.email || '').trim();
    const phone = (body.phone || '').trim();
    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();

    if (!fullName || !email || !message) {
      res.status(400).json({ error: 'Veuillez remplir votre nom, adresse e-mail et message.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
    }

    const contact: ContactMessage = {
      id: makeId('msg'),
      fullName,
      email,
      phone,
      subject,
      message,
      emailSent: false,
      status: 'Nouveau',
      adminNotes: '',
      createdAt: new Date().toISOString(),
    };

    const mailResult = await sendContactNotification(contact);
    contact.emailSent = mailResult.sent;

    await createContact(contact);

    res.status(201).json({
      ok: true,
      emailSent: contact.emailSent,
      note: mailResult.note,
      recipientEmail: process.env.QUOTE_RECIPIENT_EMAIL || 'commercial4ever@gmail.com',
    });
  }),
);

// ---------- ADMIN AUTHENTICATION & SECURITY ----------

app.get(
  '/api/admin/status',
  asyncHandler(async (req: Request, res: Response) => {
    const configured = await isAdminConfigured();
    const locked = await isSetupLocked();
    const resolved = await resolveAuthenticatedSession(req);

    res.json({
      configured,
      locked,
      setupTokenConfigured: isSetupTokenConfigured(),
      authenticated: Boolean(resolved),
      adminEmail: resolved?.user.email,
      user: resolved
        ? {
            id: resolved.user.id,
            email: resolved.user.email,
            name: resolved.user.name,
            role: resolved.user.role,
            isActive: resolved.user.isActive,
            lastLoginAt: resolved.user.lastLoginAt,
            createdAt: resolved.user.createdAt,
          }
        : undefined,
      dbDriver: getDbDriver(),
      storageDriver: getStorageDriver(),
      fileStorageAvailable: isFileStorageAvailable(),
      publicBucketName: getPublicBucketName() || '4ever-public-media',
      privateBucketName: getPrivateBucketName() || '4ever-private-files',
      productionMode: isProductionMode(),
    });
  }),
);

app.post(
  '/api/admin/setup',
  asyncHandler(async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(`setup:${ip}`, 5, 15 * 60_000)) {
    res.status(429).json({ error: 'Trop de tentatives d\'initialisation. Réessayez plus tard.' });
    return;
  }

  if (await isSetupLocked()) {
    res.status(403).json({ error: 'L\'initialisation est définitivement verrouillée.' });
    return;
  }

  if (!isSetupTokenConfigured()) {
    res.status(503).json({
      error:
        'Variable serveur ADMIN_SETUP_TOKEN non configurée. Définissez ADMIN_SETUP_TOKEN dans l\'environnement serveur avant d\'initialiser le compte Super Admin.',
    });
    return;
  }

  const { setupToken, email, name, password } = req.body as {
    setupToken?: string;
    email?: string;
    name?: string;
    password?: string;
  };

  if (!setupToken || !verifySetupToken(setupToken)) {
    await writeAuditLog({
      action: 'ADMIN_SETUP_REJECTED',
      entityType: 'admin_users',
      summary: 'Tentative d\'initialisation avec un jeton ADMIN_SETUP_TOKEN invalide.',
      ipAddress: ip,
    });
    res.status(403).json({ error: 'Jeton d\'initialisation (ADMIN_SETUP_TOKEN) invalide.' });
    return;
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim() || 'Super Administrateur';
  const cleanPassword = password || '';

  if (!isValidEmail(cleanEmail)) {
    res.status(400).json({ error: 'Adresse e-mail administrateur invalide.' });
    return;
  }

  const strengthError = validatePasswordStrength(cleanPassword);
  if (strengthError) {
    res.status(400).json({ error: strengthError });
    return;
  }

  try {
    const user = await createInitialSuperAdmin({
      email: cleanEmail,
      name: cleanName,
      password: cleanPassword,
      ipAddress: ip,
    });

    const { cookieValue } = await createDbSession({
      userId: user.id,
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || '',
    });

    res.cookie(SESSION_COOKIE_NAME, cookieValue, getCookieOptions(req));
    res.json({
      ok: true,
      adminEmail: user.email,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(err instanceof PersistenceUnavailableError ? 503 : 403).json({
      error: err instanceof Error ? err.message : 'Erreur lors de l\'initialisation.',
    });
  }
}),
);

app.post(
  '/api/admin/login',
  asyncHandler(async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password || '';
  const lockoutKey = `${ip}::${cleanEmail}`;

  const lockStatus = await checkLoginLockout(lockoutKey);
  if (lockStatus.locked) {
    res.setHeader('Retry-After', String(lockStatus.retryAfterSeconds));
    res.status(429).json({
      error: `Compte temporairement verrouillé suite à plusieurs échecs. Réessayez dans ${Math.ceil(lockStatus.retryAfterSeconds / 60)} min.`,
    });
    return;
  }

  if (!(await isAdminConfigured())) {
    res.status(400).json({ error: 'Aucun compte administrateur initialisé.' });
    return;
  }

  const user = await getAdminUserByEmail(cleanEmail);
  if (!user || !user.isActive || !verifyPassword(cleanPassword, user.passwordHash)) {
    const attempts = await recordFailedLogin(lockoutKey);
    await writeAuditLog({
      actorEmail: cleanEmail,
      action: 'ADMIN_LOGIN_FAILED',
      entityType: 'admin_sessions',
      summary: `Échec de connexion (${attempts} tentative(s)) pour ${cleanEmail || 'inconnu'}.`,
      ipAddress: ip,
    });
    res.status(401).json({ error: 'Identifiants incorrects ou compte désactivé.' });
    return;
  }

  await clearFailedLogins(lockoutKey);

  const { cookieValue, sessionId } = await createDbSession({
    userId: user.id,
    ipAddress: ip,
    userAgent: req.headers['user-agent'] || '',
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ADMIN_LOGIN_SUCCESS',
    entityType: 'admin_sessions',
    entityId: sessionId,
    summary: `Connexion réussie (${user.role}).`,
    ipAddress: ip,
  });

  res.cookie(SESSION_COOKIE_NAME, cookieValue, getCookieOptions(req));
  res.json({
    ok: true,
    adminEmail: user.email,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}),
);

app.post(
  '/api/admin/logout',
  asyncHandler(async (req: Request, res: Response) => {
  const resolved = await resolveAuthenticatedSession(req);
  if (resolved) {
    await revokeSessionById(resolved.session.id);
    await writeAuditLog({
      actorId: resolved.user.id,
      actorEmail: resolved.user.email,
      actorRole: resolved.user.role,
      action: 'ADMIN_LOGOUT',
      entityType: 'admin_sessions',
      entityId: resolved.session.id,
      summary: 'Déconnexion manuelle.',
      ipAddress: getClientIp(req),
    });
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
}),
);

// ---------- PROTECTED ADMIN ROUTES ----------

app.get(
  '/api/admin/data',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.adminUser!;
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const [categories, poles, products, realisations, mediaAssets, quotes, contacts, settings, auditLogs, users] =
    await Promise.all([
      listCategories(),
      listPoles(),
      listProducts(false),
      listRealisations(false),
      listMediaAssets(),
      listQuotes(),
      listContacts(),
      getSiteSettings(),
      isSuperAdmin ? listAuditLogs(120) : Promise.resolve([]),
      isSuperAdmin ? listPublicAdminUsers() : Promise.resolve([]),
    ]);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
    categories,
    realisationCategories: OFFICIAL_REALISATION_CATEGORIES,
    poles,
    products,
    realisations,
    mediaAssets,
    quotes: quotes.map((q) => ({ ...q, attachmentKey: undefined })),
    contacts,
    settings,
    auditLogs,
    users,
    smtpConfigured: isSmtpConfigured(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    systemInfo: {
      dbDriver: getDbDriver(),
      storageDriver: getStorageDriver(),
      fileStorageAvailable: isFileStorageAvailable(),
      r2Configured: isR2Configured(),
      r2ConfigError: getR2ConfigError(),
      publicBucketName: getPublicBucketName() || '4ever-public-media',
      privateBucketName: getPrivateBucketName() || '4ever-private-files',
      productionMode: isProductionMode(),
      sessionSecretConfigured: isSessionSecretConfigured(),
    },
  });
}),
);

// Security: Password change, active sessions, collaborators & audit
app.post(
  '/api/admin/security/change-password',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.adminUser!;
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
    res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    return;
  }

  const strengthError = validatePasswordStrength(newPassword || '');
  if (strengthError) {
    res.status(400).json({ error: strengthError });
    return;
  }

  const now = new Date().toISOString();
  await dbRun('UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?', [
    hashPassword(newPassword!),
    now,
    user.id,
  ]);

  await revokeOtherSessions(user.id, req.adminSessionId);
  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'PASSWORD_CHANGED',
    entityType: 'admin_users',
    entityId: user.id,
    summary: 'Modification du mot de passe et révocation des autres sessions.',
    ipAddress: getClientIp(req),
  });

  res.json({ ok: true });
}),
);

app.get(
  '/api/admin/security/sessions',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sessions = await listUserActiveSessions(req.adminUser!.id);
  res.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      current: s.id === req.adminSessionId,
    })),
  });
}),
);

app.post(
  '/api/admin/security/sessions/:id/revoke',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const targetId = req.params.id;
    const ownerFilter = req.adminUser!.role === 'SUPER_ADMIN' ? undefined : req.adminUser!.id;
    await revokeSessionById(targetId, ownerFilter);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'SESSION_REVOKED',
      entityType: 'admin_sessions',
      entityId: targetId,
      summary: `Session révoquée (${targetId}).`,
      ipAddress: getClientIp(req),
    });
    res.json({ ok: true });
  }),
);

app.post(
  '/api/admin/security/sessions/revoke-all-others',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await revokeOtherSessions(req.adminUser!.id, req.adminSessionId);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'SESSIONS_REVOKED_ALL',
      entityType: 'admin_sessions',
      summary: 'Toutes les autres sessions actives ont été révoquées.',
      ipAddress: getClientIp(req),
    });
    res.json({ ok: true });
  }),
);

// Collaborators management (SUPER_ADMIN only)
app.post(
  '/api/admin/security/users',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { email, name, role, password } = req.body as {
      email?: string;
      name?: string;
      role?: AdminRole;
      password?: string;
    };
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || 'Collaborateur 4EVER';
    const targetRole: AdminRole = role === 'SALES' ? 'SALES' : 'EDITOR';

    if (!isValidEmail(cleanEmail)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
    }
    if (await getAdminUserByEmail(cleanEmail)) {
      res.status(409).json({ error: 'Un compte existe déjà avec cette adresse e-mail.' });
      return;
    }
    const strengthError = validatePasswordStrength(password || '');
    if (strengthError) {
      res.status(400).json({ error: strengthError });
      return;
    }

    const now = new Date().toISOString();
    const id = makeId('usr');
    await dbRun(
      `INSERT INTO admin_users (id, email, name, role, password_hash, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, cleanEmail, cleanName, targetRole, hashPassword(password!), 1, now, now],
    );

    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'COLLABORATOR_CREATED',
      entityType: 'admin_users',
      entityId: id,
      summary: `Création collaborateur ${cleanEmail} (rôle ${targetRole}).`,
      ipAddress: getClientIp(req),
    });

    const users = await listPublicAdminUsers();
    res.status(201).json({ users });
  }),
);

app.put(
  '/api/admin/security/users/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const targetId = req.params.id;
    const target = await getAdminUserById(targetId);
    if (!target) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }
    if (target.id === req.adminUser!.id) {
      res.status(400).json({ error: 'Impossible de modifier votre propre statut Super Admin ici.' });
      return;
    }
    if (target.role === 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Le Super Admin propriétaire ne peut pas être rétrogradé.' });
      return;
    }

    const { isActive, role, name } = req.body as {
      isActive?: boolean;
      role?: AdminRole;
      name?: string;
    };
    const nextRole: AdminRole = role === 'SALES' ? 'SALES' : role === 'EDITOR' ? 'EDITOR' : target.role;
    const nextActive = isActive !== undefined ? Boolean(isActive) : target.isActive;
    const nextName = name !== undefined ? name.trim() || target.name : target.name;

    await dbRun(
      'UPDATE admin_users SET name = ?, role = ?, is_active = ?, updated_at = ? WHERE id = ?',
      [nextName, nextRole, nextActive ? 1 : 0, new Date().toISOString(), targetId],
    );
    if (!nextActive) {
      await revokeOtherSessions(targetId);
    }

    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'COLLABORATOR_UPDATED',
      entityType: 'admin_users',
      entityId: targetId,
      summary: `Mise à jour collaborateur ${target.email} (actif=${nextActive}, rôle=${nextRole}).`,
      ipAddress: getClientIp(req),
    });

    const users = await listPublicAdminUsers();
    res.json({ users });
  }),
);

// System & Backup (SUPER_ADMIN only)
app.post(
  '/api/admin/system/test-cloudflare',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [dbTest, r2Test] = await Promise.all([testDatabaseConnection(), testR2Connection()]);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'SYSTEM_TEST_CLOUDFLARE',
      entityType: 'system',
      summary: `Test DB (${dbTest.driver}: ${dbTest.ok ? 'OK' : 'KO'}) & R2 (${r2Test.driver}: ${r2Test.ok ? 'OK' : 'KO'}).`,
      ipAddress: getClientIp(req),
    });
    res.json({ db: dbTest, r2: r2Test });
  }),
);

app.get(
  '/api/admin/backup/export',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [categories, poles, products, realisations, mediaAssets, quotes, contacts, settings] =
      await Promise.all([
        listCategories(),
        listPoles(),
        listProducts(false),
        listRealisations(false),
        listMediaAssets(),
        listQuotes(),
        listContacts(),
        getSiteSettings(),
      ]);

    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'BACKUP_EXPORTED',
      entityType: 'system',
      summary: 'Export JSON complet de sauvegarde effectué.',
      ipAddress: getClientIp(req),
    });

    const filename = `backup-4ever-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          dbDriver: getDbDriver(),
          storageDriver: getStorageDriver(),
          categories,
          poles,
          products,
          realisations,
          mediaAssets,
          quotes: quotes.map((q) => ({ ...q, attachmentKey: undefined })),
          contacts,
          settings,
        },
        null,
        2,
      ),
    );
  }),
);

// ---------- MEDIA UPLOAD & R2 LIBRARY ----------

function normalizeFolder(raw: string | undefined): MediaFolder {
  if (raw && ALLOWED_MEDIA_FOLDERS.has(raw as MediaFolder)) {
    return raw as MediaFolder;
  }
  return 'products';
}

app.post(
  '/api/admin/upload',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  (req: AuthenticatedRequest, res: Response) => {
    if (!isFileStorageAvailable()) {
      res.status(503).json({
        error:
          'Téléversement temporairement désactivé : Cloudflare R2 est reporté en production. Conservez les illustrations N&B ou renseignez une URL existante.',
        code: 'FILE_STORAGE_DISABLED',
      });
      return;
    }
    uploadMediaMemory.single('file')(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Erreur d'upload image." });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'Aucun fichier fourni.' });
        return;
      }
      try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const magicErr = validateFileMagicBytes(req.file.buffer, ext);
        if (magicErr) {
          res.status(400).json({ error: magicErr });
          return;
        }
        const folder = normalizeFolder((req.body?.folder as string | undefined) || 'products');
        const altText = String(req.body?.altText || '').trim();
        const stored = await putPublicObject({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          folder,
        });
        const asset = await createMediaAsset({
          filename: stored.filename,
          originalName: req.file.originalname,
          r2Key: stored.r2Key,
          publicUrl: stored.publicUrl,
          folder,
          kind: inferMediaKind(req.file.mimetype, ext, folder),
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          altText,
          storageDriver: stored.storageDriver,
          uploadedBy: req.adminUser!.email,
        });

        await writeAuditLog({
          actorId: req.adminUser!.id,
          actorEmail: req.adminUser!.email,
          actorRole: req.adminUser!.role,
          action: 'MEDIA_UPLOADED',
          entityType: 'media_assets',
          entityId: asset.id,
          summary: `Import média ${asset.originalName} (${asset.storageDriver} · ${asset.folder}).`,
          ipAddress: getClientIp(req),
        });

        res.json({ url: asset.publicUrl, filename: asset.originalName, asset });
      } catch (e) {
        sendErrorResponse(res, e, "Erreur lors de l'enregistrement du média.");
      }
    });
  },
);

app.post(
  '/api/admin/media/upload-multiple',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  (req: AuthenticatedRequest, res: Response) => {
    if (!isFileStorageAvailable()) {
      res.status(503).json({
        error:
          'Importation multiple temporairement désactivée : Cloudflare R2 est reporté en production.',
        code: 'FILE_STORAGE_DISABLED',
      });
      return;
    }
    uploadMediaMemory.array('files', 20)(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Erreur d'import multiple." });
        return;
      }
      const files = (req.files as Express.Multer.File[]) || [];
      if (files.length === 0) {
        res.status(400).json({ error: 'Aucun fichier sélectionné.' });
        return;
      }
      try {
        for (const f of files) {
          const ext = path.extname(f.originalname).toLowerCase();
          const magicErr = validateFileMagicBytes(f.buffer, ext);
          if (magicErr) {
            res.status(400).json({ error: `${f.originalname} : ${magicErr}` });
            return;
          }
        }
        const folder = normalizeFolder((req.body?.folder as string | undefined) || 'products');
        const created = [];
        for (const f of files) {
          const stored = await putPublicObject({
            buffer: f.buffer,
            originalName: f.originalname,
            mimeType: f.mimetype,
            folder,
          });
          const ext = path.extname(f.originalname).toLowerCase();
          const asset = await createMediaAsset({
            filename: stored.filename,
            originalName: f.originalname,
            r2Key: stored.r2Key,
            publicUrl: stored.publicUrl,
            folder,
            kind: inferMediaKind(f.mimetype, ext, folder),
            mimeType: f.mimetype,
            sizeBytes: f.size,
            altText: '',
            storageDriver: stored.storageDriver,
            uploadedBy: req.adminUser!.email,
          });
          created.push(asset);
        }

        await writeAuditLog({
          actorId: req.adminUser!.id,
          actorEmail: req.adminUser!.email,
          actorRole: req.adminUser!.role,
          action: 'MEDIA_BULK_UPLOADED',
          entityType: 'media_assets',
          summary: `Import multiple de ${created.length} fichier(s) dans ${folder}.`,
          ipAddress: getClientIp(req),
        });

        res.status(201).json({ assets: created, count: created.length });
      } catch (e) {
        sendErrorResponse(res, e, "Erreur lors de l'import multiple.");
      }
    });
  },
);

app.put(
  '/api/admin/media/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { altText, folder } = req.body as { altText?: string; folder?: MediaFolder };
    const updated = await updateMediaAsset(req.params.id, {
      ...(altText !== undefined ? { altText: altText.trim() } : {}),
      ...(folder ? { folder: normalizeFolder(folder) } : {}),
    });
    if (!updated) {
      res.status(404).json({ error: 'Média introuvable.' });
      return;
    }
    res.json({ asset: updated });
  }),
);

app.post(
  '/api/admin/media/:id/replace',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!isFileStorageAvailable()) {
      res.status(503).json({
        error:
          'Remplacement de fichier temporairement désactivé : Cloudflare R2 est reporté en production.',
        code: 'FILE_STORAGE_DISABLED',
      });
      return;
    }
    const existing = await getMediaAssetById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Média introuvable.' });
      return;
    }
    uploadMediaMemory.single('file')(req, res, async (err) => {
      if (err || !req.file) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Fichier requis.' });
        return;
      }
      try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const magicErr = validateFileMagicBytes(req.file.buffer, ext);
        if (magicErr) {
          res.status(400).json({ error: magicErr });
          return;
        }
        const oldUrl = existing.publicUrl;
        const stored = await putPublicObject({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          folder: existing.folder,
        });
        await deleteStoredObject(existing.r2Key, 'public', existing.storageDriver);

        const updated = await updateMediaAsset(existing.id, {
          filename: stored.filename,
          originalName: req.file.originalname,
          r2Key: stored.r2Key,
          publicUrl: stored.publicUrl,
          kind: inferMediaKind(req.file.mimetype, ext, existing.folder),
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          storageDriver: stored.storageDriver,
        });

        // Propagate replacement URL to products & realisations referencing the old URL or asset ID
        if (updated && oldUrl !== updated.publicUrl) {
          await dbRun('UPDATE products SET image_url = ? WHERE media_asset_id = ? OR image_url = ?', [
            updated.publicUrl,
            existing.id,
            oldUrl,
          ]);
          await dbRun('UPDATE realisations SET image_url = ? WHERE media_asset_id = ? OR image_url = ?', [
            updated.publicUrl,
            existing.id,
            oldUrl,
          ]);
        }

        await writeAuditLog({
          actorId: req.adminUser!.id,
          actorEmail: req.adminUser!.email,
          actorRole: req.adminUser!.role,
          action: 'MEDIA_REPLACED',
          entityType: 'media_assets',
          entityId: existing.id,
          summary: `Remplacement média ${existing.originalName} -> ${req.file.originalname}.`,
          ipAddress: getClientIp(req),
        });

        res.json({ asset: updated });
      } catch (e) {
        sendErrorResponse(res, e, 'Erreur lors du remplacement du fichier.');
      }
    });
  }),
);

app.delete(
  '/api/admin/media/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await deleteMediaAsset(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Média introuvable.' });
      return;
    }
    await deleteStoredObject(deleted.r2Key, 'public', deleted.storageDriver);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'MEDIA_DELETED',
      entityType: 'media_assets',
      entityId: deleted.id,
      summary: `Suppression média ${deleted.originalName}.`,
      ipAddress: getClientIp(req),
    });
    res.json({ ok: true });
  }),
);

// ---------- PDF 2027 & AI EXTRACTION ----------

app.post(
  '/api/admin/catalogue-pdf',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  (req: AuthenticatedRequest, res: Response) => {
    if (!isFileStorageAvailable()) {
      res.status(503).json({
        error:
          'Importation du PDF 2027 temporairement désactivée : Cloudflare R2 est reporté en production.',
        code: 'FILE_STORAGE_DISABLED',
      });
      return;
    }
    uploadPdfMemory.single('pdf')(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Erreur d'importation PDF." });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'Aucun fichier PDF fourni.' });
        return;
      }
      try {
        const magicErr = validateFileMagicBytes(req.file.buffer, '.pdf');
        if (magicErr) {
          res.status(400).json({ error: magicErr });
          return;
        }

        const stored = await putPublicObject({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimeType: 'application/pdf',
          folder: 'catalogues',
          fixedKey: 'catalogues/catalogue-2027.pdf',
        });

        const settings = await getSiteSettings();
        settings.cataloguePdfUrl = '/api/catalogue-pdf';
        settings.cataloguePdfName = req.file.originalname;
        settings.cataloguePdfUpdatedAt = new Date().toISOString();
        settings.cataloguePdfKey = stored.r2Key;
        settings.cataloguePdfDriver = stored.storageDriver;
        await saveSiteSettings(settings);

        await createMediaAsset({
          filename: stored.filename,
          originalName: req.file.originalname,
          r2Key: stored.r2Key,
          publicUrl: '/api/catalogue-pdf',
          folder: 'catalogues',
          kind: 'pdf',
          mimeType: 'application/pdf',
          sizeBytes: req.file.size,
          altText: 'Catalogue officiel 4EVER Madagascar 2027',
          storageDriver: stored.storageDriver,
          uploadedBy: req.adminUser!.email,
        }).catch(() => {});

        await writeAuditLog({
          actorId: req.adminUser!.id,
          actorEmail: req.adminUser!.email,
          actorRole: req.adminUser!.role,
          action: 'PDF_UPLOADED',
          entityType: 'site_settings',
          summary: `Catalogue PDF 2027 importé (${req.file.originalname}, ${stored.storageDriver}).`,
          ipAddress: getClientIp(req),
        });

        res.json({ ok: true, settings });
      } catch (e) {
        sendErrorResponse(res, e, "Erreur lors de l'importation du PDF.");
      }
    });
  },
);

app.delete(
  '/api/admin/catalogue-pdf',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const settings = await getSiteSettings();
    if (settings.cataloguePdfKey) {
      await deleteStoredObject(settings.cataloguePdfKey, 'public', settings.cataloguePdfDriver);
    }
    if (!isProductionMode() && fs.existsSync(PDF_LOCAL_PATH)) {
      fs.unlinkSync(PDF_LOCAL_PATH);
    }
    settings.cataloguePdfUrl = '';
    settings.cataloguePdfName = '';
    settings.cataloguePdfUpdatedAt = '';
    settings.cataloguePdfKey = '';
    await saveSiteSettings(settings);

    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'PDF_DELETED',
      entityType: 'site_settings',
      summary: 'Catalogue PDF 2027 supprimé.',
      ipAddress: getClientIp(req),
    });

    res.json({ ok: true, settings });
  }),
);

app.post(
  '/api/admin/extract-pdf',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (_req: Request, res: Response) => {
    const settings = await getSiteSettings();
    const rawKey = settings.cataloguePdfKey || 'catalogues/catalogue-2027.pdf';
    const cleanKey = rawKey.startsWith('public/') ? rawKey.slice('public/'.length) : rawKey;
    const obj = await getObjectBuffer(cleanKey, 'public', settings.cataloguePdfDriver);
    const pdfBuffer =
      obj?.buffer ||
      (!isProductionMode() && fs.existsSync(PDF_LOCAL_PATH) ? fs.readFileSync(PDF_LOCAL_PATH) : null);

    if (!pdfBuffer) {
      res.status(400).json({ error: "Veuillez d'abord téléverser le fichier PDF 2027." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: 'GEMINI_API_KEY non configurée sur le serveur.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const pdfBase64 = pdfBuffer.toString('base64');
      const categories = await listCategories();
      const validCategories = categories.map((c) => c.name).join(', ');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          `Analyse ce catalogue PDF de 4EVER Madagascar. Extrais chaque produit exploitable avec son code référence exact, son nom exact, sa description, la catégorie la plus proche parmi [${validCategories}], la sous-catégorie si mentionnée, les matériaux si mentionnés, et les options de personnalisation si mentionnées. N'invente AUCUN prix ni aucune caractéristique absente. Si une information est ambiguë ou incohérente entre le texte et le visuel, mets needsVerification à true et explique dans verificationNote.`,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                subcategory: { type: Type.STRING },
                materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                customizationOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                needsVerification: { type: Type.BOOLEAN },
                verificationNote: { type: Type.STRING },
              },
              required: ['code', 'name', 'category'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]') as Array<Partial<ProductItem>>;
      res.json({ extracted: parsed });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "Erreur lors de l'analyse du PDF.",
      });
    }
  }),
);

// ---------- PRODUCTS CRUD ----------

app.post(
  '/api/admin/products',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body as Partial<ProductItem>;
    const name = (payload.name || '').trim();
    const code = (payload.code || '').trim();
    const category = (payload.category || '').trim();
    if (!name || !code || !category) {
      res.status(400).json({ error: 'Le code produit, le nom et la catégorie sont requis.' });
      return;
    }

    const product = await createProduct(payload);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'PRODUCT_CREATED',
      entityType: 'products',
      entityId: product.id,
      summary: `Création produit ${product.code} — ${product.name} (${product.priceLabel}).`,
      ipAddress: getClientIp(req),
    });
    res.status(201).json({ product });
  }),
);

app.post(
  '/api/admin/products/bulk',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { items } = req.body as { items?: Array<Partial<ProductItem>> };
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Liste d'articles vide." });
      return;
    }

    const created: ProductItem[] = [];
    for (const item of items) {
      if (!item.name || !item.code || !item.category) continue;
      const prod = await createProduct({
        ...item,
        materials: Array.isArray(item.materials) ? item.materials.map(String).filter(Boolean) : [],
        customizationOptions: Array.isArray(item.customizationOptions)
          ? item.customizationOptions.map(String).filter(Boolean)
          : [],
      });
      created.push(prod);
    }

    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'PRODUCTS_BULK_IMPORTED',
      entityType: 'products',
      summary: `Import groupé de ${created.length} produit(s).`,
      ipAddress: getClientIp(req),
    });

    res.status(201).json({ count: created.length, products: created });
  }),
);

app.put(
  '/api/admin/products/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updated = await updateProduct(req.params.id, req.body as Partial<ProductItem>);
    if (!updated) {
      res.status(404).json({ error: 'Produit introuvable.' });
      return;
    }
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'PRODUCT_UPDATED',
      entityType: 'products',
      entityId: updated.id,
      summary: `Modification produit ${updated.code} — ${updated.name} (${updated.priceLabel}).`,
      ipAddress: getClientIp(req),
    });
    res.json({ product: updated });
  }),
);

app.delete(
  '/api/admin/products/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const existing = await getProductById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Produit introuvable.' });
      return;
    }
    await deleteProduct(req.params.id);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'PRODUCT_DELETED',
      entityType: 'products',
      entityId: existing.id,
      summary: `Suppression produit ${existing.code} — ${existing.name}.`,
      ipAddress: getClientIp(req),
    });
    res.json({ ok: true });
  }),
);

// ---------- CATEGORIES & POLES ----------

app.put(
  '/api/admin/categories',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { categories } = req.body as { categories?: Awaited<ReturnType<typeof listCategories>> };
    if (!Array.isArray(categories)) {
      res.status(400).json({ error: 'Format de catégories invalide.' });
      return;
    }
    const saved = await replaceCategories(categories);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'CATEGORIES_UPDATED',
      entityType: 'categories',
      summary: `Mise à jour des catégories (${saved.length} catégories).`,
      ipAddress: getClientIp(req),
    });
    res.json({ categories: saved });
  }),
);

app.put(
  '/api/admin/poles/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updated = await updatePole(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Pôle introuvable.' });
      return;
    }
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'POLE_UPDATED',
      entityType: 'poles',
      entityId: updated.id,
      summary: `Mise à jour du pôle ${updated.number} — ${updated.title}.`,
      ipAddress: getClientIp(req),
    });
    res.json({ pole: updated });
  }),
);

// ---------- REALISATIONS CRUD ----------

app.post(
  '/api/admin/realisations',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body as Partial<RealisationItem>;
    if (!payload.title || !payload.category || !payload.imageUrl) {
      res.status(400).json({ error: 'Le titre, la catégorie et la photographie sont requis.' });
      return;
    }
    const item = await createRealisation(payload);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'REALISATION_CREATED',
      entityType: 'realisations',
      entityId: item.id,
      summary: `Ajout réalisation "${item.title}".`,
      ipAddress: getClientIp(req),
    });
    res.status(201).json({ realisation: item });
  }),
);

app.put(
  '/api/admin/realisations/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const updated = await updateRealisation(req.params.id, req.body as Partial<RealisationItem>);
    if (!updated) {
      res.status(404).json({ error: 'Réalisation introuvable.' });
      return;
    }
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'REALISATION_UPDATED',
      entityType: 'realisations',
      entityId: updated.id,
      summary: `Modification réalisation "${updated.title}".`,
      ipAddress: getClientIp(req),
    });
    res.json({ realisation: updated });
  }),
);

app.delete(
  '/api/admin/realisations/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await deleteRealisation(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Réalisation introuvable.' });
      return;
    }
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'REALISATION_DELETED',
      entityType: 'realisations',
      entityId: req.params.id,
      summary: `Suppression réalisation (${req.params.id}).`,
      ipAddress: getClientIp(req),
    });
    res.json({ ok: true });
  }),
);

// ---------- QUOTES & CONTACTS ADMIN ----------

app.put(
  '/api/admin/quotes/:id',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, adminNotes } = req.body as { status?: QuoteStatus; adminNotes?: string };
    const allowed: QuoteStatus[] = ['Nouveau', 'En cours', 'Devis envoyé', 'Archivé'];
    if (status && !allowed.includes(status)) {
      res.status(400).json({ error: 'Statut de devis invalide.' });
      return;
    }
    const updated = await updateQuote(req.params.id, { status, adminNotes });
    if (!updated) {
      res.status(404).json({ error: 'Demande de devis introuvable.' });
      return;
    }

    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'QUOTE_UPDATED',
      entityType: 'quotes',
      entityId: updated.id,
      summary: `Devis ${updated.reference} mis à jour (statut: ${updated.status}).`,
      ipAddress: getClientIp(req),
    });

    res.json({ quote: { ...updated, attachmentKey: undefined } });
  }),
);

app.get(
  '/api/admin/quotes/:id/attachment',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const quote = await getQuoteById(req.params.id);
    if (!quote || !quote.attachmentKey) {
      res.status(404).json({ error: 'Pièce jointe introuvable.' });
      return;
    }
    const obj = await getObjectBuffer(quote.attachmentKey, 'private', quote.attachmentDriver);
    if (!obj) {
      res.status(404).json({ error: 'Fichier introuvable dans le stockage.' });
      return;
    }
    const filename = quote.attachmentName || path.basename(quote.attachmentKey);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);
    res.setHeader('Content-Type', obj.contentType || 'application/octet-stream');
    res.send(obj.buffer);
  }),
);

app.put(
  '/api/admin/contacts/:id',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, adminNotes } = req.body as { status?: ContactStatus; adminNotes?: string };
    const allowed: ContactStatus[] = ['Nouveau', 'Traité', 'Archivé'];
    if (status && !allowed.includes(status)) {
      res.status(400).json({ error: 'Statut de message invalide.' });
      return;
    }
    const updated = await updateContact(req.params.id, { status, adminNotes });
    if (!updated) {
      res.status(404).json({ error: 'Message introuvable.' });
      return;
    }
    res.json({ contact: updated });
  }),
);

app.delete(
  '/api/admin/contacts/:id',
  requireAuth,
  requireRole(['SUPER_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const ok = await deleteContact(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Message introuvable.' });
      return;
    }
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'CONTACT_DELETED',
      entityType: 'contact_messages',
      entityId: req.params.id,
      summary: `Suppression message client (${req.params.id}).`,
      ipAddress: getClientIp(req),
    });
    res.json({ ok: true });
  }),
);

// ---------- SETTINGS & EDITORIAL CONTENT ----------

app.put(
  '/api/admin/settings',
  requireAuth,
  requireRole(['SUPER_ADMIN', 'EDITOR']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body as {
      socialLinks?: Record<string, string>;
      contactInfo?: Record<string, string>;
      pageContent?: Record<string, unknown>;
    };
    const settings = await getSiteSettings();

    if (payload.socialLinks) {
      settings.socialLinks = {
        facebook: (payload.socialLinks.facebook || '').trim(),
        instagram: (payload.socialLinks.instagram || '').trim(),
        linkedin: (payload.socialLinks.linkedin || '').trim(),
        tiktok: (payload.socialLinks.tiktok || '').trim(),
      };
    }

    if (payload.contactInfo) {
      settings.contactInfo = {
        email: (payload.contactInfo.email || settings.contactInfo?.email || '').trim(),
        phone: (payload.contactInfo.phone || settings.contactInfo?.phone || '').trim(),
        address: (payload.contactInfo.address || settings.contactInfo?.address || '').trim(),
        hours: (payload.contactInfo.hours || settings.contactInfo?.hours || '').trim(),
      };
    }

    if (payload.pageContent) {
      settings.pageContent = {
        ...settings.pageContent,
        ...payload.pageContent,
        serviceImages: {
          ...settings.pageContent.serviceImages,
          ...((payload.pageContent.serviceImages as Record<string, string>) || {}),
        },
      };
    }

    await saveSiteSettings(settings);
    await writeAuditLog({
      actorId: req.adminUser!.id,
      actorEmail: req.adminUser!.email,
      actorRole: req.adminUser!.role,
      action: 'SETTINGS_UPDATED',
      entityType: 'site_settings',
      summary: 'Mise à jour des contenus éditoriaux et paramètres généraux.',
      ipAddress: getClientIp(req),
    });
    res.json({ settings });
  }),
);

// ---------- SEO: SITEMAP & ROBOTS ----------

app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const staticPaths = [
    '/',
    '/a-propos',
    '/poles',
    '/services',
    '/catalogue',
    '/realisations',
    '/devis',
    '/contact',
    '/mentions-legales',
    '/politique-confidentialite',
  ];
  let productUrls: string[] = [];
  try {
    const products = await listProducts(true);
    productUrls = products.map((p) => `/catalogue/${encodeURIComponent(p.id)}`);
  } catch {
    productUrls = [];
  }
  const urls = [...staticPaths, ...productUrls];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${baseUrl}${u}</loc></url>`),
    '</urlset>',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml\n');
});

// Global API error middleware (ensures PersistenceUnavailableError returns HTTP 503 cleanly)
app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  sendErrorResponse(res, err, 'Erreur interne du serveur.');
});

// ---------- VITE / STATIC SPA SERVING ----------

async function startServer() {
  try {
    await initializeStore();
  } catch (err) {
    console.error(
      '[4EVER] Persistance non prête au démarrage :',
      err instanceof Error ? err.message : err,
    );
    if (isProduction) {
      console.error(
        '[4EVER] Mode production strict actif : aucun repli SQLite ou disque local autorisé. Les endpoints API renverront HTTP 503 tant que Cloudflare D1 et SESSION_SECRET ne sont pas configurés.',
      );
    }
  }
  const httpServer = http.createServer(app);

  if (!isProduction) {
    let viteMiddleware: express.RequestHandler | null = null;
    const viteReady = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== 'true',
          ws: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        },
        appType: 'spa',
      });
      viteMiddleware = vite.middlewares;
    })();

    viteReady.catch((err) => {
      console.error('Failed to initialize Vite middleware:', err);
    });

    app.use(async (req, res, next) => {
      if (!viteMiddleware) {
        await viteReady;
      }
      if (viteMiddleware) {
        viteMiddleware(req, res, next);
        return;
      }
      next();
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(
      `4EVER Madagascar server running on http://${HOST}:${PORT} [Env: ${isProduction ? 'production' : 'development'} | DB: ${getDbDriver()} | Storage: ${getStorageDriver()}]`,
    );
  });
}

startServer();
