import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  UserX,
  CheckCircle2,
  Circle,
  Award,
  UserMinus,
  UserCheck,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  BarChart3,
  Calendar,
  BookOpen,
  FileText,
  Clock,
  Search,
  AlertTriangle,
  Flame,
  Phone,
  Mail,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  X,
  FileQuestion,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { coursesApi } from '../../api/courses.api';
import { quizzesApi } from '../../api/quizzes.api';
import { examsApi } from '../../api/exams.api';
import { analyticsApi, PeriodicReportData } from '../../api/analytics.api';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { resolveMediaUrl } from '../../lib/utils';

type FilterTab = 'all' | 'active' | 'suspended' | 'not_started' | 'overdue' | 'highest_completion';

const FILTER_TABS: { value: FilterTab; label: string; icon?: React.ElementType }[] = [
  { value: 'all', label: 'جميع الطلاب' },
  { value: 'active', label: 'النشطون' },
  { value: 'suspended', label: 'المعلقون' },
  { value: 'overdue', label: 'عليهم متأخرات' },
  { value: 'not_started', label: 'لم يبدأوا بعد' },
  { value: 'highest_completion', label: 'الأعلى إكمالاً' },
];

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatGradeLevelArabic = (grade: string | null | undefined): string => {
  if (!grade) return 'غير محدد';
  const g = grade.trim().toUpperCase();
  if (g.includes('10') || g.includes('FIRST_SEC') || g.includes('1ST_SEC') || g.includes('أول ثانوي') || g.includes('الأول الثانوي')) {
    return 'الصف الأول الثانوي';
  }
  if (g.includes('11') || g.includes('SECOND_SEC') || g.includes('2ND_SEC') || g.includes('ثاني ثانوي') || g.includes('الثاني الثانوي')) {
    return 'الصف الثاني الثانوي';
  }
  if (g.includes('12') || g.includes('THIRD_SEC') || g.includes('3RD_SEC') || g.includes('ثالث ثانوي') || g.includes('الثالث الثانوي')) {
    return 'الصف الثالث الثانوي';
  }
  if (g.includes('7') || g.includes('FIRST_PREP') || g.includes('1ST_PREP') || g.includes('أول إعدادي') || g.includes('الأول الإعدادي')) {
    return 'الصف الأول الإعدادي';
  }
  if (g.includes('8') || g.includes('SECOND_PREP') || g.includes('2ND_PREP') || g.includes('ثاني إعدادي') || g.includes('الثاني الإعدادي')) {
    return 'الصف الثاني الإعدادي';
  }
  if (g.includes('9') || g.includes('THIRD_PREP') || g.includes('3RD_PREP') || g.includes('ثالث إعدادي') || g.includes('الثالث الإعدادي')) {
    return 'الصف الثالث الإعدادي';
  }
  return grade;
};

