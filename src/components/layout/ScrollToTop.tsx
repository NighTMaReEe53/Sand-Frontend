import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type Lenis from 'lenis';

/**
 * Global helper to smoothly scroll to top from any component/handler.
 */
export function smoothScrollToTop(duration = 0.8) {
  if (typeof window === 'undefined') return;

  // 1. Lenis smooth scroll if active
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) {
    lenis.scrollTo(0, { immediate: false, duration });
  } else {
    // 2. Native smooth scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }

  // 3. Reset any scrollable main / layout containers
  const scrollables = document.querySelectorAll('main, [data-scrollable], .overflow-y-auto');
  scrollables.forEach((el) => {
    if (el && el.scrollTop > 0) {
      el.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  });
}

/**
 * Smoothly scrolls to top on every route change (pathname, search, hash).
 *
 * Ensures fluid, polished transition UX when switching pages or tabs.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If navigating to a specific hash on the page (e.g. #reviews, #comments)
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
        if (lenis) {
          lenis.scrollTo(element, { immediate: false, duration: 0.9, offset: -80 });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
    }

    // Smooth scroll to top — ONLY when the route (path) actually changes.
    // Query-string changes (e.g. toggling a filter on the courses catalog)
    // must NOT scroll the page, so the user keeps their scroll position.
    smoothScrollToTop(0.7);

    // Refresh animation frames & GSAP ScrollTrigger after paint
    const timer = window.setTimeout(() => {
      void import('../../lib/gsapConfig')
        .then(({ ScrollTrigger }) => ScrollTrigger.refresh())
        .catch(() => undefined);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
};
