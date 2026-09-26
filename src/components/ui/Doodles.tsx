import React from 'react';
import { motion } from 'framer-motion';

/* ════════════════════════════════════════════════════════════ */
/*  Shared decorative study-themed SVG illustrations            */
/*  Used across result / live-room / profile surfaces           */
/* ════════════════════════════════════════════════════════════ */

/** Stack of three stylized books */
export const BookStackSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 140 110" fill="none" className={className}>
    <rect x="14" y="78" width="112" height="20" rx="6" fill="url(#bkGold)" opacity="0.9" />
    <rect x="14" y="78" width="18" height="20" rx="6" fill="#0d0d0f" opacity="0.45" />
    <line x1="44" y1="84" x2="116" y2="84" stroke="#0d0d0f" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
    <line x1="52" y1="91" x2="108" y2="91" stroke="#0d0d0f" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
    <rect x="26" y="54" width="94" height="20" rx="6" fill="url(#bkEmerald)" />
    <rect x="102" y="54" width="18" height="20" rx="6" fill="#0d0d0f" opacity="0.4" />
    <line x1="38" y1="60" x2="92" y2="60" stroke="#0d0d0f" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
    <line x1="44" y1="67" x2="86" y2="67" stroke="#0d0d0f" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
    <g transform="rotate(-6 70 40)">
      <rect x="30" y="30" width="82" height="19" rx="5" fill="url(#bkSky)" />
      <rect x="30" y="30" width="16" height="19" rx="5" fill="#0d0d0f" opacity="0.4" />
      <line x1="56" y1="36" x2="102" y2="36" stroke="#0d0d0f" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      <line x1="62" y1="43" x2="96" y2="43" stroke="#0d0d0f" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
    </g>
    <path d="M126 22l2.2 5 5 2.2-5 2.2-2.2 5-2.2-5-5-2.2 5-2.2z" fill="#d4af37" opacity="0.85" />
    <circle cx="10" cy="34" r="3" stroke="#d4af37" strokeWidth="2" opacity="0.6" />
    <defs>
      <linearGradient id="bkGold" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#e8c96a" /><stop offset="1" stopColor="#b8860b" />
      </linearGradient>
      <linearGradient id="bkEmerald" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#6ee7b7" /><stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="bkSky" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#93c5fd" /><stop offset="1" stopColor="#2563eb" />
      </linearGradient>
    </defs>
  </svg>
);

/** Classic diagonal pencil drawing a dotted line */
export const PencilSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 90 90" fill="none" className={className}>
    <g transform="rotate(42 45 45)">
      <rect x="37" y="8" width="16" height="50" rx="2" fill="url(#pnGold)" />
      <line x1="42" y1="10" x2="42" y2="57" stroke="#0d0d0f" strokeWidth="1.6" opacity="0.25" />
      <line x1="48" y1="10" x2="48" y2="57" stroke="#0d0d0f" strokeWidth="1.6" opacity="0.25" />
      <rect x="37" y="4" width="16" height="7" rx="2" fill="#9ca3af" />
      <rect x="37" y="2" width="16" height="4" rx="2" fill="#d1d5db" />
      <path d="M37 58 L53 58 L45 74 Z" fill="#fcd34d" />
      <path d="M42 68 L48 68 L45 74 Z" fill="#1f2937" />
    </g>
    <path d="M14 80 C 32 74, 58 86, 78 78" stroke="url(#pnLine)" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
    <defs>
      <linearGradient id="pnGold" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#f0d488" /><stop offset="0.5" stopColor="#d4af37" /><stop offset="1" stopColor="#8a6508" />
      </linearGradient>
      <linearGradient id="pnLine" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#d4af37" /><stop offset="1" stopColor="#34d399" />
      </linearGradient>
    </defs>
  </svg>
);

/** Hand-drawn style curved arrow pointing left (RTL forward) */
export const CurvedArrowSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 60" fill="none" className={className}>
    <path d="M112 12 C 88 46, 46 52, 16 34" stroke="url(#arGrad)" strokeWidth="4" strokeLinecap="round" />
    <path d="M28 22 L14 33 L30 44" stroke="#d4af37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="112" cy="12" r="5" fill="#34d399" opacity="0.9" />
    <defs>
      <linearGradient id="arGrad" x1="1" y1="0" x2="0" y2="1">
        <stop stopColor="#34d399" /><stop offset="1" stopColor="#d4af37" />
      </linearGradient>
    </defs>
  </svg>
);

