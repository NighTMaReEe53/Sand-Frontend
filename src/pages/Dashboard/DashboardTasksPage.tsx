import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  ListTodo,
  Loader2,
  MessageCircle,
  RefreshCw,
  WalletCards,
} from 'lucide-react';
import { dashboardApi, type DashboardActionTask } from '../../api/dashboard.api';
import { Button } from '../../components/ui/Button';

const taskIcons: Record<DashboardActionTask['icon'], React.ElementType> = {
  clipboard: ClipboardCheck,
  messages: MessageCircle,
  wallet: WalletCards,
  'file-check': FileCheck2,
  book: BookOpen,
};

const priorityStyles = {
  high: {
    label: 'أولوية عالية',
    card: 'border-rose-500/30 bg-rose-500/[0.045]',
    icon: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  },
  medium: {
    label: 'متابعة قريبة',
    card: 'border-amber-500/30 bg-amber-500/[0.045]',
    icon: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  },
  low: {
    label: 'متابعة تنظيمية',
    card: 'border-sky-500/25 bg-sky-500/[0.035]',
    icon: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
  },
};

const formatGeneratedAt = (value?: string) => {
  if (!value) return 'الآن';
  return new Date(value).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const DashboardTasksPage: React.FC = () => {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['dashboard-action-center'],
    queryFn: dashboardApi.getActionCenter,
    refetchOnWindowFocus: true,
  });

  const pendingTasks = data?.tasks.filter((task) => task.count > 0) ?? [];
  const clearTasks = data?.tasks.filter((task) => task.count === 0) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6" dir="rtl">
      <section className="overflow-hidden rounded-3xl border border-surface-border bg-surface-card shadow-card">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold-500/25 bg-gold-500/15 text-gold-300">
              <ListTodo className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[11px] font-black tracking-wide text-gold-300">لوحة العمل اليومية</p>
              <h1 className="mt-0.5 text-xl font-black text-ivory sm:text-2xl">مركز المهام والمتابعة</h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-6 text-ivory-muted">
                هذه القائمة تُحدَّث من بيانات المنصة الفعلية: لا تظهر مهمة إلا إذا كان هناك إجراء واضح مطلوب منك.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            <div className="rounded-2xl border border-gold-500/25 bg-gold-500/10 px-4 py-2.5 text-center">
              <p className="text-xl font-black text-gold-300">{data?.totalOpenItems ?? '—'}</p>
              <p className="text-[10px] font-bold text-ivory-muted">عنصر يحتاج إجراء</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              تحديث
            </Button>
          </div>
        </div>
        <div className="border-t border-surface-border bg-surface-alt/60 px-5 py-2.5 text-[10px] font-medium text-ivory-muted sm:px-7">
          آخر تحديث: {formatGeneratedAt(data?.generatedAt)}
        </div>
      </section>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-surface-border bg-surface-card text-sm text-ivory-muted">
          <Loader2 className="ml-2 h-5 w-5 animate-spin text-gold-400" />
          جاري جمع المهام الفعلية…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
          <p className="text-sm font-bold text-rose-300">تعذر تحميل مركز المهام الآن.</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : pendingTasks.length === 0 ? (
        <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.045] p-8 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-black text-ivory">كل شيء تحت السيطرة</h2>
          <p className="mt-1.5 text-xs text-ivory-muted">لا توجد مراجعات أو أسئلة أو تسليمات معلقة حاليًا.</p>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-ivory">تحتاج إجراء الآن</h2>
            <span className="text-[11px] font-bold text-ivory-muted">{pendingTasks.length} نوع من المهام</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pendingTasks.map((task) => {
              const Icon = taskIcons[task.icon];
              const style = priorityStyles[task.priority];
              return (
                <article key={task.id} className={`rounded-3xl border p-5 shadow-sm transition-transform hover:-translate-y-0.5 ${style.card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${style.icon}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${style.badge}`}>{style.label}</span>
                  </div>
                  <p className="mt-4 text-3xl font-black leading-none text-ivory">{task.count}</p>
                  <h3 className="mt-2 text-sm font-black text-ivory">{task.title}</h3>
                  <p className="mt-1.5 min-h-10 text-xs leading-5 text-ivory-muted">{task.description}</p>
                  <Link to={task.href} className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-gold-300 transition-colors hover:text-gold-200">
                    فتح الإجراء
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {clearTasks.length > 0 && pendingTasks.length > 0 && (
        <section className="rounded-2xl border border-surface-border bg-surface-card p-4">
          <p className="text-xs font-black text-ivory">تمت المتابعة</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {clearTasks.map((task) => (
              <span key={task.id} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {task.title}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
