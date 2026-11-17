import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import {
  DATA_DIR,
  OFFICIAL_REALISATION_CATEGORIES,
  PDF_PATH,
  QUOTE_ATTACHMENTS_DIR,
  UPLOADS_DIR,
  ensureDirectories,
  makeId,
  readDb,
  writeDb,
} from './server/store.ts';
import type {
  ContactMessage,
  ProductItem,
  QuoteProductLine,
  QuoteRequest,
  QuoteStatus,
  RealisationItem,
} from './server/types.ts';
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  getAuthenticatedAdminEmail,
  getConfiguredAdmin,
  hashPassword,
  isAdminConfigured,
  requireAdmin,
  verifyPassword,
} from './server/auth.ts';
import {
  isSmtpConfigured,
  sendContactNotification,
  sendQuoteNotification,
} from './server/mailer.ts';

ensureDirectories();

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
const PORT = Number(getCliArgValue('--port') || process.env.PORT || 3000);
const HOST = getCliArgValue('--host') || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded public media (product photos, realisation photos, service photos)
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

// Simple in-memory rate limiter for public form submissions
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
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

const uploadMedia = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBase = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 40);
      cb(null, `${Date.now()}_${safeBase}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXT.has(ext)) {
      cb(new Error('Format image non autorisé (JPG, PNG, WEBP uniquement).'));
      return;
    }
    cb(null, true);
  },
});

const uploadQuoteAttachment = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, QUOTE_ATTACHMENTS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBase = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .slice(0, 40);
      cb(null, `${Date.now()}_${safeBase}${ext}`);
    },
  }),
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

const uploadPdf = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, DATA_DIR),
    filename: (_req, _file, cb) => cb(null, 'catalogue-2027.pdf'),
  }),
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

// ---------- PUBLIC API ----------

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/public/bootstrap', (_req: Request, res: Response) => {
  const db = readDb();
  const publishedProducts = db.products.filter((p) => p.published);
  const publishedRealisations = db.realisations.filter((r) => r.published);
  const pdfExists = fs.existsSync(PDF_PATH);

  res.json({
    categories: db.categories,
    realisationCategories: OFFICIAL_REALISATION_CATEGORIES,
    products: publishedProducts,
    realisations: publishedRealisations,
    settings: {
      ...db.settings,
      cataloguePdfUrl: pdfExists ? '/api/catalogue-pdf' : '',
    },
    smtpConfigured: isSmtpConfigured(),
  });
});

app.get('/api/catalogue-pdf', (req: Request, res: Response) => {
  if (!fs.existsSync(PDF_PATH)) {
    res.status(404).json({
      available: false,
      error: 'Le fichier PDF du Catalogue 2027 n\'a pas encore été importé dans l\'administration.',
    });
    return;
  }
  const download = req.query.download === '1';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${download ? 'attachment' : 'inline'}; filename="Catalogue-4EVER-Madagascar-2027.pdf"`,
  );
  res.sendFile(PDF_PATH);
});

app.post(
  '/api/quotes',
  (req: Request, res: Response, next) => {
    uploadQuoteAttachment.single('attachment')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur lors du téléversement du fichier.' });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip, 8, 60_000)) {
      res.status(429).json({ error: 'Trop de demandes envoyées. Veuillez patienter quelques instants.' });
      return;
    }

    const body = req.body as Record<string, string | undefined>;
    // Antispam honeypot check
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
      res.status(400).json({ error: 'Veuillez renseigner votre nom, adresse e-mail et numéro de téléphone / WhatsApp.' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Adresse e-mail invalide.' });
      return;
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
      attachmentPath: req.file ? req.file.path : '',
      emailSent: false,
      emailDeliveryNote: '',
      status: 'Nouveau',
      createdAt: now.toISOString(),
    };

    const mailResult = await sendQuoteNotification(quote);
    quote.emailSent = mailResult.sent;
    quote.emailDeliveryNote = mailResult.note;

    const db = readDb();
    db.quotes.unshift(quote);
    writeDb(db);

    res.status(201).json({
      ok: true,
      reference: quote.reference,
      emailSent: quote.emailSent,
      emailDeliveryNote: quote.emailDeliveryNote,
      recipientEmail: process.env.QUOTE_RECIPIENT_EMAIL || 'commercial4ever@gmail.com',
    });
  },
);

