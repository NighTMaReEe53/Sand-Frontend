import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingDown, PlayCircle, FileQuestion, AlertCircle } from 'lucide-react';
import { teacherAnalyticsApi } from '../../api/phase2-teacher.api';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/dashboard/PageHeader';

export const CourseAnalyticsPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['course-analytics', courseId],
    queryFn: () => teacherAnalyticsApi.getCourseAnalytics(courseId!),
    enabled: !!courseId,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 text-right">
        <Skeleton className="h-10 w-1/3" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-right space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-400">تعذر تحميل تحليلات الكورس.</p>
        <Link to="/dashboard/analytics" className="text-gold-400 hover:text-gold-300 text-xs inline-flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          العودة للتحليلات
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      <PageHeader
        id="course-analytics"
        icon={FileQuestion}
        title="تحليلات الدروس والامتحانات"
        subtitle="تابع مشاهدات الدروس ونقاط التسرب وأداء الطلاب في الامتحانات."
        action={
          <Link
            to="/dashboard/analytics"
            className="text-xs font-bold text-gold-400 hover:text-gold-300 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            كل التحليلات
          </Link>
        }
      />

      {/* Highlights */}
      <div className="grid sm:grid-cols-3 gap-4">
        {data.mostWatchedLesson && (
          <div className="p-4 rounded-2xl bg-surface-card border border-emerald-500/20 space-y-1">
            <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5" />
              الأكثر مشاهدة
            </p>
            <p className="text-xs font-bold text-ivory">{data.mostWatchedLesson.title}</p>
          </div>
        )}
        {data.leastWatchedLesson && (
          <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1">
            <p className="text-[11px] text-ivory-muted flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5" />
              الأقل مشاهدة
            </p>
            <p className="text-xs font-bold text-ivory">{data.leastWatchedLesson.title}</p>
          </div>
        )}
        {data.biggestDropOff && data.biggestDropOff.dropOffRate > 0 && (
          <div className="p-4 rounded-2xl bg-surface-card border border-red-500/20 space-y-1">
            <p className="text-[11px] text-red-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              أكبر نقطة تسرب ({data.biggestDropOff.dropOffRate}%)
            </p>
            <p className="text-xs font-bold text-ivory">{data.biggestDropOff.title}</p>
          </div>
        )}
      </div>

      {/* Lessons table */}
      <section className="rounded-2xl bg-surface-card border border-surface-border overflow-x-auto">
        <h2 className="px-4 py-3 bg-surface text-xs font-bold text-gold-300">أداء الدروس</h2>
        <table className="w-full text-xs text-right min-w-[640px]">
          <thead className="bg-surface/50 text-ivory-muted">
            <tr>
              <th className="px-4 py-2.5">#</th>
              <th className="px-4 py-2.5">الدرس</th>
              <th className="px-4 py-2.5">مشاهدوه</th>
              <th className="px-4 py-2.5">أكملوه</th>
              <th className="px-4 py-2.5">متوسط المشاهدة</th>
              <th className="px-4 py-2.5">التسرب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {data.lessons.map((l, i) => (
              <tr key={l.lessonId} className={l.dropOffRate >= 40 ? 'bg-red-500/5' : ''}>
                <td className="px-4 py-2.5 text-ivory-muted">{i + 1}</td>
                <td className="px-4 py-2.5 text-ivory">{l.title}</td>
                <td className="px-4 py-2.5 text-ivory-muted">{l.watchers}</td>
                <td className="px-4 py-2.5 text-emerald-400">{l.completions}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-14 h-1.5 rounded-full bg-surface-elevated overflow-hidden inline-block align-middle">
                      <span
                        className="block h-full bg-gradient-to-l from-gold-500 to-gold-300"
                        style={{ width: `${l.averageWatchPercentage}%` }}
                      />
                    </span>
                    {l.averageWatchPercentage}%
                  </span>
                </td>
                <td className={`px-4 py-2.5 ${l.dropOffRate >= 40 ? 'text-red-400 font-bold' : 'text-ivory-muted'}`}>
                  {l.dropOffRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Exams */}
      <section className="rounded-2xl bg-surface-card border border-surface-border p-4 space-y-3">
        <h2 className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
          <FileQuestion className="w-3.5 h-3.5" />
          أداء الامتحانات
        </h2>
        {data.exams.length === 0 ? (
          <p className="text-[11px] text-ivory-muted">لا توجد امتحانات على هذا الكورس.</p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-3">
            {data.exams.map((e) => (
              <li key={e.examId} className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1.5">
                <p className="text-xs font-bold text-ivory truncate">{e.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="neutral">{e.attemptCount} محاولة</Badge>
                  {e.averageScore !== null && (
                    <Badge variant={(e.averageScore ?? 0) >= 50 ? 'success' : 'warning'}>
                      متوسط {e.averageScore}%
                    </Badge>
                  )}
                  {e.passRate !== null && <Badge variant="neutral">نجاح {e.passRate}%</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
