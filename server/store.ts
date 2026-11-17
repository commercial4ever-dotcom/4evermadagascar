import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR, dbAll, dbGet, dbRun, ensureDatabaseInitialized, isProductionMode } from './db.ts';
import { PDF_LOCAL_PATH, ensureLocalStorageDirs, getStorageDriver } from './r2.ts';
import type {
  AdminRole,
  AdminUserRecord,
  AuditLogRecord,
  CategoryItem,
  ContactMessage,
  ContactStatus,
  LegacyJsonDbSchema,
  MediaAssetItem,
  MediaFolder,
  MediaKind,
  PoleConfigItem,
  ProductItem,
  QuoteProductLine,
  QuoteRequest,
  QuoteStatus,
  RealisationItem,
  SiteSettings,
} from './types.ts';

export const LEGACY_DB_JSON_PATH = path.join(DATA_DIR, 'db.json');

export const OFFICIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-bureau', name: 'Bureau et papeterie', slug: 'bureau-et-papeterie', subcategories: [], poleId: 'papeterie-impression', sortOrder: 1 },
  { id: 'cat-goodies', name: 'Goodies et objets publicitaires', slug: 'goodies-et-objets-publicitaires', subcategories: [], poleId: 'goodies-objets-personnalises', sortOrder: 2 },
  { id: 'cat-textiles', name: 'Textiles et accessoires', slug: 'textiles-et-accessoires', subcategories: [], poleId: 'textiles-matieres-souples', sortOrder: 3 },
  { id: 'cat-boissons', name: 'Mugs, gourdes et boissons', slug: 'mugs-gourdes-et-boissons', subcategories: [], poleId: 'goodies-objets-personnalises', sortOrder: 4 },
  { id: 'cat-sacs', name: 'Sacs et maroquinerie', slug: 'sacs-et-maroquinerie', subcategories: [], poleId: 'textiles-matieres-souples', sortOrder: 5 },
  { id: 'cat-coffrets', name: 'Coffrets cadeaux', slug: 'coffrets-cadeaux', subcategories: [], poleId: 'goodies-objets-personnalises', sortOrder: 6 },
  { id: 'cat-packaging', name: 'Packaging et boîtes', slug: 'packaging-et-boites', subcategories: [], poleId: 'papeterie-impression', sortOrder: 7 },
  { id: 'cat-bois', name: 'Objets en bois', slug: 'objets-en-bois', subcategories: [], poleId: 'matieres-rigides', sortOrder: 8 },
  { id: 'cat-deco', name: 'Décoration et événements', slug: 'decoration-et-evenements', subcategories: [], poleId: 'matieres-rigides', sortOrder: 9 },
  { id: 'cat-signaletique', name: 'Signalétique et PLV', slug: 'signaletique-et-plv', subcategories: [], poleId: 'matieres-rigides', sortOrder: 10 },
  { id: 'cat-autres', name: 'Autres créations', slug: 'autres-creations', subcategories: [], poleId: 'matieres-rigides', sortOrder: 11 },
];

export const OFFICIAL_REALISATION_CATEGORIES: string[] = [
  'Enseignes et signalétique',
  "Personnalisation d'objets",
  'Coffrets et packaging',
  'Créations en bois',
  'Textile',
  'Événementiel',
  'Impression et communication visuelle',
];

export function getDefaultSettings(): SiteSettings {
  return {
    cataloguePdfUrl: '',
    cataloguePdfName: '',
    cataloguePdfUpdatedAt: '',
    cataloguePdfKey: '',
    cataloguePdfDriver: 'local',
    socialLinks: {
      facebook: '',
      instagram: '',
      linkedin: '',
      tiktok: '',
    },
    contactInfo: {
      email: 'commercial4ever@gmail.com',
      phone: '038 32 664 11',
      address: 'Showroom 4EVER — Ampandrana, Antananarivo, Madagascar',
      hours: 'Lundi – Vendredi : 08h30 – 17h30 · Samedi : sur rendez-vous',
    },
    pageContent: {
      heroTitle: 'Vos idées prennent forme chez 4EVER.',
      heroSubtitle: 'Création, personnalisation et fabrication sur mesure pour donner vie à vos projets.',
      aboutIntro:
        "4EVER Madagascar est une marque de création, personnalisation et production installée à Antananarivo qui transforme les idées en objets uniques. Nous accompagnons particuliers, entreprises et marques dans la création d'univers visuels, d'objets personnalisés et de pièces décoratives et mobiliers design.",
      aboutAtelier:
        "Notre atelier à Antananarivo réunit des équipements de découpe et gravure laser CO₂, d'usinage CNC sur bois, d'impression UV-DTF, DTF textile, sublimation, confection textile et fabrication d'enseignes.",
      aboutTeamNote: "Emplacement prévu pour la photographie officielle de l'équipe 4EVER Madagascar.",
      aboutTeamImageUrl: '',
      aboutAtelierImageUrl: '',
      aboutPartnersNote: 'Emplacement prévu pour les logos des clients et partenaires autorisés.',
      serviceImages: {},
    },
  };
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'categorie';
}

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