/** Dotted grid pattern */
export const DotsPatternSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 120" className={className}>
    {Array.from({ length: 6 }).map((_, row) =>
      Array.from({ length: 6 }).map((_, col) => (
        <circle
          key={`${row}-${col}`}
          cx={10 + col * 20}
          cy={10 + row * 20}
          r="2.4"
          fill="#d4af37"
          opacity={(row + col) % 3 === 0 ? 0.55 : 0.2}
        />
      ))
    )}
  </svg>
);

/** Graduation cap doodle with tassel */
export const CapDoodleSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 80" fill="none" className={className}>
    <path d="M50 14 L92 32 L50 50 L8 32 Z" fill="url(#cpGold)" />
    <path d="M24 39 v16 c0 8 12 14 26 14 s26-6 26-14 V39 L50 50 Z" fill="url(#cpDark)" opacity="0.9" />
    <line x1="88" y1="34" x2="88" y2="58" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
    <circle cx="88" cy="63" r="5" fill="#34d399" />
    <defs>
      <linearGradient id="cpGold" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#efd182" /><stop offset="1" stopColor="#a87f10" />
      </linearGradient>
      <linearGradient id="cpDark" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#c9a227" /><stop offset="1" stopColor="#6b520a" />
      </linearGradient>
    </defs>
  </svg>
);

/** Outlined circle + triangle + square shapes cluster */
export const ShapesClusterSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 110 90" fill="none" className={className}>
    <circle cx="30" cy="30" r="18" stroke="#d4af37" strokeWidth="3" opacity="0.7" />
    <rect x="58" y="14" width="30" height="30" rx="7" stroke="#34d399" strokeWidth="3" transform="rotate(12 73 29)" opacity="0.65" />
    <path d="M22 72 L40 46 L58 72 Z" stroke="#93c5fd" strokeWidth="3" strokeLinejoin="round" opacity="0.65" />
    <path d="M76 62 l4 8 8 4-8 4-4 8-4-8-8-4 8-4z" fill="#d4af37" opacity="0.8" />
  </svg>
);

/** Big illustration: open book + pencil + arrow + shapes (empty states) */
export const EmptyStateIllustrationSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 260 160" fill="none" className={className}>
    <path d="M70 110 C 95 96, 120 96, 130 104 C 140 96, 165 96, 190 110 L190 52 C 165 38, 140 38, 130 48 C 120 38, 95 38, 70 52 Z" fill="url(#esPage)" stroke="#d4af37" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M130 48 L130 104" stroke="#d4af37" strokeWidth="2.5" />
    <line x1="84" y1="62" x2="118" y2="58" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <line x1="84" y1="74" x2="118" y2="70" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    <line x1="84" y1="86" x2="112" y2="82" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    <line x1="142" y1="58" x2="176" y2="62" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <line x1="142" y1="70" x2="176" y2="74" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    <line x1="142" y1="82" x2="168" y2="86" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
    <g transform="rotate(-34 210 70)">
      <rect x="203" y="34" width="13" height="44" rx="2" fill="url(#esPencil)" />
      <rect x="203" y="28" width="13" height="7" rx="2" fill="#9ca3af" />
      <path d="M203 78 L216 78 L209.5 92 Z" fill="#fcd34d" />
      <path d="M207 87 L212 87 L209.5 92 Z" fill="#1f2937" />
    </g>
    <path d="M236 122 C 214 146, 176 150, 148 136" stroke="url(#esArrow)" strokeWidth="4" strokeLinecap="round" />
    <path d="M162 126 L146 135 L164 146" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="36" cy="36" r="16" stroke="#93c5fd" strokeWidth="3" opacity="0.6" />
    <path d="M226 22 l3 6.5 6.5 3-6.5 3-3 6.5-3-6.5-6.5-3 6.5-3z" fill="#d4af37" opacity="0.85" />
    <rect x="18" y="112" width="24" height="24" rx="6" stroke="#34d399" strokeWidth="3" transform="rotate(-10 30 124)" opacity="0.55" />
    <circle cx="244" cy="76" r="4" fill="#f87171" opacity="0.7" />
    <defs>
      <linearGradient id="esPage" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#fdf6e3" /><stop offset="1" stopColor="#e8d9ae" />
      </linearGradient>
      <linearGradient id="esPencil" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#f0d488" /><stop offset="0.5" stopColor="#d4af37" /><stop offset="1" stopColor="#8a6508" />
      </linearGradient>
      <linearGradient id="esArrow" x1="1" y1="0" x2="0" y2="1">
        <stop stopColor="#34d399" /><stop offset="1" stopColor="#d4af37" />
      </linearGradient>
    </defs>
  </svg>
);

