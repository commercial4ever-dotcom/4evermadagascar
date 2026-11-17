import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Compass, Layers } from 'lucide-react';
import { PRODUCTION_POLES, type SiteSettings } from '../types.ts';
import { POLE_DEFAULT_IMAGES, STUDIO_VISUALS } from '../data/visuals.ts';
import { StudioBackdrop } from './StudioBackdrop.tsx';
import { BrandPattern } from './BrandPattern.tsx';
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

  const getPoleVisual = (
    adminKey: string,
    visualKey: keyof typeof STUDIO_VISUALS,
  ) => {
    const customUrl = settings.pageContent.serviceImages?.[adminKey];
    if (customUrl && customUrl.trim().length > 0) return customUrl;
    return POLE_DEFAULT_IMAGES[adminKey] || STUDIO_VISUALS[visualKey];
  };

  return (
    <section
      id="nos-poles"
      className="relative overflow-hidden border-b border-[#073D37]/12 text-[#1A1A1A]"
    >
      {/* Warm Sand Surface for breathing contrast; subtle corner pattern away from copy */}
      <StudioBackdrop variant="sand" />
      <BrandPattern
        variant="monochrome-dark"
        opacity={0.03}
        position="bottom-right"
        scale={1.05}
        mask="radial"
        parallax={12}
      />

      <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-24 lg:py-32 space-y-16 lg:space-y-20">
        {/* Editorial Header — Dominant Left-Aligned H2 + Secondary Intro + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end pb-10 border-b border-[#073D37]/15">
          <div className="lg:col-span-7 space-y-5 min-w-0">
            <Reveal direction="up">
              <p className="type-kicker text-[#ED6F2C]">
                01 / NOS PÔLES
              </p>
            </Reveal>
            <SplitTextReveal
              as="h2"
              text="La matière au service de vos idées."
              className="type-h2 text-[#073D37] text-balance"
            />
          </div>

          <Reveal delay={0.12} className="lg:col-span-5 space-y-6 min-w-0">
            <p className="type-intro text-[#1A1A1A]/85">
              Quatre pôles complémentaires pour créer, personnaliser et fabriquer des pièces qui vous ressemblent.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {mode === 'home' ? (
                <MagneticWrapper>
                  <Link
                    to="/poles"
                    className="font-display group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#073D37] text-white text-xs sm:text-sm font-semibold hover:bg-[#ED6F2C] transition-colors whitespace-nowrap"
                  >
                    <span>Explorer tous les pôles</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </MagneticWrapper>
              ) : (
                <MagneticWrapper>
                  <Link
                    to="/catalogue"
                    className="font-display group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#073D37] text-white text-xs sm:text-sm font-semibold hover:bg-[#ED6F2C] transition-colors whitespace-nowrap"
                  >
                    <span>Ouvrir le catalogue 2027</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </MagneticWrapper>
              )}
              <Link
                to="/services"
                className="font-display text-xs sm:text-sm font-semibold text-[#073D37] hover:text-[#ED6F2C] underline underline-offset-4 transition-colors whitespace-nowrap"
              >
                Voir nos 12 techniques
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Interactive Pole Selector & Editorial Showcase */}
        <Reveal>
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_24px_60px_-28px_rgba(7,61,55,0.14)]">
            {/* Editorial Selector Strip */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#073D37]/10"
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
                    className={`font-display relative text-left px-6 py-5 border-b sm:border-b-0 sm:border-r last:border-r-0 border-[#073D37]/10 transition-colors cursor-pointer min-w-0 ${
                      isActive
                        ? 'bg-[#073D37] text-white'
                        : 'bg-[#FAF8F5] text-[#1A1A1A]/80 hover:bg-[#E4DDD2]/45 hover:text-[#073D37]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`tabular-nums text-xs font-bold tracking-[0.14em] ${
                          isActive ? 'text-[#ED6F2C]' : 'text-[#073D37]/55'
                        }`}
                      >
                        PÔLE {pole.number}
                      </span>
                      <span
                        className={`h-0.5 w-6 transition-colors ${
                          isActive ? 'bg-[#ED6F2C]' : 'bg-[#073D37]/15'
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
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
              >
                {/* Illustration Frame */}
                <div className="lg:col-span-5 min-w-0 space-y-4">
                  <div className="rounded-xl overflow-hidden bg-[#FAF8F5] aspect-[4/3] w-full">
                    <img
                      src={getPoleVisual(activePole.adminImageKey, activePole.visualKey)}
                      alt={`Pôle ${activePole.number} — ${activePole.title}`}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#073D37]/12 flex items-center justify-between gap-4 text-xs">
                    <span className="text-[#1A1A1A]/70">
                      Techniques d&apos;atelier transversales
                    </span>
                    <Link
                      to={`/services#${activePole.serviceHashes[0]}`}
                      className="font-display font-bold text-[#073D37] hover:text-[#ED6F2C] whitespace-nowrap transition-colors"
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
                      <span aria-hidden="true" className="text-[#073D37]/30">/</span>
                      <span className="uppercase tracking-[0.14em] text-[#073D37]/65">
                        {activePole.tagline}
                      </span>
                    </div>

                    <h3 className="type-h3 text-[#073D37]">
                      {activePole.title}
                    </h3>

                    <p className="type-body text-[#1A1A1A]/80 max-w-2xl">
                      {activePole.description}
                    </p>

                    <div
                      className={`pt-5 border-t border-[#073D37]/12 grid grid-cols-1 ${
                        activePole.secondaryItems ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                      } gap-6`}
                    >
                      <div className="min-w-0">
                        <h4 className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#073D37] mb-2.5">
                          {activePole.primarySectionLabel}
                        </h4>
                        <ul className="space-y-1.5 text-sm text-[#1A1A1A]/80">
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
                          <h4 className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#073D37] mb-2.5">
                            {activePole.secondarySectionLabel}
                          </h4>
                          <ul className="space-y-1.5 text-sm text-[#1A1A1A]/80">
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
                        <h4 className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#073D37] mb-2.5">
                          Applications
                        </h4>
                        <ul className="space-y-1.5 text-sm text-[#1A1A1A]/80">
                          {activePole.applications.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span className="text-[#073D37] font-bold">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 border-t border-[#073D37]/12 flex flex-wrap items-center gap-3">
                    <MagneticWrapper>
                      <Link
                        to={`/catalogue?pole=${encodeURIComponent(activePole.id)}`}
                        className="font-display group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#073D37] text-white text-xs sm:text-sm font-semibold hover:bg-[#042824] transition-colors whitespace-nowrap"
                      >
                        <Compass className="w-4 h-4 text-[#ED6F2C]" />
                        <span>Explorer ce pôle</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </MagneticWrapper>

                    <Link
                      to={`/realisations?pole=${encodeURIComponent(activePole.id)}`}
                      className="font-display inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#073D37]/20 bg-white text-[#073D37] text-xs sm:text-sm font-semibold hover:bg-[#E4DDD2]/45 transition-colors whitespace-nowrap"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Réalisations associées</span>
                    </Link>

                    <Link
                      to={`/devis?service=${encodeURIComponent(activePole.title)}`}
                      className="font-display inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#ED6F2C] text-white text-xs sm:text-sm font-semibold hover:bg-[#d85f1f] transition-colors whitespace-nowrap"
                    >
                      <span>Devis sur ce pôle</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Asymmetrical 4-Pole Overview Cards (7 / 5 + 5 / 7, clean editorial rhythm) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {PRODUCTION_POLES.map((pole, idx) => {
            const colSpanClass =
              idx === 0 || idx === 3 ? 'lg:col-span-7' : 'lg:col-span-5';
            const imgSrc = getPoleVisual(pole.adminImageKey, pole.visualKey);

            return (
              <PoleCardReveal
                key={pole.id}
                variant={pole.revealVariant}
                delay={idx * 0.08}
                className={`${colSpanClass} min-w-0`}
              >
                <TiltCard>
                  <article className="group h-full bg-white rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_12px_36px_-22px_rgba(7,61,55,0.12)] hover:shadow-[0_24px_55px_-22px_rgba(7,61,55,0.18)] transition-all duration-300">
                    <div>
                      <div className="relative overflow-hidden aspect-[16/10] bg-[#FAF8F5]">
                        <MaskReveal direction={idx % 2 === 0 ? 'bottom' : 'left'} className="w-full h-full">
                          <img
                            src={imgSrc}
                            alt={`Pôle ${pole.number} — ${pole.title}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </MaskReveal>
                      </div>

                      <div className="p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between gap-2 text-xs font-display">
                          <span className="tabular-nums font-bold tracking-[0.14em] text-[#ED6F2C]">
                            PÔLE {pole.number}
                          </span>
                          <span className="text-[#073D37]/60 font-medium truncate">
                            {pole.primaryItems.slice(0, 2).join(' · ')}
                          </span>
                        </div>

                        <h3 className="type-h3 text-[#073D37] group-hover:text-[#ED6F2C] transition-colors">
                          {pole.title}
                        </h3>

                        <p className="type-body text-[#1A1A1A]/78">
                          {pole.description}
                        </p>

                        <div className="pt-4 border-t border-[#073D37]/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[#1A1A1A]/75">
                          <div className="min-w-0">
                            <p className="font-display font-bold text-[11px] text-[#073D37] uppercase tracking-[0.14em] mb-1">
                              {pole.primarySectionLabel}
                            </p>
                            <p className="leading-relaxed">
                              {pole.primaryItems.slice(0, 4).join(' · ')}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="font-display font-bold text-[11px] text-[#073D37] uppercase tracking-[0.14em] mb-1">
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
                        className="font-display group/btn inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#073D37] text-white text-xs font-semibold hover:bg-[#ED6F2C] transition-colors whitespace-nowrap"
                      >
                        <span>Explorer ce pôle</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveIndex(idx);
                          document
                            .getElementById('nos-poles')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="font-display text-xs font-semibold text-[#073D37] hover:text-[#ED6F2C] underline underline-offset-4 cursor-pointer whitespace-nowrap"
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
