import { useState } from 'react';
import { FolderTree, Plus, Save, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import type { CategoryItem, MediaAssetItem, MediaFolder, PoleConfigItem } from '../../types.ts';

interface AdminTaxonomyPanelProps {
  categories: CategoryItem[];
  poles: PoleConfigItem[];
  onSaveCategories: (categories: CategoryItem[]) => Promise<void>;
  onSavePole: (poleId: string, patch: Partial<PoleConfigItem>) => Promise<void>;
  onOpenMediaPicker: (folder: MediaFolder, cb: (asset: MediaAssetItem) => void) => void;
  onUploadSingle: (file: File, folder: MediaFolder) => Promise<MediaAssetItem | null>;
}

export function AdminTaxonomyPanel({
  categories,
  poles,
  onSaveCategories,
  onSavePole,
  onOpenMediaPicker,
  onUploadSingle,
}: AdminTaxonomyPanelProps) {
  const [catDrafts, setCatDrafts] = useState<CategoryItem[]>(categories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPole, setNewCatPole] = useState(poles[0]?.id || 'matieres-rigides');
  const [savingCats, setSavingCats] = useState(false);

  const [editingPoleId, setEditingPoleId] = useState<string>(poles[0]?.id || 'matieres-rigides');
  const activePole = poles.find((p) => p.id === editingPoleId) || poles[0];

  const [poleTitle, setPoleTitle] = useState(activePole?.title || '');
  const [poleShortTitle, setPoleShortTitle] = useState(activePole?.shortTitle || '');
  const [poleTagline, setPoleTagline] = useState(activePole?.tagline || '');
  const [poleDescription, setPoleDescription] = useState(activePole?.description || '');
  const [polePrimaryItems, setPolePrimaryItems] = useState((activePole?.primaryItems || []).join('\n'));
  const [poleSecondaryItems, setPoleSecondaryItems] = useState((activePole?.secondaryItems || []).join('\n'));
  const [poleApplications, setPoleApplications] = useState((activePole?.applications || []).join('\n'));
  const [poleImageUrl, setPoleImageUrl] = useState(activePole?.imageUrl || '');
  const [savingPole, setSavingPole] = useState(false);

  const selectPole = (pole: PoleConfigItem) => {
    setEditingPoleId(pole.id);
    setPoleTitle(pole.title);
    setPoleShortTitle(pole.shortTitle);
    setPoleTagline(pole.tagline);
    setPoleDescription(pole.description);
    setPolePrimaryItems(pole.primaryItems.join('\n'));
    setPoleSecondaryItems((pole.secondaryItems || []).join('\n'));
    setPoleApplications(pole.applications.join('\n'));
    setPoleImageUrl(pole.imageUrl);
  };

  const handleAddCategory = () => {
    const clean = newCatName.trim();
    if (!clean) return;
    const slug = clean
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setCatDrafts((prev) => [
      ...prev,
      {
        id: `cat-${slug || Date.now()}`,
        name: clean,
        slug: slug || `cat-${Date.now()}`,
        subcategories: [],
        poleId: newCatPole,
        sortOrder: prev.length + 1,
      },
    ]);
    setNewCatName('');
  };

  const handleSaveCatsClick = async () => {
    setSavingCats(true);
    try {
      await onSaveCategories(catDrafts);
    } finally {
      setSavingCats(false);
    }
  };

  const handleSavePoleClick = async () => {
    if (!activePole) return;
    setSavingPole(true);
    try {
      await onSavePole(activePole.id, {
        title: poleTitle.trim(),
        shortTitle: poleShortTitle.trim(),
        tagline: poleTagline.trim(),
        description: poleDescription.trim(),
        primaryItems: polePrimaryItems
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        secondaryItems: activePole.secondarySectionLabel
          ? poleSecondaryItems
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        applications: poleApplications
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        imageUrl: poleImageUrl.trim(),
      });
    } finally {
      setSavingPole(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* CATEGORIES MANAGEMENT */}
      <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-[#073D37] flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#ED6F2C]" />
              <span>Catégories et sous-catégories du catalogue ({catDrafts.length})</span>
            </h2>
            <p className="text-xs text-[#172824]/70 mt-1">
              Organisez les catégories du catalogue interactif, leur pôle de rattachement et leurs sous-catégories (séparées par des virgules).
            </p>
          </div>
          <button
            type="button"
            disabled={savingCats}
            onClick={handleSaveCatsClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#ED6F2C] text-white text-xs font-semibold hover:bg-[#d85f1f] disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingCats ? 'Enregistrement...' : 'Enregistrer les catégories'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px_auto] gap-2.5 p-3.5 rounded-md bg-[#FAF8F5] border border-[#073D37]/10">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nouvelle catégorie (ex. : Trophées & Distinctions)"
            className="px-3 py-2 rounded border border-[#073D37]/20 bg-white text-xs"
          />
          <select
            value={newCatPole}
            onChange={(e) => setNewCatPole(e.target.value)}
            className="px-3 py-2 rounded border border-[#073D37]/20 bg-white text-xs"
          >
            {poles.map((p) => (
              <option key={p.id} value={p.id}>
                Pôle {p.number} · {p.shortTitle}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddCategory}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {catDrafts.map((cat, idx) => (
            <div
              key={cat.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center p-3 rounded border border-[#073D37]/12 bg-[#FAF8F5]"
            >
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-semibold text-[#073D37]/70 mb-0.5">Nom</label>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) =>
                    setCatDrafts((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, name: e.target.value } : c)),
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs font-semibold text-[#073D37]"
                />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-[10px] font-semibold text-[#073D37]/70 mb-0.5">
                  Pôle rattaché
                </label>
                <select
                  value={cat.poleId || ''}
                  onChange={(e) =>
                    setCatDrafts((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, poleId: e.target.value } : c)),
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                >
                  <option value="">Non rattachée</option>
                  {poles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.number}. {p.shortTitle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-4">
                <label className="block text-[10px] font-semibold text-[#073D37]/70 mb-0.5">
                  Sous-catégories (virgules)
                </label>
                <input
                  type="text"
                  value={cat.subcategories.join(', ')}
                  onChange={(e) =>
                    setCatDrafts((prev) =>
                      prev.map((c, i) =>
                        i === idx
                          ? {
                              ...c,
                              subcategories: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            }
                          : c,
                      ),
                    )
                  }
                  placeholder="Ex. : Carnets, Stylos, Agendas"
                  className="w-full px-2.5 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                />
              </div>
              <div className="lg:col-span-1">
                <label className="block text-[10px] font-semibold text-[#073D37]/70 mb-0.5">Ordre</label>
                <input
                  type="number"
                  value={cat.sortOrder ?? idx + 1}
                  onChange={(e) =>
                    setCatDrafts((prev) =>
                      prev.map((c, i) =>
                        i === idx ? { ...c, sortOrder: Number(e.target.value) || 0 } : c,
                      ),
                    )
                  }
                  className="w-full px-2 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
                />
              </div>
              <div className="lg:col-span-1 flex justify-end pt-3 lg:pt-0">
                <button
                  type="button"
                  onClick={() => setCatDrafts((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-2 rounded text-red-700 hover:bg-red-50 cursor-pointer"
                  aria-label={`Supprimer ${cat.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 POLES MANAGEMENT */}
      {activePole && (
        <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-lg text-[#073D37]">
                Gestion des 4 pôles de production
              </h2>
              <p className="text-xs text-[#172824]/70 mt-1">
                Personnalisez les descriptions et remplacez l&apos;illustration noir &amp; blanc temporaire d&apos;un pôle dès que sa photographie officielle est prête.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {poles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPole(p)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    p.id === activePole.id
                      ? 'bg-[#073D37] text-white'
                      : 'bg-[#FAF8F5] text-[#073D37] border border-[#073D37]/15 hover:bg-[#E4DDD2]/50'
                  }`}
                >
                  {p.number}. {p.shortTitle}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#073D37] mb-1">Titre du pôle</label>
              <input
                type="text"
                value={poleTitle}
                onChange={(e) => setPoleTitle(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#073D37] mb-1">Titre court (navigation / onglet)</label>
              <input
                type="text"
                value={poleShortTitle}
                onChange={(e) => setPoleShortTitle(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#073D37] mb-1">Accroche (Tagline)</label>
              <input
                type="text"
                value={poleTagline}
                onChange={(e) => setPoleTagline(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#073D37] mb-1">Description</label>
              <textarea
                rows={3}
                value={poleDescription}
                onChange={(e) => setPoleDescription(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#073D37] mb-1">
                {activePole.primarySectionLabel} (1 élément par ligne)
              </label>
              <textarea
                rows={5}
                value={polePrimaryItems}
                onChange={(e) => setPolePrimaryItems(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#073D37] mb-1">
                Applications (1 élément par ligne)
              </label>
              <textarea
                rows={5}
                value={poleApplications}
                onChange={(e) => setPoleApplications(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
              />
            </div>

            {activePole.secondarySectionLabel && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#073D37] mb-1">
                  {activePole.secondarySectionLabel} (1 élément par ligne)
                </label>
                <textarea
                  rows={4}
                  value={poleSecondaryItems}
                  onChange={(e) => setPoleSecondaryItems(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#073D37] mb-1">
                Photographie officielle du pôle (laisser vide pour conserver l&apos;illustration N&amp;B temporaire)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={poleImageUrl}
                  onChange={(e) => setPoleImageUrl(e.target.value)}
                  placeholder="Illustration N&B active par défaut — ou URL R2 /uploads/..."
                  className="flex-1 min-w-[220px] px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    onOpenMediaPicker('editorial', (asset) => setPoleImageUrl(asset.publicUrl))
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[#073D37]/25 text-xs font-semibold text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Médiathèque</span>
                </button>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#073D37] text-white text-xs font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importer</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const uploaded = await onUploadSingle(f, 'editorial');
                        if (uploaded) setPoleImageUrl(uploaded.publicUrl);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={savingPole}
            onClick={handleSavePoleClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#ED6F2C] text-white text-xs font-semibold hover:bg-[#d85f1f] disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savingPole ? 'Enregistrement...' : `Enregistrer le Pôle ${activePole.number}`}</span>
          </button>
        </div>
      )}
    </div>
  );
}
