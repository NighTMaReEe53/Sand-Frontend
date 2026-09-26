import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  GraduationCap,
  ChevronDown,
  Sparkles,
  Users,
  PlayCircle,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  Layers,
  FileText,
  Award,
  ClipboardList,
  Download,
  Loader2,
  MonitorPlay,
  Clock,
  History,
  Target,
  BarChart3,
  Swords,
  Bot,
  Zap,
  Flame,
  Handshake,
  ShieldAlert,
  Trophy,
  AlarmClock,
  Lock,
  ImagePlus,
  Coins,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProfileQuery } from '../../hooks/queries/useProfile';
import { useUpdateProfileMutation, useChangePasswordMutation, useUploadProfileImageMutation } from '../../hooks/mutations/useProfileMutations';
import { useMyResultsQuery } from '../../hooks/queries/useExams';
import { useMyChallengesQuery } from '../../hooks/queries/useChallenges';
import { useMyBacklogQuery } from '../../hooks/queries/useBacklog';
import { examsApi, MyResultItem } from '../../api/exams.api';
import { progressApi } from '../../api/progress.api';
import { coinsApi, CoinBalance } from '../../api/coins.api';
import { avatarsApi } from '../../api/avatars.api';
import { formatDate, formatGradeLevel, formatGradeLevels } from '../../lib/utils';
import { formatTargets } from '../../lib/formatTargets';
import { CourseTargetRef } from '../../types/taxonomy.types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Skeleton, SkeletonProfilePage } from '../../components/ui/Skeleton';
import { HeadingAccent } from '../../components/ui/HeadingAccent';
import { WeeklyReportView } from '../../components/analytics/WeeklyReportView';
import { GradeLevel } from '../../types/auth.types';
import { useAuthStore } from '../../store/authStore';

type StudentTab = 'courses' | 'exams' | 'homeworks' | 'lessons' | 'challenges' | 'backlog';

