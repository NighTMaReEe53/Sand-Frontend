import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Trophy } from 'lucide-react';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { useOffscreenPause } from './useOffscreenPause';

// All displayed strings are Arabic — this is what the user sees.
const winners = [
  { name: 'سارة', score: '98' },
  { name: 'يوسف', score: '95' },
  { name: 'ناصر', score: '91' },
];
// podium visual order left→right: 2nd, 1st, 3rd
const PODIUM_ORDER = [1, 0, 2];
const PODIUM_HEIGHTS = [58, 84, 42];

/**
 * Fake exam leaderboard for the "أفضل 3 في الامتحانات" card:
 * the podium bars rise up one by one, names/scores fade in, then a
 * trophy pops above first place and bobs gently.
 */
export default function Top3Mockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trophyRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bars = gsap.utils.toArray<HTMLElement>(
      containerRef.current.querySelectorAll('.podium-bar')
    );
    const metas = gsap.utils.toArray<HTMLElement>(
      containerRef.current.querySelectorAll('.podium-meta')
    );
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });

    // reset for each loop
    tl.set(bars, { scaleY: 0 })
      .set(metas, { opacity: 0, y: 10 })
      .set(trophyRef.current, { opacity: 0, scale: 0, y: 0 });

    // bars rise like a podium reveal
    tl.to(bars, {
      scaleY: 1,
      duration: 0.55,
      stagger: 0.14,
      ease: 'back.out(1.4)',
    })
      // winner's info lands first
      .to(metas[1], { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.2')
      .to(metas[0], { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.15')
      .to(metas[2], { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.15');

    // trophy pops above first place and bobs gently
    tl.to(trophyRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.45,
      ease: 'back.out(2.2)',
    })
      .to(trophyRef.current, { y: -5, duration: 0.55, yoyo: true, repeat: 3, ease: 'sine.inOut' });

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="ترتيب الامتحان" accent={color}>
      <div className="mockup-list mockup-podium" dir="ltr" ref={containerRef}>
        <span className="trophy-badge" ref={trophyRef} style={{ background: `${color}22`, color }}>
          <Trophy size={16} />
        </span>
        {PODIUM_ORDER.map((winnerIdx, i) => (
          <div className="podium-col" key={i}>
            <span className="podium-meta">
              <span className="podium-name">{winners[winnerIdx].name}</span>
              <span className="podium-score">{winners[winnerIdx].score}</span>
            </span>
            <div
              className="podium-bar"
              style={{
                height: PODIUM_HEIGHTS[i],
                background: i === 1 ? color : `${color}${i === 0 ? '99' : '55'}`,
              }}
            >
              {/* PODIUM_ORDER[i] holds the winner's index === their actual rank */}
              <b>{PODIUM_ORDER[i] + 1}</b>
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}
