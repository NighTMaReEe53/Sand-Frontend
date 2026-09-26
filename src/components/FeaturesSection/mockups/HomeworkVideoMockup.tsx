import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Play } from 'lucide-react';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { staggerRowsIn } from './useStaggerReveal';
import { useOffscreenPause } from './useOffscreenPause';

const questions: string[] = [
  'السؤال الأول',
  'السؤال الثاني',
  'السؤال الثالث',
  'السؤال الرابع',
];

export default function HomeworkVideoMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    staggerRowsIn(containerRef.current, '.q-row');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rows = gsap.utils.toArray<HTMLDivElement>(
      containerRef.current.querySelectorAll('.q-row')
    );
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });

    rows.forEach((row, i) => {
      // fake mouse selects a question
      tl.to(cursorRef.current, {
        x: row.offsetLeft + 10,
        y: row.offsetTop + 10,
        duration: 0.45,
        ease: 'power3.inOut',
      }, i === 0 ? 0 : '+=0.1');

      tl.to(row, { backgroundColor: `${color}18`, duration: 0.3, ease: 'power2.out' }, '<0.05')
        .to(cursorRef.current, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 }, '<');
      // then travels to the play button and "clicks" it
      tl.to(cursorRef.current, {
        x: playBtnRef.current ? playBtnRef.current.offsetLeft + 16 : 0,
        y: playBtnRef.current ? playBtnRef.current.offsetTop + 16 : 0,
        duration: 0.4,
        ease: 'power3.inOut',
      })
        .to(playBtnRef.current, { scale: 1.15, duration: 0.25, ease: 'back.out(2)' }, '<0.1')
        .to(playBtnRef.current, { scale: 1, duration: 0.25 })
        .to(row, { backgroundColor: 'transparent', duration: 0.25 }, '+=0.35');
    });

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="حل الواجب" accent={color}>
      <div className="mockup-list mockup-homework" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        <div className="play-button" ref={playBtnRef} style={{ background: `${color}22`, color }}>
          <Play size={18} fill="currentColor" />
        </div>
        <div className="question-list">
          {questions.map((text, i) => (
            <div className="q-row" key={i}>{text}</div>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}
