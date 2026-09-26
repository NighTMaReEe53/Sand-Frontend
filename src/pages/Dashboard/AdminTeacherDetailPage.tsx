import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Star,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import { studentsApi } from '../../api/students.api';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

const number = (value: number | null | undefined) => (value ?? 0).toLocaleString('ar-EG');
const money = (value: unknown) => `${Number(value ?? 0).toLocaleString('ar-EG')} ج.م`;
const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
    : 'لا توجد حركة مسجلة';

const courseStatus = {
  PUBLISHED: { label: 'منشور', className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' },
  DRAFT: { label: 'مسودة', className: 'border-amber-500/25 bg-amber-500/10 text-amber-300' },
  ARCHIVED: { label: 'مؤرشف', className: 'border-slate-500/25 bg-slate-500/10 text-slate-300' },
};

const actionLabel = (action: string | null) => {
  if (!action) return 'آخر تحديث للمحتوى أو الملف';
  const labels: Record<string, string> = {
    LOGIN: 'تسجيل دخول',
    COURSE_CREATED: 'إنشاء كورس',
    COURSE_UPDATED: 'تحديث كورس',
    LESSON_CREATED: 'إضافة درس',
    LESSON_UPDATED: 'تحديث درس',
  };
  return labels[action] ?? action.replaceAll('_', ' ');
};

const Metric: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'gold' | 'emerald' | 'sky' | 'violet';
}> = ({ icon: Icon, label, value, hint, tone = 'gold' }) => {
  const tones = {
    gold: 'bg-gold-500/15 text-gold-300 border-gold-500/25',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  };
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-xl font-black leading-none text-ivory">{value}</p>
      <p className="mt-1.5 text-xs font-bold text-ivory">{label}</p>
      {hint && <p className="mt-1 text-[10px] leading-4 text-ivory-muted">{hint}</p>}
    </div>
  );
};

