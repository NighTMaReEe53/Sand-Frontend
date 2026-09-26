import { useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

/**
 * Reusable Lottie wrapper around the official dotLottie React player.
 *
 * Perf:
 * - Lazy mounting: the animation is not downloaded/decoded until it
 *   scrolls near the viewport (IntersectionObserver, 300px margin).
 * - Rendering freezes while off-screen (freezeOnOffscreen).
 * - DPR capped at 1.25 and quality at 60 to cut canvas fill cost.
 */
export interface LottiePlayerProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export default function LottiePlayer({
  src,
  loop = true,
  autoplay = true,
  className,
}: LottiePlayerProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = holderRef.current;
    if (!el || shouldLoad) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={holderRef} className={className}>
      {shouldLoad ? (
        <DotLottieReact
          src={src}
          loop={loop}
          autoplay={autoplay}
          renderConfig={{ devicePixelRatio: 1.25, freezeOnOffscreen: true, quality: 60 }}
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
    </div>
  );
}
