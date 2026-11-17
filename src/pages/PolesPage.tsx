import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { SiteSettings } from '../types.ts';
import { PolesSection } from '../components/PolesSection.tsx';
import { StudioBackdrop } from '../components/StudioBackdrop.tsx';
import { BrandPattern } from '../components/BrandPattern.tsx';
import { Reveal, SplitTextReveal } from '../components/MotionPrimitives.tsx';

interface PolesPageProps {
  settings: SiteSettings;
}

export function PolesPage({ settings }: PolesPageProps) {
  const [searchParams] = useSearchParams();
  const initialPoleId = searchParams.get('pole') || undefined;

  return (
    <div className="bg-[#073D37] text-[#E4DDD2]">
      {/* Deep Emerald Hero with CRÉER & PERSONNALISER Open Split */}
      <section className="relative overflow-hidden bg-[#073D37] text-white border-b border-[#E4DDD2]/12">
        <StudioBackdrop variant="emerald" showPattern />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-14 sm:py-20 lg:py-24 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] gap-8 lg:gap-16 items-end">
            <div className="space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  03 / NOS PÔLES — 4EVER MODERN HANDCRAFT
                </p>
              </Reveal>
              <SplitTextReveal
                as="h1"
                immediate
                text="Nos pôles de production."
                className="type-hero text-[#E4DDD2] max-w-[14ch]"
              />
            </div>
            <Reveal delay={0.12} className="space-y-3 min-w-0">
              <p className="font-display font-bold text-lg sm:text-xl text-white">
                Quatre pôles complémentaires pour créer, personnaliser et fabriquer sur mesure.
              </p>
              <p className="type-intro text-[#E4DDD2]/85">
                Des matières rigides aux textiles et fibres malgaches, des goodies d&apos;affaires à la papeterie d&apos;édition : explorez nos quatre familles de production, reliées par nos 11 techniques d&apos;atelier.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 pt-8 border-t border-[#E4DDD2]/20">
            <Reveal delay={0.15}>
              <div className="space-y-2.5">
                <p className="font-display tabular-nums text-xs font-bold tracking-[0.18em] uppercase text-[#ED6F2C]">
                  01 / CRÉER
                </p>
                <p className="type-h3 text-white">
                  Concevoir à partir de la matière
                </p>
                <p className="type-body text-[#E4DDD2]/80 max-w-xl">
                  Imaginer, concevoir et fabriquer des produits originaux, authentiques et sur mesure, à partir de matières premières ou de composants.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="space-y-2.5 md:border-l md:border-[#E4DDD2]/15 md:pl-10 lg:pl-14">
                <p className="font-display tabular-nums text-xs font-bold tracking-[0.18em] uppercase text-[#ED6F2C]">
                  02 / PERSONNALISER
                </p>
                <p className="type-h3 text-white">
                  Transformer et valoriser l&apos;existant
                </p>
                <p className="type-body text-[#E4DDD2]/80 max-w-xl">
                  Transformer et valoriser des objets ou supports existants par le design, l&apos;impression, la gravure, le marquage et les finitions.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Main Editorial Poles Section — Deep Emerald Mid */}
      <PolesSection settings={settings} mode="page" initialPoleId={initialPoleId} />

      {/* Bridge to Services & Custom Quote — Sand Breathing Backdrop */}
      <section className="relative overflow-hidden">
        <StudioBackdrop variant="sand" />
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-[#073D37] text-white p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <BrandPattern
                variant="monochrome-light"
                opacity={0.035}
                position="right-edge"
                scale={1.0}
                mask="fade-left"
              />
              <div className="relative z-10 max-w-2xl space-y-3">
                <p className="type-kicker text-[#ED6F2C]">
                  Approche transversale
                </p>
                <h2 className="type-h2 text-[#E4DDD2]">
                  Un projet qui croise plusieurs pôles ?
                </h2>
                <p className="type-body text-[#E4DDD2]/85">
                  Un coffret bois peut combiner découpe laser, impression UV-DTF, papeterie créative et pochon textile brodé. Nous coordonnons l&apos;ensemble en un devis unique.
                </p>
              </div>
              <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
                <Link
                  to="/services"
                  className="font-display px-5 py-3.5 rounded-lg border border-[#E4DDD2]/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors duration-200 whitespace-nowrap"
                >
                  Voir nos techniques
                </Link>
                <Link
                  to="/devis"
                  className="font-display inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                >
                  <span>Demander un devis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
