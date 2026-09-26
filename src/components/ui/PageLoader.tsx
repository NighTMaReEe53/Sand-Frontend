import React from 'react';
import { cn } from '../../lib/utils';

interface PageLoaderProps {
  /** Short label under the logo (e.g. «جاري تحميل الكورسات…») */
  label?: string;
  /** Fullscreen fixed overlay — blocks the whole page while loading */
  fullscreen?: boolean;
  /** Minimum height of the inline variant */
  className?: string;
}

/**
 * Creative centered loader: the platform logo wrapped in two counter-rotating
 * conic rings, orbiting satellite dots, a shine sweeping over the logo and
 * a breathing gold glow beneath it.
 */
const PageLoaderBase: React.FC<PageLoaderProps> = ({
  label = 'جاري التحميل…',
  fullscreen = false,
  className,
}) => {
  const logo = (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {/* breathing glow */}
      <span className="pl-glow absolute inset-2 rounded-full bg-gold-500/30 blur-xl" />

      {/* twinkling sparkles scattered around */}
      {[
        { c: 'right-0 top-1', d: '0s', s: 'h-1.5 w-1.5' },
        { c: 'left-2 top-6', d: '.5s', s: 'h-1 w-1' },
        { c: 'left-0 bottom-4', d: '.9s', s: 'h-1.5 w-1.5' },
        { c: 'right-3 bottom-0', d: '1.3s', s: 'h-1 w-1' },
      ].map((p, i) => (
        <span
          key={i}
          className={`pl-dot absolute ${p.c} ${p.s} rounded-full bg-secondary`}
          style={{ animationDelay: p.d }}
          aria-hidden="true"
        />
      ))}

      {/* rotating dashed ring (SVG — crisp dashes) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="pl-orbit absolute inset-0 h-full w-full opacity-50"
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(201,161,90,0.55)" strokeWidth="1" strokeDasharray="2 7" strokeLinecap="round" />
      </svg>

      {/* outer dashed ring — counter rotating conic sweep */}
      <span className="pl-ring-rev absolute inset-0 rounded-full [mask:radial-gradient(farthest-side,transparent_calc(100%-3px),#000_calc(100%-3px))]" />
      {/* outer orbiting dot pair */}
      <span className="pl-orbit absolute inset-0">
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(201,161,90,0.9)]" />
        <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-sky-400/80" />
      </span>

      {/* inner ring — fast conic sweep */}
      <span className="pl-ring absolute inset-3 rounded-full [mask:radial-gradient(farthest-side,transparent_calc(100%-2.5px),#000_calc(100%-2.5px))]" />
      {/* inner orbiting dot */}
      <span className="pl-orbit-rev absolute inset-3">
        <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-secondary" />
      </span>

      {/* logo disc with shine sweep */}
      <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border border-gold-500/40 bg-bg-elevated shadow-gold-glow">
        <img
          src="/image/logo.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-full w-full object-contain p-1.5"
        />
        {/* diagonal shine crossing the logo */}
        <span className="pl-logo-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      </div>
    </div>
  );

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex flex-col items-center justify-center gap-5',
        fullscreen &&
          'fixed inset-0 z-[9999] bg-bg/85 backdrop-blur-sm',
        !fullscreen && 'min-h-[60vh]',
        className
      )}
    >
      {logo}
      <div className="flex flex-col items-center gap-2.5">
        <div className="flex items-center gap-1.5" dir="ltr">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="pl-dot h-2 w-2 rounded-full bg-gold-400"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
        <p className="font-amiri text-sm font-bold text-gold-300/90">{label}</p>
      </div>
    </div>
  );

  if (fullscreen) {
    return <div className="fixed inset-0 z-[9999]">{content}</div>;
  }
  return content;
};

export const PageLoader = React.memo(PageLoaderBase);