/** Hand-drawn sketchy X mark — the mistakes-page signature */
export const WrongCrossSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 80 80" fill="none" className={className}>
    <path d="M15 17 C 29 31, 49 51, 65 65" stroke="#f87171" strokeWidth="8" strokeLinecap="round" />
    <path d="M18 20 C 31 33, 48 51, 62 63" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <path d="M65 15 C 51 31, 31 51, 15 65" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
    <path d="M62 18 C 50 32, 33 51, 19 61" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
  </svg>
);

/** Hand-drawn sketchy check mark */
export const CorrectCheckSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 80 80" fill="none" className={className}>
    <path d="M12 44 C 22 52, 28 60, 32 66 C 42 46, 56 26, 70 12" stroke="#34d399" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 45 C 24 52, 29 58, 33 63 C 42 45, 54 28, 67 15" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
  </svg>
);

/** Tilted exam paper with a big circled X — hero centerpiece */
export const MistakePaperSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 190 210" fill="none" className={className}>
    <g transform="rotate(-7 95 105)">
      <rect x="35" y="18" width="120" height="164" rx="10" fill="url(#mpSheet)" stroke="#d4af37" strokeWidth="2.5" />
      <path d="M155 18 L155 44 L129 18 Z" fill="#c9a227" opacity="0.85" />
      {/* ruled lines */}
      <line x1="52" y1="44" x2="138" y2="44" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="52" y1="60" x2="122" y2="60" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.28" />
      <line x1="52" y1="76" x2="132" y2="76" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      {/* circled X */}
      <path d="M74 118 C 82 106, 96 96, 108 92 M110 94 C 100 104, 88 118, 80 132 M112 130 C 102 122, 90 110, 78 98 M76 96 C 88 108, 100 120, 114 132"
        stroke="none" />
      <path d="M79 103 L111 127 M111 103 L79 127" stroke="#ef4444" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="95" cy="115" rx="30" ry="22" stroke="#f87171" strokeWidth="3.5" fill="none"
        strokeDasharray="150 40" strokeLinecap="round" transform="rotate(-8 95 115)" />
      {/* grade box */}
      <rect x="52" y="148" width="86" height="18" rx="6" fill="#0d0d0f" opacity="0.12" />
      <line x1="60" y1="157" x2="100" y2="157" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    </g>
    <circle cx="168" cy="176" r="5" fill="#f87171" opacity="0.75" />
    <circle cx="24" cy="40" r="4" fill="#f87171" opacity="0.5" />
    <defs>
      <linearGradient id="mpSheet" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#fdf6e3" /><stop offset="1" stopColor="#ecdcb4" />
      </linearGradient>
    </defs>
  </svg>
);

/** Celebration illustration: corrected paper with a big green check (empty state) */
export const PerfectScoreSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 220 160" fill="none" className={className}>
    <g transform="rotate(5 110 80)">
      <rect x="55" y="16" width="110" height="140" rx="10" fill="url(#psSheet)" stroke="#d4af37" strokeWidth="2.5" />
      <line x1="72" y1="42" x2="148" y2="42" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      <line x1="72" y1="58" x2="134" y2="58" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.28" />
      <line x1="72" y1="74" x2="142" y2="74" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" opacity="0.2" />
      <path d="M84 108 C 93 116, 99 124, 104 131 C 113 112, 126 96, 141 84" stroke="#34d399" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <path d="M196 36 l3.4 7.4 7.4 3.4-7.4 3.4-3.4 7.4-3.4-7.4-7.4-3.4 7.4-3.4z" fill="#d4af37" opacity="0.9" />
    <path d="M28 96 l2.6 5.6 5.6 2.6-5.6 2.6-2.6 5.6-2.6-5.6-5.6-2.6 5.6-2.6z" fill="#34d399" opacity="0.85" />
    <circle cx="38" cy="30" r="12" stroke="#d4af37" strokeWidth="3" opacity="0.6" />
    <defs>
      <linearGradient id="psSheet" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#fdf6e3" /><stop offset="1" stopColor="#e8d9ae" />
      </linearGradient>
    </defs>
  </svg>
);

