import React, { useMemo, useState } from 'react';
import {
  Users,
  GraduationCap,
  FileText,
  BookOpen,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  ListChecks,
  FileDown,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  useParentChildrenQuery,
  useParentStudentLessonsQuery,
  useParentStudentProfileQuery,
  useParentStudentResultsQuery,
} from '../../hooks/queries/useParent';
import { parentApi } from '../../api/parent.api';
import { WeeklyReportView } from '../../components/analytics/WeeklyReportView';
import type {
  ParentAttemptResult,
  ParentResultStatusFilter,
  ParentResultTypeFilter,
} from '../../api/parent.api';

type TabKey = 'overview' | 'results' | 'lessons' | 'report';

const GRADE_LABELS: Record<string, string> = {
  PREP_1: 'الأول الإعدادي',
  PREP_2: 'الثاني الإعدادي',
  PREP_3: 'الثالث الإعدادي',
  SEC_1: 'الأول الثانوي',
  SEC_2: 'الثاني الثانوي',
  SEC_3_SCIENTIFIC: 'الثالث الثانوي - علمي',
  SEC_3_LITERARY: 'الثالث الثانوي - أدبي',
  AZHAR_PREP: 'أزهري - إعدادية',
  AZHAR_SEC: 'أزهري - ثانوية',
  BAC: 'بكالوريا',
};

const KIND_LABELS: Record<string, string> = {
  EXAM: 'امتحان',
  QUIZ: 'كويز',
  HOMEWORK: 'واجب',
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

const ScoreRing: React.FC<{ percent: number; passed: boolean | null }> = ({ percent, passed }) => (
  <div
    className={`relative w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
      passed === false ? 'text-red-400' : 'text-emerald-400'
    }`}
    style={{
      background: `conic-gradient(${
        passed === false ? '#f87171' : '#34d399'
      } ${percent}%, rgba(255,255,255,0.06) ${percent}% 100%)`,
    }}
  >
    <span className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center">
      {percent}%
    </span>
  </div>
);

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}> = ({ icon, label, value, sub }) => (
  <div className="rounded-2xl bg-surface-card border border-gold-500/20 p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-ivory-muted">{label}</p>
      <p className="text-lg font-bold text-gold-300 leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-ivory-muted">{sub}</p>}
    </div>
  </div>
);

