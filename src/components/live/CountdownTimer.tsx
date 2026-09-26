import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * One-shot server/client clock offset so countdowns stay accurate even if the
 * device clock drifts or the tab stays open for hours. Falls back to 0 when
 * the Date header is unavailable.
 */
export function useServerTimeOffset(enabled = true) {
  const [offsetMs, setOffsetMs] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const measure = async () => {
      try {
        const startedAt = Date.now();
        const res = await fetch(API_BASE, { method: 'HEAD' });
        const dateHeader = res.headers.get('date');
        if (!dateHeader) return;
        const serverNow = new Date(dateHeader).getTime();
        const rtt = (Date.now() - startedAt) / 2;
        if (!Number.isNaN(serverNow) && !cancelled) {
          setOffsetMs(serverNow + rtt - Date.now());
        }
      } catch {
        // keep offset 0 — local clock fallback
      }
    };

    void measure();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return offsetMs;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Drift-resistant countdown: recomputes from a monotonic tick + server offset
 * instead of decrementing a stored value. Renders only its own <span>.
 */
export const CountdownTimer: React.FC<{
  targetIso: string;
  offsetMs?: number;
  className?: string;
}> = ({ targetIso, offsetMs = 0, className }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = new Date(targetIso).getTime() - (now + offsetMs);

  if (remaining <= 0) {
    return (
      <span dir="ltr" className={className}>
        --:--:--
      </span>
    );
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <span dir="ltr" className={`tabular-nums ${className ?? ''}`}>
      {days > 0 && `${days}d `}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
};