app.post('/api/contact', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  if (!checkRateLimit(ip, 10, 60_000)) {
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
    createdAt: new Date().toISOString(),
  };

  const mailResult = await sendContactNotification(contact);
  contact.emailSent = mailResult.sent;

  const db = readDb();
  db.contacts.unshift(contact);
  writeDb(db);

  res.status(201).json({
    ok: true,
    emailSent: contact.emailSent,
    note: mailResult.note,
    recipientEmail: process.env.QUOTE_RECIPIENT_EMAIL || 'commercial4ever@gmail.com',
  });
});

// ---------- ADMIN AUTHENTICATION ----------

app.get('/api/admin/status', (req: Request, res: Response) => {
  const configured = isAdminConfigured();
  const adminEmail = getAuthenticatedAdminEmail(req);
  res.json({
    configured,
    authenticated: Boolean(adminEmail),
    adminEmail: adminEmail || undefined,
  });
});

app.post('/api/admin/setup', (req: Request, res: Response) => {
  if (isAdminConfigured()) {
    res.status(403).json({ error: 'Un compte administrateur principal est déjà configuré.' });
    return;
  }
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password || '';

  if (!isValidEmail(cleanEmail)) {
    res.status(400).json({ error: 'Adresse e-mail administrateur invalide.' });
    return;
  }
  if (cleanPassword.length < 8) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    return;
  }

  const db = readDb();
  db.admin = {
    email: cleanEmail,
    passwordHash: hashPassword(cleanPassword),
    createdAt: new Date().toISOString(),
  };
  writeDb(db);

  const token = createSessionToken(cleanEmail);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 12,
    path: '/',
  });
  res.json({ ok: true, adminEmail: cleanEmail });
});

app.post('/api/admin/login', (req: Request, res: Response) => {
  const configured = getConfiguredAdmin();
  if (!configured) {
    res.status(400).json({ error: 'Aucun compte administrateur configuré.' });
    return;
  }
  const { email, password } = req.body as { email?: string; password?: string };
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = password || '';

  if (cleanEmail !== configured.email || !verifyPassword(cleanPassword, configured.passwordHash)) {
    res.status(401).json({ error: 'Identifiants incorrects.' });
    return;
  }

  const token = createSessionToken(configured.email);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 12,
    path: '/',
  });
  res.json({ ok: true, adminEmail: configured.email });
});

app.post('/api/admin/logout', (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

// ---------- PROTECTED ADMIN ROUTES ----------

app.get('/api/admin/data', requireAdmin, (_req: Request, res: Response) => {
  const db = readDb();
  const pdfExists = fs.existsSync(PDF_PATH);
  res.json({
    categories: db.categories,
    realisationCategories: OFFICIAL_REALISATION_CATEGORIES,
    products: db.products,
    realisations: db.realisations,
    quotes: db.quotes.map((q) => ({ ...q, attachmentPath: undefined })),
    contacts: db.contacts,
    settings: {
      ...db.settings,
      cataloguePdfUrl: pdfExists ? '/api/catalogue-pdf' : '',
    },
    smtpConfigured: isSmtpConfigured(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post('/api/admin/upload', requireAdmin, (req: Request, res: Response) => {
  uploadMedia.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur d\'upload image.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier image fourni.' });
      return;
    }
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.originalname });
  });
});

app.post('/api/admin/catalogue-pdf', requireAdmin, (req: Request, res: Response) => {
  uploadPdf.single('pdf')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erreur d\'importation PDF.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier PDF fourni.' });
      return;
    }
    const db = readDb();
    db.settings.cataloguePdfUrl = '/api/catalogue-pdf';
    db.settings.cataloguePdfName = req.file.originalname;
    db.settings.cataloguePdfUpdatedAt = new Date().toISOString();
    writeDb(db);
    res.json({ ok: true, settings: db.settings });
  });
});

app.delete('/api/admin/catalogue-pdf', requireAdmin, (_req: Request, res: Response) => {
  if (fs.existsSync(PDF_PATH)) {
    fs.unlinkSync(PDF_PATH);
  }
  const db = readDb();
  db.settings.cataloguePdfUrl = '';
  db.settings.cataloguePdfName = '';
  db.settings.cataloguePdfUpdatedAt = '';
  writeDb(db);
  res.json({ ok: true, settings: db.settings });
});

