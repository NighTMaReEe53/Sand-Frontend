import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';import {
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RotateCcw,
  PlayCircle,
  ArrowLeft,
  FileQuestion,
  AlertTriangle,
  GraduationCap,
  Wallet,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useMyPaymentsQuery } from '../../hooks/queries/usePayments';
import { useRetryPaymentMutation } from '../../hooks/mutations/usePaymentMutations';
import { formatPrice, formatGradeLevel, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { SkeletonPaymentCard } from '../../components/ui/Skeleton';
import { SectionHeading } from '../../components/ui/SectionHeading';

/* ═══════════════════════════════════════════════════════════════════
   Decorative hand-drawn style SVG doodles — books, pens & arrows.
   Module scope so their identity stays stable across renders.
   ═══════════════════════════════════════════════════════════════════ */

/** Floating open book (hero left edge) */
const BookDoodle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 64 52" fill="none" className={className} aria-hidden>
    <path d="M32 10 C26 4, 14 4, 6 8 V42 C14 38, 26 38, 32 44 C38 38, 50 38, 58 42 V8 C50 4, 38 4, 32 10 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M32 10 V44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M12 16 H24 M12 24 H22 M40 16 H52 M42 24 H52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

/** Fountain pen nib tilted (hero right edge) */
const PenDoodle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden>
    <path d="M30 6 L38 22 L34 40 H26 L22 22 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="30" cy="30" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M27 40 L30 54 L33 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M44 12 l8 -8" stroke="var(--secondary)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" />
  </svg>
);

/** Curved dashed doodle arrow (points toward content) */
const CurveArrowDoodle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 80 60" fill="none" className={className} aria-hidden>
    <path d="M70 8 C 48 14, 30 26, 18 46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 7" />
    <path d="M26 38 L17 49 L12 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Straight dashed arrow */
const LineArrowDoodle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 96 40" fill="none" className={className} aria-hidden>
    <path d="M92 20 H10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 6" />
    <path d="M20 10 L8 20 L20 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Concentric dashed circles backdrop */
const CirclesDoodle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
    <circle cx="100" cy="100" r="92" stroke="currentColor" strokeDasharray="6 10" />
    <circle cx="100" cy="100" r="62" stroke="currentColor" strokeDasharray="4 8" />
    <circle cx="100" cy="100" r="32" stroke="currentColor" />
    <circle cx="100" cy="8" r="4" fill="var(--secondary)" opacity="0.5" />
  </svg>
);

/* ═══════════════════ Status system ═══════════════════ */

type PaymentStatusKey = 'ACCEPTED' | 'PENDING' | 'REJECTED' | 'EXPIRED';

const STATUS_META: Record<
  PaymentStatusKey,
  {
    label: string;
    icon: React.ElementType;
    chip: string;
    bar: string;
    glowHover: string;
    statText: string;
  }
> = {
  ACCEPTED: {
    label: 'مفعّل ونشط',
    icon: CheckCircle2,
    chip: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    bar: 'bg-gradient-to-b from-emerald-400 to-emerald-600',
    glowHover: 'hover:border-emerald-500/50',
    statText: 'text-emerald-300',
  },
  PENDING: {
    label: 'قيد المراجعة',
    icon: Clock,
    chip: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    bar: 'bg-gradient-to-b from-amber-300 to-amber-500',
    glowHover: 'hover:border-amber-500/50',
    statText: 'text-amber-300',
  },
  REJECTED: {
    label: 'مرفوض',
    icon: XCircle,
    chip: 'bg-red-500/10 border-red-500/30 text-red-300',
    bar: 'bg-gradient-to-b from-red-400 to-red-600',
    glowHover: 'hover:border-red-500/50',
    statText: 'text-red-300',
  },
  EXPIRED: {
    label: 'منتهي الصلاحية',
    icon: AlertCircle,
    chip: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
    bar: 'bg-gradient-to-b from-slate-400 to-slate-600',
    glowHover: 'hover:border-slate-500/50',
    statText: 'text-slate-300',
  },
};

type TabKey = 'ALL' | 'ISSUES' | PaymentStatusKey;

/* ═══════════════════ Page ═══════════════════ */

