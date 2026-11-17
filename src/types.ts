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
  socialLinks: SocialLinks;
  contactInfo?: ContactSettings;
  pageContent: PageContent;
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

export interface AdminSessionView {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
}

export interface AuditLogItem {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  ipAddress: string;
  createdAt: string;
}

export interface BootstrapData {
  categories: CategoryItem[];
  realisationCategories: string[];
  products: ProductItem[];
  realisations: RealisationItem[];
  poles?: PoleConfigItem[];
  settings: SiteSettings;
  smtpConfigured: boolean;
  fileStorageAvailable?: boolean;
}

export interface ServiceDefinition {
  id: string;
  number: string;
  title: string;
  shortSummary: string;
  description: string;
  materialsAndTechniques: string[];
  examples: string[];
}

export type PoleRevealVariant =
  | 'vertical-wipe'
  | 'horizontal-curtain'
  | 'depth-scale'
  | 'stagger-unfold';

export interface ProductionPole {
  id: string;
  adminImageKey: string;
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
  visualKey:
    | 'poleMatieresRigides'
    | 'poleTextilesSouples'
    | 'poleGoodiesCoffrets'
    | 'polePapeterieImpression';
  revealVariant: PoleRevealVariant;
}

export const PRODUCTION_POLES: ProductionPole[] = [
  {
    id: 'matieres-rigides',
    adminImageKey: 'pole-matieres-rigides',
    number: '01',
    shortTitle: 'Matières rigides',
    title: 'Matières rigides',
    tagline: 'Architecture matière, découpe de précision & objets structurés',
    description:
      'Transformation et façonnage sur mesure de matériaux durables pour vos enseignes, présentoirs, pièces décoratives, mobiliers et créations originales.',
    primarySectionLabel: 'Supports',
    primaryItems: [
      'Bois et contreplaqué',
      'Acrylique et plexiglas',
      'Métal',
      'Alucobond',
      'PVC et autres supports rigides compatibles',
    ],
    secondarySectionLabel: 'Savoir-faire',
    secondaryItems: [
      'Découpe laser',
      'Gravure laser',
      'Usinage CNC',
      'Impression et marquage',
      'Fabrication sur mesure',
      'Assemblage et finitions',
    ],
    applications: [
      'Objets décoratifs',
      'Enseignes et signalétique',
      'PLV et présentoirs',
      'Mobilier et agencement',
      'Cadeaux et souvenirs',
      'Pièces originales sur mesure',
    ],
    catalogueCategories: [
      'Objets en bois',
      'Signalétique et PLV',
      'Décoration et événements',
      'Autres créations',
    ],
    realisationCategories: [
      'Enseignes et signalétique',
      'Créations en bois',
      "Personnalisation d'objets",
    ],
    serviceHashes: ['decoupe-gravure-laser', 'usinage-cnc-bois', 'enseignes-signaletique'],
    visualKey: 'poleMatieresRigides',
    revealVariant: 'vertical-wipe',
  },
  {
    id: 'textiles-matieres-souples',
    adminImageKey: 'pole-textiles-matieres-souples',
    number: '02',
    shortTitle: 'Textiles & souples',
    title: 'Textiles & matières souples',
    tagline: 'Confection atelier, broderie, marquage textile & fibres locales',
    description:
      'Valorisation et confection sur mesure autour du coton, du polyester, du raphia, du tsihy et des matières souples avec une attention particulière aux finitions.',
    primarySectionLabel: 'Supports',
    primaryItems: [
      'Coton',
      'Polyester',
      'Raphia',
      'Tsihy et matières tissées traditionnelles',
      'Autres tissus et matières souples',
    ],
    secondarySectionLabel: 'Savoir-faire',
    secondaryItems: [
      'Création et confection',
      'Broderie',
      'Impression textile',
      'DTF et sublimation selon compatibilité',
      'Personnalisation',
      'Assemblage et finitions',
    ],
    applications: [
      'Vêtements personnalisés',
      'Accessoires textiles',
      'Tote bags',
      'Articles promotionnels',
      'Objets textiles originaux',
      'Décoration et créations artisanales',
    ],
    catalogueCategories: [
      'Textiles et accessoires',
      'Sacs et maroquinerie',
      'Décoration et événements',
    ],
    realisationCategories: ['Textile', "Personnalisation d'objets", 'Événementiel'],
    serviceHashes: ['impression-dtf-textile', 'couture-textile', 'sublimation'],
    visualKey: 'poleTextilesSouples',
    revealVariant: 'horizontal-curtain',
  },
  {
    id: 'goodies-objets-personnalises',
    adminImageKey: 'pole-goodies-objets-personnalises',
    number: '03',
    shortTitle: 'Goodies & objets',
    title: 'Goodies & objets personnalisés',
    tagline: 'Cadeaux d’entreprise, coffrets sur mesure & séries exclusives',
    description:
      'Conception de goodies originaux ou personnalisation soignée d’objets existants pour marquer vos relations professionnelles et événements.',
    primarySectionLabel: 'Activités',
    primaryItems: [
      'Personnalisation de produits existants',
      'Conception de goodies originaux',
      'Développement de cadeaux sur mesure',
      'Création de coffrets personnalisés',
      'Marquage et finitions',
    ],
    applications: [
      "Cadeaux d'entreprise",
      'Objets promotionnels',
      'Coffrets cadeaux',
      'Cadeaux événementiels',
      'Accessoires personnalisés',
      'Séries exclusives',
    ],
    catalogueCategories: [
      'Goodies et objets publicitaires',
      'Mugs, gourdes et boissons',
      'Coffrets cadeaux',
      'Objets en bois',
    ],
    realisationCategories: ["Personnalisation d'objets", 'Coffrets et packaging', 'Événementiel'],
    serviceHashes: ['impression-uv-dtf', 'packaging-coffrets', 'sublimation'],
    visualKey: 'poleGoodiesCoffrets',
    revealVariant: 'depth-scale',
  },
  {
    id: 'papeterie-impression',
    adminImageKey: 'pole-papeterie-impression',
    number: '04',
    shortTitle: 'Papeterie & impression',
    title: 'Papeterie & impression',
    tagline: 'Papiers créatifs, PAO, reliure, packaging & supports imprimés',
    description:
      'De la création graphique PAO au façonnage final (découpe, rainage, pliage, reliure), nous donnons corps à vos imprimés et emballages papier.',
    primarySectionLabel: 'Supports',
    primaryItems: [
      'Papier',
      'Carton',
      'Papier créatif',
      'Autres supports imprimables compatibles',
    ],
    secondarySectionLabel: 'Savoir-faire',
    secondaryItems: [
      'Design graphique et PAO',
      'Impression',
      'Découpe et rainage',
      'Pliage',
      'Reliure',
      'Assemblage',
      'Finitions',
    ],
    applications: [
      'Cartes de visite',
      'Flyers et brochures',
      'Invitations',
      'Packaging papier',
      'Carnets',
      'Documents commerciaux',
      'Supports événementiels',
    ],
    catalogueCategories: [
      'Bureau et papeterie',
      'Packaging et boîtes',
      'Décoration et événements',
    ],
    realisationCategories: [
      'Impression et communication visuelle',
      'Coffrets et packaging',
      'Événementiel',
    ],
    serviceHashes: ['design-graphique-pao', 'packaging-coffrets', 'creations-evenementielles'],
    visualKey: 'polePapeterieImpression',
    revealVariant: 'stagger-unfold',
  },
];

