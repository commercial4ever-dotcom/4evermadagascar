import { useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, Trash2, X } from 'lucide-react';
import { useQuoteSelection } from '../context/QuoteSelectionContext.tsx';

export function QuoteDrawer() {
  const { items, isDrawerOpen, closeDrawer, updateQuantity, removeItem, clearSelection } =
    useQuoteSelection();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const handleGoToQuote = () => {
    closeDrawer();
    navigate('/devis');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Ma sélection pour demande de devis"
    >
      <div
        className="fixed inset-0 bg-[#042824]/50 backdrop-blur-xs"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-[#073D37]/15">
        <div className="px-6 py-5 border-b border-[#073D37]/10 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-[#073D37]">
              Ma sélection devis
            </h2>
            <p className="text-xs text-[#172824]/70 mt-0.5">
              Articles sélectionnés sans engagement · Prix sur devis
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-10 h-10 rounded-md flex items-center justify-center text-[#073D37] hover:bg-[#E4DDD2]/40 transition-colors cursor-pointer"
            aria-label="Fermer la sélection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <p className="font-display font-semibold text-base text-[#073D37]">
                Votre sélection est vide
              </p>
              <p className="text-sm text-[#172824]/70 mt-2 max-w-xs leading-relaxed">
                Parcourez le catalogue 4EVER et ajoutez les articles qui vous intéressent pour préparer votre demande de devis globale.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  navigate('/catalogue');
                }}
                className="mt-6 px-5 py-2.5 rounded-md bg-[#073D37] text-white text-sm font-medium hover:bg-[#042824] transition-colors cursor-pointer"
              >
                Explorer le catalogue
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#073D37]/10">
              {items.map((item) => (
                <li key={`${item.code}-${item.name}`} className="py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs text-[#073D37]/70 tabular-nums">
                      Réf. {item.code}
                    </p>
                    <p className="font-display font-semibold text-sm text-[#073D37] mt-0.5">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#172824]/60 mt-1">Prix sur devis</p>

                    <div className="mt-3 inline-flex items-center border border-[#073D37]/20 rounded-md">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.code, item.name, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#073D37] hover:bg-[#E4DDD2]/40 transition-colors cursor-pointer"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.code, item.name, Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-12 h-8 text-center text-xs font-display tabular-nums font-semibold text-[#073D37] focus:outline-none"
                        aria-label={`Quantité pour ${item.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.code, item.name, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#073D37] hover:bg-[#E4DDD2]/40 transition-colors cursor-pointer"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.code, item.name)}
                    className="p-2 rounded-md text-[#172824]/50 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    aria-label={`Retirer ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-[#073D37]/10 bg-[#FAF8F5] space-y-3">
            <button
              type="button"
              onClick={handleGoToQuote}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors cursor-pointer"
            >
              <span>Envoyer une demande de devis globale</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="w-full py-2 text-xs font-medium text-[#073D37]/70 hover:text-[#073D37] transition-colors cursor-pointer"
            >
              Vider la sélection
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