let legacyImported = false;

export async function initializeStore(): Promise<void> {
  ensureLocalStorageDirs();
  await ensureDatabaseInitialized();

  if (legacyImported) return;
  legacyImported = true;

  // One-time non-destructive import from legacy data/db.json (local dev/migration only, never in production)
  if (isProductionMode() || !fs.existsSync(LEGACY_DB_JSON_PATH)) return;
  try {
    const alreadyChecked = await dbGet<{ value_json: string }>(
      'SELECT value_json FROM site_settings WHERE key = ?',
      ['_legacy_json_imported'],
    );
    if (alreadyChecked) return;

    const raw = fs.readFileSync(LEGACY_DB_JSON_PATH, 'utf-8');
    const legacy = JSON.parse(raw) as LegacyJsonDbSchema;
    const now = new Date().toISOString();

    if (Array.isArray(legacy.categories) && legacy.categories.length > 0) {
      for (let i = 0; i < legacy.categories.length; i += 1) {
        const c = legacy.categories[i];
        await dbRun(
          'INSERT OR IGNORE INTO categories (id, name, slug, subcategories_json, pole_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.slug, JSON.stringify(c.subcategories || []), c.poleId || '', i + 1],
        );
      }
    }

    if (Array.isArray(legacy.products)) {
      for (const p of legacy.products) {
        await dbRun(
          `INSERT OR IGNORE INTO products (
            id, code, name, description, category, subcategory,
            materials_json, customization_options_json, image_url,
            price_label, published, featured, is_demo, needs_verification,
            verification_note, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.code,
            p.name,
            p.description || '',
            p.category,
            p.subcategory || '',
            JSON.stringify(p.materials || []),
            JSON.stringify(p.customizationOptions || []),
            p.imageUrl || '',
            p.priceLabel || 'Prix sur devis',
            p.published ? 1 : 0,
            p.featured ? 1 : 0,
            p.isDemo ? 1 : 0,
            p.needsVerification ? 1 : 0,
            p.verificationNote || '',
            p.createdAt || now,
            p.updatedAt || now,
          ],
        );
      }
    }

    if (Array.isArray(legacy.realisations)) {
      for (const r of legacy.realisations) {
        await dbRun(
          `INSERT OR IGNORE INTO realisations (
            id, title, category, description, image_url, sort_order, published, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            r.id,
            r.title,
            r.category,
            r.description || '',
            r.imageUrl || '',
            0,
            r.published ? 1 : 0,
            r.createdAt || now,
            r.createdAt || now,
          ],
        );
      }
    }

    if (Array.isArray(legacy.quotes)) {
      for (const q of legacy.quotes) {
        await dbRun(
          `INSERT OR IGNORE INTO quotes (
            id, reference, full_name, company, email, phone,
            service_or_category, products_json, dimensions, desired_material,
            customization_type, desired_date, description, attachment_name,
            attachment_key, attachment_driver, email_sent, email_delivery_note,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            q.id,
            q.reference,
            q.fullName,
            q.company || '',
            q.email,
            q.phone,
            q.serviceOrCategory || '',
            JSON.stringify(q.products || []),
            q.dimensions || '',
            q.desiredMaterial || '',
            q.customizationType || '',
            q.desiredDate || '',
            q.description || '',
            q.attachmentName || '',
            q.attachmentKey || q.attachmentPath || '',
            'local',
            q.emailSent ? 1 : 0,
            q.emailDeliveryNote || '',
            q.status || 'Nouveau',
            q.createdAt || now,
            q.createdAt || now,
          ],
        );
      }
    }

    if (Array.isArray(legacy.contacts)) {
      for (const c of legacy.contacts) {
        await dbRun(
          `INSERT OR IGNORE INTO contact_messages (
            id, full_name, email, phone, subject, message, email_sent, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id,
            c.fullName,
            c.email,
            c.phone || '',
            c.subject || '',
            c.message,
            c.emailSent ? 1 : 0,
            'Nouveau',
            c.createdAt || now,
            c.createdAt || now,
          ],
        );
      }
    }

    if (legacy.settings) {
      const defaults = getDefaultSettings();
      const merged: SiteSettings = {
        ...defaults,
        ...legacy.settings,
        socialLinks: {
          ...defaults.socialLinks,
          ...(legacy.settings.socialLinks || {}),
        },
        contactInfo: {
          ...defaults.contactInfo!,
          ...(legacy.settings.contactInfo || {}),
        },
        pageContent: {
          ...defaults.pageContent,
          ...(legacy.settings.pageContent || {}),
          serviceImages: {
            ...defaults.pageContent.serviceImages,
            ...(legacy.settings.pageContent?.serviceImages || {}),
          },
        },
      };
      await saveSiteSettings(merged);
    }

    if (legacy.admin && legacy.admin.email && legacy.admin.passwordHash) {
      await dbRun(
        `INSERT OR IGNORE INTO admin_users (
          id, email, name, role, password_hash, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          makeId('usr'),
          legacy.admin.email.trim().toLowerCase(),
          'Super Administrateur',
          'SUPER_ADMIN',
          legacy.admin.passwordHash,
          1,
          legacy.admin.createdAt || now,
          now,
        ],
      );
    }

    await dbRun(
      'INSERT OR IGNORE INTO site_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
      ['_legacy_json_imported', JSON.stringify({ importedAt: now }), now],
    );
  } catch {
    // Never crash startup on optional legacy import
  }
}

// ---------- SETTINGS ----------

export async function getSiteSettings(): Promise<SiteSettings> {
  await initializeStore();
  const row = await dbGet<{ value_json: string }>(
    'SELECT value_json FROM site_settings WHERE key = ?',
    ['main_settings'],
  );
  const defaults = getDefaultSettings();
  const parsed = row ? safeParseJson<Partial<SiteSettings>>(row.value_json, {}) : {};
  const merged: SiteSettings = {
    ...defaults,
    ...parsed,
    socialLinks: {
      ...defaults.socialLinks,
      ...(parsed.socialLinks || {}),
    },
    contactInfo: {
      ...defaults.contactInfo!,
      ...(parsed.contactInfo || {}),
    },
    pageContent: {
      ...defaults.pageContent,
      ...(parsed.pageContent || {}),
      serviceImages: {
        ...defaults.pageContent.serviceImages,
        ...(parsed.pageContent?.serviceImages || {}),
      },
    },
  };

  const storageDriver = getStorageDriver();
  if (storageDriver === 'local') {
    const pdfExists = fs.existsSync(PDF_LOCAL_PATH);
    merged.cataloguePdfUrl = pdfExists ? '/api/catalogue-pdf' : '';
  } else if (storageDriver === 'r2' && merged.cataloguePdfKey) {
    merged.cataloguePdfUrl = '/api/catalogue-pdf';
  } else {
    merged.cataloguePdfUrl = '';
  }

  return merged;
}

export async function saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  await initializeStore();
  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO site_settings (key, value_json, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
    ['main_settings', JSON.stringify(settings), now],
  );
  return settings;
}

// ---------- CATEGORIES & POLES ----------

export async function listCategories(): Promise<CategoryItem[]> {
  await initializeStore();
  const rows = await dbAll<{
    id: string;
    name: string;
    slug: string;
    subcategories_json: string;
    pole_id: string;
    sort_order: number;
  }>('SELECT id, name, slug, subcategories_json, pole_id, sort_order FROM categories ORDER BY sort_order ASC, name ASC');

  if (rows.length === 0) return OFFICIAL_CATEGORIES;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    subcategories: safeParseJson<string[]>(r.subcategories_json, []),
    poleId: r.pole_id || '',
    sortOrder: r.sort_order ?? 0,
  }));
}

export async function replaceCategories(categories: CategoryItem[]): Promise<CategoryItem[]> {
  await initializeStore();
  const normalized: CategoryItem[] = categories
    .filter((c) => c && c.name && c.name.trim())
    .map((c, idx) => ({
      id: (c.id || '').trim() || makeId('cat'),
      name: c.name.trim(),
      slug: (c.slug || '').trim() || slugify(c.name),
      subcategories: Array.isArray(c.subcategories)
        ? Array.from(new Set(c.subcategories.map((s) => s.trim()).filter(Boolean)))
        : [],
      poleId: (c.poleId || '').trim(),
      sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : idx + 1,
    }));

  const keepIds = new Set(normalized.map((c) => c.id));
  const existing = await listCategories();
  for (const old of existing) {
    if (!keepIds.has(old.id)) {
      await dbRun('DELETE FROM categories WHERE id = ?', [old.id]);
    }
  }

  for (const cat of normalized) {
    await dbRun(
      `INSERT INTO categories (id, name, slug, subcategories_json, pole_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         slug = excluded.slug,
         subcategories_json = excluded.subcategories_json,
         pole_id = excluded.pole_id,
         sort_order = excluded.sort_order`,
      [
        cat.id,
        cat.name,
        cat.slug,
        JSON.stringify(cat.subcategories),
        cat.poleId || '',
        cat.sortOrder ?? 0,
      ],
    );
  }
  return listCategories();
}

export async function ensureCategorySubcategory(categoryName: string, subcategory: string): Promise<void> {
  if (!subcategory.trim()) return;
  const cats = await listCategories();
  const target = cats.find((c) => c.name === categoryName);
  if (target && !target.subcategories.includes(subcategory.trim())) {
    const nextSubs = [...target.subcategories, subcategory.trim()];
    await dbRun('UPDATE categories SET subcategories_json = ? WHERE id = ?', [
      JSON.stringify(nextSubs),
      target.id,
    ]);
  }
}

export async function listPoles(): Promise<PoleConfigItem[]> {
  await initializeStore();
  const rows = await dbAll<Record<string, unknown>>(
    'SELECT * FROM poles ORDER BY sort_order ASC, number ASC',
  );
  return rows.map((r) => ({
    id: String(r.id),
    number: String(r.number),
    shortTitle: String(r.short_title),
    title: String(r.title),
    tagline: String(r.tagline || ''),
    description: String(r.description || ''),
    primarySectionLabel: (r.primary_section_label === 'Activités' ? 'Activités' : 'Supports'),
    primaryItems: safeParseJson<string[]>(String(r.primary_items_json || '[]'), []),
    secondarySectionLabel: r.secondary_section_label ? 'Savoir-faire' : undefined,
    secondaryItems: safeParseJson<string[]>(String(r.secondary_items_json || '[]'), []),
    applications: safeParseJson<string[]>(String(r.applications_json || '[]'), []),
    catalogueCategories: safeParseJson<string[]>(String(r.catalogue_categories_json || '[]'), []),
    realisationCategories: safeParseJson<string[]>(String(r.realisation_categories_json || '[]'), []),
    serviceHashes: safeParseJson<string[]>(String(r.service_hashes_json || '[]'), []),
    adminImageKey: String(r.admin_image_key || ''),
    imageUrl: String(r.image_url || ''),
    sortOrder: Number(r.sort_order ?? 0),
    updatedAt: String(r.updated_at || ''),
  }));
}

export async function updatePole(id: string, patch: Partial<PoleConfigItem>): Promise<PoleConfigItem | null> {
  await initializeStore();
  const poles = await listPoles();
  const existing = poles.find((p) => p.id === id);
  if (!existing) return null;

  const updated: PoleConfigItem = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  await dbRun(
    `UPDATE poles SET
       short_title = ?, title = ?, tagline = ?, description = ?,
       primary_section_label = ?, primary_items_json = ?,
       secondary_section_label = ?, secondary_items_json = ?,
       applications_json = ?, catalogue_categories_json = ?,
       image_url = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
    [
      updated.shortTitle,
      updated.title,
      updated.tagline,
      updated.description,
      updated.primarySectionLabel,
      JSON.stringify(updated.primaryItems),
      updated.secondarySectionLabel || null,
      JSON.stringify(updated.secondaryItems || []),
      JSON.stringify(updated.applications),
      JSON.stringify(updated.catalogueCategories),
      updated.imageUrl || '',
      updated.sortOrder,
      updated.updatedAt,
      id,
    ],
  );

  // Also sync imageUrl into settings.pageContent.serviceImages[adminImageKey] for public site compatibility
  if (patch.imageUrl !== undefined && existing.adminImageKey) {
    const settings = await getSiteSettings();
    settings.pageContent.serviceImages[existing.adminImageKey] = patch.imageUrl;
    await saveSiteSettings(settings);
  }

  return updated;
}

// ---------- PRODUCTS ----------

function mapProductRow(r: Record<string, unknown>): ProductItem {
  return {
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    description: String(r.description || ''),
    category: String(r.category),
    subcategory: String(r.subcategory || ''),
    materials: safeParseJson<string[]>(String(r.materials_json || '[]'), []),
    customizationOptions: safeParseJson<string[]>(String(r.customization_options_json || '[]'), []),
    imageUrl: String(r.image_url || ''),
    mediaAssetId: r.media_asset_id ? String(r.media_asset_id) : '',
    priceLabel: String(r.price_label || 'Prix sur devis'),
    priceAmount: r.price_amount !== null && r.price_amount !== undefined ? Number(r.price_amount) : null,
    currency: String(r.currency || 'MGA'),
    priceUnit: String(r.price_unit || ''),
    minOrderQty: r.min_order_qty !== null && r.min_order_qty !== undefined ? Number(r.min_order_qty) : null,
    showPrice: Boolean(r.show_price),
    published: Boolean(r.published),
    featured: Boolean(r.featured),
    isDemo: Boolean(r.is_demo),
    needsVerification: Boolean(r.needs_verification),
    verificationNote: String(r.verification_note || ''),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listProducts(onlyPublished = false): Promise<ProductItem[]> {
  await initializeStore();
  const sql = onlyPublished
    ? 'SELECT * FROM products WHERE published = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM products ORDER BY created_at DESC';
  const rows = await dbAll<Record<string, unknown>>(sql);
  return rows.map(mapProductRow);
}

export async function getProductById(id: string): Promise<ProductItem | null> {
  await initializeStore();
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM products WHERE id = ?', [id]);
  return row ? mapProductRow(row) : null;
}

export async function createProduct(payload: Partial<ProductItem>): Promise<ProductItem> {
  await initializeStore();
  const now = new Date().toISOString();
  const showPrice = Boolean(payload.showPrice);
  const priceAmount =
    payload.priceAmount !== null && payload.priceAmount !== undefined && !Number.isNaN(Number(payload.priceAmount))
      ? Number(payload.priceAmount)
      : null;
  const currency = (payload.currency || 'MGA').trim() || 'MGA';
  const priceUnit = (payload.priceUnit || '').trim();
  const computedPriceLabel =
    showPrice && priceAmount !== null
      ? `${priceAmount.toLocaleString('fr-FR')} ${currency}${priceUnit ? ` ${priceUnit}` : ''}`
      : (payload.priceLabel || 'Prix sur devis').trim() || 'Prix sur devis';

  const product: ProductItem = {
    id: makeId('prod'),
    code: (payload.code || '').trim(),
    name: (payload.name || '').trim(),
    description: (payload.description || '').trim(),
    category: (payload.category || '').trim(),
    subcategory: (payload.subcategory || '').trim(),
    materials: Array.isArray(payload.materials) ? payload.materials.filter(Boolean) : [],
    customizationOptions: Array.isArray(payload.customizationOptions)
      ? payload.customizationOptions.filter(Boolean)
      : [],
    imageUrl: (payload.imageUrl || '').trim(),
    mediaAssetId: (payload.mediaAssetId || '').trim(),
    priceLabel: computedPriceLabel,
    priceAmount,
    currency,
    priceUnit,
    minOrderQty:
      payload.minOrderQty !== null && payload.minOrderQty !== undefined && Number(payload.minOrderQty) > 0
        ? Math.floor(Number(payload.minOrderQty))
        : null,
    showPrice,
    published: payload.published ?? true,
    featured: payload.featured ?? false,
    isDemo: payload.isDemo ?? false,
    needsVerification: payload.needsVerification ?? false,
    verificationNote: (payload.verificationNote || '').trim(),
    createdAt: now,
    updatedAt: now,
  };

  await dbRun(
    `INSERT INTO products (
      id, code, name, description, category, subcategory,
      materials_json, customization_options_json, image_url, media_asset_id,
      price_label, price_amount, currency, price_unit, min_order_qty, show_price,
      published, featured, is_demo, needs_verification, verification_note,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      product.code,
      product.name,
      product.description,
      product.category,
      product.subcategory,
      JSON.stringify(product.materials),
      JSON.stringify(product.customizationOptions),
      product.imageUrl,
      product.mediaAssetId || '',
      product.priceLabel,
      product.priceAmount ?? null,
      product.currency || 'MGA',
      product.priceUnit || '',
      product.minOrderQty ?? null,
      product.showPrice ? 1 : 0,
      product.published ? 1 : 0,
      product.featured ? 1 : 0,
      product.isDemo ? 1 : 0,
      product.needsVerification ? 1 : 0,
      product.verificationNote,
      product.createdAt,
      product.updatedAt,
    ],
  );

  if (product.subcategory) {
    await ensureCategorySubcategory(product.category, product.subcategory);
  }
  return product;
}

export async function updateProduct(id: string, patch: Partial<ProductItem>): Promise<ProductItem | null> {
  await initializeStore();
  const existing = await getProductById(id);
  if (!existing) return null;

  const showPrice = patch.showPrice !== undefined ? Boolean(patch.showPrice) : Boolean(existing.showPrice);
  const priceAmount =
    patch.priceAmount !== undefined
      ? patch.priceAmount === null || Number.isNaN(Number(patch.priceAmount))
        ? null
        : Number(patch.priceAmount)
      : existing.priceAmount ?? null;
  const currency = (patch.currency ?? existing.currency ?? 'MGA').trim() || 'MGA';
  const priceUnit = (patch.priceUnit ?? existing.priceUnit ?? '').trim();

  let priceLabel = patch.priceLabel !== undefined ? patch.priceLabel.trim() : existing.priceLabel;
  if (
    patch.showPrice !== undefined ||
    patch.priceAmount !== undefined ||
    patch.currency !== undefined ||
    patch.priceUnit !== undefined
  ) {
    priceLabel =
      showPrice && priceAmount !== null
        ? `${priceAmount.toLocaleString('fr-FR')} ${currency}${priceUnit ? ` ${priceUnit}` : ''}`
        : (patch.priceLabel || 'Prix sur devis').trim() || 'Prix sur devis';
  }

  const updated: ProductItem = {
    ...existing,
    ...patch,
    id: existing.id,
    priceLabel,
    priceAmount,
    currency,
    priceUnit,
    showPrice,
    updatedAt: new Date().toISOString(),
  };

  await dbRun(
    `UPDATE products SET
      code = ?, name = ?, description = ?, category = ?, subcategory = ?,
      materials_json = ?, customization_options_json = ?, image_url = ?, media_asset_id = ?,
      price_label = ?, price_amount = ?, currency = ?, price_unit = ?, min_order_qty = ?, show_price = ?,
      published = ?, featured = ?, is_demo = ?, needs_verification = ?, verification_note = ?, updated_at = ?
     WHERE id = ?`,
    [
      updated.code,
      updated.name,
      updated.description,
      updated.category,
      updated.subcategory,
      JSON.stringify(updated.materials || []),
      JSON.stringify(updated.customizationOptions || []),
      updated.imageUrl || '',
      updated.mediaAssetId || '',
      updated.priceLabel || 'Prix sur devis',
      updated.priceAmount ?? null,
      updated.currency || 'MGA',
      updated.priceUnit || '',
      updated.minOrderQty ?? null,
      updated.showPrice ? 1 : 0,
      updated.published ? 1 : 0,
      updated.featured ? 1 : 0,
      updated.isDemo ? 1 : 0,
      updated.needsVerification ? 1 : 0,
      updated.verificationNote || '',
      updated.updatedAt,
      id,
    ],
  );

  if (updated.subcategory) {
    await ensureCategorySubcategory(updated.category, updated.subcategory);
  }
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  await initializeStore();
  const existing = await getProductById(id);
  if (!existing) return false;
  await dbRun('DELETE FROM products WHERE id = ?', [id]);
  return true;
}

// ---------- REALISATIONS ----------

function mapRealisationRow(r: Record<string, unknown>): RealisationItem {
  return {
    id: String(r.id),
    title: String(r.title),
    category: String(r.category),
    description: String(r.description || ''),
    imageUrl: String(r.image_url || ''),
    mediaAssetId: r.media_asset_id ? String(r.media_asset_id) : '',
    sortOrder: Number(r.sort_order ?? 0),
    published: Boolean(r.published),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at || r.created_at),
  };
}

export async function listRealisations(onlyPublished = false): Promise<RealisationItem[]> {
  await initializeStore();
  const sql = onlyPublished
    ? 'SELECT * FROM realisations WHERE published = 1 ORDER BY sort_order ASC, created_at DESC'
    : 'SELECT * FROM realisations ORDER BY sort_order ASC, created_at DESC';
  const rows = await dbAll<Record<string, unknown>>(sql);
  return rows.map(mapRealisationRow);
}

export async function createRealisation(payload: Partial<RealisationItem>): Promise<RealisationItem> {
  await initializeStore();
  const now = new Date().toISOString();
  const item: RealisationItem = {
    id: makeId('real'),
    title: (payload.title || '').trim(),
    category: (payload.category || '').trim(),
    description: (payload.description || '').trim(),
    imageUrl: (payload.imageUrl || '').trim(),
    mediaAssetId: (payload.mediaAssetId || '').trim(),
    sortOrder: typeof payload.sortOrder === 'number' ? payload.sortOrder : 0,
    published: payload.published ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await dbRun(
    `INSERT INTO realisations (id, title, category, description, image_url, media_asset_id, sort_order, published, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.title,
      item.category,
      item.description,
      item.imageUrl,
      item.mediaAssetId || '',
      item.sortOrder ?? 0,
      item.published ? 1 : 0,
      item.createdAt,
      item.updatedAt,
    ],
  );
  return item;
}

export async function updateRealisation(id: string, patch: Partial<RealisationItem>): Promise<RealisationItem | null> {
  await initializeStore();
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM realisations WHERE id = ?', [id]);
  if (!row) return null;
  const existing = mapRealisationRow(row);
  const updated: RealisationItem = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };
  await dbRun(
    `UPDATE realisations SET title = ?, category = ?, description = ?, image_url = ?, media_asset_id = ?, sort_order = ?, published = ?, updated_at = ? WHERE id = ?`,
    [
      updated.title,
      updated.category,
      updated.description,
      updated.imageUrl,
      updated.mediaAssetId || '',
      updated.sortOrder ?? 0,
      updated.published ? 1 : 0,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

export async function deleteRealisation(id: string): Promise<boolean> {
  await initializeStore();
  const row = await dbGet<{ id: string }>('SELECT id FROM realisations WHERE id = ?', [id]);
  if (!row) return false;
  await dbRun('DELETE FROM realisations WHERE id = ?', [id]);
  return true;
}

// ---------- MEDIA ASSETS (R2 / LOCAL) ----------

function mapMediaRow(r: Record<string, unknown>): MediaAssetItem {
  return {
    id: String(r.id),
    filename: String(r.filename),
    originalName: String(r.original_name),
    r2Key: String(r.r2_key),
    publicUrl: String(r.public_url),
    folder: (String(r.folder || 'products') as MediaFolder),
    kind: (String(r.kind || 'photo') as MediaKind),
    mimeType: String(r.mime_type),
    sizeBytes: Number(r.size_bytes ?? 0),
    altText: String(r.alt_text || ''),
    storageDriver: (r.storage_driver === 'r2' ? 'r2' : 'local'),
    uploadedBy: String(r.uploaded_by || ''),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listMediaAssets(folder?: string): Promise<MediaAssetItem[]> {
  await initializeStore();
  const rows = folder
    ? await dbAll<Record<string, unknown>>(
        'SELECT * FROM media_assets WHERE folder = ? ORDER BY created_at DESC',
        [folder],
      )
    : await dbAll<Record<string, unknown>>('SELECT * FROM media_assets ORDER BY created_at DESC');
  return rows.map(mapMediaRow);
}

export async function getMediaAssetById(id: string): Promise<MediaAssetItem | null> {
  await initializeStore();
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM media_assets WHERE id = ?', [id]);
  return row ? mapMediaRow(row) : null;
}

export async function createMediaAsset(asset: Omit<MediaAssetItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaAssetItem> {
  await initializeStore();
  const now = new Date().toISOString();
  const created: MediaAssetItem = {
    ...asset,
    id: makeId('med'),
    createdAt: now,
    updatedAt: now,
  };
  await dbRun(
    `INSERT INTO media_assets (
      id, filename, original_name, r2_key, public_url, folder, kind,
      mime_type, size_bytes, alt_text, storage_driver, uploaded_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      created.id,
      created.filename,
      created.originalName,
      created.r2Key,
      created.publicUrl,
      created.folder,
      created.kind,
      created.mimeType,
      created.sizeBytes,
      created.altText,
      created.storageDriver,
      created.uploadedBy,
      created.createdAt,
      created.updatedAt,
    ],
  );
  return created;
}

export async function updateMediaAsset(
  id: string,
  patch: Partial<Pick<MediaAssetItem, 'altText' | 'folder' | 'kind' | 'filename' | 'originalName' | 'r2Key' | 'publicUrl' | 'mimeType' | 'sizeBytes' | 'storageDriver'>>,
): Promise<MediaAssetItem | null> {
  await initializeStore();
  const existing = await getMediaAssetById(id);
  if (!existing) return null;
  const updated: MediaAssetItem = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await dbRun(
    `UPDATE media_assets SET
      filename = ?, original_name = ?, r2_key = ?, public_url = ?, folder = ?, kind = ?,
      mime_type = ?, size_bytes = ?, alt_text = ?, storage_driver = ?, updated_at = ?
     WHERE id = ?`,
    [
      updated.filename,
      updated.originalName,
      updated.r2Key,
      updated.publicUrl,
      updated.folder,
      updated.kind,
      updated.mimeType,
      updated.sizeBytes,
      updated.altText,
      updated.storageDriver,
      updated.updatedAt,
      id,
    ],
  );
  return updated;
}

export async function deleteMediaAsset(id: string): Promise<MediaAssetItem | null> {
  await initializeStore();
  const existing = await getMediaAssetById(id);
  if (!existing) return null;
  await dbRun('DELETE FROM media_assets WHERE id = ?', [id]);
  return existing;
}

// ---------- QUOTES & CONTACTS ----------

function mapQuoteRow(r: Record<string, unknown>): QuoteRequest {
  return {
    id: String(r.id),
    reference: String(r.reference),
    fullName: String(r.full_name),
    company: String(r.company || ''),
    email: String(r.email),
    phone: String(r.phone),
    serviceOrCategory: String(r.service_or_category || ''),
    products: safeParseJson<QuoteProductLine[]>(String(r.products_json || '[]'), []),
    dimensions: String(r.dimensions || ''),
    desiredMaterial: String(r.desired_material || ''),
    customizationType: String(r.customization_type || ''),
    desiredDate: String(r.desired_date || ''),
    description: String(r.description || ''),
    attachmentName: String(r.attachment_name || ''),
    attachmentKey: String(r.attachment_key || ''),
    attachmentDriver: r.attachment_driver === 'r2' ? 'r2' : 'local',
    emailSent: Boolean(r.email_sent),
    emailDeliveryNote: String(r.email_delivery_note || ''),
    status: (String(r.status || 'Nouveau') as QuoteStatus),
    adminNotes: String(r.admin_notes || ''),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at || r.created_at),
  };
}

export async function listQuotes(): Promise<QuoteRequest[]> {
  await initializeStore();
  const rows = await dbAll<Record<string, unknown>>('SELECT * FROM quotes ORDER BY created_at DESC');
  return rows.map(mapQuoteRow);
}

export async function getQuoteById(id: string): Promise<QuoteRequest | null> {
  await initializeStore();
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM quotes WHERE id = ?', [id]);
  return row ? mapQuoteRow(row) : null;
}

export async function createQuote(quote: QuoteRequest): Promise<QuoteRequest> {
  await initializeStore();
  const now = quote.createdAt || new Date().toISOString();
  await dbRun(
    `INSERT INTO quotes (
      id, reference, full_name, company, email, phone,
      service_or_category, products_json, dimensions, desired_material,
      customization_type, desired_date, description, attachment_name,
      attachment_key, attachment_driver, email_sent, email_delivery_note,
      status, admin_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quote.id,
      quote.reference,
      quote.fullName,
      quote.company,
      quote.email,
      quote.phone,
      quote.serviceOrCategory,
      JSON.stringify(quote.products || []),
      quote.dimensions,
      quote.desiredMaterial,
      quote.customizationType,
      quote.desiredDate,
      quote.description,
      quote.attachmentName,
      quote.attachmentKey,
      quote.attachmentDriver || 'local',
      quote.emailSent ? 1 : 0,
      quote.emailDeliveryNote,
      quote.status,
      quote.adminNotes || '',
      now,
      now,
    ],
  );
  return quote;
}

export async function updateQuote(
  id: string,
  patch: { status?: QuoteStatus; adminNotes?: string },
): Promise<QuoteRequest | null> {
  await initializeStore();
  const existing = await getQuoteById(id);
  if (!existing) return null;
  const updated: QuoteRequest = {
    ...existing,
    status: patch.status ?? existing.status,
    adminNotes: patch.adminNotes !== undefined ? patch.adminNotes : existing.adminNotes || '',
    updatedAt: new Date().toISOString(),
  };
  await dbRun('UPDATE quotes SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?', [
    updated.status,
    updated.adminNotes || '',
    updated.updatedAt,
    id,
  ]);
  return updated;
}

function mapContactRow(r: Record<string, unknown>): ContactMessage {
  return {
    id: String(r.id),
    fullName: String(r.full_name),
    email: String(r.email),
    phone: String(r.phone || ''),
    subject: String(r.subject || ''),
    message: String(r.message),
    emailSent: Boolean(r.email_sent),
    status: (String(r.status || 'Nouveau') as ContactStatus),
    adminNotes: String(r.admin_notes || ''),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at || r.created_at),
  };
}

export async function listContacts(): Promise<ContactMessage[]> {
  await initializeStore();
  const rows = await dbAll<Record<string, unknown>>(
    'SELECT * FROM contact_messages ORDER BY created_at DESC',
  );
  return rows.map(mapContactRow);
}

export async function createContact(contact: ContactMessage): Promise<ContactMessage> {
  await initializeStore();
  const now = contact.createdAt || new Date().toISOString();
  await dbRun(
    `INSERT INTO contact_messages (
      id, full_name, email, phone, subject, message, email_sent, status, admin_notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      contact.id,
      contact.fullName,
      contact.email,
      contact.phone,
      contact.subject,
      contact.message,
      contact.emailSent ? 1 : 0,
      contact.status || 'Nouveau',
      contact.adminNotes || '',
      now,
      now,
    ],
  );
  return contact;
}

export async function updateContact(
  id: string,
  patch: { status?: ContactStatus; adminNotes?: string },
): Promise<ContactMessage | null> {
  await initializeStore();
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM contact_messages WHERE id = ?', [id]);
  if (!row) return null;
  const existing = mapContactRow(row);
  const updated: ContactMessage = {
    ...existing,
    status: patch.status ?? existing.status ?? 'Nouveau',
    adminNotes: patch.adminNotes !== undefined ? patch.adminNotes : existing.adminNotes || '',
    updatedAt: new Date().toISOString(),
  };
  await dbRun('UPDATE contact_messages SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?', [
    updated.status,
    updated.adminNotes || '',
    updated.updatedAt,
    id,
  ]);
  return updated;
}

export async function deleteContact(id: string): Promise<boolean> {
  await initializeStore();
  const row = await dbGet<{ id: string }>('SELECT id FROM contact_messages WHERE id = ?', [id]);
  if (!row) return false;
  await dbRun('DELETE FROM contact_messages WHERE id = ?', [id]);
  return true;
}

// ---------- ADMIN USERS & AUDIT LOGS ----------

export function mapAdminUserRow(r: Record<string, unknown>): AdminUserRecord {
  return {
    id: String(r.id),
    email: String(r.email),
    name: String(r.name || 'Administrateur'),
    role: (String(r.role || 'SUPER_ADMIN') as AdminRole),
    passwordHash: String(r.password_hash),
    isActive: Boolean(r.is_active),
    lastLoginAt: r.last_login_at ? String(r.last_login_at) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listAuditLogs(limit = 100): Promise<AuditLogRecord[]> {
  await initializeStore();
  const rows = await dbAll<Record<string, unknown>>(
    'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?',
    [Math.min(Math.max(1, limit), 300)],
  );
  return rows.map((r) => ({
    id: String(r.id),
    actorId: String(r.actor_id || ''),
    actorEmail: String(r.actor_email || ''),
    actorRole: String(r.actor_role || ''),
    action: String(r.action),
    entityType: String(r.entity_type || ''),
    entityId: String(r.entity_id || ''),
    summary: String(r.summary || ''),
    metadataJson: String(r.metadata_json || '{}'),
    ipAddress: String(r.ip_address || ''),
    createdAt: String(r.created_at),
  }));
}

export async function writeAuditLog(entry: {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  await initializeStore();
  await dbRun(
    `INSERT INTO audit_logs (
      id, actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, metadata_json, ip_address, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      makeId('aud'),
      entry.actorId || '',
      entry.actorEmail || '',
      entry.actorRole || '',
      entry.action,
      entry.entityType || '',
      entry.entityId || '',
      entry.summary,
      JSON.stringify(entry.metadata || {}),
      entry.ipAddress || '',
      new Date().toISOString(),
    ],
  );
}
