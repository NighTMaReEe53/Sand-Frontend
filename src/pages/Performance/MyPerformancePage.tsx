import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  BookOpenCheck,
  FileQuestion,
  ClipboardList,
  Activity,
  AlertCircle,
  FileDown,
  Inbox,
  ArrowRight,
  Loader2,
  Flame,
  Rocket,
  Medal,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useStudentPerformanceQuery } from '../../hooks/queries/useAnalytics';
import { analyticsApi } from '../../api/analytics.api';
import { gamificationApi } from '../../api/phase2.api';
import { leaderboardApi } from '../../api/leaderboard.api';
import { formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Skeleton, SkeletonPerformancePage } from '../../components/ui/Skeleton';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { MyCertificatesSection } from '../Certificates/Certificates';
import { useQuery } from '@tanstack/react-query';

const BADGE_ICONS: Record<string, React.ReactNode> = {
  flame: <Flame className="w-5 h-5 text-orange-400" />,
  trophy: <Trophy className="w-5 h-5 text-gold-300" />,
  rocket: <Rocket className="w-5 h-5 text-sky-400" />,
  medal: <Medal className="w-5 h-5 text-gold-400" />,
  target: <Target className="w-5 h-5 text-emerald-400" />,
};

const MEDAL_EMOJI: Record<string, string> = {
  GOLD: '🥇',
  SILVER: '🥈',
  BRONZE: '🥉',
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}> = ({ icon, label, value, sub }) => (
  <div className="p-5 rounded-2xl bg-bg-elevated border border-surface-border space-y-2 transition-all duration-200 hover:border-amber-500/40 hover:-translate-y-0.5">
    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-700 dark:text-gold-400">
      {icon}
    </div>
    <p className="text-2xl font-bold font-display text-amber-900 dark:text-gold-300 tabular-nums">{value}</p>
    <p className="text-xs text-ivory-muted">{label}</p>
    {sub && <p className="text-[10px] text-ivory-muted/70">{sub}</p>}
  </div>
);