export const CourseStudentsPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportStudent, setReportStudent] = useState<{ id: string; fullName: string } | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch all course students with rich progress, stats, and status
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-course-students-rich', courseId],
    queryFn: () => coursesApi.getCourseStudents(courseId!, { limit: 100 }),
    enabled: !!courseId,
  });

  const students = data?.students ?? [];

  // Toggle student status: ACTIVE <-> SUSPENDED
  const toggleStatus = async (studentId: string, currentStatus: string, fullName: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'تنشيط وتفعيل' : 'تعليق وصول';
    if (!window.confirm(`هل أنت متأكد من ${actionLabel} الطالب "${fullName}"؟`)) return;

    setActionLoadingId(studentId);
    try {
      await coursesApi.updateCourseStudentStatus(courseId!, studentId, newStatus);
      toast.success(`تم ${actionLabel} الطالب "${fullName}" بنجاح.`);
      queryClient.invalidateQueries({ queryKey: ['teacher-course-students-rich', courseId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر تغيير حالة الطالب.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove / un-enroll student
  const removeStudent = async (studentId: string, fullName: string) => {
    if (!window.confirm(`تحذير: هل أنت متأكد من إزالة الطالب "${fullName}" من الكورس نهائياً؟`)) return;
    setActionLoadingId(studentId);
    try {
      await coursesApi.removeCourseStudent(courseId!, studentId);
      toast.success(`تمت إزالة الطالب "${fullName}" من الكورس.`);
      queryClient.invalidateQueries({ queryKey: ['teacher-course-students-rich', courseId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر إزالة الطالب.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Periodic report query for selected student
  const { data: reportData, isLoading: isReportLoading } = useQuery({
    queryKey: ['teacher-student-periodic-report', reportStudent?.id, reportPeriod, courseId],
    queryFn: () =>
      analyticsApi.getTeacherStudentPeriodicReport(reportStudent!.id, reportPeriod, courseId),
    enabled: !!reportStudent?.id,
  });

  // Client filtering & search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search matching (Name, Phone, Email, Guardian Phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.fullName?.toLowerCase().includes(q);
        const matchesPhone = s.phone?.includes(q) || s.guardianPhone?.includes(q);
        const matchesEmail = s.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }

      // Tab filtering
      if (filterTab === 'active') return s.status === 'ACTIVE';
      if (filterTab === 'suspended') return s.status === 'SUSPENDED';
      if (filterTab === 'not_started') return s.stats.watchedLessons === 0;
      if (filterTab === 'overdue') {
        const hasUnattended = s.stats.watchedLessons < s.stats.totalLessons;
        const hasUnpassedQuizzes = s.stats.passedQuizzes < s.stats.totalQuizzes;
        const hasUnsubmittedHw = s.stats.submittedHomeworks < s.stats.totalHomeworks;
        return hasUnattended || hasUnpassedQuizzes || hasUnsubmittedHw;
      }
      return true;
    }).sort((a, b) => {
      if (filterTab === 'highest_completion') {
        return b.stats.watchedPercentage - a.stats.watchedPercentage;
      }
      return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });
  }, [students, searchQuery, filterTab]);

  // Overall counts
  const totalStudentsCount = students.length;
  const activeStudentsCount = students.filter((s) => s.status === 'ACTIVE').length;
  const suspendedStudentsCount = students.filter((s) => s.status === 'SUSPENDED').length;
  const overdueStudentsCount = students.filter(
    (s) =>
      s.stats.watchedLessons < s.stats.totalLessons ||
      s.stats.submittedHomeworks < s.stats.totalHomeworks ||
      s.stats.passedQuizzes < s.stats.totalQuizzes,
  ).length;

  if (!courseId) return null;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard/courses"
            className="inline-flex items-center gap-1.5 text-xs text-ivory-muted hover:text-gold-400 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة لقائمة الكورسات
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black font-amiri text-gold-300">
            إدارة طلاب الكورس والتقارير الدورية
          </h1>
          <p className="text-xs sm:text-sm text-ivory-muted mt-1">
            متابعة دقيقة لمشاهدات الطلاب، الواجبات المسلمة، الكويزات، تفعيل/تعليق الحسابات، واستخراج التقارير الشاملة.
          </p>
        </div>
      </div>

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ivory-muted">إجمالي المشتركين</p>
              <p className="text-xl font-bold text-ivory">{totalStudentsCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ivory-muted">الحسابات النشطة</p>
              <p className="text-xl font-bold text-emerald-400">{activeStudentsCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ivory-muted">عليهم متأخرات</p>
              <p className="text-xl font-bold text-amber-400">{overdueStudentsCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ivory-muted">الحسابات المعلقة</p>
              <p className="text-xl font-bold text-red-400">{suspendedStudentsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-ivory-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن طالب بالاسم، رقم الهاتف، ولي الأمر، أو البريد الإلكتروني..."
            className="w-full pr-11 pl-4 py-3 bg-surface-card border border-surface-border rounded-2xl text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none focus:border-gold-400 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory-muted hover:text-ivory"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-surface-border pb-3 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterTab(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterTab === tab.value
                  ? 'bg-gold-gradient text-white font-black shadow-gold-glow'
                  : 'bg-surface-card border border-surface-border text-ivory/80 hover:text-white hover:border-gold-500/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-surface-card border border-surface-border text-ivory-muted text-sm space-y-2">
          <UserX className="w-10 h-10 mx-auto text-gold-400/60" />
          <p className="font-bold text-ivory">لا يوجد طلاب يطابقون خيارات البحث أو التصفية الحالية.</p>
          <p className="text-xs text-ivory-muted">جرب تغيير كلمة البحث أو اختيار تبويب تصفية آخر.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-surface-border bg-surface-card overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-surface-border bg-surface/80 text-[11px] font-black text-ivory-muted uppercase tracking-wider">
                  <th className="px-4 py-3.5">الطالب</th>
                  <th className="px-4 py-3.5">الحالة</th>
                  <th className="px-4 py-3.5 text-center">مشاهدة الدروس</th>
                  <th className="px-4 py-3.5 text-center">الكويزات</th>
                  <th className="px-4 py-3.5 text-center">الواجبات</th>
                  <th className="px-4 py-3.5 text-center">الامتحانات</th>
                  <th className="px-4 py-3.5 text-left">الإجراءات والتقارير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/40 text-xs">
                {filteredStudents.map((s) => {
                  const isSuspended = s.status === 'SUSPENDED';
                  const isBusy = actionLoadingId === s.studentId;

                  return (
                    <tr key={s.studentId} className="hover:bg-surface/50 transition-colors">
                      {/* Student Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {s.photoUrl ? (
                            <img
                              src={resolveMediaUrl(s.photoUrl)}
                              alt={s.fullName}
                              className="w-10 h-10 rounded-xl border border-surface-border object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-300 flex items-center justify-center text-sm font-bold shrink-0">
                              {s.fullName?.charAt(0) || 'ط'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-ivory font-bold block">{s.fullName}</span>
                              {s.gradeLevel && (
                                <span className="text-[10px] font-bold text-gold-300 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
                                  {formatGradeLevelArabic(s.gradeLevel)}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-ivory-muted flex items-center gap-2 mt-0.5">
                              {s.phone && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gold-400" />
                                  {s.phone}
                                </span>
                              )}
                              {s.guardianPhone && (
                                <span className="inline-flex items-center gap-1 text-gold-300/80">
                                  ولي الأمر: {s.guardianPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            isSuspended
                              ? 'bg-red-500/15 border-red-500/30 text-red-300'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {isSuspended ? (
                            <>
                              <PauseCircle className="w-3 h-3" />
                              معلق
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              نشط
                            </>
                          )}
                        </span>
                      </td>

                      {/* Lessons Progress */}
                      <td className="px-4 py-3.5 text-center min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold text-ivory-muted">
                            <span>{s.stats.watchedLessons} / {s.stats.totalLessons}</span>
                            <span className="text-gold-300">{s.stats.watchedPercentage}%</span>
                          </div>
                          <ProgressBar value={s.stats.watchedPercentage} />
                        </div>
                      </td>

                      {/* Quizzes */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="space-y-0.5">
                          <span className="font-bold text-ivory block">
                            {s.stats.passedQuizzes} / {s.stats.totalQuizzes}
                          </span>
                          {s.stats.quizAverage !== null && (
                            <span className="text-[10px] text-violet-300 font-bold bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                              متوسط: {s.stats.quizAverage}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Homeworks */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] ${
                            s.stats.submittedHomeworks < s.stats.totalHomeworks
                              ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                              : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                          }`}
                        >
                          {s.stats.submittedHomeworks} / {s.stats.totalHomeworks}
                        </span>
                      </td>

                      {/* Exams */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="space-y-0.5">
                          <span className="font-bold text-ivory block">
                            {s.stats.passedExams} / {s.stats.totalExams}
                          </span>
                          {s.stats.examAverage !== null && (
                            <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                              متوسط: {s.stats.examAverage}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-left">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* Periodic Performance Report Modal Button */}
                          <button
                            type="button"
                            onClick={() => setReportStudent({ id: s.studentId, fullName: s.fullName })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-300 hover:bg-gold-500/25 text-xs font-bold transition-all cursor-pointer"
                            title="عرض التقرير الدوري المفصل"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>التقرير الدوري</span>
                          </button>

                          {/* Toggle Active / Suspend */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => toggleStatus(s.studentId, s.status, s.fullName)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSuspended
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                            }`}
                            title={isSuspended ? 'تفعيل وتنشيط الطالب' : 'تعليق حساب الطالب مؤقتاً'}
                          >
                            {isSuspended ? (
                              <>
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>تنشيط</span>
                              </>
                            ) : (
                              <>
                                <PauseCircle className="w-3.5 h-3.5" />
                                <span>تعليق</span>
                              </>
                            )}
                          </button>

                          {/* Remove Student */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => removeStudent(s.studentId, s.fullName)}
                            className="p-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 text-xs transition-all cursor-pointer"
                            title="إلغاء اشتراك الطالب من الكورس"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Comprehensive Periodic Performance Report Modal ──────────── */}
      {reportStudent && (
        <Modal
          isOpen={!!reportStudent}
          onClose={() => setReportStudent(null)}
          title="تقرير الأداء والتحصيل الدوري للطالب"
          description="تحليل شامل للحضور، درجات الكويزات، الامتحانات، وتسليم الواجبات"
          maxWidth="4xl"
        >
          <div className="space-y-6 text-right p-1 sm:p-2" dir="rtl">
            {/* Student Hero Header & Period Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-surface border border-surface-border shadow-sm">
              <div className="flex items-center gap-3.5">
                {reportData?.student?.photoUrl ? (
                  <img
                    src={resolveMediaUrl(reportData.student.photoUrl)}
                    alt={reportStudent.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-gold-500/30 shadow-gold-glow/20 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gold-gradient text-bg font-black flex items-center justify-center text-xl shadow-gold-glow/40 shrink-0">
                    {reportStudent.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-ivory flex items-center gap-2">
                    {reportStudent.fullName}
                    {reportData?.student?.gradeLevel && (
                      <span className="text-[11px] font-bold text-gold-300 bg-gold-500/10 px-2.5 py-0.5 rounded-lg border border-gold-500/20">
                        {formatGradeLevelArabic(reportData.student.gradeLevel)}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-ivory-muted mt-1 flex-wrap">
                    {reportData?.student?.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gold-400" />
                        {reportData.student.phone}
                      </span>
                    )}
                    {reportData?.student?.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gold-400" />
                        {reportData.student.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Period Switcher Segmented Pills */}
              <div className="flex items-center bg-surface-card p-1 rounded-2xl border border-surface-border self-start md:self-center">
                {[
                  { value: 'week', label: 'هذا الأسبوع' },
                  { value: 'month', label: 'هذا الشهر' },
                  { value: 'all', label: 'التقرير الشامل' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setReportPeriod(p.value as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      reportPeriod === p.value
                        ? 'bg-gold-gradient text-white font-black shadow-gold-glow'
                        : 'text-ivory-muted hover:text-ivory hover:bg-surface'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {isReportLoading ? (
              <div className="py-16 text-center space-y-3 text-ivory-muted">
                <div className="w-10 h-10 border-3 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-ivory">جاري استخراج وتحليل درجات وأنشطة الطالب...</p>
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                {/* Overall Weighted Performance Banner */}
                {(() => {
                  const hasScore = reportData.summary.overallScore !== null && reportData.summary.overallScore !== undefined;
                  const reportScore: number = hasScore ? (reportData.summary.overallScore as number) : 0;
                  return (
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-gold-500/15 via-surface-card to-surface border border-gold-500/30 shadow-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-gold-500/20 border-2 border-gold-500/40 flex flex-col items-center justify-center shrink-0">
                          <span className="text-2xl font-black text-gold-300">{hasScore ? `${reportScore}%` : `\u2014`}</span>
                          <span className="text-[10px] font-bold text-gold-400">\u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0639\u0627\u0645</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-ivory">
                            \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0637\u0627\u0644\u0628 \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0641\u062a\u0631\u0629:{" "}
                            <span className={!hasScore ? "text-ivory-muted" : reportScore >= 85 ? "text-emerald-400" : reportScore >= 65 ? "text-amber-400" : "text-red-400"}>
                              {!hasScore ? "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0623\u0648\u0644 \u0646\u0634\u0627\u0637" : reportScore >= 85 ? "\u0645\u0645\u062a\u0627\u0632 \u0648\u0645\u062a\u0641\u0648\u0642 \u2b50" : reportScore >= 65 ? "\u062c\u064a\u062f \u0645\u0639 \u0625\u0645\u0643\u0627\u0646\u064a\u0629 \u0644\u0644\u062a\u062d\u0633\u0646 \ud83d\udc4d" : "\u064a\u062d\u062a\u0627\u062c \u0645\u062a\u0627\u0628\u0639\u0629 \u0648\u062a\u0643\u062b\u064a\u0641 \u0627\u0644\u0645\u0630\u0627\u0643\u0631\u0629 \u26a0\ufe0f"}
                            </span>
                          </h4>
                          <p className="text-xs text-ivory-muted">\u0627\u062d\u062a\u0633\u0627\u0628 \u062a\u0631\u0627\u0643\u0645\u064a \u0645\u0648\u0632\u0648\u0646: 30% \u0645\u0634\u0627\u0647\u062f\u0629 \u0627\u0644\u062f\u0631\u0648\u0633 + 30% \u0627\u0644\u0627\u0645\u062a\u062d\u0627\u0646\u0627\u062a + 20% \u0627\u0644\u0643\u0648\u064a\u0632\u0627\u062a + 20% \u0627\u0644\u0648\u0627\u062c\u0628\u0627\u062a</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-surface-border">
                      <div className="space-y-1 text-center sm:text-right"><div className="flex justify-between text-[11px] font-bold"><span className="text-ivory-muted">\u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629 (30%)</span><span className="text-emerald-400">{reportData.summary.attendanceRate}%</span></div><ProgressBar value={reportData.summary.attendanceRate} /></div>
                      <div className="space-y-1 text-center sm:text-right"><div className="flex justify-between text-[11px] font-bold"><span className="text-ivory-muted">\u0627\u0644\u0627\u0645\u062a\u062d\u0627\u0646\u0627\u062a (30%)</span><span className="text-cyan-400">{reportData.summary.examAverage ?? 0}%</span></div><ProgressBar value={reportData.summary.examAverage ?? 0} /></div>
                      <div className="space-y-1 text-center sm:text-right"><div className="flex justify-between text-[11px] font-bold"><span className="text-ivory-muted">\u0627\u0644\u0643\u0648\u064a\u0632\u0627\u062a (20%)</span><span className="text-violet-400">{reportData.summary.quizAverage ?? 0}%</span></div><ProgressBar value={reportData.summary.quizAverage ?? 0} /></div>
                      <div className="space-y-1 text-center sm:text-right"><div className="flex justify-between text-[11px] font-bold"><span className="text-ivory-muted">\u0627\u0644\u0648\u0627\u062c\u0628\u0627\u062a (20%)</span><span className="text-gold-400">{reportData.summary.homeworkCompletionRate}%</span></div><ProgressBar value={reportData.summary.homeworkCompletionRate} /></div>
                    </div>
                  </div>
                  );
                })()}

                {/* 4 Main Analytics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Attendance Card */}
                  <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ivory-muted">مشاهدة الدروس</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-emerald-400">{reportData.summary.attendanceRate}%</p>
                      <p className="text-xs text-ivory-muted mt-1">
                        حضر {reportData.summary.attendedLessonsCount} من {reportData.summary.totalAssignedLessons} درس
                      </p>
                    </div>
                    {reportData.summary.unattendedLessonsCount && reportData.summary.unattendedLessonsCount > 0 ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 inline-block">
                        متأخر في {reportData.summary.unattendedLessonsCount} درس
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 inline-block">
                        مكتمل بنجاح ✓
                      </span>
                    )}
                  </div>

                  {/* Quizzes Card */}
                  <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ivory-muted">الكويزات القصيرة</span>
                      <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
                        <FileQuestion className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-violet-300">
                        {reportData.summary.quizAverage !== null ? `${reportData.summary.quizAverage}%` : '—'}
                      </p>
                      <p className="text-xs text-ivory-muted mt-1">
                        اجتاز {reportData.summary.passedQuizzesCount} من {reportData.summary.quizzesTakenCount} كويز
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20 inline-block">
                      معدل النجاح {reportData.summary.quizzesTakenCount > 0 ? Math.round((reportData.summary.passedQuizzesCount / reportData.summary.quizzesTakenCount) * 100) : 0}%
                    </span>
                  </div>

                  {/* Homeworks Card */}
                  <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ivory-muted">تسليم الواجبات</span>
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-cyan-300">
                        {reportData.summary.homeworkCompletionRate}%
                      </p>
                      <p className="text-xs text-ivory-muted mt-1">
                        سلّم {reportData.summary.submittedHomeworksCount} من {reportData.summary.totalAssignedHomeworks} واجب
                      </p>
                    </div>
                    {reportData.summary.unsubmittedHomeworksCount && reportData.summary.unsubmittedHomeworksCount > 0 ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 inline-block">
                        لم يسلم {reportData.summary.unsubmittedHomeworksCount} واجب
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-lg border border-cyan-500/20 inline-block">
                        التزام كامل بالواجبات ✓
                      </span>
                    )}
                  </div>

                  {/* Exams Card */}
                  <div className="p-5 rounded-3xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ivory-muted">الامتحانات الشاملة</span>
                      <div className="w-8 h-8 rounded-xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gold-300">
                        {reportData.summary.examAverage !== null ? `${reportData.summary.examAverage}%` : '—'}
                      </p>
                      <p className="text-xs text-ivory-muted mt-1">
                        اجتاز {reportData.summary.passedExamsCount} من {reportData.summary.examsTakenCount} امتحان
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gold-300 bg-gold-500/10 px-2 py-1 rounded-lg border border-gold-500/20 inline-block">
                      {reportData.summary.examsTakenCount} امتحان منجز
                    </span>
                  </div>
                </div>

                {/* Highest & Lowest Score Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Highest Quiz Score */}
                  <div className="p-4 rounded-3xl bg-surface border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-400">أعلى درجة كويز حققها 🏆</p>
                        <p className="text-xs text-ivory font-bold truncate max-w-[220px] mt-0.5">
                          {reportData.summary.highestQuiz ? reportData.summary.highestQuiz.title : 'لا توجد محاولات بعد'}
                        </p>
                      </div>
                    </div>
                    {reportData.summary.highestQuiz && (
                      <span className="text-base font-black text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-2xl border border-emerald-500/30 shrink-0">
                        {reportData.summary.highestQuiz.score}%
                      </span>
                    )}
                  </div>

                  {/* Lowest Quiz Score */}
                  <div className="p-4 rounded-3xl bg-surface border border-amber-500/30 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-400">أقل كويز يحتاج مراجعة ⚠️</p>
                        <p className="text-xs text-ivory font-bold truncate max-w-[220px] mt-0.5">
                          {reportData.summary.lowestQuiz ? reportData.summary.lowestQuiz.title : 'لا توجد محاولات بعد'}
                        </p>
                      </div>
                    </div>
                    {reportData.summary.lowestQuiz && (
                      <span className="text-base font-black text-amber-400 bg-amber-500/15 px-3 py-1.5 rounded-2xl border border-amber-500/30 shrink-0">
                        {reportData.summary.lowestQuiz.score}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Detailed Activities Record */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
                    <Layers className="w-4 h-4 text-gold-400" />
                    <h4 className="text-sm font-black text-ivory">سجل الأنشطة والمحاولات التفصيلي:</h4>
                  </div>

                  {/* Quizzes Table */}
                  {reportData.quizzes.length > 0 ? (
                    <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
                      <div className="p-3 bg-surface-card border-b border-surface-border flex items-center justify-between">
                        <span className="text-xs font-bold text-ivory">كويزات واختبارات الدروس ({reportData.quizzes.length})</span>
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
                            {reportData.quizzes.map((q, idx) => (
                              <tr key={idx} className="hover:bg-surface-card/60">
                                <td className="p-2.5 font-bold text-ivory">{q.quizTitle}</td>
                                <td className="p-2.5 text-ivory-muted">{q.lessonTitle}</td>
                                <td className="p-2.5 text-center font-black text-ivory">{q.score}%</td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                    q.isPassed
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-red-500/15 text-red-300 border border-red-500/30'
                                  }`}>
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

                  {/* Homeworks Table */}
                  {reportData.homeworks.length > 0 && (
                    <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
                      <div className="p-3 bg-surface-card border-b border-surface-border flex items-center justify-between">
                        <span className="text-xs font-bold text-ivory">الواجبات المسلمة ({reportData.homeworks.length})</span>
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
                            {reportData.homeworks.map((h, idx) => (
                              <tr key={idx} className="hover:bg-surface-card/60">
                                <td className="p-2.5 font-bold text-ivory">{h.homeworkTitle}</td>
                                <td className="p-2.5 text-ivory-muted">{h.lessonTitle}</td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
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
            ) : (
              <div className="py-12 text-center text-ivory-muted text-xs">
                لا تتوفر بيانات تفصيلية لهذا الطالب في هذه الفترة.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
