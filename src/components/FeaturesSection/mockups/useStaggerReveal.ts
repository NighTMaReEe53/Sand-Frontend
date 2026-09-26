import { gsap } from 'gsap';

/**
 * Staggered entrance for a mockup's rows. Plays on mount (no
 * ScrollTrigger) so rows are guaranteed to end fully visible — hiding
 * content behind a scroll trigger silently broke with smooth-scrolling.
 * Respects prefers-reduced-motion.
 *
 * Built with gsap.set + gsap.to (NOT gsap.from) so the "hidden" state
 * only exists while OUR tween is alive, plus a wall-clock fallback that
 * force-reveals rows if the GSAP ticker ever stalls. A previous
 * implementation used gsap.from, whose initial opacity: 0 stuck around
 * whenever the tween was interrupted (StrictMode double-mount, heavy
 * page load + lagSmoothing) — leaving most mockups permanently blank.
 */
export function staggerRowsIn(
  container: HTMLElement | null,
  selector = '.row, .q-row, .option-row, .result-row, .file-row',
) {
  if (!container) return;

  const targets = Array.from(container.querySelectorAll<HTMLElement>(selector));
  if (targets.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Restart cleanly — kills leftovers from any previous/parallel attempt
  gsap.killTweensOf(targets);
  gsap.set(targets, { opacity: 0, y: 14 });

  const tween = gsap.to(targets, {
    opacity: 1,
    y: 0,
    duration: 0.45,
    delay: 0.15,
    stagger: 0.07,
    ease: 'power3.out',
    clearProps: 'transform', // leave rows clean for the looping timelines
    onComplete: () => gsap.set(targets, { opacity: 1 }),
  });

  // Safety net — never let mockup content stay hidden. If the tween has
  // not finished within 2s of wall-clock time (stalled ticker, throttled
  // tab), snap every row to its final visible state.
  window.setTimeout(() => {
    if (tween.progress() < 1) {
      tween.kill();
      gsap.set(targets, { opacity: 1, y: 0 });
    }
  }, 2000);
}
