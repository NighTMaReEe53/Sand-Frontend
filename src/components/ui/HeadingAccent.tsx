import React, { useId } from 'react';

type AccentVariant = 'arrow' | 'wave' | 'fade' | 'dots' | 'diamond';

interface HeadingAccentProps {
  /** Visual style — use a different one per section so headings feel varied */
  variant?: AccentVariant;
  className?: string;
}

/**
 * Decorative gold accents placed under headings.
 * Several modern shapes — vary them between sections instead of repeating one.
 */
export const HeadingAccent: React.FC<HeadingAccentProps> = ({
  variant = 'wave',
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');

  const base = 'block mt-1.5 mb-2 h-2 text-gold-500';

  if (variant === 'fade') {
    return (
      <svg
        viewBox="0 0 120 6"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        className={`${base} w-28 ${className}`}
      >
        <defs>
          <linearGradient id={`fade-${uid}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="70%" stopColor="currentColor" stopOpacity="0.95" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect width="120" height="6" rx="3" fill={`url(#fade-${uid})`} />
      </svg>
    );
  }

  if (variant === 'dots') {
    return (
      <svg
        viewBox="0 0 120 8"
        fill="none"
        aria-hidden="true"
        className={`${base} w-24 ${className}`}
      >
        <line x1="118" y1="4" x2="52" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
        {[40, 28, 16].map((cx, i) => (
          <circle key={cx} cx={cx} cy="4" r={3 - i * 0.8} fill="currentColor" opacity={0.75 - i * 0.25} />
        ))}
      </svg>
    );
  }

  if (variant === 'diamond') {
    return (
      <svg
        viewBox="0 0 120 10"
        fill="none"
        aria-hidden="true"
        className={`${base} w-24 ${className}`}
      >
        <rect x="55" y="1" width="8" height="8" rx="1.5" transform="rotate(45 59 5)" fill="currentColor" opacity="0.9" />
        <line x1="48" y1="5" x2="4" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
        <line x1="72" y1="5" x2="116" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }

  if (variant === 'arrow') {
    return (
      <svg
        viewBox="0 0 96 8"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
        className={`${base} w-20 sm:w-24 ${className}`}
      >
        <path d="M94 4 C 66 7.5, 34 0.5, 11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        <path d="M15 1 L 7 4 L 14.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 'wave' — soft double curve (default)
  return (
    <svg
      viewBox="0 0 120 8"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
      className={`${base} w-24 ${className}`}
    >
      <path
        d="M2 5 C 22 1, 38 9, 58 5 S 98 1, 118 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
};