/* ──────────────────────────────────────────────────────────────── */
/*  Mini animated score ring                                        */
/* ──────────────────────────────────────────────────────────────── */
const MiniScoreRing: React.FC<{ percentage: number; passed: boolean; size?: number }> = ({
  percentage,
  passed,
  size = 64,
}) => {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={passed ? '#34d399' : '#f87171'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-black tabular-nums text-[11px] ${
          passed ? 'text-emerald-300' : 'text-red-300'
        }`}
      >
        {clamped}%
      </span>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/*  Unified result item                                             */
/* ──────────────────────────────────────────────────────────────── */
interface UnifiedResult extends MyResultItem {
  type: 'EXAM' | 'QUIZ';
}

/* ──────────────────────────────────────────────────────────────── */
/*  Collapsible Section wrapper (for report, etc.)                  */
/* ──────────────────────────────────────────────────────────────── */
const CollapsibleSection: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-3xl border border-gold-500/25 bg-surface-card overflow-hidden shadow-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-5 sm:p-6 text-right transition-colors hover:bg-surface/60"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span  className="w-11 h-11 rounded-2xl bg-[var(--primary)] text-gold-400 flex items-center justify-center shrink-0">
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-ivory truncate">{title}</h3>
            {subtitle && <p className="text-xs text-ivory-muted mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gold-400 transition-transform duration-300 shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/*  Exams & Quizzes Tab                                             */
/* ──────────────────────────────────────────────────────────────── */
const ExamsQuizzesTab: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'EXAM' | 'QUIZ'>('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data, isLoading } = useMyResultsQuery();

  const results: UnifiedResult[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.examAttempts.map((a) => ({ ...a, type: 'EXAM' as const })),
      ...data.quizAttempts.map((a) => ({ ...a, type: 'QUIZ' as const })),
    ].sort(
      (a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
    );
  }, [data]);

  const filtered = filter === 'ALL' ? results : results.filter((r) => r.type === filter);

  const handleDownload = async (r: UnifiedResult) => {
    setDownloadingId(r.id);
    try {
      if (r.type === 'EXAM') await examsApi.downloadResultPdf(r.id);
      else await examsApi.downloadQuizResultPdf(r.id);
      toast.success('تم تحميل التقرير بنجاح');
    } catch {
      toast.error('تعذر تحميل ملف الـ PDF، حاول مجدداً.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-16 rounded-3xl bg-surface-card border border-dashed border-surface-border text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
          <FileText className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="text-lg font-bold font-display text-ivory">لم تخوض أي امتحان أو كويز بعد</h3>
        <p className="text-xs text-ivory-muted max-w-md mx-auto leading-relaxed">
          ادخل إلى كورساتك وابدأ حل الامتحانات والكويزات وستظهر نتائجك هنا مباشرة.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: 'ALL', label: 'الكل', count: results.length },
          { key: 'EXAM', label: 'امتحانات', count: results.filter((r) => r.type === 'EXAM').length },
          { key: 'QUIZ', label: 'كويزات', count: results.filter((r) => r.type === 'QUIZ').length },
        ] as const).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              filter === f.key
                ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm'
                : 'border-surface-border text-ivory-muted hover:border-[var(--primary)]/40 hover:text-ivory bg-surface-card'
            }`}
          >
            {f.label}
            <span className="mr-1.5 opacity-60">({f.count})</span>
          </button>
        ))}

        <Link to="/my-results" className="mr-auto">
          <Button size="sm" variant="outline" rightIcon={<ArrowLeft className="w-4 h-4 rotate-180" />}>
            عرض كل النتائج
          </Button>
        </Link>
      </div>

      {/* Attempts list */}
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.slice(0, 8).map((r, i) => {
            const pct = r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0;
            const isExam = r.type === 'EXAM';
            const timedOut = r.status === 'TIMED_OUT';

            return (
              <motion.li
                key={`${r.type}-${r.id}`}
                layout
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
              >
                <div
                  className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                    r.isPassed
                      ? 'border-emerald-500/25 bg-gradient-to-l from-surface-card to-emerald-500/[0.05] hover:border-emerald-500/45'
                      : 'border-red-500/20 bg-gradient-to-l from-surface-card to-red-500/[0.04] hover:border-red-500/40'
                  }`}
                >
                  <span
                    className={`absolute inset-y-0 right-0 w-1 ${
                      isExam
                        ? 'bg-gradient-to-b from-sky-400/70 to-sky-600/70'
                        : 'bg-gradient-to-b from-violet-400/70 to-violet-600/70'
                    }`}
                  />

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <MiniScoreRing percentage={pct} passed={Boolean(r.isPassed)} />

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isExam
                                ? 'border-sky-500/40 text-sky-300 bg-sky-500/10'
                                : 'border-violet-500/40 text-violet-300 bg-violet-500/10'
                            }`}
                          >
                            {isExam ? 'امتحان' : 'كويز'}
                          </span>
                          {timedOut ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-300 bg-amber-500/10">
                              انتهى الوقت
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                r.isPassed
                                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                                  : 'border-red-500/40 text-red-300 bg-red-500/10'
                              }`}
                            >
                              {r.isPassed ? 'ناجح' : 'راسب'}
                            </span>
                          )}
                          <span className="text-[10px] text-ivory-muted/70">
                            المحاولة #{r.attemptNumber}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-ivory truncate">{r.title}</h3>
                        <p className="text-[11px] text-ivory-muted truncate flex items-center gap-1">
                          <BookOpen className="w-3 h-3 shrink-0" />
                          {r.courseTitle}
                          {r.submittedAt && (
                            <span className="mr-2 inline-flex items-center gap-1 opacity-70">
                              <Clock className="w-3 h-3" />
                              {new Date(r.submittedAt).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:block text-xs tabular-nums text-ivory-muted">
                        <span className="font-bold text-gold-300">
                          {r.score} / {r.totalMarks}
                        </span>
                      </span>
                      {(isExam || r.type === 'QUIZ') && (
                        <Link to={isExam ? `/exams/attempts/${r.id}/result` : `/quizzes/attempts/${r.id}/result`}>
                          <button
                            type="button"
                            title="عرض تفاصيل النتيجة"
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-gold-500/40 text-gold-300 bg-gold-500/10 hover:bg-gold-500/20 hover:border-gold-500/60 transition-all"
                          >
                            عرض النتيجة
                          </button>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownload(r)}
                        disabled={downloadingId === r.id}
                        title="تحميل تقرير PDF"
                        className="shrink-0 p-2.5 rounded-xl border border-surface-border text-ivory-muted hover:text-gold-300 hover:border-gold-500/40 transition-all disabled:opacity-50"
                      >
                        {downloadingId === r.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {filtered.length > 8 && (
        <div className="text-center pt-2">
          <Link to="/my-results">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-400 hover:text-gold-300 cursor-pointer">
              مشاهدة باقي المحاولات ({filtered.length - 8})
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/*  Watched Lessons Tab                                             */
/* ──────────────────────────────────────────────────────────────── */
interface WatchedLessonItem {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  title?: string;
  watchedPercentage: number;
  isCompleted: boolean;
  lastWatchedAt: string;
}

const WatchedLessonsTab: React.FC<{ courses: any[] }> = ({ courses }) => {
  const progressQueries = useQueries({
    queries: courses.map((c) => ({
      queryKey: ['course-progress', c.id],
      queryFn: () => progressApi.getCourseProgress(c.id),
      staleTime: 1000 * 60,
      retry: 1,
    })),
  });

  const isLoading = progressQueries.some((q) => q.isLoading);

  const watchedLessons: WatchedLessonItem[] = useMemo(() => {
    const items: WatchedLessonItem[] = [];
    progressQueries.forEach((q, i) => {
      const course = courses[i];
      const data = q.data;
      if (!course || !data) return;
      data.lessons.forEach((l) => {
        if (l.lastWatchedAt && l.watchedPercentage > 0) {
          items.push({
            courseId: course.id,
            courseTitle: data.courseTitle,
            lessonId: l.lessonId,
            title: l.title,
            watchedPercentage: l.watchedPercentage,
            isCompleted: l.isCompleted,
            lastWatchedAt: l.lastWatchedAt,
          });
        }
      });
    });
    return items
      .sort(
        (a, b) =>
          new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
      )
      .slice(0, 12);
  }, [progressQueries, courses]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (watchedLessons.length === 0) {
    return (
      <div className="p-16 rounded-3xl bg-surface-card border border-dashed border-surface-border text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-surface border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
          <MonitorPlay className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="text-lg font-bold font-display text-ivory">لم تشاهد أي درس بعد</h3>
        <p className="text-xs text-ivory-muted max-w-md mx-auto leading-relaxed">
          ابدأ بمشاهدة الدروس في كورساتك وسيتتبع لك سجل المشاهدة هنا تلقائياً لتكمل من حيث توقفت.
        </p>
        {courses.length > 0 && (
          <Link to={`/courses/${courses[0].id}`}>
            <Button size="sm">ابدأ التعلم الآن</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {watchedLessons.map((l, i) => (
        <motion.li
          key={`${l.courseId}-${l.lessonId}`}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.05, 0.35), duration: 0.3 }}
        >
          <Link
            to={`/courses/${l.courseId}/learn`}
            className="block group relative overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-5 hover:border-gold-500/40 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                    l.isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-gold-500/10 border-gold-500/25 text-gold-400'
                  }`}
                >
                  {l.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <PlayCircle className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold-500/30 text-gold-300 bg-gold-500/10">
                      {l.isCompleted ? 'مكتمل' : 'قيد المشاهدة'}
                    </span>
                    <span className="text-[10px] text-ivory-muted/70 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(l.lastWatchedAt).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-ivory truncate group-hover:text-gold-300 transition-colors">
                    {l.title || 'درس بدون عنوان'}
                  </h3>
                  <p className="text-[11px] text-ivory-muted truncate flex items-center gap-1">
                    <BookOpen className="w-3 h-3 shrink-0" />
                    {l.courseTitle}
                  </p>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3 pt-0.5">
                    <div className="flex-1 h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, l.watchedPercentage)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          l.isCompleted
                            ? 'bg-gradient-to-l from-emerald-400 to-emerald-600'
                            : 'bg-gradient-to-l from-gold-400 to-gold-600'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-ivory-muted shrink-0">
                      {Math.round(l.watchedPercentage)}%
                    </span>
                  </div>
                </div>
              </div>

              <span className="shrink-0 hidden sm:flex items-center gap-1 text-[11px] font-bold text-gold-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {l.isCompleted ? 'إعادة المشاهدة' : 'أكمل المشاهدة'}
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </span>
            </div>
          </Link>
        </motion.li>
      ))}
    </ul>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/*  Challenges Tab in Profile                                       */
