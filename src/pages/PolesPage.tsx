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
    <div className="bg-white text-[#1A1A1A]">
      {/* Deep Emerald Hero with CRÉER & PERSONNALISER Open Split */}
      <section className="relative overflow-hidden bg-[#073D37] text-white">
        <StudioBackdrop variant="emerald" showPattern />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24 space-y-14">
          <div className="max-w-4xl space-y-5">
            <Reveal>
              <p className="type-kicker text-[#ED6F2C]">
                4EVER — Modern Handcraft · Nos Pôles
              </p>
            </Reveal>
            <SplitTextReveal
              as="h1"
              immediate
              text="Quatre pôles pour créer et personnaliser sur mesure."
              className="type-hero text-white text-balance"
            />
            <Reveal delay={0.14}>
              <p className="type-intro text-[#E4DDD2]/85 max-w-2xl">
                Des matières rigides aux textiles et fibres malgaches, des goodies d&apos;affaires à la papeterie d&apos;édition : explorez nos quatre familles de production, reliées par nos 12 techniques d&apos;atelier.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 pt-8 border-t border-[#E4DDD2]/20">
            <Reveal delay={0.18}>
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

            <Reveal delay={0.24}>
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

      {/* Main Editorial Poles Section */}
      <PolesSection settings={settings} mode="page" initialPoleId={initialPoleId} />

      {/* Bridge to Services & Custom Quote */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-[#073D37] text-white p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <BrandPattern
                variant="monochrome-light"
                opacity={0.04}
                position="right-edge"
                scale={1.05}
                mask="fade-left"
                parallax={false}
              />
              <div className="relative z-10 max-w-2xl space-y-3">
                <p className="type-kicker text-[#ED6F2C]">
                  Approche transversale
                </p>
                <h2 className="type-h2 text-white">
                  Un projet qui croise plusieurs pôles ?
                </h2>
                <p className="type-body text-[#E4DDD2]/85">
                  Un coffret bois peut combiner découpe laser, impression UV-DTF, papeterie créative et pochon textile brodé. Nous coordonnons l&apos;ensemble en un devis unique.
                </p>
              </div>
              <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
                <Link
                  to="/services"
                  className="font-display px-5 py-3.5 rounded-lg border border-[#E4DDD2]/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  Voir nos techniques
                </Link>
                <Link
                  to="/devis"
                  className="font-display inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors whitespace-nowrap"
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