export const MyCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: paymentsData, isLoading, isError } = useMyPaymentsQuery();
  const payments = useMemo(
    () => (Array.isArray(paymentsData) ? paymentsData : []),
    [paymentsData]
  );
  const { mutate: retryPayment, isPending: isRetrying } = useRetryPaymentMutation();
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');

  const handleRetry = (enrollmentId: string) => {
    retryPayment(enrollmentId, {
      onSuccess: () => {
        navigate('/checkout');
      },
    });
  };

  /* ─── Aggregates for stats strip ─── */
  const stats = useMemo(() => {
    const count = (s: PaymentStatusKey) => payments.filter((p: any) => p.status === s).length;
    return [
      { key: 'total', icon: Layers, value: payments.length, label: 'إجمالي الاشتراكات', tint: 'text-gold-300' },
      { key: 'ACCEPTED', icon: CheckCircle2, value: count('ACCEPTED'), label: 'كورسات نشطة', tint: STATUS_META.ACCEPTED.statText },
      { key: 'PENDING', icon: Clock, value: count('PENDING'), label: 'قيد المراجعة', tint: STATUS_META.PENDING.statText },
      { key: 'issues', icon: AlertCircle, value: count('REJECTED') + count('EXPIRED'), label: 'تحتاج انتباه', tint: STATUS_META.REJECTED.statText },
    ];
  }, [payments]);

  /* ─── Tabs ─── */
  const tabs: { key: TabKey; label: string }[] = useMemo(() => {
    const count = (s: PaymentStatusKey) => payments.filter((p: any) => p.status === s).length;
    return [
      { key: 'ALL', label: `الكل (${payments.length})` },
      ...(count('ACCEPTED') > 0 ? [{ key: 'ACCEPTED' as TabKey, label: `نشطة (${count('ACCEPTED')})` }] : []),
      ...(count('PENDING') > 0 ? [{ key: 'PENDING' as TabKey, label: `قيد المراجعة (${count('PENDING')})` }] : []),
      ...(count('REJECTED') + count('EXPIRED') > 0
        ? [{ key: 'ISSUES' as TabKey, label: `تحتاج إجراء (${count('REJECTED') + count('EXPIRED')})` }]
        : []),
    ];
  }, [payments]);

  const visiblePayments = payments.filter((p: any) => {
    if (activeTab === 'ALL' || activeTab === 'ISSUES') {
      return activeTab === 'ALL'
        ? true
        : p.status === 'REJECTED' || p.status === 'EXPIRED';
    }
    return p.status === activeTab;
  });

  return (
    <div className="relative min-h-screen overflow-hidden text-right">
      {/* ═══════════ Decorative background layer ═══════════ */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        <div
          className="absolute -top-24 left-1/4 h-96 w-96 rounded-full opacity-60"
          style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--primary) 10%, transparent), transparent)' }}
        />
        {/* concentric circles top-left */}
        <CirclesDoodle className="absolute -top-10 -left-10 h-56 w-56 rotate-12 text-gold-500/15" />
        {/* open book right edge */}
        <BookDoodle className="absolute top-24 right-[3%] hidden h-16 w-20 -rotate-6 text-gold-500/25 lg:block" />
        {/* fountain pen left edge */}
        <PenDoodle className="absolute bottom-40 left-[4%] hidden h-16 w-16 rotate-[18deg] text-gold-500/20 lg:block" />
        {/* small book near footer */}
        <BookDoodle className="absolute bottom-10 right-[8%] hidden h-12 w-14 rotate-3 text-gold-500/15 xl:block" />
        {/* straight dashed arrow mid-page */}
        <LineArrowDoodle className="absolute top-[46%] left-[6%] hidden h-8 w-20 -scale-x-100 text-gold-500/20 lg:block" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ═══════════ HERO ═══════════ */}
        <section className="relative mb-10">
          {/* curved arrow pointing to the heading */}
          <CurveArrowDoodle className="pointer-events-none absolute -top-6 right-full hidden w-20 -scale-x-100 text-gold-500/35 md:block" />

          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-bold text-gold-300 shadow-gold-glow">
            <GraduationCap className="h-4 w-4" />
            رحلتك التعليمية في مكان واحد
          </div>

          <SectionHeading
            as="h1"
            accent="wave"
            icon={<Wallet className="hidden h-7 w-7 text-gold-500/70 sm:block" />}
            subtitle="تابع حالة مدفوعاتك وتفعيل كورساتك، وانتقل مباشرة لمحاضراتك وامتحاناتك من هنا."
            className="mt-4 [&_p]:max-w-xl"
          >
            كورساتي واشتراكاتي
          </SectionHeading>

          <Link
            to="/my-backlog"
            className="group mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-amber-500/15"
          >
            <AlertTriangle className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-12" />
            عرض قائمة المتأخرات
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
          </Link>
        </section>

        {/* ═══════════ STATS STRIP ═══════════ */}
        {!isLoading && payments.length > 0 && (
          <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {stats.map((s) => (
              <div
                key={s.key}
                className="group relative overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-4 text-center shadow-card-dark transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-gold-glow-lg"
              >
                {/* corner accent */}
                <span aria-hidden className="absolute -left-6 -top-6 h-14 w-14 rounded-full bg-gold-500/10 transition-transform duration-500 group-hover:scale-150" />
                <s.icon className={`mx-auto mb-2 h-5 w-5 ${s.tint}`} />
                <p className="font-display text-2xl font-black tabular-nums text-ivory">{s.value}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-ivory-muted">{s.label}</p>
              </div>
            ))}
          </section>
        )}

        {/* ═══════════ TABS ═══════════ */}
        {!isLoading && payments.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {tabs.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                    active
                      ? 'bg-gold-gradient text-bg shadow-gold-glow-lg -translate-y-0.5'
                      : 'border border-surface-border bg-surface-card text-ivory-muted hover:border-gold-500/40 hover:text-gold-300'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ═══════════ CONTENT ═══════════ */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonPaymentCard key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-red-500/25 bg-red-500/5 p-14 text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-400/70" />
            <h3 className="mt-3 font-amiri text-lg font-bold text-ivory">تعذر تحميل اشتراكاتك</h3>
            <p className="mt-1 text-xs text-ivory-muted">حدث خطأ أثناء جلب البيانات، حاول تحديث الصفحة.</p>
          </div>
        ) : !payments || payments.length === 0 ? (
          /* ─── Creative empty state ─── */
          <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface-card p-16 text-center shadow-card-dark-lg">
            {/* orbiting doodles */}
            <CirclesDoodle className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 text-gold-500/10" />
            <CurveArrowDoodle className="pointer-events-none absolute bottom-10 right-10 hidden w-16 -scale-y-100 text-gold-500/30 sm:block" />
            <PenDoodle className="pointer-events-none absolute -bottom-4 left-8 h-16 w-16 -rotate-45 text-gold-500/20" />

            <div className="relative mx-auto w-fit">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gold-500/25 bg-gold-500/10 shadow-gold-glow">
                <BookOpen className="h-10 w-10 text-gold-400 opacity-80" strokeWidth={1.4} />
              </div>
              {/* sparkle dots around the book */}
              <span className="absolute -right-3 -top-2 h-2 w-2 animate-ping rounded-full bg-gold-400/70" />
              <span className="absolute -right-3 -top-2 h-2 w-2 rounded-full bg-gold-400" />
              <span className="absolute -bottom-2 -left-4 h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
            </div>

            <h3 className="relative mt-6 font-amiri text-xl font-bold text-gold-200">
              لسه ما بدأت رحلتك!
            </h3>
            <p className="relative mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ivory-muted">
              لا توجد اشتراكات حتى الآن — تصفح الكورسات المتاحة واختر ما يناسب صفك الدراسي وابدأ من أول درس النهاردة.
            </p>
            <Link to="/courses" className="relative mt-6 inline-block">
              <Button size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
                تصفح الكورسات
              </Button>
            </Link>
          </div>
        ) : visiblePayments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gold-500/30 bg-surface-card/60 p-14 text-center">
            <Layers className="mx-auto h-9 w-9 text-gold-500/40" />
            <p className="mt-3 text-sm font-bold text-ivory">لا يوجد شيء في هذا التصنيف</p>
            <button
              onClick={() => setActiveTab('ALL')}
              className="mt-3 cursor-pointer text-xs font-bold text-gold-300 underline-offset-4 hover:underline"
            >
              عرض جميع الاشتراكات
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePayments.map((payment: any) => {
              const course = payment.course;
              const meta = STATUS_META[payment.status as PaymentStatusKey] ?? STATUS_META.EXPIRED;
              const StatusIcon = meta.icon;

              return (
                <article
                  key={payment.id}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-card-dark transition-all duration-300 hover:-translate-y-1 hover:shadow-gold-glow-lg md:flex-row md:items-center ${meta.glowHover}`}
                >
                  {/* status gradient spine (right side for RTL) */}
                  <span aria-hidden className={`absolute inset-y-0 right-0 w-1.5 ${meta.bar} opacity-80`} />

                  {/* faint book watermark */}
                  <BookDoodle className="pointer-events-none absolute -bottom-5 left-6 h-20 w-24 rotate-[-8deg] text-gold-500/[0.07]" />

                  {/* ─── Course details ─── */}
                  <div className="flex flex-1 items-start gap-4 p-5 pr-7">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-surface-border bg-bg-subtle">
                      {course?.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gold-500/40">
                          <BookOpen className="h-8 w-8" strokeWidth={1.3} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-amiri text-base font-bold text-ivory transition-colors group-hover:text-gold-200">
                          {course?.title || 'كورس محذوف'}
                        </h3>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${meta.chip}`}>
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </div>

                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-ivory-muted">
                        {course?.gradeLevel && (
                          <>
                            <GraduationCap className="h-3.5 w-3.5 text-gold-500/70" />
                            {formatGradeLevel(course?.gradeLevel)}
                            <span className="text-ivory-muted/40">•</span>
                          </>
                        )}
                        المبلغ:{' '}
                        <span className="font-black tabular-nums text-gold-300">{formatPrice(payment.amount)}</span>
                      </p>

                      <p className="text-[11px] text-ivory-muted/70">
                        الرقم المرجعي: <span dir="ltr" className="font-medium text-ivory-muted">{payment.orderReference}</span>
                        <span className="mx-1.5 text-ivory-muted/40">•</span>
                        {formatDate(payment.createdAt)}
                      </p>

                      {payment.rejectionReason && payment.status === 'REJECTED' && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-red-300">
                          سبب الرفض: {payment.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ─── Actions ─── */}
                  <div className="flex w-full items-center gap-2.5 self-end p-5 pt-0 md:w-auto md:self-center md:pt-0 md:pl-7">
                    {payment.status === 'ACCEPTED' && (
                      <>
                        <Link to={`/courses/${payment.courseId}/learn`} className="flex-1 md:flex-none">
                          <Button variant="secondary" size="sm" className="w-full" leftIcon={<PlayCircle className="w-4 h-4" />}>
                            متابعة التعلم
                          </Button>
                        </Link>
                        <Link to={`/courses/${payment.courseId}/exams`} className="flex-1 md:flex-none">
                          <Button variant="outline" size="sm" className="w-full" leftIcon={<FileQuestion className="w-4 h-4" />}>
                            الامتحانات
                          </Button>
                        </Link>
                        <Link to={`/my-mistakes/practice?courseId=${payment.courseId}`} className="flex-1 md:flex-none" title="امتحان تدريبي من أخطاء هذا الكورس">
                          <Button variant="ghost" size="sm" className="w-full text-gold-300 hover:text-gold-200 border border-gold-500/20 hover:border-gold-500/40" leftIcon={<Sparkles className="w-4 h-4 text-gold-400" />}>
                            تدرب على أخطائك
                          </Button>
                        </Link>
                      </>
                    )}

                    {payment.status === 'PENDING' && (
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-amber-300/90">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                        </span>
                        الإيصال تحت المراجعة من الأستاذ…
                      </span>
                    )}

                    {(payment.status === 'REJECTED' || payment.status === 'EXPIRED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={isRetrying}
                        onClick={() => handleRetry(payment.enrollmentId)}
                        leftIcon={<RotateCcw className="w-4 h-4" />}
                      >
                        إعادة المحاولة
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
