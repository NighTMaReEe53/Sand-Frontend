import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { examsApi } from '../../api/exams.api';

const EXIT_GRACE_MS = 3_000;

/**
 * Counts a genuine tab switch only after a short grace period. This avoids
 * false positives from mobile notification/OS flickers and relies on the
 * server's eventId uniqueness constraint as the final duplicate safeguard.
 */
export const ExamSessionMonitor: React.FC<{ attemptId: string | null }> = ({ attemptId }) => {
  const timerRef = useRef<number | null>(null);
  const exitEventIdRef = useRef<string | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!attemptId) return;

    const clearPendingExit = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      exitEventIdRef.current = null;
      sentRef.current = false;
    };
    const recordExit = async () => {
      if (sentRef.current || !exitEventIdRef.current) return;
      sentRef.current = true;
      try {
        const result = await examsApi.recordAttemptExit(attemptId, {
          eventId: exitEventIdRef.current,
          exitType: 'TAB_HIDDEN',
        });
        if (result.exitCount <= result.maxAllowedExits) {
          toast.warning(
            result.exitCount === result.maxAllowedExits
              ? `هذه آخر مغادرة مسموحة للظهور في لوحة الشرف (${result.exitCount}/${result.maxAllowedExits}).`
              : `تم تسجيل مغادرة الامتحان (${result.exitCount}/${result.maxAllowedExits}).`,
          );
        }
      } catch {
        // The attempt may have been submitted/timed out while the tab was away.
        // No client-side counter is changed; the next server response is truth.
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearPendingExit();
        return;
      }
      if (timerRef.current !== null || sentRef.current) return;
      exitEventIdRef.current = crypto.randomUUID();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        void recordExit();
      }, EXIT_GRACE_MS);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [attemptId]);

  return null;
};