export const AdminTeacherDetailPage: React.FC = () => {
  const { teacherId = '' } = useParams<{ teacherId: string }>();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-teacher-detail', teacherId],
    queryFn: () => studentsApi.getTeacherDetail(teacherId),
    enabled: Boolean(teacherId),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <Skeleton className="h-52 rounded-3xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <p className="text-sm font-black text-rose-300">تعذر تحميل ملف المعلم.</p>
        <p className="mt-2 text-xs text-ivory-muted">تأكد أن الحساب لا يزال موجودًا ثم أعد المحاولة.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/dashboard/teachers"><Button size="sm" variant="outline">العودة للمعلمين</Button></Link>
          <Button size="sm" onClick={() => refetch()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }

  const { teacher, analytics, courses, recentReviews } = data;
  const profile = teacher.teacherProfile;

  return (
    <div className="mx-auto max-w-7xl space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/dashboard/teachers" className="inline-flex items-center gap-1.5 text-xs font-bold text-ivory-muted transition-colors hover:text-gold-300">
          <ArrowRight className="h-4 w-4" />
          العودة لإدارة المعلمين
        </Link>
        <Button size="sm" variant="outline" isLoading={isFetching} onClick={() => refetch()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          تحديث البيانات
        </Button>
      </div>

      <section className="overflow-hidden rounded-3xl border border-surface-border bg-surface-card shadow-card">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-7">
          {profile?.photoUrl ? (
            <img src={profile.photoUrl} alt="" className="h-20 w-20 rounded-3xl border border-gold-500/30 object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gold-500/30 bg-gold-500/10 text-3xl font-black text-gold-300">
              {(profile?.fullName ?? 'م')[0]}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-ivory sm:text-2xl">{profile?.fullName ?? 'معلم'}</h1>
              {teacher.isVerified && <BadgeCheck className="h-5 w-5 text-emerald-400" aria-label="حساب موثق" />}
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${teacher.isActive ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/25 bg-rose-500/10 text-rose-300'}`}>
                {teacher.isActive ? 'حساب نشط' : 'الحساب موقوف'}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-gold-300">{profile?.specialization || 'معلم'}</p>
            {profile?.bio && <p className="mt-3 max-w-3xl text-xs leading-6 text-ivory-muted">{profile.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-ivory-muted" dir="ltr">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gold-400" />{teacher.email}</span>
              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gold-400" />{teacher.phone}</span>
            </div>
            {profile?.workPlaces?.length ? <p className="mt-3 text-[11px] text-ivory-muted">جهات العمل: {profile.workPlaces.join(' • ')}</p> : null}
          </div>
          <div className="rounded-2xl border border-surface-border bg-surface-alt px-4 py-3 text-right sm:shrink-0">
            <p className="text-[10px] font-bold text-ivory-muted">عضو منذ</p>
            <p className="mt-1 text-xs font-black text-ivory">{formatDate(teacher.createdAt)}</p>
          </div>
        </div>
        <p className="border-t border-surface-border bg-surface-alt/60 px-5 py-2.5 text-[10px] leading-5 text-ivory-muted sm:px-7">
          الدقة: الطلاب هنا هم أصحاب الاشتراكات النشطة غير المكررة، والإيراد من المدفوعات المقبولة فقط، والتقييمات المعروضة غير المخفية.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Metric icon={BookOpen} label="الكورسات" value={number(teacher.totals.coursesCount)} hint={`${courses.filter((course) => course.status === 'PUBLISHED').length} منشور`} />
        <Metric icon={Users} label="طلاب نشطون" value={number(teacher.totals.studentsCount)} hint="غير مكررين" tone="sky" />
        <Metric icon={CircleDollarSign} label="الإيراد المقبول" value={money(analytics.totalRevenue)} hint={`${number(analytics.acceptedPaymentsCount)} دفعة`} tone="emerald" />
        <Metric icon={Activity} label="نشط خلال 30 يومًا" value={number(analytics.activeStudentsLast30Days)} hint="طلاب سجلوا ظهورًا" tone="violet" />
        <Metric icon={Star} label="متوسط التقييم" value={analytics.averageRating === null ? '—' : `${analytics.averageRating.toFixed(1)} / 5`} hint={`${number(analytics.reviewsCount)} تقييم`} tone="gold" />
        <Metric icon={TrendingUp} label="إتمام الدروس" value={analytics.completionRate === null ? '—' : `${analytics.completionRate}%`} hint="ضمن الاشتراكات النشطة" tone="emerald" />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <article className="rounded-3xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-300"><Activity className="h-4 w-4" /></span>
            <div><h2 className="text-sm font-black text-ivory">النشاط والمتابعة</h2><p className="text-[10px] text-ivory-muted">مؤشرات تشغيلية، لا تقديرات</p></div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-surface-alt p-3"><p className="text-[10px] text-ivory-muted">أسئلة مفتوحة</p><p className="mt-1 text-lg font-black text-ivory">{number(analytics.openQuestionsCount)}</p></div>
            <div className="rounded-2xl bg-surface-alt p-3"><p className="text-[10px] text-ivory-muted">دفعات معلقة</p><p className="mt-1 text-lg font-black text-ivory">{number(analytics.pendingPaymentsCount)}</p></div>
            <div className="rounded-2xl bg-surface-alt p-3"><p className="text-[10px] text-ivory-muted">إجراءات مسجلة / 30 يوم</p><p className="mt-1 text-lg font-black text-ivory">{number(analytics.actionsLast30Days)}</p></div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-surface-border bg-surface-alt/50 p-3 text-xs leading-5 text-ivory-muted">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
            <p>آخر نشاط: <span className="font-bold text-ivory">{formatDate(analytics.lastActivityAt)}</span><br />{analytics.lastActivitySource} — {actionLabel(analytics.lastActivityAction)}</p>
          </div>
        </article>

        <article className="rounded-3xl border border-surface-border bg-surface-card p-5 sm:p-6">
          <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold-500/25 bg-gold-500/10 text-gold-300"><GraduationCap className="h-4 w-4" /></span><div><h2 className="text-sm font-black text-ivory">جودة التعلم</h2><p className="text-[10px] text-ivory-muted">تقدم الدروس داخل التسجيلات الفعالة</p></div></div>
          <div className="mt-5 rounded-2xl border border-surface-border bg-surface-alt p-4">
            <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] text-ivory-muted">سجلات دروس مكتملة</p><p className="mt-1 text-xl font-black text-ivory">{number(analytics.completedLessonRecords)} <span className="text-xs text-ivory-muted">من {number(analytics.lessonSlots)}</span></p></div><CheckCircle2 className="h-6 w-6 text-emerald-400" /></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-border"><span className="block h-full rounded-full bg-emerald-400" style={{ width: `${analytics.completionRate ?? 0}%` }} /></div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-surface-border bg-surface-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border p-5 sm:px-6"><div><h2 className="text-sm font-black text-ivory">الكورسات والإيرادات</h2><p className="mt-1 text-[10px] text-ivory-muted">الطالب = اشتراك نشط، والإيراد = مدفوعات مقبولة</p></div><span className="rounded-full bg-surface-alt px-3 py-1.5 text-[11px] font-bold text-ivory-muted">{courses.length} كورس</span></div>
        {courses.length === 0 ? <p className="p-8 text-center text-xs text-ivory-muted">لم ينشئ هذا المعلم كورسات بعد.</p> : <div className="overflow-x-auto"><table className="min-w-[770px] w-full text-right"><thead className="bg-surface-alt/60 text-[10px] text-ivory-muted"><tr><th className="px-5 py-3 font-bold">الكورس</th><th className="px-4 py-3 font-bold">الحالة</th><th className="px-4 py-3 font-bold">طلاب نشطون</th><th className="px-4 py-3 font-bold">التقييم</th><th className="px-4 py-3 font-bold">الإتمام</th><th className="px-5 py-3 font-bold">الإيراد</th></tr></thead><tbody>{courses.map((course) => { const status = courseStatus[course.status]; const completion = course.lessonSlots ? Math.round((course.completedLessons / course.lessonSlots) * 100) : null; return <tr key={course.id} className="border-t border-surface-border text-xs text-ivory-muted"><td className="px-5 py-4"><p className="font-black text-ivory">{course.title}</p><p className="mt-1 text-[10px]">{course.subject || 'بدون مادة محددة'} · {course._count.lessons} درس</p></td><td className="px-4 py-4"><span className={`rounded-full border px-2 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span></td><td className="px-4 py-4 font-bold text-ivory">{number(course._count.enrollments)}</td><td className="px-4 py-4">{course.averageRating === null ? '—' : <span className="inline-flex items-center gap-1 text-amber-300"><Star className="h-3.5 w-3.5 fill-amber-400" />{course.averageRating.toFixed(1)} ({course.reviewsCount})</span>}</td><td className="px-4 py-4">{completion === null ? '—' : `${completion}%`}</td><td className="px-5 py-4 font-black text-emerald-300">{money(course.totalRevenue)}</td></tr>; })}</tbody></table></div>}
      </section>

      <section className="rounded-3xl border border-surface-border bg-surface-card p-5 sm:p-6">
        <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-300"><MessageCircle className="h-4 w-4" /></span><div><h2 className="text-sm font-black text-ivory">آخر آراء الطلاب</h2><p className="text-[10px] text-ivory-muted">تقييمات ظاهرة فقط، بترتيب الأحدث</p></div></div>
        {recentReviews.length === 0 ? <p className="py-8 text-center text-xs text-ivory-muted">لا توجد آراء ظاهرة من الطلاب حتى الآن.</p> : <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{recentReviews.map((review) => <article key={review.id} className="rounded-2xl border border-surface-border bg-surface-alt/50 p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-black text-ivory">{review.student.fullName}</p><p className="mt-0.5 text-[10px] text-ivory-muted">{review.course.title} · {formatDate(review.createdAt)}</p></div><span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-300"><Star className="h-3 w-3 fill-amber-400" />{review.rating}</span></div><p className="mt-3 text-xs leading-6 text-ivory-muted">{review.comment || 'لم يضف الطالب تعليقًا.'}</p></article>)}</div>}
      </section>
    </div>
  );
};
