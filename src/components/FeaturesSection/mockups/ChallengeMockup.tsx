import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { useOffscreenPause } from './useOffscreenPause';

// All displayed strings are Arabic — this is what the user sees.
const players = [
    { name: 'محمد', score: 7 },
  { name: 'سارة', score: 9 },
];
const WINNER_INDEX = 1;
const TOTAL_QUESTIONS = 10;

/**
 * Fake live challenge for the "تحديات بين الطلبة" card: two players'
 * score bars race upward with ticking counters, then the winner glows.
 */
export default function ChallengeMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vsChipRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rows = gsap.utils.toArray<HTMLDivElement>(
      containerRef.current.querySelectorAll('.player-row')
    );
    const bars = gsap.utils.toArray<HTMLElement>(
      containerRef.current.querySelectorAll('.player-bar i')
    );
    const scoreEls = gsap.utils.toArray<HTMLSpanElement>(
      containerRef.current.querySelectorAll('.player-score')
    );
    if (rows.length === 0 || bars.length === 0 || scoreEls.length === 0) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });

    // fresh round: empty bars, zeroed scores
    tl.set(bars, { scaleX: 0 })
      .set(scoreEls, { textContent: '0' })
      .set(vsChipRef.current, { scale: 1 });

    players.forEach((player, i) => {
      const counter = { value: 0 };

      tl.to(rows[i], { backgroundColor: `${color}12`, duration: 0.25 })
        .to(counter, {
          value: player.score,
          duration: 0.85,
          ease: 'power1.inOut',
          onUpdate: () => {
            if (scoreEls[i]) scoreEls[i].textContent = String(Math.round(counter.value));
          },
        }, '<')
        .to(bars[i], {
          scaleX: player.score / TOTAL_QUESTIONS,
          duration: 0.85,
          ease: 'power1.inOut',
        }, '<')
        .to(rows[i], { backgroundColor: 'transparent', duration: 0.25 });
    });

    // winner moment: ring glow around their row + VS chip pulse
    tl.to(rows[WINNER_INDEX], {
      boxShadow: `0 0 0 2px ${color}`,
      duration: 0.35,
      ease: 'back.out(2)',
    })
      .to(vsChipRef.current, { scale: 1.18, duration: 0.28, yoyo: true, repeat: 1, ease: 'back.out(2)' }, '<')
      .to(rows[WINNER_INDEX], { boxShadow: '0 0 0 0 rgba(0,0,0,0)', duration: 0.35 }, '+=1');

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="تحدٍ سريع" accent={color}>
      <div className="mockup-list mockup-challenge" ref={containerRef}>
        <span className="vs-chip" ref={vsChipRef} style={{ background: `${color}22`, color }}>
          VS
        </span>
        {players.map((player, i) => (
          <div className="player-row" key={i}>
            <span className="player-avatar" style={{ background: `${color}22`, color }}>
              {player.name.charAt(0)}
            </span>
            <span className="player-main">
              <span className="player-top">
                <span className="player-name">{player.name}</span>
                <span className="player-score" style={{ color }}>0</span>
              </span>
              <span className="player-bar">
                <i style={{ background: color }} />
              </span>
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}
