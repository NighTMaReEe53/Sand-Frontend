import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Check } from 'lucide-react';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { staggerRowsIn } from './useStaggerReveal';
import { useOffscreenPause } from './useOffscreenPause';

const question = 'ما إعراب الفعل المضارع إذا لم يسبقه ناصب أو جازم؟';
const options: string[] = ['منصوب', 'مجزوم', 'مرفوع', 'مبني'];
const correctIndex = 2; // "مرفوع"
const wrongIndex = 0; // "منصوب" — shown as a wrong pick before the right one
const WRONG_COLOR = '#EF4444';

export default function ExamQuizMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    staggerRowsIn(containerRef.current, '.option-row');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
    const wrongEl = optionRefs.current[wrongIndex];
    const correctEl = optionRefs.current[correctIndex];

    tl.set(labelRef.current, { opacity: 0, y: 0 });

    // fake mouse tries a wrong option first → red shake
    tl.to(cursorRef.current, {
      x: (wrongEl?.offsetLeft ?? 0) + 10,
      y: (wrongEl?.offsetTop ?? 0) + 10,
      duration: 0.5,
      ease: 'power3.inOut',
    }, 0)
      .to(wrongEl, { borderColor: WRONG_COLOR, backgroundColor: `${WRONG_COLOR}14`, duration: 0.3 }, '<0.05')
      .to(cursorRef.current, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 })
      .to(wrongEl, { x: -4, duration: 0.07, yoyo: true, repeat: 3, ease: 'power1.inOut' });

    // then it moves to the correct option → accent reveal + success label
    tl.to(cursorRef.current, {
      x: (correctEl?.offsetLeft ?? 0) + 10,
      y: (correctEl?.offsetTop ?? 0) + 10,
      duration: 0.45,
      ease: 'power3.inOut',
    })
      .to(wrongEl, { borderColor: 'var(--line)', backgroundColor: 'transparent', duration: 0.25 }, '<')
      .to(correctEl, {
        backgroundColor: `${color}30`,
        borderColor: color,
        duration: 0.45,
        ease: 'power2.out',
      }, '<0.05')
      .to(labelRef.current, { opacity: 1, y: -4, duration: 0.35, ease: 'back.out(1.7)' }, '-=0.1')
      .to(labelRef.current, { opacity: 0, duration: 0.35 }, '+=0.9')
      .to(correctEl, { backgroundColor: 'transparent', borderColor: 'var(--line)', duration: 0.35 }, '<');

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="اختبار المحاضرة" accent={color}>
      <div className="mockup-list mockup-exam" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        <div className="q-title">{question}</div>
        {options.map((text, i) => (
          <div
            className="option-row"
            key={i}
            ref={(el) => {
              optionRefs.current[i] = el;
            }}
          >
            {text}
          </div>
        ))}
        <div className="correct-label" ref={labelRef} style={{ color }}>
          <Check size={13} strokeWidth={3} />
          إجابة صح!
        </div>
      </div>
    </MockupFrame>
  );
}
