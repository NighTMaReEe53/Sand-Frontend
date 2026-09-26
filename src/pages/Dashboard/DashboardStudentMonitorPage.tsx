import React, { useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  GraduationCap,
  Layers,
  MonitorPlay,
  Search as SearchIcon,
  SearchX,
  TrendingUp,
  UserX,
  Users,
  XCircle,
} from 'lucide-react';
import { teacherStudentsApi } from '../../api/phase2-teacher.api';
import { studentsApi, StudentSearchResult } from '../../api/students.api';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { examsApi } from '../../api/exams.api';
import { quizzesApi } from '../../api/quizzes.api';
import { homeworkApi } from '../../api/homework.api';
import { formatGradeLevel } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AnswerSheetReview } from '../../components/dashboard/AnswerSheetReview';
import { AttemptSheetModal, SheetTarget } from '../../components/dashboard/AttemptSheetModal';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { toast } from 'sonner';

/* ─── helpers ────────────────────────────────────────────────── */
const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(iso);
  }
};

const ScorePill: React.FC<{ percentage: number | null; isPassed?: boolean | null }> = ({
  percentage,
  isPassed,
}) => {
  if (percentage == null)
    return <span className="text-[11px] text-ivory-muted">—</span>;
  const tone =
    (isPassed ?? percentage >= 50)
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-red-500/10 text-red-400 border-red-500/30';
  return (
    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border tabular-nums ${tone}`}>
      {percentage}%
    </span>
  );
};

const CompletionBar: React.FC<{ value: number }> = ({ value }) => (  <div className="flex items-center gap-2 min-w-[120px]">
    <div className="h-1.5 flex-1 rounded-full bg-bg-subtle overflow-hidden">
      <div
        className={`h-full rounded-full ${
          value >= 80
            ? 'bg-gradient-to-l from-emerald-400 to-emerald-600'
            : value >= 30
            ? 'bg-gradient-to-l from-gold-400 to-gold-600'
            : 'bg-gradient-to-l from-red-400 to-red-600'
        }`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
    <span className="text-[11px] font-bold text-ivory-muted tabular-nums w-9">{value}%</span>
  </div>
);

type MonitorTab = 'courses' | 'search';

type SortOption = 'all' | 'most_active' | 'least_active' | 'not_started' | 'completion_desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'all', label: 'بدون ترتيب' },
  { value: 'most_active', label: 'الأكثر تفاعلاً' },
  { value: 'least_active', label: 'الأقل تفاعلاً' },
  { value: 'not_started', label: 'لم يبدؤوا بعد' },
  { value: 'completion_desc', label: 'الأعلى إنجازاً' },
];

/* ══════════════════════════════════════════════════════════════ */
/*  Course monitor section                                        */
/* ══════════════════════════════════════════════════════════════ */
const CourseMonitorSection: React.FC = () => {
  const { data: coursesData, isLoading: isLoadingCourses } = useCoursesQuery({ limit: 50, mine: true });
  const courses = useMemo(() => {
    const d = coursesData as any;
    return Array.isArray(d?.data) ? d.data : Array.isArray(d?.courses) ? d.courses : Array.isArray(d) ? d : [];
  }, [coursesData]);

  const [courseId, setCourseId] = useState('');
  const [sort, setSort] = useState<SortOption>('completion_desc');
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId && courses.length > 0) setCourseId(courses[0].id);
  }, [courses, courseId]);

  const apiSort = sort === 'all' ? undefined : sort;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['monitor-course-students', courseId, apiSort ?? 'all'],
    queryFn: () => teacherStudentsApi.getCourseStudents(courseId, apiSort as any),
    enabled: !!courseId,
  });

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['monitor-student-detail', courseId, detailStudentId],
    queryFn: () => teacherStudentsApi.getStudentDetail(courseId!, detailStudentId!),
    enabled: !!courseId && !!detailStudentId,
  });

  if (isLoadingCourses) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-10 rounded-2xl border border-dashed border-surface-border bg-surface-card/60 text-center space-y-3">
        <BookOpen className="w-10 h-10 mx-auto text-ivory-muted" />
        <p className="text-sm text-ivory-muted">لا توجد كورسات مخصصة لك بعد.</p>
      </div>
    );
  }

  const unwatchedLessons = detail
    ? detail.lessons.filter((l) => !l.isCompleted && l.watchedPercentage < 90)
    : [];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-ivory mb-1.5">اختر الكورس</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-surface border border-surface-border text-ivory rounded-xl px-3 py-2.5 text-xs outline-none focus:border-gold-400 cursor-pointer"
          >
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-56">
          <label className="block text-xs font-medium text-ivory mb-1.5">الترتيب</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="w-full bg-surface border border-surface-border text-ivory rounded-xl px-3 py-2.5 text-xs outline-none focus:border-gold-400 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> تعذر تحميل بيانات الطلاب لهذا الكورس.
        </div>
      )}

      {/* Stats */}
      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 border border-gold-500/25 text-gold-400">
                <Users className="w-4 h-4" />
              </span>
              <div className="leading-tight">
                <p className="text-lg font-black tabular-nums text-ivory">{data.totalStudents}</p>
                <p className="text-[11px] text-ivory-muted">إجمالي الطلاب</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-emerald-500/25 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div className="leading-tight">
                <p className="text-lg font-black tabular-nums text-emerald-400">{data.averageCompletion}%</p>
                <p className="text-[11px] text-ivory-muted">متوسط الإنجاز</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-surface-card border border-red-500/25 flex items-center gap-3 col-span-2 sm:col-span-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/25 text-red-400">
                <UserX className="w-4 h-4" />
              </span>
              <div className="leading-tight">
                <p className="text-lg font-black tabular-nums text-red-400">{data.inactiveTwoWeeksCount}</p>
                <p className="text-[11px] text-ivory-muted">خامل أكثر من أسبوعين</p>
              </div>
            </div>
          </div>

          {/* Students list */}
          <div className="rounded-2xl border border-surface-border overflow-hidden">
            {data.students.length === 0 ? (
              <div className="p-8 text-center text-xs text-ivory-muted">لا يوجد طلاب مسجلون في هذا الكورس.</div>
            ) : (
              data.students.map((s, i) => (
                <div
                  key={s.studentId}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 ${
                    i % 2 === 0 ? 'bg-surface-card' : 'bg-bg-elevated/50'
                  } hover:bg-gold-500/[0.04] transition-colors`}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="text-[11px] font-bold text-ivory-muted tabular-nums w-5">{i + 1}</span>
                    {/* Avatar: real photo or gradient initials */}
                    {s.photoUrl ? (
                      <img
                        src={s.photoUrl}
                        alt={s.fullName}
                        className="w-9 h-9 rounded-full object-cover border-2 border-gold-500/40 ring-1 ring-gold-500/15 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 p-0.5 shrink-0">
                        <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-gold-300 font-bold text-xs">
                          {s.fullName?.[0] || '?'}
                        </div>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ivory truncate">{s.fullName}</p>
                      <p className="text-[11px] text-ivory-muted truncate">
                        آخر درس: {s.lastLessonTitle || 'لم يشاهد أي درس بعد'}
                        {s.lastActivityAt && <> · آخر نشاط: {formatDate(s.lastActivityAt)}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                    <div className="hidden sm:block text-left leading-tight">
                      <p className="text-[10px] text-ivory-muted">دروس مكتملة</p>
                      <p className="text-xs font-bold text-ivory tabular-nums">{s.completedLessons}</p>
                    </div>
                    <CompletionBar value={s.completionPercentage} />
                    {s.latestQuizScore != null && <ScorePill percentage={s.latestQuizScore} />}
                    <button
                      onClick={() => setDetailStudentId(s.studentId)}
                      className="flex items-center gap-1 text-xs font-bold text-gold-400 hover:text-gold-300 transition-colors cursor-pointer shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                      التفاصيل
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Student detail modal */}
      <Modal
        isOpen={!!detailStudentId}
        onClose={() => setDetailStudentId(null)}
        title={detail ? `تفاصيل متابعة الطالب: ${detail.student.fullName}` : 'تفاصيل الطالب'}
        description={detail ? detail.courseTitle : undefined}
        maxWidth="lg"
      >
        {isLoadingDetail || !detail ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar pl-1">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-surface-card border border-surface-border text-center">
                <p className="text-base font-black tabular-nums text-ivory">{detail.totalLessons}</p>
                <p className="text-[10px] text-ivory-muted">إجمالي الدروس</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-card border border-emerald-500/25 text-center">
                <p className="text-base font-black tabular-nums text-emerald-400">{detail.completedLessons}</p>
                <p className="text-[10px] text-ivory-muted">اكتملها</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-card border border-red-500/25 text-center">
                <p className="text-base font-black tabular-nums text-red-400">{unwatchedLessons.length}</p>
                <p className="text-[10px] text-ivory-muted">لم يشاهدها</p>
              </div>
            </div>

            {/* Lessons */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
                <MonitorPlay className="w-4 h-4" /> حالة الدروس درساً درساً
              </h4>
              {detail.lessons.map((l) => (
                <div
                  key={l.lessonId}
                  className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border ${
                    l.isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
                      : l.watchedPercentage > 0
                      ? 'border-gold-500/20 bg-gold-500/[0.03]'
                      : 'border-surface-border bg-surface-card'
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {l.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-ivory-muted/50 shrink-0" />
                    )}
                    <span className="text-xs text-ivory truncate">
                      الدرس {l.orderIndex} · {l.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold tabular-nums shrink-0 ${
                      l.isCompleted ? 'text-emerald-400' : l.watchedPercentage > 0 ? 'text-gold-400' : 'text-ivory-muted'
                    }`}
                  >
                    {Math.round(l.watchedPercentage)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Quiz scores */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> نتائج الكويزات وتنشيط المحاولات
              </h4>
              {detail.quizScores.length === 0 ? (
                <p className="text-[11px] text-ivory-muted">لم يحل أي كويز بعد في هذا الكورس.</p>
              ) : (
                detail.quizScores.map((q) => (
                  <div
                    key={`${q.quizId}-${q.attemptNumber}`}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-card border border-surface-border"
                  >
                    <span className="text-xs text-ivory truncate">
                      {q.quizTitle} <span className="text-ivory-muted">(محاولة {q.attemptNumber})</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <ScorePill percentage={q.percentage} isPassed={q.isPassed} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await quizzesApi.reactivateStudentQuiz(q.quizId, detail.student.id);
                            toast.success('تم تنشيط محاولة الكويز للطالب بنجاح!');
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message ?? 'تعذر تنشيط المحاولة.');
                          }
                        }}
                        className="text-[10px] h-6 px-2 border-gold-500/30 text-gold-300 hover:bg-gold-500/10"
                      >
                        تنشيط المحاولة
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  Student search section                                        */
/* ══════════════════════════════════════════════════════════════ */
const StudentSearchSection: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['monitor-student-search', debounced],
    queryFn: () => studentsApi.search(debounced, 10),
    enabled: debounced.length >= 2,
  });

  const results = data?.results ?? [];

  return (
    <div className="space-y-5">
      <div className="relative">
        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="اكتب اسم الطالب للبحث… (حرفان على الأقل)"
          className="w-full bg-surface border border-surface-border text-ivory rounded-xl pr-10 pl-3 py-2.5 text-xs outline-none focus:border-gold-400 placeholder:text-ivory-muted/60"
        />
      </div>

      {debounced.length < 2 && (
        <p className="text-[11px] text-ivory-muted text-center py-6">
          ابحث عن طالب لعرض كل كورساته ونتائج امتحاناته وكويزاته.
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> حدث خطأ أثناء البحث، حاول مرة أخرى.
        </div>
      )}

      {debounced.length >= 2 && !isLoading && results.length === 0 && !isError && (
        <div className="p-10 rounded-2xl border border-dashed border-surface-border bg-surface-card/60 text-center space-y-3">
          <SearchX className="w-10 h-10 mx-auto text-ivory-muted" />
          <p className="text-sm text-ivory-muted">لا يوجد طالب مطابق لـ «{debounced}».</p>
        </div>
      )}

      {results.map((student) => (
        <StudentSearchCard key={student.userId} student={student} />
      ))}
    </div>
  );
};

/* ─── Watched / not-watched lessons panel for one course ───────────── */
type TeacherStudentDetail = Awaited<
  ReturnType<typeof teacherStudentsApi.getStudentDetail>
>;

const CourseLessonsPanel: React.FC<{
  detail?: TeacherStudentDetail;
  isLoading: boolean;
  isError: boolean;
}> = ({ detail, isLoading, isError }) => {
  if (isLoading) {
    return (
      <div className="p-3 rounded-xl bg-surface-card border border-surface-border space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        تعذر تحميل تفاصيل الدروس لهذا الكورس.
      </div>
    );
  }

  const watched = detail.lessons.filter((l) => l.isCompleted || l.watchedPercentage >= 90);
  const notWatched = detail.lessons.filter((l) => !(l.isCompleted || l.watchedPercentage >= 90));

  const renderLessonRow = (l: typeof detail.lessons[number], watchedRow: boolean) => (
    <div
      key={l.lessonId}
      className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${
        watchedRow
          ? 'bg-emerald-500/[0.05] border-emerald-500/20'
          : 'bg-red-500/[0.04] border-red-500/15'
      }`}
    >
      <span className={`text-[11px] truncate min-w-0 flex items-center gap-1.5 ${watchedRow ? 'text-emerald-300' : 'text-ivory'}`}>
        {watchedRow ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="w-3 h-3 text-red-400 shrink-0" />
        )}
        الدرس {l.orderIndex} · {l.title}
      </span>
      <span
        className={`text-[10px] font-bold tabular-nums shrink-0 ${
          watchedRow ? 'text-emerald-400' : l.watchedPercentage > 0 ? 'text-gold-400' : 'text-ivory-muted'
        }`}
      >
        {Math.round(l.watchedPercentage)}%
      </span>
    </div>
  );

  return (
    <div className="p-3 rounded-xl bg-bg-elevated border border-surface-border space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-bold text-gold-300">{detail.courseTitle}</p>
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            شاهدها: {watched.length}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/25 text-red-400">
            لم يشاهدها: {notWatched.length}
          </span>
        </div>
      </div>

      {notWatched.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-red-400">الدروس التي لم يشاهدها</p>
          {notWatched.map((l) => renderLessonRow(l, false))}
        </div>
      )}

      {watched.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-emerald-400">الدروس التي شاهدها</p>
          {watched.map((l) => renderLessonRow(l, true))}
        </div>
      )}
    </div>
  );
};

const StudentSearchCard: React.FC<{ student: StudentSearchResult }> = ({ student }) => {
  // نمرر معرف البروفيل إن وجد، وإلا userId (السيرفر يقبل الاثنين)
  const lessonLookupId = student.studentProfileId || student.userId;
  const [sheetTarget, setSheetTarget] = useState<SheetTarget>(null);

  const submittedExams = student.examAttempts.filter((a) => a.status !== 'IN_PROGRESS');
  const passedExams = submittedExams.filter((a) => a.isPassed);
  const passedQuizzes = student.quizAttempts.filter((q) => q.isPassed);

  // تحميل الدروس (شاهدها / لم يشاهدها) تلقائياً لكل كورسات الطالب
  const courseQueries = useQueries({
    queries: student.courses.map((c) => ({
      queryKey: ['monitor-search-course-lessons', c.id, lessonLookupId],
      queryFn: () => teacherStudentsApi.getStudentDetail(c.id, lessonLookupId),
      enabled: !!lessonLookupId && student.courses.length > 0,
      retry: 1,
    })),
  });

  return (
    <div className="p-5 rounded-2xl bg-surface-card border border-gold-500/25 hover:border-gold-500/45 transition-all space-y-4">
      {/* Identity */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 p-0.5 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-bg flex items-center justify-center text-gold-300 font-bold text-lg">
              {student.fullName?.[0] || '?'}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold font-display text-ivory truncate">{student.fullName}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ivory-muted">
              {student.gradeLevel && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> {formatGradeLevel(student.gradeLevel)}
                </span>
              )}
              {student.phone && <span dir="ltr">{student.phone}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 rounded-lg bg-gold-500/10 border border-gold-500/25 text-gold-300 font-bold">
            {student.courses.length} كورسات
          </span>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold">
            {passedExams.length}/{submittedExams.length} امتحانات ناجحة
          </span>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-300 font-bold">
            {passedQuizzes.length}/{student.quizAttempts.length} كويزات ناجحة
          </span>
        </div>
      </div>

      {/* Courses — اضغط على أي كورس لعرض الدروس التي شاهدها والتي لم يشاهدها */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-bold text-gold-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> متابعة الدروس — شاهدها ولم يشاهدها
        </h4>

        {student.courses.length === 0 && (
          <span className="text-[11px] text-ivory-muted">غير مسجل بأي كورس.</span>
        )}

        <div className="space-y-3">
          {student.courses.map((c, i) => {
            const q = courseQueries[i];
            return (
              <CourseLessonsPanel
                key={c.id}
                detail={q?.data}
                isLoading={!!q?.isLoading}
                isError={!!q?.isError}
              />
            );
          })}
        </div>
      </div>

      {/* Exams, Quizzes & Homeworks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold text-gold-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> نتائج الامتحانات
          </h4>
          {submittedExams.length === 0 ? (
            <p className="text-[11px] text-ivory-muted">لا يوجد محاولات امتحانات.</p>
          ) : (
            <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar pl-1">
              {submittedExams.slice(0, 8).map((a) => (
                <div
                  key={a.attemptId}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-bg-elevated border border-surface-border"
                >
                  <span className="text-[11px] text-ivory truncate min-w-0">
                    {a.examTitle}
                    {a.submittedAt && (
                      <span className="text-ivory-muted"> · {formatDate(a.submittedAt)}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <ScorePill percentage={a.score != null ? Math.round(a.score) : null} isPassed={a.isPassed} />
                    {a.status !== 'SUBMITTED' && (
                      <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {a.status === 'TIMED_OUT' ? 'انتهى الوقت' : 'منتهي'}
                      </span>
                    )}
                    <button
                      type="button"
                      title="عرض ورقة الإجابة"
                      onClick={() =>
                        setSheetTarget({ type: 'EXAM', attemptId: a.attemptId, title: a.examTitle })
                      }
                      className="p-1 rounded-md text-gold-400 hover:bg-gold-500/10 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold text-gold-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> نتائج الكويزات
          </h4>
          {student.quizAttempts.length === 0 ? (
            <p className="text-[11px] text-ivory-muted">لا يوجد محاولات كويزات.</p>
          ) : (
            <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar pl-1">
              {student.quizAttempts.slice(0, 8).map((q) => (
                <div
                  key={q.attemptId}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-bg-elevated border border-surface-border"
                >
                  <span className="text-[11px] text-ivory truncate min-w-0">
                    {q.quizTitle}
                    {q.lessonTitle && <span className="text-ivory-muted"> · {q.lessonTitle}</span>}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <ScorePill percentage={q.score != null ? Math.round(q.score) : null} isPassed={q.isPassed} />
                    <button
                      type="button"
                      title="عرض ورقة الإجابة"
                      onClick={() =>
                        setSheetTarget({ type: 'QUIZ', attemptId: q.attemptId, title: q.quizTitle })
                      }
                      className="p-1 rounded-md text-gold-400 hover:bg-gold-500/10 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h4 className="text-[11px] font-bold text-gold-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> نتائج الواجبات
          </h4>
          {(student.homeworkAttempts ?? []).length === 0 ? (
            <p className="text-[11px] text-ivory-muted">لا يوجد محاولات واجبات.</p>
          ) : (
            <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar pl-1">
              {student.homeworkAttempts!.slice(0, 8).map((h) => (
                <div
                  key={h.attemptId}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-bg-elevated border border-surface-border"
                >
                  <span className="text-[11px] text-ivory truncate min-w-0">
                    {h.homeworkTitle}
                    {h.lessonTitle && <span className="text-ivory-muted"> · {h.lessonTitle}</span>}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <ScorePill percentage={h.score != null ? Math.round(h.score) : null} isPassed={h.isPassed} />
                    <button
                      type="button"
                      title="عرض ورقة الإجابة"
                      onClick={() =>
                        setSheetTarget({ type: 'HOMEWORK', attemptId: h.attemptId, title: h.homeworkTitle })
                      }
                      className="p-1 rounded-md text-gold-400 hover:bg-gold-500/10 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full answer sheet for the picked exam/quiz attempt */}
      <AttemptSheetModal target={sheetTarget} onClose={() => setSheetTarget(null)} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*  Page                                                          */
/* ══════════════════════════════════════════════════════════════ */
export const DashboardStudentMonitorPage: React.FC = () => {
  const [tab, setTab] = useState<MonitorTab>('courses');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-right">
      <PageHeader
        id="student-monitor"
        icon={Eye}
        title="متابعة الطلاب"
        subtitle="تابع مشاهدات طلابك درساً درساً، وابحث عن أي طالب لعرض كورساته ونتائج امتحاناته وكويزاته"
      />

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-surface-card border border-surface-border w-fit">
        <button
          onClick={() => setTab('courses')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'courses'
              ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30'
              : 'text-ivory-muted hover:text-ivory border border-transparent'
          }`}
        >
          <MonitorPlay className="w-4 h-4" />
          متابعة مشاهدات الكورسات
        </button>
        <button
          onClick={() => setTab('search')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'search'
              ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30'
              : 'text-ivory-muted hover:text-ivory border border-transparent'
          }`}
        >
          <SearchIcon className="w-4 h-4" />
          بحث عن طالب
        </button>
      </div>

      {tab === 'courses' ? <CourseMonitorSection /> : <StudentSearchSection />}
    </div>
  );
};