app.post('/api/admin/extract-pdf', requireAdmin, async (_req: Request, res: Response) => {
  if (!fs.existsSync(PDF_PATH)) {
    res.status(400).json({ error: 'Veuillez d\'abord téléverser le fichier PDF 2027.' });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(400).json({ error: 'GEMINI_API_KEY non configurée sur le serveur.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const pdfBase64 = fs.readFileSync(PDF_PATH).toString('base64');
    const db = readDb();
    const validCategories = db.categories.map((c) => c.name).join(', ');

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
      error: err instanceof Error ? err.message : 'Erreur lors de l\'analyse du PDF.',
    });
  }
});

// Products CRUD
app.post('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
  const payload = req.body as Partial<ProductItem>;
  const name = (payload.name || '').trim();
  const code = (payload.code || '').trim();
  const category = (payload.category || '').trim();
  if (!name || !code || !category) {
    res.status(400).json({ error: 'Le code produit, le nom et la catégorie sont requis.' });
    return;
  }
  const now = new Date().toISOString();
  const product: ProductItem = {
    id: makeId('prod'),
    code,
    name,
    description: (payload.description || '').trim(),
    category,
    subcategory: (payload.subcategory || '').trim(),
    materials: Array.isArray(payload.materials) ? payload.materials.filter(Boolean) : [],
    customizationOptions: Array.isArray(payload.customizationOptions)
      ? payload.customizationOptions.filter(Boolean)
      : [],
    imageUrl: (payload.imageUrl || '').trim(),
    priceLabel: (payload.priceLabel || 'Prix sur devis').trim() || 'Prix sur devis',
    published: payload.published ?? true,
    featured: payload.featured ?? false,
    isDemo: payload.isDemo ?? false,
    needsVerification: payload.needsVerification ?? false,
    verificationNote: (payload.verificationNote || '').trim(),
    createdAt: now,
    updatedAt: now,
  };

  const db = readDb();
  if (product.subcategory) {
    const cat = db.categories.find((c) => c.name === product.category);
    if (cat && !cat.subcategories.includes(product.subcategory)) {
      cat.subcategories.push(product.subcategory);
    }
  }
  db.products.unshift(product);
  writeDb(db);
  res.status(201).json({ product });
});

app.post('/api/admin/products/bulk', requireAdmin, (req: Request, res: Response) => {
  const { items } = req.body as { items?: Array<Partial<ProductItem>> };
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Liste d\'articles vide.' });
    return;
  }
  const db = readDb();
  const now = new Date().toISOString();
  const created: ProductItem[] = [];
  for (const item of items) {
    if (!item.name || !item.code || !item.category) continue;
    const prod: ProductItem = {
      id: makeId('prod'),
      code: String(item.code).trim(),
      name: String(item.name).trim(),
      description: String(item.description || '').trim(),
      category: String(item.category).trim(),
      subcategory: String(item.subcategory || '').trim(),
      materials: Array.isArray(item.materials) ? item.materials.map(String).filter(Boolean) : [],
      customizationOptions: Array.isArray(item.customizationOptions)
        ? item.customizationOptions.map(String).filter(Boolean)
        : [],
      imageUrl: String(item.imageUrl || '').trim(),
      priceLabel: String(item.priceLabel || 'Prix sur devis').trim() || 'Prix sur devis',
      published: item.published ?? false,
      featured: item.featured ?? false,
      isDemo: item.isDemo ?? false,
      needsVerification: item.needsVerification ?? false,
      verificationNote: String(item.verificationNote || '').trim(),
      createdAt: now,
      updatedAt: now,
    };
    if (prod.subcategory) {
      const cat = db.categories.find((c) => c.name === prod.category);
      if (cat && !cat.subcategories.includes(prod.subcategory)) {
        cat.subcategories.push(prod.subcategory);
      }
    }
    db.products.unshift(prod);
    created.push(prod);
  }
  writeDb(db);
  res.status(201).json({ count: created.length, products: created });
});

app.put('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body as Partial<ProductItem>;
  const db = readDb();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Produit introuvable.' });
    return;
  }
  const existing = db.products[index];
  const updated: ProductItem = {
    ...existing,
    ...payload,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };
  if (updated.subcategory) {
    const cat = db.categories.find((c) => c.name === updated.category);
    if (cat && !cat.subcategories.includes(updated.subcategory)) {
      cat.subcategories.push(updated.subcategory);
    }
  }
  db.products[index] = updated;
  writeDb(db);
  res.json({ product: updated });
});

