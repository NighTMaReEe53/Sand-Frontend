import React from 'react';
import { cn } from '../../lib/utils';
import { HeadingAccent } from './HeadingAccent';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type AccentVariant = 'arrow' | 'wave' | 'fade' | 'dots' | 'diamond';

interface SectionHeadingProps {
  /** Semantic heading level — pick the real level for a11y, styling adapts */
  as?: HeadingTag;
  /** Small decorative shape/arrow drawn under the heading */
  accent?: AccentVariant | 'none';
  /** Optional leading icon inside the heading row */
  icon?: React.ReactNode;
  /** Optional muted line under the heading + accent */
  subtitle?: React.ReactNode;
  /** Optional pill/badge rendered above the heading */
  badge?: React.ReactNode;
  align?: 'start' | 'center';
  /** Extra action slot rendered at the far end of the heading row */
  action?: React.ReactNode;
  /** Heading text/content */
  children: React.ReactNode;
  className?: string;
}

const TAG_STYLES: Record<HeadingTag, string> = {
  h1: 'text-2xl sm:text-4xl font-black',
  h2: 'text-xl sm:text-2xl font-bold',
  h3: 'text-lg sm:text-xl font-bold',
  h4: 'text-base sm:text-lg font-bold',
  h5: 'text-sm sm:text-base font-bold',
  h6: 'text-xs sm:text-sm font-bold',
};

/** Simple shapes drawn beside the heading when no underline accent is used */
const SideShape: React.FC<{ variant: AccentVariant }> = ({ variant }) => {
  if (variant === 'diamond') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-2.5 w-2.5 shrink-0 text-gold-500">
        <rect x="6" y="6" width="8" height="8" rx="1.5" transform="rotate(45 10 10)" fill="currentColor" opacity="0.9" />
      </svg>
    );
  }
  if (variant === 'dots') {
    return (
      <svg viewBox="0 0 34 10" fill="none" aria-hidden="true" className="h-2 w-8 shrink-0 text-gold-500">
        <circle cx="5" cy="5" r="3.5" fill="currentColor" opacity="0.9" />
        <circle cx="17" cy="5" r="2.5" fill="currentColor" opacity="0.6" />
        <circle cx="27" cy="5" r="1.8" fill="currentColor" opacity="0.35" />
      </svg>
    );
  }
  // arrow / wave / fade → small curved arrow pointing at the heading (RTL)
  return (
    <svg viewBox="0 0 44 24" fill="none" aria-hidden="true" className="-scale-x-100 mr-1 hidden h-5 w-9 shrink-0 text-gold-500 sm:block">
      <path d="M40 20 C 28 18, 14 14, 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 5" />
      <path d="M12 4 L 5 5 L 9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * Consistent, comfortable section headings.
 * Semantic tag (h1–h6) + optional icon/badge/subtitle/action +
 * a hand-drawn SVG shape (arrow, wave, dots…) that gives every
 * section a friendly, guided feel.
 *
 * <SectionHeading as="h2" accent="arrow" icon={<BookOpen/>}>عنوان</SectionHeading>
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  as: Tag = 'h2',
  accent = 'arrow',
  icon,
  subtitle,
  badge,
  align = 'start',
  action,
  className,
  children,
}) => {
  const centered = align === 'center';

  return (
    <div className={cn('space-y-1.5', centered && 'text-center', !centered && 'text-right', className)}>
      {badge && (
        <div className={cn('mb-1 flex', centered ? 'justify-center' : 'justify-start')}>{badge}</div>
      )}

      <div className={cn('flex items-center gap-3', centered && 'flex-col !items-center gap-1.5', action && !centered && 'justify-between')}>
        {/* heading row */}
        <div className="flex min-w-0 items-center gap-2">
          <SideShape variant={accent === 'none' ? 'arrow' : accent} />
          <Tag className={cn('font-din leading-snug text-ink', TAG_STYLES[Tag])}>
            <span className="inline-flex items-center gap-2">
              {icon}
              {children}
            </span>
          </Tag>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>

      {accent !== 'none' && (
        <HeadingAccent
          variant={accent === 'diamond' || accent === 'dots' ? accent : accent === 'arrow' ? 'wave' : accent}
          className={cn(centered ? 'mx-auto' : '', accent === 'arrow' ? 'w-24' : 'w-20')}
        />
      )}

      {subtitle && (
        <p className={cn('max-w-2xl text-xs leading-relaxed text-ink-muted sm:text-sm font-sst', centered && 'mx-auto')}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
