import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  ReceiptText,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { useMyPaymentsQuery } from '../../hooks/queries/usePayments';
import { useRetryPaymentMutation } from '../../hooks/mutations/usePaymentMutations';
import { Payment, PaymentStatus } from '../../types/payment.types';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';

const STATUS_META: Record<
  PaymentStatus,
  { label: string; classes: string; icon: React.ReactNode }
> = {
  ACCEPTED: {
    label: 'ناجحة',
    classes: 'bg-green-500/15 text-green-400 border-green-500/30',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  PENDING: {
    label: 'قيد المراجعة',
    classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  REJECTED: {
    label: 'مرفوضة',
    classes: 'bg-red-500/15 text-red-400 border-red-500/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  EXPIRED: {
    label: 'منتهية',
    classes: 'bg-red-500/10 text-red-300/80 border-red-500/20',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  CANCELLED: {
    label: 'ملغاة',
    classes: 'bg-surface text-ivory-muted border-surface-border',
    icon: <Ban className="w-3.5 h-3.5" />,
  },
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const formatAmount = (amount: number | string) => `${Number(amount).toLocaleString('ar-EG')} ج.م`;

export const MyPaymentsPage: React.FC = () => {
  const { data: payments, isLoading } = useMyPaymentsQuery();
  const navigate = useNavigate();
  const { mutate: retryPayment, isPending: isRetrying } = useRetryPaymentMutation();

  const handleRetry = (payment: Payment) => {
    if (!payment.enrollmentId && !payment.enrollment?.id) return;
    const enrollmentId = payment.enrollmentId || payment.enrollment!.id;
    retryPayment(enrollmentId, {
      onSuccess: (checkout: any) => {
        toast.success('تم إنشاء طلب دفع جديد — أكمل خطوات الدفع');
        if (checkout?.paymentId || checkout?.orderReference) {
          navigate('/checkout', { state: { payment: checkout } });
        }
      },
      onError: () => toast.error('تعذر إنشاء طلب دفع جديد، حاول مرة أخرى'),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/25">
          <Wallet className="w-3.5 h-3.5 text-gold-400" />
          <span className="text-xs font-bold text-gold-300">حساب الطالب</span>
        </div>
        <h1 className="text-3xl font-bold font-amiri text-gold-300">مدفوعاتي</h1>
        <p className="text-xs sm:text-sm text-ivory-muted">
          سجل بكل عمليات الدفع عبر فودافون كاش — المبلغ، الكورس، التاريخ، وحالة كل عملية.
        </p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : !payments || payments.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface-card border border-surface-border text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
            <ReceiptText className="w-8 h-8 opacity-40" />
          </div>
          <h3 className="text-lg font-bold font-amiri text-ivory">لا توجد عمليات دفع بعد</h3>
          <p className="text-xs text-ivory-muted max-w-sm mx-auto">
            عندما تشترك في أي كورس مدفوع ستظهر تفاصيل العملية هنا كإيصال موثق.
          </p>
          <Link to="/courses">
            <Button variant="primary" size="sm">تصفح الكورسات</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(payments as Payment[]).map((p) => {
            const meta = STATUS_META[p.status] ?? STATUS_META.CANCELLED;
            const canRetry =
              p.status === 'REJECTED' && !!(p.enrollmentId || p.enrollment?.id);
            return (
              <div
                key={p.id}
                className="rounded-2xl bg-surface-card border border-surface-border p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400">
                      <ReceiptText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-bold text-ivory truncate">
                        {p.course?.title ?? 'عملية باقة'}
                      </p>
                      <p className="text-xs text-ivory-muted" dir="ltr">
                        #{p.orderReference}
                      </p>
                      <p className="text-[11px] text-ivory-muted">{formatDate(p.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${meta.classes}`}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className="text-base font-bold text-gold-300">
                      {formatAmount(p.amount)}
                    </span>
                  </div>
                </div>

                {/* Rejection reason for failed transactions */}
                {p.status === 'REJECTED' && p.rejectionReason && (
                  <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    سبب الرفض: {p.rejectionReason}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {p.status === 'ACCEPTED' && p.receiptImageUrl ? (
                    <a href={p.receiptImageUrl} target="_blank" rel="noreferrer" className="flex-1 max-w-[180px]">
                      <Button variant="outline" size="sm" className="w-full">
                        <span className="inline-flex items-center gap-1.5">
                          <ReceiptText className="w-3.5 h-3.5" />
                          عرض الإيصال
                        </span>
                      </Button>
                    </a>
                  ) : (
                    <span />
                  )}
                  {canRetry && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isRetrying}
                      onClick={() => handleRetry(p)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" />
                        أعد المحاولة
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
