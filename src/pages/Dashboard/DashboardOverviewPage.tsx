import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  Briefcase,
  GraduationCap,
  Trophy,
  TrendingDown,
  Eye,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTeacherDashboardQuery, useAdminDashboardQuery } from '../../hooks/queries/useDashboard';
import { formatPrice, formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuthStore } from '../../store/authStore';

/** ─── ADMIN OVERVIEW ─────────────────────────────────────────────── */
const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboard, isLoading, isError } = useAdminDashboardQuery();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
        <p className="text-red-400 font-bold text-sm">فشل تحميل بيانات النظرة العامة</p>
        <p className="text-xs text-ivory-muted">تحقق من الاتصال وحاول مرة أخرى.</p>
      </div>
    );
  }

  const users = dashboard?.users ?? {};
  const financials = dashboard?.financials ?? {};
  const coursesList: Array<{
    id: string;
    title: string;
    status: string;
    teacherName: string;
    studentsCount: number;
  }> = dashboard?.coursesBreakdown ?? [];

  // Top / lowest enrolled courses
  const topCourse = coursesList[0] ?? null;
  const lowestCourse =
    coursesList.length > 0 ? coursesList[coursesList.length - 1] : null;

  // Chart data — top 12 courses
  const chartData = coursesList.slice(0, 12).map((c) => ({
    id: c.id,
    name: c.title.length > 14 ? c.title.slice(0, 14) + '…' : c.title,
    fullName: c.title,
    students: c.studentsCount,
  }));

  const recentStudents = (dashboard?.recentRegistrations ?? []).filter(
    (u: any) => u.role === 'STUDENT'
  );

  const handleBarClick = (bar: any) => {
    const id = bar?.payload?.id ?? bar?.id;
    if (id) navigate(`/dashboard/courses/${id}/students`);
  };

  return (
    <div className="space-y-10 text-right">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">نظرة عامة على المنصة</h1>
        <p className="text-xs sm:text-sm text-ivory-muted">
          إحصائيات المدرسين والطلاب، توزيع الطلاب على الكورسات، ومراجعة أحدث التسجيلات.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ivory-muted">عدد المدرسين</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-amiri text-ivory">{users.teachers ?? 0} مدرس</div>
          <Link to="/dashboard/teachers" className="block text-[11px] text-gold-400 hover:underline">
            إدارة المعلمين ←
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ivory-muted">عدد الطلاب</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-amiri text-ivory">{users.students ?? 0} طالب</div>
          <span className="block text-[11px] text-emerald-400">
            {users.verifiedStudents ?? 0} حساب موثّق
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-surface-card border border-gold-500/30 space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ivory-muted">إيرادات المنصة المقبولة</span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-amiri text-gold-300">
            {formatPrice(financials.totalPlatformGrossRevenue ?? 0)}
          </div>
          <span className="block text-[11px] text-ivory-muted/70">
            {financials.acceptedPaymentsCount ?? 0} دفعة مقبولة
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ivory-muted">طلبات الدفع المعلقة</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-amiri text-amber-400">
            {financials.pendingPaymentsCount ?? 0} طلب
          </div>
          <Link to="/dashboard/payments" className="block text-[11px] text-gold-400 hover:underline">
            الانتقال للمراجعة ←
          </Link>
        </div>
      </div>

      {/* Courses bar chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-amiri text-gold-300 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            عدد الطلاب في كل كورس
          </h2>
          <p className="text-xs text-ivory-muted">
            اضغط على أي عمود لعرض طلاب هذا الكورس وإدارتهم.
          </p>
        </div>

        {chartData.length === 0 ? (
          <p className="text-xs text-ivory-muted py-8 text-center">لا توجد كورسات بعد.</p>
        ) : (
          <div className="h-80 w-full pt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--ink-muted)" fontSize={11} interval={0} angle={-20} height={60} textAnchor="end" />
                <YAxis stroke="var(--ink-muted)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(201,161,90,0.08)' }}
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--gold)',
                    borderRadius: '8px',
                    color: 'var(--ink)',
                    fontSize: '12px',
                    textAlign: 'right',
                  }}
                  formatter={(value: any) => [`${value} طالب`, 'الطلاب']}
                  labelFormatter={(label: any, payload: any) =>
                    payload?.[0]?.payload?.fullName ?? label
                  }
                />
                <Bar
                  dataKey="students"
                  name="الطلاب المشتركين"
                  fill="var(--gold)"
                  radius={[6, 6, 0, 0]}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Highest / Lowest enrolled courses */}
        {(topCourse || lowestCourse) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {topCourse && (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/courses/${topCourse.id}/students`)}
                className="group p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 hover:border-emerald-400 transition-all text-right space-y-2"
              >
                <p className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Trophy className="w-4 h-4" />
                  الكورس الأكثر تسجيلاً
                </p>
                <p className="text-sm font-bold text-ivory group-hover:text-gold-300 transition-colors">
                  {topCourse.title}
                </p>
                <p className="text-[11px] text-ivory-muted">
                  {topCourse.studentsCount} طالب مشترك — أ. {topCourse.teacherName}
                </p>
              </button>
            )}
            {lowestCourse && topCourse !== lowestCourse && coursesList.length > 1 && (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/courses/${lowestCourse.id}/students`)}
                className="group p-5 rounded-2xl bg-red-500/5 border border-red-500/30 hover:border-red-400 transition-all text-right space-y-2"
              >
                <p className="flex items-center gap-2 text-xs font-bold text-red-400">
                  <TrendingDown className="w-4 h-4" />
                  الكورس الأقل تسجيلاً
                </p>
                <p className="text-sm font-bold text-ivory group-hover:text-gold-300 transition-colors">
                  {lowestCourse.title}
                </p>
                <p className="text-[11px] text-ivory-muted">
                  {lowestCourse.studentsCount} طالب مشترك — أ. {lowestCourse.teacherName}
                </p>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review recent students */}
      <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-bold font-amiri text-gold-300 flex items-center gap-2">
            <Eye className="w-4.5 h-4.5" />
            مراجعة أحدث الطلاب المسجلين
          </h2>
          <Link to="/dashboard/students/search">
            <Button size="sm" variant="outline" leftIcon={<Users className="w-3.5 h-3.5" />}>
              البحث عن طالب
            </Button>
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <p className="text-xs text-ivory-muted py-4 text-center">لا توجد تسجيلات حديثة.</p>
        ) : (
          <ul className="divide-y divide-surface-border rounded-xl border border-surface-border overflow-hidden">
            {recentStudents.map((u: any) => (
              <li key={u.id} className="px-4 py-3 bg-bg-elevated flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Student avatar */}
                  {u.studentProfile?.photoUrl ? (
                    <img
                      src={u.studentProfile.photoUrl}
                      alt={u.studentProfile?.fullName || u.email}
                      className="w-8 h-8 rounded-full object-cover border border-gold-500/30 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 font-bold text-xs shrink-0">
                      {(u.studentProfile?.fullName || u.email)?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    {u.studentProfile?.fullName && (
                      <p className="text-xs font-bold text-ivory truncate">{u.studentProfile.fullName}</p>
                    )}
                    <p dir="ltr" className="text-[10px] text-ivory-muted/70 truncate text-right">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={u.isVerified ? 'success' : 'warning'}>
                    {u.isVerified ? 'موثّق' : 'غير موثّق'}
                  </Badge>
                  <span className="text-[10px] text-ivory-muted/70">{formatDate(u.createdAt)}</span>
                  <Link
                    to={`/dashboard/students/search`}
                    className="text-[10px] text-gold-400 hover:underline whitespace-nowrap"
                  >
                    مراجعة ←
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export const DashboardOverviewPage: React.FC = () => {
  const { data: dashboard, isLoading, isError } = useTeacherDashboardQuery();
  // ✅ نقرأ الـ role مباشرة من الـ store لتشخيص مشكلة enabled: role === 'TEACHER'
  const role = useAuthStore((state) => state.role);

  // ✅ الأدمن له نظرة عامة خاصة به على مستوى المنصة بالكامل
  if (role === 'ADMIN') {
    return <AdminOverview />;
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  // ✅ لو الـ role مش TEACHER بالظبط — الـ query disabled ولن يُرسَل أي request
  if (role !== 'TEACHER') {
    return (
      <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
        <p className="text-amber-400 font-bold text-sm">تحذير: role الحالي = "{role}"</p>
        <p className="text-xs text-ivory-muted">
          الـ query مش بيتبعت لأن role !== 'TEACHER'. تأكد من الـ backend أنه بيرجع role بالـ uppercase.
        </p>
      </div>
    );
  }

  // ✅ لو الـ request اتبعت وفشل — بدل ما الأرقام تبقى 0 صامتة
  if (isError) {
    return (
      <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-2">
        <p className="text-red-400 font-bold text-sm">فشل تحميل بيانات الداشبورد</p>
        <p className="text-xs text-ivory-muted">
          تحقق من Network tab — GET /dashboard/teacher يجب أن يرجع 200 مع Authorization header.
        </p>
      </div>
    );
  }

  const overview = (dashboard as any)?.overview || dashboard;

  const stats = {
    totalCourses:         overview?.totalCourses ?? 0,
    publishedCourses:     overview?.publishedCourses ?? 0,
    draftCourses:         overview?.draftCourses ?? 0,
    totalStudents:        overview?.totalUniqueStudents ?? 0,
    pendingPaymentsCount: overview?.pendingReceiptsCount ?? 0,
    totalRevenue:         overview?.totalGrossRevenue ?? 0,
  };

  const coursesList = (dashboard as any)?.courses || (dashboard as any)?.coursesSummary || [];
  const chartData = coursesList.map((c: any) => ({
    name: (c.title || '').length > 15 ? (c.title || '').slice(0, 15) + '...' : c.title || '',
    students: c.activeStudentsCount || c.activeEnrollments || 0,
    pending: c.pendingPaymentsCount || 0,
  }));


  return (
    <div className="space-y-10 text-right">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">
أهلاً بيك في لوحة سند
          </h1>
          <p className="text-xs sm:text-sm text-ivory-muted">
            إليك ملخص شامل لأداء منصتك التعليمية، المشتركين، وإيرادات الكورسات.
          </p>
        </div>

        {stats.pendingPaymentsCount > 0 && (
          <Link to="/dashboard/payments">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<AlertCircle className="w-4 h-4 text-amber-400" />}
            >
              يوجد {stats.pendingPaymentsCount} إيصالات تحتاج المراجعة
            </Button>
          </Link>
        )}
      </div>

      {/* ─── Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="p-6 rounded-2xl bg-surface-card border border-gold-500/30 space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ivory-muted">إجمالي الإيرادات المقبولة</span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-amiri text-gold-300">
            {formatPrice(stats.totalRevenue)}
          </div>
          <span className="block text-[11px] text-ivory-muted/70">تحديث فوري مع كل قبول</span>
        </div>

        {/* Total Students */}
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ivory-muted">الطلاب المشتركين</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-amiri text-ivory">
            {stats.totalStudents} طالب
          </div>
          <span className="block text-[11px] text-ivory-muted/70">اشتراكات مفعلة</span>
        </div>

        {/* Total Courses */}
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ivory-muted">الكورسات والمحاضرات</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-amiri text-ivory">
            {stats.totalCourses} كورس
          </div>
          <span className="block text-[11px] text-emerald-400">
            {stats.publishedCourses} كورس منشور للطلاب
          </span>
        </div>

        {/* Pending Payments */}
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ivory-muted">طلبات الدفع المعلقة</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-amiri text-amber-400">
            {stats.pendingPaymentsCount} طلب
          </div>
          <Link
            to="/dashboard/payments"
            className="block text-[11px] text-gold-400 hover:underline"
          >
            الانتقال للمراجعة ←
          </Link>
        </div>
      </div>

      {/* ─── Chart Section ───────────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-amiri text-gold-300">
              توزيع الطلاب والمشتركين حسب الكورسات
            </h2>
            <p className="text-xs text-ivory-muted">
              مقارنة بين عدد الاشتراكات المفعلة والطلبات المعلقة لكل كورس
            </p>
          </div>

          <div className="h-72 w-full pt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--ink-muted)" fontSize={11} />
                <YAxis stroke="var(--ink-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--gold)',
                    borderRadius: '8px',
                    color: 'var(--ink)',
                    fontSize: '12px',
                    textAlign: 'right',
                  }}
                />
                <Bar dataKey="students" name="الطلاب المفعلين" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="طلبات معلقة" fill="#EAB308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ─── Recent Activity ─────────────────────────────────────────── */}
      {dashboard?.recentActivity && dashboard.recentActivity.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
          <h2 className="text-base font-bold font-amiri text-gold-300">آخر العمليات والتسجيلات</h2>

          <div className="divide-y divide-surface-border space-y-3">
            {dashboard.recentActivity.map((act) => (
              <div key={act.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-gold-400" />
                  <span className="text-ivory">{act.message}</span>
                </div>
                <span className="text-ivory-muted/70">{formatDate(act.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
