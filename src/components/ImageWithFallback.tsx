import { useState } from 'react';
import { STUDIO_VISUALS } from '../data/visuals.ts';

interface ImageWithFallbackProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  aspectClass?: string;
}

export function ImageWithFallback({
  src,
  fallbackSrc = STUDIO_VISUALS.heroStudioCraft,
  alt,
  className = '',
  imgClassName = '',
  aspectClass = 'aspect-[4/3]',
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = !src || failed ? fallbackSrc : src;

  return (
    <div className={`relative overflow-hidden bg-[#E4DDD2]/35 ${aspectClass} ${className}`}>
      <img
        src={resolvedSrc}
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
