import { useEffect, useRef } from 'react';
// Import from central config — ScrollTrigger is already registered there.
// Never register plugins more than once; duplicate calls cause animation bugs.
import { gsap, ScrollTrigger } from '../lib/gsapConfig';

/**
 * Implamtion_plan.md §7 — GSAP scroll reveal.
 *
 * Wrap a section with the returned ref and mark children with
 * `className="reveal"`. Uses vertical (y) motion only so it is
 * direction-agnostic in RTL (§11). Cleaned up via gsap.context().
 */
export function useGsapScrollReveal(selector = '.reveal') {
  const scopeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(selector).forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
          }
        );
      });
    }, scope);

    return () => ctx.revert();
  }, [selector]);

  return scopeRef;
}
