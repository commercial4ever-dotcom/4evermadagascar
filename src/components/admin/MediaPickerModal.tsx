import { useMemo, useState } from 'react';
import { Check, Image as ImageIcon, Search, Upload, X } from 'lucide-react';
import type { MediaAssetItem, MediaFolder } from '../../types.ts';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: MediaAssetItem[];
  defaultFolder?: MediaFolder;
  fileStorageAvailable?: boolean;
  onSelect: (asset: MediaAssetItem) => void;
  onUploadSingle: (file: File, folder: MediaFolder) => Promise<MediaAssetItem | null>;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  assets,
  defaultFolder = 'products',
  fileStorageAvailable = true,
  onSelect,
  onUploadSingle,
}: MediaPickerModalProps) {
  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  const imageAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      const isImage = a.kind === 'photo' || a.kind === 'illustration' || a.mimeType.startsWith('image/');
      if (!isImage) return false;
      const matchesFolder = folderFilter === 'all' || a.folder === folderFilter;
      const matchesQuery =
        !q ||
        a.originalName.toLowerCase().includes(q) ||
        a.altText.toLowerCase().includes(q) ||
        a.folder.toLowerCase().includes(q);
      return matchesFolder && matchesQuery;
    });
  }, [assets, folderFilter, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-[#042824]/70 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg border border-[#073D37]/15 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-6 py-4 bg-[#073D37] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-[#ED6F2C]" />
            <h2 className="font-display font-bold text-base">
              Sélectionner un média (Médiathèque R2 / Stockage)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/15 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-[#073D37]/10 bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-[#073D37]/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom..."
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
            </select>
          </div>

          <label
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-white text-xs font-semibold ${
              fileStorageAvailable
                ? 'bg-[#ED6F2C] hover:bg-[#d85f1f] cursor-pointer'
                : 'bg-[#073D37]/40 cursor-not-allowed'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>
              {!fileStorageAvailable
                ? 'Upload désactivé (R2 reporté)'
                : uploading
                  ? 'Importation...'
                  : 'Importer et sélectionner'}
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.svg"
              disabled={uploading || !fileStorageAvailable}
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const uploaded = await onUploadSingle(file, defaultFolder);
                  if (uploaded) {
                    onSelect(uploaded);
                    onClose();
                  }
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {imageAssets.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#172824]/70">
              Aucune image trouvée dans la médiathèque pour ce filtre. Importez-en une ci-dessus ou dans l&apos;onglet Médiathèque R2.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset);
                    onClose();
                  }}
                  className="group text-left rounded-md border border-[#073D37]/15 overflow-hidden bg-[#FAF8F5] hover:border-[#ED6F2C] transition-colors cursor-pointer"
                >
                  <div className="relative aspect-square bg-white overflow-hidden">
                    <img
                      src={asset.publicUrl}
                      alt={asset.altText || asset.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#073D37]/85 text-white text-[10px] font-mono uppercase">
                      {asset.storageDriver}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-[#073D37]/45 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#ED6F2C] text-white text-xs font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Choisir
                      </span>
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-[#073D37] truncate">
                      {asset.originalName}
                    </p>
                    <p className="text-[11px] text-[#172824]/60 truncate">
                      {asset.folder}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
