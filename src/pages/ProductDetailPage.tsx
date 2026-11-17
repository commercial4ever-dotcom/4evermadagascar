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
      <div className="bg-[#052E29] min-h-[70vh] flex items-center justify-center px-4 py-24 text-center text-[#E4DDD2]">
        <div className="max-w-xl">
          <h1 className="font-display font-bold text-2xl text-white">
            Article introuvable
          </h1>
          <p className="text-sm text-[#E4DDD2]/78 mt-2">
            Cet article n&apos;est pas disponible ou a été masqué du catalogue public.
          </p>
          <Link
            to="/catalogue"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au catalogue</span>
          </Link>
        </div>
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
    <div className="bg-[#052E29] text-[#E4DDD2] py-12 lg:py-20 min-h-[75vh]">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="mb-8">
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#E4DDD2] hover:text-[#ED6F2C] transition-colors duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Retour au catalogue</span>
          </Link>
        </div>

        <Reveal>
          <div className="bg-[#073D37] rounded-2xl border border-[#E4DDD2]/16 overflow-hidden shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Product Image or Monochrome Line-Art */}
              <div className="lg:col-span-6 bg-[#042521] border-b lg:border-b-0 lg:border-r border-[#E4DDD2]/12">
                <ImageWithFallback
                  src={product.imageUrl}
                  editorialVariant="pole-goodies-objets-personnalises"
                  tone="dark"
                  alt={product.name}
                  aspectClass="aspect-square"
                />
              </div>

              {/* Product Specs & Actions */}
              <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#E4DDD2]/72">
                    <span className="font-display tabular-nums font-semibold text-[#ED6F2C]">
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

                  <h1 className="type-h2 text-[#E4DDD2]">
                    {product.name}
                  </h1>

                  <p className="text-lg font-semibold text-[#ED6F2C]">
                    {product.priceLabel || 'Prix sur devis'}
                  </p>

                  {product.needsVerification && (
                    <div className="p-3.5 rounded-lg bg-amber-950/60 border border-amber-400/35 text-amber-200 text-xs flex items-start gap-2.5">
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
                    <p className="text-sm sm:text-base text-[#E4DDD2]/85 leading-relaxed">
                      {product.description}
                    </p>
                  ) : (
                    <p className="text-sm text-[#E4DDD2]/60 italic">
                      Description détaillée à compléter selon les spécifications souhaitées lors du devis.
                    </p>
                  )}

                  {product.materials.length > 0 && (
                    <div className="pt-4 border-t border-[#E4DDD2]/12">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#E4DDD2]/70 mb-1.5">
                        Matériaux disponibles
                      </h2>
                      <p className="text-sm text-white/90">
                        {product.materials.join(' · ')}
                      </p>
                    </div>
                  )}

                  {product.customizationOptions.length > 0 && (
                    <div className="pt-4 border-t border-[#E4DDD2]/12">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#E4DDD2]/70 mb-1.5">
                        Options de personnalisation
                      </h2>
                      <p className="text-sm text-white/90">
                        {product.customizationOptions.join(' · ')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-[#E4DDD2]/12 space-y-4">
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="product-qty"
                      className="text-sm font-semibold text-[#E4DDD2]"
                    >
                      Quantité souhaitée
                    </label>
                    <div className="inline-flex items-center border border-[#E4DDD2]/25 bg-[#042521] rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-[#E4DDD2] hover:bg-white/10 cursor-pointer transition-colors"
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
                        className="w-16 h-10 text-center font-display tabular-nums text-sm font-semibold bg-transparent text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center text-[#E4DDD2] hover:bg-white/10 cursor-pointer transition-colors"
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
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#042521] border border-[#E4DDD2]/25 text-white text-sm font-semibold hover:bg-[#063631] transition-colors duration-200 cursor-pointer"
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
                      className="group flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 cursor-pointer"
                    >
                      <span>Demander un devis</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>

                  {added && (
                    <button
                      type="button"
                      onClick={openDrawer}
                      className="text-xs font-semibold text-[#E4DDD2] underline underline-offset-4 hover:text-[#ED6F2C] cursor-pointer"
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
