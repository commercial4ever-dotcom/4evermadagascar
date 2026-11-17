import illusHeroAtelier from '../assets/images/illus_hero_atelier_1794900300464.jpg';
import illusPoleRigides from '../assets/images/illus_pole_rigides_1794900301471.jpg';
import illusPoleTextiles from '../assets/images/illus_pole_textiles_1794900302727.jpg';
import illusPoleGoodies from '../assets/images/illus_pole_goodies_1794900302011.jpg';
import illusPolePapeterie from '../assets/images/illus_pole_papeterie_1794900303340.jpg';
import illusStudioCraft from '../assets/images/illus_studio_craft_1794900303490.jpg';
import illusSignaletiquePlv from '../assets/images/illus_signaletique_plv_1794900322111.jpg';
import illusWeddingEvent from '../assets/images/illus_wedding_event_1794900322935.jpg';

/**
 * Contemporary editorial drawn illustrations for 4EVER Madagascar.
 * Automatically acts as default visual layer until replaced by official
 * photography uploaded through /admin.
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
  'photographie-video': illusStudioCraft,
  'creations-evenementielles': illusWeddingEvent,
};
