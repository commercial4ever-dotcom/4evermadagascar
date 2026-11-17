import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  PRODUCTION_POLES,
  SERVICES_LIST,
  type AuditLogItem,
  type CategoryItem,
  type ContactMessage,
  type ContactStatus,
  type MediaAssetItem,
  type MediaFolder,
  type PoleConfigItem,
  type ProductItem,
  type PublicAdminUser,
  type QuoteRequest,
  type QuoteStatus,
  type RealisationItem,
  type SiteSettings,
} from '../types.ts';
import { MediaPickerModal } from '../components/admin/MediaPickerModal.tsx';
import { AdminTaxonomyPanel } from '../components/admin/AdminTaxonomyPanel.tsx';
import { AdminMediaLibraryPanel } from '../components/admin/AdminMediaLibraryPanel.tsx';
import { AdminSecurityPanel } from '../components/admin/AdminSecurityPanel.tsx';

interface AdminPageProps {
  onPublicDataChanged: () => void;
}

interface AdminDataPayload {
  user: PublicAdminUser;
  categories: CategoryItem[];
  realisationCategories: string[];
  poles: PoleConfigItem[];
  products: ProductItem[];
  realisations: RealisationItem[];
  mediaAssets: MediaAssetItem[];
  quotes: QuoteRequest[];
  contacts: ContactMessage[];
  settings: SiteSettings;
  auditLogs: AuditLogItem[];
  users: PublicAdminUser[];
  smtpConfigured: boolean;
  geminiConfigured: boolean;
  systemInfo: {
    dbDriver: string;
    storageDriver: 'r2' | 'local' | 'unconfigured';
    fileStorageAvailable?: boolean;
    r2Configured: boolean;
    r2ConfigError?: string | null;
    publicBucketName?: string;
    privateBucketName?: string;
    productionMode?: boolean;
    sessionSecretConfigured?: boolean;
  };
}

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'taxonomy'
  | 'media'
  | 'realisations'
  | 'quotes'
  | 'messages'
  | 'content'
  | 'security';