export interface FeaturedServicePole {
  id: string;
  number: string;
  title: string;
  summary: string;
  applications: string[];
  visualKey:
    | 'serviceDesignPao'
    | 'serviceCadeauxEntreprise'
    | 'serviceTextileMarquage'
    | 'serviceLaserGravure'
    | 'serviceSignaletiquePlv'
    | 'serviceWeddingEvent'
    | 'serviceStudioCreatif';
  targetHash: string;
}

export const FEATURED_SERVICE_POLES: FeaturedServicePole[] = [
  {
    id: 'design-pao',
    number: '01',
    title: 'Design graphique & PAO',
    summary:
      'Direction artistique, conception d’identités visuelles, mise en page et préparation technique prête pour l’atelier.',
    applications: [
      'Identités visuelles & chartes graphiques',
      'Mise en page de coffrets & packaging',
      'Gabarits techniques & nuanciers print',
    ],
    visualKey: 'serviceDesignPao',
    targetHash: 'design-graphique-pao',
  },
  {
    id: 'cadeaux-entreprise',
    number: '02',
    title: 'Cadeaux d’entreprise',
    summary:
      'Coffrets sur mesure, goodies utiles et objets promotionnels valorisant durablement votre image de marque.',
    applications: [
      'Coffrets d’affaires & welcome packs',
      'Mugs, gourdes isothermes & stylos',
      'Carnets reliés & papeterie personnalisée',
    ],
    visualKey: 'serviceCadeauxEntreprise',
    targetHash: 'packaging-coffrets',
  },
  {
    id: 'textile-marquage',
    number: '03',
    title: 'Textile & marquage',
    summary:
      'Confection atelier, broderie de précision, impression DTF et personnalisation de tenues et accessoires textiles.',
    applications: [
      'T-shirts, polos & sweats d’équipe',
      'Casquettes brodées & tabliers',
      'Tote bags, pochettes & confection sur mesure',
    ],
    visualKey: 'serviceTextileMarquage',
    targetHash: 'impression-dtf-textile',
  },
  {
    id: 'laser-gravure',
    number: '04',
    title: 'Laser découpe / gravure',
    summary:
      'Découpe millimétrée et gravure permanente sur bois locaux, acrylique, cuir et supports rigides nobles.',
    applications: [
      'Objets & trophées en bois gravé',
      'Plaques signalétiques & souvenirs',
      'Sous-verres, porte-clés & pièces ajourées',
    ],
    visualKey: 'serviceLaserGravure',
    targetHash: 'decoupe-gravure-laser',
  },
  {
    id: 'signaletique-plv',
    number: '05',
    title: 'Signalétique & PLV',
    summary:
      'Conception et fabrication d’enseignes architecturales, panneaux directionnels et présentoirs de points de vente.',
    applications: [
      'Enseignes intérieures & façades',
      'Panneaux directionnels & plaques de porte',
      'Displays comptoir & habillages showroom',
    ],
    visualKey: 'serviceSignaletiquePlv',
    targetHash: 'enseignes-signaletique',
  },
  {
    id: 'wedding-event',
    number: '06',
    title: 'Wedding & Event',
    summary:
      'Papeterie artisanale, cadeaux d’invités, scénographie et signalétique sur mesure pour vos événements marquants.',
    applications: [
      'Faire-part, menus & sceaux personnalisés',
      'Marque-places en bois découpé au laser',
      'Cadeaux invités & décors événementiels',
    ],
    visualKey: 'serviceWeddingEvent',
    targetHash: 'creations-evenementielles',
  },
];

