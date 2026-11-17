import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Layers, Maximize2, X } from 'lucide-react';
import {
  PRODUCTION_POLES,
  type BootstrapData,
  type RealisationItem,
} from '../types.ts';
import { POLE_ILLUSTRATIONS } from '../data/visuals.ts';
import { EditorialIllustration, type EditorialIllustrationVariant } from '../components/EditorialIllustrations.tsx';
import { ImageWithFallback } from '../components/ImageWithFallback.tsx';
import { StudioBackdrop } from '../components/StudioBackdrop.tsx';
import { Reveal, SplitTextReveal } from '../components/MotionPrimitives.tsx';

interface RealisationsPageProps {
  data: BootstrapData;
}

const EMPTY_GALLERY_SLOTS: Array<{
  cat: string;
  illustration: EditorialIllustrationVariant;
  serviceParam: string;
}> = [
  {
    cat: 'Pôle 01 · Matières rigides',
    illustration: 'pole-matieres-rigides',
    serviceParam: 'Matières rigides',
  },
  {
    cat: 'Pôle 02 · Textiles & souples',
    illustration: 'pole-textiles-matieres-souples',
    serviceParam: 'Textiles & matières souples',
  },
  {
    cat: 'Pôle 03 · Goodies & coffrets',
    illustration: 'pole-goodies-objets-personnalises',
    serviceParam: 'Goodies & objets personnalisés',
  },
];

