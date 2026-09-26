import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellRing, BookOpen, ChevronLeft, ClipboardList, FileQuestion, FileText, Radio, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationsApi, type LearningReminder } from '../../api/notifications.api';
import { useAuthStore } from '../../store/authStore';

const reminderIcon: Record<LearningReminder['kind'], React.ElementType> = {
  LESSON: BookOpen,
  QUIZ: ClipboardList,
  HOMEWORK: FileText,
  EXAM: FileQuestion,
  LECTURE: Radio,
};

/**
 * A quiet, actionable reminder strip. It is backed by one small endpoint and
 * cached for ten minutes; dismissing an item only hides it for this browser
 * session, never marks an academic task as completed.
 */
export const LearningReminderBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.role);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const isDistractionFree = /^\/exams\/[^/]+\/attempt|\/live-lectures\/[^/]+\/room/.test(location.pathname);

  const { data } = useQuery({
    queryKey: ['learning-reminders', userId],
    queryFn: () => notificationsApi.getLearningReminders(),
    enabled: role === 'STUDENT' && !isDistractionFree,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const reminder = useMemo(
    () => data?.reminders.find((item) => !dismissed.has(item.id)),
    [data?.reminders, dismissed],
  );
  if (!reminder || isDistractionFree) return null;

  const Icon = reminderIcon[reminder.kind];
  const remaining = (data?.reminders.length ?? 1) - dismissed.size - 1;

  return (
    <div className="relative z-40 border-b border-gold-500/20 bg-gold-500/[0.08]" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10 text-gold-300">
          <BellRing className="h-4 w-4" />
        </span>
        <Icon className="hidden h-4 w-4 shrink-0 text-gold-400 sm:block" />
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-xs font-bold text-ivory">{reminder.title}</p>
          <p className="hidden truncate text-[11px] text-ivory-muted sm:block">{reminder.body}</p>
        </div>
        {remaining > 0 && (
          <span className="hidden rounded-full border border-gold-500/25 bg-gold-500/10 px-2 py-0.5 text-[10px] font-bold text-gold-300 sm:inline">
            +{remaining}
          </span>
        )}
        <button
          type="button"
          onClick={() => navigate(reminder.linkUrl)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-gold-300 transition-colors hover:bg-gold-500/15 hover:text-gold-200"
        >
          فتح
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setDismissed((items) => new Set(items).add(reminder.id))}
          className="shrink-0 rounded-lg p-1.5 text-ivory-muted transition-colors hover:bg-white/5 hover:text-ivory"
          aria-label="إخفاء هذا التذكير مؤقتاً"
          title="إخفاء مؤقتاً"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
