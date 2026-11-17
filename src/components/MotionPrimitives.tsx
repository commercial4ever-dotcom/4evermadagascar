import { useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import type { PoleRevealVariant } from '../types.ts';

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
  const shouldReduceMotion = useReducedMotion();

  const offsets = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
    none: { x: 0, y: 0 },
  };

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, delay, ease: EASE_LUXURY }}
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
  const shouldReduceMotion = useReducedMotion();
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
    <Tag className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, lineIdx) => {
        const words = line.trim().split(/\s+/).filter(Boolean);
        return (
          <span key={`line-${lineIdx}`}>
            {words.map((word, wordIdx) => {
              const idx = runningIndex++;
              return (
                <span
                  key={`${word}-${idx}`}
                  className={`inline-block overflow-hidden align-top ${
                    wordIdx < words.length - 1 ? 'mr-[0.26em]' : ''
                  }`}
                  aria-hidden="true"
                >
                  <motion.span
                    className="inline-block will-change-transform"
                    initial={{ y: '108%', opacity: 0 }}
                    {...(immediate
                      ? { animate: { y: '0%', opacity: 1 } }
                      : {
                          whileInView: { y: '0%', opacity: 1 },
                          viewport: { once: true, amount: 0.2 },
                        })}
                    transition={{
                      duration: 0.65,
                      delay: delay + idx * 0.035,
                      ease: EASE_LUXURY,
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
  );
}

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
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={`overflow-hidden ${className}`}>{children}</div>;
  }

  const initialClip =
    direction === 'left'
      ? 'inset(0 100% 0 0)'
      : direction === 'right'
        ? 'inset(0 0 0 100%)'
        : 'inset(100% 0 0 0)';

  return (
    <motion.div
      initial={{ clipPath: initialClip, opacity: 0.4, scale: 1.04 }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: EASE_LUXURY }}
      className={`overflow-hidden ${className}`}
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
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const variantsMap = {
    'vertical-wipe': {
      initial: { opacity: 0, clipPath: 'inset(14% 0% 0% 0%)', y: 26 },
      target: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', y: 0 },
    },
    'horizontal-curtain': {
      initial: { opacity: 0, clipPath: 'inset(0% 14% 0% 0%)', x: -24 },
      target: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', x: 0 },
    },
    'depth-scale': {
      initial: { opacity: 0, scale: 0.94, y: 20 },
      target: { opacity: 1, scale: 1, y: 0 },
    },
    'stagger-unfold': {
      initial: { opacity: 0, clipPath: 'inset(0% 0% 16% 0%)', y: 22 },
      target: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', y: 0 },
    },
  };

  const chosen = variantsMap[variant];

  return (
    <motion.div
      initial={chosen.initial}
      whileInView={chosen.target}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.78, delay, ease: EASE_LUXURY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TiltCard({
  children,
  className = '',
  maxTilt = 3.5,
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

  const rotateX = useSpring(rotateXRaw, { stiffness: 220, damping: 24 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 220, damping: 24 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !ref.current) return;
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
    <div style={{ perspective: '1100px' }} className="h-full">
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
        animate={{ y: hovered ? -3 : 0 }}
        transition={{ duration: 0.2 }}
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
  strength = 5,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const xRaw = useMotionValue(0);
  const yRaw = useMotionValue(0);
  const x = useSpring(xRaw, { stiffness: 280, damping: 22 });
  const y = useSpring(yRaw, { stiffness: 280, damping: 22 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !ref.current) return;
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
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
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
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE_LUXURY },
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
  offset = 18,
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
}: {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 40%'],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (shouldReduceMotion) {
    return (
      <div
        className={
          orientation === 'horizontal'
            ? `h-[2px] bg-[#073D37]/20 ${className}`
            : `w-[2px] bg-[#073D37]/20 ${className}`
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
            ? 'h-[2px] w-full bg-[#073D37]/12 rounded-full overflow-hidden'
            : 'w-[2px] h-full bg-[#073D37]/12 rounded-full overflow-hidden'
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
              ? 'h-full w-full bg-gradient-to-r from-[#073D37] via-[#ED6F2C] to-[#073D37]'
              : 'w-full h-full bg-gradient-to-b from-[#073D37] via-[#ED6F2C] to-[#073D37]'
          }
        />
      </div>
    </div>
  );
}
