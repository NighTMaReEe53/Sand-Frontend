import React from 'react';
import {
  PlayCircle,
  ListChecks,
  Timer,
  Map,
  FileText,
  BellRing,
  Zap,
  MessagesSquare,
  BarChart3,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react';

/** Platform features shown as endless flowing ribbons */
const FEATURES: Array<{ icon: LucideIcon; label: string; accent: string }> = [
  { icon: PlayCircle, label: 'شروحات فيديو بجودة عالية', accent: '#C9A15A' },
  { icon: ListChecks, label: 'بنك أسئلة تفاعلي', accent: '#38BDF8' },
  { icon: Timer, label: 'اختبارات فورية بعد كل درس', accent: '#34D399' },
  { icon: Map, label: 'خرائط ذهنية وتاريخية', accent: '#C084FC' },
  { icon: FileText, label: 'ملخصات PDF قابلة للتحميل', accent: '#F472B6' },
  { icon: BellRing, label: 'متابعة دورية لولي الأمر', accent: '#FBBF24' },
  { icon: Zap, label: 'مراجعات نهائية مكثفة', accent: '#22D3EE' },
  { icon: MessagesSquare, label: 'دعم مباشر للاستفسارات', accent: '#A3E635' },
  { icon: BarChart3, label: 'تتبع الدرجات والحضور', accent: '#FB923C' },
  { icon: BadgeCheck, label: 'محتوى بمواصفات الوزارة', accent: '#E879F9' },
];

/** Spacing between pills — must match the group's tail padding exactly */
const PILL_SPACING = 'mx-2';

const MarqueeItem: React.FC<{ icon: LucideIcon; label: string; accent: string }> = ({ icon: Icon, label, accent }) => (
  <span
    className={`group inline-flex shrink-0 items-center gap-2.5 rounded-full border bg-surface-card/70 py-2 pl-5 pr-2 transition-colors duration-300 ${PILL_SPACING}`}
    style={{ borderColor: `${accent}33` }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${accent}66`)}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${accent}33`)}
  >
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${accent}1f`, color: accent }}
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
    </span>
    <span dir="rtl" className="whitespace-nowrap text-sm font-bold" style={{ color: 'var(--ink)' }}>
      {label}
    </span>
  </span>
);

/**
 * One infinite ribbon.
 * Bulletproof loop recipe:
 *  - the track holds TWO pixel-identical copies of the pill set
 *  - the animation slides the track by exactly one copy (-50%)
 *  - because both copies are identical, the wrap-around is invisible
 *  - `will-change: translate3d` keeps it on the GPU (no jank)
 */
const MarqueeRow: React.FC<{ items: typeof FEATURES; reverse?: boolean; duration: number }> = ({
  items,
  reverse = false,
  duration,
}) => (
  <div
    dir="ltr"
    className="overflow-hidden py-1"
    style={{
      // fade out both edges so ribbons melt into the page
      maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
    }}
  >
    <div
      className="marquee-track flex w-max"
      style={{
        animation: `feature-marquee-slide ${duration}s linear infinite`,
        animationDirection: reverse ? 'reverse' : 'normal',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* copy A */}
      <div aria-hidden="false" className="flex shrink-0 items-center">
        {items.map((f) => (
          <MarqueeItem key={f.label} {...f} />
        ))}
      </div>
      {/* copy B — exact clone, makes -50% wrap seamless */}
      <div aria-hidden="true" className="flex shrink-0 items-center">
        {items.map((f) => (
          <MarqueeItem key={`clone-${f.label}`} {...f} />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Creative double-ribbon marquee: two rows of feature pills flow in
 * opposite directions on a gently tilted band. Pauses on hover.
 */
export const FeatureMarquee: React.FC = () => {
  const rowA = FEATURES.slice(0, 5);
  const rowB = FEATURES.slice(5);

  return (
    <section aria-label="مميزات المنصة" className="relative overflow-hidden py-4">
      <style>{`
        @keyframes feature-marquee-slide {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        /* hover anywhere on the band freezes BOTH rows together */
        .marquee-band:hover .marquee-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none !important; }
        }
      `}</style>

      {/* faint glow behind the band */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(201,161,90,0.07), transparent 65%)' }}
      />

      <div className="marquee-band relative -rotate-1 space-y-3">
        <MarqueeRow items={rowA} duration={36} />
        <MarqueeRow items={rowB} duration={44} reverse />
      </div>
    </section>
  );
};
