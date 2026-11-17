import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  Plus,
  Search,
} from 'lucide-react';
import {
  PRODUCTION_POLES,
  type BootstrapData,
  type ProductItem,
} from '../types.ts';
import { STUDIO_VISUALS } from '../data/visuals.ts';
import { ImageWithFallback } from '../components/ImageWithFallback.tsx';
import { StudioBackdrop } from '../components/StudioBackdrop.tsx';
import { useQuoteSelection } from '../context/QuoteSelectionContext.tsx';
import { Reveal, SplitTextReveal } from '../components/MotionPrimitives.tsx';

interface CataloguePageProps {
  data: BootstrapData;
  onOpenPdf: () => void;
}

const PAGE_SIZE = 12;

export function CataloguePage({ data, onOpenPdf }: CataloguePageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('cat');
  const initialPole = searchParams.get('pole');

  const [selectedPoleId, setSelectedPoleId] = useState<string>('tous');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous les articles');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addProduct } = useQuoteSelection();

  useEffect(() => {
    if (initialPole && PRODUCTION_POLES.some((p) => p.id === initialPole)) {
      setSelectedPoleId(initialPole);
      setSelectedCategory('Tous les articles');
      setSelectedSubcategory('Toutes');
    } else if (initialCategory) {
      const matched = data.categories.find((c) => c.name === initialCategory);
      if (matched) {
        setSelectedCategory(matched.name);
        setSelectedSubcategory('Toutes');
      }
    }
  }, [initialCategory, initialPole, data.categories]);

  const activePole = useMemo(
    () => PRODUCTION_POLES.find((p) => p.id === selectedPoleId) || null,
    [selectedPoleId],
  );

  const categoryNames = useMemo(() => {
    const base = data.categories.map((c) => c.name);
    if (!activePole) {
      return ['Tous les articles', ...base];
    }
    // Keep categories aligned with active pole while preserving cross-category accessibility
    const poleCategories = base.filter((name) =>
      activePole.catalogueCategories.includes(name),
    );
    return ['Tous les articles', ...poleCategories];
  }, [data.categories, activePole]);

  const availableSubcategories = useMemo(() => {
    const subs = new Set<string>();
    for (const p of data.products) {
      const poleAllowed =
        !activePole || activePole.catalogueCategories.includes(p.category);
      if (
        poleAllowed &&
        (selectedCategory === 'Tous les articles' || p.category === selectedCategory) &&
        p.subcategory &&
        p.subcategory.trim().length > 0
      ) {
        subs.add(p.subcategory.trim());
      }
    }
    return Array.from(subs).sort();
  }, [data.products, selectedCategory, activePole]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.products.filter((product) => {
      const matchesPole =
        !activePole || activePole.catalogueCategories.includes(product.category);
      const matchesCat =
        selectedCategory === 'Tous les articles' || product.category === selectedCategory;
      const matchesSub =
        selectedSubcategory === 'Toutes' || product.subcategory === selectedSubcategory;
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.code.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q);
      return matchesPole && matchesCat && matchesSub && matchesQuery;
    });
  }, [data.products, activePole, selectedCategory, selectedSubcategory, searchQuery]);

  const paginatedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handlePoleChange = (poleId: string) => {
    setSelectedPoleId(poleId);
    setSelectedCategory('Tous les articles');
    setSelectedSubcategory('Toutes');
    setVisibleCount(PAGE_SIZE);
    if (poleId === 'tous') {
      searchParams.delete('pole');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ pole: poleId }, { replace: true });
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('Toutes');
    setVisibleCount(PAGE_SIZE);
  };

  const handleAdd = (product: ProductItem) => {
    addProduct(product, 1);
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((curr) => (curr === product.id ? null : curr));
    }, 1500);
  };

  const resetAllFilters = () => {
    setSelectedPoleId('tous');
    setSelectedCategory('Tous les articles');
    setSelectedSubcategory('Toutes');
    setSearchQuery('');
    setVisibleCount(PAGE_SIZE);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="bg-[#FAF8F5] min-h-[75vh] text-[#1A1A1A]">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-[#073D37] text-white border-b border-white/10">
        <StudioBackdrop variant="emerald" showPattern />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  Catalogue interactif 2027
                </p>
              </Reveal>
              <SplitTextReveal
                as="h1"
                immediate
                text="Articles & supports personnalisables"
                className="type-hero text-white"
              />
              <Reveal delay={0.12}>
                <p className="type-intro text-[#E4DDD2]/85 max-w-2xl">
                  Filtrez par pôle de production ou par catégorie, recherchez par nom ou référence, ajoutez vos articles à votre sélection et envoyez une demande de devis globale sans engagement.
                </p>
              </Reveal>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={onOpenPdf}
                className="font-display inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] shadow-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                <span>Consulter le catalogue complet 2027</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="bg-white border-b border-[#073D37]/10">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#073D37]/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Rechercher par nom ou référence..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#073D37]/20 bg-[#FAF8F5] text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 focus:outline-none focus:border-[#073D37]"
                aria-label="Rechercher un article par nom ou référence"
              />
            </div>

            <p className="text-xs font-semibold text-[#1A1A1A]/70 tabular-nums">
              {filteredProducts.length} article{filteredProducts.length > 1 ? 's' : ''} affiché
              {filteredProducts.length > 1 ? 's' : ''} · Prix sur devis
            </p>
          </div>

          {/* Filter by Production Pole */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#073D37]/70">
              <Layers className="w-3.5 h-3.5 text-[#ED6F2C]" />
              <span>Filtrer par pôle de production</span>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pôles de production 4EVER">
              <button
                type="button"
                role="tab"
                aria-selected={selectedPoleId === 'tous'}
                onClick={() => handlePoleChange('tous')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  selectedPoleId === 'tous'
                    ? 'bg-[#ED6F2C] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#1A1A1A]/80 border border-[#073D37]/12 hover:border-[#ED6F2C]/50'
                }`}
              >
                Tous les pôles
              </button>
              {PRODUCTION_POLES.map((pole) => {
                const active = selectedPoleId === pole.id;
                return (
                  <button
                    key={pole.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handlePoleChange(pole.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#ED6F2C] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A]/80 border border-[#073D37]/12 hover:border-[#ED6F2C]/50'
                    }`}
                  >
                    <span className="font-display tabular-nums mr-1.5 opacity-85">{pole.number}</span>
                    {pole.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter by Category */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#073D37]/10" role="tablist" aria-label="Catégories du catalogue">
            {categoryNames.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#073D37] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#1A1A1A]/80 border border-[#073D37]/12 hover:border-[#073D37]/35'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {availableSubcategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#073D37]/10">
              <span className="text-xs font-semibold text-[#073D37]/70 mr-1">
                Sous-catégorie :
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubcategory('Toutes')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  selectedSubcategory === 'Toutes'
                    ? 'bg-[#ED6F2C] text-white'
                    : 'bg-[#E4DDD2]/50 text-[#073D37] hover:bg-[#E4DDD2]'
                }`}
              >
                Toutes
              </button>
              {availableSubcategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedSubcategory === sub
                      ? 'bg-[#ED6F2C] text-white'
                      : 'bg-[#E4DDD2]/50 text-[#073D37] hover:bg-[#E4DDD2]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-14">
        {paginatedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <article
                  key={product.id}
                  className="group bg-white rounded-xl border border-[#073D37]/12 overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(7,61,55,0.08)] hover:border-[#073D37]/30 transition-all duration-200"
                >
                  <Link to={`/catalogue/${product.id}`} className="block overflow-hidden">
                    <ImageWithFallback
                      src={product.imageUrl}
                      fallbackSrc={
                        activePole
                          ? STUDIO_VISUALS[activePole.visualKey]
                          : STUDIO_VISUALS.poleGoodiesCoffrets
                      }
                      alt={product.name}
                      imgClassName="transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#1A1A1A]/65">
                        <span className="font-display tabular-nums font-semibold text-[#073D37]">
                          {product.code}
                        </span>
                        <span className="truncate">{product.category}</span>
                      </div>

                      <Link to={`/catalogue/${product.id}`}>
                        <h2 className="font-display font-bold text-base text-[#073D37] mt-1.5 group-hover:text-[#ED6F2C] transition-colors">
                          {product.name}
                        </h2>
                      </Link>

                      {product.description && (
                        <p className="text-xs text-[#1A1A1A]/75 mt-2 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}

                      {product.needsVerification && (
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Élément signalé à vérifier</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#073D37]/10 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#073D37]">
                          {product.priceLabel || 'Prix sur devis'}
                        </span>
                        <Link
                          to={`/catalogue/${product.id}`}
                          className="font-semibold text-[#ED6F2C] hover:underline"
                        >
                          Voir la fiche
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#073D37] text-white text-xs font-semibold hover:bg-[#042824] transition-colors cursor-pointer"
                      >
                        {addedId === product.id ? (
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
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-6 py-3 rounded-lg border border-[#073D37]/25 bg-white text-sm font-semibold text-[#073D37] hover:bg-[#E4DDD2]/40 transition-colors cursor-pointer"
                >
                  Afficher plus d&apos;articles
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-[#073D37]/12 p-10 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-lg bg-[#E4DDD2]/70 flex items-center justify-center text-[#073D37] mx-auto mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#073D37]">
              {searchQuery
                ? 'Aucun article ne correspond à votre recherche'
                : activePole
                  ? `Aucun article publié dans le Pôle ${activePole.number} — ${activePole.title} pour le moment`
                  : `Aucun article publié dans « ${selectedCategory} » pour le moment`}
            </h2>
            <p className="text-sm text-[#1A1A1A]/75 mt-2 leading-relaxed">
              {searchQuery
                ? 'Essayez un autre mot-clé, vérifiez le code référence ou réinitialisez les filtres.'
                : 'Les articles officiels du Catalogue 2027 publiés depuis l’administration apparaîtront ici. Vous pouvez consulter le PDF complet ou nous adresser directement votre besoin sur mesure.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {(searchQuery || selectedPoleId !== 'tous' || selectedCategory !== 'Tous les articles') && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2.5 rounded-lg border border-[#073D37]/20 text-sm font-medium text-[#073D37] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              )}
              <button
                type="button"
                onClick={onOpenPdf}
                className="px-4 py-2.5 rounded-lg bg-[#073D37] text-white text-sm font-semibold hover:bg-[#042824] cursor-pointer"
              >
                Consulter le catalogue complet 2027
              </button>
              <Link
                to={`/devis${activePole ? `?service=${encodeURIComponent(activePole.title)}` : selectedCategory !== 'Tous les articles' ? `?service=${encodeURIComponent(selectedCategory)}` : ''}`}
                className="px-4 py-2.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f]"
              >
                Demander un devis sur mesure
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
