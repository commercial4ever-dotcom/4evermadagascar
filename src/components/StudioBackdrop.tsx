import { BrandPattern } from './BrandPattern.tsx';

type BackdropVariant =
  | 'light'
  | 'sand'
  | 'emerald'
  | 'emerald-deep'
  | 'emerald-mid'
  | 'editorial';

interface StudioBackdropProps {
  variant?: BackdropVariant;
  showPattern?: boolean;
  className?: string;
}

/**
 * Editorial brand surface layer.
 * Uses nuanced deep-green shades around #073D37 as the dominant identity (~70%)
 * paired with warm #E4DDD2 / #EFE9DF sand intervals (~20%).
 * Official BrandPattern appears strictly localized in corners at 2%–4% opacity.
 */
export function StudioBackdrop({
  variant = 'emerald',
  showPattern = false,
  className = '',
}: StudioBackdropProps) {
  if (variant === 'emerald' || variant === 'emerald-deep' || variant === 'emerald-mid') {
    const backgroundStyle =
      variant === 'emerald-deep'
        ? 'radial-gradient(ellipse 70% 60% at 88% 14%, rgba(237,111,44,0.08) 0%, rgba(237,111,44,0) 60%), linear-gradient(160deg, #052E29 0%, #042521 100%)'
        : variant === 'emerald-mid'
          ? 'radial-gradient(ellipse 68% 58% at 15% 18%, rgba(228,221,210,0.06) 0%, rgba(228,221,210,0) 62%), radial-gradient(ellipse 65% 55% at 85% 85%, rgba(237,111,44,0.06) 0%, rgba(237,111,44,0) 62%), linear-gradient(155deg, #063631 0%, #073D37 55%, #052E29 100%)'
          : 'radial-gradient(ellipse 75% 65% at 86% 12%, rgba(237,111,44,0.09) 0%, rgba(237,111,44,0) 58%), radial-gradient(ellipse 65% 60% at 12% 88%, rgba(228,221,210,0.07) 0%, rgba(228,221,210,0) 60%), linear-gradient(155deg, #073D37 0%, #05332E 65%, #042824 100%)';

    return (
      <div
        className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        <div className="w-full h-full" style={{ background: backgroundStyle }} />
        {showPattern && (
          <BrandPattern
            variant="monochrome-light"
            position="bottom-right"
            scale={1.0}
            opacity={0.032}
            mask="radial"
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
              'radial-gradient(ellipse 65% 55% at 90% 15%, rgba(237,111,44,0.04) 0%, rgba(237,111,44,0) 65%), linear-gradient(180deg, #EFE9DF 0%, #E4DDD2 100%)',
          }}
        />
        {showPattern && (
          <BrandPattern
            variant="monochrome-dark"
            position="top-right"
            scale={0.95}
            opacity={0.028}
            mask="radial"
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
              'radial-gradient(ellipse 60% 55% at 85% 18%, rgba(228,221,210,0.32) 0%, rgba(228,221,210,0) 70%), linear-gradient(180deg, #FAF8F5 0%, #EFE9DF 100%)',
          }}
        />
        {showPattern && (
          <BrandPattern
            variant="monochrome-dark"
            position="top-right"
            scale={0.9}
            opacity={0.025}
            mask="fade-left"
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
      <div className="w-full h-full bg-[#FAF8F5]" />
      {showPattern && (
        <BrandPattern
          variant="monochrome-dark"
          position="bottom-left"
          scale={0.9}
          opacity={0.025}
          mask="radial"
        />
      )}
    </div>
  );
}
