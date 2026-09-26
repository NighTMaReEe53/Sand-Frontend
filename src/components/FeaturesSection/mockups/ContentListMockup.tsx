import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Check } from 'lucide-react';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { staggerRowsIn } from './useStaggerReveal';

const items: string[] = [
  'امتحان تراكمي على المحاضرة السابقة',
  'جزء الشرح (1)',
  'اختبار على جزء الشرح (1)',
  'جزء الشرح (2)',
];

export default function ContentListMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    staggerRowsIn(containerRef.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rows = gsap.utils.toArray<HTMLDivElement>(
      containerRef.current.querySelectorAll('.row')
    );
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });

    rows.forEach((row, i) => {
      const badge = row.querySelector<HTMLSpanElement>('.badge');

      tl.to(cursorRef.current, {
        x: row.offsetLeft + 10,
        y: row.offsetTop + 10,
        duration: 0.55,
        ease: 'power3.inOut',
      }, i === 0 ? 0 : '+=0.15');

      tl.to(row, { backgroundColor: `${color}18`, duration: 0.35, ease: 'power2.out' }, '<');

      if (badge) {
        tl.fromTo(badge,
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' },
          '-=0.1'
        );
      }

      tl.to(row, { backgroundColor: 'transparent', duration: 0.25 }, '+=0.45');
    });

    return () => {
      tl.kill();
    };
  }, [color]);

  return (
    <MockupFrame title="محتوى الكورس" accent={color}>
      <div className="mockup-list" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        {items.map((text, i) => (
          <div className="row" key={i}>
            <span className="badge" style={{ color }}><Check size={11} strokeWidth={3} /></span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}