/** Hero scene: hand-drawn ✗ → dashed arrow → ✓ (the mistakes-page metaphor) */
export const XToCheckSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 270 150" fill="none" className={className}>
    {/* wrong X */}
    <g transform="rotate(-5 52 60)">
      <path d="M30 34 C 42 46, 54 60, 68 76" stroke="#f87171" strokeWidth="9" strokeLinecap="round" />
      <path d="M33 37 C 44 48, 55 61, 65 73" stroke="#fecaca" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <path d="M68 34 C 56 48, 42 62, 28 76" stroke="#ef4444" strokeWidth="9" strokeLinecap="round" />
      <path d="M65 37 C 55 49, 44 63, 33 73" stroke="#fecaca" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </g>
    {/* dashed hand-drawn arc arrow */}
    <path d="M88 66 C 116 18, 162 14, 196 46" stroke="#d4af37" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 11" />
    <path d="M180 30 L199 50 L172 52" stroke="#d4af37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* correct check */}
    <g transform="rotate(3 225 62)">
      <path d="M196 66 C 206 74, 212 82, 217 89 C 226 68, 238 52, 252 40" stroke="#34d399" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M200 67 C 209 74, 214 81, 218 86 C 226 68, 236 55, 248 44" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </g>
    {/* sparkles */}
    <path d="M132 108 l3 6.5 6.5 3-6.5 3-3 6.5-3-6.5-6.5-3 6.5-3z" fill="#f87171" opacity="0.8" />
    <circle cx="228" cy="118" r="4.5" stroke="#34d399" strokeWidth="2.5" opacity="0.7" />
    <path d="M96 122 c 8 -8, 20 -8, 26 0" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
  </svg>
);

/** Faint tiled X background pattern */
export const XPatternSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 140 140" className={className}>
    {Array.from({ length: 4 }).map((_, row) =>
      Array.from({ length: 4 }).map((_, col) => (
        <g key={`${row}-${col}`} opacity={(row + col) % 2 === 0 ? 0.5 : 0.22}>
          <path
            d={`M${16 + col * 36} ${10 + row * 36} l10 10 M${26 + col * 36} ${10 + row * 36} l-10 10`}
            stroke="#f87171"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </g>
      ))
    )}
  </svg>
);

/* ════════════════════════════════════════════════════════════ */
/*  Challenge-duel themed illustrations (result page)           */
/* ════════════════════════════════════════════════════════════ */

/** Golden victory trophy with laurel branches + confetti sparks */
export const VictoryTrophySvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 170" fill="none" className={className}>
    {/* laurel left */}
    <g opacity="0.85">
      <path d="M44 132 C 28 114, 22 92, 29 70" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
      <path d="M35 104 q-12 -2 -14 -13 q12 2 14 13z" fill="#34d399" opacity="0.75" />
      <path d="M31 86 q-12 -4 -12 -15 q11 5 12 15z" fill="#34d399" opacity="0.6" />
      <path d="M34 118 q-13 0 -17 -10 q13 0 17 10z" fill="#34d399" opacity="0.65" />
    </g>
    {/* laurel right (mirrored) */}
    <g opacity="0.85" transform="translate(200,0) scale(-1,1)">
      <path d="M44 132 C 28 114, 22 92, 29 70" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
      <path d="M35 104 q-12 -2 -14 -13 q12 2 14 13z" fill="#34d399" opacity="0.75" />
      <path d="M31 86 q-12 -4 -12 -15 q11 5 12 15z" fill="#34d399" opacity="0.6" />
      <path d="M34 118 q-13 0 -17 -10 q13 0 17 10z" fill="#34d399" opacity="0.65" />
    </g>
    {/* handles */}
    <path d="M67 46 C 48 46, 42 63, 56 74" stroke="#d4af37" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M133 46 C 152 46, 158 63, 144 74" stroke="#d4af37" strokeWidth="6" strokeLinecap="round" fill="none" />
    {/* cup */}
    <path d="M66 32 H134 V64 C134 89 118 103 100 103 C82 103 66 89 66 64 Z" fill="url(#vtGold)" stroke="#8a6508" strokeWidth="2.5" strokeLinejoin="round" />
    {/* star */}
    <path d="M100 47 l4 8.6 9.4 1.2 -6.9 6.6 1.8 9.3 -8.3-4.6 -8.3 4.6 1.8-9.3 -6.9-6.6 9.4-1.2 z" fill="#fff7d6" stroke="#8a6508" strokeWidth="1.5" strokeLinejoin="round" />
    {/* stem + base */}
    <rect x="93" y="103" width="14" height="13" fill="url(#vtGoldDark)" />
    <rect x="79" y="116" width="42" height="9" rx="3" fill="url(#vtGold)" stroke="#8a6508" strokeWidth="2" />
    <rect x="69" y="125" width="62" height="11" rx="4" fill="url(#vtGoldDark)" stroke="#8a6508" strokeWidth="2" />
    {/* shine */}
    <path d="M76 42 C 76 58, 80 72, 88 80" stroke="#fff7d6" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
    {/* confetti sparks */}
    <circle cx="26" cy="34" r="4" fill="#f87171" opacity="0.75" />
    <rect x="162" y="24" width="9" height="9" rx="2" fill="#93c5fd" transform="rotate(18 166 28)" opacity="0.85" />
    <path d="M172 96 l2.6 5.6 5.6 2.6 -5.6 2.6 -2.6 5.6 -2.6-5.6 -5.6-2.6 5.6-2.6z" fill="#d4af37" opacity="0.9" />
    <path d="M22 62 l2.2 4.8 4.8 2.2 -4.8 2.2 -2.2 4.8 -2.2-4.8 -4.8-2.2 4.8-2.2z" fill="#34d399" opacity="0.85" />
    <defs>
      <linearGradient id="vtGold" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#f5dd8e" /><stop offset="1" stopColor="#c9981a" />
      </linearGradient>
      <linearGradient id="vtGoldDark" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#d4af37" /><stop offset="1" stopColor="#8a6508" />
      </linearGradient>
    </defs>
  </svg>
);

