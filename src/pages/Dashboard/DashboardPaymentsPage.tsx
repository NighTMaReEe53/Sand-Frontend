import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  SearchX,
  Wallet,
  BookOpen,
  Phone,
  Hash,
  CalendarDays,
  ImageOff,
  Library,
  Inbox,
  UserRound,
  UserMinus,
} from 'lucide-react';
import { useTeacherPaymentsQuery } from '../../hooks/queries/usePayments';
import {
  useAcceptPaymentMutation,
  useRejectPaymentMutation,
} from '../../hooks/mutations/usePaymentMutations';
import { teacherStudentsApi } from '../../api/phase2-teacher.api';
import { Payment, PaymentStatus } from '../../types/payment.types';
import { formatPrice, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';

const STATUS_META: Record<
  PaymentStatus,
  { label: string; dot: string; badgeVariant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  ACCEPTED: { label: 'مقبول ومفعّل', dot: 'bg-emerald-400', badgeVariant: 'success' },
  PENDING: { label: 'في انتظار المراجعة', dot: 'bg-amber-400 animate-pulse', badgeVariant: 'warning' },
  REJECTED: { label: 'مرفوض', dot: 'bg-red-400', badgeVariant: 'danger' },
  EXPIRED: { label: 'منتهي الصلاحية', dot: 'bg-ivory-dark', badgeVariant: 'neutral' },
  CANCELLED: { label: 'ملغي', dot: 'bg-ivory-dark', badgeVariant: 'neutral' },
};

const FILTERS: { value: PaymentStatus | 'ALL'; label: string; icon: React.ElementType }[] = [
  { value: 'PENDING', label: 'قيد الانتظار', icon: Inbox },
  { value: 'ACCEPTED', label: 'المقبولة', icon: CheckCircle },
  { value: 'REJECTED', label: 'المرفوضة', icon: XCircle },
  { value: 'ALL', label: 'الكل', icon: Library },
];

export const DashboardPaymentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('PENDING');
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const { data: paymentsData, isLoading } = useTeacherPaymentsQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: 50,
  });

  const payments: Payment[] = Array.isArray(paymentsData)
    ? paymentsData
    : paymentsData?.data || [];
  const totalCount = !Array.isArray(paymentsData) ? paymentsData?.total ?? payments.length : payments.length;

  // Modals state
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [acceptingPaymentId, setAcceptingPaymentId] = useState<string | null>(null);

  const { mutate: acceptPayment, isPending: isAccepting } = useAcceptPaymentMutation();
  const { mutate: rejectPayment, isPending: isRejecting } = useRejectPaymentMutation();

  const handleAccept = (paymentId: string) => {
    setAcceptingPaymentId(paymentId);
    acceptPayment(paymentId, {
      onSuccess: () => toast.success('تم قبول الدفعة وتفعيل اشتراك الطالب'),
      onError: (err: any) =>
        toast.error(err?.response?.data?.message ?? 'تعذر قبول الدفعة — حاول مجدداً'),
      onSettled: () => {
        setAcceptingPaymentId(null);
      },
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment || !rejectionReason.trim()) return;

    rejectPayment(
      { paymentId: rejectingPayment.id, data: { rejectionReason: rejectionReason.trim() } },
      {
        onSuccess: () => {
          setRejectingPayment(null);
          setRejectionReason('');
          toast.success('تم رفض الدفعة وإشعار الطالب بالسبب');
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message ?? 'تعذر رفض الدفعة — حاول مجدداً'),
      }
    );
  };

  const handleRemoveStudent = async (payment: Payment) => {
    const courseId = payment.course?.id;
    const studentId = payment.enrollment?.student?.id;
    const fullName = payment.enrollment?.student?.fullName ?? 'الطالب';
    if (!courseId || !studentId) return;
    if (
      !window.confirm(
        `إزالة الطالب ${fullName} من كورس «${payment.course?.title}»؟ سيتم إلغاء اشتراكه.`
      )
    )
      return;
    setRemovingKey(payment.id);
    try {
      await teacherStudentsApi.removeStudentFromCourse(courseId, studentId);
      toast.success('تمت إزالة الطالب من الكورس بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['teacher-payments'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر إزالة الطالب من الكورس.');
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <div className="space-y-8 text-right">
      {/* ─── Header with decorative vectors ─────────────────────────── */}
      <div className="relative">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-10 h-64 w-full text-gold-500 opacity-[0.05]"
          viewBox="0 0 1440 256"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <pattern id="payments-hatch" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="1440" height="256" fill="url(#payments-hatch)" />
          <circle cx="1350" cy="16" r="140" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="90" cy="240" r="110" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <span className="absolute -inset-2 rounded-2xl border border-dashed border-gold-500/30 rotate-6" aria-hidden />
              <div className="flex w-14 h-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold-glow">
                <Wallet className="w-7 h-7 text-bg" strokeWidth={1.8} />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">
                مراجعة مدفوعات فودافون كاش
              </h1>
              <p className="text-xs sm:text-sm text-ivory-muted">
                فحص صور إيصالات التحويل وتأكيد تفعيل اشتراكات الطلاب أو رفضها بالسبب.
              </p>
            </div>
          </div>

          {/* Filter tabs with icons + live count */}
          {!isLoading && (
            <div className="flex flex-wrap items-center bg-surface-card p-1 rounded-2xl border border-surface-border text-xs gap-1">
              {FILTERS.map((f) => {
                const FilterIcon = f.icon;
                const active = statusFilter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-all ${
                      active
                        ? 'bg-gold-gradient text-bg font-bold shadow-gold-glow'
                        : 'text-ivory-muted hover:text-ivory'
                    }`}
                  >
                    <FilterIcon className="w-3.5 h-3.5" />
                    {f.label}
                    {active && totalCount > 0 && (
                      <span
                        className={`ms-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-black ${
                          active ? 'bg-bg/20 text-bg' : 'bg-gold-500/15 text-gold-300'
                        }`}
                      >
                        {totalCount > 50 ? '50+' : totalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── List / Table ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="relative overflow-hidden p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-5">
          <svg aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 text-gold-500/10" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 7" />
            <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
          </svg>

          <div className="relative mx-auto w-24 h-24">
            <span className="absolute inset-0 rounded-full bg-gold-500/10 animate-ping opacity-30" style={{ animationDuration: '2.6s' }} />
            <span className="absolute -inset-2.5 rounded-full border-2 border-dashed border-gold-500/25 rotate-12" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 shadow-gold-glow">
              <SearchX className="w-11 h-11 text-bg" strokeWidth={1.6} />
            </div>
          </div>
          <h3 className="text-lg font-bold font-amiri text-ivory">لا توجد طلبات دفع بهذه الحالة</h3>
          <p className="text-xs text-ivory-muted max-w-sm mx-auto leading-relaxed">
            جميع الطلبات مفحوصة أو لا توجد تحويلات واردة جديدة حالياً.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment: Payment) => {
            const student = payment.enrollment?.student;
            const user = student?.user;
            const statusMeta = STATUS_META[payment.status];
            const isPending = payment.status === 'PENDING';

            return (
              <div
                key={payment.id}
                className={`group relative overflow-hidden p-5 rounded-2xl bg-surface-card border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
                  isPending
                    ? 'border-amber-500/25 hover:border-amber-500/45'
                    : 'border-surface-border hover:border-gold-500/40'
                }`}
              >
                {/* Top accent line */}
                <span
                  className={`absolute top-0 right-0 left-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-l from-transparent to-transparent ${
                    isPending ? 'via-amber-400/80' : 'via-gold-500/80'
                  }`}
                />
                {/* Corner ring vector */}
                <svg aria-hidden className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 text-gold-500/10 group-hover:text-gold-500/20 group-hover:rotate-45 transition-all duration-500" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
                  <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1" opacity="0.55" />
                </svg>

                <div className="relative z-[1] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  {/* Student & Course Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Avatar */}
                    <span className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/30 text-base font-black text-gold-300">
                      {(student?.fullName || '؟').slice(0, 1)}
                    </span>

                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-bold font-amiri text-ivory flex items-center gap-2">
                          <UserRound className="w-4 h-4 text-ivory-dark lg:hidden" />
                          {student?.fullName || 'طالب غير محدد'}
                        </h3>
                        <Badge variant={statusMeta.badgeVariant}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full me-1 ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ivory-muted">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <BookOpen className="w-3.5 h-3.5 text-gold-500/70 shrink-0" />
                          الكورس: <strong className="text-ivory truncate">{payment.course?.title}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-ivory-dark shrink-0" />
                          <span dir="ltr">{user?.phone || '—'}</span>
                          <span className="text-ivory-dark">ولي الأمر:</span>
                          <span dir="ltr">{student?.guardianPhone || '—'}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ivory-muted/70">
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3 shrink-0" />
                          <span dir="ltr">{payment.orderReference}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3 shrink-0" />
                          {formatDate(payment.createdAt)}
                        </span>
                      </div>

                      {payment.rejectionReason && payment.status === 'REJECTED' && (
                        <p className="flex items-start gap-1.5 text-xs text-red-400 mt-1 leading-relaxed">
                          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          سبب الرفض المسجل: {payment.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount + Receipt + Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-end lg:self-center shrink-0">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-sm font-black text-emerald-400">
                      <Wallet className="w-4 h-4" />
                      {formatPrice(payment.amount)}
                    </span>

                    {payment.receiptImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingReceiptUrl(payment.receiptImageUrl || '')}
                        title="معاينة الإيصال"
                        className="group/receipt relative w-14 h-14 rounded-xl overflow-hidden border border-surface-border hover:border-gold-500/60 transition-all hover:scale-105 active:scale-95"
                      >
                        <img
                          src={payment.receiptImageUrl}
                          alt="إيصال التحويل"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 group-hover/receipt:opacity-100 transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] text-amber-400/80 px-2.5 py-2 rounded-xl bg-amber-400/10 border border-amber-400/25">
                        <ImageOff className="w-3.5 h-3.5" />
                        لم يُرفع إيصال بعد
                      </span>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          isLoading={isAccepting && acceptingPaymentId === payment.id}
                          onClick={() => handleAccept(payment.id)}
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                        >
                          قبول وتفعيل
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectingPayment(payment)}
                          leftIcon={<XCircle className="w-4 h-4" />}
                        >
                          رفض
                        </Button>
                      </div>
                    )}

                    {payment.course?.id && payment.enrollment?.student?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={removingKey === payment.id}
                        onClick={() => handleRemoveStudent(payment)}
                        leftIcon={<UserMinus className="w-4 h-4" />}
                        title="إزالة الطالب من هذا الكورس"
                      >
                        إزالة من الكورس
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── View Receipt Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={!!viewingReceiptUrl}
        onClose={() => setViewingReceiptUrl(null)}
        title="معاينة إيصال تحويل فودافون كاش"
        maxWidth="lg"
      >
        <div className="space-y-4 text-center">
          {viewingReceiptUrl && (
            <div className="max-h-[65vh] overflow-auto rounded-xl border border-surface-border bg-bg p-2 flex items-center justify-center">
              <img
                src={viewingReceiptUrl}
                alt="Vodafone Cash Receipt"
                className="max-w-full h-auto rounded-lg object-contain"
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setViewingReceiptUrl(null)}>
              إغلاق المعاينة
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Reject Confirmation Modal with Mandatory Reason ─────────── */}
      <Modal
        isOpen={!!rejectingPayment}
        onClose={() => {
          setRejectingPayment(null);
          setRejectionReason('');
        }}
        title="رفض إيصال التحويل"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 text-right">
          <div className="relative overflow-hidden p-4 rounded-2xl bg-red-500/5 border border-red-500/25 flex items-start gap-3">
            <svg aria-hidden className="pointer-events-none absolute -top-5 -left-5 w-20 h-20 text-red-500/15" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" />
            </svg>
            <span className="relative flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/35">
              <XCircle className="w-5 h-5 text-red-400" />
            </span>
            <p className="relative text-xs text-ivory-muted leading-relaxed">
              يرجى كتابة سبب رفض التحويل بوضوح ليظهر للطالب في حسابه ليتمكن من معالجته وإعادة رفع
              إيصال صحيح.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              سبب الرفض (إلزامي)
            </label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: رقم المحفظة المحول منها غير مسجل، أو المبلغ المحول ناقص..."
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-red-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setRejectingPayment(null);
                setRejectionReason('');
              }}
            >
              إلغاء
            </Button>
            <Button type="submit" variant="danger" isLoading={isRejecting}>
              تأكيد رفض الدفعة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
