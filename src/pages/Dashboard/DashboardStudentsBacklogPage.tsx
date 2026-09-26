import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  AlertTriangle,
  BookOpen,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  FileSpreadsheet,
  Share2,
  Flame,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  MonitorPlay,
  Award,
} from 'lucide-react';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { teacherStudentsApi, TeacherCourseStudentRow } from '../../api/phase2-teacher.api';
import { quizzesApi } from '../../api/quizzes.api';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

type BacklogFilter = 'ALL' | 'LESSONS' | 'QUIZZES' | 'INACTIVE';

export const DashboardStudentsBacklogPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: coursesData, isLoading: isLoadingCourses } = useCoursesQuery({ limit: 50, mine: true });

  const courses = useMemo(() => {
    const d = coursesData as any;
    return Array.isArray(d?.data) ? d.data : Array.isArray(d?.courses) ? d.courses : Array.isArray(d) ? d : [];
  }, [coursesData]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<BacklogFilter>('ALL');

  // Set default selected course once loaded
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Fetch students for the selected course
  const { data: studentsData, isLoading: isLoadingStudents, refetch } = useQuery({
    queryKey: ['dashboard-course-students-backlog', selectedCourseId],
    queryFn: () => teacherStudentsApi.getCourseStudents(selectedCourseId),
    enabled: !!selectedCourseId,
  });

  // Selected student for detail inspection modal
  const [inspectStudentId, setInspectStudentId] = useState<string | null>(null);
  const { data: studentDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['dashboard-student-backlog-detail', selectedCourseId, inspectStudentId],
    queryFn: () => teacherStudentsApi.getStudentDetail(selectedCourseId, inspectStudentId!),
    enabled: !!selectedCourseId && !!inspectStudentId,
  });

  // Identify backlogged students
  const { backloggedStudents, stats } = useMemo(() => {
    const list: TeacherCourseStudentRow[] = studentsData?.students ?? [];

    const now = Date.now();
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

    let lessonDelaysCount = 0;
    let quizDelaysCount = 0;
    let inactiveCount = 0;

    const enriched = list.map((s) => {
      const hasLessonDelay = s.completionPercentage < 80;
      const hasQuizDelay = s.latestQuizScore == null || s.latestQuizScore < 50;
      const lastAct = s.lastActivityAt ? new Date(s.lastActivityAt).getTime() : 0;
      const isInactive = !lastAct || now - lastAct > twoWeeksMs;

      if (hasLessonDelay) lessonDelaysCount++;
      if (hasQuizDelay) quizDelaysCount++;
      if (isInactive) inactiveCount++;

      return {
        ...s,
        hasLessonDelay,
        hasQuizDelay,
        isInactive,
        hasAnyDelay: hasLessonDelay || hasQuizDelay || isInactive,
      };
    });

    // Filter to only students with actual delays, or matching search/category
    let filtered = enriched.filter((s) => s.hasAnyDelay);

    if (filterType === 'LESSONS') {
      filtered = filtered.filter((s) => s.hasLessonDelay);
    } else if (filterType === 'QUIZZES') {
      filtered = filtered.filter((s) => s.hasQuizDelay);
    } else if (filterType === 'INACTIVE') {
      filtered = filtered.filter((s) => s.isInactive);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((s) => s.fullName.toLowerCase().includes(q));
    }

    return {
      backloggedStudents: filtered,
      stats: {
        totalDelayed: enriched.filter((s) => s.hasAnyDelay).length,
        totalEnrolled: list.length,
        lessonDelays: lessonDelaysCount,
        quizDelays: quizDelaysCount,
        inactive: inactiveCount,
      },
    };
  }, [studentsData, filterType, search]);

  const activeCourse = courses.find((c: any) => c.id === selectedCourseId);

  // Send WhatsApp reminder helper
  const sendWhatsAppReminder = (student: any) => {
    const courseTitle = activeCourse?.title || 'الكورس';
    const message = `السلام عليكم ورحمة الله، نود تذكيركم بمتابعة أداء الطالب/ـة (${student.fullName}) في كورس (${courseTitle}). لوحظ وجود بعض المحاضرات أو التقييمات المعلقة. نسعد بمتابعتكم وتواصلكم معنا لتحقيق أعلى درجات التفوق! 🌟 منصة سند التعليمية.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border/70 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              متابعة متأخرات الطلاب
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-surface-card px-2.5 py-0.5 text-[10px] font-bold text-ink-muted">
              تحديث فوري
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink font-din">
            متأخرات الطلاب <span className="font-amira text-gold-400">والمهام المعلقة</span>
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted max-w-2xl leading-relaxed">
            رصد دقيق وشامل لجميع الطلاب المتأخرين في حضور الحصص، تسليم الواجبات، أو أداء الامتحانات والكويزات عبر كورساتك مع إمكانية التنبيه السريع واستخراج تقرير فوري لولي الأمر.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-3.5 py-2 text-xs font-bold text-ink-muted hover:text-ink hover:border-gold-500/30 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث البيانات</span>
          </button>
          <Link
            to="/dashboard/students/reports"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-bold text-bg shadow-sm hover:brightness-110 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>التقارير الفورية</span>
          </Link>
        </div>
      </div>

      {/* ─── Metric Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: 'إجمالي الطلاب المتأخرين',
            value: stats.totalDelayed,
            sub: `من أصل ${stats.totalEnrolled} طالب مسجل`,
            icon: Users,
            color: 'text-amber-400',
            borderHover: 'hover:border-amber-500/40',
            bgIcon: 'bg-amber-500/10 border-amber-500/20',
          },
          {
            title: 'تأخير في مشاهدة الدروس',
            value: stats.lessonDelays,
            sub: 'إنجاز الدروس أقل من 80%',
            icon: MonitorPlay,
            color: 'text-rose-400',
            borderHover: 'hover:border-rose-500/40',
            bgIcon: 'bg-rose-500/10 border-rose-500/20',
          },
          {
            title: 'كويزات لم تؤدَّ أو رسب فيها',
            value: stats.quizDelays,
            sub: 'يحتاج تنشيط محاولة أو إعادة',
            icon: Award,
            color: 'text-violet-400',
            borderHover: 'hover:border-violet-500/40',
            bgIcon: 'bg-violet-500/10 border-violet-500/20',
          },
          {
            title: 'خامل أكثر من أسبوعين',
            value: stats.inactive,
            sub: 'انقطاع تام عن المنصة',
            icon: Flame,
            color: 'text-cyan-400',
            borderHover: 'hover:border-cyan-500/40',
            bgIcon: 'bg-cyan-500/10 border-cyan-500/20',
          },
        ].map((card) => (
          <div
            key={card.title}
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
            <p className="text-xs font-bold text-ink leading-tight">{card.title}</p>
            <p className="text-[11px] text-ink-muted mt-0.5 truncate">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Filters & Course Selector ─── */}
      <div className="space-y-3.5 rounded-2xl border border-surface-border bg-surface-card p-4 shadow-card">
        {/* Row 1: Course select pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-gold-400 pl-1">
              <BookOpen className="w-3.5 h-3.5" />
              الكورس:
            </span>
            {isLoadingCourses ? (
              <Skeleton className="h-8 w-44 rounded-full" />
            ) : courses.length === 0 ? (
              <span className="text-xs text-ink-muted">لا توجد كورسات بعد.</span>
            ) : (
              courses.map((c: any) => {
                const active = selectedCourseId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCourseId(c.id)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40 shadow-sm font-black'
                        : 'border border-surface-border bg-surface-alt/70 text-ink-muted hover:border-gold-500/30 hover:text-ink'
                    }`}
                  >
                    <span>{c.title}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الطالب…"
              className="w-full rounded-xl border border-surface-border bg-surface-alt pr-9 pl-4 py-1.5 text-xs text-ink placeholder:text-ink-muted/60 focus:border-gold-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Row 2: Delay Type Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-3">
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-ink-muted pl-1">
            نوع التأخير:
          </span>
          {[
            { id: 'ALL', label: 'كل المتأخرين', count: stats.totalDelayed },
            { id: 'LESSONS', label: 'متأخر في الدروس', count: stats.lessonDelays },
            { id: 'QUIZZES', label: 'متأخر في الكويزات', count: stats.quizDelays },
            { id: 'INACTIVE', label: 'خامل ومُنقطع', count: stats.inactive },
          ].map((tab) => {
            const active = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as BacklogFilter)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40 shadow-sm'
                    : 'border border-surface-border bg-surface-alt/70 text-ink-muted hover:border-gold-500/30 hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-black ${
                    active ? 'bg-gold-400/20 text-gold-400' : 'bg-surface-card text-ink-muted'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Students List ─── */}
      {isLoadingStudents ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : backloggedStudents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-surface-border bg-surface-card/60 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-ink">رائع جداً! لا توجد أي متأخرات مطابقة</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
            جميع طلاب هذا الكورس ملتزمون بجدول المشاهدة وتسليمات الكويزات أو لا توجد نتائج تطابق معايير الفلترة الحالية.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {backloggedStudents.map((student, idx) => (
            <div
              key={student.studentId}
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-surface-border bg-surface-card hover:border-gold-500/40 hover:shadow-card transition-all"
            >
              {/* Student info column */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <span className="text-xs font-bold text-ink-muted tabular-nums w-5 shrink-0">
                  {idx + 1}
                </span>
                {/* Avatar: photo or gold initials */}
                <div className="relative h-11 w-11 shrink-0">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.fullName}
                      className="h-11 w-11 rounded-2xl object-cover border border-gold-500/30 ring-1 ring-gold-500/15"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-500/30 bg-gold-500/10 text-gold-400 font-bold text-sm">
                      {student.fullName?.[0] || '?'}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-ink leading-snug">
                      {student.fullName}
                    </h3>
                    {student.isInactive && (
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/25">
                        <Flame className="w-3 h-3" />
                        منقطع أكثر من 14 يوم
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink-muted flex items-center gap-2 flex-wrap">
                    <span>
                      آخر درس: <strong className="text-ink font-semibold">{student.lastLessonTitle || 'لم يشاهد'}</strong>
                    </span>
                    {student.lastActivityAt && (
                      <span>· آخر نشاط: {formatDate(student.lastActivityAt)}</span>
                    )}
                  </p>

                  {/* Delay Tags Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {student.hasLessonDelay && (
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25">
                        <MonitorPlay className="w-3 h-3" />
                        متبقي دروس ({student.completedLessons} منجز فقط)
                      </span>
                    )}
                    {student.hasQuizDelay && (
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/25">
                        <Award className="w-3 h-3" />
                        {student.latestQuizScore == null ? 'كويز معلق لم يُحل' : `درجة كويز ضعيفة (${student.latestQuizScore}%)`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress & Quick Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-surface-border">
                {/* Completion gauge */}
                <div className="text-left min-w-[90px]">
                  <p className="text-[10px] text-ink-muted">نسبة الإنجاز</p>
                  <p className="text-sm font-black tabular-nums text-gold-400 font-din">
                    {student.completionPercentage}%
                  </p>
                </div>

                {/* Direct Action 1: Instant Report for Parent */}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/dashboard/students/reports?courseId=${selectedCourseId}&studentId=${student.studentId}`
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-surface-border bg-surface-alt px-3 py-1.5 text-xs font-bold text-ink hover:border-gold-500/40 hover:text-gold-400 transition-all cursor-pointer"
                  title="استخراج تقرير ولي الأمر الفوري"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-gold-400" />
                  <span>تقرير فوري</span>
                </button>

                {/* Direct Action 2: Send WhatsApp Reminder */}
                <button
                  type="button"
                  onClick={() => sendWhatsAppReminder(student)}
                  className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                  title="إرسال تنبيه عبر واتساب"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تنبيه واتساب</span>
                </button>

                {/* Direct Action 3: Inspect Details */}
                <button
                  type="button"
                  onClick={() => setInspectStudentId(student.studentId)}
                  className="inline-flex items-center gap-1 rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-bold text-gold-400 hover:bg-gold-500/20 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>التفاصيل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Detail Modal (Lessons & Quiz Breakdown) ─── */}
      <Modal
        isOpen={!!inspectStudentId}
        onClose={() => setInspectStudentId(null)}
        title={studentDetail ? `متابعة متأخرات: ${studentDetail.student.fullName}` : 'تفاصيل الطالب'}
        description={studentDetail?.courseTitle}
        maxWidth="lg"
      >
        {isLoadingDetail || !studentDetail ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pl-1">
            {/* Stat row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-surface-card border border-surface-border text-center">
                <p className="text-base font-black tabular-nums text-ink font-din">
                  {studentDetail.totalLessons}
                </p>
                <p className="text-[10px] text-ink-muted">إجمالي الدروس</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-card border border-emerald-500/25 text-center">
                <p className="text-base font-black tabular-nums text-emerald-400 font-din">
                  {studentDetail.completedLessons}
                </p>
                <p className="text-[10px] text-ink-muted">مكتملة</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-card border border-rose-500/25 text-center">
                <p className="text-base font-black tabular-nums text-rose-400 font-din">
                  {studentDetail.totalLessons - studentDetail.completedLessons}
                </p>
                <p className="text-[10px] text-ink-muted">لم تُكتمل بعد</p>
              </div>
            </div>

            {/* Uncompleted Lessons list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gold-400 flex items-center gap-1.5">
                <MonitorPlay className="w-4 h-4" />
                قائمة الدروس المتأخرة وغير المكتملة
              </h4>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {studentDetail.lessons
                  .filter((l) => !l.isCompleted)
                  .map((l) => (
                    <div
                      key={l.lessonId}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-surface-border bg-surface-alt/70 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="truncate text-ink font-semibold">
                          الدرس {l.orderIndex}: {l.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-amber-400 shrink-0">
                        مشاهدة {Math.round(l.watchedPercentage)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quizzes list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gold-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                سجل الكويزات وتنشيط المحاولات
              </h4>
              {studentDetail.quizScores.length === 0 ? (
                <p className="text-xs text-ink-muted">لم يؤدّ أي كويز بعد في هذا الكورس.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {studentDetail.quizScores.map((q) => (
                    <div
                      key={`${q.quizId}-${q.attemptNumber}`}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-surface-border bg-surface-alt/70 text-xs"
                    >
                      <span className="text-ink font-semibold truncate">
                        {q.quizTitle} <span className="text-ink-muted text-[11px]">(محاولة {q.attemptNumber})</span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums border ${
                            q.isPassed
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                              : 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                          }`}
                        >
                          {q.percentage != null ? `${q.percentage}%` : '—'}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await quizzesApi.reactivateStudentQuiz(q.quizId, studentDetail.student.id);
                              toast.success('تم تنشيط محاولة الكويز للطالب بنجاح!');
                            } catch (err: any) {
                              toast.error(err?.response?.data?.message ?? 'تعذر تنشيط المحاولة.');
                            }
                          }}
                          className="px-2 py-0.5 rounded-lg border border-gold-500/30 text-[10px] font-bold text-gold-400 hover:bg-gold-500/10 transition-colors cursor-pointer"
                        >
                          إعادة فتح
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions inside Modal */}
            <div className="flex items-center justify-between gap-2 border-t border-surface-border pt-4">
              <button
                type="button"
                onClick={() => setInspectStudentId(null)}
                className="px-4 py-2 rounded-xl border border-surface-border text-xs font-bold text-ink-muted hover:text-ink cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspectStudentId(null);
                  navigate(
                    `/dashboard/students/reports?courseId=${selectedCourseId}&studentId=${studentDetail.student.id}`
                  );
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-gradient text-xs font-bold text-bg hover:brightness-110 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>فتح تقرير ولي الأمر الشامل</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardStudentsBacklogPage;
