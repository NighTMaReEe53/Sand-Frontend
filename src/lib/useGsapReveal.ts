import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { gsap, ScrollTrigger } from './gsapConfig';

/**
 * Fade + slide a single element up when it scrolls into view.
 * ScrollTrigger instance is killed on unmount / dep change.
 * Disabled under prefers-reduced-motion.
 */
export function useGsapFadeUp<T extends HTMLElement>(
  deps: unknown[] = [],
  options?: { y?: number; delay?: number; duration?: number }
) {
  const ref = useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: options?.y ?? 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: options?.duration ?? 0.7,
        delay: options?.delay ?? 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, ...deps]);

  return ref;
}

/**
 * Staggered reveal of direct children matching `itemSelector` inside the
 * container, as they scroll into view. Re-runs whenever `deps` change
 * (e.g., filters applied → grid re-renders), so newly rendered cards
 * animate in smoothly instead of popping abruptly.
 */
export function useGsapStaggerReveal<T extends HTMLElement>(
  deps: unknown[] = [],
  options?: {
    itemSelector?: string;
    y?: number;
    stagger?: number;
    duration?: number;
  }
) {
  const ref = useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const container = ref.current;
    if (!container || prefersReducedMotion) return;

    const items = gsap.utils.toArray<HTMLElement>(
      options?.itemSelector ?? ':scope > *',
      container
    );
    if (items.length === 0) return;

    const tween = gsap.fromTo(
      items,
      { autoAlpha: 0, y: options?.y ?? 32 },
      {
        autoAlpha: 1,
        y: 0,
        duration: options?.duration ?? 0.55,
        ease: 'power2.out',
        stagger: options?.stagger ?? 0.08,
        overwrite: true,
        scrollTrigger: {
          trigger: container,
          start: 'top 90%',
          once: true,
        },
      }
    );

    // Grid content changed → recalculate trigger positions
    ScrollTrigger.refresh();

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(items, { clearProps: 'all' });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, ...deps]);

  return ref;
}

/**
 * Load-in animation for page heroes: fades + slides up immediately
 * (no scroll trigger). Returns a ref for the container whose direct
 * children animate in sequence.
 */
export function useGsapHeroIntro<T extends HTMLElement>(deps: unknown[] = []) {
  const ref = useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    const items = gsap.utils.toArray<HTMLElement>(':scope > *', el);
    if (items.length === 0) return;

    const tween = gsap.fromTo(
      items,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.12,
        overwrite: true,
      }
    );

    return () => {
      tween.kill();
      gsap.set(items, { clearProps: 'all' });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion, ...deps]);

  return ref;
}
