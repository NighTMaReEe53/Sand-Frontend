import React from 'react';

/**
 * Shared creative dashboard page header:
 * gold gradient medallion icon + decorative hatch/ring SVG vectors.
 */
export const PageHeader: React.FC<{
  /** unique id prefix for the SVG pattern */
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ id, icon: Icon, title, subtitle, action }) => (
  <div className="relative">
    {/* Background vector pattern */}
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -top-10 h-64 w-full text-gold-500 opacity-[0.05]"
      viewBox="0 0 1440 256"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <pattern id={`${id}-hatch`} width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="1440" height="256" fill={`url(#${id}-hatch)`} />
      <circle cx="1350" cy="16" r="140" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="90" cy="240" r="110" stroke="currentColor" strokeWidth="1.5" />
    </svg>

    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <span className="absolute -inset-2 rounded-2xl border border-dashed border-gold-500/30 rotate-6" aria-hidden />
          <div className="flex w-14 h-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold-glow">
            <Icon className="w-7 h-7 text-bg" strokeWidth={1.8} />
          </div>
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black font-din text-ink">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-ink-muted flex items-center gap-1.5 font-sst">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  </div>
);

/** Creative empty-state panel with medallion + vector decorations. */
export const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <div className="relative overflow-hidden p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-5">
    <svg aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 text-gold-500/10" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 7" />
      <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
    </svg>
    <svg aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 w-40 h-40 text-gold-500/10" viewBox="0 0 120 60" fill="none">
      {Array.from({ length: 12 }).map((_, i) => (
        <circle key={i} cx={10 + (i % 6) * 20} cy={i < 6 ? 18 : 42} r="2.4" fill="currentColor" />
      ))}
    </svg>

    <div className="relative mx-auto w-24 h-24">
      <span className="absolute inset-0 rounded-full bg-gold-500/10 animate-ping opacity-30" style={{ animationDuration: '2.6s' }} />
      <span className="absolute -inset-2.5 rounded-full border-2 border-dashed border-gold-500/25 rotate-12" />
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 shadow-gold-glow">
        <Icon className="w-11 h-11 text-bg" strokeWidth={1.6} />
      </div>
    </div>
    <h3 className="text-lg font-bold font-display text-ivory">{title}</h3>
    {description && (
      <p className="text-xs text-ivory-muted max-w-sm mx-auto leading-relaxed">{description}</p>
    )}
    {action}
  </div>
);
