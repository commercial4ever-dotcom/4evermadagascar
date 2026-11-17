import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import multicolorPattern from '../assets/brand/pattern-multicolor.png';
import monochromeDarkPattern from '../assets/brand/pattern-monochrome-dark.png';
import monochromeLightPattern from '../assets/brand/pattern-monochrome-light.png';

export type BrandPatternVariant =
  | 'monochrome-dark'
  | 'monochrome-light'
  | 'multicolor';

export type BrandPatternPosition =
  | 'full'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'right-edge'
  | 'left-edge';

export type BrandPatternMask =
  | 'none'
  | 'fade-edges'
  | 'fade-left'
  | 'fade-right'
  | 'fade-bottom'
  | 'fade-top'
  | 'radial';

export interface BrandPatternProps {
  variant?: BrandPatternVariant;
  opacity?: number;
  position?: BrandPatternPosition;
  scale?: number;
  blur?: number;
  parallax?: boolean | number;
  mask?: BrandPatternMask;
  repeat?: boolean;
  tileSize?: number;
  reveal?: boolean;
  className?: string;
}

const PATTERN_ASSETS: Record<BrandPatternVariant, string> = {
  'monochrome-dark': monochromeDarkPattern,
  'monochrome-light': monochromeLightPattern,
  multicolor: multicolorPattern,
};

/**
 * Discreet official pattern opacities (2%–5%) so typography and B&W illustrations
 * always remain the clear focal points.
 */
const DEFAULT_OPACITY: Record<BrandPatternVariant, number> = {
  'monochrome-dark': 0.03,
  'monochrome-light': 0.035,
  multicolor: 0.045,
};

const MASK_GRADIENTS: Record<BrandPatternMask, string | undefined> = {
  none: undefined,
  'fade-edges':
    'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
  'fade-left':
    'linear-gradient(to left, black 10%, rgba(0,0,0,0.55) 48%, transparent 92%)',
  'fade-right':
    'linear-gradient(to right, black 10%, rgba(0,0,0,0.55) 48%, transparent 92%)',
  'fade-bottom':
    'linear-gradient(to bottom, black 25%, rgba(0,0,0,0.4) 70%, transparent 100%)',
  'fade-top':
    'linear-gradient(to top, black 25%, rgba(0,0,0,0.4) 70%, transparent 100%)',
  radial:
    'radial-gradient(ellipse 72% 72% at 50% 50%, black 30%, rgba(0,0,0,0.35) 68%, transparent 100%)',
};

const POSITION_CLASSES: Record<BrandPatternPosition, string> = {
  full: 'inset-0 flex items-center justify-center',
  center: 'inset-0 flex items-center justify-center',
  'top-left': '-top-14 -left-14',
  'top-right': '-top-14 -right-14',
  'bottom-left': '-bottom-14 -left-14',
  'bottom-right': '-bottom-14 -right-14',
  'right-edge': 'top-1/2 -translate-y-1/2 -right-16',
  'left-edge': 'top-1/2 -translate-y-1/2 -left-16',
};

const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * BrandPattern — Renders exclusively the official 4EVER graphic grid assets
 * localized discreetly in corners, edges, or transitions at 2%–5% opacity.
 */
export function BrandPattern({
  variant = 'monochrome-dark',
  opacity,
  position = 'top-right',
  scale = 1,
  mask = 'radial',
  repeat = false,
  tileSize = 380,
  reveal = true,
  className = '',
}: BrandPatternProps) {
  const shouldReduceMotion = useReducedMotion();
  const resolvedOpacity = Math.min(opacity ?? DEFAULT_OPACITY[variant], 0.055);
  const assetSrc = PATTERN_ASSETS[variant];
  const maskStyle = MASK_GRADIENTS[mask];

  const wrapperMaskStyle: CSSProperties = maskStyle
    ? {
        maskImage: maskStyle,
        WebkitMaskImage: maskStyle,
      }
    : {};

  if (repeat || position === 'full') {
    const uniformTile = Math.round(tileSize * scale);
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
        style={wrapperMaskStyle}
        aria-hidden="true"
      >
        <motion.div
          initial={
            reveal && !shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: resolvedOpacity }
          }
          whileInView={{ opacity: resolvedOpacity }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7, ease: EASE_SMOOTH }}
          style={{
            backgroundImage: `url(${assetSrc})`,
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center center',
            backgroundSize: `${uniformTile}px ${uniformTile}px`,
          }}
          className="absolute inset-0"
        />
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={wrapperMaskStyle}
      aria-hidden="true"
    >
      <div className={`absolute ${POSITION_CLASSES[position]}`}>
        <motion.div
          initial={
            reveal && !shouldReduceMotion
              ? { opacity: 0, scale: scale * 0.98 }
              : { opacity: resolvedOpacity, scale }
          }
          whileInView={{ opacity: resolvedOpacity, scale }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.7, ease: EASE_SMOOTH }}
          className="will-change-transform"
        >
          <img
            src={assetSrc}
            alt=""
            loading="lazy"
            draggable={false}
            className="w-[300px] sm:w-[380px] lg:w-[460px] aspect-square object-contain max-w-none"
          />
        </motion.div>
      </div>
    </div>
  );
}

interface BrandPatternBandProps {
  variant?: BrandPatternVariant;
  opacity?: number;
  surface?: 'white' | 'sand' | 'emerald';
  tileSize?: number;
}

export function BrandPatternBand({
  variant = 'multicolor',
  opacity,
  surface = 'emerald',
  tileSize = 200,
}: BrandPatternBandProps) {
  const surfaceClass =
    surface === 'emerald'
      ? 'bg-[#073D37]'
      : surface === 'sand'
        ? 'bg-[#EFE9DF]'
        : 'bg-white';

  const resolvedOpacity =
    opacity ??
    (variant === 'multicolor'
      ? 0.045
      : surface === 'emerald'
        ? 0.035
        : 0.03);

  return (
    <div
      className={`relative h-10 sm:h-14 overflow-hidden border-y border-[#E4DDD2]/10 ${surfaceClass}`}
      aria-hidden="true"
    >
      <BrandPattern
        variant={variant}
        repeat
        tileSize={tileSize}
        opacity={resolvedOpacity}
        mask="radial"
        parallax={false}
      />
    </div>
  );
}
