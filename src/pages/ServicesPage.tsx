import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { SERVICES_LIST, type SiteSettings } from '../types.ts';
import { SERVICE_ILLUSTRATIONS } from '../data/visuals.ts';
import { ImageWithFallback } from '../components/ImageWithFallback.tsx';
import { StudioBackdrop } from '../components/StudioBackdrop.tsx';
import { MaskReveal, Reveal, SplitTextReveal } from '../components/MotionPrimitives.tsx';

interface ServicesPageProps {
  settings: SiteSettings;
}

export function ServicesPage({ settings }: ServicesPageProps) {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  return (
    <div className="bg-[#073D37] text-[#E4DDD2]">
      {/* Hero — Deep Emerald */}
      <section className="relative overflow-hidden bg-[#073D37] text-white border-b border-[#E4DDD2]/12">
        <StudioBackdrop variant="emerald" showPattern />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] gap-8 lg:gap-16 items-end">
            <div className="space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  SAVOIR-FAIRE TECHNIQUES · ATELIER 4EVER
                </p>
              </Reveal>
              <SplitTextReveal
                as="h1"
                immediate
                text="Nos 11 techniques."
                className="type-hero text-[#E4DDD2] max-w-[14ch]"
              />
            </div>

            <Reveal delay={0.12} className="space-y-4 min-w-0">
              <p className="font-display font-bold text-lg sm:text-xl text-white">
                Création, impression, gravure et fabrication sur mesure.
              </p>
              <p className="type-intro text-[#E4DDD2]/85">
                Ces techniques d&apos;atelier interviennent transversalement sur nos quatre pôles de production : matières rigides, textiles, goodies et papeterie.
              </p>
              <div className="pt-1">
                <Link
                  to="/poles"
                  className="font-display inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#ED6F2C] hover:text-white transition-colors duration-200"
                >
                  <Layers className="w-4 h-4" />
                  <span>Voir l&apos;organisation par Pôles de production</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Quick Anchor Navigation */}
          <div className="mt-10 pt-8 border-t border-[#E4DDD2]/15 flex flex-wrap gap-2">
            {SERVICES_LIST.map((srv) => (
              <a
                key={srv.id}
                href={`#${srv.id}`}
                className="font-display px-3.5 py-2 rounded-lg bg-white/[0.08] hover:bg-[#ED6F2C] text-xs font-medium text-[#E4DDD2] hover:text-white transition-colors duration-200 whitespace-nowrap"
              >
                {srv.number}. {srv.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 11 Techniques Grid — Nuanced Deep Emerald Canvas + Monochrome Illustrations */}
      <section className="relative overflow-hidden bg-[#052E29]">
        <StudioBackdrop variant="emerald-deep" />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-24 space-y-12">
          {SERVICES_LIST.map((service, index) => {
            const customImage = settings.pageContent.serviceImages?.[service.id];
            const editorialVariant = SERVICE_ILLUSTRATIONS[service.id] || 'studio-craft';
            const isReversed = index % 2 === 1;

            return (
              <Reveal key={service.id}>
                <article
                  id={service.id}
                  className="scroll-mt-24 bg-[#073D37] rounded-2xl border border-[#E4DDD2]/15 overflow-hidden shadow-[0_14px_40px_-24px_rgba(0,0,0,0.45)] hover:border-[#ED6F2C]/40 transition-colors duration-200"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    <div
                      className={`lg:col-span-5 min-w-0 overflow-hidden bg-[#042521] relative border-b lg:border-b-0 ${
                        isReversed
                          ? 'lg:order-2 lg:border-l border-[#E4DDD2]/12'
                          : 'lg:order-1 lg:border-r border-[#E4DDD2]/12'
                      }`}
                    >
                      <MaskReveal
                        direction={isReversed ? 'right' : 'left'}
                        className="w-full h-full lg:absolute lg:inset-0"
                      >
                        <ImageWithFallback
                          src={customImage}
                          editorialVariant={editorialVariant}
                          tone="dark"
                          alt={service.title}
                          aspectClass="aspect-[4/3] lg:aspect-auto lg:h-full w-full"
                          imgClassName="transition-transform duration-300 hover:scale-[1.02]"
                        />
                      </MaskReveal>
                    </div>

                    <div
                      className={`lg:col-span-7 min-w-0 p-6 sm:p-10 lg:p-12 flex flex-col justify-between ${
                        isReversed ? 'lg:order-1' : 'lg:order-2'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="font-display flex items-center gap-3 text-xs font-bold text-[#ED6F2C]">
                          <span className="tabular-nums">{service.number}</span>
                          <span aria-hidden="true">/</span>
                          <span className="uppercase tracking-[0.16em]">Technique 4EVER</span>
                        </div>
                        <h2 className="type-h3 text-white">
                          {service.title}
                        </h2>
                        <p className="type-body text-[#E4DDD2]/82">
                          {service.description}
                        </p>

                        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-[#E4DDD2]/12">
                          <div className="min-w-0">
                            <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.15em] text-[#ED6F2C] mb-2.5">
                              Matériaux &amp; techniques
                            </h3>
                            <ul className="space-y-1.5 text-sm text-[#E4DDD2]/82">
                              {service.materialsAndTechniques.map((m) => (
                                <li key={m}>· {m}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.15em] text-[#E4DDD2]/90 mb-2.5">
                              Applications courantes
                            </h3>
                            <ul className="space-y-1.5 text-sm text-[#E4DDD2]/82">
                              {service.examples.map((ex) => (
                                <li key={ex}>· {ex}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-5 border-t border-[#E4DDD2]/12 flex flex-wrap items-center justify-between gap-4">
                        <span className="text-xs text-[#E4DDD2]/65 font-medium">
                          Étude technique et tarification sur devis
                        </span>
                        <Link
                          to={`/devis?service=${encodeURIComponent(service.title)}`}
                          className="font-display group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                        >
                          <span>Demander un devis</span>
                          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA Banner — Warm Sand Contrast Breathing Section */}
      <section className="relative overflow-hidden text-[#1A1A1A] border-t border-[#073D37]/12">
        <StudioBackdrop variant="sand" />
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <p className="type-kicker text-[#ED6F2C]">
              Étude technique sur mesure
            </p>
            <h2 className="type-h2 text-[#073D37]">
              Associer plusieurs techniques pour votre projet ?
            </h2>
            <p className="type-body text-[#1A1A1A]/80">
              Découpe laser, impression UV-DTF, broderie ou façonnage : nos équipes vous conseillent selon votre matière et votre budget.
            </p>
          </div>
          <Link
            to="/devis"
            className="font-display inline-flex items-center gap-2 px-7 py-4 rounded-lg bg-[#073D37] text-white text-sm font-semibold hover:bg-[#ED6F2C] transition-colors duration-200 whitespace-nowrap shrink-0"
          >
            <span>Demander un devis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