/** Friendly robot buddy (bot opponent avatar) */
export const BotBuddySvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 96 96" fill="none" className={className}>
    <line x1="48" y1="10" x2="48" y2="20" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" />
    <circle cx="48" cy="8" r="4" fill="#34d399" />
    <rect x="14" y="34" width="8" height="15" rx="3" fill="#a87f10" />
    <rect x="74" y="34" width="8" height="15" rx="3" fill="#a87f10" />
    <rect x="22" y="20" width="52" height="41" rx="13" fill="url(#bbBody)" stroke="#8a6508" strokeWidth="2.5" />
    <rect x="30" y="29" width="36" height="19" rx="8" fill="#0d0d0f" opacity="0.88" />
    <circle cx="41" cy="38.5" r="3.6" fill="#6ee7b7" />
    <circle cx="55" cy="38.5" r="3.6" fill="#6ee7b7" />
    <path d="M41 52 q7 5.5 14 0" stroke="#8a6508" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="30" y="65" width="36" height="19" rx="8" fill="url(#bbBody)" opacity="0.92" stroke="#8a6508" strokeWidth="2" />
    <circle cx="48" cy="74" r="3.2" fill="#d4af37" />
    <path d="M80 12 l2 4.4 4.4 2 -4.4 2 -2 4.4 -2-4.4 -4.4-2 4.4-2z" fill="#d4af37" opacity="0.85" />
    <defs>
      <linearGradient id="bbBody" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#eed9a0" /><stop offset="1" stopColor="#c9981a" />
      </linearGradient>
    </defs>
  </svg>
);

/** Student avatar bust with graduation cap */
export const StudentAvatarSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 96 96" fill="none" className={className}>
    <circle cx="48" cy="48" r="40" fill="#d4af37" opacity="0.08" />
    <circle cx="48" cy="38" r="13" fill="#e8c96a" stroke="#8a6508" strokeWidth="2" />
    <path d="M28 32 L48 22 L68 32 L48 41 Z" fill="url(#saCap)" stroke="#8a6508" strokeWidth="1.8" strokeLinejoin="round" />
    <line x1="64" y1="34" x2="64" y2="46" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="64" cy="49" r="3" fill="#34d399" />
    <path d="M25 80 C 27 62, 37 53, 48 53 C 59 53, 69 62, 71 80 Z" fill="url(#saBody)" stroke="#065f46" strokeWidth="2" strokeLinejoin="round" />
    <path d="M42 55 L48 62 L54 55" stroke="#d1fae5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <defs>
      <linearGradient id="saCap" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#efd182" /><stop offset="1" stopColor="#a87f10" />
      </linearGradient>
      <linearGradient id="saBody" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#34d399" /><stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

