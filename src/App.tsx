import { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { QuoteSelectionProvider } from './context/QuoteSelectionContext.tsx';
import { Layout } from './components/Layout.tsx';
import { QuoteDrawer } from './components/QuoteDrawer.tsx';
import { PdfCatalogueModal } from './components/PdfCatalogueModal.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { PolesPage } from './pages/PolesPage.tsx';
import { ServicesPage } from './pages/ServicesPage.tsx';
import { CataloguePage } from './pages/CataloguePage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { RealisationsPage } from './pages/RealisationsPage.tsx';
import { QuotePage } from './pages/QuotePage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { LegalPage } from './pages/LegalPage.tsx';
import type { BootstrapData } from './types.ts';

const DEFAULT_BOOTSTRAP: BootstrapData = {
  categories: [
    { id: 'cat-bureau', name: 'Bureau et papeterie', slug: 'bureau-et-papeterie', subcategories: [] },
    { id: 'cat-goodies', name: 'Goodies et objets publicitaires', slug: 'goodies-et-objets-publicitaires', subcategories: [] },
    { id: 'cat-textiles', name: 'Textiles et accessoires', slug: 'textiles-et-accessoires', subcategories: [] },
    { id: 'cat-boissons', name: 'Mugs, gourdes et boissons', slug: 'mugs-gourdes-et-boissons', subcategories: [] },
    { id: 'cat-sacs', name: 'Sacs et maroquinerie', slug: 'sacs-et-maroquinerie', subcategories: [] },
    { id: 'cat-coffrets', name: 'Coffrets cadeaux', slug: 'coffrets-cadeaux', subcategories: [] },
    { id: 'cat-packaging', name: 'Packaging et boîtes', slug: 'packaging-et-boites', subcategories: [] },
    { id: 'cat-bois', name: 'Objets en bois', slug: 'objets-en-bois', subcategories: [] },
    { id: 'cat-deco', name: 'Décoration et événements', slug: 'decoration-et-evenements', subcategories: [] },
    { id: 'cat-signaletique', name: 'Signalétique et PLV', slug: 'signaletique-et-plv', subcategories: [] },
    { id: 'cat-autres', name: 'Autres créations', slug: 'autres-creations', subcategories: [] },
  ],
  realisationCategories: [
    'Enseignes et signalétique',
    "Personnalisation d'objets",
    'Coffrets et packaging',
    'Créations en bois',
    'Textile',
    'Événementiel',
    'Impression et communication visuelle',
  ],
  products: [],
  realisations: [],
  settings: {
    cataloguePdfUrl: '',
    cataloguePdfName: '',
    cataloguePdfUpdatedAt: '',
    socialLinks: { facebook: '', instagram: '', linkedin: '', tiktok: '' },
    pageContent: {
      heroTitle: 'Vos idées prennent forme chez 4EVER.',
      heroSubtitle:
        '« Création, personnalisation et fabrication sur mesure pour donner vie à vos projets. »',
      aboutIntro:
        "4EVER Madagascar est une marque de création, personnalisation et production installée à Antananarivo qui transforme les idées en objets uniques. Nous accompagnons particuliers, entreprises et marques dans la création d'univers visuels, d'objets personnalisés et de pièces décoratives et mobiliers design.",
      aboutAtelier:
        "Notre atelier à Antananarivo réunit des équipements de découpe et gravure laser CO₂, d'usinage CNC sur bois, d'impression UV-DTF, DTF textile, sublimation, confection textile et fabrication d'enseignes.",
      aboutTeamNote:
        "Emplacement prévu pour la photographie officielle de l'équipe 4EVER Madagascar.",
      aboutTeamImageUrl: '',
      aboutAtelierImageUrl: '',
      aboutPartnersNote:
        'Emplacement prévu pour les logos des clients et partenaires autorisés.',
      serviceImages: {},
    },
  },
  smtpConfigured: false,
};

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const [data, setData] = useState<BootstrapData>(DEFAULT_BOOTSTRAP);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  const loadBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/public/bootstrap');
      if (res.ok) {
        const json = (await res.json()) as BootstrapData;
        setData(json);
      }
    } catch {
      // Keep default structure if API unreachable during static preview
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    const handler = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  return (
    <QuoteSelectionProvider>
      <ScrollToTop />

      {/* Google Maps Platform Case A Quota Defense Banner */}
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Layout settings={data.settings}>
        <Routes>
          <Route
            path="/"
            element={<HomePage data={data} onOpenPdf={() => setPdfOpen(true)} />}
          />
          <Route path="/a-propos" element={<AboutPage settings={data.settings} />} />
          <Route path="/poles" element={<PolesPage settings={data.settings} />} />
          <Route path="/nos-poles" element={<PolesPage settings={data.settings} />} />
          <Route path="/services" element={<ServicesPage settings={data.settings} />} />
          <Route
            path="/catalogue"
            element={<CataloguePage data={data} onOpenPdf={() => setPdfOpen(true)} />}
          />
          <Route
            path="/catalogue/:id"
            element={<ProductDetailPage products={data.products} />}
          />
          <Route path="/realisations" element={<RealisationsPage data={data} />} />
          <Route path="/devis" element={<QuotePage data={data} />} />
          <Route path="/contact" element={<ContactPage settings={data.settings} />} />
          <Route path="/mentions-legales" element={<LegalPage mode="mentions" />} />
          <Route path="/politique-confidentialite" element={<LegalPage mode="privacy" />} />
          <Route
            path="/admin"
            element={<AdminPage onPublicDataChanged={loadBootstrap} />}
          />
          <Route
            path="*"
            element={<HomePage data={data} onOpenPdf={() => setPdfOpen(true)} />}
          />
        </Routes>
      </Layout>

      <QuoteDrawer />
      <PdfCatalogueModal
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        pdfUrl={data.settings.cataloguePdfUrl}
        pdfName={data.settings.cataloguePdfName}
      />
    </QuoteSelectionProvider>
  );
}
