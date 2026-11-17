import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode, RefObject } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import type { PoleRevealVariant } from '../types.ts';

/**
 * Smooth organic deceleration curve requested for 4EVER transitions.
 */
const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Lightweight IntersectionObserver-backed visibility hook with pre-entry root margin
 * and initial viewport check so reveals trigger smoothly right on time with zero
 * per-instance scroll event listeners.
 */
function useReliableInView(ref: RefObject<HTMLElement | null>, immediate = false): boolean {
  const shouldReduceMotion = useReducedMotion();
  const inView = useInView(ref, {
    once: true,
    amount: 0.06,
    margin: '90px 0px 90px 0px',
  });
  const [visible, setVisible] = useState(() => Boolean(immediate || shouldReduceMotion));

  useEffect(() => {
    if (visible) return;
    if (immediate || shouldReduceMotion || inView) {
      setVisible(true);
      return;
    }

    const checkOnce = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top <= viewportHeight + 120 && rect.bottom >= -160) {
        setVisible(true);
      }
    };

    checkOnce();
    const rafId = window.requestAnimationFrame(checkOnce);
    window.addEventListener('hashchange', checkOnce, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('hashchange', checkOnce);
    };
  }, [ref, immediate, shouldReduceMotion, inView, visible]);

  return visible || inView;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isVisible = useReliableInView(ref);

  const offsets = {
    up: { y: 14, x: 0 },
    down: { y: -14, x: 0 },
    left: { x: 16, y: 0 },
    right: { x: -16, y: 0 },
    none: { x: 0, y: 0 },
  };

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={isVisible ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offsets[direction] }}
      transition={{ duration: 0.56, delay, ease: EASE_SMOOTH }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SplitTextRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  delay?: number;
  immediate?: boolean;
}

export function SplitTextReveal({
  text,
  as = 'h2',
  className = '',
  delay = 0,
  immediate = false,
}: SplitTextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isVisible = useReliableInView(ref, immediate);
  const lines = text.trim().split('\n');
  const Tag = as;

  if (shouldReduceMotion) {
    return (
      <Tag className={className}>
        {lines.map((line, lineIdx) => (
          <span key={lineIdx}>
            {line}
            {lineIdx < lines.length - 1 && <br />}
          </span>
        ))}
      </Tag>
    );
  }

  let runningIndex = 0;

  return (
    <div ref={ref} className="min-w-0 max-w-full">
      <Tag
        className={`${className} min-w-0 max-w-full break-words`}
        aria-label={text.replace(/\n/g, ' ')}
      >
        {lines.map((line, lineIdx) => {
          const words = line.trim().split(/\s+/).filter(Boolean);
          return (
            <span key={`line-${lineIdx}`}>
              {words.map((word, wordIdx) => {
                const idx = runningIndex++;
                return (
                  <span
                    key={`${word}-${idx}`}
                    className={`inline-block align-baseline max-w-full ${
                      wordIdx < words.length - 1 ? 'mr-[0.26em]' : ''
                    }`}
                    aria-hidden="true"
                  >
                    <motion.span
                      className="inline-block will-change-transform"
                      initial={immediate ? { y: 10, opacity: 0.25 } : { y: 14, opacity: 0 }}
                      animate={
                        isVisible
                          ? { y: 0, opacity: 1 }
                          : immediate
                            ? { y: 10, opacity: 0.25 }
                            : { y: 14, opacity: 0 }
                      }
                      transition={{
                        duration: 0.52,
                        delay: delay + Math.min(idx * 0.022, 0.16),
                        ease: EASE_SMOOTH,
                      }}
                    >
                      {word}
                    </motion.span>
                  </span>
                );
              })}
              {lineIdx < lines.length - 1 && <br />}
            </span>
          );
        })}
      </Tag>
    </div>
  );
}

/**
 * Pure GPU-composited reveal using transform + opacity (no clip-path repaints).
 */
