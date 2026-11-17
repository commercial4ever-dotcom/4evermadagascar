import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { useQuoteSelection } from '../context/QuoteSelectionContext.tsx';
import { BrandPattern } from './BrandPattern.tsx';
import { SocialLinks } from './SocialLinks.tsx';
import type { SiteSettings } from '../types.ts';

interface LayoutProps {
  children: ReactNode;
  settings: SiteSettings;
}

const NAV_ITEMS = [
  { to: '/', label: 'Accueil' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/poles', label: 'Nos pôles' },
  { to: '/services', label: 'Nos services' },
  { to: '/catalogue', label: 'Catalogue' },
  { to: '/realisations', label: 'Réalisations' },
  { to: '/contact', label: 'Contact' },
];

export function Layout({ children, settings }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalQuantity, openDrawer } = useQuoteSelection();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1A1A1A]">
      {/* Sticky Single-Row Top Bar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-[#073D37]/12 shadow-[0_8px_30px_rgba(7,61,55,0.06)]'
            : 'bg-white/95 backdrop-blur-sm border-b border-[#073D37]/8'
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 h-16 md:h-[78px] flex items-center justify-between gap-3 lg:gap-6">
          {/* Brand Logo */}
          <Link
            to="/"
            className="shrink-0 flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ED6F2C] rounded"
            aria-label="4EVER Madagascar — Accueil"
          >
            <img
              src="/assets/aistudio/Logo-vert-2_472352d2.png"
              alt="4EVER modern handcraft"
              className="h-8 md:h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation (Montserrat) */}
          <nav className="hidden xl:flex items-center gap-7 font-display" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative text-[13px] tracking-[0.02em] whitespace-nowrap shrink-0 py-1.5 transition-colors duration-150 ${
                    isActive
                      ? 'text-[#073D37] font-bold'
                      : 'text-[#1A1A1A]/75 font-medium hover:text-[#073D37]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    <span
                      className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-[#ED6F2C] transition-transform duration-200 origin-left ${
                        isActive ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Compact Desktop Nav for 1024px–1279px */}
          <nav className="hidden lg:flex xl:hidden items-center gap-4 font-display" aria-label="Navigation principale">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative text-xs tracking-wide whitespace-nowrap shrink-0 py-1.5 transition-colors duration-150 ${
                    isActive
                      ? 'text-[#073D37] font-bold'
                      : 'text-[#1A1A1A]/75 font-medium hover:text-[#073D37]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    <span
                      className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-[#ED6F2C] transition-transform duration-200 origin-left ${
                        isActive ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Selection Drawer & CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={openDrawer}
              className="font-display inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#073D37]/15 text-[#073D37] hover:bg-[#E4DDD2]/45 transition-all duration-150 text-xs sm:text-[13px] font-semibold whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer"
              aria-label={`Ouvrir ma sélection de devis (${totalQuantity} articles)`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Ma sélection</span>
              <span className="tabular-nums font-bold text-[#ED6F2C]">
                ({totalQuantity})
              </span>
            </button>

            <Link
              to="/devis"
              className="font-display group hidden sm:inline-flex items-center gap-1.5 px-4 xl:px-5 py-2.5 rounded-lg bg-[#ED6F2C] text-white text-xs xl:text-[13px] font-semibold hover:bg-[#d85f1f] shadow-sm transition-all duration-200 whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <span>Demander un devis</span>
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#073D37]/15 text-[#073D37] hover:bg-[#E4DDD2]/40 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-[#073D37]/10 px-5 py-5 space-y-1.5">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `font-display block px-3.5 py-3 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#073D37] text-white'
                      : 'text-[#1A1A1A] hover:bg-[#E4DDD2]/45'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-3">
              <Link
                to="/devis"
                onClick={() => setMobileMenuOpen(false)}
                className="font-display block w-full text-center px-4 py-3.5 rounded-lg bg-[#ED6F2C] text-white text-sm font-semibold hover:bg-[#d85f1f] transition-colors"
              >
                Demander un devis
              </Link>
            </div>

            <div className="pt-4 mt-3 border-t border-[#073D37]/10 flex items-center justify-between gap-4">
              <span className="text-xs text-[#1A1A1A]/65">Suivez 4EVER</span>
              <SocialLinks socialLinks={settings.socialLinks} tone="dark" size="sm" />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Editorial Deep Green Footer */}
      <footer className="relative overflow-hidden bg-[#073D37] text-[#E4DDD2] border-t border-[#E4DDD2]/10">
        <BrandPattern
          variant="monochrome-light"
          opacity={0.035}
          position="right-edge"
          scale={1.15}
          mask="fade-left"
          parallax={false}
        />
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-5">
              <img
                src="/assets/aistudio/Logo-beige-2_6856e0b4.png"
                alt="4EVER modern handcraft"
                className="h-10 w-auto object-contain"
              />
              <p className="text-sm text-[#E4DDD2]/85 leading-relaxed max-w-sm">
                4EVER — Modern Handcraft. Atelier de création, personnalisation, impression et fabrication sur mesure à Antananarivo pour entreprises et particuliers.
              </p>
              <div className="pt-1 flex items-center gap-4">
                <img
                  src="/assets/aistudio/Logo-secondaire1_30a71dac.png"
                  alt="Sceau 4EVER modern handcraft"
                  className="h-14 w-14 object-contain opacity-90"
                />
                <span className="font-display text-xs tracking-[0.18em] uppercase text-[#E4DDD2]/70 font-semibold">
                  Antananarivo · Madagascar
                </span>
              </div>
            </div>

            {/* Navigation Column */}
            <div className="lg:col-span-2">
              <h2 className="font-display font-bold text-white text-xs uppercase tracking-[0.18em] mb-5">
                Navigation
              </h2>
              <ul className="space-y-2.5 text-sm">
                {NAV_ITEMS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-[#E4DDD2]/80 hover:text-[#ED6F2C] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/devis" className="font-display text-[#ED6F2C] font-semibold hover:underline">
                    Demander un devis
                  </Link>
                </li>
              </ul>
            </div>

            {/* Pôles & Services Column */}
            <div className="lg:col-span-3">
              <h2 className="font-display font-bold text-white text-xs uppercase tracking-[0.18em] mb-5">
                Nos pôles &amp; services
              </h2>
              <ul className="space-y-2.5 text-sm text-[#E4DDD2]/80">
                <li>
                  <Link to="/poles?pole=matieres-rigides" className="hover:text-[#ED6F2C] transition-colors">
                    01. Matières rigides
                  </Link>
                </li>
                <li>
                  <Link to="/poles?pole=textiles-matieres-souples" className="hover:text-[#ED6F2C] transition-colors">
                    02. Textiles &amp; matières souples
                  </Link>
                </li>
                <li>
                  <Link to="/poles?pole=goodies-objets-personnalises" className="hover:text-[#ED6F2C] transition-colors">
                    03. Goodies &amp; objets personnalisés
                  </Link>
                </li>
                <li>
                  <Link to="/poles?pole=papeterie-impression" className="hover:text-[#ED6F2C] transition-colors">
                    04. Papeterie &amp; impression
                  </Link>
                </li>
                <li className="pt-2 border-t border-[#E4DDD2]/15">
                  <Link to="/services" className="font-display text-white font-semibold hover:text-[#ED6F2C] transition-colors">
                    Voir nos 12 techniques →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coordinates & Social Column */}
            <div className="lg:col-span-3 space-y-4">
              <h2 className="font-display font-bold text-white text-xs uppercase tracking-[0.18em] mb-5">
                Showroom &amp; Contact
              </h2>
              <div className="flex items-start gap-2.5 text-sm text-[#E4DDD2]/90">
                <MapPin className="w-4 h-4 text-[#ED6F2C] shrink-0 mt-1" />
                <span>Showroom 4EVER — Ampandrana, Antananarivo, Madagascar</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-[#ED6F2C] shrink-0" />
                <a
                  href="tel:+261383266411"
                  className="text-[#E4DDD2]/90 hover:text-[#ED6F2C] tabular-nums font-medium transition-colors"
                >
                  038 32 664 11
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 text-[#ED6F2C] shrink-0" />
                <a
                  href="mailto:commercial4ever@gmail.com"
                  className="text-[#E4DDD2]/90 hover:text-[#ED6F2C] break-all transition-colors"
                >
                  commercial4ever@gmail.com
                </a>
              </div>

              <div className="pt-3 border-t border-[#E4DDD2]/15 space-y-2.5">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[#E4DDD2]/70">
                  Suivez 4EVER
                </p>
                <SocialLinks socialLinks={settings.socialLinks} tone="light" size="md" />
              </div>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-[#E4DDD2]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E4DDD2]/70">
            <p>© {new Date().getFullYear()} 4EVER Madagascar — modern handcraft. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <Link to="/mentions-legales" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link to="/politique-confidentialite" className="hover:text-white transition-colors">
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
