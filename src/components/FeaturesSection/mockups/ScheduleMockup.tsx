import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { staggerRowsIn } from './useStaggerReveal';

interface Day {
  day: string;
  time: string;
  title: string;
}

const schedule: Day[] = [
  { day: 'السبت', time: '6:00 م', title: 'محاضرة جديدة' },
  { day: 'الاثنين', time: '8:00 م', title: 'مراجعة مباشرة' },
  { day: 'الأربعاء', time: '9:00 م', title: 'كويز أسبوعي' },
];

export default function ScheduleMockup({ color }: MockupProps) {
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
      const dot = row.querySelector<HTMLSpanElement>('.dot');

      tl.to(cursorRef.current, {
        x: row.offsetLeft + 10,
        y: row.offsetTop + 10,
        duration: 0.55,
        ease: 'power3.inOut',
      }, i === 0 ? 0 : '+=0.15');

      tl.to(row, { backgroundColor: `${color}15`, duration: 0.35, ease: 'power2.out' }, '<');

      if (dot) {
        tl.fromTo(dot,
          { scale: 0.4 },
          { scale: 1.25, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.inOut' },
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
    <MockupFrame title="المواعيد الأسبوعية" accent={color}>
      <div className="mockup-list" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        {schedule.map((item, i) => (
          <div className="row" key={i}>
            <span className="badge badge-day" style={{ color }}>{item.day}</span>
            <span className="row-main">
              <span className="dot" style={{ backgroundColor: color }} />
              <span className="row-title">{item.title}</span>
            </span>
            <span className="time">{item.time}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}