export const SERVICES_LIST: ServiceDefinition[] = [
  {
    id: 'design-graphique-pao',
    number: '01',
    title: 'Design graphique et PAO',
    shortSummary: 'Conception visuelle et préparation technique avant fabrication.',
    description:
      'Nous accompagnons entreprises et porteurs de projets de l’idée initiale aux fichiers prêts pour la production, avec une exigence particulière sur la cohérence graphique et les contraintes matières.',
    materialsAndTechniques: ['Identité visuelle', 'Mise en page PAO', 'Vectorisation technique', 'Gabarits de découpe et marquage'],
    examples: ['Maquettes de coffrets cadeaux', 'Déclinaisons de papeterie corporate', 'Préparation de visuels grand format'],
  },
  {
    id: 'decoupe-gravure-laser',
    number: '02',
    title: 'Découpe et gravure laser CO₂',
    shortSummary: 'Personnalisation fine et découpes complexes multi-supports.',
    description:
      'La technologie laser CO₂ permet d’obtenir des gravures durables et des découpes nettes pour les objets promotionnels, les trophées, les pièces décoratives et la signalétique.',
    materialsAndTechniques: ['Bois massif et contreplaqué', 'Plexiglas / Acrylique', 'Cuir et similicuir', 'Carton épais et papier'],
    examples: ['Porte-clés et plaques gravées', 'Lettres découpées pour enseignes', 'Trophées et objets d’accueil'],
  },
  {
    id: 'usinage-cnc-bois',
    number: '03',
    title: 'Usinage CNC sur bois',
    shortSummary: 'Fabrication mécanique de précision pour pièces en bois et mobilier.',
    description:
      'Notre fraiseuse à commande numérique (CNC) façonne des pièces sur mesure en bois : supports de présentation, éléments de mobilier, panneaux sculptés et structures décoratives.',
    materialsAndTechniques: ['Bois locaux et essences sélectionnées', 'MDF et panneaux techniques', 'Fraisage 2D et 3D', 'Assemblage et ponçage atelier'],
    examples: ['Présentoirs comptoir en bois', 'Mobilier et agencement sur mesure', 'Panneaux décoratifs ajourés'],
  },
  {
    id: 'impression-uv-dtf',
    number: '04',
    title: 'Impression UV-DTF',
    shortSummary: 'Transfert haute tenue pour surfaces rigides et courbes.',
    description:
      'L’impression UV-DTF offre un rendu net avec vernis sélectif en relief, idéal pour personnaliser des objets rigides, contenants, verres, emballages et articles promotionnels.',
    materialsAndTechniques: ['Verre et céramique', 'Métal et inox', 'Plastique rigide et acrylique', 'Bois vernis et surfaces courbes'],
    examples: ['Gourdes et mugs personnalisés', 'Flacons et boîtes de packaging', 'Goodies corporate en petite ou moyenne série'],
  },
  {
    id: 'impression-dtf-textile',
    number: '05',
    title: 'Impression DTF textile',
    shortSummary: 'Marquage textile souple, précis et résistant aux lavages.',
    description:
      'Adaptée aux cotons, polyesters et textiles mélangés, l’impression DTF restitue fidèlement les dégradés et les détails fins sur textiles clairs comme foncés.',
    materialsAndTechniques: ['Coton et polycoton', 'Textiles clairs et foncés', 'Pressage thermique calibré', 'Rendu souple haute opacité'],
    examples: ['T-shirts et polos d’entreprise', 'Tote bags et tabliers', 'Tenues d’équipe et d’événements'],
  },
  {
    id: 'sublimation',
    number: '06',
    title: 'Sublimation',
    shortSummary: 'Impression intégrée dans la matière pour un rendu sans surépaisseur.',
    description:
      'La sublimation assure une tenue durable des couleurs sans toucher en relief sur les supports traités polyester, mugs, gourdes et textiles techniques.',
    materialsAndTechniques: ['Mugs et tasses traités', 'Textiles polyester clairs', 'Plaques aluminium sublimables', 'Tapis de souris et accessoires'],
    examples: ['Mugs d’entreprise personnalisés', 'Maillots et rubans événementiels', 'Plaques signalétiques légères'],
  },
  {
    id: 'impression-sur-bois',
    number: '07',
    title: 'Impression sur bois',
    shortSummary: 'Impression directe conservant le veinage et la chaleur du bois.',
    description:
      'Nous associons le rendu authentique des essences de bois à une impression maîtrisée pour créer des tableaux, plaques, emballages et objets décoratifs singuliers.',
    materialsAndTechniques: ['Contreplaqué et bois brut poncé', 'Traitement de surface adapté', 'Combinaison découpe laser + impression'],
    examples: ['Tableaux et plaques murales', 'Couvercles de coffrets en bois', 'Chevalets et menus pour hôtellerie'],
  },
  {
    id: 'couture-textile',
    number: '08',
    title: 'Couture, textile et personnalisation',
    shortSummary: 'Confection sur mesure et finitions textiles en atelier.',
    description:
      'De la coupe à l’assemblage final, notre atelier textile réalise des pièces utiles et durables adaptées à vos usages professionnels ou événementiels.',
    materialsAndTechniques: ['Tissus coton, toile et lin', 'Patronage et coupe', 'Surpiqûres et finitions', 'Broderie et étiquettes personnalisées'],
    examples: ['Sacs, pochettes et housses sur mesure', 'Tabliers professionnels', 'Accessoires textiles événementiels'],
  },
  {
    id: 'enseignes-signaletique',
    number: '09',
    title: 'Fabrication d’enseignes et signalétique',
    shortSummary: 'Visibilité intérieure et extérieure pour locaux, boutiques et stands.',
    description:
      'Nous concevons et fabriquons des enseignes lisibles et durables, adaptées à l’architecture de vos espaces d’accueil, bureaux et points de vente.',
    materialsAndTechniques: ['Alucobond et PVC expansé', 'Acrylique découpé', 'Bois traité et métal', 'Signalétique directionnelle et PLV'],
    examples: ['Enseignes de façade et accueil', 'Plaques de porte et totem PLV', 'Habillage de vitrines et bureaux'],
  },
  {
    id: 'packaging-coffrets',
    number: '10',
    title: 'Packaging et coffrets cadeaux',
    shortSummary: 'Écrins, boîtes et coffrets valorisant vos produits et cadeaux d’affaires.',
    description:
      'Chaque coffret est pensé comme une expérience de découverte : structure sur mesure, calage adapté au contenu, impression et finitions cohérentes avec votre image.',
    materialsAndTechniques: ['Carton rigide et kraft', 'Coffrets en bois assemblés', 'Calages mousse ou carton découpé', 'Marquage et rubans personnalisés'],
    examples: ['Coffrets cadeaux de fin d’année', 'Boîtes produits sur mesure', 'Kits de bienvenue collaborateurs'],
  },
  {
    id: 'creations-evenementielles',
    number: '11',
    title: 'Créations événementielles',
    shortSummary: 'Supports, décors et objets personnalisés pour vos temps forts.',
    description:
      'Conférences, lancements, salons ou célébrations d’entreprise : nous orchestrons la fabrication de l’ensemble des supports matériels pour un événement homogène.',
    materialsAndTechniques: ['Stands et photobooths', 'Badges, tours de cou et welcome packs', 'Trophées et signalétique temporaire', 'Décoration thématique'],
    examples: ['Kits participants pour séminaires', 'Habillage de stands et scènes', 'Trophées et cadeaux invités'],
  },
];
