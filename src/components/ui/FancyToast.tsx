import React from 'react';
import { X } from 'lucide-react';

export interface FancyToastProps {
  /** small colored chip text (e.g. نوع الإشعار) */
  label?: string;
  title: string;
  body?: string;
  /** lucide icon element */
  icon: React.ElementType;
  /** accent color (hex) used for the icon bubble / chips / progress */
  color?: string;
  /** soft tinted background for the icon bubble */
  iconBg?: string;
  /** auto-dismiss duration in ms — drives the countdown bar */
  duration?: number;
  onClose: () => void;
  onClick?: () => void;
  actionText?: string;
}

/**
 * Creative white-background toast with decorative SVG vectors:
 * dashed rings, dots grid, a flowing wave, soft gradient blobs and a shimmer.
 * Used for notifications and important alerts.
 */
export const FancyToast: React.FC<FancyToastProps> = ({
  label,
  title,
  body,
  icon: Icon,
  color = '#d4af37',
  iconBg,
  duration = 8000,
  onClose,
  onClick,
  actionText = 'فتح',
}) => {
  const bubbleBg = iconBg ?? `${color}1F`;

  return (
    <div
      className="fancy-toast"
      style={{ '--ft-accent': color, '--ft-duration': `${duration}ms` } as React.CSSProperties}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      {/* ── Decorative vector layer ─────────────────────────────── */}
      <div className="ft-vectors" aria-hidden>
        {/* soft corner blobs */}
        <span className="ft-blob ft-blob-1" />
        <span className="ft-blob ft-blob-2" />
        {/* dashed concentric rings */}
        <svg className="ft-rings" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.4" strokeDasharray="5 7" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" opacity="0.55" strokeDasharray="3 6" />
        </svg>
        {/* dots grid */}
        <svg className="ft-dots" viewBox="0 0 120 60" fill="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={i} cx={10 + (i % 6) * 20} cy={i < 6 ? 18 : 42} r="2.6" fill="currentColor" />
          ))}
        </svg>
        {/* flowing wave */}
        <svg className="ft-wave" viewBox="0 0 200 60" fill="none" preserveAspectRatio="none">
          <path d="M0 40 Q 35 8 75 32 T 150 28 T 220 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M0 52 Q 40 24 85 44 T 160 38 T 225 30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
        </svg>
        {/* floating sparkles */}
        <svg className="ft-spark ft-spark-1" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
        </svg>
        <svg className="ft-spark ft-spark-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
        </svg>
        {/* top accent line + shimmer */}
        <span className="ft-topline" />
        <span className="ft-shimmer" />
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <button type="button" className="ft-close" aria-label="إغلاق" onClick={(e) => { e.stopPropagation(); onClose(); }}>
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3.5 relative z-[2]">
        <div className="ft-icon-bubble" style={{ backgroundColor: bubbleBg, borderColor: `${color}73` }}>
          <Icon className="w-5 h-5" style={{ color }} />
          <span className="ft-unread-dot" style={{ backgroundColor: color }} />
        </div>

        <div className="flex-1 min-w-0 pl-7">
          <div className="flex items-center justify-between gap-2">
            {label && (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ color, backgroundColor: bubbleBg, border: `1px solid ${color}59` }}
              >
                {label}
              </span>
            )}
            <span className="text-[10px] font-bold text-neutral-400">الآن</span>
          </div>
          <p className="mt-1.5 text-[13px] font-black text-neutral-900 line-clamp-1">{title}</p>
          {body && <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 line-clamp-2">{body}</p>}
          <span className="ft-action inline-flex items-center gap-1 mt-2.5" style={{ color, borderColor: `${color}73`, backgroundColor: bubbleBg }}>
            {actionText}
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5m7-7l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      {/* countdown bar */}
      <div className="ft-progress-track">
        <div className="ft-progress-bar" />
      </div>
    </div>
  );
};
