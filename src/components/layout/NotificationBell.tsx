import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Award,
  Bell,
  BellRing,
  BookOpen,
  CheckCheck,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Star,
  Trophy,
  Wallet,
  XCircle,
  WifiOff,
  BellRing as DefaultIcon,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { notificationsApi, type Notification } from '../../api/notifications.api';
import { useAuthStore } from '../../store/authStore';
import { FancyToast } from '../ui/FancyToast';

/** Unread badge refresh — 2 minutes to minimize background network traffic */
const COUNT_REFRESH_INTERVAL = 120 * 1000;
/** Live feed refresh — 60 seconds (active tab only) */
const FEED_REFRESH_INTERVAL = 60 * 1000;
/** How many recent items we fetch each poll */
const FEED_LIMIT = 10;
/** Max individual toasts per batch — extras collapse into one summary toast */
const MAX_TOASTS_PER_BATCH = 3;
/** On very first load, only announce notifications newer than this */
const FIRST_LOAD_WINDOW_MS = 12 * 60 * 60 * 1000;
/** عند العودة بعد غياب/انقطاع: الإشعارات الأحدث من هذا المدة فقط تظهر كتوست،
 *  والأقدم يُعلَّم كمشاهد صامتاً حتى لا تمتلئ الشاشة بإشعارات قديمة */
const CATCHUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** localStorage key — survives reloads AND is shared across tabs so the
 *  same notification is never announced twice after a page refresh */
const ANNOUNCED_KEY = 'notif-announced-ids';
const ANNOUNCED_CAP = 200;

/* ── announced-ids store (localStorage) ───────────────────────── */

const readAnnounced = (): Set<string> => {
  try {
    const raw = localStorage.getItem(ANNOUNCED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const persistAnnounced = (ids: string[], previous: Set<string>) => {
  try {
    const merged = [...previous, ...ids].slice(-ANNOUNCED_CAP);
    localStorage.setItem(ANNOUNCED_KEY, JSON.stringify(merged));
  } catch {
    // storage unavailable (private mode) — session-only behaviour
  }
};

/** Per-notification-type visual identity (icon + colors) */
const NOTIF_STYLES: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; border: string; label: string }
> = {
  QUESTION_NEW: { icon: HelpCircle, color: '#f59e0b', bg: 'rgba(251,191,36,.14)', border: 'rgba(251,191,36,.45)', label: 'سؤال جديد' },
  NEW_QUESTION: { icon: HelpCircle, color: '#f59e0b', bg: 'rgba(251,191,36,.14)', border: 'rgba(251,191,36,.45)', label: 'سؤال جديد' },
  NEW_QA_REPLY: { icon: MessageSquare, color: '#38bdf8', bg: 'rgba(56,189,248,.14)', border: 'rgba(56,189,248,.45)', label: 'رد على سؤال' },
  NEW_SUMMARY_SUBMITTED: { icon: FileText, color: '#f59e0b', bg: 'rgba(251,191,36,.14)', border: 'rgba(251,191,36,.45)', label: 'ملخص جديد' },
  SUMMARY_APPROVED: { icon: CheckCircle2, color: '#10b981', bg: 'rgba(52,211,153,.14)', border: 'rgba(52,211,153,.45)', label: 'اعتماد الملخص' },
  SUMMARY_REJECTED: { icon: XCircle, color: '#ef4444', bg: 'rgba(248,113,113,.14)', border: 'rgba(248,113,113,.45)', label: 'رفض الملخص' },
  NEW_SUMMARY_COMMENT: { icon: MessageSquare, color: '#a855f7', bg: 'rgba(168,85,247,.14)', border: 'rgba(168,85,247,.45)', label: 'تعليق على ملخص' },
  EXAM_SUBMITTED: { icon: ClipboardCheck, color: '#0ea5e9', bg: 'rgba(56,189,248,.14)', border: 'rgba(56,189,248,.45)', label: 'امتحان' },
  COURSE_REVIEWED: { icon: Star, color: '#d4af37', bg: 'rgba(212,175,55,.14)', border: 'rgba(212,175,55,.45)', label: 'تقييم' },
  LESSON_NEW: { icon: BookOpen, color: '#10b981', bg: 'rgba(52,211,153,.14)', border: 'rgba(52,211,153,.45)', label: 'درس جديد' },
  MATERIAL_NEW: { icon: FileText, color: '#38bdf8', bg: 'rgba(56,189,248,.14)', border: 'rgba(56,189,248,.45)', label: 'ملف جديد' },
  LEARNING_REMINDER: { icon: BellRing, color: '#f59e0b', bg: 'rgba(251,191,36,.14)', border: 'rgba(251,191,36,.45)', label: 'تذكير دراسي' },
  EXAM_NEW: { icon: FileText, color: '#8b5cf6', bg: 'rgba(167,139,250,.14)', border: 'rgba(167,139,250,.45)', label: 'امتحان جديد' },
  QUIZ_NEW: { icon: FileText, color: '#8b5cf6', bg: 'rgba(167,139,250,.14)', border: 'rgba(167,139,250,.45)', label: 'كويز جديد' },
  EXAM_CANCELLED: { icon: XCircle, color: '#ef4444', bg: 'rgba(248,113,113,.14)', border: 'rgba(248,113,113,.45)', label: 'إلغاء امتحان' },
  QUIZ_CANCELLED: { icon: XCircle, color: '#ef4444', bg: 'rgba(248,113,113,.14)', border: 'rgba(248,113,113,.45)', label: 'إلغاء كويز' },
  LESSON_REMOVED: { icon: BookOpen, color: '#f97316', bg: 'rgba(251,146,60,.14)', border: 'rgba(251,146,60,.45)', label: 'حذف درس' },
  EXAM_RESULT: { icon: Award, color: '#10b981', bg: 'rgba(52,211,153,.14)', border: 'rgba(52,211,153,.45)', label: 'نتيجتك' },
  EXAM_LEADERBOARD_RANK: { icon: Trophy, color: '#d4af37', bg: 'rgba(212,175,55,.14)', border: 'rgba(212,175,55,.45)', label: 'ترتيبك في الامتحان' },
  QUIZ_RESULT: { icon: Award, color: '#10b981', bg: 'rgba(52,211,153,.14)', border: 'rgba(52,211,153,.45)', label: 'نتيجتك' },
  PAYMENT_APPROVED: { icon: Wallet, color: '#10b981', bg: 'rgba(52,211,153,.14)', border: 'rgba(52,211,153,.45)', label: 'دفعة' },
  PAYMENT_REJECTED: { icon: Wallet, color: '#ef4444', bg: 'rgba(248,113,113,.14)', border: 'rgba(248,113,113,.45)', label: 'دفعة' },
};
const DEFAULT_NOTIF_STYLE = {
  icon: DefaultIcon,
  color: '#d4af37',
  bg: 'rgba(212,175,55,.14)',
  border: 'rgba(212,175,55,.45)',
  label: 'إشعار',
};

/** Short two-note chime generated via Web Audio — no audio asset needed */
const playNotificationSound = () => {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    void ctx.resume();
    const notes = [880, 1174.66]; // A5 → D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.32);
    });
  } catch {
    // Audio unavailable (autoplay policy, no user gesture yet) — silent fallback
  }
};

