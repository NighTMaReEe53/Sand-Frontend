import { useEffect, type RefObject } from 'react';
import type { gsap } from 'gsap';

/**
 * Pause a mockup's looping timeline while its card is scrolled out of view
 * and resume when visible again (frontend_implamtion.md §12.8). With 11
 * simultaneously animating cards on the page, this keeps background
 * timelines from burning CPU forever.
 */
export function useOffscreenPause(
  containerRef: RefObject<HTMLElement | null>,
  timelineRef: RefObject<gsap.core.Timeline | null>,
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const tl = timelineRef.current;
        if (!tl) return;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (entry.isIntersecting && !reducedMotion) tl.play();
        else tl.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [containerRef, timelineRef]);
}