export function MaskReveal({
  children,
  className = '',
  delay = 0,
  direction = 'bottom',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'bottom' | 'left' | 'right';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isVisible = useReliableInView(ref);

  if (shouldReduceMotion) {
    return <div className={`overflow-hidden ${className}`}>{children}</div>;
  }

  const initialTransform =
    direction === 'left'
      ? { x: -16, y: 0, scale: 0.985 }
      : direction === 'right'
        ? { x: 16, y: 0, scale: 0.985 }
        : { x: 0, y: 16, scale: 0.985 };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...initialTransform }}
      animate={
        isVisible
          ? { opacity: 1, x: 0, y: 0, scale: 1 }
          : { opacity: 0, ...initialTransform }
      }
      transition={{ duration: 0.6, delay, ease: EASE_SMOOTH }}
      className={`overflow-hidden will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PoleCardReveal({
  children,
  variant,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  variant: PoleRevealVariant;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isVisible = useReliableInView(ref);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const variantsMap = {
    'vertical-wipe': {
      initial: { opacity: 0, y: 18, x: 0, scale: 1 },
      target: { opacity: 1, y: 0, x: 0, scale: 1 },
    },
    'horizontal-curtain': {
      initial: { opacity: 0, x: -16, y: 0, scale: 1 },
      target: { opacity: 1, x: 0, y: 0, scale: 1 },
    },
    'depth-scale': {
      initial: { opacity: 0, scale: 0.975, y: 14, x: 0 },
      target: { opacity: 1, scale: 1, y: 0, x: 0 },
    },
    'stagger-unfold': {
      initial: { opacity: 0, y: 16, x: 0, scale: 0.985 },
      target: { opacity: 1, y: 0, x: 0, scale: 1 },
    },
  };

  const chosen = variantsMap[variant];

  return (
    <motion.div
      ref={ref}
      initial={chosen.initial}
      animate={isVisible ? chosen.target : chosen.initial}
      transition={{ duration: 0.56, delay, ease: EASE_SMOOTH }}
      className={`will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function TiltCard({
  children,
  className = '',
  maxTilt = 2.2,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);

  const rotateX = useSpring(rotateXRaw, { stiffness: 320, damping: 28 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 320, damping: 28 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !ref.current) return;
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(pointer: fine)').matches) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateXRaw.set(-py * maxTilt * 2);
    rotateYRaw.set(px * maxTilt * 2);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  if (shouldReduceMotion) {
    return <div className={`h-full ${className}`}>{children}</div>;
  }

  return (
    <div style={{ perspective: '1200px' }} className="h-full">
      <motion.div
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{ y: hovered ? -2 : 0 }}
        transition={{ duration: 0.22, ease: EASE_SMOOTH }}
        className={`h-full will-change-transform ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function MagneticWrapper({
  children,
  className = '',
  strength = 4,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);
  const x = useSpring(xRaw, { stiffness: 320, damping: 26 });
  const y = useSpring(yRaw, { stiffness: 320, damping: 26 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !ref.current) return;
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(pointer: fine)').matches) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width - 0.5) * strength * 2;
    const dy = ((e.clientY - rect.top) / rect.height - 0.5) * strength * 2;
    xRaw.set(dx);
    yRaw.set(dy);
  };

  const onLeave = () => {
    xRaw.set(0);
    yRaw.set(0);
  };

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGrid({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isVisible = useReliableInView(ref);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.045,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE_SMOOTH },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ParallaxVisual({
  children,
  className = '',
  offset = 10,
}: {
  children: ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  if (shouldReduceMotion) {
    return <div className={`overflow-hidden ${className}`}>{children}</div>;
  }

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="w-full h-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

export function ScrollStoryProgress({
  className = '',
  orientation = 'horizontal',
  tone = 'light',
}: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  tone?: 'light' | 'dark';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'end 45%'],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (shouldReduceMotion) {
    return (
      <div
        className={
          orientation === 'horizontal'
            ? `h-[2px] ${tone === 'dark' ? 'bg-[#E4DDD2]/20' : 'bg-[#073D37]/20'} ${className}`
            : `w-[2px] ${tone === 'dark' ? 'bg-[#E4DDD2]/20' : 'bg-[#073D37]/20'} ${className}`
        }
        aria-hidden="true"
      />
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`} aria-hidden="true">
      <div
        className={
          orientation === 'horizontal'
            ? `h-[2px] w-full ${tone === 'dark' ? 'bg-[#E4DDD2]/15' : 'bg-[#073D37]/12'} rounded-full overflow-hidden`
            : `w-[2px] h-full ${tone === 'dark' ? 'bg-[#E4DDD2]/15' : 'bg-[#073D37]/12'} rounded-full overflow-hidden`
        }
      >
        <motion.div
          style={
            orientation === 'horizontal'
              ? { scaleX: progress, transformOrigin: 'left' }
              : { scaleY: progress, transformOrigin: 'top' }
          }
          className={
            orientation === 'horizontal'
              ? `h-full w-full ${
                  tone === 'dark'
                    ? 'bg-gradient-to-r from-[#E4DDD2]/60 via-[#ED6F2C] to-[#E4DDD2]/60'
                    : 'bg-gradient-to-r from-[#073D37] via-[#ED6F2C] to-[#073D37]'
                }`
              : `w-full h-full ${
                  tone === 'dark'
                    ? 'bg-gradient-to-b from-[#E4DDD2]/60 via-[#ED6F2C] to-[#E4DDD2]/60'
                    : 'bg-gradient-to-b from-[#073D37] via-[#ED6F2C] to-[#073D37]'
                }`
          }
        />
      </div>
    </div>
  );
}
