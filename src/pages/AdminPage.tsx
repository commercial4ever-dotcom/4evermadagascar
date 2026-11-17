import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Lock,
  LogOut,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  PRODUCTION_POLES,
  SERVICES_LIST,
  type CategoryItem,
  type ContactMessage,
  type ProductItem,
  type QuoteRequest,
  type QuoteStatus,
  type RealisationItem,
  type SiteSettings,
} from '../types.ts';

interface AdminPageProps {
  onPublicDataChanged: () => void;
}

interface AdminDataPayload {
  categories: CategoryItem[];
  realisationCategories: string[];
  products: ProductItem[];
  realisations: RealisationItem[];
  quotes: QuoteRequest[];
  contacts: ContactMessage[];
  settings: SiteSettings;
  smtpConfigured: boolean;
  geminiConfigured: boolean;
}

type AdminTab = 'products' | 'pdf' | 'realisations' | 'quotes' | 'settings';

export function AdminPage({ onPublicDataChanged }: AdminPageProps) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Login / setup form
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirm, setFormConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Admin workspace data
  const [data, setData] = useState<AdminDataPayload | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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
  const [prodPriceLabel, setProdPriceLabel] = useState('Prix sur devis');
  const [prodPublished, setProdPublished] = useState(true);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodIsDemo, setProdIsDemo] = useState(false);
  const [prodNeedsVerification, setProdNeedsVerification] = useState(false);
  const [prodVerificationNote, setProdVerificationNote] = useState('');

  // Realisation editor state
  const [realTitle, setRealTitle] = useState('');
  const [realCategory, setRealCategory] = useState('Enseignes et signalétique');
  const [realDescription, setRealDescription] = useState('');
  const [realImageUrl, setRealImageUrl] = useState('');
  const [realPublished, setRealPublished] = useState(true);

  // PDF extraction & CSV/JSON import
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [extractedRows, setExtractedRows] = useState<Array<Partial<ProductItem>>>([]);
  const [bulkJsonInput, setBulkJsonInput] = useState('');

  // Settings local draft
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);

  const notify = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const loadAdminData = useCallback(async () => {
    const res = await fetch('/api/admin/data');
    if (res.ok) {
      const json = (await res.json()) as AdminDataPayload;
      setData(json);
      setSettingsDraft(json.settings);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/admin/status');
      const json = (await res.json()) as {
        configured: boolean;
        authenticated: boolean;
        adminEmail?: string;
      };
      setConfigured(json.configured);
      setAuthenticated(json.authenticated);
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
        body: JSON.stringify({ email: formEmail, password: formPassword }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; adminEmail?: string };
      if (!res.ok || !json.ok) {
        setAuthError(json.error || 'Erreur lors de la configuration.');
        return;
      }
      setConfigured(true);
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

  const uploadImageFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      notify('err', json.error || 'Échec du téléversement image.');
      return null;
    }
    return json.url;
  };

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
    setProdPriceLabel('Prix sur devis');
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
    setProdPriceLabel(p.priceLabel);
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
      materials: prodMaterials
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      customizationOptions: prodCustom
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      imageUrl: prodImageUrl,
      priceLabel: prodPriceLabel || 'Prix sur devis',
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
      notify('err', err.error || 'Erreur lors de l\'enregistrement du produit.');
      return;
    }
    notify('ok', editingProdId ? 'Article mis à jour.' : 'Article ajouté au catalogue.');
    resetProductForm();
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleToggleProductField = async (
    p: ProductItem,
    field: 'published' | 'featured',
  ) => {
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

  const handleUploadPdf = async (file: File) => {
    const fd = new FormData();
    fd.append('pdf', file);
    const res = await fetch('/api/admin/catalogue-pdf', { method: 'POST', body: fd });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      notify('err', json.error || 'Échec de l\'importation du PDF.');
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
        notify('err', json.error || 'Erreur lors de l\'extraction PDF.');
        return;
      }
      setExtractedRows(json.extracted || []);
      notify(
        'ok',
        `${json.extracted?.length || 0} article(s) détecté(s) dans le PDF. Vérifiez-les avant importation.`,
      );
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleBulkImport = async (items: Array<Partial<ProductItem>>, publishImmediately: boolean) => {
    const prepared = items.map((item) => ({
      ...item,
      published: publishImmediately,
      priceLabel: 'Prix sur devis',
    }));
    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: prepared }),
    });
    const json = (await res.json()) as { count?: number; error?: string };
    if (!res.ok) {
      notify('err', json.error || 'Erreur lors de l\'import groupé.');
      return;
    }
    notify('ok', `${json.count || 0} article(s) importé(s) dans la base.`);
    setExtractedRows([]);
    setBulkJsonInput('');
    await loadAdminData();
    onPublicDataChanged();
  };

  const handleSaveRealisation = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/realisations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: realTitle,
        category: realCategory,
        description: realDescription,
        imageUrl: realImageUrl,
        published: realPublished,
      }),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      notify('err', err.error || 'Erreur lors de l\'ajout de la réalisation.');
      return;
    }
    notify('ok', 'Réalisation enregistrée.');
    setRealTitle('');
    setRealDescription('');
    setRealImageUrl('');
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

  const handleUpdateQuoteStatus = async (id: string, status: QuoteStatus) => {
    const res = await fetch(`/api/admin/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadAdminData();
      notify('ok', 'Statut du devis mis à jour.');
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settingsDraft) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        socialLinks: settingsDraft.socialLinks,
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

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <p className="text-sm font-medium text-[#073D37]">Chargement de l&apos;espace d&apos;administration...</p>
      </div>
    );
  }

  // AUTH GATE (NO HARDCODED PASSWORD)
  if (!authenticated) {
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
              {configured
                ? 'Administration privée 4EVER'
                : 'Initialisation Administrateur Principal'}
            </h1>
            <p className="text-xs text-[#172824]/70 mt-1.5 leading-relaxed">
              {configured
                ? 'Accès réservé exclusivement à l\'administrateur principal 4EVER Madagascar.'
                : 'Aucun mot de passe par défaut n\'est codé en dur. Définissez ci-dessous les identifiants sécurisés de l\'administrateur principal.'}
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={configured ? handleLogin : handleSetup} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-[#073D37] mb-1">
                Adresse e-mail administrateur
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
                Mot de passe {!configured && '(8 caractères minimum)'}
              </label>
              <input
                id="admin-pwd"
                type="password"
                required
                minLength={configured ? 1 : 8}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[#073D37]/20 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#073D37]"
              />
            </div>

            {!configured && (
              <div>
                <label htmlFor="admin-pwd-confirm" className="block text-xs font-semibold text-[#073D37] mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  id="admin-pwd-confirm"
                  type="password"
                  required
                  minLength={8}
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
                : configured
                  ? 'Se connecter'
                  : 'Créer le compte administrateur'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#073D37]/10 text-center">
            <Link to="/" className="text-xs font-medium text-[#073D37] hover:underline">
              Retour au site public 4EVER
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-xs text-[#E4DDD2]/80 truncate hidden sm:inline">
              Administration · {adminEmail}
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

      {/* Admin Tabs */}
      <div className="bg-white border-b border-[#073D37]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2 py-3">
          {[
            { id: 'products', label: `Catalogue (${data?.products.length || 0})` },
            { id: 'pdf', label: 'Catalogue PDF 2027 & Import' },
            { id: 'realisations', label: `Réalisations (${data?.realisations.length || 0})` },
            { id: 'quotes', label: `Devis & Messages (${data?.quotes.length || 0})` },
            { id: 'settings', label: 'Contenus & Paramètres' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#073D37] text-white'
                  : 'text-[#073D37] hover:bg-[#FAF8F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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

        {/* TAB 1: PRODUCTS */}
        {activeTab === 'products' && data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-[#073D37]">
                  {editingProdId ? 'Modifier l\'article' : 'Ajouter un article au catalogue'}
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
                      Mention tarifaire
                    </label>
                    <input
                      type="text"
                      value={prodPriceLabel}
                      onChange={(e) => setProdPriceLabel(e.target.value)}
                      placeholder="Prix sur devis"
                      className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Nom exact *
                  </label>
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

                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#073D37] mb-1">
                    Matériaux (séparés par des virgules)
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
                    Options de personnalisation (séparées par des virgules)
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
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      placeholder="/uploads/..."
                      className="flex-1 px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                    <label className="px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer hover:bg-[#042824] whitespace-nowrap">
                      Importer
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const url = await uploadImageFile(f);
                            if (url) setProdImageUrl(url);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodPublished}
                      onChange={(e) => setProdPublished(e.target.checked)}
                    />
                    <span>Publié sur le catalogue public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodFeatured}
                      onChange={(e) => setProdFeatured(e.target.checked)}
                    />
                    <span>Mettre en vedette sur la page d&apos;accueil</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodNeedsVerification}
                      onChange={(e) => setProdNeedsVerification(e.target.checked)}
                    />
                    <span>Signaler une ambiguïté PDF/Image à vérifier</span>
                  </label>
                  {prodNeedsVerification && (
                    <input
                      type="text"
                      value={prodVerificationNote}
                      onChange={(e) => setProdVerificationNote(e.target.value)}
                      placeholder="Précisez l'élément à vérifier..."
                      className="w-full px-3 py-2 rounded border border-amber-300 bg-amber-50 text-xs"
                    />
                  )}
                  <label className="flex items-center gap-2 cursor-pointer text-[#172824]/70">
                    <input
                      type="checkbox"
                      checked={prodIsDemo}
                      onChange={(e) => setProdIsDemo(e.target.checked)}
                    />
                    <span>Marquer comme donnée de démonstration</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors cursor-pointer"
                >
                  {editingProdId ? 'Enregistrer les modifications' : 'Ajouter l\'article'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-[#073D37]">
                Articles enregistrés ({data.products.length})
              </h2>

              {data.products.length === 0 ? (
                <p className="text-sm text-[#172824]/70 py-8 text-center">
                  Aucun article enregistré. Ajoutez des articles à gauche ou importez votre Catalogue PDF 2027 dans l&apos;onglet dédié.
                </p>
              ) : (
                <div className="divide-y divide-[#073D37]/10">
                  {data.products.map((p) => (
                    <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded bg-[#FAF8F5] border border-[#073D37]/10 overflow-hidden shrink-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#073D37]/50">
                              Sans img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-semibold text-[#073D37]">{p.code}</span>
                            <span className="text-[#172824]/60 truncate">{p.category}</span>
                            {p.needsVerification && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                          </div>
                          <p className="font-display font-semibold text-sm text-[#073D37] truncate">
                            {p.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleProductField(p, 'featured')}
                          title="Mettre en vedette"
                          className={`p-2 rounded border cursor-pointer ${
                            p.featured
                              ? 'bg-[#ED6F2C]/10 border-[#ED6F2C] text-[#ED6F2C]'
                              : 'border-[#073D37]/15 text-[#172824]/45'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProductField(p, 'published')}
                          title={p.published ? 'Masquer' : 'Publier'}
                          className={`p-2 rounded border cursor-pointer ${
                            p.published
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'border-[#073D37]/15 text-[#172824]/45'
                          }`}
                        >
                          {p.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="px-2.5 py-1.5 rounded border border-[#073D37]/20 text-xs font-medium text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 rounded text-[#172824]/50 hover:text-red-700 cursor-pointer"
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

        {/* TAB 2: PDF & IMPORT */}
        {activeTab === 'pdf' && data && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-[#073D37]">
                    Fichier officiel : Catalogue 2027 (PDF)
                  </h2>
                  <p className="text-xs text-[#172824]/70 mt-1">
                    Conservé sans modification pour la consultation et le téléchargement public (« Consulter le catalogue complet 2027 »).
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#ED6F2C] text-white text-xs font-semibold hover:bg-[#d85f1f] cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{data.settings.cataloguePdfUrl ? 'Remplacer le PDF 2027' : 'Importer le PDF 2027'}</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadPdf(f);
                    }}
                  />
                </label>
              </div>

              {data.settings.cataloguePdfUrl ? (
                <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#073D37]/15 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#073D37]" />
                    <div>
                      <p className="text-sm font-semibold text-[#073D37]">
                        {data.settings.cataloguePdfName || 'Catalogue-4EVER-Madagascar-2027.pdf'}
                      </p>
                      <p className="text-xs text-[#172824]/65">
                        Disponible en consultation publique sur /api/catalogue-pdf
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/api/catalogue-pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded border border-[#073D37]/20 text-xs font-medium text-[#073D37] bg-white"
                    >
                      Ouvrir le PDF
                    </a>
                    {data.geminiConfigured && (
                      <button
                        type="button"
                        onClick={handleExtractPdf}
                        disabled={extractingPdf}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] disabled:opacity-60 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#ED6F2C]" />
                        <span>{extractingPdf ? 'Analyse en cours...' : 'Extraire les articles du PDF'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDeletePdf}
                      className="p-2 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                      aria-label="Supprimer le PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#172824]/70">
                  Aucun PDF importé actuellement. Utilisez le bouton ci-dessus pour téléverser votre Catalogue 2027.
                </p>
              )}

              {extractedRows.length > 0 && (
                <div className="pt-4 border-t border-[#073D37]/10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display font-bold text-base text-[#073D37]">
                      Articles extraits ({extractedRows.length}) — Validation avant publication
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleBulkImport(extractedRows, false)}
                        className="px-3 py-1.5 rounded border border-[#073D37]/25 text-xs font-semibold text-[#073D37] cursor-pointer"
                      >
                        Importer en brouillons
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkImport(extractedRows, true)}
                        className="px-3 py-1.5 rounded bg-[#ED6F2C] text-white text-xs font-semibold cursor-pointer"
                      >
                        Importer et publier
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#073D37]/10 border border-[#073D37]/10 rounded p-3">
                    {extractedRows.map((row, idx) => (
                      <div key={idx} className="py-2 text-xs">
                        <span className="font-mono font-semibold text-[#073D37]">{row.code}</span> ·{' '}
                        <span className="font-semibold">{row.name}</span> ({row.category})
                        {row.needsVerification && (
                          <p className="text-amber-800 mt-0.5">
                            À vérifier : {row.verificationNote || 'Ambiguïté détectée'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bulk JSON Import */}
            <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 sm:p-8 space-y-4">
              <h2 className="font-display font-bold text-lg text-[#073D37]">
                Importation JSON structurée (mise à jour rapide)
              </h2>
              <p className="text-xs text-[#172824]/70">
                Collez un tableau JSON d&apos;articles (`code`, `name`, `category`, `subcategory`, `description`, `materials`, `customizationOptions`).
              </p>
              <textarea
                rows={5}
                value={bulkJsonInput}
                onChange={(e) => setBulkJsonInput(e.target.value)}
                placeholder='[{"code":"4E-101","name":"Stylo bambou","category":"Bureau et papeterie","description":"..."}]'
                className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(bulkJsonInput);
                    if (!Array.isArray(parsed)) throw new Error();
                    handleBulkImport(parsed, true);
                  } catch {
                    notify('err', 'JSON invalide. Vérifiez le format tableau [...].');
                  }
                }}
                className="px-4 py-2 rounded bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] cursor-pointer"
              >
                Importer la liste JSON
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: REALISATIONS */}
        {activeTab === 'realisations' && data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4 h-fit">
              <h2 className="font-display font-bold text-lg text-[#073D37]">
                Ajouter une réalisation officielle
              </h2>
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
                <div>
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
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={realImageUrl}
                      onChange={(e) => setRealImageUrl(e.target.value)}
                      placeholder="/uploads/..."
                      className="flex-1 px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                    />
                    <label className="px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer">
                      Importer
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const url = await uploadImageFile(f);
                            if (url) setRealImageUrl(url);
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
                  <span>Ajouter la réalisation</span>
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
                          <p className="text-[11px] font-medium text-[#ED6F2C]">{r.category}</p>
                          <p className="font-display font-bold text-sm text-[#073D37]">{r.title}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRealisation(r.id)}
                          className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
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

        {/* TAB 4: QUOTES & CONTACTS */}
        {activeTab === 'quotes' && data && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-bold text-lg text-[#073D37]">
                  Demandes de devis ({data.quotes.length})
                </h2>
                <span className="text-xs text-[#172824]/70">
                  SMTP serveur : {data.smtpConfigured ? 'Actif' : 'Non configuré (mode secours mailto)'}
                </span>
              </div>

              {data.quotes.length === 0 ? (
                <p className="text-sm text-[#172824]/70 py-6">Aucune demande de devis reçue.</p>
              ) : (
                <div className="space-y-4">
                  {data.quotes.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-md border border-[#073D37]/12 bg-[#FAF8F5] p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#ED6F2C]">
                            {q.reference}
                          </span>{' '}
                          <span className="text-xs text-[#172824]/60">
                            · {new Date(q.createdAt).toLocaleString('fr-FR')}
                          </span>
                          <h3 className="font-display font-bold text-base text-[#073D37]">
                            {q.fullName} {q.company && `— ${q.company}`}
                          </h3>
                        </div>

                        <select
                          value={q.status}
                          onChange={(e) =>
                            handleUpdateQuoteStatus(q.id, e.target.value as QuoteStatus)
                          }
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
                        <p className="text-xs text-[#172824]/80 whitespace-pre-line">
                          {q.description}
                        </p>
                      )}

                      {q.attachmentName && (
                        <a
                          href={`/api/admin/quotes/${q.id}/attachment`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#073D37] hover:text-[#ED6F2C]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger la pièce jointe : {q.attachmentName}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
              <h2 className="font-display font-bold text-lg text-[#073D37]">
                Messages de contact ({data.contacts.length})
              </h2>
              {data.contacts.length === 0 ? (
                <p className="text-sm text-[#172824]/70">Aucun message reçu.</p>
              ) : (
                <div className="divide-y divide-[#073D37]/10">
                  {data.contacts.map((c) => (
                    <div key={c.id} className="py-3 text-xs space-y-1">
                      <p className="font-semibold text-[#073D37]">
                        {c.fullName} ({c.email} {c.phone ? `· ${c.phone}` : ''})
                      </p>
                      {c.subject && <p className="font-medium text-[#ED6F2C]">{c.subject}</p>}
                      <p className="text-[#172824]/80">{c.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & PAGE CONTENT */}
        {activeTab === 'settings' && settingsDraft && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-lg border border-[#073D37]/12 p-6 sm:p-8 space-y-6"
          >
            <h2 className="font-display font-bold text-xl text-[#073D37]">
              Contenus des pages, photos &amp; réseaux sociaux
            </h2>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#073D37] mb-1">
                  Photo Équipe (Page À propos)
                </label>
                <div className="flex gap-2">
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
                    className="flex-1 px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                  <label className="px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer">
                    Importer
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const url = await uploadImageFile(f);
                          if (url) {
                            setSettingsDraft({
                              ...settingsDraft,
                              pageContent: { ...settingsDraft.pageContent, aboutTeamImageUrl: url },
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
                <div className="flex gap-2">
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
                    className="flex-1 px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                  />
                  <label className="px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer">
                    Importer
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const url = await uploadImageFile(f);
                          if (url) {
                            setSettingsDraft({
                              ...settingsDraft,
                              pageContent: {
                                ...settingsDraft.pageContent,
                                aboutAtelierImageUrl: url,
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
                  Les emplacements vides utilisent un visuel temporaire de substitution (aucun badge affiché aux visiteurs).
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRODUCTION_POLES.map((pole) => {
                  const hasOfficial = Boolean(
                    settingsDraft.pageContent.serviceImages?.[pole.adminImageKey]?.trim(),
                  );
                  return (
                    <div key={pole.id} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#073D37] w-44 truncate">
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
                        placeholder="Visuel temporaire actif — /uploads/..."
                        className="flex-1 px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                      />
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 ${
                          hasOfficial
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {hasOfficial ? 'Officiel' : 'Temporaire'}
                      </span>
                      <label className="px-2.5 py-1.5 rounded bg-[#073D37] text-white text-xs cursor-pointer shrink-0">
                        Img
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="sr-only"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const url = await uploadImageFile(f);
                              if (url) {
                                setSettingsDraft({
                                  ...settingsDraft,
                                  pageContent: {
                                    ...settingsDraft.pageContent,
                                    serviceImages: {
                                      ...settingsDraft.pageContent.serviceImages,
                                      [pole.adminImageKey]: url,
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
                  Indique si un visuel officiel a remplacé l&apos;illustration temporaire.
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SERVICES_LIST.map((srv) => {
                  const hasOfficial = Boolean(
                    settingsDraft.pageContent.serviceImages?.[srv.id]?.trim(),
                  );
                  return (
                    <div key={srv.id} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#073D37] w-44 truncate">
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
                        placeholder="Visuel temporaire actif — /uploads/..."
                        className="flex-1 px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                      />
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-semibold shrink-0 ${
                          hasOfficial
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {hasOfficial ? 'Officiel' : 'Temporaire'}
                      </span>
                      <label className="px-2.5 py-1.5 rounded bg-[#073D37] text-white text-xs cursor-pointer shrink-0">
                        Img
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="sr-only"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const url = await uploadImageFile(f);
                              if (url) {
                                setSettingsDraft({
                                  ...settingsDraft,
                                  pageContent: {
                                    ...settingsDraft.pageContent,
                                    serviceImages: {
                                      ...settingsDraft.pageContent.serviceImages,
                                      [srv.id]: url,
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
                URLs des réseaux sociaux (affichées uniquement une fois renseignées)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              Enregistrer tous les paramètres
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