export const MyPerformancePage: React.FC = () => {
  const { data, isLoading, isError } = useStudentPerformanceQuery();
  const { data: gamification } = useQuery({
    queryKey: ['gamification'],
    queryFn: () => gamificationApi.getMe(),
  });
  // Phase 3 — exam medals (scoped to student+exam)
  const { data: achievements } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => leaderboardApi.getMyAchievements(),
  });
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setPdfError(null);
    try {
      const blob = await analyticsApi.getPerformancePdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        (blob as Blob & { fileName?: string }).fileName ?? 'تقرير-الأداء.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError('تعذر تحميل تقرير الـ PDF، حاول مرة أخرى.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return <SkeletonPerformancePage />;
  }

  if (isError || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-xl font-bold font-display text-amber-900 dark:text-gold-300">تعذر تحميل تحليل الأداء</h1>
        <Link to="/my-courses" className="text-amber-700 dark:text-gold-400 hover:text-amber-800 dark:hover:text-gold-300 text-sm hover:underline font-semibold">
          العودة إلى كورساتي
        </Link>
      </div>
    );
  }

  const { overview, weakTopics, strongTopics, recentActivity } = data;

  const lessonCompletionPct =
    overview.totalLessonsInEnrolledCourses > 0
      ? Math.round(
          (overview.lessonsCompleted / overview.totalLessonsInEnrolledCourses) * 100
        )
      : 0;

  const topicChartData = [...weakTopics]
    .reverse()
    .concat([...strongTopics].reverse())
    .filter((t, i, arr) => arr.findIndex((x) => x.lessonId === t.lessonId) === i)
    .slice(0, 8)
    .map((t) => ({
      name: t.lessonTitle.length > 18 ? t.lessonTitle.slice(0, 18) + '…' : t.lessonTitle,
      accuracy: t.accuracy,
    }));

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right">
      {/* ─── Decorative background vectors ───────────────────────────── */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-10 h-96 w-full text-gold-500 opacity-[0.045]"
        viewBox="0 0 1440 384"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <pattern
            id="perf-hatch"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1440" height="384" fill="url(#perf-hatch)" />
        <circle cx="1330" cy="20" r="185" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="1330" cy="20" r="120" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        <circle cx="70" cy="360" r="145" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
        <SectionHeading
          as="h1"
          accent="wave"
          badge={<Badge variant="gold">تحليل الأداء</Badge>}
          subtitle="متابعة شاملة لنتائجك في الامتحانات والكويزات ونقاط قوتك وضعفك."
        >
          أدائي وتطور مستواي
        </SectionHeading>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-gold-300 border border-amber-600/30 dark:border-gold-500/40 hover:border-amber-600 hover:bg-amber-500/10 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {isDownloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          تحميل تقرير PDF
        </button>
      </div>
      {pdfError && (
        <p className="text-xs text-red-400 -mt-4 mb-2 text-right">{pdfError}</p>
      )}

      {/* Empty state — no activity yet */}
      {overview.examsCompleted === 0 &&
        overview.quizzesCompleted === 0 &&
        overview.lessonsCompleted === 0 && (
        <section className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4">
          <Inbox className="w-10 h-10 mx-auto text-gold-500/40" />
          <p className="text-sm font-bold text-ivory">لا توجد بيانات أداء بعد</p>
          <p className="text-xs text-ivory-muted">ابدأ أول درس لك لتبدأ متابعة تقدمك هنا.</p>
          <Link to="/my-courses" className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm">
            <ArrowRight className="w-4 h-4" />
            الذهاب إلى كورساتي
          </Link>
        </section>
      )}

      {/* Gamification: streaks & badges */}
      {gamification && (
        <section className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-surface-card border border-amber-500/30 space-y-2">
            <p className="text-xs text-amber-700 dark:text-gold-400 flex items-center gap-1.5 font-bold">
              <Activity className="w-4 h-4" />
              سلسلة النشاط اليومي
            </p>
            <p className="text-3xl font-bold font-display text-amber-900 dark:text-gold-300">
              {gamification.streak.currentStreak}
              <span className="text-xs text-ivory-muted mr-2 font-normal">أيام متتالية</span>
            </p>
            <p className="text-[10px] text-ivory-muted/70">
              أطول سلسلة: {gamification.streak.longestStreak} يوم
            </p>
          </div>

          <div className="md:col-span-2 p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-700 dark:text-gold-400 flex items-center gap-1.5 font-bold">
                <Trophy className="w-4 h-4" />
                الأوسمة
              </p>
              <span className="text-[10px] text-ivory-muted">
                {gamification.earnedCount}/{gamification.totalCount}
              </span>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {gamification.badges.map((b) => (
                <li
                  key={b.code}
                  title={b.description}
                  className={`p-2.5 rounded-xl border text-center space-y-1 ${
                    b.earned
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-surface-border opacity-40 grayscale'
                  }`}
                >
                  <span className="flex items-center justify-center h-7">
                    {BADGE_ICONS[b.icon] ?? <Target className="w-5 h-5 text-amber-600 dark:text-gold-400" />}
                  </span>
                  <span className="block text-[9px] text-ivory leading-tight font-medium">{b.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ─── Periodic Performance Report (Weekly / Monthly / All) ─── */}
      <PeriodicReportSection />

      {/* Phase 3 — exam medal achievements */}
      {achievements && (achievements.totals.gold + achievements.totals.silver + achievements.totals.bronze > 0) && (
        <section className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-700 dark:text-gold-400 flex items-center gap-1.5 font-bold">
              <Medal className="w-4 h-4" />
              أوسمة الامتحانات
            </p>
            <span className="text-[10px] text-ivory-muted">
              أفضل 10: {achievements.totals.topTenCount}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-sm font-bold">
            <span className="text-amber-800 dark:text-gold-300">🥇 ذهبي × {achievements.totals.gold}</span>
            <span className="text-slate-800 dark:text-slate-300">🥈 فضي × {achievements.totals.silver}</span>
            <span className="text-orange-800 dark:text-amber-500">🥉 برونزي × {achievements.totals.bronze}</span>
          </div>
          <ul className="space-y-1.5">
            {achievements.achievements.slice(0, 5).map((a) => (
              <li key={a.examId} className="flex items-center justify-between gap-2 text-[11px]">
                <Link
                  to={`/exams/${a.examId}/leaderboard`}
                  className="text-ivory hover:text-amber-700 dark:hover:text-gold-300 transition-colors truncate"
                >
                  {MEDAL_EMOJI[a.medal ?? ''] ?? '🏅'} {a.examTitle}
                  <span className="text-ivory-muted mr-1.5">— المركز #{a.rank} ({a.percentage}%)</span>
                </Link>
                <span className="text-ivory-muted shrink-0">{a.courseTitle}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileQuestion className="w-5 h-5" />}
          label="متوسط درجات الامتحانات"
          value={overview.avgExamScore !== null ? `${overview.avgExamScore}%` : '—'}
          sub={`${overview.examsCompleted} امتحان مكتمل • ${overview.examsPassed} ناجح`}
        />
        <StatCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="متوسط درجات الكويزات"
          value={overview.avgQuizScore !== null ? `${overview.avgQuizScore}%` : '—'}
          sub={`${overview.quizzesCompleted} كويز مكتمل • ${overview.quizzesPassed} ناجح`}
        />
        <StatCard
          icon={<BookOpenCheck className="w-5 h-5" />}
          label="إنجاز الدروس"
          value={`${lessonCompletionPct}%`}
          sub={`${overview.lessonsCompleted} من ${overview.totalLessonsInEnrolledCourses} درس`}
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="أعلى نتيجة امتحان"
          value={overview.bestExamScore !== null ? `${overview.bestExamScore}%` : '—'}
          sub={
            overview.worstExamScore !== null ? `أدنى نتيجة: ${overview.worstExamScore}%` : undefined
          }
        />
      </div>

      {/* Topic accuracy chart */}
      {topicChartData.length > 0 && (
        <section className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
          <h2 className="text-base font-bold text-ivory flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600 dark:text-gold-400" />
            دقّة الإجابة حسب الدرس
          </h2>
          <div dir="ltr" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-zinc-700/60" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  stroke="currentColor"
                  className="text-slate-600 dark:text-zinc-400"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  stroke="currentColor"
                  className="text-slate-600 dark:text-zinc-400"
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface, #1e293b)',
                    borderColor: 'var(--line, #334155)',
                    borderRadius: 12,
                    color: 'var(--ink, #f8fafc)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  }}
                  itemStyle={{ color: 'var(--ink, #f8fafc)' }}
                  labelStyle={{ color: 'var(--ink, #f8fafc)', fontWeight: 'bold' }}
                  formatter={(v) => [`${v}%`, 'الدقة']}
                />
                <Bar dataKey="accuracy" fill="#d97706" className="dark:fill-[#f59e0b]" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Weak & strong topics */}
      <div className="grid md:grid-cols-2 gap-4">
        <section className="p-5 rounded-2xl bg-surface-card border border-red-500/20 space-y-3">
          <h2 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            مواضيع تحتاج مراجعة
          </h2>
          {weakTopics.length === 0 ? (
            <p className="text-xs text-ivory-muted">لا توجد بيانات كافية بعد — حل المزيد من الامتحانات.</p>
          ) : (
            <ul className="space-y-2">
              {weakTopics.map((t) => (
                <li key={t.lessonId} className="flex items-center justify-between text-xs">
                  <span className="text-ivory truncate">{t.lessonTitle}</span>
                  <Badge variant="danger">{t.accuracy}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="p-5 rounded-2xl bg-surface-card border border-emerald-500/20 space-y-3">
          <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            نقاط قوتك
          </h2>
          {strongTopics.length === 0 ? (
            <p className="text-xs text-ivory-muted">لا توجد بيانات كافية بعد.</p>
          ) : (
            <ul className="space-y-2">
              {strongTopics.map((t) => (
                <li key={t.lessonId} className="flex items-center justify-between text-xs">
                  <span className="text-ivory truncate">{t.lessonTitle}</span>
                  <Badge variant="success">{t.accuracy}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Certificates */}
      <MyCertificatesSection />

      {/* Recent activity */}
      <section className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <h2 className="text-base font-bold text-ivory flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold-400" />
          النشاط الأخير
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-ivory-muted">لم تكمل أي امتحان أو كويز بعد.</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {recentActivity.map((a, i) => (
              <li key={i} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {a.type === 'EXAM' ? (
                    <FileQuestion className="w-4 h-4 text-gold-400 shrink-0" />
                  ) : (
                    <ClipboardList className="w-4 h-4 text-gold-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-ivory truncate">{a.title}</p>
                    <p className="text-[10px] text-ivory-muted/70">
                      {a.type === 'EXAM' ? 'امتحان' : 'كويز'} •{' '}
                      {a.date ? formatDate(a.date) : ''}
                    </p>
                  </div>
                </div>
                <Badge variant={a.isPassed === false ? 'danger' : a.isPassed ? 'success' : 'neutral'}>
                  {a.score}%
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/* ─── Periodic Performance Report Component ───────────────────────────── */
const PeriodicReportSection: React.FC = () => {
  const [period, setPeriod] = React.useState<'week' | 'month' | 'all'>('week');
  const { data: report, isLoading } = useQuery({
    queryKey: ['student-periodic-report', period],
    queryFn: () => analyticsApi.getPeriodicReport(period),
  });

  return (
    <section className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ivory flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600 dark:text-gold-400" />
            تقرير الأداء الدوري الشامل
          </h2>
          <p className="text-xs text-ivory-muted mt-1">
            متابعة دقيقة للحصص المشاهدة، درجات الكويزات، الامتحانات، والواجبات ونسبة التزامك
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-surface-border">
          {[
            { id: 'week', label: 'هذا الأسبوع' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'all', label: 'تراكمي عام' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriod(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-ivory-muted hover:text-ivory'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !report ? (
        <div className="text-center py-6 text-xs text-ivory-muted">لا تتوفر بيانات أداء لهذه الفترة.</div>
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-surface-border text-center space-y-1">
              <p className="text-xs text-ivory-muted">مستوى الأداء العام</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-gold-300 font-mono">
                {report.summary.overallScore === null ? '—' : `${report.summary.overallScore}%`}
              </p>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                {report.summary.overallScore === null
                  ? 'بانتظار بيانات كافية'
                  : report.summary.overallScore >= 80 ? 'ممتاز 🌟' : report.summary.overallScore >= 50 ? 'جيد جداً 👍' : 'يحتاج لمزيد من الاهتمام ⚠️'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border text-center space-y-1">
              <p className="text-xs text-ivory-muted">إنجاز الدروس</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">{report.summary.attendanceRate}%</p>
              <span className="text-[10px] text-ivory-muted">
                {report.summary.attendedLessonsCount} من {report.summary.totalAssignedLessons} درس
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border text-center space-y-1">
              <p className="text-xs text-ivory-muted">متوسط الكويزات</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
                {report.summary.quizAverage !== null ? `${report.summary.quizAverage}%` : '—'}
              </p>
              <span className="text-[10px] text-ivory-muted">
                {report.summary.passedQuizzesCount} كويز مجتاز بنجاح
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border text-center space-y-1">
              <p className="text-xs text-ivory-muted">إنجاز الواجبات</p>
              <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 font-mono">
                {report.summary.homeworkAverage ?? report.summary.homeworkCompletionRate}%
              </p>
              <span className="text-[10px] text-ivory-muted">
                {report.summary.homeworkAverage !== null
                  ? `متوسط الدرجات • ${report.summary.submittedHomeworksCount} واجب تم تسليمه`
                  : `${report.summary.submittedHomeworksCount} واجب تم تسليمه`}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
            <p className="text-xs font-bold text-amber-800 dark:text-gold-300">نصيحة مبنية على أدائك</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-6 text-ivory-muted">
              {report.summary.insights.map((insight) => <li key={insight}>• {insight}</li>)}
            </ul>
          </div>

          {/* Quizzes & Exams in this period */}
          {(report.quizzes.length > 0 || report.exams.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-800 dark:text-gold-300">الاختبارات والكويزات المنجزة</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {report.quizzes.map((q) => (
                  <div key={`${q.quizId}-${q.submittedAt}`} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surface-border">
                    <div>
                      <span className="text-xs font-bold text-ivory block">{q.quizTitle}</span>
                      <span className="text-[10px] text-ivory-muted">{formatDate(q.submittedAt)} • محاولة {q.attemptNumber}</span>
                    </div>
                    <Badge variant={q.isPassed ? 'success' : 'danger'}>{q.score}%</Badge>
                  </div>
                ))}
                {report.exams.map((ex) => (
                  <div key={`${ex.examId}-${ex.submittedAt}`} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surface-border">
                    <div>
                      <span className="text-xs font-bold text-ivory block">امتحان: {ex.examTitle}</span>
                      <span className="text-[10px] text-ivory-muted">{formatDate(ex.submittedAt)} • محاولة {ex.attemptNumber}</span>
                    </div>
                    <Badge variant={ex.isPassed ? 'success' : 'danger'}>{ex.score}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
