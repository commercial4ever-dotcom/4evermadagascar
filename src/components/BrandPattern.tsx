import { useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';

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

const DEFAULT_OPACITY: Record<BrandPatternVariant, number> = {
  'monochrome-dark': 0.045,
  'monochrome-light': 0.055,
  multicolor: 0.16,
};

const MASK_GRADIENTS: Record<BrandPatternMask, string | undefined> = {
  none: undefined,
  'fade-edges':
    'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
  'fade-left':
    'linear-gradient(to left, black 10%, rgba(0,0,0,0.65) 48%, transparent 92%)',
  'fade-right':
    'linear-gradient(to right, black 10%, rgba(0,0,0,0.65) 48%, transparent 92%)',
  'fade-bottom':
    'linear-gradient(to bottom, black 25%, rgba(0,0,0,0.45) 70%, transparent 100%)',
  'fade-top':
    'linear-gradient(to top, black 25%, rgba(0,0,0,0.45) 70%, transparent 100%)',
  radial:
    'radial-gradient(ellipse 75% 75% at 50% 50%, black 35%, rgba(0,0,0,0.4) 70%, transparent 100%)',
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

/**
 * BrandPattern — Renders exclusively the official 4EVER graphic grid assets
 * without any procedural drawing or proportion distortion.
 */
export function BrandPattern({
  variant = 'monochrome-dark',
  opacity,
  position = 'full',
  scale = 1,
  blur = 0,
  parallax = false,
  mask = 'none',
  repeat = false,
  tileSize = 420,
  reveal = true,
  className = '',
}: BrandPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const resolvedOpacity = opacity ?? DEFAULT_OPACITY[variant];
  const parallaxDistance =
    typeof parallax === 'number' ? parallax : parallax ? 24 : 0;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const yOffset = useTransform(
    scrollYProgress,
    [0, 1],
    [-parallaxDistance, parallaxDistance],
  );

  const assetSrc = PATTERN_ASSETS[variant];
  const maskStyle = MASK_GRADIENTS[mask];

  const wrapperMaskStyle: CSSProperties = {
    ...(maskStyle
      ? {
          maskImage: maskStyle,
          WebkitMaskImage: maskStyle,
        }
      : {}),
    ...(blur > 0 ? { filter: `blur(${blur}px)` } : {}),
  };

  if (repeat || position === 'full') {
    const uniformTile = Math.round(tileSize * scale);
    return (
      <div
        ref={containerRef}
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
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            y:
              !shouldReduceMotion && parallaxDistance !== 0
                ? yOffset
                : undefined,
            backgroundImage: `url(${assetSrc})`,
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center center',
            backgroundSize: `${uniformTile}px ${uniformTile}px`,
            top: '-10%',
            bottom: '-10%',
          }}
          className="absolute inset-x-0 will-change-transform"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      style={wrapperMaskStyle}
      aria-hidden="true"
    >
      <div className={`absolute ${POSITION_CLASSES[position]}`}>
        <motion.div
          initial={
            reveal && !shouldReduceMotion
              ? { opacity: 0, scale: scale * 0.96 }
              : { opacity: resolvedOpacity, scale }
          }
          whileInView={{ opacity: resolvedOpacity, scale }}
          viewport={{ once: true, amount: 'some' }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          style={{
            y:
              !shouldReduceMotion && parallaxDistance !== 0
                ? yOffset
                : undefined,
          }}
          className="will-change-transform"
        >
          <img
            src={assetSrc}
            alt=""
            loading="lazy"
            draggable={false}
            className="w-[340px] sm:w-[440px] lg:w-[540px] aspect-square object-contain max-w-none"
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

/**
 * Clean cropped transition strip between page sections displaying the official
 * 4EVER pattern grid horizontally without borders cluttering text.
 */
export function BrandPatternBand({
  variant = 'multicolor',
  opacity,
  surface = 'white',
  tileSize = 220,
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
      ? 0.22
      : surface === 'emerald'
        ? 0.06
        : 0.05);

  return (
    <div
      className={`relative h-12 sm:h-16 overflow-hidden border-y border-[#073D37]/10 ${surfaceClass}`}
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
