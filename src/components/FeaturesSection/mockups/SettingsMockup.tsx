import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { staggerRowsIn } from './useStaggerReveal';

const qualities = [
  { label: '1080p', tag: 'عالية' },
  { label: '720p', tag: 'متوسطة' },
  { label: '480p', tag: 'موفر للبيانات' },
];

export default function SettingsMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const hdChipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    staggerRowsIn(containerRef.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rows = gsap.utils.toArray<HTMLDivElement>(
      containerRef.current.querySelectorAll('.row')
    );
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });

    rows.forEach((row, i) => {
      const radio = row.querySelector<HTMLSpanElement>('.radio');

      tl.to(cursorRef.current, {
        x: row.offsetLeft + 10,
        y: row.offsetTop + 10,
        duration: 0.55,
        ease: 'power3.inOut',
      }, i === 0 ? 0 : '+=0.15');

      tl.to(row, { backgroundColor: `${color}15`, duration: 0.35, ease: 'power2.out' }, '<');

      // click press feedback on the row itself
      tl.to(row, { scale: 0.98, duration: 0.1, yoyo: true, repeat: 1 }, '<0.05');

      if (radio) {
        tl.to(radio, { borderColor: color, duration: 0.25 }, '<');
        tl.fromTo(radio,
          { scale: 0.6 },
          { scale: 1, backgroundColor: color, duration: 0.3, ease: 'back.out(2)' },
          '-=0.05'
        );
      }

      tl.to(row, { backgroundColor: 'transparent', duration: 0.25 }, '+=0.45');

      if (i < rows.length - 1 && radio) {
        tl.to(radio, { backgroundColor: 'transparent', borderColor: 'var(--line)', duration: 0.25 });
      }
    });

    // after cycling through all qualities, go back to HD — chip pops in
    const firstRow = rows[0];
    const firstRadio = firstRow?.querySelector('.radio');
    if (firstRow) {
      tl.to(cursorRef.current, {
        x: firstRow.offsetLeft + 10,
        y: firstRow.offsetTop + 10,
        duration: 0.5,
        ease: 'power3.inOut',
      });
      if (firstRadio) {
        tl.fromTo(firstRadio,
          { backgroundColor: 'transparent', borderColor: 'var(--line)' },
          { backgroundColor: color, borderColor: color, duration: 0.3, ease: 'back.out(2)' }
        );
      }
      tl.to(hdChipRef.current, {
        opacity: 1,
        scale: 1,
        rotate: -8,
        duration: 0.4,
        ease: 'back.out(2)',
      }, '-=0.05');

      // hold the HD moment, then clear it so the next loop starts clean
      tl.to(hdChipRef.current, { opacity: 0, scale: 0.6, rotate: 0, duration: 0.3 }, '+=1');
    }

    return () => {
      tl.kill();
    };
  }, [color]);

  return (
    <MockupFrame title="جودة الفيديو" accent={color}>
      <div className="mockup-list" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        {qualities.map((q, i) => (
          <div className="row" key={i}>
            <span className={`radio${i === qualities.length - 1 ? ' selected' : ''}`} />
            <span className="row-title">{q.label}</span>
            <span className="tag">{q.tag}</span>
          </div>
        ))}
        <span className="quality-hd" ref={hdChipRef} style={{ background: `${color}22`, color }}>
          HD
        </span>
      </div>
    </MockupFrame>
  );
}
