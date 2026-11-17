export type AdminRole = 'SUPER_ADMIN' | 'EDITOR' | 'SALES';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  subcategories: string[];
  poleId?: string;
  sortOrder?: number;
}

export interface PoleConfigItem {
  id: string;
  number: string;
  shortTitle: string;
  title: string;
  tagline: string;
  description: string;
  primarySectionLabel: 'Supports' | 'Activités';
  primaryItems: string[];
  secondarySectionLabel?: 'Savoir-faire';
  secondaryItems?: string[];
  applications: string[];
  catalogueCategories: string[];
  realisationCategories: string[];
  serviceHashes: string[];
  adminImageKey: string;
  imageUrl: string;
  sortOrder: number;
  updatedAt: string;
}

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  materials: string[];
  customizationOptions: string[];
  imageUrl: string;
  mediaAssetId?: string;
  priceLabel: string;
  priceAmount?: number | null;
  currency?: string;
  priceUnit?: string;
  minOrderQty?: number | null;
  showPrice?: boolean;
  published: boolean;
  featured: boolean;
  isDemo: boolean;
  needsVerification: boolean;
  verificationNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface RealisationItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  mediaAssetId?: string;
  sortOrder?: number;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type MediaFolder =
  | 'products'
  | 'realisations'
  | 'editorial'
  | 'illustrations'
  | 'documents'
  | 'catalogues';

export type MediaKind = 'photo' | 'illustration' | 'pdf' | 'document';

export interface MediaAssetItem {
  id: string;
  filename: string;
  originalName: string;
  r2Key: string;
  publicUrl: string;
  folder: MediaFolder;
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  storageDriver: 'r2' | 'local';
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteProductLine {
  productId?: string;
  code: string;
  name: string;
  quantity: number;
}

export type QuoteStatus = 'Nouveau' | 'En cours' | 'Devis envoyé' | 'Archivé';

export interface QuoteRequest {
  id: string;
  reference: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  serviceOrCategory: string;
  products: QuoteProductLine[];
  dimensions: string;
  desiredMaterial: string;
  customizationType: string;
  desiredDate: string;
  description: string;
  attachmentName: string;
  attachmentKey: string;
  attachmentDriver?: 'r2' | 'local';
  emailSent: boolean;
  emailDeliveryNote: string;
  status: QuoteStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ContactStatus = 'Nouveau' | 'Traité' | 'Archivé';

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  emailSent: boolean;
  status?: ContactStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  linkedin: string;
  tiktok: string;
}

export interface ContactSettings {
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export interface PageContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutIntro: string;
  aboutAtelier: string;
  aboutTeamNote: string;
  aboutTeamImageUrl: string;
  aboutAtelierImageUrl: string;
  aboutPartnersNote: string;
  serviceImages: Record<string, string>;
}

export interface SiteSettings {
  cataloguePdfUrl: string;
  cataloguePdfName: string;
  cataloguePdfUpdatedAt: string;
  cataloguePdfKey?: string;
  cataloguePdfDriver?: 'r2' | 'local';
  socialLinks: SocialLinks;
  contactInfo?: ContactSettings;
  pageContent: PageContent;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicAdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadataJson: string;
  ipAddress: string;
  createdAt: string;
}

export interface LegacyJsonDbSchema {
  categories?: CategoryItem[];
  products?: ProductItem[];
  realisations?: RealisationItem[];
  quotes?: Array<QuoteRequest & { attachmentPath?: string }>;
  contacts?: ContactMessage[];
  settings?: Partial<SiteSettings>;
  admin?: { email: string; passwordHash: string; createdAt: string } | null;
}
