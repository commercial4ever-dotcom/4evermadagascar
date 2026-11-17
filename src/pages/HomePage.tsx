import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Plus,
  Wrench,
} from 'lucide-react';
import {
  FEATURED_SERVICE_POLES,
  type BootstrapData,
  type ProductItem,
} from '../types.ts';
import { VISUAL_KEY_TO_ILLUSTRATION } from '../data/visuals.ts';
import { EditorialIllustration, type EditorialIllustrationVariant } from '../components/EditorialIllustrations.tsx';
import { ImageWithFallback } from '../components/ImageWithFallback.tsx';
import { StudioBackdrop } from '../components/StudioBackdrop.tsx';
import { BrandPattern } from '../components/BrandPattern.tsx';
import { PolesSection } from '../components/PolesSection.tsx';
import { useQuoteSelection } from '../context/QuoteSelectionContext.tsx';
import {
  MagneticWrapper,
  MaskReveal,
  ParallaxVisual,
  Reveal,
  ScrollStoryProgress,
  SplitTextReveal,
  StaggerGrid,
  StaggerItem,
} from '../components/MotionPrimitives.tsx';

interface HomePageProps {
  data: BootstrapData;
  onOpenPdf: () => void;
}

const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PROCESS_TIMELINE = [
  {
    step: '01',
    title: 'Étude & conception',
    detail: 'Comprendre chaque projet, explorer les possibilités et concevoir une solution adaptée.',
  },
  {
    step: '02',
    title: 'Design & personnalisation',
    detail: 'Créer une identité visuelle distinctive ou adapter un objet à l’univers du destinataire.',
  },
  {
    step: '03',
    title: 'Choix des matières',
    detail: 'Associer esthétique, propriétés techniques et contraintes de fabrication.',
  },
  {
    step: '04',
    title: 'Fabrication',
    detail: 'Mettre en œuvre nos techniques : laser CO₂, CNC bois, DTF, UV-DTF, couture, assemblage.',
  },
  {
    step: '05',
    title: 'Finition & réalisation',
    detail: 'Soigner chaque détail pour livrer une création cohérente, durable et fidèle au projet.',
  },
];

const PRODUCT_UNIVERSES: Array<{
  title: string;
  subtitle: string;
  poleId: string;
  illustration: EditorialIllustrationVariant;
}> = [
  {
    title: 'Goodies & objets',
    subtitle: 'Objets publicitaires, stylos, gourdes, carnets et cadeaux d’affaires personnalisés.',
    poleId: 'goodies-objets-personnalises',
    illustration: 'pole-goodies-objets-personnalises',
  },
  {
    title: 'Textile & matières souples',
    subtitle: 'T-shirts, polos, tote bags, raphia, tsihy, broderie et impression DTF.',
    poleId: 'textiles-matieres-souples',
    illustration: 'pole-textiles-matieres-souples',
  },
  {
    title: 'Matières rigides & bois',
    subtitle: 'Objets décoratifs, enseignes, présentoirs PLV, bois et acrylique usinés.',
    poleId: 'matieres-rigides',
    illustration: 'pole-matieres-rigides',
  },
  {
    title: 'Papeterie & impression',
    subtitle: 'Cartes, brochures, invitations, packaging papier et carnets façonnés.',
    poleId: 'papeterie-impression',
    illustration: 'pole-papeterie-impression',
  },
  {
    title: 'Signalétique & PLV',
    subtitle: 'Enseignes, plaques directionnelles, displays comptoir et agencement.',
    poleId: 'matieres-rigides',
    illustration: 'signaletique-plv',
  },
  {
    title: 'Wedding & Event',
    subtitle: 'Papeterie fine, marque-places, cadeaux invités et décors événementiels.',
    poleId: 'papeterie-impression',
    illustration: 'wedding-event',
  },
];

