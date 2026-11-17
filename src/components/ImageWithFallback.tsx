import { useState } from 'react';
import {
  EditorialIllustration,
  type EditorialIllustrationVariant,
} from './EditorialIllustrations.tsx';

interface ImageWithFallbackProps {
  src?: string;
  fallbackSrc?: string;
  editorialVariant?: EditorialIllustrationVariant;
  tone?: 'dark' | 'light';
  alt: string;
  className?: string;
  imgClassName?: string;
  aspectClass?: string;
}

/**
 * Displays real uploaded product/atelier photography in full fidelity when available.
 * When no real photo is provided (or if loading fails), displays crisp monochrome
 * black-and-white editorial line-art matching the surface tone.
 */
export function ImageWithFallback({
  src,
  fallbackSrc,
  editorialVariant = 'studio-craft',
  tone = 'dark',
  alt,
  className = '',
  imgClassName = '',
  aspectClass = 'aspect-[4/3]',
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const hasRealPhoto = Boolean(src && src.trim().length > 0 && !failed);

  if (hasRealPhoto && src) {
    return (
      <div
        className={`relative overflow-hidden ${
          tone === 'dark' ? 'bg-[#052E29]' : 'bg-[#FAF8F5]'
        } ${aspectClass} ${className}`}
      >
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => {
            if (!failed && src) setFailed(true);
          }}
          className={`w-full h-full object-cover ${imgClassName}`}
        />
      </div>
    );
  }

  if (editorialVariant) {
    return (
      <EditorialIllustration
        variant={editorialVariant}
        tone={tone}
        aspectClass={aspectClass}
        className={className}
        label={alt}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${
        tone === 'dark' ? 'bg-[#052E29]' : 'bg-[#FAF8F5]'
      } ${aspectClass} ${className}`}
    >
      {fallbackSrc && (
        <img
          src={fallbackSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`w-full h-full object-cover ${imgClassName}`}
        />
      )}
    </div>
  );
}
