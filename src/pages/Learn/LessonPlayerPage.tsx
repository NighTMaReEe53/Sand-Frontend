import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  FileText,
  AlertCircle,
  Loader2,
  ClipboardList,
  StickyNote,
  MessageCircleQuestion,
  FileQuestion,
  Clock,
  Lock,
  BookOpenCheck,
  LayoutGrid,
  ChevronDown,
  ListFilter,
} from 'lucide-react';
import { useCurriculumQuery } from '../../hooks/queries/useCurriculum';
import { useCourseExamsQuery } from '../../hooks/queries/useExams';
import { useCourseProgressQuery } from '../../hooks/queries/useProgress';
import { useUpdateLessonProgressMutation } from '../../hooks/mutations/useProgressMutations';
import { lessonsApi } from '../../api/lessons.api';
import { useAuthStore } from '../../store/authStore';
import { QuizPanel, QuizPanelTeacherPreview } from './QuizPanel';
import { HomeworkPanel, HomeworkPanelTeacherPreview } from './HomeworkPanel';
import { NotesPanel } from './NotesPanel';
import { QaPanel } from './QaPanel';
import { Lesson, Section, Material } from '../../types/course.types';
import { VideoPlayer, VideoPlayerHandle } from '../../components/video/VideoPlayer';
import { AccordionSection } from '../../components/ui/AccordionSection';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { CourseIntroVideoModal } from '../../components/courses/CourseIntroVideoModal';

// Checkpoints are saved every 30 seconds (and on pause/end), so the resume
// position stays accurate without turning playback into constant traffic.
const REPORT_INTERVAL_SECONDS = 30;

/** Sidebar status icon: ✓ completed · 🔒 locked · ▶ available */
const LessonStatusIcon: React.FC<{
  lp?: { isCompleted: boolean; status?: string };
}> = ({ lp }) => {
  if (lp?.isCompleted)
    return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (lp?.status === 'LOCKED')
    return <Lock className="w-4 h-4 text-amber-400/80 shrink-0" />;
  return <PlayCircle className="w-4 h-4 text-gold-400 shrink-0" />;
};

/** Sidebar lesson row — shared by sections & unassigned lessons */
const SidebarLessonRow: React.FC<{
  lesson: { id: string; title: string; durationSeconds: number };
  lp?: {
    isCompleted: boolean;
    status?: string;
    lockMessage?: string | null;
    watchedPercentage: number;
  };
  isActive: boolean;
  durationSeconds?: number;
  onSelect: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}> = ({ lesson, lp, isActive, durationSeconds, onSelect, buttonRef }) => (
  <button
    type="button"
    ref={buttonRef}
    onClick={onSelect}
    title={
      lp?.status === 'LOCKED' ? lp?.lockMessage ?? 'الدرس مقفل' : undefined
    }
    className={`group w-full flex items-center gap-3 px-4 py-2.5 text-right transition-all ${
      isActive
        ? 'bg-gold-500/10 border-r-2 border-gold-400'
        : 'border-r-2 border-transparent hover:bg-surface'
    }`}
  >
    <LessonStatusIcon lp={lp} />
    <span className="flex-1 min-w-0">
      <span
        className={`block text-xs truncate transition-colors ${
          isActive ? 'text-gold-300 font-bold' : 'text-ivory group-hover:text-ivory'
        }`}
      >
        {lesson.title}
      </span>
      {/* شريط تقدم المشاهدة للدروس قيد المشاهدة */}
      {lp && !lp.isCompleted && lp.status !== 'LOCKED' && lp.watchedPercentage > 0 && (
        <span className="mt-1 block h-[3px] w-full max-w-[120px] rounded-full bg-surface-border overflow-hidden">
          <span
            className="block h-full rounded-full bg-gradient-to-l from-gold-500 to-gold-300"
            style={{ width: `${Math.min(100, lp.watchedPercentage)}%` }}
          />
        </span>
      )}
      {lp?.status === 'LOCKED' && lp.lockMessage && (
        <span className="mt-0.5 block text-[9px] text-amber-400/80 truncate">
          {lp.lockMessage}
        </span>
      )}
    </span>
    <span className="text-[10px] text-ivory-muted shrink-0" title="مدة الدرس">
      {formatDuration(durationSeconds ?? lesson.durationSeconds)}
    </span>
  </button>
);

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/* ═══════════════ Creative sidebar toolkit ═══════════════ */

type SidebarFilter = 'all' | 'lessons' | 'quizzes' | 'exams' | 'homeworks' | 'files';

interface ProgressInfo {
  watchedPercentage: number;
  isCompleted: boolean;
  lastPositionSeconds: number;
  status?: string;
  quizCompleted?: boolean;
  homeworkCompleted?: boolean;
  lockReasonCode?: string | null;
  lockMessage?: string | null;
}

const SIDEBAR_FILTERS: { key: SidebarFilter; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'الكل', icon: LayoutGrid },
  { key: 'lessons', label: 'الدروس', icon: PlayCircle },
  { key: 'quizzes', label: 'الكويزات', icon: ClipboardList },
  { key: 'exams', label: 'الامتحانات', icon: FileQuestion },
  { key: 'homeworks', label: 'الواجبات', icon: BookOpenCheck },
  { key: 'files', label: 'الملفات', icon: FileText },
];

