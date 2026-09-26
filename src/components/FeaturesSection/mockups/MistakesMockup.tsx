import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { staggerRowsIn } from './useStaggerReveal';
import { useOffscreenPause } from './useOffscreenPause';

// All displayed strings are Arabic — this is what the user sees.
const mistakes: string[] = [
  'السؤال الثالث - الفصل الأول',
  'السؤال الخامس - الفصل الثاني',
  'السؤال الثامن - الفصل الثالث',
];

export default function MistakesMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    staggerRowsIn(containerRef.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rows = gsap.utils.toArray<HTMLDivElement>(
      containerRef.current.querySelectorAll('.row')
    );
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });

    rows.forEach((row, i) => {
      // fake mouse travels to the mistake row, then nudges it as a warning
      tl.to(cursorRef.current, {
        x: row.offsetLeft + 10,
        y: row.offsetTop + 10,
        duration: 0.5,
        ease: 'power3.inOut',
      }, i === 0 ? 0 : '+=0.1');

      tl.to(row, {
        x: -5,
        backgroundColor: `${color}22`,
        duration: 0.35,
        ease: 'back.out(1.6)',
      }, '<0.1')
        .to(cursorRef.current, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 }, '<')
        .to(row, { x: 0, backgroundColor: 'transparent', duration: 0.35, ease: 'power2.inOut' }, '+=0.55');
    });

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="أخطائي" accent={color}>
      <div className="mockup-list mockup-mistakes" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        {mistakes.map((text, i) => (
          <div className="row" key={i} style={{ borderRight: `3px solid ${color}` }}>
            <span className="dot" style={{ background: color }} />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}
