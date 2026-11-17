import type { CSSProperties } from 'react';

export type EditorialIllustrationVariant =
  | 'hero-atelier'
  | 'studio-craft'
  | 'pole-matieres-rigides'
  | 'pole-textiles-matieres-souples'
  | 'pole-goodies-objets-personnalises'
  | 'pole-papeterie-impression'
  | 'design-graphique-pao'
  | 'decoupe-gravure-laser'
  | 'usinage-cnc-bois'
  | 'impression-uv-dtf'
  | 'impression-dtf-textile'
  | 'sublimation'
  | 'impression-sur-bois'
  | 'couture-textile'
  | 'enseignes-signaletique'
  | 'packaging-coffrets'
  | 'creations-evenementielles'
  | 'signaletique-plv'
  | 'wedding-event';

interface EditorialIllustrationProps {
  variant: EditorialIllustrationVariant;
  tone?: 'dark' | 'light';
  className?: string;
  aspectClass?: string;
  label?: string;
}

const META_LABELS: Record<EditorialIllustrationVariant, { code: string; caption: string }> = {
  'hero-atelier': { code: '4EVER · ATELIER', caption: 'Création & fabrication sur mesure' },
  'studio-craft': { code: 'ATELIER', caption: 'Savoir-faire & précision' },
  'pole-matieres-rigides': { code: 'PÔLE 01', caption: 'Bois, acrylique, métal & usinage' },
  'pole-textiles-matieres-souples': { code: 'PÔLE 02', caption: 'Coton, raphia, tsihy & broderie' },
  'pole-goodies-objets-personnalises': { code: 'PÔLE 03', caption: 'Objets, coffrets & marquage' },
  'pole-papeterie-impression': { code: 'PÔLE 04', caption: 'Édition, façonnage & packaging' },
  'design-graphique-pao': { code: 'TECH · 01', caption: 'Design graphique & PAO' },
  'decoupe-gravure-laser': { code: 'TECH · 02', caption: 'Découpe & gravure laser CO₂' },
  'usinage-cnc-bois': { code: 'TECH · 03', caption: 'Usinage CNC sur bois' },
  'impression-uv-dtf': { code: 'TECH · 04', caption: 'Impression UV-DTF' },
  'impression-dtf-textile': { code: 'TECH · 05', caption: 'Impression DTF textile' },
  sublimation: { code: 'TECH · 06', caption: 'Sublimation haute tenue' },
  'impression-sur-bois': { code: 'TECH · 07', caption: 'Impression directe sur bois' },
  'couture-textile': { code: 'TECH · 08', caption: 'Couture & confection textile' },
  'enseignes-signaletique': { code: 'TECH · 09', caption: 'Enseignes & signalétique' },
  'packaging-coffrets': { code: 'TECH · 10', caption: 'Packaging & coffrets cadeaux' },
  'creations-evenementielles': { code: 'TECH · 11', caption: 'Créations événementielles' },
  'signaletique-plv': { code: 'PLV', caption: 'Présentoirs & signalétique' },
  'wedding-event': { code: 'EVENT', caption: 'Papeterie fine & scénographie' },
};

