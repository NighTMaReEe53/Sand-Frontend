import React, { useEffect, useRef } from 'react';

/**
 * Fixed top scroll progress bar — RTL-aware, fills right-to-left.
 *
 * Perf upgrade: replaced framer-motion useScroll + useSpring + useTransform
 * (3 reactive subscriptions + RAF spring) with a single passive scroll
 * listener that sets a CSS custom property. The browser handles the
 * visual update natively without JS layout work.
 *
 * Only visible after ~100px of scroll (opacity transition via CSS).
 */
export const ScrollProgressBar: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bar = barRef.current;
    if (!bar) return;

    let frame: number | null = null;
    const paint = () => {
      frame = null;
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const total = doc.scrollHeight - doc.clientHeight;
      const progress = total > 0 ? scrolled / total : 0;
      bar.style.transform = `scaleX(${progress})`;
      // Show bar only after 100px
      bar.style.opacity = scrolled > 100 ? '1' : '0';
    };
    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(paint);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    paint();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 right-0 left-0 z-[60] h-1 pointer-events-none"
    >
      <div
        ref={barRef}
        className="h-full w-full"
        style={{
          transformOrigin: 'right',
          transform: 'scaleX(0)',
          opacity: 0,
          backgroundImage: 'var(--gradient-gold)',
          transition: 'opacity 0.3s ease',
          willChange: 'transform',
        }}
      />
    </div>
  );
};
