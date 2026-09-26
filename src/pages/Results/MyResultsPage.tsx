import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  GraduationCap,
  Award,
  Trophy,
  Download,
  Loader2,
  ClipboardList,
  BookOpen,
  CalendarDays,
  Search,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowLeft,
  ChevronLeft,
  Flame,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { examsApi, MyResultItem } from '../../api/exams.api';
import { useMyResultsQuery } from '../../hooks/queries/useExams';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  BookStackSvg,
  PencilSvg,
  DotsPatternSvg,
  CapDoodleSvg,
  ShapesClusterSvg,
  EmptyStateIllustrationSvg,
  Float,
} from '../../components/ui/Doodles';

/* ════════════════════════════════════════════════════════════ */
/*  Animated SVG Score Ring                                     */
/* ════════════════════════════════════════════════════════════ */
const ScoreRing: React.FC<{ percentage: number; passed: boolean; size?: number }> = ({
  percentage,
  passed,
  size = 68,
}) => {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={`relative shrink-0 rounded-full ${
        passed
          ? 'drop-shadow-[0_0_12px_rgba(52,211,153,0.22)]'
          : 'drop-shadow-[0_0_12px_rgba(248,113,113,0.18)]'
      }`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="color-mix(in srgb, var(--surface-border) 80%, transparent)"
          strokeWidth={stroke}
        />
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
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-black tabular-nums leading-none ${
            passed ? 'text-emerald-400' : 'text-red-400'
          }`}
          style={{ fontSize: size * 0.28 }}
        >
          {clamped}%
        </span>
      </div>
    </div>
  );
};

type FilterKey = 'ALL' | 'EXAM' | 'QUIZ' | 'HOMEWORK' | 'PASSED' | 'FAILED';

interface UnifiedResult extends MyResultItem {
  type: 'EXAM' | 'QUIZ' | 'HOMEWORK';
  homeworkId?: string;
  lessonId?: string;
  courseId?: string;
  passingMarks?: number;
}

/* ═════════════════════════════════════════════════════════════ */
/*  Main Component: MyResultsPage                                */
/* ═════════════════════════════════════════════════════════════ */
export const MyResultsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data, isLoading, isError } = useMyResultsQuery();

  // Consolidate all attempts
  const results: UnifiedResult[] = useMemo(() => {
    if (!data) return [];
    return [
      ...data.examAttempts.map((a) => ({ ...a, type: 'EXAM' as const })),
      ...data.quizAttempts.map((a) => ({ ...a, type: 'QUIZ' as const })),
      ...(data.homeworkAttempts ?? []).map((a) => ({ ...a, type: 'HOMEWORK' as const })),
    ].sort(
      (a, b) =>
        new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime(),
    );
  }, [data]);

  // Overall Statistics
  const stats = useMemo(() => {
    const graded = results.filter((r) => r.status !== 'TIMED_OUT' || r.totalMarks > 0);
    const passedCount = results.filter((r) => r.isPassed).length;
    const examsCount = results.filter((r) => r.type === 'EXAM').length;
    const quizzesCount = results.filter((r) => r.type === 'QUIZ').length;
    const homeworksCount = results.filter((r) => r.type === 'HOMEWORK').length;
    const withScore = graded.filter((r) => r.totalMarks > 0);
    const avg =
      withScore.length > 0
        ? Math.round(
            withScore.reduce((acc, r) => acc + (r.score / r.totalMarks) * 100, 0) /
              withScore.length,
          )
        : 0;

    return {
      total: results.length,
      exams: examsCount,
      quizzes: quizzesCount,
      homeworks: homeworksCount,
      passedCount,
      failedCount: results.length - passedCount,
      avg,
    };
  }, [results]);

  // Filtered & Searched Results
  const filtered = useMemo(() => {
    return results.filter((r) => {
      // Type / Status filter
      if (filter === 'EXAM' && r.type !== 'EXAM') return false;
      if (filter === 'QUIZ' && r.type !== 'QUIZ') return false;
      if (filter === 'HOMEWORK' && r.type !== 'HOMEWORK') return false;
      if (filter === 'PASSED' && !r.isPassed) return false;
      if (filter === 'FAILED' && r.isPassed) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = r.title?.toLowerCase().includes(q);
        const matchesCourse = r.courseTitle?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCourse) return false;
      }

      return true;
    });
  }, [results, filter, searchQuery]);

  const handleDownload = async (r: UnifiedResult) => {
    setDownloadingId(r.id);
    try {
      if (r.type === 'EXAM') await examsApi.downloadResultPdf(r.id);
      else if (r.type === 'QUIZ') await examsApi.downloadQuizResultPdf(r.id);
      toast.success('تم تحميل التقرير بنجاح');
    } catch {
      toast.error('تعذر تحميل ملف الـ PDF، حاول مجدداً.');
    } finally {
      setDownloadingId(null);
    }
  };

  /* ── Loading Skeleton State ── */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-right sm:px-6 lg:px-8" dir="rtl">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-4" dir="rtl">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <XCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-ink font-din">تعذر تحميل سجل النتائج</h1>
        <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          حدث خطأ أثناء جلب قائمة النتائج والشهادات، يرجى إعادة تحديث الصفحة أو المحاولة لاحقاً.
        </p>
      </div>
    );
  }

  const hasItems = stats.total > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-10 overflow-x-hidden px-4 py-10 text-right sm:px-6 lg:px-8" dir="rtl">
      {/* ═══════════════ HERO HEADER (Same Design Language as MyBacklogPage) ═══════════════ */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative"
      >
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -top-14 right-1/4 h-64 w-64 rounded-full bg-gold-500/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-0 h-52 w-52 rounded-full bg-emerald-500/[0.05] blur-3xl" />
        <DotsPatternSvg className="pointer-events-none absolute left-2 -top-4 hidden w-20 opacity-25 md:block" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_auto]">
          {/* ── Copy text column ── */}
          <div className="max-w-xl space-y-5">
            <motion.span
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-card/60 px-4 py-1.5 text-[11px] font-bold text-ink-muted backdrop-blur-sm shadow-sm"
            >
              <Trophy className="h-3.5 w-3.5 text-gold-400" />
              سجل الإنجازات والنتائج الدراسية
            </motion.span>

            <h1 className="text-4xl font-black leading-[1.35] text-ink sm:text-[2.75rem] font-din">
              نتائجك{' '}
              <span className="font-amira text-primary relative inline-block">
                وشهاداتك الدراسية
                {/* Animated hand-drawn underline */}
                <svg
                  viewBox="0 0 240 14"
                  fill="none"
                  aria-hidden
                  className="absolute -bottom-2 right-0 h-3 w-full text-gold-400/80"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M6 9 C 60 3, 170 3, 234 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
                  />
                </svg>
              </span>
            </h1>

            <p className="max-w-lg text-sm leading-loose text-ink-muted font-sst">
              كل امتحاناتك، كويزاتك، وواجباتك في مكان واحد مجمّعة ومصنفة — راجع نتيجتك، تابع تطور مستواك، وحمّل تقرير PDF مفصل ومعتمد لكل محاولة.
            </p>

            {/* Micro chips */}
            {hasItems ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-2.5 pt-1"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-400 bg-gold-500/10 border border-gold-500/25 rounded-full px-3.5 py-1">
                  <Award className="w-3.5 h-3.5 text-gold-400" />
                  لديك {stats.total} محاولة مسجلة
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3.5 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {stats.passedCount} محاولة ناجحة
                </span>
                {stats.avg > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/25 rounded-full px-3.5 py-1">
                    <Trophy className="w-3.5 h-3.5 text-sky-400" />
                    متوسط الأداء العام: {stats.avg}%
                  </span>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 text-sm font-bold text-gold-400 pt-1"
              >
                <Sparkles className="w-5 h-5 text-gold-400" />
                <span>ابدأ أول اختبار لك لتسجيل أول نتيجة وإنجاز في ملفك الدراسي!</span>
              </motion.div>
            )}
          </div>

          {/* ── Decorative Doodles cluster ── */}
          <div className="relative hidden w-64 lg:block">
            <Float duration={6} className="relative z-10 w-44 mx-auto">
              <CapDoodleSvg className="w-full drop-shadow-xl" />
            </Float>
            <Float duration={5} delay={0.6} className="absolute -bottom-6 -right-4 w-20 opacity-80">
              <PencilSvg className="w-full" />
            </Float>
            <ShapesClusterSvg className="pointer-events-none absolute -top-8 -left-8 w-24 opacity-30" />
          </div>
        </div>
      </motion.header>

      {/* ═══════════════ STAT CARDS (4 Cards Grid) ═══════════════ */}
      {hasItems && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'إجمالي المحاولات',
              value: stats.total,
              sub: `متوسط عام: ${stats.avg}%`,
              icon: Layers,
              color: 'text-amber-400',
              borderHover: 'hover:border-amber-500/40',
              bgIcon: 'bg-amber-500/10 border-amber-500/20',
            },
            {
              label: 'الامتحانات الشاملة',
              value: stats.exams,
              sub: `${results.filter((r) => r.type === 'EXAM' && r.isPassed).length} امتحان ناجح`,
              icon: GraduationCap,
              color: 'text-purple-400',
              borderHover: 'hover:border-purple-500/40',
              bgIcon: 'bg-purple-500/10 border-purple-500/20',
            },
            {
              label: 'الكويزات الدورية',
              value: stats.quizzes,
              sub: `${results.filter((r) => r.type === 'QUIZ' && r.isPassed).length} كويز مجتاز`,
              icon: ClipboardList,
              color: 'text-violet-400',
              borderHover: 'hover:border-violet-500/40',
              bgIcon: 'bg-violet-500/10 border-violet-500/20',
            },
            {
              label: 'الواجبات الدراسية',
              value: stats.homeworks,
              sub: `${results.filter((r) => r.type === 'HOMEWORK' && r.isPassed).length} واجب معتمد`,
              icon: BookOpen,
              color: 'text-cyan-400',
              borderHover: 'hover:border-cyan-500/40',
              bgIcon: 'bg-cyan-500/10 border-cyan-500/20',
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.35 }}
              className={`relative overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 shadow-card ${card.borderHover}`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.bgIcon} ${card.color}`}
                >
                  <card.icon className="w-5 h-5" />
                </span>
                <span className="text-2xl sm:text-3xl font-black tabular-nums text-ink font-din">
                  {card.value}
                </span>
              </div>
              <p className="text-xs font-bold text-ink leading-tight">{card.label}</p>
              <p className="text-[11px] text-ink-muted/80 mt-0.5 truncate">{card.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══════════════ FILTER TABS & SEARCH BAR ═══════════════ */}
      {hasItems && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'ALL', label: 'الكل', count: results.length },
                { id: 'EXAM', label: 'امتحانات', count: stats.exams },
                { id: 'QUIZ', label: 'كويزات', count: stats.quizzes },
                { id: 'HOMEWORK', label: 'واجبات', count: stats.homeworks },
                { id: 'PASSED', label: 'ناجح فقط', count: stats.passedCount, highlight: true },
                { id: 'FAILED', label: 'تحتاج مراجعة', count: stats.failedCount },
              ].map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id as FilterKey)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                        : 'border border-surface-border bg-surface-card text-ink-muted hover:border-gold-500/30 hover:text-ink'
                    }`}
                  >
                    {tab.highlight && <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-black ${
                        active
                          ? 'bg-gold-400/20 text-gold-300'
                          : 'bg-surface-alt text-ink-muted'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الكورس..."
                className="w-full rounded-full border border-surface-border bg-surface-card pr-9 pl-4 py-1.5 text-xs text-ink placeholder:text-ink-muted/60 focus:border-gold-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ RESULTS LIST ═══════════════ */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-dashed border-surface-border bg-surface-card/60 p-10 sm:p-14 text-center space-y-5"
        >
          <EmptyStateIllustrationSvg className="w-56 sm:w-72 mx-auto" />
          <h3 className="text-lg font-bold text-ink">لا توجد نتائج تطابق بحثك</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'لم نعثر على أي امتحان أو كويز يطابق كلمات البحث الحالية.'
              : 'ابدأ أول اختبار لك في كورساتك المسجلة وستظهر نتيجتك هنا فوراً مع إمكانية مراجعة الأسئلة وتحميل تقرير PDF.'}
          </p>
          <Link to="/courses">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs font-bold text-gold-400 hover:bg-gold-500/20 transition-all cursor-pointer">
              <span>تصفح الكورسات المتاحة</span>
              <ChevronLeft className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((r, i) => {
              const pct = r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0;
              const isExam = r.type === 'EXAM';
              const isQuiz = r.type === 'QUIZ';
              const timedOut = r.status === 'TIMED_OUT';

              const viewUrl = isExam
                ? `/exams/attempts/${r.id}/result`
                : isQuiz
                ? `/quizzes/attempts/${r.id}/result`
                : `/courses/${r.courseId}/learn/homework/${r.lessonId}/result/${r.id}`;

              return (
                <motion.div
                  key={`${r.type}-${r.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.35), duration: 0.28, ease: 'easeOut' }}
                >
                  <div
                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 bg-surface-card shadow-card ${
                      r.isPassed
                        ? 'border-surface-border hover:border-emerald-500/40 hover:shadow-[0_4px_24px_-8px_rgba(52,211,153,0.18)]'
                        : timedOut
                        ? 'border-surface-border hover:border-amber-500/40 hover:shadow-[0_4px_24px_-8px_rgba(245,158,11,0.18)]'
                        : 'border-surface-border hover:border-red-500/40 hover:shadow-[0_4px_24px_-8px_rgba(239,68,68,0.18)]'
                    }`}
                  >
                    {/* Soft edge color bar on right edge (in RTL) */}
                    <span
                      className={`absolute inset-y-2.5 right-0 w-1 rounded-l-full transition-opacity ${
                        r.isPassed
                          ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                          : timedOut
                          ? 'bg-gradient-to-b from-amber-400 to-amber-600'
                          : 'bg-gradient-to-b from-red-400 to-red-600'
                      }`}
                      aria-hidden
                    />

                    {/* Ambient subtle hover glow */}
                    <span
                      className={`pointer-events-none absolute -top-8 -left-8 h-20 w-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity ${
                        r.isPassed
                          ? 'bg-emerald-500/10'
                          : timedOut
                          ? 'bg-amber-500/10'
                          : 'bg-red-500/10'
                      }`}
                    />

                    {/* Content & Score Column */}
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0 pr-1.5">
                      {/* Animated Score Ring */}
                      <ScoreRing percentage={pct} passed={Boolean(r.isPassed)} size={64} />

                      {/* Detail Text */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[15px] font-bold text-ink leading-snug group-hover:text-gold-300 transition-colors">
                            {r.title}
                          </h4>
                        </div>

                        {/* Badges strip */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
                          {/* Type Tag */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              isExam
                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                                : isQuiz
                                ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                            }`}
                          >
                            {isExam ? 'امتحان شامل' : isQuiz ? 'كويز' : 'واجب دراسي'}
                          </span>

                          {/* Pass / Fail status pill */}
                          {timedOut ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              انتهى الوقت
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                r.isPassed
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                  : 'border-red-500/30 bg-red-500/10 text-red-400'
                              }`}
                            >
                              {r.isPassed ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {r.isPassed ? 'تم الاجتياز بنجاح' : 'لم يتم الاجتياز'}
                            </span>
                          )}

                          {/* Attempt number */}
                          <span className="text-[11px] text-ink-muted/80">
                            المحاولة #{r.attemptNumber}
                          </span>

                          {/* Course title */}
                          {r.courseTitle && (
                            <span className="flex items-center gap-1 text-[11px] text-ink-muted/80">
                              · <BookOpen className="w-3 h-3 text-gold-400/80" /> {r.courseTitle}
                            </span>
                          )}

                          {/* Grade breakdown */}
                          <span className="text-[11px] text-ink-muted/80">
                            · الدرجة:{' '}
                            <strong className="font-bold text-gold-400">
                              {r.score} / {r.totalMarks}
                            </strong>
                          </span>

                          {/* Submission Date */}
                          {r.submittedAt && (
                            <span className="flex items-center gap-1 text-[11px] text-ink-muted/80">
                              · <CalendarDays className="w-3 h-3 text-gold-400/80" />
                              {new Date(r.submittedAt).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
                      {/* PDF download button */}
                      {(isExam || isQuiz) && (
                        <button
                          type="button"
                          onClick={() => handleDownload(r)}
                          disabled={downloadingId === r.id}
                          title="تحميل تقرير النتيجة بصيغة PDF"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-alt px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink hover:border-gold-500/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {downloadingId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-gold-400" />
                          )}
                          <span>تقرير PDF</span>
                        </button>
                      )}

                      {/* View result button */}
                      <Link to={viewUrl}>
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-xs font-bold text-gold-400 group-hover:bg-gold-500/20 group-hover:border-gold-500/50 transition-all active:scale-95 shadow-sm">
                          <span>عرض النتيجة</span>
                          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MyResultsPage;
