import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  ListOrdered,
  Filter,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { coursesApi } from '../../api/courses.api';
import { examsApi } from '../../api/exams.api';
import { leaderboardApi } from '../../api/leaderboard.api';
import { ExamBase } from '../../types/exam.types';
import { ExamLeaderboard } from '../../components/exams/ExamLeaderboard';
import { SkeletonLeaderboard } from '../../components/ui/Skeleton';

interface CourseOption {
  id: string;
  title: string;
}

export const ExamRankingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((s) => s.role);
  const isTeacher = role === 'TEACHER';

  const [courseId, setCourseId] = useState(searchParams.get('courseId') || '');
  const [examId, setExamId] = useState(searchParams.get('examId') || '');

  useEffect(() => {
    const pC = searchParams.get('courseId') || '';
    const pE = searchParams.get('examId') || '';
    if (pC && pC !== courseId) setCourseId(pC);
    if (pE && pE !== examId) setExamId(pE);
  }, [searchParams]);

  const syncParams = useCallback(
    (cId: string, eId: string) => {
      const p: Record<string, string> = {};
      if (cId) p.courseId = cId;
      if (eId) p.examId = eId;
      setSearchParams(p, { replace: true });
    },
    [setSearchParams]
  );

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['rankings-courses', isTeacher],
    queryFn: () => (isTeacher ? coursesApi.getTeacherCourses() : coursesApi.getStudentCourses()),
    enabled: !!role,
    staleTime: 60_000,
  });

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['rankings-exams', courseId],
    queryFn: () => examsApi.getCourseExams(courseId),
    enabled: !!courseId,
    staleTime: 60_000,
  });

  const {
    data: board,
    isLoading: boardLoading,
    isError: boardError,
    refetch: refetchBoard,
  } = useQuery({
    queryKey: ['exam-leaderboard', examId],
    queryFn: () => leaderboardApi.getExamLeaderboard(examId),
    enabled: !!examId,
    staleTime: 30_000,
  });

  const courseList: CourseOption[] = courses ?? [];
  const examList: ExamBase[] = exams ?? [];

  useEffect(() => {
    if (courseId && examList.length === 1 && !examId) {
      setExamId(examList[0].id);
      syncParams(courseId, examList[0].id);
    }
  }, [courseId, examList, examId, syncParams]);

  const handleCourseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nextC = e.target.value;
      setCourseId(nextC);
      setExamId('');
      syncParams(nextC, '');
    },
    [syncParams]
  );

  const handleExamChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nextE = e.target.value;
      setExamId(nextE);
      syncParams(courseId, nextE);
    },
    [courseId, syncParams]
  );

  return (
    <div className="w-full min-h-screen bg-bg pb-20 text-right">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6 sm:space-y-8">

        {/* ─── PAGE HEADER ─── */}
        <header className="w-full rounded-3xl bg-surface-card border border-surface-border p-5 sm:p-8 shadow-card-dark space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/10 text-amber-800 dark:text-gold-300 border border-gold-500/30">
                <Trophy className="w-3.5 h-3.5 text-gold-400" />
                <span>لوحة الشرف والتتويج</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-ivory tracking-tight font-amira">
                ترتيب الطلاب والأوائل 🏆
              </h1>
              <p className="text-xs sm:text-sm text-ivory-muted leading-relaxed">
                لوحة المنافسة الرسمية لأفضل 10 مراكز · المعيار: أعلى درجة ثم أقل وقت مستغرق
              </p>
            </div>

            {/* Integrity Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-surface border border-surface-border text-xs text-ivory-muted shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-ivory block">معايير النزاهة</span>
                <span className="text-[10px] text-ivory-muted">حد أقصى مرتان مغادرة</span>
              </div>
            </div>
          </div>
        </header>

        {/* ─── FILTER CARD ─── */}
        <section className="w-full rounded-3xl bg-surface-card border border-surface-border p-5 sm:p-6 shadow-card-dark space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-ivory">
            <Filter className="w-4 h-4 text-gold-400" />
            <span>اختر الكورس والامتحان لعرض لوحة الشرف</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Course Select */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-[11px] font-bold text-ivory-muted flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-gold-400" />
                الكورس
              </label>
              <div className="relative">
                <select
                  value={courseId}
                  onChange={handleCourseChange}
                  className="w-full appearance-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-ivory bg-surface border border-surface-border hover:border-gold-500/40 focus:border-gold-500 focus:bg-surface-card outline-none transition-all cursor-pointer"
                >
                  <option value="">
                    {coursesLoading ? 'جاري التحميل...' : '— اختر الكورس —'}
                  </option>
                  {courseList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-ivory-muted pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Exam Select */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-[11px] font-bold text-ivory-muted flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-gold-400" />
                الامتحان
              </label>
              <div className="relative">
                <select
                  value={examId}
                  onChange={handleExamChange}
                  disabled={!courseId}
                  className="w-full appearance-none rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-ivory bg-surface border border-surface-border hover:border-gold-500/40 focus:border-gold-500 focus:bg-surface-card outline-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!courseId
                      ? 'اختر كورساً أولاً'
                      : examsLoading
                      ? 'جاري التحميل...'
                      : '— اختر الامتحان —'}
                  </option>
                  {examList.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-ivory-muted pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTENT AREA ─── */}
        {!examId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 rounded-3xl bg-surface-card border border-dashed border-surface-border shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <Trophy className="w-8 h-8 opacity-70" />
            </div>
            <div className="space-y-1 max-w-sm px-4">
              <h3 className="text-base font-bold text-ivory">حدد امتحاناً لعرض الترتيب</h3>
              <p className="text-xs text-ivory-muted">
                ستظهر منصة تتويج الأوائل الثلاثة وجدول المراكز العشرة الأولى فور اختيار الامتحان.
              </p>
            </div>
          </div>
        ) : boardLoading ? (
          <SkeletonLeaderboard />
        ) : boardError ? (
          <div className="rounded-3xl bg-red-500/10 border border-red-500/25 p-8 text-center space-y-4">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-red-300">تعذر تحميل بيانات الترتيب</h3>
              <p className="text-xs text-ivory-muted">يرجى المحاولة مرة أخرى أو التحقق من الاتصال.</p>
            </div>
            <button
              onClick={() => refetchBoard()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-red-500/30 hover:bg-surface-card text-red-300 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        ) : !board || board.leaderboard.length === 0 ? (
          <div className="rounded-3xl bg-surface-card border border-surface-border p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto text-gold-400">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ivory">لا توجد نتائج معتمدة بعد في هذا الامتحان</h3>
              <p className="text-xs text-ivory-muted">كن أول من يخوض الامتحان ويسجل اسمه في لوحة الشرف!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Exam Meta Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-ivory-muted">الامتحان:</span>
                <span className="font-bold text-ivory truncate">{board.exam.title}</span>
                <span className="px-2 py-0.5 rounded-md bg-surface-card border border-surface-border text-gold-400 font-bold text-[10px]">
                  {board.leaderboard.length} متسابق
                </span>
              </div>

              {courseId && (
                <Link
                  to={`/courses/${courseId}/exams`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface border border-surface-border text-ivory-muted hover:text-gold-300 transition-colors shadow-sm shrink-0"
                >
                  <span>امتحانات الكورس</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </Link>
              )}
            </div>

            {/* ─── Shared Podium Diagram (Same as Exam Result Page) ─── */}
            <ExamLeaderboard examId={examId} />
          </div>
        )}
      </div>
    </div>
  );
};