/** Small winner crown */
export const CrownSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 72 48" fill="none" className={className}>
    <path d="M10 34 L6.5 11 L22 22.5 L36 5 L50 22.5 L65.5 11 L62 34 Z" fill="url(#crGold)" stroke="#8a6508" strokeWidth="2.2" strokeLinejoin="round" />
    <rect x="10" y="35" width="52" height="8" rx="3" fill="#a87f10" stroke="#8a6508" strokeWidth="1.8" />
    <circle cx="36" cy="30" r="3" fill="#34d399" />
    <circle cx="21" cy="30" r="2.4" fill="#f87171" />
    <circle cx="51" cy="30" r="2.4" fill="#93c5fd" />
    <defs>
      <linearGradient id="crGold" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#f5dd8e" /><stop offset="1" stopColor="#c9981a" />
      </linearGradient>
    </defs>
  </svg>
);

/** Circular VS badge with mini lightning bolts */
export const VsBoltSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <circle cx="32" cy="32" r="27" stroke="#d4af37" strokeWidth="2.4" strokeDasharray="5 6" strokeLinecap="round" />
    <text x="32" y="39" textAnchor="middle" fontSize="19" fontWeight="900" fill="#d4af37" style={{ fontFamily: 'inherit' }}>
      VS
    </text>
    <path d="M9 20 l-3.4 6.2 3.4 -0.6 -2 5.4" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M55 20 l3.4 6.2 -3.4 -0.6 2 5.4" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Balanced scale — the DRAW metaphor */
export const DrawScaleSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 150" fill="none" className={className}>
    <line x1="100" y1="34" x2="100" y2="104" stroke="#d4af37" strokeWidth="5" strokeLinecap="round" />
    <path d="M100 96 L80 126 L120 126 Z" fill="url(#dsDark)" stroke="#8a6508" strokeWidth="2" strokeLinejoin="round" />
    <rect x="66" y="126" width="68" height="9" rx="4" fill="url(#dsDark)" stroke="#8a6508" strokeWidth="2" />
    <line x1="36" y1="34" x2="164" y2="34" stroke="#d4af37" strokeWidth="6" strokeLinecap="round" />
    <circle cx="100" cy="34" r="6" fill="#34d399" stroke="#065f46" strokeWidth="2" />
    <line x1="36" y1="34" x2="36" y2="60" stroke="#8a6508" strokeWidth="2.5" />
    <line x1="164" y1="34" x2="164" y2="60" stroke="#8a6508" strokeWidth="2.5" />
    <path d="M16 60 A 20 20 0 0 0 56 60" stroke="#d4af37" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M144 60 A 20 20 0 0 0 184 60" stroke="#d4af37" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M30 48 l2 4.4 4.4 2 -4.4 2 -2 4.4 -2-4.4 -4.4-2 4.4-2z" fill="#34d399" opacity="0.85" />
    <path d="M158 48 l2 4.4 4.4 2 -4.4 2 -2 4.4 -2-4.4 -4.4-2 4.4-2z" fill="#34d399" opacity="0.85" />
    <path d="M92 16 l2.4 5.2 5.2 2.4 -5.2 2.4 -2.4 5.2 -2.4-5.2 -5.2-2.4 5.2-2.4z" fill="#d4af37" opacity="0.9" />
    <defs>
      <linearGradient id="dsDark" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#d4af37" /><stop offset="1" stopColor="#8a6508" />
      </linearGradient>
    </defs>
  </svg>
);

