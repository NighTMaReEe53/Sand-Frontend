import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  GraduationCap,
  Layers,
  PlayCircle,
  ChevronDown,
  Sparkles,
  BookOpen,
  Filter,
  Search,
  CheckCheck,
  CalendarDays,
  AlarmClock,
} from 'lucide-react';
import { useMyBacklogQuery } from '../../hooks/queries/useBacklog';
import { BacklogItem } from '../../types/backlog.types';
import {
  BookStackSvg,
  PencilSvg,
  CurvedArrowSvg,
  DotsPatternSvg,
  ShapesClusterSvg,
  EmptyStateIllustrationSvg,
  Float,
} from '../../components/ui/Doodles';
import { Skeleton } from '../../components/ui/Skeleton';

/* ── helpers ──────────────────────────────────────────────── */
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  return `${m} دقيقة`;
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
};

type FilterType = 'ALL' | 'OVERDUE' | 'QUIZ' | 'HOMEWORK' | 'VIDEO' | 'EXAM';

/* ─── Single backlog row card ────────────────────────────────── */
const BacklogRowCard: React.FC<{ item: BacklogItem; index: number }> = ({ item, index }) => {
  const isQuiz = item.type === 'QUIZ';
  const isHomework = item.type === 'HOMEWORK';
  const isExam = item.type === 'EXAM';
  const isVideo = item.type === 'VIDEO';

  const linkUrl = isExam
    ? `/courses/${item.courseId}/exams`
    : isHomework
    ? `/courses/${item.courseId}/learn?lesson=${item.lessonId}&tab=homework`
    : `/courses/${item.courseId}/learn?lesson=${item.lessonId}`;

  const ctaLabel = isQuiz
    ? 'حل الكويز'
    : isHomework
    ? 'حل الواجب'
    : isExam
    ? 'دخول الامتحان'
    : item.watchedPercentage > 0
    ? 'متابعة الدرس'
    : 'بدء الدرس';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35), duration: 0.28, ease: 'easeOut' }}
    >
      <Link
        to={linkUrl}
        className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
          item.overdue
            ? 'border-red-500/30 bg-surface-card hover:border-red-500/50 hover:shadow-[0_4px_24px_-8px_rgba(239,68,68,0.22)]'
            : 'border-surface-border bg-surface-card hover:border-gold-500/40 hover:shadow-[0_4px_24px_-8px_rgba(201,161,90,0.18)]'
        }`}
      >
        {/* Soft edge color bar on right edge (in RTL) */}
        <span
          className={`absolute inset-y-2.5 right-0 w-1 rounded-l-full transition-opacity ${
            item.overdue
              ? 'bg-gradient-to-b from-red-400 to-red-600'
              : isQuiz
              ? 'bg-gradient-to-b from-violet-400 to-violet-600'
              : isHomework
              ? 'bg-gradient-to-b from-cyan-400 to-cyan-600'
              : isExam
              ? 'bg-gradient-to-b from-purple-400 to-purple-600'
              : 'bg-gradient-to-b from-gold-400 to-gold-600'
          }`}
          aria-hidden
        />

        {/* Ambient subtle glow */}
        <span
          className={`pointer-events-none absolute -top-8 -left-8 h-20 w-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity ${
            item.overdue ? 'bg-red-500/10' : 'bg-gold-500/10'
          }`}
        />

        {/* Content column */}
        <div className="min-w-0 flex items-start gap-3.5 flex-1 pr-1.5">
          {/* Icon badge */}
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 ${
              isQuiz
                ? 'bg-violet-500/10 border-violet-500/25 text-violet-400'
                : isHomework
                ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400'
                : isExam
                ? 'bg-purple-500/10 border-purple-500/25 text-purple-400'
                : 'bg-gold-500/10 border-gold-500/25 text-gold-400'
            }`}
          >
            {isQuiz ? (
              <ClipboardList className="w-5 h-5" />
            ) : isHomework ? (
              <Layers className="w-5 h-5" />
            ) : isExam ? (
              <GraduationCap className="w-5 h-5" />
            ) : (
              <PlayCircle className="w-5 h-5" />
            )}
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[15px] font-bold text-ink leading-snug group-hover:text-gold-300 transition-colors">
                {item.orderIndex > 0 ? (
                  <span className="text-gold-400 ml-1.5 font-black">الدرس {item.orderIndex}:</span>
                ) : null}
                {item.lessonTitle}
              </h4>
            </div>

            {/* Badges strip */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
              {/* Type tag */}
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                  isQuiz
                    ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                    : isHomework
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                    : isExam
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                    : 'border-gold-500/30 bg-gold-500/10 text-gold-400'
                }`}
              >
                {isQuiz ? 'كويز' : isHomework ? 'واجب دراسي' : isExam ? 'امتحان' : 'فيديو تعليمي'}
              </span>

              {/* Duration or extra */}
              {isVideo && item.durationSeconds > 0 && (
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3 text-gold-400/80" />
                  {formatDuration(item.durationSeconds)}
                </span>
              )}

              {/* Due Date */}
              {item.dueDate && (
                <span className="flex items-center gap-1 text-[11px]">
                  <CalendarDays className="w-3 h-3 text-gold-400/80" />
                  تسليم قبل: {formatDate(item.dueDate)}
                </span>
              )}

              {/* Overdue alert badge */}
              {item.overdue && (
                <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-400">
                  <Flame className="w-3 h-3 text-red-400 animate-pulse" />
                  فات موعد التسليم
                </span>
              )}
            </div>

            {/* Video watch progress bar */}
            {isVideo && item.watchedPercentage > 0 && (
              <div className="pt-1 flex items-center gap-2 max-w-xs">
                <div className="h-1.5 flex-1 rounded-full bg-surface-alt border border-surface-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, item.watchedPercentage)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      item.watchedPercentage >= 80
                        ? 'bg-gradient-to-l from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-l from-gold-400 to-gold-600'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-bold text-ink-muted/80 tabular-nums">
                  {item.watchedPercentage}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-xs font-bold text-gold-400 group-hover:bg-gold-500/20 group-hover:border-gold-500/50 transition-all active:scale-95 shadow-sm">
            <span>{ctaLabel}</span>
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

/* ─── Collapsible Course Section ─────────────────────────────── */
const CourseBacklogSection: React.FC<{
  courseTitle: string;
  courseId: string;
  items: BacklogItem[];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}> = ({ courseTitle, courseId, items, isOpen, onToggle, index }) => {
  const overdueCount = items.filter((i) => i.overdue).length;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.35 }}
      className={`overflow-hidden rounded-3xl border bg-surface-card transition-all duration-300 ${
        isOpen
          ? 'border-gold-500/40 shadow-[0_4px_30px_-10px_rgba(201,161,90,0.18)]'
          : 'border-surface-border hover:border-gold-500/30 hover:shadow-md'
      }`}
    >
      {/* Course Card Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3.5 text-right flex-1 min-w-0 cursor-pointer group"
          aria-expanded={isOpen}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold-500/30 bg-gold-500/10 text-gold-400 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-ink group-hover:text-gold-300 transition-colors leading-snug">
                {courseTitle}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
              <span className="font-semibold text-gold-400/90">{items.length} مهام متبقية</span>
              {overdueCount > 0 && (
                <span className="inline-flex items-center gap-1 font-bold text-red-400">
                  · <Flame className="w-3.5 h-3.5" /> {overdueCount} فات موعدها
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Action button & expand chevron */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border justify-between sm:justify-end">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-alt/70 px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-gold-300 hover:border-gold-500/30 transition-all"
          >
            <span>صفحة الكورس</span>
          </Link>

          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 text-ink-muted hover:text-ink cursor-pointer rounded-lg hover:bg-surface-alt transition-colors"
            aria-label="تبديل القائمة"
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-gold-400' : 'text-ink-muted'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="space-y-3 border-t border-dashed border-surface-border bg-bg-subtle/30 p-4 sm:p-5">
              {items.map((item, i) => (
                <BacklogRowCard key={`${item.lessonId}-${item.type}-${i}`} item={item} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

/* ═════════════════════════════════════════════════════════════ */
/*  Page Component                                               */
/* ═════════════════════════════════════════════════════════════ */
export const MyBacklogPage: React.FC = () => {
  const { data, isLoading, isError } = useMyBacklogQuery();
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCourses, setCollapsedCourses] = useState<Record<string, boolean>>({});

  // Compute all items & stats
  const courses = useMemo(() => data?.courses ?? [], [data]);
  const allItems = useMemo(() => courses.flatMap((c) => c.items), [courses]);

  const stats = useMemo(() => {
    return {
      total: allItems.length,
      overdue: allItems.filter((i) => i.overdue).length,
      quizzes: allItems.filter((i) => i.type === 'QUIZ').length,
      homeworks: allItems.filter((i) => i.type === 'HOMEWORK').length,
      videos: allItems.filter((i) => i.type === 'VIDEO').length,
      exams: allItems.filter((i) => i.type === 'EXAM').length,
      courseCount: courses.length,
    };
  }, [allItems, courses]);

  // Filter items per course
  const filteredCourses = useMemo(() => {
    return courses
      .map((c) => {
        let items = c.items;

        // Filter by type
        if (filterType === 'OVERDUE') {
          items = items.filter((i) => i.overdue);
        } else if (filterType === 'QUIZ') {
          items = items.filter((i) => i.type === 'QUIZ');
        } else if (filterType === 'HOMEWORK') {
          items = items.filter((i) => i.type === 'HOMEWORK');
        } else if (filterType === 'VIDEO') {
          items = items.filter((i) => i.type === 'VIDEO');
        } else if (filterType === 'EXAM') {
          items = items.filter((i) => i.type === 'EXAM');
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          items = items.filter(
            (i) =>
              i.lessonTitle.toLowerCase().includes(q) ||
              c.courseTitle.toLowerCase().includes(q)
          );
        }

        return { ...c, items };
      })
      .filter((c) => c.items.length > 0);
  }, [courses, filterType, searchQuery]);

  const toggleCourse = (courseId: string) => {
    setCollapsedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const toggleAllCourses = (collapse: boolean) => {
    const newState: Record<string, boolean> = {};
    courses.forEach((c) => {
      newState[c.courseId] = collapse;
    });
    setCollapsedCourses(newState);
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-3xl" />
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
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-ink font-din">تعذر تحميل قائمة المتأخرات</h1>
        <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          حدث خطأ أثناء جلب قائمة المتأخرات، يرجى إعادة تحديث الصفحة أو المحاولة لاحقاً.
        </p>
      </div>
    );
  }

  const hasItems = stats.total > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-10 overflow-x-hidden px-4 py-10 text-right sm:px-6 lg:px-8" dir="rtl">
      {/* ═══════════════ HERO HEADER (Same Design Language as MyMistakesPage) ═══════════════ */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative"
      >
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -top-14 right-1/4 h-64 w-64 rounded-full bg-gold-500/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-0 h-52 w-52 rounded-full bg-red-500/[0.05] blur-3xl" />
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
              <AlarmClock className="h-3.5 w-3.5 text-red-400" />
              قائمة المتأخرات والمهام الدراسية
            </motion.span>

            <h1 className="text-4xl font-black leading-[1.35] text-ink sm:text-[2.75rem] font-din">
              أنجز{' '}
              <span className="font-amira text-primary relative inline-block">
                متأخراتك الدراسية
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
              كل الدروس، الكويزات، والواجبات التي تنتظر إكمالك مجمّعة ومرتبة لك — نظّم وقتك، وتخلّص من التراكمات أولاً بأول لتضمن أفضل تفوق في امتحاناتك.
            </p>

            {/* Micro chips */}
            {hasItems ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-2.5 pt-1"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-3.5 py-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  لديك {stats.total} مهمة تحتاج لإنجاز
                </span>
                {stats.overdue > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-full px-3.5 py-1">
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    {stats.overdue} فات موعدها
                  </span>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 text-sm font-bold text-emerald-400 pt-1"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>رائع جداً! لا يوجد أي تأخير — أنت متقدم في جدولك الدراسي تماماً.</span>
              </motion.div>
            )}
          </div>

          {/* ── Decorative Doodles cluster ── */}
          <div className="relative hidden w-64 lg:block">
            <Float duration={6} className="relative z-10 w-44 mx-auto">
              <BookStackSvg className="w-full drop-shadow-xl" />
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
              label: 'إجمالي المتأخرات',
              value: stats.total,
              sub: 'عبر كل الكورسات',
              icon: Layers,
              color: 'text-amber-400',
              borderHover: 'hover:border-amber-500/40',
              bgIcon: 'bg-amber-500/10 border-amber-500/20',
            },
            {
              label: 'فات موعدها',
              value: stats.overdue,
              sub: 'أولوية قصوى',
              icon: Flame,
              color: 'text-red-400',
              borderHover: 'hover:border-red-500/40',
              bgIcon: 'bg-red-500/10 border-red-500/20',
            },
            {
              label: 'كويزات وامتحانات',
              value: stats.quizzes + stats.exams,
              sub: `${stats.quizzes} كويز · ${stats.exams} امتحان`,
              icon: ClipboardList,
              color: 'text-violet-400',
              borderHover: 'hover:border-violet-500/40',
              bgIcon: 'bg-violet-500/10 border-violet-500/20',
            },
            {
              label: 'واجبات وشروحات',
              value: stats.homeworks + stats.videos,
              sub: `${stats.homeworks} واجب · ${stats.videos} فيديو`,
              icon: PlayCircle,
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
                { id: 'ALL', label: 'الكل', count: stats.total },
                { id: 'OVERDUE', label: 'فات موعدها', count: stats.overdue, highlight: true },
                { id: 'QUIZ', label: 'كويزات', count: stats.quizzes },
                { id: 'HOMEWORK', label: 'واجبات', count: stats.homeworks },
                { id: 'VIDEO', label: 'شروحات', count: stats.videos },
                { id: 'EXAM', label: 'امتحانات', count: stats.exams },
              ].map((tab) => {
                const active = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id as FilterType)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                        : 'border border-surface-border bg-surface-card text-ink-muted hover:border-gold-500/30 hover:text-ink'
                    }`}
                  >
                    {tab.highlight && <Flame className="w-3 h-3 text-red-400" />}
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

            {/* Search Input & Collapse controls */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60 pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث في المتأخرات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-surface-card pr-9 pl-3 py-1.5 text-xs text-ink placeholder:text-ink-muted/50 focus:border-gold-500/40 focus:outline-none transition-colors"
                />
              </div>

              {courses.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const allCollapsed = Object.values(collapsedCourses).filter(Boolean).length === courses.length;
                    toggleAllCourses(!allCollapsed);
                  }}
                  className="rounded-xl border border-surface-border bg-surface-card px-2.5 py-1.5 text-xs font-bold text-ink-muted hover:text-gold-300 hover:border-gold-500/30 transition-all shrink-0 cursor-pointer"
                  title="طي أو فتح جميع الكورسات"
                >
                  {Object.values(collapsedCourses).filter(Boolean).length === courses.length
                    ? 'فتح الكل'
                    : 'طي الكل'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ COURSES & ITEMS LIST ═══════════════ */}
      {filteredCourses.length > 0 ? (
        <div className="space-y-5">
          {filteredCourses.map((course, idx) => {
            const isCollapsed = Boolean(collapsedCourses[course.courseId]);
            return (
              <CourseBacklogSection
                key={course.courseId}
                courseId={course.courseId}
                courseTitle={course.courseTitle}
                items={course.items}
                isOpen={!isCollapsed}
                onToggle={() => toggleCourse(course.courseId)}
                index={idx}
              />
            );
          })}
        </div>
      ) : hasItems ? (
        /* Filter returned zero items */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dashed border-surface-border bg-surface-card/60 p-12 text-center space-y-3"
        >
          <Filter className="w-10 h-10 text-gold-400/60 mx-auto" />
          <h3 className="text-base font-bold text-ink">لا توجد عناصر مطابقة لخيارات الفلترة</h3>
          <p className="text-xs text-ink-muted">جرّب تغيير نوع الفلتر أو مسح نص البحث.</p>
          <button
            type="button"
            onClick={() => {
              setFilterType('ALL');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-400 hover:text-gold-300 cursor-pointer pt-2"
          >
            إعادة ضبط الفلاتر
          </button>
        </motion.div>
      ) : null}

      {/* ═══════════════ CELEBRATORY EMPTY STATE (0 Backlog) ═══════════════ */}
      {!hasItems && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-dashed border-emerald-500/30 bg-surface-card/60 p-10 sm:p-14 text-center space-y-6 shadow-sm"
        >
          <div className="relative mx-auto w-56 sm:w-64">
            <EmptyStateIllustrationSvg className="w-full drop-shadow-md" />
            <Sparkles className="absolute -top-2 -right-2 h-7 w-7 text-gold-400 animate-pulse" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-black text-ink font-din">
              سجلك خالٍ تماماً من المتأخرات! 🎉
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed font-sst">
              أنت مواكب لجميع محاضراتك، واجباتك وكويزاتك أولاً بأول. هذا الانضباط هو سر الوصول لأعلى الدرجات والتفوق.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/my-courses"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold-500 to-amber-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-gold-500/20 hover:scale-105 active:scale-95 transition-transform"
            >
              <span>تصفح كورساتي المتاحة</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};
export default MyBacklogPage;
