import { Download, ExternalLink, FileText, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PdfCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  pdfName: string;
}

export function PdfCatalogueModal({ isOpen, onClose, pdfUrl, pdfName }: PdfCatalogueModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Catalogue complet 2027 — 4EVER Madagascar"
    >
      <div
        className="fixed inset-0 bg-[#042824]/70 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-5xl bg-white rounded-lg shadow-2xl border border-[#073D37]/15 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-[#073D37] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-[#ED6F2C] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base sm:text-lg truncate">
                Catalogue complet 2027 — 4EVER Madagascar
              </h2>
              {pdfName && (
                <p className="text-xs text-[#E4DDD2]/80 truncate">{pdfName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pdfUrl && (
              <>
                <a
                  href={`${pdfUrl}?download=1`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#ED6F2C] text-white text-xs font-semibold hover:bg-[#d85f1f] transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Télécharger le PDF</span>
                </a>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Ouvrir</span>
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-md flex items-center justify-center text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Revenir au catalogue interactif"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#FAF8F5] min-h-[420px] flex flex-col">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Catalogue 4EVER Madagascar 2027"
              className="w-full flex-1 min-h-[70vh] border-0"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 sm:p-12">
              <div className="w-14 h-14 rounded-lg bg-[#E4DDD2] flex items-center justify-center text-[#073D37] mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-xl text-[#073D37]">
                Catalogue PDF 2027 en attente d&apos;importation
              </h3>
              <p className="text-sm text-[#172824]/75 mt-3 max-w-md leading-relaxed">
                Le document PDF officiel du Catalogue 2027 n&apos;a pas encore été importé sur la plateforme. L&apos;administrateur 4EVER peut le téléverser directement depuis l&apos;espace d&apos;administration privé sans modification du fichier original.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-md bg-[#073D37] text-white text-sm font-semibold hover:bg-[#042824] transition-colors cursor-pointer"
                >
                  Revenir au catalogue interactif
                </button>
                <Link
                  to="/devis"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-md border border-[#073D37]/25 text-[#073D37] text-sm font-medium hover:bg-[#E4DDD2]/40 transition-colors"
                >
                  Demander le catalogue par e-mail
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