export function RealisationsPage({ data }: RealisationsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPole = searchParams.get('pole');

  const [selectedPoleId, setSelectedPoleId] = useState<string>('tous');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');
  const [lightboxItem, setLightboxItem] = useState<RealisationItem | null>(null);

  useEffect(() => {
    if (initialPole && PRODUCTION_POLES.some((p) => p.id === initialPole)) {
      setSelectedPoleId(initialPole);
      setSelectedCategory('Toutes');
    }
  }, [initialPole]);

  const activePole = useMemo(
    () => PRODUCTION_POLES.find((p) => p.id === selectedPoleId) || null,
    [selectedPoleId],
  );

  const categories = useMemo(
    () => ['Toutes', ...data.realisationCategories],
    [data.realisationCategories],
  );

  const filtered = useMemo(() => {
    return data.realisations.filter((r) => {
      const poleMatch =
        !activePole || activePole.realisationCategories.includes(r.category);
      const catMatch =
        selectedCategory === 'Toutes' || r.category === selectedCategory;
      return poleMatch && catMatch;
    });
  }, [data.realisations, activePole, selectedCategory]);

  const handlePoleSelect = (poleId: string) => {
    setSelectedPoleId(poleId);
    setSelectedCategory('Toutes');
    if (poleId === 'tous') {
      searchParams.delete('pole');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ pole: poleId }, { replace: true });
    }
  };

  return (
    <div className="bg-[#052E29] min-h-[75vh] text-[#E4DDD2]">
      <section className="relative overflow-hidden bg-[#073D37] text-white border-b border-[#E4DDD2]/12">
        <StudioBackdrop variant="emerald" showPattern />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] gap-8 lg:gap-16 items-end">
            <div className="space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  Portfolio · 4EVER Madagascar
                </p>
              </Reveal>
              <SplitTextReveal
                as="h1"
                immediate
                text="Nos réalisations."
                className="type-hero text-[#E4DDD2] max-w-[14ch]"
              />
            </div>
            <Reveal delay={0.1} className="min-w-0">
              <p className="type-intro text-[#E4DDD2]/85">
                Découvrez nos projets authentiques fabriqués et personnalisés pour nos clients. Chaque réalisation présentée correspond exclusivement aux visuels officiels publiés par 4EVER Madagascar.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[#063631] border-b border-[#E4DDD2]/12">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-5 space-y-3">
          {/* Pole Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#E4DDD2]/75 mr-2">
              <Layers className="w-3.5 h-3.5 text-[#ED6F2C]" />
              Pôles :
            </span>
            <button
              type="button"
              onClick={() => handlePoleSelect('tous')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                selectedPoleId === 'tous'
                  ? 'bg-[#ED6F2C] text-white'
                  : 'bg-[#042521] text-[#E4DDD2]/82 border border-[#E4DDD2]/15 hover:border-[#ED6F2C]/60'
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
                  onClick={() => handlePoleSelect(pole.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#ED6F2C] text-white'
                      : 'bg-[#042521] text-[#E4DDD2]/82 border border-[#E4DDD2]/15 hover:border-[#ED6F2C]/60'
                  }`}
                >
                  {pole.number}. {pole.shortTitle}
                </button>
              );
            })}
          </div>

          {/* Category Filter Row */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E4DDD2]/12">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#E4DDD2] text-[#073D37]'
                      : 'bg-[#042521] text-[#E4DDD2]/80 border border-[#E4DDD2]/14 hover:border-[#E4DDD2]/40'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-14">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="bg-[#073D37] rounded-xl border border-[#E4DDD2]/15 overflow-hidden flex flex-col group hover:-translate-y-1 hover:border-[#ED6F2C]/45 transition-all duration-200"
              >
                <div className="relative overflow-hidden">
                  <ImageWithFallback
                    src={item.imageUrl}
                    editorialVariant={
                      activePole
                        ? POLE_ILLUSTRATIONS[activePole.adminImageKey]
                        : 'hero-atelier'
                    }
                    tone="dark"
                    alt={item.title}
                    imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-lg bg-[#042521]/90 text-[#E4DDD2] border border-[#E4DDD2]/20 flex items-center justify-center shadow-sm hover:bg-[#ED6F2C] hover:text-white transition-colors duration-200 cursor-pointer"
                    aria-label={`Agrandir ${item.title}`}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#ED6F2C]">{item.category}</p>
                    <h2 className="font-display font-bold text-lg text-white mt-1">
                      {item.title}
                    </h2>
                    {item.description && (
                      <p className="text-sm text-[#E4DDD2]/78 mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E4DDD2]/12 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setLightboxItem(item)}
                      className="text-xs font-semibold text-[#E4DDD2] hover:text-white hover:underline cursor-pointer"
                    >
                      Voir en grand
                    </button>
                    <Link
                      to={`/devis?service=${encodeURIComponent(item.category)}&projet=${encodeURIComponent(item.title)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ED6F2C] hover:underline"
                    >
                      <span>Réaliser un projet similaire</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-[#073D37] rounded-2xl border border-[#E4DDD2]/15 p-8 text-center max-w-2xl mx-auto">
              <h2 className="font-display font-bold text-xl text-white">
                {activePole
                  ? `Galerie du Pôle ${activePole.number} — ${activePole.title}`
                  : selectedCategory === 'Toutes'
                    ? 'Galerie prête pour vos photographies officielles'
                    : `Aucune réalisation publiée dans « ${selectedCategory} » pour le moment`}
              </h2>
              <p className="text-sm text-[#E4DDD2]/80 mt-2 leading-relaxed">
                Aucun exemple fictif n&apos;est présenté comme une réalisation client. Les projets réels publiés depuis l&apos;administration apparaîtront ici avec affichage agrandi.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {(selectedPoleId !== 'tous' || selectedCategory !== 'Toutes') && (
                  <button
                    type="button"
                    onClick={() => {
                      handlePoleSelect('tous');
                      setSelectedCategory('Toutes');
                    }}
                    className="px-4 py-2.5 rounded-lg border border-[#E4DDD2]/25 text-sm font-medium text-[#E4DDD2] hover:bg-white/10 cursor-pointer"
                  >
                    Voir tout le portfolio
                  </button>
                )}
                <Link
                  to={`/devis${activePole ? `?service=${encodeURIComponent(activePole.title)}` : selectedCategory !== 'Toutes' ? `?service=${encodeURIComponent(selectedCategory)}` : ''}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200"
                >
                  <span>Réaliser un projet similaire</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {EMPTY_GALLERY_SLOTS.map((slot) => (
                <div
                  key={slot.cat}
                  className="bg-[#073D37] rounded-xl border border-[#E4DDD2]/15 overflow-hidden group"
                >
                  <div className="overflow-hidden border-b border-[#E4DDD2]/12">
                    <EditorialIllustration
                      variant={slot.illustration}
                      tone="dark"
                      aspectClass="aspect-[4/3]"
                      label={slot.cat}
                      className="transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#E4DDD2]">{slot.cat}</span>
                    <Link
                      to={`/devis?service=${encodeURIComponent(slot.serviceParam)}`}
                      className="font-semibold text-[#ED6F2C] hover:underline"
                    >
                      Devis sur ce pôle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
        >
          <div
            className="fixed inset-0 bg-[#042521]/85 backdrop-blur-xs"
            onClick={() => setLightboxItem(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-4xl w-full bg-[#073D37] rounded-xl overflow-hidden shadow-2xl border border-[#E4DDD2]/18">
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              className="absolute top-3 right-3 z-20 w-10 h-10 rounded-lg bg-[#042521]/90 text-white border border-[#E4DDD2]/20 flex items-center justify-center hover:bg-[#ED6F2C] cursor-pointer transition-colors"
              aria-label="Fermer l'aperçu"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-[#042521] max-h-[68vh] flex items-center justify-center overflow-hidden">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                referrerPolicy="no-referrer"
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>

            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#E4DDD2]/15">
              <div>
                <p className="text-xs font-semibold text-[#ED6F2C]">{lightboxItem.category}</p>
                <h3 className="font-display font-bold text-xl text-white mt-0.5">
                  {lightboxItem.title}
                </h3>
                {lightboxItem.description && (
                  <p className="text-sm text-[#E4DDD2]/82 mt-1.5">{lightboxItem.description}</p>
                )}
              </div>
              <Link
                to={`/devis?service=${encodeURIComponent(lightboxItem.category)}&projet=${encodeURIComponent(lightboxItem.title)}`}
                onClick={() => setLightboxItem(null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors shrink-0 whitespace-nowrap"
              >
                <span>Réaliser un projet similaire</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
