import React from 'react';
import { motion } from 'framer-motion';

/* Modern decorative SVG shapes shared by the Hero section */

/** Shared soft-glow filter for the floating shapes */
const GlowFilter: React.FC<{ id: string }> = ({ id }) => (
  <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="var(--primary)" floodOpacity="0.28" />
  </filter>
);

/** Open book — gradient-filled with glow, floats near the visual */
export const BookShape: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 90" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="book-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
        <stop offset="100%" stopColor="var(--gold-500, #b8860b)" stopOpacity="0.10" />
      </linearGradient>
      <GlowFilter id="book-glow" />
    </defs>
    <g filter="url(#book-glow)">
      <path
        d="M60 16C48 6 27 4 10 8v64c17-4 38-2 50 8 12-10 33-12 50-8V8C93 4 72 6 60 16Z"
        fill="url(#book-g)"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M60 16v64" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21 25c9-1.5 19-.5 28 3M21 39c9-1.5 19-.5 28 3M21 53c9-1.5 19-.5 28 3"
        stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <path d="M71 28c9-3.5 19-4.5 28-3M71 42c9-3.5 19-4.5 28-3M71 56c9-3.5 19-4.5 28-3"
        stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
    </g>
    {/* Reading spark above the book */}
    <circle cx="98" cy="10" r="3" fill="var(--gold-500, #b8860b)" opacity="0.7" />
  </svg>
);

/** Fountain pen — tilted, gradient accent + glow */
export const PenShape: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 140 140" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="pen-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
        <stop offset="100%" stopColor="var(--gold-500, #b8860b)" stopOpacity="0.12" />
      </linearGradient>
      <GlowFilter id="pen-glow" />
    </defs>
    <g transform="rotate(38 70 70)" filter="url(#pen-glow)">
      <rect x="58" y="8" width="24" height="86" rx="10" fill="url(#pen-g)" stroke="var(--primary)" strokeWidth="2.5" />
      <rect x="58" y="30" width="24" height="6" fill="var(--primary)" opacity="0.3" />
      <path d="M58 94c0 14 12 30 12 30s12-16 12-30H58Z" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="70" cy="104" r="3" fill="var(--primary)" />
      <rect x="63" y="2" width="14" height="8" rx="3" fill="var(--gold-500, #b8860b)" opacity="0.85" stroke="var(--primary)" strokeWidth="2" />
    </g>
    {/* Ink trail from the nib */}
    <motion.path
      d="M96 118c14 4 26 2 34-4"
      stroke="var(--primary)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="2 7"
      opacity="0.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
    />
  </svg>
);

/** Hand-drawn curved dashed arrow pointing at the primary CTA */
export const DoodleArrow: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
    <motion.path
      d="M112 8C96 40 66 62 14 66"
      stroke="var(--primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="7 7"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.6, delay: 1, ease: 'easeOut' }}
    />
    <path
      d="M30 54L12 67l20 6"
      stroke="var(--primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Four-point sparkle */
export const Sparkle: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
    <path d="M12 2c1 5.5 4.5 9 10 10-5.5 1-9 4.5-10 10-1-5.5-4.5-9-10-10 5.5-1 9-4.5 10-10Z" fill="var(--primary)" opacity="0.65" />
  </svg>
);

/** Quill glyph drawn next to the H1 line */
export const QuillGlyph: React.FC = () => (
  <svg viewBox="0 0 32 32" fill="none" className="inline-block h-7 w-7 align-middle sm:h-9 sm:w-9" aria-hidden="true">
    <path
      d="M6 26C8 14 16 6 28 4c-1 12-8 20-19 21l-3 1Z"
      fill="var(--primary-soft)"
      stroke="var(--primary)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M6 26C11 19 17 13 24 8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Slow rotating double orbit ring with gradient orbs */
export const OrbitRing: React.FC<{ className?: string }> = ({ className }) => (
  <motion.svg
    viewBox="0 0 200 200"
    fill="none"
    className={className}
    aria-hidden="true"
    animate={{ rotate: 360 }}
    transition={{ duration: 46, repeat: Infinity, ease: 'linear' }}
  >
    <circle cx="100" cy="100" r="96" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 11" opacity="0.4" />
    <circle cx="100" cy="100" r="78" stroke="var(--gold-500, #b8860b)" strokeWidth="1" strokeDasharray="1 14" opacity="0.35" />
    <circle cx="100" cy="4" r="5" fill="var(--primary)" opacity="0.75" />
    <circle cx="178" cy="100" r="3.5" fill="var(--gold-500, #b8860b)" opacity="0.75" />
  </motion.svg>
);