/* ──────────────────────────────────────────────────────────────── */
const StudentChallengesTab: React.FC = () => {
  const { data: challenges, isLoading } = useMyChallengesQuery();

  const stats = useMemo(() => {
    if (!challenges) return { total: 0, wins: 0, losses: 0, draws: 0, winRate: 0 };
    const completed = challenges.filter((c) => c.status === 'COMPLETED');
    const wins = completed.filter((c) => c.outcome === 'WON').length;
    const losses = completed.filter((c) => c.outcome === 'LOST').length;
    const draws = completed.filter((c) => c.outcome === 'DRAW').length;
    const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;
    return { total: challenges.length, wins, losses, draws, winRate };
  }, [challenges]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!challenges || challenges.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4 shadow-card-dark">
        <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
          <Swords className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold font-display text-ivory">لم تخض أي تحدٍ بعد</h3>
        <p className="text-xs text-ivory-muted max-w-sm mx-auto leading-relaxed">
          نافس زملاءك في كورساتك على أسئلة سريعة أو العب ضد البوت الذكي واختبر سرعتك ومعلوماتك!
        </p>
        <Link to="/challenges">
          <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
            ابدأ أول تحدٍ لك الآن
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border text-center space-y-1">
          <span className="text-[11px] text-ivory-muted block">إجمالي التحديات</span>
          <span className="text-xl font-black font-display text-ivory block tabular-nums">{stats.total}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-emerald-500/30 text-center space-y-1 bg-emerald-500/[0.02]">
          <span className="text-[11px] text-emerald-400 block">مرات الفوز</span>
          <span className="text-xl font-black font-display text-emerald-400 block tabular-nums">{stats.wins}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-red-500/25 text-center space-y-1 bg-red-500/[0.02]">
          <span className="text-[11px] text-red-400 block">الهزائم</span>
          <span className="text-xl font-black font-display text-red-400 block tabular-nums">{stats.losses}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-gold-500/30 text-center space-y-1 bg-gold-500/[0.03]">
          <span className="text-[11px] text-gold-300 block">نسبة الفوز</span>
          <span className="text-xl font-black font-display text-gold-400 block tabular-nums">{stats.winRate}%</span>
        </div>
      </div>

      {/* Challenge items */}
      <div className="space-y-3">
        {challenges.map((c) => {
          const opponentName = c.iAmChallenger ? c.opponent : c.challenger;
          const outcomeBadge =
            c.outcome === 'WON' ? (
              <Badge variant="success" size="sm">
                <Trophy className="w-3 h-3 ml-1" />
                فوز
              </Badge>
            ) : c.outcome === 'LOST' ? (
              <Badge variant="danger" size="sm">
                <ShieldAlert className="w-3 h-3 ml-1" />
                خسارة
              </Badge>
            ) : c.outcome === 'DRAW' ? (
              <Badge variant="warning" size="sm">
                <Handshake className="w-3 h-3 ml-1" />
                تعادل
              </Badge>
            ) : null;

          return (
            <div
              key={c.id}
              className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-ivory truncate">
                    ضد {opponentName}
                  </span>
                  {c.vsBot && (
                    <Badge variant="gold" size="sm">
                      <Bot className="w-3 h-3 ml-0.5" />
                      بوت
                    </Badge>
                  )}
                  {outcomeBadge}
                </div>
                <p className="text-xs text-ivory-muted truncate">{c.courseTitle}</p>
                <p className="text-[11px] text-ivory-muted/70 flex items-center gap-3">
                  <span>{c.questionCount} أسئلة</span>
                  <span>{formatDate(c.createdAt)}</span>
                  {c.myScore != null && c.status === 'COMPLETED' && (
                    <span className="text-gold-400 font-bold font-mono">
                      النتيجة: {c.myScore} {c.opponentScore != null ? ` - ${c.opponentScore}` : ''}
                    </span>
                  )}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {c.status === 'COMPLETED' ? (
                  <Link to={`/challenges/${c.id}/result`}>
                    <Button size="sm" variant="outline">عرض النتيجة والحل</Button>
                  </Link>
                ) : (
                  <Link to={`/challenges/${c.id}`}>
                    <Button size="sm">دخول التحدي</Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────── */
/*  Backlog Tab in Profile — يظهر فقط عند وجود تأخير                */
/* ──────────────────────────────────────────────────────────────── */
const StudentBacklogTab: React.FC = () => {
  const { data, isLoading } = useMyBacklogQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const all = courses.flatMap((c) => c.items);
  const overdueCount = all.filter((i) => i.overdue).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border text-center space-y-1">
          <span className="text-[11px] text-ivory-muted block">إجمالي المتأخرات</span>
          <span className="text-xl font-black font-display text-ivory block tabular-nums">{data?.totalItems ?? 0}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-red-500/25 text-center space-y-1 bg-red-500/[0.02]">
          <span className="text-[11px] text-red-400 block">فات موعدها</span>
          <span className="text-xl font-black font-display text-red-400 block tabular-nums">{overdueCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-surface-border text-center space-y-1">
          <span className="text-[11px] text-ivory-muted block">كورسات بها تأخير</span>
          <span className="text-xl font-black font-display text-gold-400 block tabular-nums">{courses.length}</span>
        </div>
      </div>

      {/* Late items preview */}
      <div className="space-y-2">
        {all.slice(0, 6).map((item, i) => {
          const isQuiz = item.type === 'QUIZ';
          return (
            <Link
              key={`${item.lessonId}-${item.type}`}
              to={`/courses/${item.courseId}/learn?lesson=${item.lessonId}`}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-card border transition-all hover:-translate-y-0.5 ${
                item.overdue
                  ? 'border-red-500/25 hover:border-red-500/45'
                  : 'border-surface-border hover:border-gold-500/40'
              }`}
            >
              <div className="min-w-0 flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 border ${
                    isQuiz
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                      : 'bg-gold-500/10 border-gold-500/25 text-gold-400'
                  }`}
                >
                  {isQuiz ? <ClipboardList className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ivory truncate">
                    الدرس {item.orderIndex} · {item.lessonTitle}
                  </p>
                  <p className="text-[11px] text-ivory-muted truncate">{item.courseTitle}</p>
                </div>
              </div>
              {item.overdue && (
                <Badge variant="danger" size="sm">
                  <Flame className="w-3 h-3 ml-0.5" />
                  متأخر
                </Badge>
              )}
            </Link>
          );
        })}
      </div>

      {/* CTA to full backlog page */}
      {(data?.totalItems ?? 0) > 0 && (
        <Link to="/my-backlog" className="block">
          <Button variant="outline" size="sm" leftIcon={<AlarmClock className="w-4 h-4" />} className="w-full">
            عرض قائمة المتأخرات كاملة
          </Button>
        </Link>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════ */
/*  Main Profile Page                                               */
/* ════════════════════════════════════════════════════════════════ */
export const ProfilePage: React.FC = () => {
  const { role } = useAuthStore();
  const { data: profile, isLoading, isError } = useProfileQuery();
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfileMutation();
  const { mutateAsync: changePassword, isPending: isChangingPassword } = useChangePasswordMutation();
  const { mutateAsync: uploadImage, isPending: isUploadingImage } = useUploadProfileImageMutation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isSavingProfile = isUpdating || isChangingPassword;
  const isStudentRole = role === 'STUDENT';
  const { data: myResults } = useMyResultsQuery(role === 'STUDENT');
  const { data: backlogData } = useMyBacklogQuery(role === 'STUDENT');
  const hasBacklog = role === 'STUDENT' && (backlogData?.totalItems ?? 0) > 0;

  const { data: coinBalanceData } = useQuery<CoinBalance>({
    queryKey: ['coins-balance'],
    queryFn: coinsApi.getBalance,
    enabled: role === 'STUDENT',
  });
  const coinBalance = coinBalanceData?.balance ?? 0;

  const queryClient = useQueryClient();
  const { data: ownedAvatars = [] } = useQuery({
    queryKey: ['avatars-owned'],
    queryFn: avatarsApi.getOwned,
    enabled: isStudentRole,
  });

  const setActiveAvatarMutation = useMutation({
    mutationFn: avatarsApi.setActive,
    onSuccess: (data, avatarId) => {
      toast.success(data.message);
      const chosen = ownedAvatars.find((a) => a.id === avatarId);
      const photoUrl = data.photoUrl ?? chosen?.imageUrl ?? null;
      if (photoUrl) {
        useAuthStore.getState().updateUserProfile({ photoUrl });
        queryClient.setQueryData(['user-profile'], (current: any) =>
          current ? { ...current, photoUrl } : current,
        );
      }
      queryClient.invalidateQueries({ queryKey: ['avatars-owned'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
  });

  const [activeTab, setActiveTab] = useState<StudentTab>('courses');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editGuardianPhone, setEditGuardianPhone] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState<GradeLevel | ''>('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  const openEditModal = () => {
    setEditFullName(profile?.fullName || '');
    setEditGuardianPhone(profile?.guardianPhone || '');
    setEditGradeLevel(profile?.gradeLevel || '');
    setEditSpecialization(profile?.specialization || '');
    setEditBio(profile?.bio || '');
    setEditPhotoUrl(profile?.photoUrl || '');
    setEditCurrentPassword('');
    setEditNewPassword('');
    setEditConfirmPassword('');
    setEditErrorMsg(null);
    setEditSuccessMsg(null);
    setIsEditModalOpen(true);
  };

  /** استخراج رسالة الخطأ من استجابة السيرفر */
  const extractApiError = (err: unknown): string => {
    const msg = (err as any)?.response?.data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  };

  /** TEACHER/ADMIN: اختيار صورة من الجهاز ورفعها فوراً */
  const handlePickLocalImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await uploadImage(file);
      setEditPhotoUrl(res.photoUrl);
      toast.success('تم تحديث صورة الملف الشخصي');
    } catch (err) {
      toast.error(extractApiError(err));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg(null);

    // الطالب يعدّل الاسم وكلمة المرور فقط — ويجب إدخال كلمة المرور الحالية للتأكيد
    if (isStudentRole) {
      if (!editCurrentPassword) {
        setEditErrorMsg('يجب إدخال كلمة المرور الحالية لتأكيد التعديل');
        return;
      }

      const wantsPasswordChange = editNewPassword.length > 0 || editConfirmPassword.length > 0;
      if (wantsPasswordChange) {
        if (editNewPassword !== editConfirmPassword) {
          setEditErrorMsg('كلمتا المرور الجديدتان غير متطابقتين');
          return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(editNewPassword)) {
          setEditErrorMsg('كلمة المرور يجب أن لا تقل عن 8 أحرف وتحتوي على حرف كبير وحرف صغير ورقم واحد على الأقل');
          return;
        }
      }

      try {
        await updateProfile({ fullName: editFullName.trim() || undefined });

        if (wantsPasswordChange) {
          try {
            await changePassword({
              currentPassword: editCurrentPassword,
              newPassword: editNewPassword,
            });
          } catch (err) {
            // كلمة المرور الحالية خاطئة أو التغيير رُفض من السيرفر — الاسم محفوظ لكن نُظهر الخطأ
            setEditErrorMsg(extractApiError(err));
            return;
          }
        }

        setEditSuccessMsg('تم حفظ التعديلات بنجاح!');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setEditSuccessMsg(null);
        }, 1200);
      } catch (err) {
        setEditErrorMsg(extractApiError(err));
      }
      return;
    }

    // المدرس / الأدمن — يعدّلون الاسم والصورة والنبذة، وكلمة المرور اختيارية
    const wantsPasswordChange = editNewPassword.length > 0 || editConfirmPassword.length > 0;
    if (wantsPasswordChange) {
      if (!editCurrentPassword) {
        setEditErrorMsg('أدخل كلمة المرور الحالية لتغيير كلمة المرور');
        return;
      }
      if (editNewPassword !== editConfirmPassword) {
        setEditErrorMsg('كلمتا المرور الجديدتان غير متطابقتين');
        return;
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(editNewPassword)) {
        setEditErrorMsg('كلمة المرور يجب أن لا تقل عن 8 أحرف وتحتوي على حرف كبير وحرف صغير ورقم واحد على الأقل');
        return;
      }
    }

    try {
      await updateProfile({
        bio: role === 'TEACHER' ? editBio.trim() || undefined : undefined,
        fullName: editFullName.trim() || undefined,
        photoUrl: role === 'TEACHER' && editPhotoUrl.trim() ? editPhotoUrl.trim() : undefined,
      });

      if (wantsPasswordChange) {
        try {
          await changePassword({
            currentPassword: editCurrentPassword,
            newPassword: editNewPassword,
          });
        } catch (err) {
          // البيانات محفوظة لكن تغيير كلمة المرور رُفض — نُظهر سبب الرفض
          setEditErrorMsg(extractApiError(err));
          return;
        }
      }

      setEditSuccessMsg('تم حفظ التعديلات بنجاح!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccessMsg(null);
      }, 1200);
    } catch (err) {
      setEditErrorMsg(extractApiError(err));
    }
  };

  /* Student aggregated performance stats */
  const studentStats = useMemo(() => {
    const attempts: UnifiedResult[] = myResults
      ? [
          ...myResults.examAttempts.map((a) => ({ ...a, type: 'EXAM' as const })),
          ...myResults.quizAttempts.map((a) => ({ ...a, type: 'QUIZ' as const })),
        ]
      : [];
    const hwAttempts = (myResults as any)?.homeworkAttempts ?? [];
    const graded = attempts.filter((a) => a.status !== 'TIMED_OUT' || a.totalMarks > 0);
    const withScore = graded.filter((a) => a.totalMarks > 0);
    return {
      courses: profile?.enrolledCourses?.length || 0,
      totalAttempts: attempts.length,
      passedCount: graded.filter((a) => a.isPassed).length,
      homeworksCount: hwAttempts.length,
      avgPct:
        withScore.length > 0
          ? Math.round(
              withScore.reduce((acc, a) => acc + (a.score / a.totalMarks) * 100, 0) /
                withScore.length
            )
          : 0,
    };
  }, [myResults, profile]);

  if (isLoading) {
    return <SkeletonProfilePage />;
  }


  if (isError || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-gold-300">تعذر تحميل بيانات الملف الشخصي</h2>
        <p className="text-xs text-ivory-muted">يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const isTeacher = profile.role === 'TEACHER';
  const isStudent = profile.role === 'STUDENT';
  const isAdmin = profile.role === 'ADMIN';

  const tabs: { key: StudentTab; label: string; Icon: typeof BookOpen }[] = [
    { key: 'courses', label: 'كورساتي', Icon: BookOpen },
    { key: 'exams', label: 'الامتحانات والكويزات', Icon: ClipboardList },
    { key: 'homeworks', label: 'واجباتي', Icon: Award },
    { key: 'lessons', label: 'الدروس المشاهدة', Icon: History },
    { key: 'challenges', label: 'التحديات التنافسية', Icon: Swords },
    // تبويب المتأخرات يظهر فقط للطالب المتأخر عن دروسه أو كويزاته
    ...(hasBacklog ? [{ key: 'backlog' as StudentTab, label: 'المتأخرات', Icon: AlarmClock }] : []),
  ];

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 text-right">
      {/* ─── Hero / Profile Info Card ─────────────────────────────────── */}
      <div className="relative p-5 sm:p-8 rounded-3xl bg-surface-card border border-gold-500/30 overflow-hidden shadow-card-dark">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />
        <Sparkles className="pointer-events-none absolute -bottom-6 -left-6 w-32 h-32 text-gold-500/[0.05]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-right">
          {/* Avatar & Personal Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 min-w-0 w-full md:w-auto">
            <div className="relative shrink-0">
              {isTeacher && (
                <span
                  aria-hidden="true"
                  className="premium-avatar-halo absolute -inset-1.5 rounded-[22px]"
                />
              )}
              <div className="premium-avatar-frame relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 p-0.5 shadow-gold-glow transition-transform duration-500 hover:scale-[1.04]">
                <div className="premium-avatar-shine relative w-full h-full rounded-[14px] bg-bg flex items-center justify-center text-gold-300 font-display font-bold text-3xl overflow-hidden">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.fullName || 'User'}
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.fullName?.[0] || <User className="w-10 h-10 text-gold-400/70" />
                  )}
                </div>
              </div>

              {isTeacher && (
                <>
                  <Zap className="electric-zap w-4 h-4 -top-2 -left-2" strokeWidth={2.4} />
                  <Zap
                    className="electric-zap w-3.5 h-3.5 -bottom-1.5 -right-2"
                    strokeWidth={2.4}
                    style={{ animationDelay: '1.5s' }}
                  />
                  <span className="electric-spark electric-spark-1" />
                  <span className="electric-spark electric-spark-2" />
                  <span className="electric-spark electric-spark-3" />
                </>
              )}

              {(isTeacher || isAdmin) && (
                <span
                  className="absolute -top-1.5 -right-1.5 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-surface-card shadow-md"
                  title={isAdmin ? 'حساب موثّق — مدير المنصة' : 'حساب موثّق — مدرس معتمد'}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </span>
              )}

              {isTeacher && (
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-full bg-gold-gradient px-2.5 py-0.5 text-[9px] font-black text-bg shadow-gold-glow border border-gold-300/60">
                  مدرس
                </span>
              )}
              {isAdmin && (
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-full bg-sky-500/90 px-2.5 py-0.5 text-[9px] font-black text-white shadow-md border border-sky-300/60">
                  أدمن
                </span>
              )}
            </div>

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-ivory truncate max-w-xs sm:max-w-sm">
                  {profile.fullName || 'مستخدم بدون اسم'}
                </h1>
                <Badge variant="gold" size="sm">
                  {isTeacher ? (
                    <>
                      <ShieldCheck className="w-3 h-3 ml-0.5" />
                      مدرس معتمد
                    </>
                  ) : isAdmin ? (
                    'مدير المنصة'
                  ) : (
                    'طالب'
                  )}
                </Badge>
              </div>

              {isTeacher && profile.specialization && (
                <p className="text-xs sm:text-sm text-gold-400 font-medium">{profile.specialization}</p>
              )}

              {isStudent && profile.gradeLevel && (
                <span className="inline-flex items-center gap-1 text-xs text-gold-400 font-medium justify-center sm:justify-start">
                  <GraduationCap className="w-3.5 h-3.5" />
                  المرحلة الدراسية: {formatGradeLevel(profile.gradeLevel)}
                </span>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-ivory-muted pt-1">
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gold-400" />
                    <span dir="ltr">{profile.phone}</span>
                  </span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gold-400" />
                    <span className="truncate max-w-[200px]">{profile.email}</span>
                  </span>
                )}
                {profile.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gold-400" />
                    <span>عضو منذ {formatDate(profile.createdAt)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={openEditModal}
              leftIcon={<Edit3 className="w-4 h-4" />}
              className="flex-1 md:flex-initial text-xs"
            >
              تعديل الملف الشخصي
            </Button>
            {isTeacher && (
              <Link to="/dashboard" className="flex-1 md:flex-initial">
                <Button size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />} className="w-full text-xs">
                  لوحة التحكم
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Teacher Bio */}
        {isTeacher && profile.bio && (
          <div className="mt-6 pt-6 border-t border-surface-border flex items-start gap-2.5 text-right">
            <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-gold-300 font-display mb-1">نبذة عن المدرس</h3>
              <p className="text-xs text-ivory-muted leading-relaxed max-w-3xl">{profile.bio}</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── STUDENT WEEKLY REPORT (collapsible) ──────────────────────── */}
      {isStudent && (
        <CollapsibleSection
          title="تقريري الأسبوعي للأداء"
          subtitle="تقييم شامل لمشاهداتك وامتحاناتك وواجباتك يُحدَّث كل أسبوع"
          icon={<BarChart3 className="w-5 h-5" />}
          defaultOpen
        >
          <WeeklyReportView mode="student" hideHeader />
        </CollapsibleSection>
      )}

      {/* ─── TEACHER VIEW ─────────────────────────────────────────────── */}
      {isTeacher && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: profile.totalCourses || 0, label: 'الكورسات المرفوعة', Icon: BookOpen },
              { value: profile.totalStudents || 0, label: 'إجمالي الطلاب المشتركين', Icon: Users },
              { value: profile.totalLessons || 0, label: 'إجمالي المحاضرات', Icon: PlayCircle },
            ].map(({ value, label, Icon }) => (
              <div
                key={label}
                className="p-5 rounded-2xl bg-bg-elevated border border-surface-border flex items-center justify-between gap-3 transition-all duration-200 hover:border-gold-500/40 hover:-translate-y-0.5"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="block text-2xl font-bold font-display text-gold-300 tabular-nums">
                    {value}
                  </span>
                  <span className="block text-xs text-ivory-muted truncate">{label}</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Teacher Uploaded Courses */}
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold font-display text-gold-300 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gold-400" />
                  الكورسات التي قمت بإنشائها
                </h2>
                <HeadingAccent variant="wave" className="w-24" />
                <p className="text-xs text-ivory-muted pt-1">
                  إدارة محتوى الكورسات والدروس والامتحانات التابعة لك
                </p>
              </div>
              <Link to="/dashboard/courses">
                <Button size="sm" variant="outline" rightIcon={<ArrowLeft className="w-4 h-4 rotate-180" />}>
                  إدارة كل الكورسات
                </Button>
              </Link>
            </div>

            {!profile.courses || profile.courses.length === 0 ? (
              <div className="p-12 rounded-2xl bg-surface-card border border-surface-border text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-surface border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
                  <BookOpen className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-base font-bold font-display text-ivory">لم تقم برفع أي كورس بعد</h3>
                <p className="text-xs text-ivory-muted max-w-sm mx-auto">
                  ابدأ بإنشاء كورس جديد وإضافة الدروس والامتحانات للطلاب.
                </p>
                <Link to="/dashboard/courses">
                  <Button size="sm">إضافة كورس جديد</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.courses.map((course: any) => {
                  const taxonomyTargets = (course as { targets?: CourseTargetRef[] }).targets;
                  const targetGrades = course.gradeLevels?.length
                    ? course.gradeLevels
                    : course.gradeLevel ? [course.gradeLevel] : [];
                  const gradeLabel = taxonomyTargets?.length
                    ? formatTargets(taxonomyTargets.slice(0, 2))
                    : targetGrades.length
                    ? formatGradeLevels(targetGrades)
                    : formatGradeLevel(course.gradeLevel);

                  return (
                    <div
                      key={course.id}
                      className="rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-all flex flex-col overflow-hidden group shadow-card-dark"
                    >
                      <div className="relative h-40 bg-surface overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            loading="lazy"
                            draggable={false}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-bg-elevated text-gold-500/40">
                            <BookOpen className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge variant={course.status === 'PUBLISHED' ? 'success' : 'neutral'} size="sm">
                            {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                          </Badge>
                        </div>
                        {gradeLabel && (
                          <div className="absolute bottom-3 right-3 max-w-[85%]">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-subtle/90 backdrop-blur-sm text-[11px] text-ivory font-bold border border-surface-borderLight truncate shadow-sm">
                              <GraduationCap className="w-3 h-3 text-gold-400 shrink-0" />
                              <span className="truncate">{gradeLabel}</span>
                            </span>
                          </div>
                        )}
                      </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-base font-bold font-display text-ivory group-hover:text-gold-300 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-ivory-muted line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-ivory-muted">
                        <span className="flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5 text-gold-500/70" />
                          {course.totalLessons || 0} دروس
                        </span>
                        <span className="flex items-center gap-1 text-gold-400 font-bold">
                          <Users className="w-3.5 h-3.5" />
                          {course.totalStudents || 0} طلاب
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/courses/${course.id}`} className="flex-1">
                          <Button size="sm" variant="secondary" className="w-full">
                            معاينة
                          </Button>
                        </Link>
                        <Link to="/dashboard/courses" className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            إدارة
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STUDENT VIEW ─────────────────────────────────────────────── */}
      {isStudent && (
        <div className="space-y-6">
          {/* Coins & Avatar Shop */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-l from-gold-500/10 via-surface-card to-violet-500/5 border border-gold-500/20 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-gold-400" />
                <div>
                  <p className="text-2xl font-black text-gold-300">{coinBalance}</p>
                  <p className="text-xs text-ivory-muted">عملات المذاكرة</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/shop/avatars">
                  <Button size="sm" variant="secondary" leftIcon={<ShoppingBag className="w-4 h-4" />} className="text-xs">
                    متجر الأفاتار
                  </Button>
                </Link>
                <Link to="/shop/frames">
                  <Button size="sm" variant="outline" leftIcon={<Sparkles className="w-4 h-4" />} className="text-xs">
                    متجر الإطارات
                  </Button>
                </Link>
              </div>
            </div>

            {/* Owned Avatars Quick Switcher */}
            {ownedAvatars.length > 0 && (
              <div className="pt-3 border-t border-surface-border/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ivory flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                    أفاتاراتي المملوكة ({ownedAvatars.length})
                  </span>
                  <span className="text-[11px] text-ivory-muted">اضغط على أي أفاتار لتفعيله فوراً</span>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 custom-scrollbar [scrollbar-width:none]">
                  {ownedAvatars.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setActiveAvatarMutation.mutate(av.id)}
                      disabled={setActiveAvatarMutation.isPending}
                      title={`تفعيل أفاتار ${av.name}`}
                      className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 transition-all p-0.5 overflow-hidden group cursor-pointer ${
                        av.isActive
                          ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
                          : 'border-surface-border hover:border-gold-400/60 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {av.imageUrl ? (
                        <img src={av.imageUrl} alt={av.name} draggable={false} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full bg-surface-card flex items-center justify-center text-xs font-bold text-gold-300">
                          {av.name[0]}
                        </div>
                      )}
                      {av.isActive && (
                        <span className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold text-center py-0.5">
                          مفعّل
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Performance stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {[
              { label: 'كورساتي', value: studentStats.courses, Icon: BookOpen, tone: 'text-gold-300' },
              { label: 'الامتحانات والكويزات', value: studentStats.totalAttempts, Icon: FileText, tone: 'text-sky-300' },
              { label: 'الواجبات المنجزة', value: studentStats.homeworksCount, Icon: Award, tone: 'text-emerald-300' },
              { label: 'متوسط الأداء %', value: studentStats.avgPct, Icon: Target, tone: 'text-violet-300' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-surface-border bg-surface-card p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 hover:border-gold-500/30 transition-colors min-w-0"
              >
                <span className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-current/20 ${s.tone}`}>
                  <s.Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div className="leading-tight min-w-0 flex-1">
                  <p className="text-lg sm:text-xl font-black tabular-nums truncate">{s.value}</p>
                  <p className="text-[10px] sm:text-[11px] text-ivory-muted truncate">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Responsive Tabs Bar (Horizontal Scroll on Mobile) */}
          <div className="w-full flex items-center gap-2 overflow-x-auto custom-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-surface-border pb-3">
            {tabs.map(({ key, label, Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`group relative flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer whitespace-nowrap shrink-0 shadow-sm ${
                    isActive
                      ? 'bg-[var(--primary)] text-white font-black shadow-md border border-[var(--primary)]'
                      : 'bg-surface-card border border-surface-border text-ivory-muted hover:bg-[var(--surface-alt)] hover:text-ivory hover:border-[var(--primary)]/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-[var(--primary)] group-hover:opacity-100 opacity-80'}`} />
                  <span className={isActive ? 'text-white' : ''}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'courses' && (
                <div className="space-y-6">
                  <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-bold font-display text-gold-300 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gold-400" />
                        تقدمك في الكورسات
                      </h2>
                      <HeadingAccent variant="dots" className="w-24" />
                      <p className="text-xs text-ivory-muted pt-1">
                        قائمة الكورسات المفعلة بحسابك للمشاهدة وحل الامتحانات
                      </p>
                    </div>
                    <Link to="/courses">
                      <Button size="sm" variant="outline" rightIcon={<ArrowLeft className="w-4 h-4 rotate-180" />}>
                        تصفح كل الكورسات
                      </Button>
                    </Link>
                  </div>

                  {!profile.enrolledCourses || profile.enrolledCourses.length === 0 ? (
                    <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4 shadow-card-dark">
                      <div className="w-16 h-16 rounded-full bg-surface border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
                        <BookOpen className="w-8 h-8 opacity-40" />
                      </div>
                      <h3 className="text-lg font-bold font-display text-ivory">لم تشترك في أي كورس بعد</h3>
                      <p className="text-xs text-ivory-muted max-w-md mx-auto leading-relaxed">
                        تصفح قائمة الكورسات والمحاضرات واختر المرحلة الدراسية المناسبة لك للبدء في المذاكرة وحل الامتحانات.
                      </p>
                      <HeadingAccent variant="diamond" className="mx-auto w-20" />
                      <div className="pt-2">
                        <Link to="/courses">
                          <Button size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                            تصفح الكورسات
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.enrolledCourses.map((course: any) => {
                        const taxonomyTargets = (course as { targets?: CourseTargetRef[] }).targets;
                        const targetGrades = course.gradeLevels?.length
                          ? course.gradeLevels
                          : course.gradeLevel ? [course.gradeLevel] : [];
                        const gradeLabel = taxonomyTargets?.length
                          ? formatTargets(taxonomyTargets.slice(0, 2))
                          : targetGrades.length
                          ? formatGradeLevels(targetGrades)
                          : formatGradeLevel(course.gradeLevel);

                        return (
                          <div
                            key={course.id}
                            className="rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-all flex flex-col overflow-hidden group shadow-card-dark"
                          >
                            <div className="relative h-40 bg-surface overflow-hidden">
                              {course.thumbnailUrl ? (
                                <img
                                  src={course.thumbnailUrl}
                                  alt={course.title}
                                  loading="lazy"
                                  draggable={false}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-bg-elevated text-gold-500/40">
                                  <BookOpen className="w-10 h-10" />
                                </div>
                              )}

                              <div className="absolute top-2 left-2">
                                <Badge variant="success" className="bg-indigo-500 text-white" size="sm">مشترك ونشط</Badge>
                              </div>

                              <div className="absolute bottom-3 right-3 max-w-[85%]">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-subtle/90 backdrop-blur-sm text-[11px] text-ivory font-bold border border-surface-borderLight truncate shadow-sm">
                                  <GraduationCap className="w-3 h-3 text-gold-400 shrink-0" />
                                  <span className="truncate">{gradeLabel}</span>
                                </span>
                              </div>
                            </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-1.5">
                              <h3 className="text-base font-bold font-display text-ivory group-hover:text-gold-300 transition-colors line-clamp-1">
                                {course.title}
                              </h3>
                              <p className="text-xs text-ivory-muted line-clamp-2 leading-relaxed">
                                {course.description}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-ivory-muted">
                              <span className="flex items-center gap-1">
                                <PlayCircle className="w-3.5 h-3.5 text-gold-500/70" />
                                {course._count?.lessons || 0} دروس
                              </span>
                              <span className="flex items-center gap-1 text-gold-400">
                                <User className="w-3.5 h-3.5" />
{course.teacher?.fullName || 'فريق سند التعليمي'}
                              </span>
                            </div>

                            <Link to={`/courses/${course.id}`}>
                              <Button size="sm" variant="primary" className="w-full" leftIcon={<PlayCircle className="w-4 h-4" />}>
                                استكمل التعلم
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'exams' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-gold-300 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-gold-400" />
                      امتحاناتي وكويزاتي
                    </h2>
                    <HeadingAccent variant="wave" className="w-24" />
                    <p className="text-xs text-ivory-muted pt-1">
                      آخر محاولاتك في الامتحانات والكويزات مع درجاتك وإمكانية تحميل التقرير
                    </p>
                  </div>
                  <ExamsQuizzesTab />
                </div>
              )}

              {activeTab === 'homeworks' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-gold-300 flex items-center gap-2">
                      <Award className="w-5 h-5 text-gold-400" />
                      واجباتي
                    </h2>
                    <HeadingAccent variant="dots" className="w-24" />
                    <p className="text-xs text-ivory-muted pt-1">
                      نتائج وتسليمات الواجبات عبر جميع كورساتك
                    </p>
                  </div>

                  {(() => {
                    const hwAttempts = (myResults as any)?.homeworkAttempts ?? [];
                    if (!myResults) return (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-20 w-full rounded-2xl" />))}
                      </div>
                    );
                    if (hwAttempts.length === 0) return (
                      <div className="p-16 rounded-3xl bg-surface-card border border-dashed border-surface-border text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-surface border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto">
                          <Award className="w-8 h-8 opacity-40" />
                        </div>
                        <h3 className="text-lg font-bold font-display text-ivory">لم تسلّم أي واجب بعد</h3>
                        <p className="text-xs text-ivory-muted max-w-md mx-auto leading-relaxed">
                          ادخل إلى كورساتك وابدأ حل الواجبات وستظهر نتائجك هنا.
                        </p>
                      </div>
                    );
                    return (
                      <ul className="space-y-3">
                        {hwAttempts.slice(0, 10).map((hw: any, i: number) => {
                          const pct = hw.totalMarks > 0 ? Math.round((hw.earnedMarks / hw.totalMarks) * 100) : hw.score ?? 0;
                          return (
                            <motion.li
                              key={hw.id}
                              layout
                              initial={{ opacity: 0, x: 18 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -18 }}
                              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.3 }}
                            >
                              <div className={`group relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                                hw.hasPendingEssay
                                  ? 'border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50'
                                  : hw.isPassed
                                    ? 'border-emerald-500/25 bg-gradient-to-l from-surface-card to-emerald-500/[0.05] hover:border-emerald-500/45'
                                    : 'border-red-500/20 bg-gradient-to-l from-surface-card to-red-500/[0.04] hover:border-red-500/40'
                              }`}>
                                <span className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-violet-400/70 to-violet-600/70" />
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <MiniScoreRing percentage={pct} passed={Boolean(hw.isPassed)} />
                                    <div className="min-w-0 space-y-1.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-500/40 text-violet-300 bg-violet-500/10">
                                          واجب
                                        </span>
                                        {hw.hasPendingEssay ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-300 bg-amber-500/10 animate-pulse">
                                            قيد مراجعة الأستاذ ⏳
                                          </span>
                                        ) : (
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            hw.isPassed
                                              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                                              : 'border-red-500/40 text-red-300 bg-red-500/10'
                                          }`}>
                                            {hw.isPassed ? 'ناجح ✓' : 'راسب'}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-ivory-muted/70">المحاولة #{hw.attemptNumber}</span>
                                      </div>
                                      <h3 className="text-sm font-bold text-ivory truncate">{hw.title}</h3>
                                      <p className="text-[11px] text-ivory-muted truncate flex items-center gap-1">
                                        <BookOpen className="w-3 h-3 shrink-0" />
                                        {hw.courseTitle}
                                        {hw.submittedAt && (
                                          <span className="mr-2 inline-flex items-center gap-1 opacity-70">
                                            <Clock className="w-3 h-3" />
                                            {new Date(hw.submittedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="hidden sm:block text-xs tabular-nums text-ivory-muted">
                                      <span className="font-bold text-gold-300">{hw.earnedMarks} / {hw.totalMarks}</span>
                                    </span>
                                    <Link to={`/courses/${hw.courseId}/learn/homework/${hw.lessonId}/result/${hw.id}`}>
                                      <button type="button" title="فتح الدرس" className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-violet-500/40 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 transition-all">
                                        عرض النتيجة
                                      </button>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </motion.li>
                          );
                        })}
                      </ul>
                    );
                  })()}
                </div>
              )}


              {activeTab === 'lessons' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-gold-300 flex items-center gap-2">
                      <MonitorPlay className="w-5 h-5 text-gold-400" />
                      الدروس التي شاهدتها
                    </h2>
                    <HeadingAccent variant="diamond" className="w-24" />
                    <p className="text-xs text-ivory-muted pt-1">
                      سجل مشاهدتك لآخر الدروس عبر جميع كورساتك — أكمل من حيث توقفت
                    </p>
                  </div>
                  <WatchedLessonsTab courses={profile.enrolledCourses || []} />
                </div>
              )}

              {activeTab === 'challenges' && (
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-bold font-display text-gold-300 flex items-center gap-2">
                        <Swords className="w-5 h-5 text-gold-400" />
                        سجل التحديات التنافسية
                      </h2>
                      <HeadingAccent variant="wave" className="w-24" />
                      <p className="text-xs text-ivory-muted pt-1">
                        سجل مواجهاتك السريعة ضد زملائك والبوت الذكي ونتائجك
                      </p>
                    </div>
                    <Link to="/challenges">
                      <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
                        خوض تحدٍ جديد
                      </Button>
                    </Link>
                  </div>
                  <StudentChallengesTab />
                </div>
              )}

              {activeTab === 'backlog' && hasBacklog && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-gold-300 flex items-center gap-2">
                      <AlarmClock className="w-5 h-5 text-red-400" />
                      متأخراتك الدراسية
                    </h2>
                    <HeadingAccent variant="wave" className="w-24" />
                    <p className="text-xs text-ivory-muted pt-1">
                      الدروس والكويزات التي تأخرت عنها — نظّم وقتك وأنجزها في أقرب وقت
                    </p>
                  </div>
                  <StudentBacklogTab />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ─── Edit Profile Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="تعديل بيانات الملف الشخصي"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-right">
          {editSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{editSuccessMsg}</span>
            </div>
          )}

          {editErrorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editErrorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ivory mb-1.5">الاسم الكامل</label>
            <Input
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              required
            />
          </div>

          {isStudentRole && (
            <>
              {/* الطالب يعدّل اسمه وكلمة مروره فقط — كلمة المرور الحالية مطلوبة دائماً */}
              <div className="pt-2 border-t border-surface-border space-y-3">
                <p className="text-[11px] font-bold text-gold-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  تأكيد الهوية — أدخل كلمة المرور الحالية لحفظ أي تعديل
                </p>

                <div>
                  <label className="block text-xs font-medium text-ivory mb-1.5">
                    كلمة المرور الحالية <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="password"
                    value={editCurrentPassword}
                    onChange={(e) => setEditCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ivory mb-1.5">كلمة المرور الجديدة</label>
                    <Input
                      type="password"
                      value={editNewPassword}
                      onChange={(e) => setEditNewPassword(e.target.value)}
                      placeholder="اتركها فارغة لعدم التغيير"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ivory mb-1.5">تأكيد كلمة المرور الجديدة</label>
                    <Input
                      type="password"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      autoComplete="new-password"
                      disabled={editNewPassword.length === 0}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-ivory-muted">
                  كلمة المرور الجديدة: 8 أحرف على الأقل وتحتوي حرف كبير وحرف صغير ورقم
                </p>
              </div>
            </>
          )}

          {(isTeacher || isAdmin) && (
            <>
              {/* صورة الملف الشخصي — رفع من الجهاز أو رابط مع معاينة مباشرة */}
              <div>
                <label className="block text-xs font-medium text-ivory mb-1.5">صورة الملف الشخصي</label>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gold-500/30 bg-bg shrink-0 flex items-center justify-center">
                    {editPhotoUrl.trim() ? (
                      <img
                        src={editPhotoUrl.trim()}
                        alt="معاينة"
                        draggable={false}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <User className="w-6 h-6 text-gold-400/60" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    {/* رفع صورة محلية من الجهاز */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePickLocalImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={isUploadingImage}
                      leftIcon={<ImagePlus className="w-4 h-4" />}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      رفع صورة من الجهاز
                    </Button>
                    <Input
                      value={editPhotoUrl}
                      onChange={(e) => setEditPhotoUrl(e.target.value)}
                      placeholder="أو الصق رابط صورة…"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* المسمى — يُعدَّل من قبل الإدارة فقط */}
              <div>
                <label className="block text-xs font-medium text-ivory mb-1.5">المسمى / التخصص</label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-bg-elevated border border-surface-border">
                  <Lock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span className="text-xs text-ivory-muted">
                    {editSpecialization || 'لم يحدد بعد'}
                  </span>
                </div>
                <p className="text-[10px] text-ivory-muted mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  لا يمكن تعديل المسمى إلا بواسطة إدارة المنصة.
                </p>
              </div>

              {isTeacher && (
                <div>
                  <label className="block text-xs font-medium text-ivory mb-1.5">نبذة عن المدرس (Bio)</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full bg-surface border border-surface-border text-ivory rounded-xl p-3 text-xs outline-none focus:border-gold-400 resize-none leading-relaxed"
                    placeholder="اكتب نبذة مختصرة عن مسيرتك وخبراتك..."
                  />
                </div>
              )}

              {/* تغيير كلمة المرور — اختيارية للمدرس والأدمن */}
              <div className="pt-2 border-t border-surface-border space-y-3">
                <p className="text-[11px] font-bold text-gold-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  تغيير كلمة المرور (اختياري)
                </p>

                <div>
                  <label className="block text-xs font-medium text-ivory mb-1.5">كلمة المرور الحالية</label>
                  <Input
                    type="password"
                    value={editCurrentPassword}
                    onChange={(e) => setEditCurrentPassword(e.target.value)}
                    placeholder="مطلوبة فقط عند تغيير كلمة المرور"
                    autoComplete="current-password"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ivory mb-1.5">كلمة المرور الجديدة</label>
                    <Input
                      type="password"
                      value={editNewPassword}
                      onChange={(e) => setEditNewPassword(e.target.value)}
                      placeholder="اتركها فارغة لعدم التغيير"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ivory mb-1.5">تأكيد كلمة المرور الجديدة</label>
                    <Input
                      type="password"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      placeholder="أعد إدخال كلمة المرور الجديدة"
                      autoComplete="new-password"
                      disabled={editNewPassword.length === 0}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-ivory-muted">
                  كلمة المرور الجديدة: 8 أحرف على الأقل وتحتوي حرف كبير وحرف صغير ورقم
                </p>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" size="sm" isLoading={isSavingProfile}>
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