/** Comeback scene — pencil climbing from a book toward a victory flag */
export const ComebackSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 210 150" fill="none" className={className}>
    {/* closed book base */}
    <rect x="34" y="112" width="118" height="20" rx="6" fill="url(#cbBook)" stroke="#8a6508" strokeWidth="2.5" />
    <line x1="46" y1="122" x2="130" y2="122" stroke="#0d0d0f" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
    {/* climbing pencil */}
    <g transform="rotate(24 78 84)">
      <rect x="71" y="52" width="14" height="46" rx="2" fill="url(#cbPencil)" />
      <rect x="71" y="46" width="14" height="7" rx="2" fill="#9ca3af" />
      <path d="M71 98 L85 98 L78 112 Z" fill="#fcd34d" />
      <path d="M75 107 L81 107 L78 112 Z" fill="#1f2937" />
    </g>
    {/* little arms/legs effort marks */}
    <path d="M64 96 q-7 4 -6 12" stroke="#8a6508" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    {/* rising dashed path */}
    <path d="M96 104 C 116 74, 138 52, 164 38" stroke="#d4af37" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 9" />
    <path d="M148 30 L167 36 L156 52" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* flag at the summit */}
    <line x1="168" y1="36" x2="168" y2="10" stroke="#8a6508" strokeWidth="3" strokeLinecap="round" />
    <path d="M168 10 L192 16 L168 23 Z" fill="#f87171" stroke="#b91c1c" strokeWidth="1.5" strokeLinejoin="round" />
    {/* sweat-drop sparks */}
    <path d="M120 96 l2 4.4 4.4 2 -4.4 2 -2 4.4 -2-4.4 -4.4-2 4.4-2z" fill="#d4af37" opacity="0.85" />
    <circle cx="196" cy="52" r="4" stroke="#93c5fd" strokeWidth="2.4" opacity="0.8" />
    <defs>
      <linearGradient id="cbBook" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#e8c96a" /><stop offset="1" stopColor="#b8860b" />
      </linearGradient>
      <linearGradient id="cbPencil" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#f0d488" /><stop offset="0.5" stopColor="#d4af37" /><stop offset="1" stopColor="#8a6508" />
      </linearGradient>
    </defs>
  </svg>
);

/** Scattered confetti frame (transparent center — overlays banners) */
export const ConfettiBurstSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 400 240" preserveAspectRatio="none" className={className}>
    <rect x="24" y="22" width="10" height="10" rx="2" fill="#34d399" transform="rotate(24 29 27)" opacity="0.8" />
    <circle cx="70" cy="60" r="4" fill="#f87171" opacity="0.7" />
    <path d="M36 120 l3 6.4 6.4 3 -6.4 3 -3 6.4 -3-6.4 -6.4-3 6.4-3z" fill="#d4af37" opacity="0.85" />
    <rect x="60" y="190" width="11" height="11" rx="2.5" fill="#93c5fd" transform="rotate(-14 65 195)" opacity="0.75" />
    <path d="M110 34 q8 -8 16 0 q8 8 16 0" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
    <circle cx="330" cy="30" r="4.5" fill="#34d399" opacity="0.75" />
    <rect x="362" y="58" width="10" height="10" rx="2" fill="#f87171" transform="rotate(30 367 63)" opacity="0.75" />
    <path d="M372 130 l2.6 5.6 5.6 2.6 -5.6 2.6 -2.6 5.6 -2.6-5.6 -5.6-2.6 5.6-2.6z" fill="#93c5fd" opacity="0.85" />
    <path d="M320 196 q8 -8 16 0 q8 8 16 0" stroke="#34d399" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.65" />
    <rect x="250" y="214" width="10" height="10" rx="2" fill="#d4af37" transform="rotate(12 255 219)" opacity="0.8" />
    <circle cx="180" cy="222" r="4" fill="#d4af37" opacity="0.6" />
    <circle cx="140" cy="206" r="3" stroke="#f87171" strokeWidth="2.2" opacity="0.6" />
  </svg>
);

/** Twin stage-spotlight beams shining down from the top corners */
export const SpotlightBeamsSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 400 240" preserveAspectRatio="none" fill="none" className={className}>
    <g opacity="0.9">
      <path d="M46 -12 L138 -12 L216 250 L104 250 Z" fill="url(#slBeamL)" />
      <path d="M354 -12 L262 -12 L184 250 L296 250 Z" fill="url(#slBeamR)" />
      {/* lamp heads */}
      <rect x="74" y="-16" width="40" height="12" rx="5" fill="#d4af37" opacity="0.35" />
      <rect x="286" y="-16" width="40" height="12" rx="5" fill="#d4af37" opacity="0.35" />
    </g>
    <defs>
      <linearGradient id="slBeamL" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#f5dd8e" stopOpacity="0.16" />
        <stop offset="1" stopColor="#f5dd8e" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="slBeamR" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#f5dd8e" stopOpacity="0.16" />
        <stop offset="1" stopColor="#f5dd8e" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

/** Looping float wrapper for decorative SVGs */
export const Float: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 5, distance = 12, className }) => (
  <motion.div
    className={`pointer-events-none absolute ${className ?? ''}`}
    animate={{ y: [0, -distance, 0], rotate: [0, 2.5, 0] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);
