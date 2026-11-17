import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Minus,
  Plus,
} from 'lucide-react';
import type { ProductItem } from '../types.ts';
import { ImageWithFallback } from '../components/ImageWithFallback.tsx';
import { Reveal } from '../components/MotionPrimitives.tsx';
import { STUDIO_VISUALS } from '../data/visuals.ts';
import { useQuoteSelection } from '../context/QuoteSelectionContext.tsx';

interface ProductDetailPageProps {
  products: ProductItem[];
}

export function ProductDetailPage({ products }: ProductDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addProduct, openDrawer } = useQuoteSelection();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="font-bold text-2xl text-[#073D37]">
          Article introuvable
        </h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-2">
          Cet article n&apos;est pas disponible ou a été masqué du catalogue public.
        </p>
        <Link
          to="/catalogue"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#073D37] text-white text-sm font-semibold hover:bg-[#042824] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </Link>
      </div>
    );
  }

  const handleAddToSelection = () => {
    addProduct(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleDirectQuote = () => {
    addProduct(product, quantity);
    navigate(`/devis?service=${encodeURIComponent(product.category)}`);
  };

  return (
    <div className="bg-white py-12 lg:py-20">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="mb-8">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#073D37] hover:text-[#ED6F2C] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Retour au catalogue</span>
          </Link>
        </div>

        <Reveal>
          <div className="bg-white rounded-2xl border border-[#073D37]/12 overflow-hidden shadow-[0_24px_60px_-24px_rgba(7,61,55,0.12)]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Product Image */}
              <div className="lg:col-span-6 bg-[#E4DDD2]/25 border-b lg:border-b-0 lg:border-r border-[#073D37]/10">
                <ImageWithFallback
                  src={product.imageUrl}
                  fallbackSrc={STUDIO_VISUALS.serviceCadeauxEntreprise}
                  alt={product.name}
                  aspectClass="aspect-square"
                />
              </div>

              {/* Product Specs & Actions */}
              <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#1A1A1A]/65">
                    <span className="font-display tabular-nums font-semibold text-[#073D37]">
                      Réf. {product.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{product.category}</span>
                    {product.subcategory && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{product.subcategory}</span>
                      </>
                    )}
                  </div>

                  <h1 className="type-h2 text-[#073D37]">
                    {product.name}
                  </h1>

                  <p className="text-lg font-semibold text-[#ED6F2C]">
                    {product.priceLabel || 'Prix sur devis'}
                  </p>

                  {product.needsVerification && (
                    <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Élément signalé à vérifier (PDF / Visuel)</p>
                        {product.verificationNote && (
                          <p className="mt-0.5">{product.verificationNote}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {product.description ? (
                    <p className="text-sm sm:text-base text-[#1A1A1A]/78 leading-relaxed">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-sm text-[#1A1A1A]/55 italic">
                      Description détaillée à compléter selon les spécifications souhaitées lors du devis.
                    </p>
                  )}

                  {product.materials.length > 0 && (
                    <div className="pt-4 border-t border-[#073D37]/10">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#073D37]/70 mb-1.5">
                        Matériaux disponibles
                      </h2>
                      <p className="text-sm text-[#1A1A1A]/85">
                        {product.materials.join(' · ')}
                      </p>
                    </div>
                  )}

                  {product.customizationOptions.length > 0 && (
                    <div className="pt-4 border-t border-[#073D37]/10">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#073D37]/70 mb-1.5">
                        Options de personnalisation
                      </h2>
                      <p className="text-sm text-[#1A1A1A]/85">
                        {product.customizationOptions.join(' · ')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-[#073D37]/10 space-y-4">
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="product-qty"
                      className="text-sm font-semibold text-[#073D37]"
                    >
                      Quantité souhaitée
                    </label>
                    <div className="inline-flex items-center border border-[#073D37]/25 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-[#073D37] hover:bg-[#E4DDD2]/40 cursor-pointer transition-colors"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        id="product-qty"
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 h-10 text-center font-display tabular-nums text-sm font-semibold text-[#073D37] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center text-[#073D37] hover:bg-[#E4DDD2]/40 cursor-pointer transition-colors"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleAddToSelection}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#073D37] text-white text-sm font-semibold hover:bg-[#042824] transition-all cursor-pointer"
                    >
                      {added ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#ED6F2C]" />
                          <span>Ajouté à ma demande</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Ajouter à ma demande</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectQuote}
                      className="group flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-all cursor-pointer"
                    >
                      <span>Demander un devis</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>

                  {added && (
                    <button
                      type="button"
                      onClick={openDrawer}
                      className="text-xs font-semibold text-[#073D37] underline underline-offset-4 hover:text-[#ED6F2C] cursor-pointer"
                    >
                      Voir ma sélection complète
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
