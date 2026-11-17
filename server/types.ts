export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  subcategories: string[];
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
  priceLabel: string;
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
  published: boolean;
  createdAt: string;
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
  attachmentPath: string;
  emailSent: boolean;
  emailDeliveryNote: string;
  status: QuoteStatus;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  emailSent: boolean;
  createdAt: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  linkedin: string;
  tiktok: string;
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
  socialLinks: SocialLinks;
  pageContent: PageContent;
}

export interface AdminCredentials {
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface DatabaseSchema {
  categories: CategoryItem[];
  products: ProductItem[];
  realisations: RealisationItem[];
  quotes: QuoteRequest[];
  contacts: ContactMessage[];
  settings: SiteSettings;
  admin: AdminCredentials | null;
}
