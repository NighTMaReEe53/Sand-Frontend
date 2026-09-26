import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { useOffscreenPause } from './useOffscreenPause';

// The query is Arabic text, typed out character by character.
const query = 'المحاضرة الأولى';
const results: string[] = [
  'محاضرة: المحاضرة الأولى - مقدمة الكورس',
  'درس: أهداف المحاضرة الأولى',
];

export default function SmartSearchMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputTextRef = useRef<HTMLSpanElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // No animation allowed → reveal results immediately instead of
      // leaving them at their CSS opacity: 0 forever.
      gsap.set(
        resultsRef.current?.querySelectorAll('.result-row') ?? [],
        { opacity: 1, y: 0 }
      );
      return;
    }

    const resultRows = gsap.utils.toArray<HTMLDivElement>(
      resultsRef.current?.querySelectorAll('.result-row') ?? []
    );
    const searchBar = containerRef.current.querySelector<HTMLDivElement>('.search-bar');

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
    const typing = { chars: 0 };

    // fake mouse travels to the search bar and "clicks" it
    tl.to(cursorRef.current, {
      x: searchBar ? searchBar.offsetLeft + searchBar.offsetWidth - 14 : 0,
      y: searchBar ? searchBar.offsetTop + searchBar.offsetHeight / 2 - 4 : 0,
      duration: 0.5,
      ease: 'power3.inOut',
    }, 0)
      .to(cursorRef.current, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 });

    tl.to(typing, {
      chars: query.length,
      duration: 1.1,
      ease: 'none',
      onUpdate: () => {
        if (inputTextRef.current) {
          inputTextRef.current.textContent = query.slice(0, Math.round(typing.chars));
        }
      },
    });

    resultRows.forEach((row, i) => {
      tl.fromTo(
        row,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)' },
        i === 0 ? '+=0.25' : '-=0.1'
      );
    });

    // mouse picks the top result
    if (resultRows[0]) {
      tl.to(cursorRef.current, {
        x: resultRows[0].offsetLeft + 10,
        y: resultRows[0].offsetTop + 8,
        duration: 0.4,
        ease: 'power3.inOut',
      })
        .to(resultRows[0], { backgroundColor: `${color}18`, duration: 0.25 }, '<0.05')
        .to(cursorRef.current, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 });
    }

    // hold, then reset for the next loop
    tl.to({}, { duration: 1.2 })
      .set(typing, { chars: 0 })
      .set(inputTextRef.current, { textContent: '' })
      .set(resultRows, { opacity: 0, y: 10, clearProps: 'backgroundColor' });

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="بحث ذكي" accent={color}>
      <div className="mockup-list mockup-search" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        <div className="search-bar" style={{ borderColor: `${color}66` }}>
          {/* dir="rtl" ensures the typed Arabic text flows correctly */}
          <span className="typed-text" ref={inputTextRef} dir="rtl" />
          <span className="cursor-blink" style={{ background: color }} />
        </div>
        <div className="search-results" ref={resultsRef}>
          {results.map((text, i) => (
            <div className="result-row" key={i}>{text}</div>
          ))}
        </div>
      </div>
    </MockupFrame>
  );
}