app.delete('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.products = db.products.filter((p) => p.id !== id);
  writeDb(db);
  res.json({ ok: true });
});

// Categories management
app.put('/api/admin/categories', requireAdmin, (req: Request, res: Response) => {
  const { categories } = req.body as { categories?: typeof readDb extends () => infer D ? D extends { categories: infer C } ? C : never : never };
  if (!Array.isArray(categories)) {
    res.status(400).json({ error: 'Format de catégories invalide.' });
    return;
  }
  const db = readDb();
  db.categories = categories;
  writeDb(db);
  res.json({ categories: db.categories });
});

// Realisations CRUD
app.post('/api/admin/realisations', requireAdmin, (req: Request, res: Response) => {
  const payload = req.body as Partial<RealisationItem>;
  if (!payload.title || !payload.category || !payload.imageUrl) {
    res.status(400).json({ error: 'Le titre, la catégorie et la photographie sont requis.' });
    return;
  }
  const item: RealisationItem = {
    id: makeId('real'),
    title: payload.title.trim(),
    category: payload.category.trim(),
    description: (payload.description || '').trim(),
    imageUrl: payload.imageUrl.trim(),
    published: payload.published ?? true,
    createdAt: new Date().toISOString(),
  };
  const db = readDb();
  db.realisations.unshift(item);
  writeDb(db);
  res.status(201).json({ realisation: item });
});

app.put('/api/admin/realisations/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body as Partial<RealisationItem>;
  const db = readDb();
  const idx = db.realisations.findIndex((r) => r.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Réalisation introuvable.' });
    return;
  }
  db.realisations[idx] = { ...db.realisations[idx], ...payload, id };
  writeDb(db);
  res.json({ realisation: db.realisations[idx] });
});

app.delete('/api/admin/realisations/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.realisations = db.realisations.filter((r) => r.id !== id);
  writeDb(db);
  res.json({ ok: true });
});

// Quotes admin management
app.put('/api/admin/quotes/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status?: QuoteStatus };
  const allowed: QuoteStatus[] = ['Nouveau', 'En cours', 'Devis envoyé', 'Archivé'];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: 'Statut de devis invalide.' });
    return;
  }
  const db = readDb();
  const quote = db.quotes.find((q) => q.id === id);
  if (!quote) {
    res.status(404).json({ error: 'Demande de devis introuvable.' });
    return;
  }
  quote.status = status;
  writeDb(db);
  res.json({ quote: { ...quote, attachmentPath: undefined } });
});

app.get('/api/admin/quotes/:id/attachment', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const quote = db.quotes.find((q) => q.id === id);
  if (!quote || !quote.attachmentPath || !fs.existsSync(quote.attachmentPath)) {
    res.status(404).json({ error: 'Pièce jointe introuvable.' });
    return;
  }
  res.download(quote.attachmentPath, quote.attachmentName || path.basename(quote.attachmentPath));
});

// Settings & Page Content
app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const payload = req.body as {
    socialLinks?: Record<string, string>;
    pageContent?: Record<string, unknown>;
  };
  const db = readDb();
  if (payload.socialLinks) {
    db.settings.socialLinks = {
      facebook: (payload.socialLinks.facebook || '').trim(),
      instagram: (payload.socialLinks.instagram || '').trim(),
      linkedin: (payload.socialLinks.linkedin || '').trim(),
      tiktok: (payload.socialLinks.tiktok || '').trim(),
    };
  }
  if (payload.pageContent) {
    db.settings.pageContent = {
      ...db.settings.pageContent,
      ...payload.pageContent,
      serviceImages: {
        ...db.settings.pageContent.serviceImages,
        ...((payload.pageContent.serviceImages as Record<string, string>) || {}),
      },
    };
  }
  writeDb(db);
  res.json({ settings: db.settings });
});

// ---------- SEO: SITEMAP & ROBOTS ----------

app.get('/sitemap.xml', (req: Request, res: Response) => {
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
  const db = readDb();
  const productUrls = db.products
    .filter((p) => p.published)
    .map((p) => `/catalogue/${encodeURIComponent(p.id)}`);
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

// ---------- VITE / STATIC SPA SERVING ----------

async function startServer() {
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
    console.log(`4EVER Madagascar server running on http://${HOST}:${PORT}`);
  });
}

startServer();
