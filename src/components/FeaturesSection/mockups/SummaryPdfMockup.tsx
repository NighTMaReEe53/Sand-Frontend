import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Check, Download } from 'lucide-react';
import type { MockupProps } from '../types';
import MockupFrame from './MockupFrame';
import { staggerRowsIn } from './useStaggerReveal';
import { useOffscreenPause } from './useOffscreenPause';

const files: string[] = [
  'ملخص الفصل الأول.pdf',
  'ملخص الفصل الثاني.pdf',
  'مراجعة نهائية.pdf',
];

/**
 * Download mockup for the "ملخصات و PDFs" card: the fake cursor clicks a
 * file's download icon, the icon dips once like it's saving, then flips
 * into a check mark ("downloaded") before moving to the next file.
 */
export default function SummaryPdfMockup({ color }: MockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    staggerRowsIn(containerRef.current, '.file-row');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rows = gsap.utils.toArray<HTMLDivElement>(
      containerRef.current.querySelectorAll('.file-row')
    );
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });

    rows.forEach((row, i) => {
      const iconWrap = row.querySelector<HTMLSpanElement>('.download-icon');
      const doneWrap = row.querySelector<HTMLSpanElement>('.download-done');

      // fake mouse travels to the row's download icon
      tl.to(cursorRef.current, {
        x: iconWrap ? iconWrap.offsetLeft + 6 : row.offsetLeft + 10,
        y: iconWrap ? iconWrap.offsetTop + 9 : row.offsetTop + 10,
        duration: i === 0 ? 0.5 : 0.45,
        ease: 'power3.inOut',
      }, i === 0 ? 0 : '+=0.2');

      // press the icon
      tl.to(cursorRef.current, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 })
        .to(iconWrap, { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1 }, '<');

      // single clean dip while "saving", then flip to the done check
      tl.to(iconWrap, { y: 5, opacity: 0.45, duration: 0.3, ease: 'power2.in' })
        .to(doneWrap, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2.2)' }, '-=0.05')
        .to(row, { backgroundColor: `${color}12`, duration: 0.25 }, '<')
        .to(row, { backgroundColor: 'transparent', duration: 0.3 }, '+=0.55')
        // reset this row for the next loop
        .set(iconWrap, { y: 0, opacity: 1, scale: 1 })
        .to(doneWrap, { scale: 0, opacity: 0, duration: 0.25 }, '<');
    });

    tlRef.current = tl;
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [color]);

  useOffscreenPause(containerRef, tlRef);

  return (
    <MockupFrame title="الملخصات" accent={color}>
      <div className="mockup-list mockup-files" ref={containerRef}>
        <div className="mockup-cursor" ref={cursorRef} />
        {files.map((name, i) => (
          <div className="file-row" key={i}>
            <span>{name}</span>
            <span className="download-state">
              <span className="download-icon" style={{ color }}>
                <Download size={14} strokeWidth={2.5} />
              </span>
              <span className="download-done" style={{ background: `${color}22`, color }}>
                <Check size={11} strokeWidth={3} />
              </span>
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}
