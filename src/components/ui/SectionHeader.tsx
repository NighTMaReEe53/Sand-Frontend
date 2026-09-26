import React from 'react';
import { BookOpen, PencilLine } from 'lucide-react';

interface SectionHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'center' | 'right';
  shape?: 'arc' | 'circle' | 'double' | 'swoosh';
  fontMix?: boolean;
  className?: string;
}

/**
 * Creative section title block:
 *  - eyebrow in the handwritten face flanked by glowing dots
 *  - big display title with 3-font mix (ITC Handel Gothic, Retro Brush Arabic, FunPlay Arabic)
 *  - a book → line → pencil flourish under it (icons gently animate)
 *  - optional description
 * Everything is plain CSS/Lucide — no scroll-triggered hiding.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  shape = 'arc',
  fontMix = false,
  className = '',
}) => {
  const renderMixedTitle = (titleContent: React.ReactNode) => {
    if (!fontMix || typeof titleContent !== 'string') {
      return titleContent;
    }

    const words = titleContent.trim().split(' ');
    if (words.length <= 2) {
      return titleContent;
    }

    // Clean, prestigious headline rhythm:
    // Leading words in crisp DIN Next LT Arabic, and the final focal word emphasized in Amira
    const leadingWords = words.slice(0, -1).join(' ');
    const lastWord = words[words.length - 1];

    return (
      <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
        <span className="font-din font-black">{leadingWords}</span>
        <span className="font-amira font-black text-primary inline-block">{lastWord}</span>
      </span>
    );
  };

  return (
    <header
      className={`section-header ${align === 'center' ? 'is-center' : 'is-start'} ${className}`}
    >
      {eyebrow && (
        <div className="section-eyebrow-row">
          <i className="eyebrow-dot" aria-hidden />
          <span>{eyebrow}</span>
          <i className="eyebrow-dot" aria-hidden />
        </div>
      )}

      <h2 className={`section-title section-title-stroked ${fontMix ? 'section-title-mixed' : ''}`} data-title-shape={shape}>
        {renderMixedTitle(title)}
      </h2>

      <div className="title-flourish" aria-hidden="true">
        <BookOpen strokeWidth={1.8} className="flourish-book-icon" />
        <span className="flourish-line">
          <i className="flourish-diamond" />
          <i className="flourish-diamond flourish-diamond-sm" />
        </span>
        <PencilLine strokeWidth={1.8} className="flourish-pencil-icon" />
      </div>

      {description && (
        <p
          className={`section-description ${align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-xl'}`}
          style={{ color: 'var(--ink-muted)' }}
        >
          {description}
        </p>
      )}
    </header>
  );
};
