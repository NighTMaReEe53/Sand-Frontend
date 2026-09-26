import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpenCheck,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  FileText,
  AlertCircle,
  ExternalLink,
  Layers,
  Award,
  Filter,
  Users,
  X,
  BookOpen,
  Sparkles,
  ChevronLeft,
  GraduationCap,
} from 'lucide-react';
import { homeworkOverviewApi, TeacherHomeworkOverviewItem } from '../../api/homework.api';
import { CustomCourseSelect } from '../../components/ui/CustomCourseSelect';
import { Button } from '../../components/ui/Button';

export const DashboardHomeworksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'GRADED' | 'EMPTY'>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-homeworks-overview'],
    queryFn: () => homeworkOverviewApi.getOverview(),
    staleTime: 1000 * 30,
  });

  const homeworks = data?.homeworks ?? [];

  // Summary stats
  const totalHomeworks = homeworks.length;
  const totalSubmissions = homeworks.reduce((s, h) => s + h.totalAttempts, 0);
  const totalPending = homeworks.reduce((s, h) => s + h.pendingReviewCount, 0);
  const totalPassed = homeworks.reduce((s, h) => s + h.passedAttempts, 0);

  // Filtered & searched items
  const filteredItems = useMemo(() => {
    return homeworks.filter((hw) => {
      // Course filter
      if (selectedCourseId && hw.courseId !== selectedCourseId) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const match =
          hw.title.toLowerCase().includes(q) ||
          hw.courseTitle.toLowerCase().includes(q) ||
          hw.lessonTitle.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status filter
      if (filter === 'PENDING') return hw.pendingReviewCount > 0;
      if (filter === 'GRADED') return hw.totalAttempts > 0 && hw.pendingReviewCount === 0;
      if (filter === 'EMPTY') return hw.totalAttempts === 0;

      return true;
    });
  }, [homeworks, searchTerm, filter, selectedCourseId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 text-right" dir="rtl">
      {/* ─── Header Card ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gold-400">
              <BookOpenCheck className="w-4 h-4" />
              <span>إدارة الواجبات والتصحيح</span>
            </div>
            <h1 className="font-amiri text-2xl sm:text-3xl font-black text-gold-300">
              تسليمات وواجبات الكورسات
            </h1>
            <p className="text-xs sm:text-sm text-ivory-muted">
              متابعة حلول الطلاب للواجبات، رصد درجات الأسئلة المقالية والصور، وتقديم التغذية الراجعة.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/dashboard/courses">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Layers className="w-4 h-4 text-gold-400" />}
                className="!rounded-xl font-bold"
              >
                إدارة الكورسات والمنهج
              </Button>
            </Link>
          </div>
        </div>

        {/* Course Filter Bar with Custom Select */}
        <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ivory-muted">
            <BookOpen className="w-4 h-4 text-gold-400" />
            <span>تصفية الواجبات حسب الكورس:</span>
          </div>
          <CustomCourseSelect
            selectedCourseId={selectedCourseId}
            onSelectCourse={(id) => setSelectedCourseId(id)}
          />
        </div>
      </div>

      {/* ─── KPI Stats Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-surface-card border border-surface-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gold-500/15 text-gold-400 flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ivory-muted">إجمالي الواجبات</p>
              <p className="text-2xl font-black text-ivory">{totalHomeworks}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-card border border-surface-border p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-ivory-muted">إجمالي التسليمات</p>
              <p className="text-2xl font-black text-sky-400">{totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-card border border-amber-500/30 p-5 shadow-card bg-amber-500/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">بانتظار تصحيحك ⏳</p>
              <p className="text-2xl font-black text-amber-300">{totalPending}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface-card border border-emerald-500/30 p-5 shadow-card bg-emerald-500/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">تسليمات ناجحة ✓</p>
              <p className="text-2xl font-black text-emerald-400">{totalPassed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Controls: Search & Filter Tabs ─────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-card p-4 rounded-3xl border border-surface-border shadow-card">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'ALL', label: 'الكل', count: homeworks.length },
            {
              key: 'PENDING',
              label: 'بانتظار التصحيح ⏳',
              count: homeworks.filter((h) => h.pendingReviewCount > 0).length,
            },
            {
              key: 'GRADED',
              label: 'تم تصحيحها بالكامل ✓',
              count: homeworks.filter((h) => h.totalAttempts > 0 && h.pendingReviewCount === 0).length,
            },
            {
              key: 'EMPTY',
              label: 'بدون تسليمات بعد',
              count: homeworks.filter((h) => h.totalAttempts === 0).length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-gold-gradient text-white font-black shadow-gold-glow border border-gold-400/50'
                  : 'bg-surface border border-surface-border text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-ivory-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث باسم الواجب أو الدرس أو الكورس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-xl pr-10 pl-9 py-2.5 text-xs text-ivory outline-none focus:border-gold-400 shadow-inner transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ivory-muted hover:text-ivory"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Homeworks List ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">تعذر تحميل قائمة الواجبات والتسليمات.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3 shadow-card">
          <BookOpenCheck className="w-12 h-12 text-gold-400/40 mx-auto" />
          <h3 className="text-base font-bold text-ivory">لا توجد واجبات مطابقة</h3>
          <p className="text-xs text-ivory-muted max-w-sm mx-auto">
            {searchTerm || selectedCourseId
              ? 'جرّب تغيير خيارات البحث أو تحديد كورس آخر.'
              : 'لم تقم بإنشاء أي واجبات في كورساتك بعد.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((hw) => (
            <div
              key={hw.id}
              className={`p-5 sm:p-6 rounded-3xl border transition-all hover:border-gold-500/40 shadow-sm ${
                hw.pendingReviewCount > 0
                  ? 'bg-amber-500/[0.04] border-amber-500/30'
                  : 'bg-surface-card border-surface-border'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                {/* Left details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-3 py-1 rounded-xl font-bold bg-gold-500/15 text-gold-300 border border-gold-500/30">
                      {hw.courseTitle}
                    </span>
                    <span className="text-ivory-muted">•</span>
                    <span className="text-ivory font-bold">الدرس: {hw.lessonTitle}</span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-ivory font-amiri">{hw.title}</h3>
                    {hw.pendingReviewCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        {hw.pendingReviewCount} تسليم بانتظار تصحيحك
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-ivory-muted flex-wrap pt-1">
                    <span className="font-bold text-ivory">
                      {hw.questionsCount} سؤال ({hw.essayQuestionsCount} مقالي/صورة)
                    </span>
                    <span>•</span>
                    <span>نسبة النجاح: {hw.passingPercentage}%</span>
                    <span>•</span>
                    <span className="text-sky-300 font-bold flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {hw.totalAttempts} تسليم إجمالي
                    </span>
                    {hw.totalAttempts > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">
                          {hw.passedAttempts} ناجح ({Math.round((hw.passedAttempts / hw.totalAttempts) * 100)}%)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <Link to={`/dashboard/homework/${hw.id}/submissions`}>
                    <Button
                      size="sm"
                      variant={hw.pendingReviewCount > 0 ? 'primary' : 'outline'}
                      leftIcon={<BookOpenCheck className="w-4 h-4" />}
                      className={`!rounded-xl font-bold ${
                        hw.pendingReviewCount > 0
                          ? 'bg-amber-500 hover:bg-amber-600 text-bg !border-amber-400 shadow-md'
                          : 'border-gold-500/40 text-gold-300 hover:bg-gold-500/10'
                      }`}
                    >
                      {hw.pendingReviewCount > 0
                        ? `تصحيح الإجابات (${hw.pendingReviewCount})`
                        : `عرض التسليمات (${hw.totalAttempts})`}
                    </Button>
                  </Link>

                  <Link to={`/dashboard/courses/${hw.courseId}/curriculum`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Layers className="w-4 h-4" />}
                      className="!rounded-xl text-ivory-muted hover:text-ivory"
                    >
                      المنهج
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardHomeworksPage;