export const ParentDashboardPage: React.FC = () => {
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');

  // Results filters
  const [resultType, setResultType] = useState<ParentResultTypeFilter>('ALL');
  const [resultStatus, setResultStatus] = useState<ParentResultStatusFilter>('ALL');
  const [resultCourseId, setResultCourseId] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Lessons filters
  const [lessonCourseId, setLessonCourseId] = useState<string>('ALL');
  const [lessonStatus, setLessonStatus] = useState<'ALL' | 'TAKEN' | 'NOT_TAKEN'>('ALL');

  const childrenQuery = useParentChildrenQuery(true);
  const children = childrenQuery.data?.children ?? [];

  const isResultsTab = tab === 'results';
  const isLessonsTab = tab === 'lessons';

  // Derived (not stored): falls back to the first child when nothing selected
  const selectedChildId =
    children.find((c) => c.id === activeChildId)?.id ?? children[0]?.id ?? null;

  const profileQuery = useParentStudentProfileQuery(selectedChildId ?? undefined, !!selectedChildId);
  const resultsQuery = useParentStudentResultsQuery(
    selectedChildId ?? undefined,
    {
      type: resultType,
      status: resultStatus,
      courseId: resultCourseId !== 'ALL' ? resultCourseId : undefined,
    },
    !!selectedChildId && isResultsTab
  );
  const lessonsQuery = useParentStudentLessonsQuery(
    selectedChildId ?? undefined,
    lessonCourseId !== 'ALL' ? lessonCourseId : undefined,
    !!selectedChildId && isLessonsTab
  );

  const allAttempts: ParentAttemptResult[] = useMemo(() => {
    if (!resultsQuery.data) return [];
    return [
      ...resultsQuery.data.examAttempts,
      ...resultsQuery.data.quizAttempts,
      ...resultsQuery.data.homeworkAttempts,
    ];
  }, [resultsQuery.data]);

  const visibleAttempts = useMemo(() => {
    const q = search.trim();
    if (!q) return allAttempts;
    return allAttempts.filter(
      (a) => a.title.includes(q) || a.courseTitle.includes(q) || (a.lessonTitle ?? '').includes(q)
    );
  }, [allAttempts, search]);

  const handleDownload = async (attempt: ParentAttemptResult) => {
    if (!attempt.paperPdfUrl) return;
    setDownloadingId(attempt.attemptId);
    try {
      await parentApi.downloadPdf(
        attempt.paperPdfUrl,
        `${KIND_LABELS[attempt.kind]}-${attempt.title}.pdf`
      );
    } finally {
      setDownloadingId(null);
    }
  };

  if (childrenQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-500/30 border-t-gold-400" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
          <Users className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold font-amiri text-gold-300 mb-3">لا يوجد أبناء مرتبطون بحسابك</h1>
        <p className="text-sm text-ivory-muted leading-relaxed">
          لم يتم العثور على أي طالب سجّل رقم هاتفك كـ "رقم ولي الأمر".
          تأكد من أن الابن أدخل رقمك بشكل صحيح عند التسجيل أو في ملفه الشخصي.
        </p>
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-gold-glow">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-amiri text-gold-300">متابعة الأبناء</h1>
          <p className="text-xs text-ivory-muted">تابع درجات ودروس ونتائج أبنائك خطوة بخطوة</p>
        </div>
      </div>

      {/* Child selector */}
      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="اختيار الابن">
        {children.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={selectedChildId === c.id}
            onClick={() => {
              setActiveChildId(c.id);
              setResultCourseId('ALL');
              setLessonCourseId('ALL');
            }}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all ${
              selectedChildId === c.id
                ? 'bg-gold-500/15 border-gold-500/50 text-gold-300 shadow-gold-glow'
                : 'bg-surface-card border-gold-500/20 text-ivory-muted hover:border-gold-500/40'
            }`}
          >
            {c.photoUrl ? (
              <img src={c.photoUrl} alt={c.fullName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-surface border border-gold-500/25 flex items-center justify-center text-xs font-bold text-gold-300">
                {c.fullName[0]}
              </span>
            )}
            <span className="text-right">
              <span className="block text-sm font-bold">{c.fullName}</span>
              <span className="block text-[10px] opacity-80">{GRADE_LABELS[c.gradeLevel] ?? c.gradeLevel}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-surface border border-gold-500/20 mb-6 max-w-2xl" role="tablist">
        {([
          { key: 'overview', label: 'نظرة عامة', icon: <BarChart3 className="w-4 h-4" /> },
          { key: 'results', label: 'الدرجات والنتائج', icon: <FileText className="w-4 h-4" /> },
          { key: 'lessons', label: 'الدروس', icon: <BookOpen className="w-4 h-4" /> },
          { key: 'report', label: 'التقرير الأسبوعي', icon: <GraduationCap className="w-4 h-4" /> },
        ] as const).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-gold-500/15 border border-gold-500/40 text-gold-300'
                : 'text-ivory-muted hover:text-ivory border border-transparent'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Overview ─────────────────────────────────────────── */}
      {tab === 'overview' &&
        (profileQuery.isLoading || !profile ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-500/30 border-t-gold-400" />
          </div>
        ) : (
          <div className="space-y-6 animate-auth-rise">
            <div className="rounded-3xl bg-surface-card border border-gold-500/25 p-6 flex flex-wrap items-center gap-5">
              {profile.profile.photoUrl ? (
                <img
                  src={profile.profile.photoUrl}
                  alt={profile.profile.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border border-gold-500/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-2xl font-bold text-gold-300">
                  {profile.profile.fullName[0]}
                </div>
              )}
              <div className="flex-1 min-w-[200px]">
                <h2 className="text-xl font-bold text-gold-300 font-amiri">{profile.profile.fullName}</h2>
                <p className="text-xs text-ivory-muted mt-1">
                  {GRADE_LABELS[profile.profile.gradeLevel] ?? profile.profile.gradeLevel}
                  {' · '}
                  آخر ظهور: {fmtDate(profile.profile.lastSeenAt)}
                </p>
              </div>
              <div className="rounded-2xl px-4 py-3 bg-gold-500/10 border border-gold-500/25 text-center">
                <p className="text-[10px] text-ivory-muted">نسبة إتمام الدروس</p>
                <p className="text-2xl font-bold text-gold-300">
                  {profile.stats.lessonsTotal > 0
                    ? Math.round((profile.stats.lessonsCompleted / profile.stats.lessonsTotal) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={<GraduationCap className="w-5 h-5" />}
                label="امتحانات"
                value={profile.stats.examsAvgPercent !== null ? `${profile.stats.examsAvgPercent}%` : '—'}
                sub={`${profile.stats.examsPassed}/${profile.stats.examsCount} ناجح`}
              />
              <StatCard
                icon={<ListChecks className="w-5 h-5" />}
                label="كويزات"
                value={profile.stats.quizzesAvgPercent !== null ? `${profile.stats.quizzesAvgPercent}%` : '—'}
                sub={`${profile.stats.quizzesPassed}/${profile.stats.quizzesCount} ناجح`}
              />
              <StatCard
                icon={<FileText className="w-5 h-5" />}
                label="واجبات"
                value={profile.stats.homeworkAvgPercent !== null ? `${profile.stats.homeworkAvgPercent}%` : '—'}
                sub={`${profile.stats.homeworkPassed}/${profile.stats.homeworkCount} ناجح`}
              />
              <StatCard
                icon={<BookOpen className="w-5 h-5" />}
                label="الدروس"
                value={`${profile.stats.lessonsCompleted}/${profile.stats.lessonsTotal}`}
                sub={`${profile.stats.coursesCount} كورسات مشترك بها`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profile.courses.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl bg-surface-card border border-gold-500/20 overflow-hidden flex items-center gap-3 p-3"
                >
                  {c.thumbnailUrl ? (
                    <img src={c.thumbnailUrl} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{c.title}</p>
                    {c.subject && <p className="text-[10px] text-ivory-muted">{c.subject}</p>}
                  </div>
                </div>
              ))}
              {profile.courses.length === 0 && (
                <p className="col-span-full text-center text-xs text-ivory-muted py-6">
                  لا توجد كورسات مشترك بها الطالب بعد.
                </p>
              )}
            </div>
          </div>
        ))}

      {/* ─── Results ──────────────────────────────────────────── */}
      {isResultsTab && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="rounded-2xl bg-surface-card border border-gold-500/20 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'ALL', label: 'الكل' },
                { key: 'EXAM', label: 'امتحانات' },
                { key: 'QUIZ', label: 'كويزات' },
                { key: 'HOMEWORK', label: 'واجبات' },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setResultType(t.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    resultType === t.key
                      ? 'bg-gold-500/15 border-gold-500/45 text-gold-300'
                      : 'border-gold-500/15 text-ivory-muted hover:border-gold-500/35'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={resultStatus}
                onChange={(e) => setResultStatus(e.target.value as ParentResultStatusFilter)}
                className="px-3 py-2 rounded-xl bg-surface border border-gold-500/25 text-xs text-ivory focus:border-gold-400 outline-none"
                aria-label="فلترة بالحالة"
              >
                <option value="ALL">كل الحالات</option>
                <option value="PASSED">ناجح فقط</option>
                <option value="FAILED">راسب فقط</option>
              </select>

              <select
                value={resultCourseId}
                onChange={(e) => setResultCourseId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-gold-500/25 text-xs text-ivory focus:border-gold-400 outline-none max-w-[220px]"
                aria-label="فلترة بالكورس"
              >
                <option value="ALL">كل الكورسات</option>
                {(profile?.courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث باسم الامتحان أو الكويز أو الواجب…"
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-surface border border-gold-500/25 text-xs text-ivory placeholder:text-ivory-muted/60 focus:border-gold-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* List */}
          {resultsQuery.isLoading ? (
            <div className="flex min-h-[25vh] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-500/30 border-t-gold-400" />
            </div>
          ) : visibleAttempts.length === 0 ? (
            <div className="text-center py-12 text-xs text-ivory-muted rounded-2xl bg-surface-card border border-gold-500/15">
              لا توجد نتائج مطابقة للفلاتر المختارة.
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleAttempts.map((a) => (
                <li
                  key={a.attemptId}
                  className="rounded-2xl bg-surface-card border border-gold-500/20 p-4 flex flex-wrap items-center gap-4"
                >
                  <ScoreRing percent={a.percent} passed={a.isPassed} />

                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/10 border border-gold-500/30 text-gold-300">
                        {KIND_LABELS[a.kind]}
                      </span>
                      <h3 className="text-sm font-bold text-ivory">{a.title}</h3>
                    </div>
                    <p className="text-[11px] text-ivory-muted mt-1">
                      {a.courseTitle}
                      {a.lessonTitle ? ` · ${a.lessonTitle}` : ''}
                      {' · '}
                      المحاولة {a.attemptNumber}
                    </p>
                    <p className="text-[11px] text-ivory-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {fmtDate(a.submittedAt)}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-bold text-gold-300 leading-none">
                      {a.score}
                      <span className="text-xs text-ivory-muted"> / {a.totalMarks}</span>
                    </p>
                    <p
                      className={`mt-1 text-[11px] font-bold ${
                        a.isPassed === false ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {a.isPassed === false ? (
                        <>
                          <XCircle className="w-3 h-3 inline ml-0.5" />
                          راسب
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 inline ml-0.5" />
                          ناجح
                        </>
                      )}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={downloadingId === a.attemptId}
                    onClick={() => handleDownload(a)}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    الورقة PDF
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ─── Lessons ──────────────────────────────────────────── */}
      {isLessonsTab && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-card border border-gold-500/20 p-4 flex flex-wrap gap-3 items-center">
            <select
              value={lessonCourseId}
              onChange={(e) => setLessonCourseId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface border border-gold-500/25 text-xs text-ivory focus:border-gold-400 outline-none max-w-[220px]"
              aria-label="اختيار الكورس"
            >
              <option value="ALL">كل الكورسات</option>
              {(profile?.courses ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'ALL', label: 'كل الدروس' },
                { key: 'TAKEN', label: 'شاهدها' },
                { key: 'NOT_TAKEN', label: 'لم يشاهدها' },
              ] as const).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setLessonStatus(s.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    lessonStatus === s.key
                      ? 'bg-gold-500/15 border-gold-500/45 text-gold-300'
                      : 'border-gold-500/15 text-ivory-muted hover:border-gold-500/35'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {lessonsQuery.isLoading ? (
            <div className="flex min-h-[25vh] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-500/30 border-t-gold-400" />
            </div>
          ) : !lessonsQuery.data || lessonsQuery.data.courses.length === 0 ? (
            <div className="text-center py-12 text-xs text-ivory-muted rounded-2xl bg-surface-card border border-gold-500/15">
              لا توجد دروس مطابقة.
            </div>
          ) : (
            lessonsQuery.data.courses.map((course) => {
              const filtered = course.lessons.filter((l) =>
                lessonStatus === 'TAKEN'
                  ? l.isTaken
                  : lessonStatus === 'NOT_TAKEN'
                  ? !l.isTaken
                  : true
              );
              if (filtered.length === 0) return null;

              return (
                <div
                  key={course.id}
                  className="rounded-2xl bg-surface-card border border-gold-500/20 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gold-500/[0.06] border-b border-gold-500/15">
                    <h3 className="text-sm font-bold text-gold-300">{course.title}</h3>
                    <span className="text-[11px] text-ivory-muted">
                      شاهد {course.lessonsTaken} من {course.lessonsTotal} درسًا
                    </span>
                  </div>
                  <ul className="divide-y divide-gold-500/10">
                    {filtered.map((l) => (
                      <li key={l.id} className="px-4 py-3 flex items-center gap-3">
                        <span
                          className={`shrink-0 ${
                            l.isTaken ? 'text-emerald-400' : 'text-red-400/80'
                          }`}
                          title={l.isTaken ? 'تم مشاهدته' : 'لم يتم مشاهدته'}
                        >
                          {l.isTaken ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{l.title}</p>
                          <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[240px]">
                            <div
                              className={`h-full rounded-full ${
                                l.isTaken ? 'bg-emerald-400/70' : 'bg-gold-500/50'
                              }`}
                              style={{ width: `${Math.min(100, l.watchedPercentage)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <p className="text-[10px] text-ivory-muted">
                            {l.isTaken ? 'تم المشاهدة' : `${l.watchedPercentage}%`}
                          </p>
                          {l.dueDate && (
                            <p className="text-[10px] text-red-400/80">
                              موعد نهائي: {fmtDate(l.dueDate)}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Weekly Report ─────────────────────────────────────── */}
      {tab === 'report' && selectedChildId && (
        <div className="animate-auth-rise">
          <WeeklyReportView mode="parent" studentId={selectedChildId} />
        </div>
      )}

      <div className="mt-10 text-center text-[10px] text-ivory-muted/60 flex items-center justify-center gap-1.5">
        <FileDown className="w-3.5 h-3.5" />
        يمكنك تحميل ورقة أي امتحان أو كويز كملف PDF من قسم الدرجات والنتائج.
      </div>
    </div>
  );
};
