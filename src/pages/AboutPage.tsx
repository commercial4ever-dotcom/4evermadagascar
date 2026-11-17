import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Layers } from 'lucide-react';
import type { SiteSettings } from '../types.ts';
import { STUDIO_VISUALS } from '../data/visuals.ts';
import { ImageWithFallback } from '../components/ImageWithFallback.tsx';
import { StudioBackdrop } from '../components/StudioBackdrop.tsx';
import { BrandPattern } from '../components/BrandPattern.tsx';
import {
  MagneticWrapper,
  MaskReveal,
  Reveal,
  ScrollStoryProgress,
  SplitTextReveal,
  StaggerGrid,
  StaggerItem,
} from '../components/MotionPrimitives.tsx';

interface AboutPageProps {
  settings: SiteSettings;
}

const METHOD_TIMELINE = [
  {
    number: '01',
    title: 'Étude et conception',
    description:
      'Comprendre chaque projet, explorer les possibilités et concevoir une solution adaptée.',
  },
  {
    number: '02',
    title: 'Design et personnalisation',
    description:
      'Créer une identité visuelle distinctive ou adapter un produit à l’univers de son destinataire.',
  },
  {
    number: '03',
    title: 'Choix des matières',
    description:
      'Associer esthétique, propriétés techniques et contraintes de fabrication.',
  },
  {
    number: '04',
    title: 'Fabrication',
    description:
      'Mettre en œuvre les techniques adaptées : impression, découpe, gravure, CNC, confection et assemblage.',
  },
  {
    number: '05',
    title: 'Finition et réalisation',
    description:
      'Soigner les détails pour obtenir une création cohérente, durable et fidèle au projet.',
  },
];

const VISION_PILLARS = [
  {
    index: '01',
    label: 'Identité',
    detail: 'Des pièces singulières qui expriment une signature visuelle et culturelle forte.',
  },
  {
    index: '02',
    label: 'Culture',
    detail: 'Un dialogue vivant entre les matières malgaches et le design contemporain.',
  },
  {
    index: '03',
    label: 'Création',
    detail: 'Concevoir des objets originaux au-delà de la simple personnalisation standard.',
  },
  {
    index: '04',
    label: 'Innovation',
    detail: 'L’association des technologies laser, CNC et d’impression aux gestes artisanaux.',
  },
  {
    index: '05',
    label: 'Production locale',
    detail: 'Maîtriser la fabrication à Antananarivo avec un niveau d’exigence international.',
  },
];

const OBJECTIVE_AXES = [
  {
    number: '01',
    title: 'Autonomie de production',
    detail: 'Maîtriser chaque étape en atelier pour gagner en réactivité et en liberté créative.',
  },
  {
    number: '02',
    title: 'Innovation technique',
    detail: 'Perfectionner en continu nos procédés de marquage, découpe, gravure et assemblage.',
  },
  {
    number: '03',
    title: 'Diversification des matières',
    detail: 'Explorer le bois, le raphia, le tsihy, le métal, le papier créatif et le textile.',
  },
  {
    number: '04',
    title: 'Maîtrise des finitions',
    detail: 'Accorder une attention exigeante aux détails, à la tenue et à l’élégance finale.',
  },
  {
    number: '05',
    title: 'Développement de créations originales',
    detail: 'Imaginer de nouvelles gammes conçues localement, durables et porteuses de sens.',
  },
];