const DIFFERENCE_ADVANTAGES = [
  {
    number: '01',
    icon: MapPin,
    title: 'Fabrication locale',
    description:
      'Production maîtrisée à Madagascar dans nos propres ateliers d’Antananarivo, offrant réactivité et autonomie face aux importations standardisées.',
  },
  {
    number: '02',
    icon: Compass,
    title: 'Création & personnalisation',
    description:
      'Nous imaginons des pièces originales à partir de matières premières comme nous valorisons des supports existants par le marquage et la gravure.',
  },
  {
    number: '03',
    icon: Layers,
    title: 'Diversité des matières',
    description:
      'Bois, raphia, tsihy, métal, papier créatif, verre, textile ou acrylique : un atelier pluridisciplinaire pensé pour dialoguer avec chaque support.',
  },
  {
    number: '04',
    icon: Palette,
    title: 'Accompagnement créatif',
    description:
      'De la conception graphique PAO à l’assemblage final, notre studio guide vos choix esthétiques et techniques pour une cohérence durable.',
  },
];

export function HomePage({ data, onOpenPdf }: HomePageProps) {
  const [activeServiceIdx, setActiveServiceIdx] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { addProduct } = useQuoteSelection();

  const activePole = FEATURED_SERVICE_POLES[activeServiceIdx] || FEATURED_SERVICE_POLES[0];
  const featuredProducts = data.products.filter((p) => p.featured).slice(0, 3);
  const displayProducts: ProductItem[] =
    featuredProducts.length > 0 ? featuredProducts : data.products.slice(0, 3);

  const handleQuickAdd = (product: ProductItem) => {
    addProduct(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((current) => (current === product.id ? null : current));
    }, 1600);
  };

  return (
    <div className="bg-[#073D37] text-[#E4DDD2]">
      {/* 1. HERO SECTION — Deep Emerald Brand Anchor + CRÉER & PERSONNALISER */}
      <section className="relative overflow-hidden bg-[#073D37] text-white">
        <StudioBackdrop variant="emerald" showPattern />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-14 sm:py-20 lg:py-24 space-y-14 lg:space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] gap-10 lg:gap-16 items-center">
            {/* Hero Copy */}
            <div className="space-y-6 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  4EVER — Modern Handcraft · Antananarivo
                </p>
              </Reveal>

              <SplitTextReveal
                as="h1"
                immediate
                text={data.settings.pageContent.heroTitle || 'Vos idées prennent forme chez 4EVER.'}
                className="type-hero text-[#E4DDD2] text-balance"
              />

              <Reveal delay={0.12}>
                <p className="type-intro text-[#E4DDD2]/90 max-w-2xl">
                  {data.settings.pageContent.heroSubtitle ||
                    'Création, personnalisation et fabrication sur mesure pour donner vie à vos projets.'}
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <MagneticWrapper>
                    <Link
                      to="/poles"
                      className="font-display group inline-flex items-center gap-2.5 px-7 py-4 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                    >
                      <span>Découvrir nos pôles</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </MagneticWrapper>

                  <MagneticWrapper>
                    <Link
                      to="/devis"
                      className="font-display group inline-flex items-center gap-2.5 px-7 py-4 rounded-lg border border-[#E4DDD2]/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors duration-200 whitespace-nowrap"
                    >
                      <span>Demander un devis</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </MagneticWrapper>
                </div>
              </Reveal>

              <Reveal delay={0.22}>
                <div className="pt-5 border-t border-[#E4DDD2]/15 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-[#E4DDD2]/75">
                  <span>Showroom Ampandrana, Antananarivo</span>
                  <span aria-hidden="true" className="text-[#E4DDD2]/30">/</span>
                  <button
                    type="button"
                    onClick={onOpenPdf}
                    className="font-display inline-flex items-center gap-2 font-semibold text-white hover:text-[#ED6F2C] transition-colors duration-200 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-[#ED6F2C]" />
                    <span>Consulter le Catalogue 2027</span>
                  </button>
                </div>
              </Reveal>
            </div>

            {/* Hero Contemporary Monochrome Line-Art Illustration */}
            <div className="min-w-0">
              <div className="rounded-2xl overflow-hidden border border-[#E4DDD2]/18 bg-[#052E29] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.45)]">
                <MaskReveal direction="bottom" className="w-full h-full">
                  <ParallaxVisual offset={10} className="w-full">
                    <EditorialIllustration
                      variant="hero-atelier"
                      tone="dark"
                      aspectClass="aspect-[4/3]"
                      label="Illustration éditoriale monochrome de l’atelier 4EVER Madagascar"
                    />
                  </ParallaxVisual>
                </MaskReveal>
              </div>
            </div>
          </div>

          {/* Open Editorial Dual Positioning: CRÉER & PERSONNALISER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 pt-8 border-t border-[#E4DDD2]/20">
            <Reveal delay={0.08}>
              <div className="space-y-3 min-w-0">
                <p className="font-display tabular-nums text-xs font-bold tracking-[0.18em] uppercase text-[#ED6F2C]">
                  01 / CRÉER
                </p>
                <h2 className="type-h3 text-white">
                  Concevoir à partir de la matière
                </h2>
                <p className="type-body text-[#E4DDD2]/82 max-w-xl">
                  Imaginer, concevoir et fabriquer des produits originaux, authentiques et sur mesure, à partir de matières premières ou de composants.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="space-y-3 min-w-0 md:border-l md:border-[#E4DDD2]/15 md:pl-10 lg:pl-14">
                <p className="font-display tabular-nums text-xs font-bold tracking-[0.18em] uppercase text-[#ED6F2C]">
                  02 / PERSONNALISER
                </p>
                <h2 className="type-h3 text-white">
                  Transformer et valoriser l&apos;existant
                </h2>
                <p className="type-body text-[#E4DDD2]/82 max-w-xl">
                  Transformer et valoriser des objets ou supports existants par le design, l&apos;impression, la gravure, le marquage et les finitions.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2. MAJOR SECTION: "03 / NOS PÔLES" — Deep Nuanced Emerald */}
      <PolesSection settings={data.settings} mode="home" />

      {/* 3. SECTION "QUI SOMMES-NOUS" — Deep Emerald */}
      <section className="relative overflow-hidden bg-[#052E29] text-white border-b border-[#E4DDD2]/12">
        <StudioBackdrop variant="emerald-deep" />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24 space-y-12 lg:space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 lg:gap-16 items-end pb-8 border-b border-[#E4DDD2]/15">
            <div className="space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  01 / À PROPOS
                </p>
              </Reveal>
              <SplitTextReveal
                as="h2"
                text="Qui sommes-nous ?"
                className="type-h2 text-[#E4DDD2] max-w-[14ch]"
              />
            </div>

            <Reveal delay={0.1} className="space-y-3 min-w-0">
              <p className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
                Nous donnons forme aux idées. Nous créons des objets qui ont du sens.
              </p>
              <p className="type-intro text-[#E4DDD2]/85">
                4EVER Madagascar est un atelier de création, de personnalisation et de fabrication sur mesure à Antananarivo.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)] gap-10 lg:gap-16 items-center">
            <div className="min-w-0">
              <MaskReveal
                direction="bottom"
                className="rounded-2xl border border-[#E4DDD2]/16 bg-[#042521] shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
              >
                <ImageWithFallback
                  src={data.settings.pageContent.aboutTeamImageUrl}
                  editorialVariant="studio-craft"
                  tone="dark"
                  alt="Atelier créatif 4EVER Madagascar"
                  aspectClass="aspect-[4/3]"
                />
              </MaskReveal>
            </div>

            <div className="space-y-6 min-w-0">
              <Reveal delay={0.1} className="space-y-4 max-w-2xl">
                <p className="type-intro text-[#E4DDD2]/90">
                  Nous associons design, savoir-faire artisanal et technologies de production pour réaliser des objets, des supports et des expériences uniques.
                </p>
                <p className="type-body text-[#E4DDD2]/80">
                  Du simple marquage à la conception d&apos;une pièce entièrement originale, nous accompagnons particuliers, entreprises et marques à chaque étape de leur projet.
                </p>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#E4DDD2]/15">
                  <div>
                    <p className="font-display font-bold text-sm text-white">Identité &amp; Culture</p>
                    <p className="text-xs sm:text-sm text-[#E4DDD2]/75 mt-1.5 leading-relaxed">
                      Un modern handcraft malgache ancré et contemporain.
                    </p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-white">Création locale</p>
                    <p className="text-xs sm:text-sm text-[#E4DDD2]/75 mt-1.5 leading-relaxed">
                      Fabrication maîtrisée dans nos ateliers à Antananarivo.
                    </p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-white">Finitions durables</p>
                    <p className="text-xs sm:text-sm text-[#E4DDD2]/75 mt-1.5 leading-relaxed">
                      Exigence élevée sur chaque matière et assemblage.
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.18} className="pt-1">
                <MagneticWrapper>
                  <Link
                    to="/a-propos"
                    className="font-display group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                  >
                    <span>Découvrir notre vision et notre méthode</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </MagneticWrapper>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION "NOS TECHNIQUES" — Deep Emerald Dominance */}
      <section className="relative overflow-hidden bg-[#073D37] text-white border-b border-[#E4DDD2]/12">
        <StudioBackdrop variant="emerald" />
        <BrandPattern
          variant="monochrome-light"
          opacity={0.025}
          position="top-right"
          scale={0.9}
          mask="radial"
        />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24 space-y-10 lg:space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_auto] gap-8 lg:gap-12 items-end pb-8 border-b border-[#E4DDD2]/15">
            <div className="space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  SAVOIR-FAIRE TECHNIQUES
                </p>
              </Reveal>
              <SplitTextReveal
                as="h2"
                text="Nos techniques d’atelier."
                className="type-h2 text-[#E4DDD2] max-w-[16ch]"
              />
              <Reveal delay={0.08}>
                <p className="type-intro text-[#E4DDD2]/85 max-w-xl">
                  Onze techniques d&apos;atelier transversales au service de chaque pôle de production.
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="shrink-0">
              <Link
                to="/services"
                className="font-display group inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[#E4DDD2]/30 text-sm font-semibold text-white hover:bg-[#ED6F2C] hover:border-[#ED6F2C] transition-colors duration-200 whitespace-nowrap"
              >
                <span>Explorer nos 11 techniques</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          {/* Interactive Service Tabs */}
          <Reveal>
            <div className="space-y-8">
              <div
                className="flex flex-wrap gap-x-6 gap-y-3 border-b border-[#E4DDD2]/15 pb-3"
                role="tablist"
                aria-label="Services techniques 4EVER"
              >
                {FEATURED_SERVICE_POLES.map((pole, idx) => {
                  const active = idx === activeServiceIdx;
                  return (
                    <button
                      key={pole.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveServiceIdx(idx)}
                      className={`font-display relative pb-3 text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                        active
                          ? 'text-white'
                          : 'text-[#E4DDD2]/60 hover:text-white'
                      }`}
                    >
                      <span className="tabular-nums mr-1.5 text-[#ED6F2C]">{pole.number}</span>
                      {pole.title}
                      {active && (
                        <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#ED6F2C]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePole.id}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: EASE_SMOOTH }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
                >
                  <div className="lg:col-span-6 min-w-0 rounded-2xl overflow-hidden border border-[#E4DDD2]/16 bg-[#052E29]">
                    <EditorialIllustration
                      variant={VISUAL_KEY_TO_ILLUSTRATION[activePole.visualKey]}
                      tone="dark"
                      aspectClass="aspect-[4/3]"
                      label={activePole.title}
                    />
                  </div>

                  <div className="lg:col-span-6 min-w-0 space-y-5">
                    <div className="font-display flex items-center gap-2 text-xs font-bold text-[#ED6F2C]">
                      <span className="tabular-nums">{activePole.number}</span>
                      <span aria-hidden="true">/</span>
                      <span className="uppercase tracking-[0.16em]">Savoir-faire technique</span>
                    </div>
                    <h3 className="type-h3 text-white">
                      {activePole.title}
                    </h3>
                    <p className="type-body text-[#E4DDD2]/82 max-w-xl">
                      {activePole.summary}
                    </p>

                    <div className="space-y-2.5 pt-2">
                      <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#E4DDD2]/70">
                        Applications principales
                      </p>
                      <ul className="space-y-2">
                        {activePole.applications.map((app) => (
                          <li
                            key={app}
                            className="flex items-center gap-2.5 text-sm text-[#E4DDD2]/88"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ED6F2C] shrink-0" />
                            <span>{app}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 flex flex-wrap gap-3">
                      <Link
                        to={`/devis?service=${encodeURIComponent(activePole.title)}`}
                        className="font-display group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#ED6F2C] text-white text-xs sm:text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                      >
                        <span>Demander un devis</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Link>
                      <Link
                        to={`/services#${activePole.targetHash}`}
                        className="font-display inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#E4DDD2]/25 text-[#E4DDD2] text-xs sm:text-sm font-semibold hover:bg-white/10 transition-colors duration-200 whitespace-nowrap"
                      >
                        <span>Détails techniques</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. SECTION "POURQUOI CHOISIR 4EVER" — Nuanced Tonal Emerald */}
      <section className="relative overflow-hidden bg-[#063631] text-white border-b border-[#E4DDD2]/12">
        <StudioBackdrop variant="emerald-mid" />
        <BrandPattern
          variant="monochrome-light"
          opacity={0.03}
          position="bottom-left"
          scale={0.95}
          mask="radial"
        />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24 space-y-12 lg:space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 lg:gap-16 items-end pb-8 border-b border-[#E4DDD2]/15">
            <div className="space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  04 / NOTRE DIFFÉRENCE
                </p>
              </Reveal>
              <SplitTextReveal
                as="h2"
                text="Pourquoi choisir 4EVER ?"
                className="type-h2 text-[#E4DDD2] max-w-[14ch]"
              />
            </div>

            <Reveal delay={0.1} className="space-y-4 min-w-0">
              <p className="font-display font-bold text-lg sm:text-xl text-white">
                Plus qu’un atelier, un partenaire créatif.
              </p>
              <p className="type-intro text-[#E4DDD2]/85">
                Nous réunissons création, personnalisation et fabrication pour donner vie à vos projets, de l&apos;idée initiale à la réalisation finale.
              </p>
              <Link
                to="/realisations"
                className="font-display group inline-flex items-center gap-2 text-sm font-semibold text-[#ED6F2C] hover:text-white transition-colors duration-200"
              >
                <span>Découvrir nos réalisations</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-x-14 lg:gap-x-20 gap-y-10">
            {DIFFERENCE_ADVANTAGES.map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.title} className="min-w-0">
                  <div className="group pt-6 border-t border-[#E4DDD2]/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display tabular-nums text-xs font-bold tracking-[0.18em] text-[#ED6F2C]">
                        {item.number}
                      </span>
                      <Icon
                        className="w-5 h-5 text-[#E4DDD2]/65 group-hover:text-[#ED6F2C] transition-colors duration-200"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3 className="type-h3 text-white group-hover:text-[#ED6F2C] transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="type-body text-[#E4DDD2]/80 max-w-lg">
                      {item.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGrid>

          <Reveal delay={0.12}>
            <div className="pt-6 border-t border-[#E4DDD2]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-[#E4DDD2]/82">
                <strong className="font-display font-semibold text-white">Showroom Ampandrana, Antananarivo</strong>
                {' — '}
                Venez découvrir nos matières, échantillons et finitions directement sur place.
              </p>
              <Link
                to="/contact"
                className="font-display group inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-white hover:text-[#ED6F2C] whitespace-nowrap transition-colors duration-200"
              >
                <span>Planifier une visite</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. SECTION "CE QUE NOUS FAISONS" — Intentional 20% Beige Breathing Contrast */}
      <section className="relative overflow-hidden text-[#1A1A1A] border-b border-[#073D37]/12">
        <StudioBackdrop variant="sand" />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 lg:gap-16 items-end pb-8 border-b border-[#073D37]/15">
            <div className="space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  02 / NOTRE SAVOIR-FAIRE
                </p>
              </Reveal>
              <SplitTextReveal
                as="h2"
                text="Ce que nous faisons."
                className="type-h2 text-[#073D37] max-w-[14ch]"
              />
            </div>
            <Reveal delay={0.1} className="space-y-3 min-w-0">
              <p className="font-display font-bold text-lg sm:text-xl text-[#073D37]">
                De l’idée à la matière. De la matière à la création.
              </p>
              <p className="type-intro text-[#1A1A1A]/82">
                Un processus structuré en cinq étapes pour garantir justesse créative, qualité matière et finitions durables.
              </p>
            </Reveal>
          </div>

          <div className="space-y-8">
            <div className="hidden lg:block">
              <ScrollStoryProgress orientation="horizontal" />
            </div>

            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 items-start">
              {PROCESS_TIMELINE.map((item) => (
                <StaggerItem key={item.step} className="min-w-0">
                  <div className="pt-5 border-t border-[#073D37]/20 space-y-3">
                    <span className="font-display tabular-nums block text-2xl font-extrabold text-[#ED6F2C]">
                      {item.step}
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#073D37] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#1A1A1A]/78 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </div>
      </section>

      {/* 7. SECTION "CATALOGUE / UNIVERS PRODUITS" — Deep Emerald + Monochrome Illustrations */}
      <section className="relative overflow-hidden bg-[#073D37] text-white border-b border-[#E4DDD2]/12">
        <StudioBackdrop variant="emerald" />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_auto] gap-8 lg:gap-12 items-end pb-8 border-b border-[#E4DDD2]/15">
            <div className="space-y-4 min-w-0">
              <Reveal>
                <p className="type-kicker text-[#ED6F2C]">
                  Catalogue &amp; univers produits
                </p>
              </Reveal>
              <SplitTextReveal
                as="h2"
                text="Explorez nos collections personnalisables."
                className="type-h2 text-[#E4DDD2] max-w-[18ch]"
              />
            </div>

            <Reveal delay={0.1} className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={onOpenPdf}
                className="font-display inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-[#E4DDD2]/25 text-[#E4DDD2] text-xs sm:text-sm font-semibold hover:bg-white/10 transition-colors duration-200 cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-[#ED6F2C]" />
                <span>Catalogue PDF 2027</span>
              </button>
              <Link
                to="/catalogue"
                className="font-display group inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-xs sm:text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
              >
                <span>Ouvrir le catalogue</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 items-stretch">
            {PRODUCT_UNIVERSES.map((universe) => (
              <StaggerItem key={universe.title} className="min-w-0">
                <Link
                  to={`/catalogue?pole=${encodeURIComponent(universe.poleId)}`}
                  className="group flex flex-col justify-between h-full pb-6 border-b border-[#E4DDD2]/16 hover:border-[#ED6F2C] transition-colors duration-200"
                >
                  <div>
                    <div className="rounded-xl overflow-hidden border border-[#E4DDD2]/14 bg-[#052E29] mb-5">
                      <EditorialIllustration
                        variant={universe.illustration}
                        tone="dark"
                        aspectClass="aspect-[4/3]"
                        label={universe.title}
                        className="transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="type-h3 text-white group-hover:text-[#ED6F2C] transition-colors duration-200">
                          {universe.title}
                        </h3>
                        <p className="type-body text-[#E4DDD2]/78 mt-2">
                          {universe.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#E4DDD2]/55 group-hover:text-[#ED6F2C] group-hover:translate-x-1 transition-all duration-200 shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGrid>

          {displayProducts.length > 0 && (
            <div className="pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="type-h3 text-[#E4DDD2]">
                  Sélection du Catalogue 2027
                </h3>
                <Link
                  to="/catalogue"
                  className="font-display text-xs sm:text-sm font-bold text-[#ED6F2C] hover:underline"
                >
                  Voir tous les articles →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displayProducts.map((product) => (
                  <article
                    key={product.id}
                    className="bg-[#052E29] rounded-xl border border-[#E4DDD2]/15 overflow-hidden flex flex-col hover:border-[#ED6F2C]/45 transition-colors duration-200"
                  >
                    <Link to={`/catalogue/${product.id}`}>
                      <ImageWithFallback
                        src={product.imageUrl}
                        editorialVariant="pole-goodies-objets-personnalises"
                        tone="dark"
                        alt={product.name}
                      />
                    </Link>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-display tabular-nums text-xs text-[#E4DDD2]/65 font-semibold">
                          Réf. {product.code} · {product.category}
                        </p>
                        <Link to={`/catalogue/${product.id}`}>
                          <h4 className="font-display font-bold text-base text-white mt-1 hover:text-[#ED6F2C] transition-colors duration-200">
                            {product.name}
                          </h4>
                        </Link>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E4DDD2]/12 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#E4DDD2]">
                          {product.priceLabel || 'Prix sur devis'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          className="font-display inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#ED6F2C] text-white text-xs font-semibold hover:bg-[#d85f1f] transition-colors duration-200 cursor-pointer"
                        >
                          {addedProductId === product.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Ajouté</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Ajouter</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 8. SECTION "DEMANDE DE DEVIS" — Deep Emerald CTA Band */}
      <section className="relative overflow-hidden bg-[#052E29] text-white">
        <StudioBackdrop variant="emerald-deep" />
        <BrandPattern
          variant="multicolor"
          opacity={0.045}
          position="top-right"
          scale={0.85}
          mask="radial"
        />

        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 lg:py-24">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)] gap-10 lg:gap-16 items-center">
              <div className="space-y-6 min-w-0">
                <p className="type-kicker text-[#ED6F2C]">
                  Votre projet sur mesure
                </p>
                <h2 className="type-h2 text-[#E4DDD2] max-w-[16ch]">
                  Un projet en tête ?<br />Parlons-en.
                </h2>
                <p className="type-intro text-[#E4DDD2]/85 max-w-xl">
                  Transmettez-nous vos idées, quantités, matières souhaitées ou fichiers visuels. Notre équipe commerciale étudie votre demande rapidement depuis notre atelier d&apos;Antananarivo.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <MagneticWrapper>
                    <Link
                      to="/devis"
                      className="font-display group inline-flex items-center gap-2.5 px-7 py-4 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors duration-200 whitespace-nowrap"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Obtenir un devis</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </MagneticWrapper>

                  <a
                    href="https://wa.me/261383266411"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display inline-flex items-center gap-2 px-6 py-4 rounded-lg border border-[#E4DDD2]/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors duration-200 whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 text-[#ED6F2C]" />
                    <span>WhatsApp · 038 32 664 11</span>
                  </a>
                </div>
              </div>

              <div className="lg:border-l lg:border-[#E4DDD2]/20 lg:pl-12 space-y-4 min-w-0">
                <p className="font-display font-bold text-lg text-white">
                  Contact direct 4EVER Madagascar
                </p>
                <div className="space-y-3.5 text-sm sm:text-base text-[#E4DDD2]/85">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#ED6F2C] shrink-0 mt-1" />
                    <span>Showroom 4EVER — Ampandrana, Antananarivo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-[#ED6F2C] shrink-0" />
                    <a href="tel:+261383266411" className="tabular-nums font-medium hover:text-[#ED6F2C] transition-colors duration-200">
                      038 32 664 11
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#ED6F2C] shrink-0" />
                    <a href="mailto:commercial4ever@gmail.com" className="hover:text-[#ED6F2C] break-all transition-colors duration-200">
                      commercial4ever@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
