import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MoonStar, Volume2, VolumeX, X } from 'lucide-react';
import { adhkarApi, type DuaItem } from '../../api/adhkar.api';
import { useFocusModeStore } from '../../store/focusModeStore';

/* ═══════════ Route-based activity tracking ═══════════
   Keeps the global focus store in sync with where the user is,
   so the scheduler pauses during Exams/Quizzes/Lectures even
   without explicit calls from those modules (they can also call
   focusActivity.* directly for finer control).
   ═══════════════════════════════════════════════════ */
const FocusModeTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const p = location.pathname;
    let m: RegExpMatchArray | null;

    if ((m = p.match(/^\/exams\/([^/]+)\/attempt\/?$/))) {
      useFocusModeStore.getState().setActivity('EXAM', m[1]);
    } else if ((m = p.match(/^\/challenges\/([^/]+)\/?$/))) {
      useFocusModeStore.getState().setActivity('QUIZ', m[1]);
    } else if (
      /^\/live-lectures\/[^/]+\/room\/?$/.test(p) ||
      /^\/courses\/[^/]+\/learn(\/.*)?$/.test(p)
    ) {
      useFocusModeStore.getState().setActivity('LECTURE');
    } else {
      useFocusModeStore.getState().setIdle();
    }
  }, [location.pathname]);

  return null;
};

/* ═══════════ Sound (Web Audio chime — no asset needed) ═══════════ */

const MUTE_KEY = 'adhkar:dua_toast_muted';

function playChime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    gain.connect(ctx.destination);

    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(now + i * 0.12);
      osc.stop(now + 0.65);
    });

    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    /* autoplay policy / unsupported — silently skip */
  }
}

/* ═══════════ Constants ═══════════ */

const ROUTINE_INTERVAL_MS = 10 * 60 * 1000; // ~10 minutes
const JITTER_MS = 90 * 1000; // ±1.5 min so it never feels robotic
const VISIBLE_MS = 10_000; // toast stays on screen
const RECENT_LIMIT = 5;

/* ═══════════ The widget ═══════════ */

export const DuaToastProvider: React.FC = () => {
  const focusState = useFocusModeStore((s) => s.state);
  const [visibleDua, setVisibleDua] = useState<DuaItem | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const recentCodesRef = useRef<string[]>([]);
  const hideTimerRef = useRef<number | null>(null);
  const routineTimerRef = useRef<number | null>(null);
  const focusStateRef = useRef(focusState);
  focusStateRef.current = focusState;
  const prevFocusRef = useRef(focusState);
  const visibleRef = useRef(false);
  visibleRef.current = visibleDua !== null;

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const clearRoutineTimer = () => {
    if (routineTimerRef.current !== null) {
      window.clearTimeout(routineTimerRef.current);
      routineTimerRef.current = null;
    }
  };

  /** Jittered repeating scheduler — skips ticks while user is focused. */
  const scheduleRoutine = useCallback(() => {
    clearRoutineTimer();
    const delay =
      ROUTINE_INTERVAL_MS - JITTER_MS + Math.floor(Math.random() * JITTER_MS * 2);
    routineTimerRef.current = window.setTimeout(() => {
      if (focusStateRef.current !== 'IDLE') {
        scheduleRoutine(); // suppressed during Exam/Quiz/Lecture — reschedule quietly
        return;
      }
      void fetchAndShow('general');
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Fetch a random Dua for the context and show it (unless one is already visible). */
  const fetchAndShow = useCallback(
    async (context: 'general' | 'post-exam' | 'post-lecture') => {
      try {
        const dua = await adhkarApi.getRandomDua(context, recentCodesRef.current);
        // Routine toasts never override suppression; contextual ones take priority.
        const allowed =
          context !== 'general' ? true : focusStateRef.current === 'IDLE';
        if (allowed && !visibleRef.current) {
          setVisibleDua(dua);
          recentCodesRef.current = [dua.code, ...recentCodesRef.current].slice(
            0,
            RECENT_LIMIT
          );
          if (!muted) playChime();
          clearHideTimer();
          hideTimerRef.current = window.setTimeout(() => setVisibleDua(null), VISIBLE_MS);
          scheduleRoutine(); // reset normal cycle so it doesn't double up right after
        }
      } catch {
        /* network/API error — just skip this tick */
      }
    },
    [muted, scheduleRoutine]
  );

  /* Start the scheduler on mount */
  useEffect(() => {
    scheduleRoutine();
    return () => {
      clearRoutineTimer();
      clearHideTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Suppress instantly when an activity starts + auto-trigger on completion */
  useEffect(() => {
    const prev = prevFocusRef.current;
    prevFocusRef.current = focusState;
    if (focusState !== 'IDLE') {
      // Exam/Quiz/Lecture started — kill any visible toast fast
      clearHideTimer();
      setVisibleDua(null);
      return;
    }
    if (prev !== 'IDLE' && focusState === 'IDLE') {
      // Activity just ended → contextual completion Dua after a short delay
      const ctx = prev === 'LECTURE' ? 'post-lecture' : 'post-exam';
      const t = window.setTimeout(() => void fetchAndShow(ctx), 1800);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusState]);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <>
      <FocusModeTracker />
      {visibleDua && (
          <aside
            key={visibleDua.id}
            className="animate-dua-toast fixed bottom-5 left-5 z-[70] w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-gold-500/40 shadow-2xl shadow-black/50"
            style={{
              background:
                'linear-gradient(135deg, #06302e 0%, #0a3d33 55%, #123a4f 100%)',
              direction: 'rtl',
            }}
            role="status"
            aria-live="polite"
          >
            {/* soft ambient glow */}
            <span className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-emerald-400/15 blur-2xl animate-pulse" />

            {/* header row */}
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="flex items-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 px-2.5 py-0.5 text-[10px] font-black text-gold-300">
                <MoonStar className="h-3 w-3" /> دعاء
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
                  className="rounded-lg p-1.5 text-emerald-200/70 transition-colors hover:bg-white/10 hover:text-emerald-100"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleDua(null)}
                  aria-label="إغلاق"
                  className="rounded-lg p-1.5 text-emerald-200/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* body */}
            <p className="font-display px-5 pb-1 pt-3 text-base leading-[1.9] text-emerald-50">
              {visibleDua.arabicText}
            </p>
            <p className="px-5 pb-4 text-[11px] text-gold-300/80">— {visibleDua.source}</p>

            {/* bottom accent */}
            <div className="h-1 w-full bg-gradient-to-l from-gold-500/70 via-emerald-400/40 to-transparent" />
          </aside>
        )}
    </>
  );
};
