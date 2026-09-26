import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Implamtion_plan.md §7 — animated count-up for the stats band.
 * Numbers animate from 0 to `target` when scrolled into view, which
 * reads as "alive" instead of "broken" (fixes 0% / 0/7 / +0 issue).
 */
export function useCountUp<T extends HTMLElement = HTMLSpanElement>(target: number) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: target,
      duration: 1.4,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toLocaleString();
      },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [target]);

  return ref;
}