function renderArtwork(variant: EditorialIllustrationVariant) {
  switch (variant) {
    case 'hero-atelier':
    case 'studio-craft':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Architectural drafting frame */}
          <rect x="44" y="34" width="312" height="232" rx="4" strokeWidth="1.2" opacity="0.28" />
          <line x1="44" y1="62" x2="356" y2="62" strokeWidth="1" opacity="0.22" />
          {/* Precision ruler along top edge */}
          {Array.from({ length: 19 }).map((_, i) => (
            <line
              key={i}
              x1={68 + i * 15}
              y1="52"
              x2={68 + i * 15}
              y2={i % 3 === 0 ? '62' : '58'}
              strokeWidth="1.1"
              opacity="0.45"
            />
          ))}
          {/* Drafting compass */}
          <circle cx="144" cy="108" r="7" strokeWidth="1.8" />
          <line x1="144" y1="90" x2="144" y2="101" strokeWidth="2" />
          <path d="M140 114 L106 218" strokeWidth="2" />
          <path d="M148 114 L182 218" strokeWidth="2" />
          <path d="M116 176 Q144 188 172 176" strokeWidth="1.4" />
          <circle cx="144" cy="182" r="2.2" fill="currentColor" />
          {/* Wood & brass block with laser crosshairs */}
          <rect x="206" y="136" width="112" height="84" rx="3" strokeWidth="1.8" />
          <path d="M214 148 Q262 142 310 150" strokeWidth="1" opacity="0.45" />
          <path d="M214 162 Q256 168 310 159" strokeWidth="1" opacity="0.35" />
          <path d="M214 205 Q268 198 310 207" strokeWidth="1" opacity="0.45" />
          {/* Engraved emblem inside wood block */}
          <polygon points="262,154 282,178 262,202 242,178" strokeWidth="1.6" />
          <circle cx="262" cy="178" r="7" strokeWidth="1.4" />
          {/* Stylus / Fountain nib silhouette */}
          <path d="M286 84 L318 116 L308 126 L276 94 Z" strokeWidth="1.6" />
          <path d="M318 116 L332 134 L308 126" strokeWidth="1.6" />
          <line x1="296" y1="104" x2="314" y2="122" strokeWidth="1.1" opacity="0.5" />
          {/* Engraved crosshatch shadow */}
          <line x1="78" y1="234" x2="322" y2="234" strokeWidth="1.4" opacity="0.5" />
          <line x1="92" y1="242" x2="294" y2="242" strokeWidth="1" opacity="0.28" />
        </g>
      );

    case 'pole-matieres-rigides':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Carved isometric wood & acrylic display planes */}
          <polygon points="78,196 184,142 292,196 186,250" strokeWidth="1.8" />
          <polygon points="78,196 78,214 186,268 292,214 292,196" strokeWidth="1.6" />
          <line x1="186" y1="250" x2="186" y2="268" strokeWidth="1.6" />
          {/* Wood grain contour lines */}
          <path d="M108 196 Q155 182 204 196" strokeWidth="1" opacity="0.45" />
          <path d="M126 208 Q182 195 248 205" strokeWidth="1" opacity="0.4" />
          <path d="M150 222 Q188 216 232 224" strokeWidth="1" opacity="0.35" />
          {/* Vertical laser-cut wooden crest / sign plaque mounted in slot */}
          <rect x="132" y="76" width="108" height="106" rx="4" strokeWidth="1.9" />
          <rect x="142" y="86" width="88" height="86" rx="2" strokeWidth="1" opacity="0.45" />
          {/* Engraved architectural monogram inside plaque */}
          <path d="M186 102 L212 128 L186 154 L160 128 Z" strokeWidth="1.6" />
          <circle cx="186" cy="128" r="10" strokeWidth="1.4" />
          {/* CNC / Laser precision gantry indicator top-right */}
          <path d="M276 52 L298 52 L292 78 L282 78 Z" strokeWidth="1.6" />
          <line x1="287" y1="78" x2="287" y2="128" strokeWidth="1.3" strokeDasharray="3 4" />
          <circle cx="287" cy="134" r="4" strokeWidth="1.4" />
          {/* Chamfered acrylic sample card */}
          <rect x="256" y="122" width="66" height="46" rx="2" strokeWidth="1.4" opacity="0.85" />
          <line x1="268" y1="136" x2="308" y2="136" strokeWidth="1.2" opacity="0.55" />
          <line x1="268" y1="146" x2="296" y2="146" strokeWidth="1.2" opacity="0.45" />
        </g>
      );

    case 'pole-textiles-matieres-souples':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Tote bag with handles */}
          <path d="M116 112 L226 112 L236 244 L106 244 Z" strokeWidth="1.9" />
          <path d="M142 112 C142 66 200 66 200 112" strokeWidth="1.9" />
          {/* Stitched pocket & weave lines */}
          <rect x="134" y="142" width="74" height="58" rx="2" strokeWidth="1.4" />
          <path d="M114 232 L228 232" strokeWidth="1" strokeDasharray="4 3" opacity="0.55" />
          {/* Woven raphia / tsihy geometric texture grid */}
          <rect x="144" y="152" width="54" height="38" strokeWidth="1" opacity="0.4" />
          <line x1="154" y1="152" x2="154" y2="190" strokeWidth="1" opacity="0.35" />
          <line x1="171" y1="152" x2="171" y2="190" strokeWidth="1" opacity="0.35" />
          <line x1="188" y1="152" x2="188" y2="190" strokeWidth="1" opacity="0.35" />
          <line x1="144" y1="164" x2="198" y2="164" strokeWidth="1" opacity="0.35" />
          <line x1="144" y1="177" x2="198" y2="177" strokeWidth="1" opacity="0.35" />
          {/* Embroidery hoop overlapping right */}
          <circle cx="268" cy="148" r="50" strokeWidth="1.8" />
          <circle cx="268" cy="148" r="42" strokeWidth="1.2" opacity="0.55" />
          <rect x="262" y="88" width="12" height="10" rx="2" strokeWidth="1.5" />
          {/* Botanical raphia leaf motif embroidered inside hoop */}
          <path d="M268 176 L268 122" strokeWidth="1.6" />
          <path d="M268 156 Q246 148 244 132 Q262 132 268 148" strokeWidth="1.4" />
          <path d="M268 144 Q290 136 292 120 Q274 120 268 136" strokeWidth="1.4" />
          {/* Needle & fine thread trail */}
          <line x1="290" y1="194" x2="324" y2="160" strokeWidth="1.8" />
          <path d="M290 194 Q256 226 294 246 Q326 258 334 232" strokeWidth="1.1" strokeDasharray="3 3" opacity="0.65" />
          {/* Folded fabric stack bottom-left */}
          <rect x="64" y="190" width="44" height="54" rx="2" strokeWidth="1.4" />
          <line x1="64" y1="208" x2="108" y2="208" strokeWidth="1.2" opacity="0.55" />
          <line x1="64" y1="226" x2="108" y2="226" strokeWidth="1.2" opacity="0.55" />
        </g>
      );

    case 'pole-goodies-objets-personnalises':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Insulated flask / bottle */}
          <rect x="86" y="92" width="54" height="148" rx="10" strokeWidth="1.9" />
          <rect x="96" y="72" width="34" height="20" rx="3" strokeWidth="1.8" />
          <line x1="86" y1="118" x2="140" y2="118" strokeWidth="1.2" opacity="0.5" />
          <circle cx="113" cy="166" r="14" strokeWidth="1.5" />
          <path d="M106 166 L113 158 L120 166 L113 174 Z" strokeWidth="1.2" />
          {/* Ceramic mug */}
          <path d="M168 148 L244 148 L244 226 C244 235 237 240 228 240 L184 240 C175 240 168 235 168 226 Z" strokeWidth="1.9" />
          <path d="M244 162 C264 162 264 214 244 214" strokeWidth="1.8" />
          <line x1="184" y1="184" x2="228" y2="184" strokeWidth="1.3" opacity="0.55" />
          <line x1="190" y1="196" x2="222" y2="196" strokeWidth="1.2" opacity="0.4" />
          {/* Hardbound notebook & engraved pen */}
          <rect x="268" y="108" width="66" height="132" rx="4" strokeWidth="1.8" />
          <line x1="280" y1="108" x2="280" y2="240" strokeWidth="1.4" />
          <line x1="320" y1="108" x2="320" y2="240" strokeWidth="1.1" strokeDasharray="3 3" opacity="0.55" />
          <rect x="292" y="136" width="24" height="16" rx="1" strokeWidth="1.2" opacity="0.7" />
          {/* Precision pen angled above */}
          <path d="M174 114 L254 70 L260 80 L180 124 Z" strokeWidth="1.7" />
          <path d="M174 114 L162 126 L180 124" strokeWidth="1.6" />
          <line x1="234" y1="81" x2="246" y2="75" strokeWidth="1.2" />
        </g>
      );

    case 'pole-papeterie-impression':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Registration & bleed crop marks */}
          <path d="M58 58 L70 58 M58 58 L58 70" strokeWidth="1.2" opacity="0.5" />
          <path d="M342 58 L330 58 M342 58 L342 70" strokeWidth="1.2" opacity="0.5" />
          <path d="M58 246 L70 246 M58 246 L58 234" strokeWidth="1.2" opacity="0.5" />
          <path d="M342 246 L330 246 M342 246 L342 234" strokeWidth="1.2" opacity="0.5" />
          {/* Layered printed folio & invitation sheets */}
          <rect x="86" y="72" width="144" height="162" rx="3" strokeWidth="1.8" />
          <rect x="108" y="92" width="144" height="154" rx="3" strokeWidth="1.6" opacity="0.75" />
          {/* Folded tri-fold brochure right */}
          <polygon points="222,86 276,72 276,222 222,236" strokeWidth="1.7" />
          <polygon points="276,72 326,86 326,236 276,222" strokeWidth="1.7" />
          {/* Editorial layout lines inside sheets */}
          <rect x="128" y="114" width="76" height="44" strokeWidth="1.3" opacity="0.65" />
          <line x1="128" y1="176" x2="204" y2="176" strokeWidth="1.4" opacity="0.6" />
          <line x1="128" y1="188" x2="192" y2="188" strokeWidth="1.2" opacity="0.45" />
          <line x1="128" y1="200" x2="178" y2="200" strokeWidth="1.2" opacity="0.45" />
          {/* Embossed studio seal */}
          <circle cx="166" cy="136" r="14" strokeWidth="1.5" />
          <circle cx="166" cy="136" r="8" strokeWidth="1" opacity="0.5" />
          {/* Scoring fold dashed line */}
          <line x1="276" y1="72" x2="276" y2="222" strokeWidth="1.3" strokeDasharray="4 4" />
        </g>
      );

    case 'design-graphique-pao':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Golden ratio / wireframe layout artboard */}
          <rect x="64" y="54" width="208" height="186" rx="4" strokeWidth="1.8" />
          <line x1="64" y1="84" x2="272" y2="84" strokeWidth="1.2" opacity="0.45" />
          <circle cx="80" cy="69" r="3" fill="currentColor" opacity="0.5" />
          <circle cx="92" cy="69" r="3" fill="currentColor" opacity="0.5" />
          {/* Bezier spline curve & tangent handles */}
          <path d="M98 196 C126 112 204 204 238 118" strokeWidth="2.1" />
          <line x1="98" y1="196" x2="132" y2="122" strokeWidth="1.1" strokeDasharray="3 3" opacity="0.7" />
          <line x1="238" y1="118" x2="204" y2="190" strokeWidth="1.1" strokeDasharray="3 3" opacity="0.7" />
          <rect x="93" y="191" width="10" height="10" strokeWidth="1.6" />
          <rect x="233" y="113" width="10" height="10" strokeWidth="1.6" />
          <circle cx="132" cy="122" r="4" fill="currentColor" />
          <circle cx="204" cy="190" r="4" fill="currentColor" />
          {/* Swatch fan on right */}
          <rect x="288" y="94" width="40" height="132" rx="3" strokeWidth="1.7" transform="rotate(8 308 160)" />
          <rect x="274" y="92" width="40" height="132" rx="3" strokeWidth="1.7" transform="rotate(-6 294 158)" />
          <line x1="286" y1="120" x2="306" y2="120" strokeWidth="1.3" opacity="0.5" />
          <line x1="286" y1="146" x2="306" y2="146" strokeWidth="1.3" opacity="0.5" />
          <line x1="286" y1="172" x2="306" y2="172" strokeWidth="1.3" opacity="0.5" />
        </g>
      );

    case 'decoupe-gravure-laser':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Gantry bridge & optical carriage */}
          <line x1="56" y1="68" x2="344" y2="68" strokeWidth="2" />
          <line x1="56" y1="80" x2="344" y2="80" strokeWidth="1.2" opacity="0.45" />
          <rect x="172" y="54" width="56" height="44" rx="3" strokeWidth="1.9" />
          <polygon points="188,98 212,98 204,122 196,122" strokeWidth="1.8" />
          {/* Focused CO2 laser ray */}
          <line x1="200" y1="122" x2="200" y2="188" strokeWidth="1.6" strokeDasharray="3 3" />
          <circle cx="200" cy="188" r="7" strokeWidth="1.3" opacity="0.7" />
          <circle cx="200" cy="188" r="2.2" fill="currentColor" />
          {/* Isometric wood/acrylic panel being cut */}
          <polygon points="78,204 200,148 322,204 200,260" strokeWidth="1.9" />
          <polygon points="78,204 78,218 200,274 322,218 322,204" strokeWidth="1.5" />
          {/* Engraved mandala / geometric cutout path */}
          <polygon points="200,166 236,188 200,210 164,188" strokeWidth="1.5" />
          <circle cx="200" cy="188" r="24" strokeWidth="1.1" strokeDasharray="4 3" opacity="0.6" />
        </g>
      );

    case 'usinage-cnc-bois':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* CNC Spindle assembly */}
          <rect x="170" y="42" width="60" height="58" rx="4" strokeWidth="1.9" />
          <rect x="184" y="100" width="32" height="22" strokeWidth="1.7" />
          {/* Fluted router milling bit */}
          <path d="M194 122 L206 122 L204 168 L200 174 L196 168 Z" strokeWidth="1.8" />
          <line x1="195" y1="134" x2="205" y2="142" strokeWidth="1.2" />
          <line x1="195" y1="148" x2="205" y2="156" strokeWidth="1.2" />
          {/* Thick carved timber block with milled relief pocket */}
          <polygon points="72,196 200,142 328,196 200,250" strokeWidth="1.9" />
          <polygon points="72,196 72,226 200,280 328,226 328,196" strokeWidth="1.7" />
          <line x1="200" y1="250" x2="200" y2="280" strokeWidth="1.6" />
          {/* Milled inner pocket relief */}
          <polygon points="122,196 200,162 278,196 200,230" strokeWidth="1.5" />
          <line x1="122" y1="196" x2="122" y2="206" strokeWidth="1.3" opacity="0.6" />
          <line x1="278" y1="196" x2="278" y2="206" strokeWidth="1.3" opacity="0.6" />
          {/* Wood shavings / arcs */}
          <path d="M158 164 Q146 154 138 162" strokeWidth="1.2" opacity="0.6" />
          <path d="M242 162 Q256 152 264 160" strokeWidth="1.2" opacity="0.6" />
        </g>
      );

    case 'impression-uv-dtf':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* UV printhead gantry bar */}
          <rect x="64" y="64" width="272" height="24" rx="3" strokeWidth="1.8" />
          <rect x="148" y="54" width="104" height="44" rx="4" strokeWidth="2" />
          {/* UV curing rays */}
          <line x1="168" y1="98" x2="160" y2="126" strokeWidth="1.3" strokeDasharray="3 3" opacity="0.65" />
          <line x1="200" y1="98" x2="200" y2="126" strokeWidth="1.4" opacity="0.8" />
          <line x1="232" y1="98" x2="240" y2="126" strokeWidth="1.3" strokeDasharray="3 3" opacity="0.65" />
          {/* Curved rigid flask/tumbler receiving relief transfer */}
          <rect x="116" y="136" width="168" height="92" rx="18" strokeWidth="1.9" />
          <ellipse cx="148" cy="182" rx="12" ry="46" strokeWidth="1.2" opacity="0.45" />
          {/* Glossy UV relief emblem */}
          <circle cx="212" cy="182" r="24" strokeWidth="1.6" />
          <path d="M200 182 L212 168 L224 182 L212 196 Z" strokeWidth="1.4" />
          {/* Bottle neck cap */}
          <rect x="86" y="158" width="30" height="48" rx="4" strokeWidth="1.8" />
          <line x1="68" y1="248" x2="332" y2="248" strokeWidth="1.2" opacity="0.45" />
        </g>
      );

    case 'impression-dtf-textile':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Heat press upper platen */}
          <rect x="108" y="48" width="184" height="34" rx="4" strokeWidth="1.9" />
          <line x1="200" y1="30" x2="200" y2="48" strokeWidth="2.2" />
          <path d="M168 30 L232 30" strokeWidth="2.2" />
          <line x1="126" y1="88" x2="274" y2="88" strokeWidth="1.1" strokeDasharray="4 4" opacity="0.55" />
          {/* T-shirt silhouette flat on lower platen */}
          <path
            d="M144 106 L176 106 C182 118 218 118 224 106 L256 106 L308 136 L288 176 L262 162 L262 252 L138 252 L138 162 L112 176 L92 136 Z"
            strokeWidth="1.9"
          />
          {/* DTF transfer film & emblem inside shirt */}
          <rect x="166" y="142" width="68" height="68" rx="3" strokeWidth="1.3" strokeDasharray="4 3" opacity="0.7" />
          <circle cx="200" cy="176" r="18" strokeWidth="1.6" />
          <path d="M190 176 L200 164 L210 176 L200 188 Z" strokeWidth="1.4" />
        </g>
      );

    case 'sublimation':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Mug thermal wrap & ceramic mugs */}
          <path d="M88 124 L178 124 L178 226 C178 238 168 244 156 244 L110 244 C98 244 88 238 88 226 Z" strokeWidth="1.9" />
          <path d="M178 144 C202 144 202 206 178 206" strokeWidth="1.9" />
          {/* Continuous wrap transfer band */}
          <path d="M88 158 L178 158 M88 208 L178 208" strokeWidth="1.3" opacity="0.6" />
          <path d="M108 184 Q133 166 158 184 Q133 202 108 184 Z" strokeWidth="1.5" />
          {/* Heat vapor / sublimation waves rising */}
          <path d="M116 106 Q110 92 118 80 Q126 68 118 56" strokeWidth="1.4" opacity="0.65" />
          <path d="M138 106 Q132 92 140 80 Q148 68 140 56" strokeWidth="1.4" opacity="0.65" />
          <path d="M160 106 Q154 92 162 80 Q170 68 162 56" strokeWidth="1.4" opacity="0.65" />
          {/* Sublimated aluminum badge plaque right */}
          <rect x="228" y="96" width="104" height="148" rx="6" strokeWidth="1.8" />
          <rect x="242" y="112" width="76" height="80" rx="2" strokeWidth="1.3" opacity="0.7" />
          <circle cx="280" cy="152" r="18" strokeWidth="1.4" />
          <line x1="244" y1="212" x2="316" y2="212" strokeWidth="1.4" opacity="0.6" />
          <line x1="254" y1="224" x2="306" y2="224" strokeWidth="1.2" opacity="0.4" />
        </g>
      );

    case 'impression-sur-bois':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Natural wood plank panel */}
          <rect x="74" y="88" width="252" height="156" rx="4" strokeWidth="1.9" />
          <rect x="86" y="100" width="228" height="132" rx="2" strokeWidth="1.1" opacity="0.45" />
          {/* Concentric timber grain texture */}
          <path d="M88 122 Q165 110 312 126" strokeWidth="1" opacity="0.4" />
          <path d="M88 214 Q212 224 312 208" strokeWidth="1" opacity="0.4" />
          <ellipse cx="268" cy="186" rx="18" ry="10" strokeWidth="1" opacity="0.45" />
          <ellipse cx="268" cy="186" rx="8" ry="4" strokeWidth="1" opacity="0.45" />
          {/* Printhead carriage gliding over plank */}
          <rect x="148" y="54" width="68" height="220" rx="3" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.6" />
          <rect x="156" y="42" width="52" height="36" rx="3" strokeWidth="1.8" />
          {/* Printed botanical artwork emerging on the wood */}
          <circle cx="146" cy="166" r="28" strokeWidth="1.6" />
          <path d="M146 184 L146 146" strokeWidth="1.6" />
          <path d="M146 168 Q132 162 132 150 Q144 150 146 162" strokeWidth="1.4" />
          <path d="M146 162 Q160 156 160 144 Q148 144 146 156" strokeWidth="1.4" />
        </g>
      );

    case 'couture-textile':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Studio sewing machine silhouette */}
          <path
            d="M84 220 L306 220 L306 244 L84 244 Z"
            strokeWidth="1.9"
          />
          <path
            d="M254 220 L254 114 C254 98 242 90 226 90 L132 90 C116 90 108 100 108 116 L108 148 L140 148 L140 124 L214 124 L214 220"
            strokeWidth="1.9"
          />
          {/* Needle bar & presser foot */}
          <line x1="124" y1="148" x2="124" y2="188" strokeWidth="1.7" />
          <path d="M114 196 L136 196" strokeWidth="1.8" />
          {/* Flywheel & thread spool */}
          <circle cx="272" cy="130" r="14" strokeWidth="1.6" />
          <rect x="218" y="58" width="20" height="32" rx="2" strokeWidth="1.6" />
          <line x1="218" y1="66" x2="238" y2="66" strokeWidth="1" opacity="0.55" />
          <line x1="218" y1="74" x2="238" y2="74" strokeWidth="1" opacity="0.55" />
          <line x1="218" y1="82" x2="238" y2="82" strokeWidth="1" opacity="0.55" />
          {/* Fabric seam running underneath */}
          <path d="M56 202 Q132 198 202 204" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.7" />
          {/* Tailor shears bottom-right */}
          <circle cx="316" cy="182" r="9" strokeWidth="1.5" />
          <circle cx="336" cy="196" r="9" strokeWidth="1.5" />
          <line x1="308" y1="186" x2="264" y2="210" strokeWidth="1.5" />
          <line x1="328" y1="194" x2="264" y2="210" strokeWidth="1.5" />
        </g>
      );

    case 'enseignes-signaletique':
    case 'signaletique-plv':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Architectural storefront fascia sign with dimensional letters */}
          <rect x="64" y="64" width="214" height="84" rx="4" strokeWidth="1.9" />
          <rect x="76" y="76" width="190" height="60" rx="2" strokeWidth="1.1" opacity="0.45" />
          {/* Standoff mounting pins */}
          <circle cx="72" cy="72" r="2.2" fill="currentColor" />
          <circle cx="270" cy="72" r="2.2" fill="currentColor" />
          <circle cx="72" cy="140" r="2.2" fill="currentColor" />
          <circle cx="270" cy="140" r="2.2" fill="currentColor" />
          {/* Dimensional 4E emblem & typographic bars */}
          <polygon points="108,88 128,106 108,124 88,106" strokeWidth="1.6" />
          <line x1="146" y1="98" x2="246" y2="98" strokeWidth="2.4" />
          <line x1="146" y1="114" x2="218" y2="114" strokeWidth="1.4" opacity="0.6" />
          {/* Freestanding PLV counter display / totem right */}
          <polygon points="274,142 330,142 338,248 266,248" strokeWidth="1.8" />
          <rect x="284" y="160" width="36" height="44" rx="2" strokeWidth="1.3" opacity="0.7" />
          <line x1="286" y1="220" x2="318" y2="220" strokeWidth="1.4" />
          {/* Directional wayfinding arrow plaque bottom-left */}
          <path d="M64 176 L212 176 L232 198 L212 220 L64 220 Z" strokeWidth="1.7" />
          <path d="M188 188 L202 198 L188 208" strokeWidth="1.7" />
          <line x1="88" y1="198" x2="178" y2="198" strokeWidth="1.4" opacity="0.65" />
        </g>
      );

    case 'packaging-coffrets':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Open isometric luxury gift box with lid */}
          <polygon points="84,162 200,108 316,162 200,216" strokeWidth="1.9" />
          <polygon points="84,162 84,228 200,282 316,228 316,162" strokeWidth="1.8" />
          <line x1="200" y1="216" x2="200" y2="282" strokeWidth="1.7" />
          {/* Custom inner die-cut cavity lines */}
          <polygon points="118,162 200,124 282,162 200,200" strokeWidth="1.3" opacity="0.6" />
          <ellipse cx="176" cy="162" rx="22" ry="12" strokeWidth="1.4" />
          <rect x="208" y="150" width="34" height="22" rx="2" strokeWidth="1.4" transform="rotate(-12 225 161)" />
          {/* Detached bevelled box lid floating cleanly above */}
          <polygon points="94,96 200,48 306,96 200,144" strokeWidth="1.9" />
          <line x1="146" y1="72" x2="254" y2="120" strokeWidth="1.3" opacity="0.55" />
          <line x1="254" y1="72" x2="146" y2="120" strokeWidth="1.3" opacity="0.55" />
          {/* Ribbon bow crest */}
          <path d="M200 96 C182 82 174 96 200 96 C226 96 218 82 200 96 Z" strokeWidth="1.5" />
        </g>
      );

    case 'creations-evenementielles':
    case 'wedding-event':
      return (
        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Arched wedding / event invitation card */}
          <path
            d="M84 244 L84 128 C84 86 116 64 152 64 C188 64 220 86 220 128 L220 244 Z"
            strokeWidth="1.9"
          />
          <path
            d="M98 232 L98 132 C98 98 122 78 152 78 C182 78 206 98 206 132 L206 232"
            strokeWidth="1.1"
            opacity="0.45"
          />
          {/* Engraved serif calligraphy placeholder & botanical crest */}
          <path d="M152 138 L152 104" strokeWidth="1.4" />
          <path d="M152 122 Q138 116 138 104 Q150 104 152 116" strokeWidth="1.3" />
          <path d="M152 118 Q166 112 166 100 Q154 100 152 112" strokeWidth="1.3" />
          <line x1="120" y1="162" x2="184" y2="162" strokeWidth="1.6" />
          <line x1="130" y1="176" x2="174" y2="176" strokeWidth="1.2" opacity="0.55" />
          {/* Wax seal */}
          <circle cx="152" cy="208" r="14" strokeWidth="1.6" />
          <circle cx="152" cy="208" r="8" strokeWidth="1.1" opacity="0.5" />
          {/* Event badge / trophy & welcome totem right */}
          <rect x="246" y="114" width="70" height="106" rx="4" strokeWidth="1.8" />
          <path d="M268 114 L268 74 L294 74 L294 114" strokeWidth="1.5" />
          <circle cx="281" cy="148" r="12" strokeWidth="1.4" />
          <line x1="262" y1="180" x2="300" y2="180" strokeWidth="1.4" opacity="0.7" />
          <line x1="268" y1="194" x2="294" y2="194" strokeWidth="1.2" opacity="0.45" />
          {/* Laser-cut wooden table place card */}
          <polygon points="236,244 334,244 322,226 248,226" strokeWidth="1.6" />
        </g>
      );
  }
}