export const NotificationBell: React.FC<{ active?: boolean }> = ({ active = true }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // حالة الاتصال — أثناء الانقطاع تُخزَّن الإشعارات بصمت وتُعرض عند العودة
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const wasOfflineRef = useRef(false);
  // Perf: إيقاف الـ polling أثناء إخفاء التبويب — يوفر طلبات HTTP عديمة الجدوى
  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );


  useEffect(() => {
    if (!active) return;
    const goOffline = () => {
      wasOfflineRef.current = true;
      setIsOnline(false);
    };
    const goOnline = () => {
      setIsOnline(true);
      // إعادة الجلب فوراً لسحب الإشعارات المتراكمة أثناء الغياب
      void queryClient.invalidateQueries({ queryKey: ['notifications-feed-live'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    };
    // إذا فتح الطالب التطبيق وهو غير متصل أصلاً
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      wasOfflineRef.current = true;
      setIsOnline(false);
    }
    // Perf: إيقاف الـ polling أثناء إخفاء التبويب — توفير طلبات HTTP خلف الكواليس
    const onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsTabVisible(visible);
      if (visible) {
        // عند العودة للتبويب: اجلب فوراً لالتقاط أي إشعارات جديدة فاتت
        void queryClient.invalidateQueries({ queryKey: ['notifications-feed-live'] });
        void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      }
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active, queryClient]);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: active && isAuthenticated && isTabVisible,
    refetchInterval: active && isTabVisible ? COUNT_REFRESH_INTERVAL : false,
    staleTime: 60 * 1000,
  });

  // ─── Live feed: poll recent notifications and detect NEW ones by id ──
  const { data: feed } = useQuery({
    queryKey: ['notifications-feed-live'],
    queryFn: () => notificationsApi.list({ limit: FEED_LIMIT }),
    enabled: active && isAuthenticated && isTabVisible,
    refetchInterval: active && isTabVisible ? FEED_REFRESH_INTERVAL : false,
    staleTime: 45 * 1000,
  });

  useEffect(() => {
    if (!active || !isAuthenticated || !feed?.notifications?.length) return;

    const announced = readAnnounced();

    // Notifications never seen by this browser before
    let targets = feed.notifications.filter((n) => !announced.has(n.id));
    if (targets.length === 0) return;

    // أثناء الانقطاع: لا توست ولا صوت — تبقى غير معلَّمة حتى العودة
    if (!isOnline) return;

    // Very first load ever (empty store): mark everything seen except
    // notifications created within the recent window — so a result toast
    // that lands moments before a page reload still reaches the student.
    let isFirstLoad = false;
    if (!localStorage.getItem(ANNOUNCED_KEY)) {
      isFirstLoad = true;
      const cutoff = Date.now() - FIRST_LOAD_WINDOW_MS;
      targets = targets.filter((n) => new Date(n.createdAt).getTime() > cutoff);
    }

    // عند فتح التطبيق بعد غياب: الإشعارات الأحدث من 24 ساعة تظهر كتوستات،
    // والأقدم منها تُعلَّم كمشاهدة صمتاً (بدون إزعاج)
    const nowMs = Date.now();
    const stale = targets.filter((n) => nowMs - new Date(n.createdAt).getTime() > CATCHUP_MAX_AGE_MS);
    const fresh = targets.filter((n) => nowMs - new Date(n.createdAt).getTime() <= CATCHUP_MAX_AGE_MS);

    if (stale.length > 0) {
      persistAnnounced(
        stale.map((n) => n.id),
        announced,
      );
    }
    if (fresh.length === 0) return;

    // Claim immediately & synchronously — no async guard means this batch
    // can never be dropped or double-fired by a re-render/poll race.
    persistAnnounced(
      fresh.map((n) => n.id),
      announced,
    );

    playNotificationSound();
    queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });

    const showToast = (n: Notification, delayMs: number) => {
      const style = NOTIF_STYLES[n.type] ?? DEFAULT_NOTIF_STYLE;
      const DURATION_MS = 9000;
      setTimeout(() => {
        toast.custom(
          (t) => (
            <FancyToast
              label={style.label}
              title={n.title}
              body={n.body}
              icon={style.icon}
              color={style.color}
              duration={DURATION_MS}
              actionText="فتح الصفحة"
              onClose={() => toast.dismiss(t)}
              onClick={() => {
                toast.dismiss(t);
                if (!n.isRead) void notificationsApi.markAsRead(n.id);
                if (n.linkUrl) navigate(n.linkUrl);
                else navigate('/notifications');
                queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
                queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
              }}
            />
          ),
          { duration: DURATION_MS },
        );
      }, delayMs);
    };

    const show = fresh.slice(0, MAX_TOASTS_PER_BATCH);
    show.forEach((n, i) => showToast(n, i * 500));

    // Anything beyond the cap collapses into ONE summary toast instead of
    // being silently swallowed (this was the old "missing notifications" bug)
    const restCount = fresh.length - show.length;
    if (restCount > 0) {
      setTimeout(() => {
        toast.info(`لديك ${restCount} إشعارات أخرى جديدة`, {
          description: 'اضغط لعرض جميع الإشعارات',
          action: {
            label: 'عرض',
            onClick: () => navigate('/notifications'),
          },
        });
      }, show.length * 500);
    }

    // رسالة ترحيب عند العودة بعد انقطاع — الإشعارات المتراكمة تُعرض أعلاه
    if (!isFirstLoad && stale.length + restCount >= 0 && wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setTimeout(() => {
        toast.success('عدت للاتصال بالإنترنت', {
          description: 'تم عرض الإشعارات التي وصلتك أثناء غيابك',
        });
      }, (show.length + 1) * 500);
    }
  }, [active, feed, isAuthenticated, isOnline, navigate, queryClient]);

  const { data } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => notificationsApi.list({ limit: 6 }),
    enabled: active && isAuthenticated && open,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!active || !isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-full text-ivory hover:text-gold-300 hover:bg-gold-500/10 transition-colors ${
          !isOnline ? 'opacity-70' : ''
        }`}
        title={isOnline ? 'الإشعارات' : 'غير متصل — ستظهر الإشعارات عند العودة'}
      >
        {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        {!isOnline && (
          <span className="absolute bottom-0 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-surface">
            <WifiOff className="w-1.5 h-1.5 text-dark hidden" />
          </span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface-card border border-surface-border shadow-md overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface">
            <span className="text-xs font-bold text-gold-300">الإشعارات</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await notificationsApi.markAllAsRead();
                  queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
                  queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
                }}
                className="flex items-center gap-1 text-[10px] text-gold-400 hover:text-gold-300"
              >
                <CheckCheck className="w-3 h-3" />
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {!data ? (
            <div className="p-6 text-center text-[11px] text-ivory-muted">جاري التحميل...</div>
          ) : data.notifications.length === 0 ? (
            <div className="p-6 text-center text-[11px] text-ivory-muted">
              لا توجد إشعارات حتى الآن.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-surface-border">
              {data.notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!n.isRead) {
                        await notificationsApi.markAsRead(n.id);
                        queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
                        queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
                      }
                      if (n.linkUrl) navigate(n.linkUrl);
                      setOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3 hover:bg-surface transition-colors ${
                      n.isRead ? 'opacity-60' : ''
                    }`}
                  >
                    <p className={`text-xs ${n.isRead ? 'text-ivory-muted' : 'font-bold text-ivory'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-ivory-muted mt-0.5 line-clamp-2">{n.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
            className="w-full py-3 text-[11px] text-gold-400 hover:bg-surface border-t border-surface-border transition-colors"
          >
            عرض جميع الإشعارات
          </button>
        </div>
      )}
    </div>
  );
};