export function AboutPage({ settings }: AboutPageProps) {
  const { pageContent } = settings;

  return (
    <div className="bg-white text-[#1A1A1A]">
      {/* 1. QUI SOMMES-NOUS ? — Deep Emerald Editorial Opening */}
      <section className="relative overflow-hidden bg-[#073D37] text-white">
        <StudioBackdrop variant="emerald" showPattern />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  Qui sommes-nous ? · 4EVER — Modern Handcraft
                </p>
              </Reveal>

              <SplitTextReveal
                as="h1"
                immediate
                text="Nous donnons forme aux idées. Nous créons des objets qui ont du sens."
                className="type-hero text-white text-balance"
              />

              <Reveal delay={0.14} className="space-y-4 max-w-2xl">
                <p className="type-intro text-[#E4DDD2]/90">
                  4EVER Madagascar est un atelier de création, de personnalisation et de fabrication sur mesure.
                </p>
                <p className="type-body text-[#E4DDD2]/78">
                  Nous associons design, savoir-faire artisanal et technologies de production pour réaliser des objets, des supports et des expériences uniques. Du simple marquage à la conception d&apos;une pièce entièrement originale, nous accompagnons particuliers, entreprises et marques à chaque étape de leur projet.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-5 min-w-0">
              <MaskReveal direction="bottom" className="rounded-2xl bg-[#FAF8F5] shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
                <ImageWithFallback
                  src={pageContent.aboutTeamImageUrl}
                  fallbackSrc={STUDIO_VISUALS.serviceStudioCreatif}
                  alt="Atelier créatif 4EVER Madagascar — Ampandrana, Antananarivo"
                  aspectClass="aspect-[4/3]"
                />
              </MaskReveal>
            </div>
          </div>

          {/* Open Editorial CRÉER & PERSONNALISER split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 pt-8 border-t border-[#E4DDD2]/20">
            <Reveal delay={0.18}>
              <div className="space-y-2.5">
                <p className="font-display tabular-nums text-xs font-bold tracking-[0.18em] uppercase text-[#ED6F2C]">
                  01 / CRÉER
                </p>
                <h2 className="type-h3 text-white">
                  Imaginer à partir de la matière
                </h2>
                <p className="type-body text-[#E4DDD2]/80 max-w-xl">
                  Imaginer, concevoir et fabriquer des produits originaux, authentiques et sur mesure à partir de matières premières ou de composants.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="space-y-2.5 md:border-l md:border-[#E4DDD2]/15 md:pl-10 lg:pl-14">
                <p className="font-display tabular-nums text-xs font-bold tracking-[0.18em] uppercase text-[#ED6F2C]">
                  02 / PERSONNALISER
                </p>
                <h2 className="type-h3 text-white">
                  Valoriser les supports existants
                </h2>
                <p className="type-body text-[#E4DDD2]/80 max-w-xl">
                  Transformer et valoriser des objets ou supports existants par le design, l&apos;impression, la gravure, le marquage et les finitions.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2. CE QUE NOUS FAISONS — Pure White Scroll-Linked Method Timeline */}
      <section className="relative overflow-hidden bg-white border-b border-[#073D37]/10">
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-24 lg:py-32 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end pb-10 border-b border-[#073D37]/12">
            <div className="lg:col-span-7 space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  Ce que nous faisons
                </p>
              </Reveal>
              <SplitTextReveal
                as="h2"
                text="De l’idée à la matière. De la matière à la création."
                className="type-h2 text-[#073D37] text-balance"
              />
            </div>
            <Reveal delay={0.1} className="lg:col-span-5 min-w-0">
              <p className="type-intro text-[#1A1A1A]/78">
                Chaque projet suit un parcours méthodique en atelier, pensé pour relier l&apos;intention créative aux exigences matérielles de production.
              </p>
            </Reveal>
          </div>

          <div className="space-y-8">
            <div className="hidden lg:block">
              <ScrollStoryProgress orientation="horizontal" />
            </div>

            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-start">
              {METHOD_TIMELINE.map((step) => (
                <StaggerItem key={step.number} className="min-w-0">
                  <div className="pt-5 border-t border-[#073D37]/20 space-y-3">
                    <span className="font-display tabular-nums block text-2xl font-extrabold text-[#ED6F2C]">
                      {step.number}
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#073D37] leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </div>
      </section>

      {/* 3. NOTRE VISION — Warm Beige Editorial Split */}
      <section className="relative overflow-hidden border-b border-[#073D37]/10">
        <StudioBackdrop variant="sand" />
        <BrandPattern
          variant="monochrome-dark"
          opacity={0.03}
          position="bottom-left"
          scale={0.95}
          mask="radial"
          parallax={10}
        />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-6 space-y-6 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  Notre vision
                </p>
              </Reveal>

              <SplitTextReveal
                as="h2"
                text="Créer ici. Imaginer sans frontières."
                className="type-h2 text-[#073D37] text-balance"
              />

              <Reveal delay={0.1} className="space-y-4 max-w-xl">
                <p className="type-intro text-[#1A1A1A]/85">
                  Nous croyons au potentiel du modern handcraft malgache : une approche où savoir-faire local, richesse culturelle et design contemporain se rencontrent.
                </p>
                <p className="type-body text-[#1A1A1A]/78">
                  Notre ambition est de développer à Madagascar des créations authentiques, porteuses d&apos;identité, d&apos;histoire et de sens, capables de rayonner à l&apos;international.
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="rounded-2xl overflow-hidden bg-white shadow-[0_18px_45px_rgba(7,61,55,0.08)]">
                  <MaskReveal direction="left">
                    <ImageWithFallback
                      src={pageContent.aboutAtelierImageUrl}
                      fallbackSrc={STUDIO_VISUALS.poleTextilesSouples}
                      alt="Savoir-faire local et matières malgaches chez 4EVER"
                      aspectClass="aspect-[4/3]"
                    />
                  </MaskReveal>
                </div>
              </Reveal>
            </div>

            {/* Five Core Concepts — Clean Hairline Rows */}
            <div className="lg:col-span-6 min-w-0">
              <StaggerGrid className="divide-y divide-[#073D37]/15 border-y border-[#073D37]/15">
                {VISION_PILLARS.map((pillar) => (
                  <StaggerItem key={pillar.label}>
                    <div className="group py-6 flex items-start gap-6">
                      <span className="font-display tabular-nums text-sm font-bold text-[#ED6F2C] pt-1 shrink-0">
                        {pillar.index}
                      </span>
                      <div className="min-w-0">
                        <h3 className="type-h3 text-[#073D37] group-hover:text-[#ED6F2C] transition-colors">
                          {pillar.label}
                        </h3>
                        <p className="type-body text-[#1A1A1A]/75 mt-1.5">
                          {pillar.detail}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NOTRE OBJECTIF & SIGNATURE FINALE */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-24 lg:py-32 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end pb-10 border-b border-[#073D37]/12">
            <div className="lg:col-span-7 space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  Notre objectif
                </p>
              </Reveal>
              <SplitTextReveal
                as="h2"
                text="Construire une création locale toujours plus ambitieuse."
                className="type-h2 text-[#073D37] text-balance"
              />
            </div>

            <Reveal delay={0.12} className="lg:col-span-5 space-y-3 min-w-0">
              <p className="type-body text-[#1A1A1A]/80">
                Notre objectif est de renforcer notre autonomie de conception et de fabrication, de développer de nouvelles gammes de produits et d&apos;améliorer continuellement nos techniques, nos processus et la qualité de nos finitions.
              </p>
              <p className="type-body text-[#1A1A1A]/75">
                Nous avançons avec une conviction : des créations locales peuvent allier originalité, exigence, compétitivité et valeur culturelle.
              </p>
            </Reveal>
          </div>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 items-start">
            {OBJECTIVE_AXES.map((axis) => (
              <StaggerItem key={axis.number} className="min-w-0">
                <div className="pt-5 border-t border-[#073D37]/15 space-y-2.5">
                  <span className="font-display tabular-nums text-xs font-bold tracking-[0.16em] text-[#ED6F2C]">
                    {axis.number}
                  </span>
                  <h3 className="font-display font-bold text-lg text-[#073D37] leading-snug">
                    {axis.title}
                  </h3>
                  <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">
                    {axis.detail}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>

          {/* Closing Deep Emerald Signature Banner */}
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-[#073D37] text-white p-8 sm:p-12 lg:p-16">
              <BrandPattern
                variant="monochrome-light"
                opacity={0.04}
                position="right-edge"
                scale={1.08}
                mask="fade-left"
                parallax={false}
              />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4 min-w-0">
                  <p className="type-kicker text-[#ED6F2C]">
                    4EVER — Modern Handcraft
                  </p>
                  <blockquote className="type-h2 text-white text-balance">
                    « Nous ne fabriquons pas simplement des objets. Nous créons des pièces qui racontent quelque chose. »
                  </blockquote>
                  <p className="text-sm text-[#E4DDD2]/80">
                    Showroom 4EVER — Ampandrana, Antananarivo · Atelier de création, personnalisation et fabrication sur mesure.
                  </p>
                </div>

                <div className="lg:col-span-4 flex flex-wrap lg:flex-col items-start lg:items-end gap-3 shrink-0">
                  <MagneticWrapper>
                    <Link
                      to="/poles"
                      className="font-display inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors whitespace-nowrap"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Découvrir nos 4 pôles</span>
                    </Link>
                  </MagneticWrapper>
                  <Link
                    to="/devis"
                    className="font-display inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[#E4DDD2]/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors whitespace-nowrap"
                  >
                    <Compass className="w-4 h-4 text-[#ED6F2C]" />
                    <span>Démarrer un projet</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
