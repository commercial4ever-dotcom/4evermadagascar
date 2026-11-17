import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Compass, Layers } from 'lucide-react';
import { PRODUCTION_POLES, type SiteSettings } from '../types.ts';
import { POLE_ILLUSTRATIONS } from '../data/visuals.ts';
import { StudioBackdrop } from './StudioBackdrop.tsx';
import { BrandPattern } from './BrandPattern.tsx';
import { ImageWithFallback } from './ImageWithFallback.tsx';
import {
  MagneticWrapper,
  MaskReveal,
  PoleCardReveal,
  Reveal,
  SplitTextReveal,
  TiltCard,
} from './MotionPrimitives.tsx';

interface PolesSectionProps {
  settings: SiteSettings;
  mode?: 'home' | 'page';
  initialPoleId?: string;
}

const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function PolesSection({
  settings,
  mode = 'home',
  initialPoleId,
}: PolesSectionProps) {
  const initialIndex = initialPoleId
    ? Math.max(
        0,
        PRODUCTION_POLES.findIndex((p) => p.id === initialPoleId),
      )
    : 0;

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const shouldReduceMotion = useReducedMotion();
  const activePole = PRODUCTION_POLES[activeIndex];

  const getCustomPolePhoto = (adminKey: string) => {
    const customUrl = settings.pageContent.serviceImages?.[adminKey];
    return customUrl && customUrl.trim().length > 0 ? customUrl : undefined;
  };

  return (
    <section
      id="nos-poles"
      className="relative overflow-hidden bg-[#063631] border-b border-[#E4DDD2]/12 text-white"
    >
      {/* Nuanced Deep Emerald Surface + subtle corner pattern */}
      <StudioBackdrop variant="emerald-mid" />
      <BrandPattern
        variant="monochrome-light"
        opacity={0.03}
        position="bottom-right"
        scale={1.0}
        mask="radial"
      />

      <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24 space-y-12 lg:space-y-16">
        {/* Editorial Header — Locked Typography Scale & Proportions */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] gap-8 lg:gap-16 items-end pb-8 border-b border-[#E4DDD2]/15">
          <div className="space-y-4 min-w-0">
            <Reveal direction="up">
              <p className="type-kicker text-[#ED6F2C]">
                03 / NOS PÔLES — 4EVER MODERN HANDCRAFT
              </p>
            </Reveal>
            <SplitTextReveal
              as="h2"
              text="Nos pôles de production."
              className="type-h2 text-[#E4DDD2] max-w-[14ch]"
            />
          </div>

          <Reveal delay={0.1} className="space-y-5 min-w-0">
            <p className="type-intro text-[#E4DDD2]/85">
              Quatre pôles complémentaires pour créer, personnaliser et fabriquer sur mesure.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {mode === 'home' ? (
                <MagneticWrapper>
                  <Link
                    to="/poles"
                    className="font-display group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-xs sm:text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                  >
                    <span>Explorer tous les pôles</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </MagneticWrapper>
              ) : (
                <MagneticWrapper>
                  <Link
                    to="/catalogue"
                    className="font-display group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-xs sm:text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                  >
                    <span>Ouvrir le catalogue 2027</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </MagneticWrapper>
              )}
              <Link
                to="/services"
                className="font-display text-xs sm:text-sm font-semibold text-[#E4DDD2] hover:text-[#ED6F2C] underline underline-offset-4 transition-colors duration-200 whitespace-nowrap"
              >
                Voir nos 11 techniques
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Interactive Pole Selector & Emerald Editorial Showcase */}
        <Reveal>
          <div className="bg-[#052E29] rounded-2xl overflow-hidden border border-[#E4DDD2]/15 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]">
            {/* Editorial Selector Strip */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#E4DDD2]/12"
              role="tablist"
              aria-label="Sélection des quatre pôles 4EVER"
            >
              {PRODUCTION_POLES.map((pole, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={pole.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveIndex(idx)}
                    className={`font-display relative text-left px-6 py-5 border-b sm:border-b-0 sm:border-r last:border-r-0 border-[#E4DDD2]/12 transition-colors duration-200 cursor-pointer min-w-0 ${
                      isActive
                        ? 'bg-[#073D37] text-white'
                        : 'bg-[#042521] text-[#E4DDD2]/72 hover:bg-[#063530] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`tabular-nums text-xs font-bold tracking-[0.14em] ${
                          isActive ? 'text-[#ED6F2C]' : 'text-[#E4DDD2]/55'
                        }`}
                      >
                        PÔLE {pole.number}
                      </span>
                      <span
                        className={`h-0.5 w-6 transition-colors duration-200 ${
                          isActive ? 'bg-[#ED6F2C]' : 'bg-[#E4DDD2]/15'
                        }`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm sm:text-base mt-1.5 truncate">
                      {pole.title}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Pole Detail Split */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activePole.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: EASE_SMOOTH }}
                className="p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
              >
                {/* Monochrome Illustration Frame */}
                <div className="lg:col-span-5 min-w-0 space-y-4">
                  <div className="rounded-xl overflow-hidden border border-[#E4DDD2]/15 bg-[#042521]">
                    <ImageWithFallback
                      src={getCustomPolePhoto(activePole.adminImageKey)}
                      editorialVariant={POLE_ILLUSTRATIONS[activePole.adminImageKey]}
                      tone="dark"
                      alt={`Pôle ${activePole.number} — ${activePole.title}`}
                      imgClassName="transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#E4DDD2]/12 flex items-center justify-between gap-4 text-xs">
                    <span className="text-[#E4DDD2]/70">
                      Techniques d&apos;atelier transversales
                    </span>
                    <Link
                      to={`/services#${activePole.serviceHashes[0]}`}
                      className="font-display font-bold text-[#E4DDD2] hover:text-[#ED6F2C] whitespace-nowrap transition-colors duration-200"
                    >
                      Voir les services →
                    </Link>
                  </div>
                </div>

                {/* Editorial Details */}
                <div className="lg:col-span-7 min-w-0 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-display font-bold">
                      <span className="tabular-nums text-[#ED6F2C] tracking-[0.14em]">
                        PÔLE {activePole.number}
                      </span>
                      <span aria-hidden="true" className="text-[#E4DDD2]/30">/</span>
                      <span className="uppercase tracking-[0.14em] text-[#E4DDD2]/70">
                        {activePole.tagline}
                      </span>
                    </div>

                    <h3 className="type-h3 text-white">
                      {activePole.title}
                    </h3>

                    <p className="type-body text-[#E4DDD2]/82 max-w-2xl">
                      {activePole.description}
                    </p>

                    <div
                      className={`pt-5 border-t border-[#E4DDD2]/12 grid grid-cols-1 ${
                        activePole.secondaryItems ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                      } gap-6`}
                    >
                      <div className="min-w-0">
                        <h4 className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#ED6F2C] mb-2.5">
                          {activePole.primarySectionLabel}
                        </h4>
                        <ul className="space-y-1.5 text-sm text-[#E4DDD2]/82">
                          {activePole.primaryItems.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="text-[#ED6F2C] font-bold">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {activePole.secondaryItems && activePole.secondarySectionLabel && (
                        <div className="min-w-0">
                          <h4 className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#ED6F2C] mb-2.5">
                            {activePole.secondarySectionLabel}
                          </h4>
                          <ul className="space-y-1.5 text-sm text-[#E4DDD2]/82">
                            {activePole.secondaryItems.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <span className="text-[#ED6F2C] font-bold">·</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#E4DDD2]/90 mb-2.5">
                          Applications
                        </h4>
                        <ul className="space-y-1.5 text-sm text-[#E4DDD2]/82">
                          {activePole.applications.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="text-[#E4DDD2]/70 font-bold">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 border-t border-[#E4DDD2]/12 flex flex-wrap items-center gap-3">
                    <MagneticWrapper>
                      <Link
                        to={`/catalogue?pole=${encodeURIComponent(activePole.id)}`}
                        className="font-display group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#073D37] border border-[#E4DDD2]/20 text-white text-xs sm:text-sm font-semibold hover:bg-[#042521] transition-colors duration-200 whitespace-nowrap"
                      >
                        <Compass className="w-4 h-4 text-[#ED6F2C]" />
                        <span>Explorer ce pôle</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                    </MagneticWrapper>

                    <Link
                      to={`/realisations?pole=${encodeURIComponent(activePole.id)}`}
                      className="font-display inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#E4DDD2]/25 text-[#E4DDD2] text-xs sm:text-sm font-semibold hover:bg-white/10 transition-colors duration-200 whitespace-nowrap"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Réalisations associées</span>
                    </Link>

                    <Link
                      to={`/devis?service=${encodeURIComponent(activePole.title)}`}
                      className="font-display inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#ED6F2C] text-white text-xs sm:text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                    >
                      <span>Devis sur ce pôle</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Asymmetrical 4-Pole Overview Cards (7 / 5 + 5 / 7, deep emerald & B&W line-art) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {PRODUCTION_POLES.map((pole, idx) => {
            const colSpanClass =
              idx === 0 || idx === 3 ? 'lg:col-span-7' : 'lg:col-span-5';
            const customImg = getCustomPolePhoto(pole.adminImageKey);

            return (
              <PoleCardReveal
                key={pole.id}
                variant={pole.revealVariant}
                delay={idx * 0.05}
                className={`${colSpanClass} min-w-0`}
              >
                <TiltCard>
                  <article className="group h-full bg-[#052E29] rounded-2xl border border-[#E4DDD2]/14 overflow-hidden flex flex-col justify-between shadow-[0_14px_38px_-22px_rgba(0,0,0,0.45)] hover:border-[#ED6F2C]/45 transition-colors duration-200">
                    <div>
                      <div className="relative overflow-hidden border-b border-[#E4DDD2]/10">
                        <MaskReveal direction={idx % 2 === 0 ? 'bottom' : 'left'}>
                          <ImageWithFallback
                            src={customImg}
                            editorialVariant={POLE_ILLUSTRATIONS[pole.adminImageKey]}
                            tone="dark"
                            alt={`Pôle ${pole.number} — ${pole.title}`}
                            aspectClass="aspect-[16/10]"
                            imgClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </MaskReveal>
                      </div>

                      <div className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between gap-2 text-xs font-display">
                          <span className="tabular-nums font-bold tracking-[0.14em] text-[#ED6F2C]">
                            PÔLE {pole.number}
                          </span>
                          <span className="text-[#E4DDD2]/65 font-medium truncate">
                            {pole.primaryItems.slice(0, 2).join(' · ')}
                          </span>
                        </div>

                        <h3 className="type-h3 text-white group-hover:text-[#ED6F2C] transition-colors duration-200">
                          {pole.title}
                        </h3>

                        <p className="type-body text-[#E4DDD2]/80">
                          {pole.description}
                        </p>

                        <div className="pt-4 border-t border-[#E4DDD2]/12 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[#E4DDD2]/78">
                          <div className="min-w-0">
                            <p className="font-display font-bold text-[11px] text-[#ED6F2C] uppercase tracking-[0.14em] mb-1">
                              {pole.primarySectionLabel}
                            </p>
                            <p className="leading-relaxed">
                              {pole.primaryItems.slice(0, 4).join(' · ')}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="font-display font-bold text-[11px] text-[#E4DDD2] uppercase tracking-[0.14em] mb-1">
                              Applications clés
                            </p>
                            <p className="leading-relaxed">
                              {pole.applications.slice(0, 4).join(' · ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 sm:px-8 pb-7 pt-2 flex flex-wrap items-center justify-between gap-3">
                      <Link
                        to={`/catalogue?pole=${encodeURIComponent(pole.id)}`}
                        className="font-display group/btn inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#073D37] border border-[#E4DDD2]/20 text-white text-xs font-semibold hover:bg-[#ED6F2C] hover:border-[#ED6F2C] transition-colors duration-200 whitespace-nowrap"
                      >
                        <span>Explorer ce pôle</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveIndex(idx);
                          document
                            .getElementById('nos-poles')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="font-display text-xs font-semibold text-[#E4DDD2] hover:text-[#ED6F2C] underline underline-offset-4 cursor-pointer whitespace-nowrap transition-colors duration-200"
                      >
                        Fiche détaillée
                      </button>
                    </div>
                  </article>
                </TiltCard>
              </PoleCardReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
