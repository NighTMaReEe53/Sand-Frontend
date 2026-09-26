import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Check } from 'lucide-react';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { useOffscreenPause } from './useOffscreenPause';

// All displayed strings are Arabic — this is what the user sees.
const question = 'الفيديو مش بيتشغل عندي، أعمل إيه؟';
const answer = 'جرب تغيّر الجودة لـ 480p وهيرجع يشتغل فورًا';

/**
 * Fake support chat for the "دعم علمي و فني" card: the student's question
 * slides in, a typing indicator plays, then the answer replies.
 */
export default function ChatSupportMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
    const typingEl = typingRef.current;
    const answerEl = aRef.current;
    if (!typingEl || !answerEl) return;

    // reset state at loop start
    tl.set([qRef.current, typingEl, answerEl], { opacity: 0, y: 12, scale: 0.95 })
      .set(answerEl.querySelector('.chat-check'), { scale: 0, rotate: -90 });

    // fake mouse clicks the input area, then the question pops in
    tl.to(cursorRef.current, { x: 40, y: containerRef.current.offsetHeight - 18, duration: 0, immediateRender: true })
      .to(cursorRef.current, { x: containerRef.current.offsetWidth - 60, y: 14, duration: 0.5, ease: 'power3.inOut' })
      .to(cursorRef.current, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 })
      .to(qRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, '<0.05');

    // support is "typing"…
    tl.to(typingEl, { opacity: 1, y: 0, scale: 1, duration: 0.3 }, '+=0.4')
      .fromTo(typingEl.querySelectorAll('i'),
        { y: 0 },
        { y: -4, duration: 0.28, stagger: 0.12, yoyo: true, repeat: 3, ease: 'power1.inOut' },
        '-=0.1');

    // …and answers
    tl.to(cursorRef.current, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 })
      .to(typingEl, { opacity: 0, y: 8, duration: 0.25 })
      .to(answerEl, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, '-=0.05')
      .to(answerEl.querySelector('.chat-check'), { scale: 1, rotate: 0, duration: 0.35, ease: 'back.out(2.5)' }, '-=0.15');

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="الدعم الفني" accent={color}>
      <div className="mockup-list mockup-chat" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        <div className="chat-bubble chat-bubble-user" ref={qRef}>
          {question}
        </div>
        <div className="chat-typing" ref={typingRef} aria-hidden>
          <i style={{ background: color }} />
          <i style={{ background: color }} />
          <i style={{ background: color }} />
        </div>
        <div className="chat-bubble chat-bubble-support" ref={aRef}>
          {answer}
          <span
            className="chat-check"
            aria-hidden
            style={{ background: `${color}22`, color }}
          >
            <Check size={10} strokeWidth={3.5} />
          </span>
        </div>
      </div>
    </MockupFrame>
  );
}
