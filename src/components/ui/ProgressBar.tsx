import React from 'react';

interface ProgressBarProps {
  /** 0..100 */
  value: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

/**
 * Modern progress bar: inset-shadow track, tone-aware gradient fill
 * (gold → red-amber for low values) and a subtle diagonal shimmer.
 * Percentage label uses the mono face for a crisp dashboard feel.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  const tone = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  const fills: Record<string, string> = {
    high: 'linear-gradient(to left, var(--secondary), var(--gold-bright))',
    mid: 'linear-gradient(to left, var(--primary-strong), var(--gold))',
    low: 'linear-gradient(to left, #ef4444, #f59e0b)',
  };

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <div
        className={`relative flex-1 overflow-hidden rounded-full ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--ink) 14%, transparent)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.18)',
        }}
        dir="ltr"
      >
        <div
          className="relative h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: fills[tone] }}
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full opacity-35"
            style={{
              backgroundImage:
                'repeating-linear-gradient(-45deg, rgba(255,255,255,0.4) 0 4px, transparent 4px 9px)',
            }}
          />
        </div>
      </div>
      {showLabel && (
        <span
          className="w-10 shrink-0 text-left text-[0.68rem] font-bold text-ivory"
          dir="ltr"
        >
          {pct}%
        </span>
      )}
    </div>
  );
};
