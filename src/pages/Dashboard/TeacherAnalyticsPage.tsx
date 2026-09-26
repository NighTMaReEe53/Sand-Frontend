import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,
  Wallet,
  Clock,
  TrendingUp,
  ArrowLeft,
  BookOpen,
  Activity,
  GraduationCap,
  HelpCircle,
  ChevronDown,
  XCircle,
  Search as SearchIcon,
  Eye,
  Filter,
} from 'lucide-react';
import { teacherAnalyticsApi, QuestionStatItem } from '../../api/phase2-teacher.api';
import { studentsApi, StudentSearchResult } from '../../api/students.api';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { formatPrice, formatGradeLevel } from '../../lib/utils';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader, EmptyState } from '../../components/dashboard/PageHeader';
import { AttemptSheetModal, SheetTarget } from '../../components/dashboard/AttemptSheetModal';

/** Source badge tone per question origin */
const SOURCE_META: Record<QuestionStatItem['sourceType'], { label: string; tone: string }> = {
  EXAM: { label: 'امتحان', tone: 'text-gold-300 bg-gold-500/10 border-gold-500/30' },
  QUIZ: { label: 'كويز', tone: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  HOMEWORK: { label: 'واجب', tone: 'text-violet-300 bg-violet-500/10 border-violet-500/30' },
};

/** One expandable hardest-question row: options reveal on click */
const QuestionStatRow: React.FC<{ item: QuestionStatItem; index: number }> = ({ item, index }) => {  const [open, setOpen] = useState(false);
  const options = Array.isArray(item.options) ? (item.options as string[]) : [];
  const meta = SOURCE_META[item.sourceType];

  return (
    <div className="border-b border-surface-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-surface/60 transition-colors"
      >
        <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black">
          {index + 1}
        </span>
        <span className={`shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.tone}`}>
          {meta.label}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-ivory font-bold">{item.text}</span>
        <span className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-14 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
              <span
                className="block h-full rounded-full bg-gradient-to-l from-red-500 to-red-400"
                style={{ width: `${item.wrongRate}%` }}
              />
            </span>
            <span className="text-[11px] font-black text-red-400 tabular-nums">{item.wrongRate}%</span>
          </span>
          <span className="text-[10px] text-ivory-muted whitespace-nowrap hidden sm:inline">
            {item.wrongCount} خطأ من {item.totalAnswers}
          </span>
          <ChevronDown className={`w-4 h-4 text-ivory-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pr-14 space-y-3">
          <p className="text-[11px] text-ivory-muted">
            المصدر: <span className="text-gold-300 font-bold">{item.sourceTitle}</span>
          </p>
          <div className="space-y-1.5">
            {options.map((opt, optIdx) => {
              const isCorrect = item.correctOptionIndex === optIdx;
              return (
                <div
                  key={optIdx}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                    isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-surface border-surface-border text-ivory-muted'
                  }`}
                >
                  <span>
                    {String.fromCharCode(65 + optIdx)}. {opt}
                  </span>
                  {isCorrect && (
                    <span className="text-[10px] text-emerald-400 font-bold">الإجابة الصحيحة</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/** Search a student and open any of his exam/quiz/homework papers */
const StudentPaperLookup: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [selected, setSelected] = useState<StudentSearchResult | null>(null);
  const [sheetTarget, setSheetTarget] = useState<SheetTarget>(null);
  const [searching, setSearching] = useState(false);

  // debounce the search
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await studentsApi.search(searchTerm.trim(), 5);
        setResults(res.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const attemptsOf = selected?.examAttempts ?? [];
  const quizzesOf = selected?.quizAttempts ?? [];
  const homeworksOf = selected?.homeworkAttempts ?? [];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-card border border-surface-border">
      <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-gold-500/70 to-transparent z-[1]" />
      <div className="px-4 py-3.5 border-b border-surface-border">
        <h3 className="text-sm font-bold text-gold-300 flex items-center gap-2 font-display mb-3">
          <Eye className="w-4 h-4" />
          ورقة إجابات طالب
        </h3>
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted" />
          <input
            dir="rtl"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchTerm(e.target.value);
              setSelected(null);
            }}
            placeholder="ابحث باسم الطالب أو البريد أو الهاتف…"
            className="w-full bg-surface border border-surface-border rounded-xl pr-9 pl-3 py-2.5 text-xs text-ivory outline-none focus:border-gold-400"
          />
        </div>

        {/* search results */}
        {!selected && results.length > 0 && (
          <div className="mt-2 space-y-1">
            {results.map((r) => (
              <button
                key={r.userId}
                type="button"
                onClick={() => setSelected(r)}
                className="w-full text-right flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-surface-border hover:border-gold-500/40 transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-ivory truncate">{r.fullName}</span>
                <span className="text-[10px] text-ivory-muted shrink-0">
                  {r.gradeLevel ? formatGradeLevel(r.gradeLevel) : ''} ·{' '}
                  {(r.examAttempts.length ?? 0) +
                    (r.quizAttempts.length ?? 0) +
                    (r.homeworkAttempts?.length ?? 0)}{' '}
                  محاولة
                </span>
              </button>
            ))}
          </div>
        )}
        {searching && <p className="mt-2 text-[11px] text-ivory-muted">جارٍ البحث…</p>}
      </div>

      {/* selected student — his papers */}
      {selected && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-ivory">{selected.fullName}</p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[10px] text-gold-400 hover:text-gold-300 cursor-pointer"
            >
              تغيير الطالب
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              { label: 'امتحانات', items: attemptsOf.map((a) => ({ id: a.attemptId, title: a.examTitle, score: a.score, isPassed: a.isPassed, type: 'EXAM' as const })) },
              { label: 'كويزات', items: quizzesOf.map((a) => ({ id: a.attemptId, title: a.quizTitle, score: a.score, isPassed: a.isPassed, type: 'QUIZ' as const })) },
              { label: 'واجبات', items: homeworksOf.map((a) => ({ id: a.attemptId, title: a.homeworkTitle!, score: a.score!, isPassed: a.isPassed, type: 'HOMEWORK' as const })) },
            ].map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="text-[10px] font-bold text-gold-300">{group.label}</p>
                {group.items.length === 0 ? (
                  <p className="text-[10px] text-ivory-muted">لا يوجد.</p>
                ) : (
                  group.items.slice(0, 6).map((it) => (
                    <div
                      key={`${group.label}-${it.id}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-bg-elevated border border-surface-border"
                    >
                      <span className="text-[11px] text-ivory truncate min-w-0">{it.title}</span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border tabular-nums ${
                            (it.isPassed ?? false)
                              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                              : 'text-red-400 border-red-500/30 bg-red-500/10'
                          }`}
                        >
                          {it.score != null ? `${Math.round(it.score)}%` : '—'}
                        </span>
                        <button
                          type="button"
                          title="عرض ورقة الإجابة"
                          onClick={() =>
                            setSheetTarget({ type: it.type, attemptId: it.id, title: it.title })
                          }
                          className="p-1 rounded-md text-gold-400 hover:bg-gold-500/10 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AttemptSheetModal target={sheetTarget} onClose={() => setSheetTarget(null)} />
    </div>
  );
};

export const TeacherAnalyticsPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // ADMIN: تحليلات معلم محدد عبر ?teacherId= — بدونها تظهر تحليلات المنصة كاملة
  const teacherId = searchParams.get('teacherId') ?? undefined;

  // ─── Course selector ──────────────────────────────────────────────────────
  const { data: coursesData } = useCoursesQuery({ limit: 50, mine: true });
  const allCourses = (() => {
    const d = coursesData as any;
    return Array.isArray(d?.data) ? d.data : Array.isArray(d?.courses) ? d.courses : Array.isArray(d) ? d : [];
  })();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  // No auto-select: empty string = "All courses"

  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-analytics', teacherId ?? 'own'],
    queryFn: () => teacherAnalyticsApi.getOverview(teacherId),
    retry: 1,
  });

  // Per-question wrong-answer stats — filtered by selected course
  const { data: questionStats, isLoading: isLoadingQuestionStats } = useQuery({
    queryKey: ['teacher-question-stats', teacherId ?? 'own', selectedCourseId || 'all'],
    queryFn: () => teacherAnalyticsApi.getQuestionStats(selectedCourseId || undefined, 10, teacherId),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 text-right">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-red-400 text-right">تعذر تحميل تحليلات الأداء.</p>;
  }

  const { totals, courses } = data;

  // Filter courses list by selected course
  const visibleCourses = selectedCourseId
    ? courses.filter((c) => c.courseId === selectedCourseId)
    : courses;

  const stats = [
    {
      icon: BookOpen,
      label: 'عدد الكورسات',
      value: String(totals.totalCourses),
      tone: 'text-gold-300 bg-gold-500/10 border-gold-500/25',
    },
    {
      icon: Users,
      label: 'إجمالي الطلاب المشتركين',
      value: String(totals.totalStudents),
      tone: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
    },
    {
      icon: Wallet,
      label: 'إجمالي الإيرادات المقبولة',
      value: formatPrice(totals.totalRevenue),
      tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    },
    {
      icon: Clock,
      label: 'مدفوعات معلقة',
      value: String(totals.pendingPayments),
      tone: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    },
  ];

  return (
    <div className="space-y-6 text-right">
      <PageHeader
        id="analytics"
        icon={BarChart3}
        title="تحليلات الأداء"
        subtitle="مؤشرات أداء كورساتك محسوبة من قاعدة البيانات مباشرة."
      />

      {/* ─── Course Selector ──────────────────────────────────────────── */}
      {allCourses.length > 1 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-card border border-surface-border">
          <Filter className="w-4 h-4 text-gold-400 shrink-0" />
          <span className="text-xs font-bold text-ivory-muted whitespace-nowrap">تصفية حسب الكورس:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="flex-1 bg-surface border border-surface-border text-ivory rounded-xl px-3 py-2 text-xs outline-none focus:border-gold-400 cursor-pointer"
          >
            <option value="">جميع الكورسات</option>
            {allCourses.map((c: any) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {selectedCourseId && (
            <button
              onClick={() => setSelectedCourseId('')}
              className="text-xs text-gold-400 hover:text-gold-300 font-bold whitespace-nowrap cursor-pointer"
            >
              إعادة ضبط
            </button>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const StatIcon = s.icon;
          return (
            <div
              key={s.label}
              className="group relative overflow-hidden p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/30 transition-all duration-300 space-y-2 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className={`flex w-10 h-10 items-center justify-center rounded-xl border ${s.tone}`}>
                <StatIcon className="w-5 h-5" strokeWidth={1.9} />
              </span>
              <p className="text-xl font-bold font-amiri text-gold-300 leading-none pt-1">{s.value}</p>
              <p className="text-[11px] font-bold text-ivory-muted">{s.label}</p>
              {/* corner dot vector */}
              <svg aria-hidden className="absolute -bottom-2 -left-2 w-12 h-12 text-gold-500/10 group-hover:text-gold-500/25 transition-colors" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Per-course table */}
      {visibleCourses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="لا توجد كورسات بعد"
          description="أنشئ كورسك الأول وابدأ في متابعة تحليلات أداء طلابك من هنا."
        />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-surface-card border border-surface-border overflow-x-auto">
          {/* top accent line */}
          <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-gold-500/70 to-transparent z-[1]" />
          <table className="w-full text-xs text-right min-w-[720px]">
            <thead className="bg-surface text-gold-300/80">
              <tr>
                <th className="px-4 py-3.5 font-bold">الكورس</th>
                <th className="px-4 py-3.5 font-bold">الطلاب</th>
                <th className="px-4 py-3.5 font-bold">نشِطون (14 يوم)</th>
                <th className="px-4 py-3.5 font-bold">متوسط التقدم</th>
                <th className="px-4 py-3.5 font-bold">معدل الإكمال</th>
                <th className="px-4 py-3.5 font-bold">متوسط الامتحانات</th>
                <th className="px-4 py-3.5 font-bold">الإيراد</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {visibleCourses.map((c) => (
                <tr key={c.courseId} className="hover:bg-surface/60 transition-colors group/row">
                  <td className="px-4 py-3.5 font-bold text-ivory group-hover/row:text-gold-200 transition-colors">{c.title}</td>
                  <td className="px-4 py-3.5 text-ivory-muted">{c.studentCount}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                      <Activity className="w-3.5 h-3.5" />
                      {c.activeStudents}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-16 h-1.5 rounded-full bg-surface-elevated overflow-hidden inline-block align-middle">
                        <span
                          className="block h-full rounded-full bg-gradient-to-l from-gold-500 to-gold-300"
                          style={{ width: `${c.averageWatchPercentage}%` }}
                        />
                      </span>
                      {c.averageWatchPercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-ivory-muted">{c.completionRate}%</td>
                  <td className="px-4 py-3.5 text-ivory-muted">
                    {c.averageExamScore !== null ? `${c.averageExamScore}%` : '—'}
                    {c.examPassRate !== null && (
                      <span className="text-[10px] text-ivory-muted/70 block">
                        نجاح {c.examPassRate}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-gold-400 font-bold">{formatPrice(c.revenue)}</td>
                  <td className="px-4 py-3.5">
                    <Link
                      to={`/dashboard/courses/${c.courseId}/analytics`}
                      className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 whitespace-nowrap"
                    >
                      تفاصيل الدروس
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Open a student's exam/quiz/homework paper ──────────────── */}
      <StudentPaperLookup />

      {/* ─── Hardest questions (wrong-answer analytics) ─────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-card border border-surface-border">
        <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-red-500/60 to-transparent z-[1]" />
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-surface-border">
          <h3 className="text-sm font-bold text-gold-300 flex items-center gap-2 font-display">
            <HelpCircle className="w-4 h-4 text-red-400" />
            أصعب الأسئلة — أكثر إجابات خاطئة
          </h3>
          <span className="text-[10px] text-ivory-muted hidden sm:block">
            امتحانات + كويزات + واجبات — مرتبة حسب نسبة الخطأ
          </span>
        </div>

        {isLoadingQuestionStats ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        ) : !questionStats || questionStats.questions.length === 0 ? (
          <div className="px-4 py-8 flex items-center justify-center gap-2 text-xs text-ivory-muted">
            <XCircle className="w-4 h-4" />
            لا توجد بيانات كافية بعد — ستظهر الأسئلة هنا بعد أول محاولات الطلاب.
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {questionStats.questions.map((q, i) => (
              <QuestionStatRow key={q.questionId} item={q} index={i} />
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-ivory-muted/60 flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3" />
        «نشِطون» = طلاب سجلّوا نشاط مشاهدة خلال آخر 14 يوماً.
      </p>
    </div>
  );
};
