import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  FileQuestion,
  FileText,
  Award,
  TrendingUp,
  AlertTriangle,
  Calendar,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import { analyticsApi, PeriodicReportData, WeeklyReportResponse } from '../../api/analytics.api';
import { ProgressBar } from '../ui/ProgressBar';
import { formatGradeLevel } from '../../lib/utils';

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

function ReportBody({ data }: { data: PeriodicReportData }) {
  const s = data?.summary ?? ({} as any);
  const evaluatedComponents = Array.isArray(s.evaluatedComponents) ? s.evaluatedComponents : [];
  const insights = Array.isArray(s.insights) ? s.insights : [];
  const quizzes = Array.isArray(data?.quizzes) ? data.quizzes : [];
  const homeworks = Array.isArray(data?.homeworks) ? data.homeworks : [];
  const exams = Array.isArray(data?.exams) ? data.exams : [];

  const hasScore = s.overallScore !== null && s.overallScore !== undefined;
  const overallScore: number = hasScore ? (s.overallScore as number) : 0;
  const levelLabel =
    !hasScore ? 'بانتظار أول نشاط مكتمل' : overallScore >= 85 ? 'ممتاز ومتفوق ⭐' : overallScore >= 65 ? 'جيد مع إمكانية للتحسن 👍' : 'يحتاج متابعة وتكثيف المذاكرة ⚠️';
  const levelColor =
    !hasScore ? 'text-ivory-muted' : overallScore >= 85 ? 'text-emerald-700 dark:text-emerald-400' : overallScore >= 65 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400';

  return (
    <div className="space-y-6">
      {/* Overall weighted banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-surface-card to-surface border border-amber-500/30 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--surface-alt)', borderColor: 'var(--line)' }}
            >
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{hasScore ? `${overallScore}%` : '—'}</span>
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400">التقييم العام</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-ivory font-amira">
                مستوى الطالب في هذه الفترة: <span className={levelColor}>{levelLabel}</span>
              </h4>
              <p className="text-xs text-ivory-muted">
                احتساب موزون من الأنشطة المسجلة فقط — {evaluatedComponents.length > 0 ? evaluatedComponents.join(' + ') : 'لا توجد بيانات كافية بعد'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-surface-border">
          <div className="space-y-1 text-center sm:text-right">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-ivory-muted">إكمال الدروس (30%)</span>
              <span className="text-emerald-700 dark:text-emerald-400">{s.attendanceRate ?? 0}%</span>
            </div>
            <ProgressBar value={s.attendanceRate ?? 0} />
          </div>
          <div className="space-y-1 text-center sm:text-right">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-ivory-muted">الامتحانات (30%)</span>
              <span className="text-cyan-700 dark:text-cyan-400">{s.examAverage ?? 0}%</span>
            </div>
            <ProgressBar value={s.examAverage ?? 0} />
          </div>
          <div className="space-y-1 text-center sm:text-right">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-ivory-muted">الكويزات (20%)</span>
              <span className="text-violet-700 dark:text-violet-400">{s.quizAverage ?? 0}%</span>
            </div>
            <ProgressBar value={s.quizAverage ?? 0} />
          </div>
          <div className="space-y-1 text-center sm:text-right">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-ivory-muted">الواجبات (20%)</span>
              <span className="text-amber-700 dark:text-gold-400">{s.homeworkAverage ?? s.homeworkCompletionRate ?? 0}%</span>
            </div>
            <ProgressBar value={s.homeworkAverage ?? s.homeworkCompletionRate ?? 0} />
          </div>
        </div>
      </div>

      {/* 4 analytics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ivory-muted">إكمال الدروس</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{s.attendanceRate ?? 0}%</p>
            <p className="text-xs text-ivory-muted mt-1">أكمل {s.attendedLessonsCount ?? 0} من {s.totalAssignedLessons ?? 0} درس</p>
          </div>
          {s.unattendedLessonsCount && s.unattendedLessonsCount > 0 ? (
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 inline-block">
              متأخر في {s.unattendedLessonsCount} درس
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 inline-block">
              مكتمل بنجاح ✓
            </span>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ivory-muted">الكويزات القصيرة</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-violet-700 dark:text-violet-300">{s.quizAverage !== null && s.quizAverage !== undefined ? `${s.quizAverage}%` : '—'}</p>
            <p className="text-xs text-ivory-muted mt-1">اجتاز {s.passedQuizzesCount ?? 0} من {s.quizzesTakenCount ?? 0} كويز</p>
          </div>
          <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20 inline-block">
            معدل النجاح {s.quizzesTakenCount > 0 ? Math.round(((s.passedQuizzesCount ?? 0) / s.quizzesTakenCount) * 100) : 0}%
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ivory-muted">تسليم الواجبات</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-cyan-700 dark:text-cyan-300">{s.homeworkAverage ?? s.homeworkCompletionRate ?? 0}%</p>
            <p className="text-xs text-ivory-muted mt-1">
              {s.homeworkAverage !== null && s.homeworkAverage !== undefined ? `متوسط الدرجات ${s.homeworkAverage}% • ` : ''}سلّم {s.submittedHomeworksCount ?? 0} من {s.totalAssignedHomeworks ?? 0} واجب
            </p>
          </div>
          {s.unsubmittedHomeworksCount && s.unsubmittedHomeworksCount > 0 ? (
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 inline-block">
              لم يسلم {s.unsubmittedHomeworksCount} واجب
            </span>
          ) : (
            <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20 inline-block">
              التزام كامل بالواجبات ✓
            </span>
          )}
        </div>

        <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ivory-muted">الامتحانات الشاملة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-gold-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-800 dark:text-gold-300">{s.examAverage !== null && s.examAverage !== undefined ? `${s.examAverage}%` : '—'}</p>
            <p className="text-xs text-ivory-muted mt-1">اجتاز {s.passedExamsCount ?? 0} من {s.examsTakenCount ?? 0} امتحان</p>
          </div>
          <span className="text-[10px] font-bold text-amber-800 dark:text-gold-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 inline-block">
            {s.examsTakenCount ?? 0} امتحان منجز
          </span>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-xs font-black text-ivory">
            <GraduationCap className="w-4 h-4 text-gold-400" />
            خطوتك التالية
          </div>
          <ul className="mt-2 space-y-1.5 text-xs leading-6 text-ivory-muted">
            {insights.map((insight) => <li key={insight}>• {insight}</li>)}
          </ul>
        </div>
      )}

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-3xl bg-surface border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">أعلى درجة كويز حققها 🏆</p>
              <p className="text-xs text-ivory font-bold truncate max-w-[220px] mt-0.5">
                {s.highestQuiz ? s.highestQuiz.title : 'لا توجد محاولات بعد'}
              </p>
            </div>
          </div>
          {s.highestQuiz && (
            <span className="text-base font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-2xl border border-emerald-500/30 shrink-0">
              {s.highestQuiz.score}%
            </span>
          )}
        </div>

        <div className="p-4 rounded-3xl bg-surface border border-amber-500/30 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400">أقل كويز يحتاج مراجعة ⚠️</p>
              <p className="text-xs text-ivory font-bold truncate max-w-[220px] mt-0.5">
                {s.lowestQuiz ? s.lowestQuiz.title : 'لا توجد محاولات بعد'}
              </p>
            </div>
          </div>
          {s.lowestQuiz && (
            <span className="text-base font-black text-amber-800 dark:text-amber-400 bg-amber-500/15 px-3 py-1.5 rounded-2xl border border-amber-500/30 shrink-0">
              {s.lowestQuiz.score}%
            </span>
          )}
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
          <BarChart3 className="w-4 h-4 text-gold-400" />
          <h4 className="text-sm font-black text-ivory">سجل الأنشطة والمحاولات التفصيلي:</h4>
        </div>

        {quizzes.length > 0 ? (
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
            <div className="p-3 bg-surface-card border-b border-surface-border flex items-center justify-between">
              <span className="text-xs font-bold text-ivory">كويزات واختبارات الدروس ({quizzes.length})</span>
            </div>
            <div className="overflow-x-auto max-h-52 custom-scrollbar">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface/60 text-ivory-muted text-[11px]">
                  <tr className="border-b border-surface-border">
                    <th className="p-2.5">الكويز</th>
                    <th className="p-2.5">الدرس</th>
                    <th className="p-2.5 text-center">الدرجة</th>
                    <th className="p-2.5 text-center">الحالة</th>
                    <th className="p-2.5 text-left">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40">
                  {quizzes.map((q, idx) => (
                    <tr key={idx} className="hover:bg-surface-card/60">
                      <td className="p-2.5 font-bold text-ivory">{q.quizTitle}</td>
                      <td className="p-2.5 text-ivory-muted">{q.lessonTitle}</td>
                      <td className="p-2.5 text-center font-black text-ivory">{q.score}%</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${q.isPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30' : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'}`}>
                          {q.isPassed ? 'ناجح' : 'لم يجتز'}
                        </span>
                      </td>
                      <td className="p-2.5 text-left text-ivory-muted">{formatDate(q.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-surface border border-surface-border text-center text-xs text-ivory-muted">
            لم يقم الطالب بأداء كويزات خلال هذه الفترة.
          </div>
        )}

        {exams.length > 0 && (
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
            <div className="p-3 bg-surface-card border-b border-surface-border flex items-center justify-between">
              <span className="text-xs font-bold text-ivory">الامتحانات الشاملة ({exams.length})</span>
            </div>
            <div className="overflow-x-auto max-h-52 custom-scrollbar">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface/60 text-ivory-muted text-[11px]">
                  <tr className="border-b border-surface-border">
                    <th className="p-2.5">الامتحان</th>
                    <th className="p-2.5">الكورس</th>
                    <th className="p-2.5 text-center">الدرجة</th>
                    <th className="p-2.5 text-center">الحالة</th>
                    <th className="p-2.5 text-left">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40">
                  {exams.map((ex, idx) => (
                    <tr key={idx} className="hover:bg-surface-card/60">
                      <td className="p-2.5 font-bold text-ivory">{ex.examTitle}</td>
                      <td className="p-2.5 text-ivory-muted">{ex.courseTitle}</td>
                      <td className="p-2.5 text-center font-black text-ivory">{ex.score}%</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${ex.isPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30' : 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'}`}>
                          {ex.isPassed ? 'ناجح' : 'لم يجتز'}
                        </span>
                      </td>
                      <td className="p-2.5 text-left text-ivory-muted">{formatDate(ex.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {homeworks.length > 0 && (
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
            <div className="p-3 bg-surface-card border-b border-surface-border flex items-center justify-between">
              <span className="text-xs font-bold text-ivory">الواجبات المسلمة ({homeworks.length})</span>
            </div>
            <div className="overflow-x-auto max-h-52 custom-scrollbar">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface/60 text-ivory-muted text-[11px]">
                  <tr className="border-b border-surface-border">
                    <th className="p-2.5">الواجب</th>
                    <th className="p-2.5">الدرس</th>
                    <th className="p-2.5 text-center">حالة التسليم</th>
                    <th className="p-2.5 text-left">تاريخ التسليم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40">
                  {homeworks.map((h, idx) => (
                    <tr key={idx} className="hover:bg-surface-card/60">
                      <td className="p-2.5 font-bold text-ivory">{h.homeworkTitle}</td>
                      <td className="p-2.5 text-ivory-muted">{h.lessonTitle}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                          تم التسليم ✓
                        </span>
                      </td>
                      <td className="p-2.5 text-left text-ivory-muted">{formatDate(h.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  mode: 'student' | 'parent';
  studentId?: string;
  /** When rendered inside an existing titled card (e.g. ProfilePage collapse), hide the inner header to avoid a duplicated title. */
  hideHeader?: boolean;
}

export const WeeklyReportView: React.FC<Props> = ({ mode, studentId, hideHeader }) => {
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [weekStart, setWeekStart] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<WeeklyReportResponse>({
    queryKey: ['weekly-report', mode, studentId, courseId, weekStart],
    queryFn: () =>
      mode === 'student'
        ? analyticsApi.getMyWeeklyReport(courseId, weekStart)
        : analyticsApi.getParentChildWeeklyReport(studentId!, courseId, weekStart),
    enabled: mode === 'student' || !!studentId,
  });

  const content = isLoading ? (
    <div className="space-y-4 animate-pulse">
      <div className="h-28 rounded-3xl bg-surface border border-surface-border" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-surface border border-surface-border" />
        ))}
      </div>
      <div className="h-24 rounded-2xl bg-surface border border-surface-border" />
    </div>
  ) : isError ? (
    <div className="py-8 text-center space-y-3">
      <div className="text-3xl">😕</div>
      <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>تعذر تحميل التقرير الأسبوعي</p>
      <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>تحقق من اتصالك أو جرب مجدداً.</p>
      <button
        type="button"
        onClick={() => refetch()}
        className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:opacity-80 active:scale-95 cursor-pointer"
        style={{ backgroundColor: 'var(--surface-alt)', borderColor: 'var(--line)', color: 'var(--ink)' }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        إعادة المحاولة
      </button>
    </div>
  ) : data?.report ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <ReportBody data={data.report} />
    </motion.div>
  ) : (
    <div className="py-12 text-center text-ivory-muted text-xs">لا توجد بيانات تقرير لهذه الفترة.</div>
  );

  // Course / week filter bar — rendered inside the report body so it stays
  // available even when the outer header is hidden (e.g. ProfilePage collapse).
  const filtersBar = (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      <select
        value={courseId ?? ''}
        onChange={(e) => { setCourseId(e.target.value || undefined); setWeekStart(undefined); }}
        className="rounded-xl bg-surface border border-surface-border px-3 py-2 text-xs text-ivory outline-none focus:border-gold-400"
      >
        <option value="">كل الكورسات</option>
        {data?.courses?.map((c) => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>

      <select
        value={weekStart ?? ''}
        onChange={(e) => setWeekStart(e.target.value || undefined)}
        className="rounded-xl bg-surface border border-surface-border px-3 py-2 text-xs text-ivory outline-none focus:border-gold-400"
      >
        <option value="">الأسبوع الحالي (تحديث مباشر)</option>
        {data?.weeks?.map((w) => (
          <option key={w} value={w}>أسبوع {formatDate(w)}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all hover:border-[var(--primary)] hover:bg-[var(--surface-alt)] active:scale-95 cursor-pointer disabled:opacity-50 mr-auto"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          color: 'var(--ink)',
        }}
        title="تحديث البيانات فورياً"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-[var(--primary)] ${isFetching ? 'animate-spin' : ''}`} />
        <span>{isFetching ? 'جاري التحديث…' : 'تحديث البيانات'}</span>
      </button>
    </div>
  );

  // When the parent card already provides a header (e.g. ProfilePage collapse),
  // skip the inner card + header to avoid a duplicated title.
  if (hideHeader) {
    return (
      <div className="p-0">
        {filtersBar}
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-surface-border bg-surface-card overflow-hidden shadow-card">
      <div className="p-5 sm:p-6 border-b border-surface-border bg-gradient-to-l from-amber-500/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-gold-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-ivory flex items-center gap-2">
              التقرير الأسبوعي للأداء
              {data?.report?.student?.gradeLevel && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-gold-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/25">
                  <GraduationCap className="w-3 h-3" />
                  {formatGradeLevel(data.report.student.gradeLevel)}
                </span>
              )}
            </h3>
            <p className="text-xs text-ivory-muted mt-0.5 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-gold-400" />
              يُحدَّث تلقائياً كل أسبوع
              {data?.week && (
                <span className="inline-flex items-center gap-1 text-ivory-muted/80">
                  <Calendar className="w-3 h-3" />
                  آخر تحديث: {formatDate(data.week.generatedAt)}
                  {data.week.isLive && ' (مباشر)'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {filtersBar}
        {content}
      </div>
    </div>
  );
};
