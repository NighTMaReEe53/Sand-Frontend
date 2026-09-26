import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { MockupProps } from '../types';
import { useOffscreenPause } from './useOffscreenPause';

/**
 * Shared mockup for the three support cards (دعم نفسي / دعم علمي / دعم فني).
 * No data panel — just layered "sonar ping" rings around the card's icon.
 */
export default function IconOnlyMockup({ color, Icon }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringARef = useRef<HTMLSpanElement>(null);
  const ringBRef = useRef<HTMLSpanElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });

    // two sonar pings, offset by half a cycle
    tl.fromTo(ringARef.current,
      { scale: 0.85, opacity: 0.65 },
      { scale: 1.5, opacity: 0, duration: 1.8, ease: 'power1.out' }, 0);
    tl.fromTo(ringBRef.current,
      { scale: 0.85, opacity: 0 },
      { scale: 1.5, opacity: 0, duration: 1.8, ease: 'power1.out' }, 0.9);
    tl.fromTo(ringBRef.current,
      { opacity: 0.65 },
      { opacity: 0, duration: 0.9, ease: 'power1.out' }, 0.9);

    // gentle breathing on the icon itself
    tl.to(coreRef.current, { scale: 1.07, duration: 0.9, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0);

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <div className="mockup-list mockup-icon-only" ref={containerRef}>
      <span className="icon-ping" ref={ringARef} aria-hidden style={{ borderColor: color }} />
      <span className="icon-ping" ref={ringBRef} aria-hidden style={{ borderColor: `${color}88` }} />
      <div className="icon-core" ref={coreRef} style={{ background: `${color}22`, color }}>
        {Icon ? <Icon aria-hidden="true" /> : <span aria-hidden>✦</span>}
      </div>
    </div>
  );
}
