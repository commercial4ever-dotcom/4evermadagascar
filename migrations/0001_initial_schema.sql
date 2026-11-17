-- 4EVER Madagascar — Migration 0001 : Schéma initial compatible Cloudflare D1 / SQLite
-- Non destructif : aucune instruction DROP TABLE.

CREATE TABLE IF NOT EXISTS _schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Super Administrateur',
  role TEXT NOT NULL DEFAULT 'SUPER_ADMIN', -- 'SUPER_ADMIN' | 'EDITOR' | 'SALES'
  password_hash TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_email TEXT NOT NULL DEFAULT '',
  actor_role TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  ip_address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE TABLE IF NOT EXISTS poles (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  short_title TEXT NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  primary_section_label TEXT NOT NULL DEFAULT 'Supports',
  primary_items_json TEXT NOT NULL DEFAULT '[]',
  secondary_section_label TEXT DEFAULT 'Savoir-faire',
  secondary_items_json TEXT NOT NULL DEFAULT '[]',
  applications_json TEXT NOT NULL DEFAULT '[]',
  catalogue_categories_json TEXT NOT NULL DEFAULT '[]',
  realisation_categories_json TEXT NOT NULL DEFAULT '[]',
  service_hashes_json TEXT NOT NULL DEFAULT '[]',
  admin_image_key TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  subcategories_json TEXT NOT NULL DEFAULT '[]',
  pole_id TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'products', -- 'products' | 'realisations' | 'editorial' | 'illustrations' | 'documents' | 'catalogues'
  kind TEXT NOT NULL DEFAULT 'photo', -- 'photo' | 'illustration' | 'pdf' | 'document'
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT NOT NULL DEFAULT '',
  storage_driver TEXT NOT NULL DEFAULT 'local', -- 'r2' | 'local'
  uploaded_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  materials_json TEXT NOT NULL DEFAULT '[]',
  customization_options_json TEXT NOT NULL DEFAULT '[]',
  image_url TEXT NOT NULL DEFAULT '',
  media_asset_id TEXT DEFAULT '',
  price_label TEXT NOT NULL DEFAULT 'Prix sur devis',
  price_amount REAL,
  currency TEXT NOT NULL DEFAULT 'MGA',
  price_unit TEXT NOT NULL DEFAULT '',
  min_order_qty INTEGER,
  show_price INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  needs_verification INTEGER NOT NULL DEFAULT 0,
  verification_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

CREATE TABLE IF NOT EXISTS realisations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  media_asset_id TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_realisations_published ON realisations(published);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_or_category TEXT NOT NULL DEFAULT '',
  products_json TEXT NOT NULL DEFAULT '[]',
  dimensions TEXT NOT NULL DEFAULT '',
  desired_material TEXT NOT NULL DEFAULT '',
  customization_type TEXT NOT NULL DEFAULT '',
  desired_date TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  attachment_name TEXT NOT NULL DEFAULT '',
  attachment_key TEXT NOT NULL DEFAULT '',
  attachment_driver TEXT NOT NULL DEFAULT 'local',
  email_sent INTEGER NOT NULL DEFAULT 0,
  email_delivery_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Nouveau',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  email_sent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Nouveau',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Seeds idempotents des 11 catégories officielles
INSERT OR IGNORE INTO categories (id, name, slug, subcategories_json, pole_id, sort_order) VALUES
  ('cat-bureau', 'Bureau et papeterie', 'bureau-et-papeterie', '[]', 'papeterie-impression', 1),
  ('cat-goodies', 'Goodies et objets publicitaires', 'goodies-et-objets-publicitaires', '[]', 'goodies-objets-personnalises', 2),
  ('cat-textiles', 'Textiles et accessoires', 'textiles-et-accessoires', '[]', 'textiles-matieres-souples', 3),
  ('cat-boissons', 'Mugs, gourdes et boissons', 'mugs-gourdes-et-boissons', '[]', 'goodies-objets-personnalises', 4),
  ('cat-sacs', 'Sacs et maroquinerie', 'sacs-et-maroquinerie', '[]', 'textiles-matieres-souples', 5),
  ('cat-coffrets', 'Coffrets cadeaux', 'coffrets-cadeaux', '[]', 'goodies-objets-personnalises', 6),
  ('cat-packaging', 'Packaging et boîtes', 'packaging-et-boites', '[]', 'papeterie-impression', 7),
  ('cat-bois', 'Objets en bois', 'objets-en-bois', '[]', 'matieres-rigides', 8),
  ('cat-deco', 'Décoration et événements', 'decoration-et-evenements', '[]', 'matieres-rigides', 9),
  ('cat-signaletique', 'Signalétique et PLV', 'signaletique-et-plv', '[]', 'matieres-rigides', 10),
  ('cat-autres', 'Autres créations', 'autres-creations', '[]', 'matieres-rigides', 11);

-- Seeds idempotents des 4 pôles de production officiels
INSERT OR IGNORE INTO poles (
  id, number, short_title, title, tagline, description,
  primary_section_label, primary_items_json,
  secondary_section_label, secondary_items_json,
  applications_json, catalogue_categories_json, realisation_categories_json, service_hashes_json,
  admin_image_key, image_url, sort_order, updated_at
) VALUES
  (
    'matieres-rigides', '01', 'Matières rigides', 'Matières rigides',
    'Architecture matière, découpe de précision & objets structurés',
    'Transformation et façonnage sur mesure de matériaux durables pour vos enseignes, présentoirs, pièces décoratives, mobiliers et créations originales.',
    'Supports', '["Bois et contreplaqué","Acrylique et plexiglas","Métal","Alucobond","PVC et autres supports rigides compatibles"]',
    'Savoir-faire', '["Découpe laser","Gravure laser","Usinage CNC","Impression et marquage","Fabrication sur mesure","Assemblage et finitions"]',
    '["Objets décoratifs","Enseignes et signalétique","PLV et présentoirs","Mobilier et agencement","Cadeaux et souvenirs","Pièces originales sur mesure"]',
    '["Objets en bois","Signalétique et PLV","Décoration et événements","Autres créations"]',
    '["Enseignes et signalétique","Créations en bois","Personnalisation d''objets"]',
    '["decoupe-gravure-laser","usinage-cnc-bois","enseignes-signaletique"]',
    'pole-matieres-rigides', '', 1, '2026-01-01T00:00:00.000Z'
  ),
  (
    'textiles-matieres-souples', '02', 'Textiles & souples', 'Textiles & matières souples',
    'Confection atelier, broderie, marquage textile & fibres locales',
    'Valorisation et confection sur mesure autour du coton, du polyester, du raphia, du tsihy et des matières souples avec une attention particulière aux finitions.',
    'Supports', '["Coton","Polyester","Raphia","Tsihy et matières tissées traditionnelles","Autres tissus et matières souples"]',
    'Savoir-faire', '["Création et confection","Broderie","Impression textile","DTF et sublimation selon compatibilité","Personnalisation","Assemblage et finitions"]',
    '["Vêtements personnalisés","Accessoires textiles","Tote bags","Articles promotionnels","Objets textiles originaux","Décoration et créations artisanales"]',
    '["Textiles et accessoires","Sacs et maroquinerie","Décoration et événements"]',
    '["Textile","Personnalisation d''objets","Événementiel"]',
    '["impression-dtf-textile","couture-textile","sublimation"]',
    'pole-textiles-matieres-souples', '', 2, '2026-01-01T00:00:00.000Z'
  ),
  (
    'goodies-objets-personnalises', '03', 'Goodies & objets', 'Goodies & objets personnalisés',
    'Cadeaux d’entreprise, coffrets sur mesure & séries exclusives',
    'Conception de goodies originaux ou personnalisation soignée d’objets existants pour marquer vos relations professionnelles et événements.',
    'Activités', '["Personnalisation de produits existants","Conception de goodies originaux","Développement de cadeaux sur mesure","Création de coffrets personnalisés","Marquage et finitions"]',
    NULL, '[]',
    '["Cadeaux d''entreprise","Objets promotionnels","Coffrets cadeaux","Cadeaux événementiels","Accessoires personnalisés","Séries exclusives"]',
    '["Goodies et objets publicitaires","Mugs, gourdes et boissons","Coffrets cadeaux","Objets en bois"]',
    '["Personnalisation d''objets","Coffrets et packaging","Événementiel"]',
    '["impression-uv-dtf","packaging-coffrets","sublimation"]',
    'pole-goodies-objets-personnalises', '', 3, '2026-01-01T00:00:00.000Z'
  ),
  (
    'papeterie-impression', '04', 'Papeterie & impression', 'Papeterie & impression',
    'Papiers créatifs, PAO, reliure, packaging & supports imprimés',
    'De la création graphique PAO au façonnage final (découpe, rainage, pliage, reliure), nous donnons corps à vos imprimés et emballages papier.',
    'Supports', '["Papier","Carton","Papier créatif","Autres supports imprimables compatibles"]',
    'Savoir-faire', '["Design graphique et PAO","Impression","Découpe et rainage","Pliage","Reliure","Assemblage","Finitions"]',
    '["Cartes de visite","Flyers et brochures","Invitations","Packaging papier","Carnets","Documents commerciaux","Supports événementiels"]',
    '["Bureau et papeterie","Packaging et boîtes","Décoration et événements"]',
    '["Impression et communication visuelle","Coffrets et packaging","Événementiel"]',
    '["design-graphique-pao","packaging-coffrets","creations-evenementielles"]',
    'pole-papeterie-impression', '', 4, '2026-01-01T00:00:00.000Z'
  );
