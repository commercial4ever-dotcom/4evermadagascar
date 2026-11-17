import illusHeroAtelier from '../assets/images/illus_hero_atelier_1794900300464.jpg';
import illusPoleRigides from '../assets/images/illus_pole_rigides_1794900301471.jpg';
import illusPoleTextiles from '../assets/images/illus_pole_textiles_1794900302727.jpg';
import illusPoleGoodies from '../assets/images/illus_pole_goodies_1794900302011.jpg';
import illusPolePapeterie from '../assets/images/illus_pole_papeterie_1794900303340.jpg';
import illusStudioCraft from '../assets/images/illus_studio_craft_1794900303490.jpg';
import illusSignaletiquePlv from '../assets/images/illus_signaletique_plv_1794900322111.jpg';
import illusWeddingEvent from '../assets/images/illus_wedding_event_1794900322935.jpg';
import type { EditorialIllustrationVariant } from '../components/EditorialIllustrations.tsx';

/**
 * Legacy raster visual references retained on disk for backwards compatibility.
 * Public editorial visuals render monochrome black & white line-art via
 * EditorialIllustration until replaced by real uploaded photography in /admin.
 */
export const STUDIO_VISUALS = {
  heroStudioCraft: illusHeroAtelier,
  serviceDesignPao: illusStudioCraft,
  serviceCadeauxEntreprise: illusPoleGoodies,
  serviceTextileMarquage: illusPoleTextiles,
  serviceLaserGravure: illusPoleRigides,
  serviceSignaletiquePlv: illusSignaletiquePlv,
  serviceWeddingEvent: illusWeddingEvent,
  serviceStudioCreatif: illusStudioCraft,
  poleMatieresRigides: illusPoleRigides,
  poleTextilesSouples: illusPoleTextiles,
  poleGoodiesCoffrets: illusPoleGoodies,
  polePapeterieImpression: illusPolePapeterie,
};

export const POLE_DEFAULT_IMAGES: Record<string, string> = {
  'pole-matieres-rigides': illusPoleRigides,
  'pole-textiles-matieres-souples': illusPoleTextiles,
  'pole-goodies-objets-personnalises': illusPoleGoodies,
  'pole-papeterie-impression': illusPolePapeterie,
};

export const SERVICE_DEFAULT_IMAGES: Record<string, string> = {
  'design-graphique-pao': illusStudioCraft,
  'decoupe-gravure-laser': illusPoleRigides,
  'usinage-cnc-bois': illusPoleRigides,
  'impression-uv-dtf': illusPoleGoodies,
  'impression-dtf-textile': illusPoleTextiles,
  sublimation: illusPoleGoodies,
  'impression-sur-bois': illusPoleRigides,
  'couture-textile': illusPoleTextiles,
  'enseignes-signaletique': illusSignaletiquePlv,
  'packaging-coffrets': illusPolePapeterie,
  'creations-evenementielles': illusWeddingEvent,
};

/**
 * Monochrome B&W editorial line-art variant mapping for poles, studio stories, and all 11 techniques.
 */
export const VISUAL_KEY_TO_ILLUSTRATION: Record<
  keyof typeof STUDIO_VISUALS,
  EditorialIllustrationVariant
> = {
  heroStudioCraft: 'hero-atelier',
  serviceDesignPao: 'design-graphique-pao',
  serviceCadeauxEntreprise: 'pole-goodies-objets-personnalises',
  serviceTextileMarquage: 'impression-dtf-textile',
  serviceLaserGravure: 'decoupe-gravure-laser',
  serviceSignaletiquePlv: 'signaletique-plv',
  serviceWeddingEvent: 'wedding-event',
  serviceStudioCreatif: 'studio-craft',
  poleMatieresRigides: 'pole-matieres-rigides',
  poleTextilesSouples: 'pole-textiles-matieres-souples',
  poleGoodiesCoffrets: 'pole-goodies-objets-personnalises',
  polePapeterieImpression: 'pole-papeterie-impression',
};

export const POLE_ILLUSTRATIONS: Record<string, EditorialIllustrationVariant> = {
  'pole-matieres-rigides': 'pole-matieres-rigides',
  'pole-textiles-matieres-souples': 'pole-textiles-matieres-souples',
  'pole-goodies-objets-personnalises': 'pole-goodies-objets-personnalises',
  'pole-papeterie-impression': 'pole-papeterie-impression',
};

export const SERVICE_ILLUSTRATIONS: Record<string, EditorialIllustrationVariant> = {
  'design-graphique-pao': 'design-graphique-pao',
  'decoupe-gravure-laser': 'decoupe-gravure-laser',
  'usinage-cnc-bois': 'usinage-cnc-bois',
  'impression-uv-dtf': 'impression-uv-dtf',
  'impression-dtf-textile': 'impression-dtf-textile',
  sublimation: 'sublimation',
  'impression-sur-bois': 'impression-sur-bois',
  'couture-textile': 'couture-textile',
  'enseignes-signaletique': 'enseignes-signaletique',
  'packaging-coffrets': 'packaging-coffrets',
  'creations-evenementielles': 'creations-evenementielles',
};