export function EditorialIllustration({
  variant,
  tone = 'dark',
  className = '',
  aspectClass = 'aspect-[4/3]',
  label,
}: EditorialIllustrationProps) {
  const meta = META_LABELS[variant];
  const isDark = tone === 'dark';

  const containerStyle: CSSProperties = isDark
    ? {
        backgroundColor: '#052E29',
        color: '#E4DDD2',
      }
    : {
        backgroundColor: '#F7F4EE',
        color: '#111111',
      };

  return (
    <div
      style={containerStyle}
      className={`relative overflow-hidden select-none flex flex-col justify-between ${aspectClass} ${className}`}
      role="img"
      aria-label={label || `${meta.code} — ${meta.caption}`}
    >
      {/* Subtle monochrome corner registration ticks */}
      <div
        className={`absolute inset-3 pointer-events-none border ${
          isDark ? 'border-[#E4DDD2]/12' : 'border-[#111111]/10'
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center justify-between px-5 pt-4 text-[10px] font-display font-semibold tracking-[0.18em] uppercase opacity-70">
        <span>{meta.code}</span>
        <span className="tabular-nums opacity-75">MODERN HANDCRAFT</span>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-1 min-h-0">
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full max-h-full"
          aria-hidden="true"
        >
          {renderArtwork(variant)}
        </svg>
      </div>

      <div
        className={`relative z-10 px-5 pb-3.5 pt-2 flex items-center justify-between text-[11px] font-display tracking-wide border-t mx-3 ${
          isDark
            ? 'border-[#E4DDD2]/10 text-[#E4DDD2]/75'
            : 'border-[#111111]/10 text-[#111111]/70'
        }`}
      >
        <span className="truncate">{meta.caption}</span>
        <span className="shrink-0 uppercase tracking-[0.16em] text-[9px] opacity-60">
          4EVER
        </span>
      </div>
    </div>
  );
}
