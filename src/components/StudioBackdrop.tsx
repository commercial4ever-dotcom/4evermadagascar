import { BrandPattern } from './BrandPattern.tsx';

type BackdropVariant = 'light' | 'sand' | 'emerald' | 'emerald-deep' | 'editorial';

interface StudioBackdropProps {
  variant?: BackdropVariant;
  showPattern?: boolean;
  className?: string;
}

/**
 * Editorial brand surface layer.
 * Uses pure, breathable deep-green, tonal-green, beige, and white surfaces by default.
 * Official BrandPattern is applied only when explicitly requested, localized to corners/edges
 * with progressive fade masks and low opacity (2% to 5% on dark surfaces).
 */
export function StudioBackdrop({
  variant = 'light',
  showPattern = false,
  className = '',
}: StudioBackdropProps) {
  if (variant === 'emerald' || variant === 'emerald-deep') {
    const isDeep = variant === 'emerald-deep';
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <div
          className="w-full h-full"
          style={{
            background: isDeep
              ? 'radial-gradient(ellipse 75% 65% at 88% 14%, rgba(237,111,44,0.09) 0%, rgba(237,111,44,0) 60%), linear-gradient(160deg, #052E29 0%, #042521 100%)'
              : 'radial-gradient(ellipse 75% 65% at 86% 12%, rgba(237,111,44,0.10) 0%, rgba(237,111,44,0) 58%), radial-gradient(ellipse 65% 60% at 12% 88%, rgba(228,221,210,0.08) 0%, rgba(228,221,210,0) 60%), linear-gradient(155deg, #073D37 0%, #05332E 65%, #042824 100%)',
          }}
        />
        {showPattern && (
          <BrandPattern
            variant="monochrome-light"
            position="bottom-right"
            scale={1.08}
            opacity={0.035}
            mask="radial"
            parallax={14}
          />
        )}
      </div>
    );
  }

  if (variant === 'sand') {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <div
          className="w-full h-full"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 90% 15%, rgba(237,111,44,0.05) 0%, rgba(237,111,44,0) 65%), linear-gradient(180deg, #EFE9DF 0%, #E4DDD2 100%)',
          }}
        />
        {showPattern && (
          <BrandPattern
            variant="monochrome-dark"
            position="top-right"
            scale={1.0}
            opacity={0.03}
            mask="radial"
            parallax={12}
          />
        )}
      </div>
    );
  }

  if (variant === 'editorial') {
    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <div
          className="w-full h-full"
          style={{
            background:
              'radial-gradient(ellipse 60% 55% at 85% 18%, rgba(228,221,210,0.32) 0%, rgba(228,221,210,0) 70%), linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)',
          }}
        />
        {showPattern && (
          <BrandPattern
            variant="monochrome-dark"
            position="top-right"
            scale={0.95}
            opacity={0.028}
            mask="fade-left"
            parallax={12}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <div className="w-full h-full bg-white" />
      {showPattern && (
        <BrandPattern
          variant="monochrome-dark"
          position="bottom-left"
          scale={0.9}
          opacity={0.025}
          mask="radial"
          parallax={10}
        />
      )}
    </div>
  );
}
