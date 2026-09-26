import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { useOffscreenPause } from './useOffscreenPause';

/**
 * Fake lesson countdown for the "مؤقت المحاضرة" card: a digital HH:MM:SS
 * clock that ticks down every second, blinking separators, and a progress
 * bar draining in sync. Loops forever like the other mockups.
 */
export default function LessonTimerMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLSpanElement>(null);
  const minsRef = useRef<HTMLSpanElement>(null);
  const secsRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let remaining = 2 * 3600 + 14 * 60 + 50; // 02:14:50

    const pad = (n: number) => String(n).padStart(2, '0');

    const renderTick = () => {
      remaining -= 1;
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;
      if (hoursRef.current) hoursRef.current.textContent = pad(h);
      if (minsRef.current) minsRef.current.textContent = pad(m);
      if (secsRef.current) secsRef.current.textContent = pad(s);
    };

    renderTick();

    const tl = gsap.timeline({ repeat: -1 });
    const TICKS = 12; // ~10 seconds of visible countdown per loop
    const STEP = 0.82; // real seconds per tick

    // each tick: flip the seconds digits, pop the minutes when they change
    for (let i = 0; i < TICKS; i++) {
      tl.call(renderTick)
        .fromTo(
          secsRef.current,
          { yPercent: -55, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.28, ease: 'power2.out' }
        )
        .to({}, { duration: STEP - 0.28 });
    }

    // progress bar drains across the whole loop, resets on repeat
    tl.to(progressRef.current, { scaleX: 0, duration: TICKS * STEP, ease: 'none' }, 0);

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="مؤقت المحاضرة" accent={color}>
      <div className="mockup-list mockup-timer" ref={containerRef}>
        <span className="timer-label">المحاضرة القادمة تبدأ بعد</span>
        <div className="timer-display" dir="ltr">
          <span className="timer-digit" ref={hoursRef} style={{ background: `${color}14`, color }}>
            02
          </span>
          <span className="timer-sep" style={{ color }}>:</span>
          <span className="timer-digit" ref={minsRef} style={{ background: `${color}14`, color }}>
            14
          </span>
          <span className="timer-sep" style={{ color }}>:</span>
          <span className="timer-digit" ref={secsRef} style={{ background: `${color}14`, color }}>
            49
          </span>
        </div>
        <span className="timer-progress">
          <i ref={progressRef} style={{ background: color }} />
        </span>
      </div>
    </MockupFrame>
  );
}