/** Animated circular course-progress ring */
const ProgressRing: React.FC<{ percent: number; size?: number; stroke?: number }> = ({
  percent,
  size = 56,
  stroke = 5,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-border"
        />
        <defs>
          <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d061" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="url(#ringGold)"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.25,1,0.5,1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-gold-300 tabular-nums">
        {clamped}%
      </span>
    </div>
  );
};

/** Nested child row under a lesson (quiz / homework / file) — tree connector style */
const SidebarChildRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  meta?: string;
  color: string;
  done?: boolean;
  active?: boolean;
  onClick: () => void;
}> = ({ icon, label, meta, color, done, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group w-full flex items-center gap-2 pr-3 pl-4 py-1.5 text-right transition-all ${
      active ? 'bg-gold-500/10' : 'hover:bg-surface'
    }`}
  >
    {/* tree connector */}
    <span className="w-4 h-4 border-r-2 border-b-2 border-surface-border rounded-bl-md -mr-px shrink-0 opacity-70" />
    <span className={`${color} shrink-0 relative`}>
      {icon}
      {done && (
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 absolute -top-1 -right-1 bg-bg rounded-full" />
      )}
    </span>
    <span
      className={`flex-1 min-w-0 text-[11px] truncate ${
        active ? 'text-gold-300 font-bold' : 'text-ivory-muted group-hover:text-ivory'
      }`}
    >
      {label}
    </span>
    {meta && <span className="text-[9px] text-ivory-muted/80 shrink-0">{meta}</span>}
  </button>
);

/** Collapsible lesson group header used by filtered views */
const LessonGroupHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="flex items-center gap-2 px-4 pt-3 pb-1">
    <PlayCircle className="w-3.5 h-3.5 text-gold-500/60 shrink-0" />
    <span className="text-[11px] font-bold text-gold-300/90 truncate">{title}</span>
    {subtitle && <span className="text-[9px] text-ivory-muted/70 shrink-0">{subtitle}</span>}
    <span className="flex-1 h-px bg-surface-border/60 mr-1" />
  </div>
);

/** Empty-state message inside the sidebar list */
const SidebarEmpty: React.FC<{ text: string }> = ({ text }) => (
  <p className="px-6 py-10 text-center text-[11px] text-ivory-muted">{text}</p>
);

/**
 * A lesson rendered as its own expandable «section» card:
 * numbered header → quiz / homework / files nested beneath it,
 * with a decorative gradient separator before each lesson.
 */
const LessonSectionCard: React.FC<{
  index: number;
  lesson: Lesson;
  lp?: ProgressInfo;
  isActive: boolean;
  expanded: boolean;
  liveDuration?: number;
  focusPanel: 'quiz' | 'homework' | 'exam' | null;
  onSelect: () => void;
  onToggle: () => void;
  onQuiz: () => void;
  onHomework: () => void;
  onFile: (materialId: string) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}> = ({
  index,
  lesson,
  lp,
  isActive,
  expanded,
  liveDuration,
  focusPanel,
  onSelect,
  onToggle,
  onQuiz,
  onHomework,
  onFile,
  buttonRef,
}) => {
  const quizzes = lesson.quizzes ?? [];
  const homeworks = lesson.homeworks ?? [];
  const materials = lesson.materials ?? [];
  const hasChildren =
    quizzes.length > 0 || homeworks.length > 0 || materials.length > 0;

  return (
    <div className="relative">
      {/* ── creative separator between lessons ── */}
      {index > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-surface-border to-transparent" />
          <span className="block h-1 w-1 rotate-45 bg-gold-500/50" />
          <span className="h-px w-10 bg-gradient-to-l from-transparent via-gold-500/40 to-transparent" />
        </div>
      )}

      {/* ── lesson section header ── */}
      <button
        type="button"
        ref={buttonRef}
        onClick={onSelect}
        title={lp?.status === 'LOCKED' ? lp?.lockMessage ?? 'الدرس مقفل' : undefined}
        className={`group w-full flex items-center gap-2.5 px-4 py-2.5 text-right transition-all ${
          isActive
            ? 'bg-gold-500/10 border-r-2 border-gold-400'
            : 'border-r-2 border-transparent hover:bg-surface'
        }`}
      >
        {/* lesson number chip */}
        <span
          className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-lg border text-[10px] font-black tabular-nums transition-colors ${
            isActive
              ? 'border-gold-400/60 bg-gold-500/20 text-gold-300'
              : lp?.isCompleted
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-surface-border bg-surface text-ivory-muted group-hover:text-ivory'
          }`}
        >
          {index + 1}
        </span>
        <LessonStatusIcon lp={lp} />
        <span className="flex-1 min-w-0">
          <span className="mb-0.5 block text-[9px] font-bold tracking-wide text-gold-400/70">
            الحصة {index + 1}
          </span>
          <span
            className={`block text-xs truncate transition-colors ${
              isActive ? 'text-gold-300 font-bold' : 'text-ivory group-hover:text-ivory'
            }`}
          >
            {lesson.title}
          </span>
          {/* شريط تقدم المشاهدة للدروس قيد المشاهدة */}
          {lp && !lp.isCompleted && lp.status !== 'LOCKED' && lp.watchedPercentage > 0 && (
            <span className="mt-1 block h-[3px] w-full max-w-[110px] rounded-full bg-surface-border overflow-hidden">
              <span
                className="block h-full rounded-full bg-gradient-to-l from-gold-500 to-gold-300"
                style={{ width: `${Math.min(100, lp.watchedPercentage)}%` }}
              />
            </span>
          )}
          {lp?.status === 'LOCKED' && lp.lockMessage && (
            <span className="mt-0.5 block text-[9px] text-amber-400/80 truncate">
              {lp.lockMessage}
            </span>
          )}
        </span>
        <span className="text-[10px] text-ivory-muted shrink-0 tabular-nums" title="مدة الدرس">
          {formatDuration(liveDuration ?? lesson.durationSeconds)}
        </span>
        {hasChildren && (
          <span
            role="button"
            tabIndex={-1}
            aria-label={expanded ? 'طي محتوى الدرس' : 'عرض محتوى الدرس'}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="shrink-0 rounded-md p-0.5 text-ivory-muted transition-colors hover:bg-white/5 hover:text-gold-300"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </span>
        )}
      </button>

      {/* ── nested children: quiz · homework · files ── */}
      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-1 space-y-0.5">
              {quizzes.map((q) => (
                <SidebarChildRow
                  key={q.id}
                  icon={<ClipboardList className="w-3 h-3" />}
                  label={q.title || 'كويز الدرس'}
                  meta={
                    [
                      q.questionCount ? `${q.questionCount} سؤال` : null,
                      q.timeLimitMinutes ? `${q.timeLimitMinutes} د` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ') || undefined
                  }
                  color="text-violet-300"
                  done={lp?.quizCompleted}
                  active={isActive && focusPanel === 'quiz'}
                  onClick={onQuiz}
                />
              ))}
              {homeworks.map((h) => (
                <SidebarChildRow
                  key={h.id}
                  icon={<BookOpenCheck className="w-3 h-3" />}
                  label={h.title || 'واجب الدرس'}
                  meta={h.questionCount ? `${h.questionCount} سؤال` : undefined}
                  color="text-rose-300"
                  done={lp?.homeworkCompleted}
                  active={isActive && focusPanel === 'homework'}
                  onClick={onHomework}
                />
              ))}
              {materials.map((m) => (
                <SidebarChildRow
                  key={m.id}
                  icon={<FileText className="w-3 h-3" />}
                  label={m.title}
                  color="text-teal-300"
                  onClick={() => onFile(m.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Flat lesson-only list used by the «الدروس» filter */
const FlatLessonList: React.FC<{
  lessons: Lesson[];
  progressByLesson: Map<string, ProgressInfo>;
  activeLessonId?: string;
  liveDurations: Record<string, number>;
  onSelect: (id: string) => void;
}> = ({ lessons, progressByLesson, activeLessonId, liveDurations, onSelect }) => {
  if (lessons.length === 0) return <SidebarEmpty text="لا توجد دروس منشورة بعد." />;
  return (
    <ul>
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <SidebarLessonRow
            lesson={lesson}
            lp={progressByLesson.get(lesson.id)}
            isActive={activeLessonId === lesson.id}
            durationSeconds={liveDurations[lesson.id]}
            onSelect={() => onSelect(lesson.id)}
          />
        </li>
      ))}
    </ul>
  );
};

export const LessonPlayerPage: React.FC = () => {
const { courseId } = useParams<{ courseId: string }>();
const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((state) => state.user?.role);

  const curriculumQuery = useCurriculumQuery(courseId ?? '');
  const progressQuery = useCourseProgressQuery(courseId ?? '');
  const { mutate: reportProgress } = useUpdateLessonProgressMutation(courseId ?? '');
  // Course-level exams — shown under the lesson quiz and in the sidebar
  const { data: courseExams = [], isLoading: isLoadingExams } = useCourseExamsQuery(
    courseId ?? '',
    Boolean(courseId) && Boolean(role)
  );

  const isStudent = role === 'STUDENT';

  const sections: Section[] = useMemo(
    () => curriculumQuery.data?.sections ?? [],
    [curriculumQuery.data]
  );

  const allLessons: Lesson[] = useMemo(
    () => sections.flatMap((s) => s.lessons ?? []),
    [sections]
  );

  // Selected lesson: ?lesson= param, otherwise resume target, otherwise first lesson
  const activeLessonId = searchParams.get('lesson') ?? progressQuery.data?.resume?.lessonId;
  const activeLesson = useMemo(
    () => allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0] ?? null,
    [allLessons, activeLessonId]
  );

  const playerHandleRef = useRef<VideoPlayerHandle | null>(null);
  const [introOpen, setIntroOpen] = useState(false);
  const activeSidebarBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastReportedAtRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastDurationRef = useRef(0);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [lockedLesson, setLockedLesson] = useState(false);
  const [loadingStream, setLoadingStream] = useState(false);
  // Real duration reported by the active player engine once metadata loads —
  // preferred over the manually-entered stored duration.
  const [liveDurationSeconds, setLiveDurationSeconds] = useState(0);
  // Live measured durations per lesson id — keeps the sidebar timers accurate
  // for any lesson watched during this session
  const [liveDurations, setLiveDurations] = useState<Record<string, number>>({});

  const progressByLesson = useMemo(() => {
    const map = new Map<string, ProgressInfo>();
    (progressQuery.data?.lessons ?? []).forEach((lp) => {
      map.set(lp.lessonId, {
        watchedPercentage: lp.watchedPercentage,
        isCompleted: lp.isCompleted,
        lastPositionSeconds: lp.lastPositionSeconds,
        status: lp.status,
        quizCompleted: lp.quizCompleted,
        homeworkCompleted: lp.homeworkCompleted,
        lockReasonCode: lp.lockReasonCode,
        lockMessage: lp.lockMessage,
      });
    });
    return map;
  }, [progressQuery.data]);

  // Per-section completion rollup (from the backend) — reserved for future use
  void (progressQuery.data?.sections ?? []);

  /* ── Creative sidebar: filters + focus panel wiring ── */
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>('all');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  // Which lesson panel to auto-open when a quiz/homework/exam child row is clicked
  const [focusPanel, setFocusPanel] = useState<'quiz' | 'homework' | 'exam' | null>(null);
  // Which lesson sections are expanded in the sidebar (active one auto-expands)
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const scrollToSection = useCallback((sectionId: string) => {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }, []);

  const selectLessonWithPanel = useCallback(
    (lessonId: string, panel: 'quiz' | 'homework' | 'exam') => {
      setFocusPanel(panel);
      setSidebarOpenMobile(false);
      if (activeLesson?.id !== lessonId) {
        setSearchParams({ lesson: lessonId });
      }
      const targetId =
        panel === 'quiz'
          ? 'lesson-quiz-section'
          : panel === 'homework'
          ? 'lesson-homework-section'
          : 'course-exams-section';
      scrollToSection(targetId);
    },
    [activeLesson?.id, setSearchParams, scrollToSection]
  );

  useEffect(() => {
    if (focusPanel) {
      const targetId =
        focusPanel === 'quiz'
          ? 'lesson-quiz-section'
          : focusPanel === 'homework'
          ? 'lesson-homework-section'
          : 'course-exams-section';
      scrollToSection(targetId);
    }
  }, [focusPanel, activeLesson?.id, scrollToSection]);

  const downloadMaterial = useCallback(async (materialId: string) => {
    try {
      const dl = await lessonsApi.getMaterialDownloadUrl(materialId);
      window.open(dl.downloadUrl, '_blank');
    } catch {
      /* download link expired or unauthorized */
    }
  }, []);

  // Sidebar counts per filter
  const filterCounts = useMemo(() => {
    const quizzes = allLessons.reduce((n, l) => n + (l.quizzes?.length ?? 0), 0);
    const homeworks = allLessons.reduce((n, l) => n + (l.homeworks?.length ?? 0), 0);
    const files =
      allLessons.reduce((n, l) => n + (l.materials?.length ?? 0), 0) +
      sections.reduce((n, s) => n + (s.materials?.length ?? 0), 0);
    return {
      lessons: allLessons.length,
      quizzes,
      homeworks,
      exams: courseExams.length,
      files,
    } as Partial<Record<SidebarFilter, number>>;
  }, [allLessons, sections, courseExams]);

  // Grouped views for the filtered lists
  const lessonsQuizzes = useMemo(
    () =>
      allLessons.flatMap((lesson) =>
        (lesson.quizzes ?? []).map((quiz) => ({ lesson, quiz }))
      ),
    [allLessons]
  );

  const lessonsHomeworks = useMemo(
    () =>
      allLessons.flatMap((lesson) =>
        (lesson.homeworks ?? []).map((homework) => ({ lesson, homework }))
      ),
    [allLessons]
  );

  const allFileGroups = useMemo(() => {
    const groups: { key: string; title: string; files: Material[] }[] = [];
    sections.forEach((s) => {
      if (s.materials?.length) {
        groups.push({ key: `sec-${s.id}`, title: `${s.title} — ملفات الفصل`, files: s.materials });
      }
    });
    allLessons.forEach((l) => {
      if (l.materials?.length) {
        groups.push({ key: `les-${l.id}`, title: l.title, files: l.materials });
      }
    });
    return groups;
  }, [sections, allLessons]);

  // Load signed stream URL whenever the active lesson changes
  useEffect(() => {
    if (!activeLesson) return;
    let cancelled = false;
    setStreamUrl(null);
    setStreamError(null);
    setLockedLesson(false);
    setLoadingStream(true);
    setLiveDurationSeconds(0);
    lessonsApi
      .getStreamUrl(activeLesson.id)
      .then((url) => {
        if (cancelled) return;
        if (url) {
          setStreamUrl(url);
        } else {
          setStreamError('تعذر الحصول على رابط الفيديو.');
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        const code = err?.response?.data?.code;
        if (code === 'LESSON_LOCKED') {
          setStreamError(
            err?.response?.data?.message ||
              'هذا الدرس مقفل — أكمل مشاهدة الدرس السابق واجتاز كويزه أولاً.'
          );
          setLockedLesson(true);
        } else {
          setStreamError('ليس لديك صلاحية لمشاهدة هذا الدرس.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStream(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeLesson?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Report watch progress to the backend (backend is the source of truth).
  // Works for BOTH engines — the unified VideoPlayer reports time updates
  // whether the source is an uploaded file or a YouTube video.
  const reportWatchProgress = useCallback(
    (positionSeconds: number, durationSeconds: number, force = false) => {
      if (
        !activeLesson ||
        !isStudent ||
        !durationSeconds ||
        !Number.isFinite(durationSeconds)
      ) {
        return;
      }
      const now = Date.now();
      if (!force && now - lastReportedAtRef.current < REPORT_INTERVAL_SECONDS * 1000) return;
      lastReportedAtRef.current = now;

      const watchedPercentage = Math.min(
        100,
        Math.round((positionSeconds / durationSeconds) * 100)
      );

      reportProgress({
        lessonId: activeLesson.id,
        data: {
          watchedPercentage,
          positionSeconds: Math.floor(positionSeconds),
          durationSeconds: Math.floor(durationSeconds),
        },
      });
    },
    [activeLesson, isStudent, reportProgress]
  );

  // Resume position from the server-saved progress — passed to the player as
  // its start time (applied once per source load, for either engine).
  const resumeSeconds = useMemo(() => {
    if (!activeLesson) return 0;
    const lp = progressByLesson.get(activeLesson.id);
    if (lp?.isCompleted) return 0;
    const saved =
      lp?.lastPositionSeconds ??
      (progressQuery.data?.resume?.lessonId === activeLesson.id
        ? progressQuery.data.resume.positionSeconds
        : 0);
    return saved > 5 ? saved : 0;
  }, [activeLesson, progressByLesson, progressQuery.data]);

  const handleTimeUpdate = useCallback(
    (t: number, d: number) => {
      lastTimeRef.current = t;
      lastDurationRef.current = d;
      if (d && Number.isFinite(d) && Math.floor(d) !== liveDurationSeconds) {
        const secs = Math.floor(d);
        setLiveDurationSeconds(secs);
        if (activeLesson) {
          setLiveDurations((prev) =>
            prev[activeLesson.id] === secs ? prev : { ...prev, [activeLesson.id]: secs }
          );
        }
      }
      reportWatchProgress(t, d, false);
    },
    [reportWatchProgress, liveDurationSeconds, activeLesson]
  );

  const handlePaused = useCallback(() => {
    reportWatchProgress(lastTimeRef.current, lastDurationRef.current, true);
  }, [reportWatchProgress]);

  const handleEnded = useCallback(() => {
    lastTimeRef.current = lastDurationRef.current; // mark as fully watched
    reportWatchProgress(lastDurationRef.current, lastDurationRef.current, true);
    // Auto-advance to the next lesson after a short pause — only if it is
    // unlocked (sequential rule); locked lessons show their reason instead
    if (activeLesson) {
      const idx = allLessons.findIndex((l) => l.id === activeLesson.id);
      const next = allLessons[idx + 1];
      const nextLocked =
        next && progressByLesson.get(next.id)?.status === 'LOCKED';
      if (next && !nextLocked) {
        setTimeout(() => setSearchParams({ lesson: next.id }), 1500);
      }
    }
  }, [activeLesson, allLessons, progressByLesson, reportWatchProgress, setSearchParams]);

  const selectLesson = (lessonId: string) => {
    setFocusPanel(null);
    setSidebarOpenMobile(false);
    setExpandedLessons((prev) => new Set(prev).add(lessonId));
    setSearchParams({ lesson: lessonId });
  };

  // Expand / collapse a lesson section without navigating
  const toggleLessonExpanded = useCallback((lessonId: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  }, []);

  // Always auto-expand the lesson being watched — adjust state during render
  // (React-recommended pattern, avoids an extra effect/render cycle)
  const [lastAutoExpandedId, setLastAutoExpandedId] = useState<string | null>(null);
  if (activeLesson?.id && lastAutoExpandedId !== activeLesson.id) {
    setLastAutoExpandedId(activeLesson.id);
    setExpandedLessons((prev) =>
      prev.has(activeLesson.id) ? prev : new Set(prev).add(activeLesson.id)
    );
  }

  // Keep the sidebar scrolled to the active lesson when it changes
  useEffect(() => {
    activeSidebarBtnRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeLesson?.id]);

  // Save progress when the student navigates away or closes the tab
  useEffect(() => {
    const flushProgress = () => {
      if (activeLesson && isStudent && lastDurationRef.current > 0) {
        reportWatchProgress(lastTimeRef.current, lastDurationRef.current, true);
      }
    };
    window.addEventListener('beforeunload', flushProgress);
    return () => {
      window.removeEventListener('beforeunload', flushProgress);
      flushProgress();
    };
  }, [activeLesson, isStudent, reportWatchProgress]);

  if (curriculumQuery.isLoading) {
    return (
      <div className="w-full px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (curriculumQuery.isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h1 className="text-xl font-bold font-amiri text-gold-300">تعذر تحميل المحتوى</h1>
        <p className="text-sm text-ivory-muted">
          قد لا تكون مشتركاً في هذا الكورس أو أن الكورس غير موجود.
        </p>
        <Link to="/my-courses" className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm">
          <ArrowRight className="w-4 h-4" />
          العودة إلى كورساتي
        </Link>
      </div>
    );
  }

  const totalLessons = curriculumQuery.data?.totalLessons ?? 0;
  const completedLessons = progressQuery.data?.completedLessons ?? 0;
  const coursePercent = progressQuery.data?.courseProgressPercentage ?? 0;

  /** Shared renderer: each lesson as its own expandable «section» card */
  const renderLessonSections = (lessons: Lesson[]) =>
    lessons.map((lesson, index) => (
      <LessonSectionCard
        key={lesson.id}
        index={index}
        lesson={lesson}
        lp={progressByLesson.get(lesson.id)}
        isActive={activeLesson?.id === lesson.id}
        expanded={expandedLessons.has(lesson.id)}
        liveDuration={liveDurations[lesson.id]}
        focusPanel={focusPanel}
        onSelect={() => selectLesson(lesson.id)}
        onToggle={() => toggleLessonExpanded(lesson.id)}
        onQuiz={() => selectLessonWithPanel(lesson.id, 'quiz')}
        onHomework={() => selectLessonWithPanel(lesson.id, 'homework')}
        onFile={(id) => void downloadMaterial(id)}
        buttonRef={(el) => {
          if (activeLesson?.id === lesson.id) activeSidebarBtnRef.current = el;
        }}
      />
    ));

  return (
    <div className="w-full px-3 sm:px-5 lg:px-6 py-4 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0 space-y-0.5">
          <Badge variant="gold">{progressQuery.data?.courseTitle ?? 'الكورس'}</Badge>
          <h1 className="text-lg sm:text-xl font-bold font-amiri text-gold-300 truncate">
            {activeLesson?.title ?? 'لا توجد دروس بعد'}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpenMobile((v) => !v)}
            className="lg:hidden flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-3 py-1.5 text-[11px] font-bold text-gold-300 transition-colors hover:border-gold-500/40"
          >
            <ListFilter className="w-3.5 h-3.5" />
            المحتوى
          </button>
          <div className="flex items-center gap-2.5 rounded-2xl border border-surface-border bg-surface-card px-3 py-2">
            <ProgressRing percent={coursePercent} size={44} stroke={4} />
            <div className="text-right leading-tight">
              <p className="text-[10px] text-ivory-muted">إنجاز الكورس</p>
              <p className="text-[11px] font-bold text-ivory tabular-nums">
                {completedLessons}/{totalLessons} درس
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIntroOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-gold-500/40 bg-gold-500/10 px-3 py-2.5 text-[11px] font-bold text-gold-300 transition-colors hover:border-gold-500/60 hover:bg-gold-500/15"
          >
            <PlayCircle className="h-4 w-4" />
            الفيديو التعريفي
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-4 items-start">
        {/* Player */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-surface-border aspect-video w-full">
            {loadingStream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ivory-muted">
                <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
                <span className="text-xs">جاري تحضير الفيديو...</span>
              </div>
            ) : streamError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                {lockedLesson ? (
                  <>
                    <Lock className="w-10 h-10 text-amber-400" />
                    <p className="text-sm font-bold text-gold-300">الدرس مقفل</p>
                  </>
                ) : (
                  <AlertCircle className="w-10 h-10 text-red-400" />
                )}
                <p className="text-sm text-ivory-muted">{streamError}</p>
                {lockedLesson &&
                  activeLesson &&
                  (!progressByLesson.get(activeLesson.id)?.quizCompleted ||
                    progressByLesson.get(activeLesson.id)?.lockReasonCode ===
                      'PREVIOUS_HOMEWORK_NOT_COMPLETED') && (
                    <p className="text-xs text-gold-400">
                      أكمل متطلبات الدرس السابق (المشاهدة + الكويز + الواجب) لفتح هذا الدرس.
                    </p>
                  )}
              </div>
            ) : streamUrl ? (
              <VideoPlayer
                key={activeLesson?.id}
                sources={[{ url: streamUrl }]}
                title={activeLesson?.title}
                startTime={resumeSeconds}
                playerRef={playerHandleRef}
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePaused}
                onEnded={handleEnded}
                onError={() =>
                  setStreamError('تعذر تحميل الفيديو، حاول مرة أخرى.')
                }
                className="absolute inset-0 w-full h-full"
              />
            ) : null}
          </div>

          {/* Lesson meta */}
          {activeLesson && (
            <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="neutral">
                    مدة الدرس: {formatDuration(liveDurationSeconds || activeLesson.durationSeconds)}
                  </Badge>
                {progressByLesson.get(activeLesson.id)?.isCompleted ? (
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3 ml-1" />
                    مكتمل
                  </Badge>
                ) : (
                  progressByLesson.get(activeLesson.id) && (
                    <Badge variant="warning">
                      مشاهدة {progressByLesson.get(activeLesson.id)!.watchedPercentage}%
                    </Badge>
                  )
                )}
              </div>
              {activeLesson.description && (
                <p className="text-sm text-ivory-muted leading-relaxed whitespace-pre-line">
                  {activeLesson.description}
                </p>
              )}
            </div>
          )}

          {/* These panels are mounted only when the lesson actually has one and
              the student opens it, so switching lessons stays lightweight. */}
          {(activeLesson?.quizzes?.length ?? 0) > 0 && activeLesson && (
            <AccordionSection
              id="lesson-quiz-section"
              key={`quiz-${activeLesson.id}-${focusPanel === 'quiz' ? 'open' : 'shut'}`}
              icon={<ClipboardList className="w-4 h-4" />}
              title="كويز الدرس"
              defaultOpen={focusPanel === 'quiz'}
            >
              {isStudent ? (
                <QuizPanel
                  lessonId={activeLesson.id}
                  onSolve={() =>
                    navigate(`/courses/${courseId}/learn/quiz/${activeLesson.id}`)
                  }
                />
              ) : (
                <QuizPanelTeacherPreview lessonId={activeLesson.id} />
              )}
            </AccordionSection>
          )}

          {/* Homework (واجب الدرس) — مثل الكويز مع ورقة PDF */}
          {(activeLesson?.homeworks?.length ?? 0) > 0 && activeLesson && (
            <AccordionSection
              id="lesson-homework-section"
              key={`hw-${activeLesson.id}-${focusPanel === 'homework' ? 'open' : 'shut'}`}
              icon={<BookOpenCheck className="w-4 h-4" />}
              title="واجب الدرس"
              defaultOpen={focusPanel === 'homework'}
            >
              {isStudent ? (
                <HomeworkPanel
                  lessonId={activeLesson.id}
                  courseId={courseId}
                  onSolve={() =>
                    navigate(`/courses/${courseId}/learn/homework/${activeLesson.id}`)
                  }
                />
              ) : (
                <HomeworkPanelTeacherPreview lessonId={activeLesson.id} />
              )}
            </AccordionSection>
          )}

          {/* Course-level exams */}
          {role && (
            <AccordionSection
              id="course-exams-section"
              key={`exams-${focusPanel === 'exam' ? 'open' : 'shut'}`}
              icon={<FileQuestion className="w-4 h-4" />}
              title="امتحانات الكورس"
              count={courseExams.length > 0 ? courseExams.length : null}
              defaultOpen={focusPanel === 'exam' || courseExams.length > 0}
            >
              {isLoadingExams ? (
                <div className="flex items-center justify-center gap-2 p-5 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                  جاري تحميل الامتحانات...
                </div>
              ) : courseExams.length === 0 ? (
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
                  <FileQuestion className="w-4 h-4 text-gold-400/50" />
                  لا توجد امتحانات منشورة لهذا الكورس بعد.
                </div>
              ) : (
                <div className="space-y-2">
                  {courseExams.map((exam: any) => (
                    <Link
                      key={exam.id}
                      to={`/courses/${courseId}/exams`}
                      className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <FileQuestion className="w-4 h-4 text-gold-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ivory truncate">{exam.title}</p>
                          <p className="text-[10px] text-ivory-muted mt-0.5 flex items-center gap-1">
                            {(exam._count?.questions ?? exam.questionCount ?? 0) > 0 && (
                              <>
                                {exam._count?.questions ?? exam.questionCount} أسئلة •
                              </>
                            )}
                            <Clock className="w-3 h-3" />
                            {exam.durationMinutes} دقيقة
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gold-400 shrink-0">فتح</span>
                    </Link>
                  ))}
                </div>
              )}
            </AccordionSection>
          )}

          {/* Notes & Bookmarks */}
          {activeLesson && isStudent && (
            <AccordionSection
              icon={<StickyNote className="w-4 h-4" />}
              title="ملاحظاتي والعلامات المرجعية"
              defaultOpen={false}
            >
              <NotesPanel
                key={activeLesson.id}
                lessonId={activeLesson.id}
                getCurrentTimestamp={() => playerHandleRef.current?.getCurrentTime() ?? null}
                seekTo={(seconds) => {
                  if (!Number.isFinite(seconds)) return;
                  playerHandleRef.current?.seekTo(seconds);
                  playerHandleRef.current?.play();
                }}
              />
            </AccordionSection>
          )}

          {/* Lesson Q&A */}
          {activeLesson && (
            <AccordionSection
              icon={<MessageCircleQuestion className="w-4 h-4" />}
              title="أسئلة وأجوبة الدرس"
            >
              <QaPanel lessonId={activeLesson.id} courseId={courseId} />
            </AccordionSection>
          )}

          {/* Materials */}
          {(activeLesson?.materials?.length ?? 0) > 0 && (
            <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3">
              <h3 className="text-sm font-bold text-ivory flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold-400" />
                ملخصات ومرفقات الدرس
              </h3>
              <ul className="space-y-2">
                {activeLesson!.materials!.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => void downloadMaterial(m.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-surface hover:border-gold-500/40 border border-surface-border transition-colors text-sm"
                    >
                      <span className="text-ivory">{m.title}</span>
                      <span className="text-xs text-gold-400">تحميل</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Creative Sidebar: filters + tree grouping ── */}
        <aside
          className={`${
            sidebarOpenMobile ? 'fixed inset-x-4 top-20 bottom-4 z-50 flex' : 'hidden'
          } lg:static lg:flex flex-col rounded-2xl bg-surface-card border border-surface-border shadow-2xl lg:shadow-none lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-hidden`}
        >
          {/* Header + filter pills */}
          <div className="p-4 pb-3 border-b border-surface-border shrink-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-ivory">محتوى الكورس</h2>
              <span className="text-[11px] text-ivory-muted tabular-nums">
                {completedLessons}/{totalLessons} درس
              </span>
            </div>

            {/* Filter pills */}
            <div className="mt-3 flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
              {SIDEBAR_FILTERS.map(({ key, label, icon: Icon }) => {
                const active = sidebarFilter === key;
                const count = filterCounts[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSidebarFilter(key)}
                    className={`relative flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold transition-colors duration-200 ${
                      active ? 'text-gold-300' : 'text-ivory-muted hover:text-ivory'
                    }`}
                    title={label}
                  >
                    {active && (
                      <motion.span
                        layoutId="sb-filter-pill"
                        transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                        className="absolute inset-0 rounded-full border border-gold-500/40 bg-gold-500/10"
                      />
                    )}
                    <Icon className="relative z-10 w-3 h-3" />
                    <span className="relative z-10">{label}</span>
                    {count !== undefined && count > 0 && (
                      <span
                        className={`relative z-10 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full text-[9px] tabular-nums ${
                          active
                            ? 'bg-gold-400/90 text-bg font-black'
                            : 'bg-surface-border/60 text-ivory-muted'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
              {/* close button on mobile */}
              <button
                type="button"
                onClick={() => setSidebarOpenMobile(false)}
                className="lg:hidden shrink-0 mr-auto rounded-full border border-surface-border p-1.5 text-ivory-muted hover:text-ivory"
                aria-label="إغلاق القائمة"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar py-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={sidebarFilter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {/* ══ الكل — كل درس كقسم مستقل مع أبنائه ══ */}
                {sidebarFilter === 'all' &&
                  (allLessons.length === 0 && courseExams.length === 0 ? (
                    <SidebarEmpty text="لا يوجد محتوى منشور بعد." />
                  ) : (
                    <div>
                      {allLessons.length > 0 && renderLessonSections(allLessons)}

                      {/* Exams have their own final sidebar section instead of
                          being mixed into the lesson-by-lesson learning path. */}
                      {courseExams.length > 0 && (
                        <section className="mt-2 border-t border-surface-border pt-2">
                          <div className="flex items-center gap-2 px-4 py-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-300">
                              <FileQuestion className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-black text-ivory">امتحانات الكورس</span>
                            <span className="mr-auto flex min-w-5 h-5 items-center justify-center rounded-full bg-sky-400/10 px-1.5 text-[9px] font-black text-sky-300">
                              {courseExams.length}
                            </span>
                          </div>
                          <div className="space-y-1 px-2 pb-1">
                            {courseExams.map((exam: any) => (
                              <button
                                key={exam.id}
                                type="button"
                                onClick={() => {
                                  setFocusPanel('exam');
                                  setSidebarOpenMobile(false);
                                  scrollToSection('course-exams-section');
                                }}
                                className="group flex w-full items-center justify-between gap-2 rounded-xl border border-sky-400/15 bg-sky-400/[0.03] p-3 text-right transition-all hover:border-gold-500/40 hover:bg-gold-500/[0.04]"
                              >
                                <div className="min-w-0 flex items-center gap-2">
                                  <FileQuestion className="w-4 h-4 shrink-0 text-sky-300" />
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] font-bold text-ivory">{exam.title}</p>
                                    <p className="mt-0.5 flex items-center gap-1 text-[9px] text-ivory-muted">
                                      <Clock className="w-2.5 h-2.5" />
                                      {exam.durationMinutes} دقيقة
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 text-[9px] font-bold text-gold-400 opacity-0 transition-opacity group-hover:opacity-100">
                                  عرض الامتحان
                                </span>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  ))}

                {/* ══ الدروس فقط ══ */}
                {sidebarFilter === 'lessons' && (
                  <FlatLessonList
                    lessons={allLessons}
                    progressByLesson={progressByLesson}
                    activeLessonId={activeLesson?.id}
                    liveDurations={liveDurations}
                    onSelect={selectLesson}
                  />
                )}

                {/* ══ الكويزات — مجموعة تحت كل درس ══ */}
                {sidebarFilter === 'quizzes' &&
                  (lessonsQuizzes.length === 0 ? (
                    <SidebarEmpty text="لا توجد كويزات منشورة بعد." />
                  ) : (
                    lessonsQuizzes.map(({ lesson, quiz }) => (
                      <div key={`${lesson.id}-${quiz.id}`}>
                        <LessonGroupHeader title={lesson.title} subtitle={formatDuration(lesson.durationSeconds)} />
                        <SidebarChildRow
                          icon={<ClipboardList className="w-3.5 h-3.5" />}
                          label={quiz.title || `كويز ${lesson.title}`}
                          meta={
                            [
                              quiz.questionCount ? `${quiz.questionCount} سؤال` : null,
                              quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} د` : null,
                            ]
                              .filter(Boolean)
                              .join(' • ') || undefined
                          }
                          color="text-violet-300"
                          done={
                            progressByLesson.get(lesson.id)?.quizCompleted ||
                            lesson.isCompleted === true
                          }
                          active={activeLesson?.id === lesson.id && focusPanel === 'quiz'}
                          onClick={() => selectLessonWithPanel(lesson.id, 'quiz')}
                        />
                      </div>
                    ))
                  ))}

                {/* ══ الواجبات — مجموعة تحت كل درس ══ */}
                {sidebarFilter === 'homeworks' &&
                  (lessonsHomeworks.length === 0 ? (
                    <SidebarEmpty text="لا توجد واجبات منشورة بعد." />
                  ) : (
                    lessonsHomeworks.map(({ lesson, homework }) => (
                      <div key={`${lesson.id}-${homework.id}`}>
                        <LessonGroupHeader title={lesson.title} subtitle={formatDuration(lesson.durationSeconds)} />
                        <SidebarChildRow
                          icon={<BookOpenCheck className="w-3.5 h-3.5" />}
                          label={homework.title || `واجب ${lesson.title}`}
                          meta={homework.questionCount ? `${homework.questionCount} سؤال` : undefined}
                          color="text-rose-300"
                          active={activeLesson?.id === lesson.id && focusPanel === 'homework'}
                          onClick={() => selectLessonWithPanel(lesson.id, 'homework')}
                        />
                      </div>
                    ))
                  ))}

                {/* ══ الامتحانات ══ */}
                {sidebarFilter === 'exams' &&
                  (courseExams.length === 0 ? (
                    <SidebarEmpty text="لا توجد امتحانات منشورة بعد." />
                  ) : (
                    courseExams.map((exam: any) => (
                      <button
                        key={exam.id}
                        type="button"
                        onClick={() => {
                          setFocusPanel('exam');
                          setSidebarOpenMobile(false);
                          scrollToSection('course-exams-section');
                        }}
                        className="group mx-2 mt-1 first:mt-0 flex w-[calc(100%-16px)] items-center justify-between gap-2 p-3 rounded-xl border border-surface-border text-right hover:border-gold-500/40 transition-all hover:-translate-y-px"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <FileQuestion className="w-4 h-4 text-sky-300 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ivory truncate">{exam.title}</p>
                            <p className="text-[9px] text-ivory-muted mt-0.5 flex items-center gap-1">
                              {(exam._count?.questions ?? exam.questionCount ?? 0) > 0 && (
                                <>{exam._count?.questions ?? exam.questionCount} أسئلة •</>
                              )}
                              <Clock className="w-2.5 h-2.5" />
                              {exam.durationMinutes} دقيقة
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-gold-400 shrink-0">
                          عرض الامتحان
                        </span>
                      </button>
                    ))
                  ))}

                {/* ══ الملفات — مرفقات كل درس + مرفقات الفصول ══ */}
                {sidebarFilter === 'files' &&
                  (allFileGroups.length === 0 ? (
                    <SidebarEmpty text="لا توجد ملفات أو ملخصات بعد." />
                  ) : (
                    allFileGroups.map((group) => (
                      <div key={group.key}>
                        <LessonGroupHeader title={group.title} />
                        {group.files.map((m) => (
                          <SidebarChildRow
                            key={m.id}
                            icon={<FileText className="w-3.5 h-3.5" />}
                            label={m.title}
                            color="text-teal-300"
                            onClick={() => void downloadMaterial(m.id)}
                          />
                        ))}
                      </div>
                    ))
                  ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </aside>
      </div>

      {/* Course intro video — free preview for everyone */}
      <CourseIntroVideoModal
        courseId={courseId}
        isOpen={introOpen}
        onClose={() => setIntroOpen(false)}
      />
    </div>
  );
};