export function AdminPage({ onPublicDataChanged }: AdminPageProps) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [locked, setLocked] = useState(false);
  const [setupTokenConfigured, setSetupTokenConfigured] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Login / Setup form
  const [setupToken, setSetupToken] = useState('');
  const [setupName, setSetupName] = useState('Super Administrateur');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirm, setFormConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Admin workspace data
  const [data, setData] = useState<AdminDataPayload | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Media Picker Modal
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    folder: MediaFolder;
    onSelect: (asset: MediaAssetItem) => void;
  }>({
    open: false,
    folder: 'products',
    onSelect: () => {},
  });

  // Product editor state
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodCode, setProdCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Bureau et papeterie');
  const [prodSubcategory, setProdSubcategory] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodMaterials, setProdMaterials] = useState('');
  const [prodCustom, setProdCustom] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodMediaAssetId, setProdMediaAssetId] = useState('');
  const [prodPriceLabel, setProdPriceLabel] = useState('Prix sur devis');
  const [prodShowPrice, setProdShowPrice] = useState(false);
  const [prodPriceAmount, setProdPriceAmount] = useState('');
  const [prodCurrency, setProdCurrency] = useState('MGA');
  const [prodPriceUnit, setProdPriceUnit] = useState('/ unité');
  const [prodMinOrderQty, setProdMinOrderQty] = useState('');
  const [prodPublished, setProdPublished] = useState(true);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodIsDemo, setProdIsDemo] = useState(false);
  const [prodNeedsVerification, setProdNeedsVerification] = useState(false);
  const [prodVerificationNote, setProdVerificationNote] = useState('');
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('all');

  // Realisation editor state
  const [editingRealId, setEditingRealId] = useState<string | null>(null);
  const [realTitle, setRealTitle] = useState('');
  const [realCategory, setRealCategory] = useState('Enseignes et signalétique');
  const [realDescription, setRealDescription] = useState('');
  const [realImageUrl, setRealImageUrl] = useState('');
  const [realMediaAssetId, setRealMediaAssetId] = useState('');
  const [realSortOrder, setRealSortOrder] = useState(0);
  const [realPublished, setRealPublished] = useState(true);

  // Quotes & Messages filters/notes
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('all');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteNotesDraft, setQuoteNotesDraft] = useState<Record<string, string>>({});
  const [msgStatusFilter, setMsgStatusFilter] = useState<string>('all');
  const [msgNotesDraft, setMsgNotesDraft] = useState<Record<string, string>>({});

  // PDF extraction
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [extractedRows, setExtractedRows] = useState<Array<Partial<ProductItem>>>([]);

  // Settings local draft
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);

  const notify = useCallback((type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const loadAdminData = useCallback(async () => {
    const res = await fetch('/api/admin/data');
    if (res.ok) {
      const json = (await res.json()) as AdminDataPayload;
      setData(json);
      setSettingsDraft(json.settings);
      const qNotes: Record<string, string> = {};
      for (const q of json.quotes) qNotes[q.id] = q.adminNotes || '';
      setQuoteNotesDraft(qNotes);
      const mNotes: Record<string, string> = {};
      for (const c of json.contacts) mNotes[c.id] = c.adminNotes || '';
      setMsgNotesDraft(mNotes);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/admin/status');
      const json = (await res.json()) as {
        configured?: boolean;
        locked?: boolean;
        setupTokenConfigured?: boolean;
        authenticated?: boolean;
        adminEmail?: string;
        error?: string;
      };
      if (!res.ok) {
        setAuthError(
          json.error ||
            'Persistance Cloudflare D1 indisponible en production. Vérifiez la configuration serveur.',
        );
        return;
      }
      setConfigured(Boolean(json.configured));
      setLocked(Boolean(json.locked));
      setSetupTokenConfigured(Boolean(json.setupTokenConfigured));
      setAuthenticated(Boolean(json.authenticated));
      setAdminEmail(json.adminEmail || '');
      if (json.authenticated) {
        await loadAdminData();
      }
    } finally {
      setStatusLoading(false);
    }
  }, [loadAdminData]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSetup = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (formPassword !== formConfirm) {
      setAuthError('Les mots de passe ne correspondent pas.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupToken,
          name: setupName,
          email: formEmail,
          password: formPassword,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; adminEmail?: string };
      if (!res.ok || !json.ok) {
        setAuthError(json.error || 'Erreur lors de la configuration.');
        return;
      }
      setConfigured(true);
      setLocked(true);
      setAuthenticated(true);
      setAdminEmail(json.adminEmail || formEmail);
      await loadAdminData();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formEmail, password: formPassword }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; adminEmail?: string };
      if (!res.ok || !json.ok) {
        setAuthError(json.error || 'Identifiants invalides.');
        return;
      }
      setAuthenticated(true);
      setAdminEmail(json.adminEmail || formEmail);
      await loadAdminData();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setData(null);
    setFormPassword('');
  };

  const uploadSingleMedia = async (
    file: File,
    folder: MediaFolder = 'products',
  ): Promise<MediaAssetItem | null> => {
    const fd = new FormData();
    fd.append('folder', folder);
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const json = (await res.json()) as { asset?: MediaAssetItem; error?: string };
    if (!res.ok || !json.asset) {
      notify('err', json.error || "Échec du téléversement.");
      return null;
    }
    await loadAdminData();
    return json.asset;
  };

  const openMediaPicker = (folder: MediaFolder, onSelect: (asset: MediaAssetItem) => void) => {
    setPickerState({ open: true, folder, onSelect });
  };

  // ---------- PRODUCT HANDLERS ----------
  const resetProductForm = () => {
    setEditingProdId(null);
    setProdCode('');
    setProdName('');
    setProdCategory(data?.categories[0]?.name || 'Bureau et papeterie');
    setProdSubcategory('');
    setProdDescription('');
    setProdMaterials('');
    setProdCustom('');
    setProdImageUrl('');
    setProdMediaAssetId('');
    setProdPriceLabel('Prix sur devis');
    setProdShowPrice(false);
    setProdPriceAmount('');
    setProdCurrency('MGA');
    setProdPriceUnit('/ unité');
    setProdMinOrderQty('');
    setProdPublished(true);
    setProdFeatured(false);
    setProdIsDemo(false);
    setProdNeedsVerification(false);
    setProdVerificationNote('');
  };

  const startEditProduct = (p: ProductItem) => {
    setEditingProdId(p.id);
    setProdCode(p.code);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdSubcategory(p.subcategory);
    setProdDescription(p.description);
    setProdMaterials(p.materials.join(', '));
    setProdCustom(p.customizationOptions.join(', '));
    setProdImageUrl(p.imageUrl);
    setProdMediaAssetId(p.mediaAssetId || '');
    setProdPriceLabel(p.priceLabel);
    setProdShowPrice(Boolean(p.showPrice));
    setProdPriceAmount(p.priceAmount !== null && p.priceAmount !== undefined ? String(p.priceAmount) : '');
    setProdCurrency(p.currency || 'MGA');
    setProdPriceUnit(p.priceUnit || '/ unité');
    setProdMinOrderQty(p.minOrderQty ? String(p.minOrderQty) : '');
    setProdPublished(p.published);
    setProdFeatured(p.featured);
    setProdIsDemo(p.isDemo);
    setProdNeedsVerification(p.needsVerification);
    setProdVerificationNote(p.verificationNote);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      code: prodCode,
      name: prodName,
      category: prodCategory,
      subcategory: prodSubcategory,
      description: prodDescription,
      materials: prodMaterials.split(',').map((s) => s.trim()).filter(Boolean),
      customizationOptions: prodCustom.split(',').map((s) => s.trim()).filter(Boolean),
      imageUrl: prodImageUrl,
      mediaAssetId: prodMediaAssetId,
      priceLabel: prodPriceLabel || 'Prix sur devis',
      showPrice: prodShowPrice,
      priceAmount: prodPriceAmount ? Number(prodPriceAmount) : null,
      currency: prodCurrency,
      priceUnit: prodPriceUnit,
      minOrderQty: prodMinOrderQty ? Number(prodMinOrderQty) : null,
      published: prodPublished,
      featured: prodFeatured,
      isDemo: prodIsDemo,
      needsVerification: prodNeedsVerification,
      verificationNote: prodVerificationNote,
    };

    const url = editingProdId ? `/api/admin/products/${editingProdId}` : '/api/admin/products';
    const method = editingProdId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      notify('err', err.error || "Erreur lors de l'enregistrement du produit.");
      return;
    }
    notify('ok', editingProdId ? 'Article mis à jour.' : 'Article ajouté au catalogue.');
    resetProductForm();
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleToggleProductField = async (p: ProductItem, field: 'published' | 'featured') => {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !p[field] }),
    });
    if (res.ok) {
      await loadAdminData();
      onPublicDataChanged();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify('ok', 'Article supprimé.');
      await loadAdminData();
      onPublicDataChanged();
    }
  };

  // ---------- REALISATION HANDLERS ----------
  const resetRealisationForm = () => {
    setEditingRealId(null);
    setRealTitle('');
    setRealCategory('Enseignes et signalétique');
    setRealDescription('');
    setRealImageUrl('');
    setRealMediaAssetId('');
    setRealSortOrder(0);
    setRealPublished(true);
  };

  const startEditRealisation = (r: RealisationItem) => {
    setEditingRealId(r.id);
    setRealTitle(r.title);
    setRealCategory(r.category);
    setRealDescription(r.description);
    setRealImageUrl(r.imageUrl);
    setRealMediaAssetId(r.mediaAssetId || '');
    setRealSortOrder(r.sortOrder ?? 0);
    setRealPublished(r.published);
  };

  const handleSaveRealisation = async (e: FormEvent) => {
    e.preventDefault();
    const url = editingRealId ? `/api/admin/realisations/${editingRealId}` : '/api/admin/realisations';
    const method = editingRealId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: realTitle,
        category: realCategory,
        description: realDescription,
        imageUrl: realImageUrl,
        mediaAssetId: realMediaAssetId,
        sortOrder: realSortOrder,
        published: realPublished,
      }),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      notify('err', err.error || "Erreur lors de l'enregistrement de la réalisation.");
      return;
    }
    notify('ok', editingRealId ? 'Réalisation mise à jour.' : 'Réalisation ajoutée.');
    resetRealisationForm();
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleDeleteRealisation = async (id: string) => {
    const res = await fetch(`/api/admin/realisations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify('ok', 'Réalisation supprimée.');
      await loadAdminData();
      onPublicDataChanged();
    }
  };

  // ---------- QUOTES & MESSAGES HANDLERS ----------
  const handleUpdateQuote = async (id: string, status?: QuoteStatus, adminNotes?: string) => {
    const res = await fetch(`/api/admin/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes }),
    });
    if (res.ok) {
      await loadAdminData();
      notify('ok', 'Dossier de devis mis à jour.');
    }
  };

  const handleUpdateContact = async (id: string, status?: ContactStatus, adminNotes?: string) => {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes }),
    });
    if (res.ok) {
      await loadAdminData();
      notify('ok', 'Message client mis à jour.');
    }
  };

  const handleDeleteContact = async (id: string) => {
    const res = await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadAdminData();
      notify('ok', 'Message supprimé.');
    }
  };

  // ---------- TAXONOMY, MEDIA & PDF HANDLERS ----------
  const handleSaveCategories = async (categories: CategoryItem[]) => {
    const res = await fetch('/api/admin/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
    if (!res.ok) {
      notify('err', 'Erreur lors de la sauvegarde des catégories.');
      return;
    }
    notify('ok', 'Catégories enregistrées.');
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleSavePole = async (poleId: string, patch: Partial<PoleConfigItem>) => {
    const res = await fetch(`/api/admin/poles/${poleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      notify('err', 'Erreur lors de la mise à jour du pôle.');
      return;
    }
    notify('ok', 'Pôle de production mis à jour.');
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleUploadMultipleMedia = async (files: FileList, folder: MediaFolder) => {
    const fd = new FormData();
    fd.append('folder', folder);
    for (const f of Array.from(files)) {
      fd.append('files', f);
    }
    const res = await fetch('/api/admin/media/upload-multiple', { method: 'POST', body: fd });
    const json = (await res.json()) as { count?: number; error?: string };
    if (!res.ok) {
      notify('err', json.error || "Erreur lors de l'import multiple.");
      return;
    }
    notify('ok', `${json.count || 0} fichier(s) importé(s) dans la médiathèque.`);
    await loadAdminData();
  };

  const handleReplaceAsset = async (assetId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/admin/media/${assetId}/replace`, { method: 'POST', body: fd });
    if (!res.ok) {
      notify('err', 'Erreur lors du remplacement du fichier.');
      return;
    }
    notify('ok', 'Fichier remplacé et liens associés mis à jour.');
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleUpdateAssetAlt = async (assetId: string, altText: string) => {
    const res = await fetch(`/api/admin/media/${assetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ altText }),
    });
    if (res.ok) {
      notify('ok', 'Texte alternatif enregistré.');
      await loadAdminData();
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    const res = await fetch(`/api/admin/media/${assetId}`, { method: 'DELETE' });
    if (res.ok) {
      notify('ok', 'Média supprimé.');
      await loadAdminData();
    }
  };

  const handleUploadPdf = async (file: File) => {
    const fd = new FormData();
    fd.append('pdf', file);
    const res = await fetch('/api/admin/catalogue-pdf', { method: 'POST', body: fd });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      notify('err', json.error || "Échec de l'importation du PDF.");
      return;
    }
    notify('ok', 'Catalogue PDF 2027 importé avec succès.');
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleDeletePdf = async () => {
    const res = await fetch('/api/admin/catalogue-pdf', { method: 'DELETE' });
    if (res.ok) {
      notify('ok', 'Catalogue PDF supprimé.');
      await loadAdminData();
      onPublicDataChanged();
    }
  };

  const handleExtractPdf = async () => {
    setExtractingPdf(true);
    try {
      const res = await fetch('/api/admin/extract-pdf', { method: 'POST' });
      const json = (await res.json()) as {
        extracted?: Array<Partial<ProductItem>>;
        error?: string;
      };
      if (!res.ok) {
        notify('err', json.error || "Erreur lors de l'extraction PDF.");
        return;
      }
      setExtractedRows(json.extracted || []);
      notify(
        'ok',
        `${json.extracted?.length || 0} article(s) détecté(s). Vérifiez avant publication.`,
      );
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleBulkImport = async (items: Array<Partial<ProductItem>>, publishImmediately: boolean) => {
    const prepared = items.map((item) => ({
      ...item,
      published: publishImmediately,
      priceLabel: item.priceLabel || 'Prix sur devis',
    }));
    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: prepared }),
    });
    const json = (await res.json()) as { count?: number; error?: string };
    if (!res.ok) {
      notify('err', json.error || "Erreur lors de l'import groupé.");
      return;
    }
    notify('ok', `${json.count || 0} article(s) importé(s).`);
    setExtractedRows([]);
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        socialLinks: settingsDraft.socialLinks,
        contactInfo: settingsDraft.contactInfo,
        pageContent: settingsDraft.pageContent,
      }),
    });
    if (res.ok) {
      notify('ok', 'Contenus et paramètres enregistrés.');
      await loadAdminData();
      onPublicDataChanged();
    } else {
      notify('err', 'Erreur lors de la sauvegarde.');
    }
  };

  // Filtered lists
  const filteredProducts = useMemo(() => {
    if (!data) return [];
    const q = prodSearch.trim().toLowerCase();
    return data.products.filter((p) => {
      const matchesCat = prodCatFilter === 'all' || p.category === prodCatFilter;
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [data, prodCatFilter, prodSearch]);

  const filteredQuotes = useMemo(() => {
    if (!data) return [];
    const q = quoteSearch.trim().toLowerCase();
    return data.quotes.filter((item) => {
      const matchesStatus = quoteStatusFilter === 'all' || item.status === quoteStatusFilter;
      const matchesQ =
        !q ||
        item.reference.toLowerCase().includes(q) ||
        item.fullName.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q);
      return matchesStatus && matchesQ;
    });
  }, [data, quoteSearch, quoteStatusFilter]);

  const filteredContacts = useMemo(() => {
    if (!data) return [];
    return data.contacts.filter(
      (c) => msgStatusFilter === 'all' || (c.status || 'Nouveau') === msgStatusFilter,
    );
  }, [data, msgStatusFilter]);

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <p className="text-sm font-medium text-[#073D37]">Chargement de l&apos;espace d&apos;administration...</p>
      </div>
    );
  }

  // AUTH GATE (ZERO HARDCODED PASSWORD, ADMIN_SETUP_TOKEN REQUIRED ON SETUP)
  if (!authenticated) {
    const showSetupForm = !configured && !locked;
    return (
      <div className="min-h-screen bg-[#073D37] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-[#073D37]/15 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <img
              src="/assets/aistudio/Logo-vert-2_472352d2.png"
              alt="4EVER"
              className="h-8 w-auto object-contain"
            />
            <Lock className="w-5 h-5 text-[#ED6F2C]" />
          </div>

          <div>
            <h1 className="font-display font-bold text-2xl text-[#073D37]">
              {showSetupForm
                ? 'Initialisation Super Administrateur'
                : 'Administration privée 4EVER'}
            </h1>
            <p className="text-xs text-[#172824]/70 mt-1.5 leading-relaxed">
              {showSetupForm
                ? "Aucun compte n'existe encore. Saisissez le jeton secret ADMIN_SETUP_TOKEN défini sur votre serveur puis créez votre compte Super Admin propriétaire unique."
                : 'Accès privé réservé au Super Administrateur et aux collaborateurs autorisés.'}
            </p>
          </div>

          {showSetupForm && !setupTokenConfigured && (
            <div className="p-4 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 leading-relaxed">
              <p className="font-semibold">Configuration serveur requise avant initialisation :</p>
              <p>
                Pour empêcher toute création de compte non autorisée, définissez la variable d&apos;environnement serveur{' '}
                <code className="px-1 py-0.5 rounded bg-amber-100 font-mono">ADMIN_SETUP_TOKEN</code>{' '}
                (ex. <code>openssl rand -hex 32</code>), puis rechargez cette page.
              </p>
            </div>
          )}

          {authError && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs">
              {authError}
            </div>
          )}

          {(!showSetupForm || setupTokenConfigured) && (
            <form onSubmit={showSetupForm ? handleSetup : handleLogin} className="space-y-4">
              {showSetupForm && (
                <>
                  <div>
                    <label htmlFor="setup-token" className="block text-xs font-semibold text-[#073D37] mb-1">
                      Jeton d&apos;initialisation (ADMIN_SETUP_TOKEN) *
                    </label>
                    <input
                      id="setup-token"
                      type="password"
                      required
                      value={setupToken}
                      onChange={(e) => setSetupToken(e.target.value)}
                      placeholder="Jeton secret serveur à usage unique"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm font-mono focus:outline-none focus:border-[#073D37]"
                    />
                  </div>
                  <div>
                    <label htmlFor="setup-name" className="block text-xs font-semibold text-[#073D37] mb-1">
                      Nom du propriétaire
                    </label>
                    <input
                      id="setup-name"
                      type="text"
                      required
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="admin-email" className="block text-xs font-semibold text-[#073D37] mb-1">
                  Adresse e-mail
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="commercial4ever@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                />
              </div>

              <div>
                <label htmlFor="admin-pwd" className="block text-xs font-semibold text-[#073D37] mb-1">
                  Mot de passe {showSetupForm && '(10 caractères min, lettres + chiffres)'}
                </label>
                <input
                  id="admin-pwd"
                  type="password"
                  required
                  minLength={showSetupForm ? 10 : 1}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                />
              </div>

              {showSetupForm && (
                <div>
                  <label htmlFor="admin-pwd-confirm" className="block text-xs font-semibold text-[#073D37] mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="admin-pwd-confirm"
                    type="password"
                    required
                    minLength={10}
                    value={formConfirm}
                    onChange={(e) => setFormConfirm(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authBusy}
                className="w-full py-3 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors cursor-pointer"
              >
                {authBusy
                  ? 'Validation...'
                  : showSetupForm
                    ? 'Initialiser le Super Administrateur'
                    : 'Se connecter'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#073D37]/10 text-center">
            <Link to="/" className="text-xs font-medium text-[#073D37] hover:underline">
              Retour au site public 4EVER
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userRole = data?.user.role || 'SUPER_ADMIN';
  const canEditCatalog = userRole === 'SUPER_ADMIN' || userRole === 'EDITOR';

  const navTabs: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard; visible: boolean }> = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, visible: true },
    { id: 'products', label: `Produits & Prix (${data?.products.length || 0})`, icon: Package, visible: canEditCatalog },
    { id: 'taxonomy', label: 'Catégories & 4 Pôles', icon: Award, visible: canEditCatalog },
    { id: 'media', label: `Médiathèque R2 (${data?.mediaAssets.length || 0})`, icon: FolderOpen, visible: canEditCatalog },
    { id: 'realisations', label: `Réalisations (${data?.realisations.length || 0})`, icon: ImageIcon, visible: canEditCatalog },
    { id: 'quotes', label: `Devis (${data?.quotes.length || 0})`, icon: ClipboardList, visible: true },
    { id: 'messages', label: `Messages (${data?.contacts.length || 0})`, icon: MessageSquare, visible: true },
    { id: 'content', label: 'Contenus du site', icon: Settings, visible: canEditCatalog },
    { id: 'security', label: 'Paramètres & Sécurité', icon: ShieldCheck, visible: true },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top Admin Bar */}
      <header className="bg-[#073D37] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src="/assets/aistudio/Logo-beige-2_6856e0b4.png"
              alt="4EVER Admin"
              className="h-7 w-auto object-contain shrink-0"
            />
            <span className="text-xs text-[#E4DDD2]/85 truncate hidden sm:inline">
              {data?.user.name || 'Admin'} · {adminEmail} ({userRole})
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="px-3 py-1.5 rounded border border-[#E4DDD2]/30 text-xs font-medium text-[#E4DDD2] hover:bg-white/10"
            >
              Voir le site public
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ED6F2C] text-white text-xs font-semibold hover:bg-[#d85f1f] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* 9-Module Navigation Tabs */}
      <nav className="bg-white border-b border-[#073D37]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-1.5 py-2.5">
          {navTabs
            .filter((t) => t.visible)
            .map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#073D37] text-white'
                      : 'text-[#073D37] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-md border text-sm flex items-center gap-2.5 ${
              feedback.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* MODULE 1: TABLEAU DE BORD GENERAL */}
        {activeTab === 'dashboard' && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-[#073D37]/12 p-5">
                <p className="text-xs font-semibold text-[#073D37]/70">Catalogue Produits</p>
                <p className="font-display font-bold text-3xl text-[#073D37] mt-1">{data.products.length}</p>
                <p className="text-xs text-[#172824]/65 mt-1">
                  {data.products.filter((p) => p.published).length} publié(s) ·{' '}
                  {data.products.filter((p) => p.needsVerification).length} à vérifier
                </p>
              </div>
              <div className="bg-white rounded-lg border border-[#073D37]/12 p-5">
                <p className="text-xs font-semibold text-[#073D37]/70">Demandes de devis</p>
                <p className="font-display font-bold text-3xl text-[#ED6F2C] mt-1">{data.quotes.length}</p>
                <p className="text-xs text-[#172824]/65 mt-1">
                  {data.quotes.filter((q) => q.status === 'Nouveau').length} nouveau(x) ·{' '}
                  {data.quotes.filter((q) => q.status === 'En cours').length} en cours
                </p>
              </div>
              <div className="bg-white rounded-lg border border-[#073D37]/12 p-5">
                <p className="text-xs font-semibold text-[#073D37]/70">Messages clients</p>
                <p className="font-display font-bold text-3xl text-[#073D37] mt-1">{data.contacts.length}</p>
                <p className="text-xs text-[#172824]/65 mt-1">
                  {data.contacts.filter((c) => (c.status || 'Nouveau') === 'Nouveau').length} non traité(s)
                </p>
              </div>
              <div className="bg-white rounded-lg border border-[#073D37]/12 p-5">
                <p className="text-xs font-semibold text-[#073D37]/70">Médias &amp; Réalisations</p>
                <p className="font-display font-bold text-3xl text-[#073D37] mt-1">
                  {data.mediaAssets.length} / {data.realisations.length}
                </p>
                <p className="text-xs text-[#172824]/65 mt-1">
                  {data.mediaAssets.length} média(s) · {data.realisations.length} réalisation(s)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
                <h2 className="font-display font-bold text-base text-[#073D37]">
                  État des connexions &amp; services
                </h2>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded bg-[#FAF8F5]">
                    <span className="font-medium text-[#073D37]">Base de données</span>
                    <span className="font-mono font-semibold text-[#073D37]">
                      {data.systemInfo.dbDriver === 'sqlite-local'
                        ? 'SQLite local (dév. uniquement)'
                        : data.systemInfo.dbDriver === 'unconfigured'
                          ? 'Non configurée (D1 requis)'
                          : `Cloudflare D1 (${data.systemInfo.dbDriver})`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-[#FAF8F5] gap-3">
                    <span className="font-medium text-[#073D37]">Stockage R2 (Public / Privé)</span>
                    <span className="font-mono font-semibold text-[#073D37] text-right">
                      {data.systemInfo.storageDriver === 'r2'
                        ? `R2 (${data.systemInfo.publicBucketName || '4ever-public-media'} · ${data.systemInfo.privateBucketName || '4ever-private-files'})`
                        : data.systemInfo.storageDriver === 'unconfigured'
                          ? 'Reporté (téléversements désactivés)'
                          : 'Disque local (dév. uniquement)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-[#FAF8F5]">
                    <span className="font-medium text-[#073D37]">Catalogue PDF 2027</span>
                    <span className="font-semibold text-[#073D37]">
                      {data.settings.cataloguePdfUrl ? 'Importé et en ligne' : 'En attente d\'import'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-[#FAF8F5]">
                    <span className="font-medium text-[#073D37]">Notification e-mail SMTP</span>
                    <span className="font-semibold text-[#073D37]">
                      {data.smtpConfigured ? 'Actif' : 'Mode secours mailto'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
                <h2 className="font-display font-bold text-base text-[#073D37]">
                  Dernières demandes de devis
                </h2>
                {data.quotes.length === 0 ? (
                  <p className="text-xs text-[#172824]/70 py-4">Aucune demande de devis enregistrée.</p>
                ) : (
                  <div className="divide-y divide-[#073D37]/10">
                    {data.quotes.slice(0, 5).map((q) => (
                      <div key={q.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-mono font-bold text-[#ED6F2C]">{q.reference}</span>{' '}
                          <span className="font-semibold text-[#073D37]">{q.fullName}</span>
                          {q.company && <span className="text-[#172824]/65"> — {q.company}</span>}
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#073D37]/15 font-medium text-[#073D37]">
                          {q.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: PRODUITS & PRIX */}
        {activeTab === 'products' && data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-[#073D37]">
                  {editingProdId ? "Modifier l'article" : 'Ajouter un article au catalogue'}
                </h2>
                {editingProdId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="text-xs text-[#ED6F2C] font-semibold hover:underline cursor-pointer"
                  >
                    Annuler
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#073D37] mb-1">
                      Code référence *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodCode}
                      onChange={(e) => setProdCode(e.target.value)}
                      placeholder="Ex. : 4E-001"
                      className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#073D37] mb-1">
                      Quantité minimum
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={prodMinOrderQty}
                      onChange={(e) => setProdMinOrderQty(e.target.value)}
                      placeholder="Optionnel (ex. 25)"
                      className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">Nom exact *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#073D37] mb-1">
                      Catégorie *
                    </label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    >
                      {data.categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#073D37] mb-1">
                      Sous-catégorie
                    </label>
                    <input
                      type="text"
                      value={prodSubcategory}
                      onChange={(e) => setProdSubcategory(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                  </div>
                </div>

                {/* PRICING BLOCK */}
                <div className="p-3.5 rounded-md bg-[#FAF8F5] border border-[#073D37]/12 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#073D37] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodShowPrice}
                      onChange={(e) => setProdShowPrice(e.target.checked)}
                    />
                    <span>Afficher un tarif indicatif chiffré (sinon « Prix sur devis »)</span>
                  </label>

                  {prodShowPrice ? (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        step="any"
                        value={prodPriceAmount}
                        onChange={(e) => setProdPriceAmount(e.target.value)}
                        placeholder="Montant"
                        className="px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                      />
                      <select
                        value={prodCurrency}
                        onChange={(e) => setProdCurrency(e.target.value)}
                        className="px-2 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                      >
                        <option value="MGA">MGA (Ar)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                      <input
                        type="text"
                        value={prodPriceUnit}
                        onChange={(e) => setProdPriceUnit(e.target.value)}
                        placeholder="/ unité"
                        className="px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={prodPriceLabel}
                      onChange={(e) => setProdPriceLabel(e.target.value)}
                      placeholder="Prix sur devis"
                      className="w-full px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Matériaux (virgules)
                  </label>
                  <input
                    type="text"
                    value={prodMaterials}
                    onChange={(e) => setProdMaterials(e.target.value)}
                    placeholder="Ex. : Bois, Inox, Acrylique"
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Options de personnalisation (virgules)
                  </label>
                  <input
                    type="text"
                    value={prodCustom}
                    onChange={(e) => setProdCustom(e.target.value)}
                    placeholder="Ex. : Gravure laser, UV-DTF, Sublimation"
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Photographie du produit
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      placeholder="Médiathèque R2 ou URL..."
                      className="flex-1 min-w-[140px] px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('products', (asset) => {
                          setProdImageUrl(asset.publicUrl);
                          setProdMediaAssetId(asset.id);
                        })
                      }
                      className="px-2.5 py-2 rounded border border-[#073D37]/25 text-xs font-semibold text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Médiathèque
                    </button>
                    <label className="px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer hover:bg-[#042824]">
                      Importer
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const asset = await uploadSingleMedia(f, 'products');
                            if (asset) {
                              setProdImageUrl(asset.publicUrl);
                              setProdMediaAssetId(asset.id);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodPublished}
                      onChange={(e) => setProdPublished(e.target.checked)}
                    />
                    <span>Publié</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodFeatured}
                      onChange={(e) => setProdFeatured(e.target.checked)}
                    />
                    <span>En vedette (Accueil)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodIsDemo}
                      onChange={(e) => setProdIsDemo(e.target.checked)}
                    />
                    <span>Article de démonstration</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodNeedsVerification}
                      onChange={(e) => setProdNeedsVerification(e.target.checked)}
                    />
                    <span>À vérifier</span>
                  </label>
                </div>

                {prodNeedsVerification && (
                  <input
                    type="text"
                    value={prodVerificationNote}
                    onChange={(e) => setProdVerificationNote(e.target.value)}
                    placeholder="Note de vérification..."
                    className="w-full px-3 py-2 rounded border border-amber-300 bg-amber-50 text-xs"
                  />
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] cursor-pointer"
                >
                  {editingProdId ? 'Enregistrer les modifications' : "Ajouter l'article"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-lg text-[#073D37]">
                  Catalogue ({filteredProducts.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#073D37]/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      placeholder="Code ou nom..."
                      className="pl-8 pr-3 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs w-44"
                    />
                  </div>
                  <select
                    value={prodCatFilter}
                    onChange={(e) => setProdCatFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  >
                    <option value="all">Toutes catégories</option>
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#172824]/70">
                  Aucun article correspondant. Utilisez le formulaire à gauche ou l&apos;onglet Médiathèque / PDF 2027.
                </div>
              ) : (
                <div className="divide-y divide-[#073D37]/10">
                  {filteredProducts.map((p) => (
                    <div key={p.id} className="py-3.5 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-14 h-14 rounded object-cover border border-[#073D37]/10 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded bg-[#FAF8F5] border border-[#073D37]/10 flex items-center justify-center text-[10px] text-[#073D37]/50 shrink-0">
                            Sans img
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-[#073D37]/70">{p.code}</span>
                            <span className="font-display font-bold text-sm text-[#073D37]">{p.name}</span>
                            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#073D37]/15 text-[11px] font-semibold text-[#073D37]">
                              {p.priceLabel}
                            </span>
                            {p.needsVerification && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold">
                                <AlertTriangle className="w-3 h-3" /> À vérifier
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#172824]/70 mt-0.5">
                            {p.category} {p.subcategory ? `· ${p.subcategory}` : ''}
                            {p.minOrderQty ? ` · Min ${p.minOrderQty} pcs` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleProductField(p, 'featured')}
                          className={`p-1.5 rounded cursor-pointer ${
                            p.featured ? 'text-[#ED6F2C] bg-[#ED6F2C]/10' : 'text-[#073D37]/40 hover:bg-[#FAF8F5]'
                          }`}
                          title="Mettre en vedette"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProductField(p, 'published')}
                          className={`p-1.5 rounded cursor-pointer ${
                            p.published ? 'text-emerald-700 bg-emerald-50' : 'text-[#073D37]/40 hover:bg-[#FAF8F5]'
                          }`}
                          title={p.published ? 'Publié' : 'Masqué'}
                        >
                          {p.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="px-2.5 py-1 rounded border border-[#073D37]/20 text-xs font-medium text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded text-red-700 hover:bg-red-50 cursor-pointer"
                          aria-label={`Supprimer ${p.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODULE 3: CATEGORIES & 4 POLES */}
        {activeTab === 'taxonomy' && data && (
          <AdminTaxonomyPanel
            categories={data.categories}
            poles={data.poles}
            onSaveCategories={handleSaveCategories}
            onSavePole={handleSavePole}
            onOpenMediaPicker={openMediaPicker}
            onUploadSingle={uploadSingleMedia}
          />
        )}

        {/* MODULE 4: MEDIATHEQUE R2 & CATALOGUE PDF 2027 */}
        {activeTab === 'media' && data && (
          <AdminMediaLibraryPanel
            assets={data.mediaAssets}
            storageDriver={data.systemInfo.storageDriver}
            fileStorageAvailable={data.systemInfo.fileStorageAvailable ?? true}
            r2Configured={data.systemInfo.r2Configured}
            settings={data.settings}
            geminiConfigured={data.geminiConfigured}
            onUploadMultiple={handleUploadMultipleMedia}
            onReplaceAsset={handleReplaceAsset}
            onUpdateAltText={handleUpdateAssetAlt}
            onDeleteAsset={handleDeleteAsset}
            onCopyUrl={(url) => {
              navigator.clipboard?.writeText(url);
              notify('ok', `URL copiée : ${url}`);
            }}
            onUploadPdf={handleUploadPdf}
            onDeletePdf={handleDeletePdf}
            onExtractPdf={handleExtractPdf}
            extractingPdf={extractingPdf}
            extractedRows={extractedRows}
            onBulkImport={handleBulkImport}
          />
        )}

        {/* MODULE 5: REALISATIONS */}
        {activeTab === 'realisations' && data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-[#073D37]">
                  {editingRealId ? 'Modifier la réalisation' : 'Ajouter une réalisation officielle'}
                </h2>
                {editingRealId && (
                  <button
                    type="button"
                    onClick={resetRealisationForm}
                    className="text-xs text-[#ED6F2C] font-semibold hover:underline cursor-pointer"
                  >
                    Annuler
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveRealisation} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Titre du projet *
                  </label>
                  <input
                    type="text"
                    required
                    value={realTitle}
                    onChange={(e) => setRealTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#073D37] mb-1">
                      Catégorie *
                    </label>
                    <select
                      value={realCategory}
                      onChange={(e) => setRealCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    >
                      {data.realisationCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#073D37] mb-1">Ordre</label>
                    <input
                      type="number"
                      value={realSortOrder}
                      onChange={(e) => setRealSortOrder(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Description courte
                  </label>
                  <textarea
                    rows={3}
                    value={realDescription}
                    onChange={(e) => setRealDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Photographie *
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      required
                      value={realImageUrl}
                      onChange={(e) => setRealImageUrl(e.target.value)}
                      placeholder="Médiathèque R2 ou URL..."
                      className="flex-1 min-w-[140px] px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        openMediaPicker('realisations', (asset) => {
                          setRealImageUrl(asset.publicUrl);
                          setRealMediaAssetId(asset.id);
                        })
                      }
                      className="px-2.5 py-2 rounded border border-[#073D37]/25 text-xs font-semibold text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      Médiathèque
                    </button>
                    <label className="px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer">
                      Importer
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const asset = await uploadSingleMedia(f, 'realisations');
                            if (asset) {
                              setRealImageUrl(asset.publicUrl);
                              setRealMediaAssetId(asset.id);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={realPublished}
                    onChange={(e) => setRealPublished(e.target.checked)}
                  />
                  <span>Publier dans le portfolio</span>
                </label>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingRealId ? 'Enregistrer la modification' : 'Ajouter la réalisation'}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-[#073D37]">
                Réalisations enregistrées ({data.realisations.length})
              </h2>
              {data.realisations.length === 0 ? (
                <p className="text-sm text-[#172824]/70 py-8 text-center">
                  Aucune réalisation enregistrée pour le moment.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.realisations.map((r) => (
                    <div
                      key={r.id}
                      className="rounded border border-[#073D37]/15 overflow-hidden bg-[#FAF8F5]"
                    >
                      <img src={r.imageUrl} alt={r.title} className="w-full h-36 object-cover" />
                      <div className="p-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-medium text-[#ED6F2C]">
                            {r.category} · {r.published ? 'Publié' : 'Masqué'}
                          </p>
                          <p className="font-display font-bold text-sm text-[#073D37]">{r.title}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditRealisation(r)}
                            className="p-1.5 text-[#073D37] hover:bg-white rounded cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRealisation(r.id)}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODULE 6: DEMANDES DE DEVIS */}
        {activeTab === 'quotes' && data && (
          <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-lg text-[#073D37]">
                  Demandes de devis ({filteredQuotes.length})
                </h2>
                <p className="text-xs text-[#172824]/70 mt-0.5">
                  SMTP : {data.smtpConfigured ? 'Actif' : 'Non configuré (secours mailto)'} · Les pièces jointes clients sont stockées en accès privé authentifié.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  placeholder="Référence, nom, entreprise..."
                  className="px-3 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs w-52"
                />
                <select
                  value={quoteStatusFilter}
                  onChange={(e) => setQuoteStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="Nouveau">Nouveau</option>
                  <option value="En cours">En cours</option>
                  <option value="Devis envoyé">Devis envoyé</option>
                  <option value="Archivé">Archivé</option>
                </select>
              </div>
            </div>

            {filteredQuotes.length === 0 ? (
              <p className="text-sm text-[#172824]/70 py-8 text-center">Aucune demande de devis correspondante.</p>
            ) : (
              <div className="space-y-4">
                {filteredQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-md border border-[#073D37]/12 bg-[#FAF8F5] p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#ED6F2C]">{q.reference}</span>{' '}
                        <span className="text-xs text-[#172824]/60">
                          · {new Date(q.createdAt).toLocaleString('fr-FR')}
                        </span>
                        <h3 className="font-display font-bold text-base text-[#073D37]">
                          {q.fullName} {q.company && `— ${q.company}`}
                        </h3>
                      </div>

                      <select
                        value={q.status}
                        onChange={(e) => handleUpdateQuote(q.id, e.target.value as QuoteStatus)}
                        className="px-3 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs font-semibold text-[#073D37]"
                      >
                        <option value="Nouveau">Nouveau</option>
                        <option value="En cours">En cours</option>
                        <option value="Devis envoyé">Devis envoyé</option>
                        <option value="Archivé">Archivé</option>
                      </select>
                    </div>

                    <div className="text-xs text-[#172824]/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <p>E-mail : {q.email}</p>
                      <p>Téléphone : {q.phone}</p>
                      <p>Service : {q.serviceOrCategory || 'Non précisé'}</p>
                      {q.dimensions && <p>Dimensions : {q.dimensions}</p>}
                      {q.desiredMaterial && <p>Matière : {q.desiredMaterial}</p>}
                      {q.customizationType && <p>Personnalisation : {q.customizationType}</p>}
                    </div>

                    {q.products.length > 0 && (
                      <div className="bg-white rounded border border-[#073D37]/10 p-3 text-xs space-y-1">
                        <p className="font-semibold text-[#073D37]">Articles sélectionnés :</p>
                        {q.products.map((p, idx) => (
                          <p key={idx} className="font-mono">
                            · {p.code} — {p.name} (Qté : {p.quantity})
                          </p>
                        ))}
                      </div>
                    )}

                    {q.description && (
                      <p className="text-xs text-[#172824]/80 whitespace-pre-line">{q.description}</p>
                    )}

                    {q.attachmentName && (
                      <a
                        href={`/api/admin/quotes/${q.id}/attachment`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#073D37] hover:text-[#ED6F2C]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger la pièce jointe privée : {q.attachmentName}</span>
                      </a>
                    )}

                    <div className="pt-2 border-t border-[#073D37]/10 flex flex-wrap gap-2 items-center">
                      <input
                        type="text"
                        value={quoteNotesDraft[q.id] ?? ''}
                        onChange={(e) =>
                          setQuoteNotesDraft((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Note interne équipe (suivi commercial, montant proposé...)..."
                        className="flex-1 min-w-[220px] px-3 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQuote(q.id, q.status, quoteNotesDraft[q.id] ?? '')}
                        className="px-3 py-1.5 rounded bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] cursor-pointer"
                      >
                        Enregistrer la note
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODULE 7: MESSAGES CLIENTS */}
        {activeTab === 'messages' && data && (
          <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-bold text-lg text-[#073D37]">
                Messages clients ({filteredContacts.length})
              </h2>
              <select
                value={msgStatusFilter}
                onChange={(e) => setMsgStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
              >
                <option value="all">Tous</option>
                <option value="Nouveau">Nouveaux</option>
                <option value="Traité">Traités</option>
                <option value="Archivé">Archivés</option>
              </select>
            </div>

            {filteredContacts.length === 0 ? (
              <p className="text-sm text-[#172824]/70 py-8 text-center">Aucun message client.</p>
            ) : (
              <div className="space-y-4">
                {filteredContacts.map((c) => (
                  <div key={c.id} className="p-4 rounded-md border border-[#073D37]/12 bg-[#FAF8F5] space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-[#073D37]">
                          {c.fullName}{' '}
                          <span className="font-normal text-xs text-[#172824]/70">
                            ({c.email} {c.phone ? `· ${c.phone}` : ''})
                          </span>
                        </p>
                        <p className="text-[11px] text-[#172824]/60">
                          {new Date(c.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject || 'Votre message sur 4EVER Madagascar'}`)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#073D37]/20 bg-white text-[#073D37] font-semibold hover:bg-[#E4DDD2]/40"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Répondre</span>
                        </a>
                        <select
                          value={c.status || 'Nouveau'}
                          onChange={(e) => handleUpdateContact(c.id, e.target.value as ContactStatus)}
                          className="px-2.5 py-1 rounded border border-[#073D37]/20 bg-white font-semibold text-[#073D37]"
                        >
                          <option value="Nouveau">Nouveau</option>
                          <option value="Traité">Traité</option>
                          <option value="Archivé">Archivé</option>
                        </select>
                        {userRole === 'SUPER_ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {c.subject && <p className="font-semibold text-[#ED6F2C]">{c.subject}</p>}
                    <p className="text-[#172824]/85 whitespace-pre-line leading-relaxed">{c.message}</p>

                    <div className="pt-2 border-t border-[#073D37]/10 flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={msgNotesDraft[c.id] ?? ''}
                        onChange={(e) =>
                          setMsgNotesDraft((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="Note interne..."
                        className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateContact(c.id, c.status || 'Nouveau', msgNotesDraft[c.id] ?? '')}
                        className="px-3 py-1.5 rounded bg-[#073D37] text-white font-semibold cursor-pointer"
                      >
                        Enregistrer note
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODULE 8: CONTENUS DU SITE */}
        {activeTab === 'content' && settingsDraft && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-lg border border-[#073D37]/12 p-6 sm:p-8 space-y-6"
          >
            <div>
              <h2 className="font-display font-bold text-xl text-[#073D37]">
                Édition des contenus éditoriaux, visuels officiels &amp; réseaux
              </h2>
              <p className="text-xs text-[#172824]/70 mt-1">
                Laissez les champs images vides pour conserver les illustrations noir &amp; blanc actuelles jusqu&apos;à l&apos;ajout de vos photographies officielles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#073D37] mb-1">
                  Titre Hero (Accueil)
                </label>
                <input
                  type="text"
                  value={settingsDraft.pageContent.heroTitle}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      pageContent: { ...settingsDraft.pageContent, heroTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#073D37] mb-1">
                  Sous-titre Hero
                </label>
                <input
                  type="text"
                  value={settingsDraft.pageContent.heroSubtitle}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      pageContent: { ...settingsDraft.pageContent, heroSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#073D37] mb-1">
                  Introduction À propos
                </label>
                <textarea
                  rows={3}
                  value={settingsDraft.pageContent.aboutIntro}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      pageContent: { ...settingsDraft.pageContent, aboutIntro: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#073D37] mb-1">
                  Texte Atelier &amp; Équipements
                </label>
                <textarea
                  rows={3}
                  value={settingsDraft.pageContent.aboutAtelier}
                  onChange={(e) =>
                    setSettingsDraft({
                      ...settingsDraft,
                      pageContent: { ...settingsDraft.pageContent, aboutAtelier: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#073D37] mb-1">
                  Photo Équipe (Page À propos)
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={settingsDraft.pageContent.aboutTeamImageUrl}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        pageContent: {
                          ...settingsDraft.pageContent,
                          aboutTeamImageUrl: e.target.value,
                        },
                      })
                    }
                    className="flex-1 min-w-[140px] px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      openMediaPicker('editorial', (asset) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          pageContent: { ...settingsDraft.pageContent, aboutTeamImageUrl: asset.publicUrl },
                        }),
                      )
                    }
                    className="px-2.5 py-2 rounded border border-[#073D37]/25 text-xs font-semibold text-[#073D37] cursor-pointer"
                  >
                    Médiathèque
                  </button>
                  <label className="px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer">
                    Importer
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const asset = await uploadSingleMedia(f, 'editorial');
                          if (asset) {
                            setSettingsDraft({
                              ...settingsDraft,
                              pageContent: { ...settingsDraft.pageContent, aboutTeamImageUrl: asset.publicUrl },
                            });
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#073D37] mb-1">
                  Photo Atelier &amp; Équipements (Page À propos)
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={settingsDraft.pageContent.aboutAtelierImageUrl}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        pageContent: {
                          ...settingsDraft.pageContent,
                          aboutAtelierImageUrl: e.target.value,
                        },
                      })
                    }
                    className="flex-1 min-w-[140px] px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      openMediaPicker('editorial', (asset) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          pageContent: { ...settingsDraft.pageContent, aboutAtelierImageUrl: asset.publicUrl },
                        }),
                      )
                    }
                    className="px-2.5 py-2 rounded border border-[#073D37]/25 text-xs font-semibold text-[#073D37] cursor-pointer"
                  >
                    Médiathèque
                  </button>
                  <label className="px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer">
                    Importer
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const asset = await uploadSingleMedia(f, 'editorial');
                          if (asset) {
                            setSettingsDraft({
                              ...settingsDraft,
                              pageContent: {
                                ...settingsDraft.pageContent,
                                aboutAtelierImageUrl: asset.publicUrl,
                              },
                            });
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#073D37]/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display font-bold text-base text-[#073D37]">
                  Visuels des 4 Pôles de production
                </h3>
                <span className="text-[11px] text-[#073D37]/65">
                  Les emplacements vides conservent les illustrations noir &amp; blanc temporaires.
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRODUCTION_POLES.map((pole) => {
                  const hasOfficial = Boolean(
                    settingsDraft.pageContent.serviceImages?.[pole.adminImageKey]?.trim(),
                  );
                  return (
                    <div key={pole.id} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#073D37] w-40 truncate">
                        {pole.number}. {pole.title}
                      </span>
                      <input
                        type="text"
                        value={settingsDraft.pageContent.serviceImages?.[pole.adminImageKey] || ''}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            pageContent: {
                              ...settingsDraft.pageContent,
                              serviceImages: {
                                ...settingsDraft.pageContent.serviceImages,
                                [pole.adminImageKey]: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="Illustration N&B active..."
                        className="flex-1 px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                      />
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 ${
                          hasOfficial
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {hasOfficial ? 'Officiel' : 'N&B'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          openMediaPicker('editorial', (asset) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              pageContent: {
                                ...settingsDraft.pageContent,
                                serviceImages: {
                                  ...settingsDraft.pageContent.serviceImages,
                                  [pole.adminImageKey]: asset.publicUrl,
                                },
                              },
                            }),
                          )
                        }
                        className="px-2 py-1.5 rounded border border-[#073D37]/20 text-[11px] font-semibold text-[#073D37] cursor-pointer shrink-0"
                      >
                        Média
                      </button>
                      <label className="px-2.5 py-1.5 rounded bg-[#073D37] text-white text-xs cursor-pointer shrink-0">
                        Img
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="sr-only"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const asset = await uploadSingleMedia(f, 'editorial');
                              if (asset) {
                                setSettingsDraft({
                                  ...settingsDraft,
                                  pageContent: {
                                    ...settingsDraft.pageContent,
                                    serviceImages: {
                                      ...settingsDraft.pageContent.serviceImages,
                                      [pole.adminImageKey]: asset.publicUrl,
                                    },
                                  },
                                });
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#073D37]/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display font-bold text-base text-[#073D37]">
                  Photographies des 11 services
                </h3>
                <span className="text-[11px] text-[#073D37]/65">
                  Indique si un visuel officiel a remplacé l&apos;illustration noir &amp; blanc.
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SERVICES_LIST.map((srv) => {
                  const hasOfficial = Boolean(
                    settingsDraft.pageContent.serviceImages?.[srv.id]?.trim(),
                  );
                  return (
                    <div key={srv.id} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#073D37] w-40 truncate">
                        {srv.number}. {srv.title}
                      </span>
                      <input
                        type="text"
                        value={settingsDraft.pageContent.serviceImages?.[srv.id] || ''}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            pageContent: {
                              ...settingsDraft.pageContent,
                              serviceImages: {
                                ...settingsDraft.pageContent.serviceImages,
                                [srv.id]: e.target.value,
                              },
                            },
                          })
                        }
                        placeholder="Illustration N&B active..."
                        className="flex-1 px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                      />
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 ${
                          hasOfficial
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {hasOfficial ? 'Officiel' : 'N&B'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          openMediaPicker('editorial', (asset) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              pageContent: {
                                ...settingsDraft.pageContent,
                                serviceImages: {
                                  ...settingsDraft.pageContent.serviceImages,
                                  [srv.id]: asset.publicUrl,
                                },
                              },
                            }),
                          )
                        }
                        className="px-2 py-1.5 rounded border border-[#073D37]/20 text-[11px] font-semibold text-[#073D37] cursor-pointer shrink-0"
                      >
                        Média
                      </button>
                      <label className="px-2.5 py-1.5 rounded bg-[#073D37] text-white text-xs cursor-pointer shrink-0">
                        Img
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="sr-only"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const asset = await uploadSingleMedia(f, 'editorial');
                              if (asset) {
                                setSettingsDraft({
                                  ...settingsDraft,
                                  pageContent: {
                                    ...settingsDraft.pageContent,
                                    serviceImages: {
                                      ...settingsDraft.pageContent.serviceImages,
                                      [srv.id]: asset.publicUrl,
                                    },
                                  },
                                });
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#073D37]/10 space-y-3">
              <h3 className="font-display font-bold text-base text-[#073D37]">
                Coordonnées générales &amp; Réseaux sociaux
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    E-mail commercial
                  </label>
                  <input
                    type="email"
                    value={settingsDraft.contactInfo?.email || ''}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        contactInfo: {
                          ...(settingsDraft.contactInfo || {
                            email: '',
                            phone: '',
                            address: '',
                            hours: '',
                          }),
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.contactInfo?.phone || ''}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        contactInfo: {
                          ...(settingsDraft.contactInfo || {
                            email: '',
                            phone: '',
                            address: '',
                            hours: '',
                          }),
                          phone: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Adresse Showroom
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.contactInfo?.address || ''}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        contactInfo: {
                          ...(settingsDraft.contactInfo || {
                            email: '',
                            phone: '',
                            address: '',
                            hours: '',
                          }),
                          address: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">Horaires</label>
                  <input
                    type="text"
                    value={settingsDraft.contactInfo?.hours || ''}
                    onChange={(e) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        contactInfo: {
                          ...(settingsDraft.contactInfo || {
                            email: '',
                            phone: '',
                            address: '',
                            hours: '',
                          }),
                          hours: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {(['facebook', 'instagram', 'linkedin', 'tiktok'] as const).map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-[#073D37] capitalize mb-1">
                      {key}
                    </label>
                    <input
                      type="url"
                      value={settingsDraft.socialLinks[key]}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          socialLinks: { ...settingsDraft.socialLinks, [key]: e.target.value },
                        })
                      }
                      placeholder={`https://${key}.com/...`}
                      className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] cursor-pointer"
            >
              Enregistrer tous les contenus &amp; paramètres
            </button>
          </form>
        )}

        {/* MODULE 9: PARAMETRES & SECURITE */}
        {activeTab === 'security' && data && (
          <AdminSecurityPanel
            currentUser={data.user}
            systemInfo={data.systemInfo}
            users={data.users}
            auditLogs={data.auditLogs}
            onRefreshData={loadAdminData}
            onNotify={notify}
          />
        )}
      </div>

      {data && (
        <MediaPickerModal
          isOpen={pickerState.open}
          onClose={() => setPickerState((prev) => ({ ...prev, open: false }))}
          assets={data.mediaAssets}
          defaultFolder={pickerState.folder}
          fileStorageAvailable={data.systemInfo.fileStorageAvailable ?? true}
          onSelect={pickerState.onSelect}
          onUploadSingle={uploadSingleMedia}
        />
      )}
    </div>
  );
}
