import { useMemo, useState } from 'react';
import {
  Copy,
  FileText,
  FolderOpen,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import type { MediaAssetItem, MediaFolder, ProductItem, SiteSettings } from '../../types.ts';

interface AdminMediaLibraryPanelProps {
  assets: MediaAssetItem[];
  storageDriver: 'r2' | 'local' | 'unconfigured';
  fileStorageAvailable: boolean;
  r2Configured: boolean;
  settings: SiteSettings;
  geminiConfigured: boolean;
  onUploadMultiple: (files: FileList, folder: MediaFolder) => Promise<void>;
  onReplaceAsset: (assetId: string, file: File) => Promise<void>;
  onUpdateAltText: (assetId: string, altText: string) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onCopyUrl: (url: string) => void;
  onUploadPdf: (file: File) => Promise<void>;
  onDeletePdf: () => Promise<void>;
  onExtractPdf: () => Promise<void>;
  extractingPdf: boolean;
  extractedRows: Array<Partial<ProductItem>>;
  onBulkImport: (items: Array<Partial<ProductItem>>, publishImmediately: boolean) => Promise<void>;
}

export function AdminMediaLibraryPanel({
  assets,
  storageDriver,
  fileStorageAvailable,
  r2Configured,
  settings,
  geminiConfigured,
  onUploadMultiple,
  onReplaceAsset,
  onUpdateAltText,
  onDeleteAsset,
  onCopyUrl,
  onUploadPdf,
  onDeletePdf,
  onExtractPdf,
  extractingPdf,
  extractedRows,
  onBulkImport,
}: AdminMediaLibraryPanelProps) {
  const [targetFolder, setTargetFolder] = useState<MediaFolder>('products');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [uploadingMulti, setUploadingMulti] = useState(false);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altDraft, setAltDraft] = useState('');
  const [bulkJsonInput, setBulkJsonInput] = useState('');

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesFolder = folderFilter === 'all' || a.folder === folderFilter;
      const matchesQuery =
        !q ||
        a.originalName.toLowerCase().includes(q) ||
        a.altText.toLowerCase().includes(q) ||
        a.r2Key.toLowerCase().includes(q);
      return matchesFolder && matchesQuery;
    });
  }, [assets, folderFilter, query]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  return (
    <div className="space-y-8">
      {/* R2 / STORAGE UPLOAD & LIBRARY */}
      <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-[#073D37] flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#ED6F2C]" />
              <span>Médiathèque ({assets.length} fichier{assets.length > 1 ? 's' : ''})</span>
            </h2>
            <p className="text-xs text-[#172824]/70 mt-1">
              Stockage actif :{' '}
              <strong className="text-[#073D37]">
                {r2Configured && storageDriver === 'r2'
                  ? 'Cloudflare R2 public (4ever-public-media)'
                  : storageDriver === 'unconfigured'
                    ? 'Stockage R2 temporairement reporté (téléversements désactivés en production)'
                    : 'Disque local (développement uniquement)'}
              </strong>
              . Les illustrations noir &amp; blanc restent actives sur le site public jusqu&apos;au remplacement manuel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value as MediaFolder)}
              disabled={!fileStorageAvailable}
              className="px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs font-medium disabled:opacity-50"
            >
              <option value="products">Dossier : Produits</option>
              <option value="realisations">Dossier : Réalisations</option>
              <option value="editorial">Dossier : Éditorial / Pôles / Services</option>
              <option value="illustrations">Dossier : Illustrations</option>
              <option value="documents">Dossier : Documents</option>
            </select>

            <label
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white text-xs font-semibold ${
                fileStorageAvailable
                  ? 'bg-[#ED6F2C] hover:bg-[#d85f1f] cursor-pointer'
                  : 'bg-[#073D37]/40 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>
                {!fileStorageAvailable
                  ? 'Téléversement désactivé (R2 reporté)'
                  : uploadingMulti
                    ? 'Importation...'
                    : 'Importation multiple (max 20)'}
              </span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.svg,.pdf"
                disabled={uploadingMulti || !fileStorageAvailable}
                className="sr-only"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  setUploadingMulti(true);
                  try {
                    await onUploadMultiple(files, targetFolder);
                  } finally {
                    setUploadingMulti(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>

        {!fileStorageAvailable && (
          <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <strong>Stockage Cloudflare R2 temporairement reporté :</strong> l&apos;application fonctionne normalement avec la base <strong>Cloudflare D1</strong> et conserve les illustrations vectorielles noir &amp; blanc. Les téléversements d&apos;images et de PDF sont temporairement désactivés en production pour éviter toute perte sur disque éphémère.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-md bg-[#FAF8F5] border border-[#073D37]/10">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#073D37]/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un fichier, texte alt ou clé R2..."
              className="w-full pl-9 pr-3 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
            />
          </div>
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="px-3 py-1.5 rounded border border-[#073D37]/20 bg-white text-xs"
          >
            <option value="all">Tous les dossiers</option>
            <option value="products">Produits</option>
            <option value="realisations">Réalisations</option>
            <option value="editorial">Éditorial / Pôles / Services</option>
            <option value="illustrations">Illustrations</option>
            <option value="documents">Documents</option>
            <option value="catalogues">Catalogues PDF</option>
          </select>
        </div>

        {/* Media Grid */}
        {filteredAssets.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#172824]/70 border border-dashed border-[#073D37]/20 rounded-md">
            Aucun média enregistré dans ce dossier pour le moment. Utilisez « Importation multiple » pour téléverser vos photographies officielles.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => {
              const isImage = asset.mimeType.startsWith('image/');
              return (
                <div
                  key={asset.id}
                  className="rounded-md border border-[#073D37]/15 bg-[#FAF8F5] overflow-hidden flex flex-col"
                >
                  <div className="relative h-40 bg-white flex items-center justify-center overflow-hidden border-b border-[#073D37]/10">
                    {isImage ? (
                      <img
                        src={asset.publicUrl}
                        alt={asset.altText || asset.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-[#073D37]" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#073D37]/85 text-white text-[10px] font-medium">
                      {asset.folder}
                    </span>
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-white/90 text-[#073D37] border border-[#073D37]/15 text-[10px] font-mono uppercase">
                      {asset.storageDriver}
                    </span>
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#073D37] truncate" title={asset.originalName}>
                        {asset.originalName}
                      </p>
                      <p className="text-[11px] text-[#172824]/60 font-mono">
                        {formatBytes(asset.sizeBytes)}
                      </p>

                      {editingAltId === asset.id ? (
                        <div className="mt-2 flex gap-1">
                          <input
                            type="text"
                            value={altDraft}
                            onChange={(e) => setAltDraft(e.target.value)}
                            placeholder="Texte alternatif..."
                            className="flex-1 px-2 py-1 rounded border border-[#073D37]/20 bg-white text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await onUpdateAltText(asset.id, altDraft);
                              setEditingAltId(null);
                            }}
                            className="px-2 py-1 rounded bg-[#073D37] text-white text-[11px] cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAltId(asset.id);
                            setAltDraft(asset.altText || '');
                          }}
                          className="mt-1 text-[11px] text-[#073D37]/75 hover:underline text-left cursor-pointer truncate block w-full"
                        >
                          {asset.altText ? `Alt : ${asset.altText}` : '+ Ajouter un texte alt'}
                        </button>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#073D37]/10 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => onCopyUrl(asset.publicUrl)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#073D37]/20 bg-white text-[11px] font-medium text-[#073D37] hover:bg-[#E4DDD2]/40 cursor-pointer"
                        title="Copier l'URL"
                      >
                        <Copy className="w-3 h-3" />
                        <span>URL</span>
                      </button>

                      <label
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded border border-[#073D37]/20 bg-white text-[11px] font-medium text-[#073D37] ${
                          fileStorageAvailable ? 'hover:bg-[#E4DDD2]/40 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                        }`}
                        title={
                          fileStorageAvailable
                            ? 'Remplacer le fichier sans casser les liens produits'
                            : 'Désactivé tant que R2 est reporté'
                        }
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Remplacer</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.svg,.pdf"
                          disabled={!fileStorageAvailable}
                          className="sr-only"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) await onReplaceAsset(asset.id, f);
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => onDeleteAsset(asset.id)}
                        className="p-1.5 rounded text-red-700 hover:bg-red-50 cursor-pointer"
                        aria-label="Supprimer le média"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CATALOGUE PDF 2027 & BULK IMPORT */}
      <div className="bg-white rounded-lg border border-[#073D37]/12 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-[#073D37]">
              Catalogue PDF 2027 &amp; Importation d&apos;articles
            </h2>
            <p className="text-xs text-[#172824]/70 mt-1">
              Document officiel consultable publiquement (« Consulter le catalogue complet 2027 ») stocké sous <code>public/catalogues/</code>.
            </p>
          </div>
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white text-xs font-semibold ${
              fileStorageAvailable
                ? 'bg-[#073D37] hover:bg-[#042824] cursor-pointer'
                : 'bg-[#073D37]/40 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>
              {!fileStorageAvailable
                ? 'Import PDF désactivé (R2 reporté)'
                : settings.cataloguePdfUrl
                  ? 'Remplacer le PDF 2027'
                  : 'Importer le PDF 2027'}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={!fileStorageAvailable}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadPdf(f);
              }}
            />
          </label>
        </div>

        {settings.cataloguePdfUrl ? (
          <div className="p-4 rounded-md bg-[#FAF8F5] border border-[#073D37]/15 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#073D37]" />
              <div>
                <p className="text-sm font-semibold text-[#073D37]">
                  {settings.cataloguePdfName || 'Catalogue-4EVER-Madagascar-2027.pdf'}
                </p>
                <p className="text-xs text-[#172824]/65">
                  Accessible publiquement sur <code>/api/catalogue-pdf</code>
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
              {geminiConfigured && (
                <button
                  type="button"
                  onClick={onExtractPdf}
                  disabled={extractingPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ED6F2C]" />
                  <span>{extractingPdf ? 'Analyse en cours...' : 'Extraire les articles du PDF'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onDeletePdf}
                className="p-2 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                aria-label="Supprimer le PDF"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#172824]/70">
            Aucun PDF 2027 importé actuellement.
          </p>
        )}

        {extractedRows.length > 0 && (
          <div className="pt-4 border-t border-[#073D37]/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display font-bold text-sm text-[#073D37]">
                Articles extraits ({extractedRows.length}) — Validation avant publication
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onBulkImport(extractedRows, false)}
                  className="px-3 py-1.5 rounded border border-[#073D37]/25 text-xs font-semibold text-[#073D37] cursor-pointer"
                >
                  Importer en brouillons
                </button>
                <button
                  type="button"
                  onClick={() => onBulkImport(extractedRows, true)}
                  className="px-3 py-1.5 rounded bg-[#ED6F2C] text-white text-xs font-semibold cursor-pointer"
                >
                  Importer et publier
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-[#073D37]/10 border border-[#073D37]/10 rounded p-3">
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

        <div className="pt-4 border-t border-[#073D37]/10 space-y-3">
          <h3 className="font-display font-bold text-sm text-[#073D37]">
            Importation JSON rapide d&apos;articles
          </h3>
          <textarea
            rows={4}
            value={bulkJsonInput}
            onChange={(e) => setBulkJsonInput(e.target.value)}
            placeholder='[{"code":"4E-101","name":"Stylo bambou","category":"Bureau et papeterie","description":"..."}]'
            className="w-full px-3 py-2 rounded border border-[#073D37]/20 bg-[#FAF8F5] text-xs font-mono"
          />
          <button
            type="button"
            onClick={async () => {
              const parsed = JSON.parse(bulkJsonInput);
              if (Array.isArray(parsed)) {
                await onBulkImport(parsed, true);
                setBulkJsonInput('');
              }
            }}
            className="px-4 py-2 rounded bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] cursor-pointer"
          >
            Importer la liste JSON
          </button>
        </div>
      </div>
    </div>
  );
}
