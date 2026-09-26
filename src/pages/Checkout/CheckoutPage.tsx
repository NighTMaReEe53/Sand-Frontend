import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  CreditCard,
  Copy,
  Check,
  Upload,
  Clock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  TicketPercent,
  XCircle,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import {
  useCheckoutMutation,
  useSubmitReceiptMutation,
  useCancelPaymentMutation,
} from '../../hooks/mutations/usePaymentMutations';
import { axiosInstance } from '../../api/axiosInstance';
import { formatPrice, formatGradeLevel } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CoursePrice } from '../../components/ui/CoursePrice';

// ─── Local storage key لحفظ بيانات الدفع الجارية ──────────────────────────
const CHECKOUT_STORAGE_KEY = 'sanad_checkout';

interface CheckoutData {
  paymentId: string;
  orderReference: string;
  amount: number;
  vodafoneCashNumber: string;
  expiresAt: string;
  instructions: string;
}

export const CheckoutPage: React.FC = () => {
  const { items, removeItem, clearCart, getTotalPrice } = useCartStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bundleIdParam = searchParams.get('bundle');

  // ─── حالة الكوبون ──────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponCode: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // ─── استرجاع بيانات الدفع من localStorage عند الـ refresh ────────────────
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (!saved) return null;
      const parsed: CheckoutData = JSON.parse(saved);
      // لو انتهت المدة يمسحه تلقائياً
      if (new Date(parsed.expiresAt).getTime() < Date.now()) {
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  const { mutate: checkout, isPending: isCheckingOut } = useCheckoutMutation();
  const { mutate: submitReceipt, isPending: isSubmittingReceipt } = useSubmitReceiptMutation();
  const { mutate: cancelPayment, isPending: isCancelling } = useCancelPaymentMutation();

  // ─── Auto-cancel pending checkout if cart becomes empty ──────────────────
  const handleCancelCheckout = () => {
    if (!checkoutData?.paymentId) return;
    cancelPayment(checkoutData.paymentId, {
      onSuccess: () => {
        setCheckoutData(null);
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        setUploadError(null);
      },
      onError: () => {
        // Even on error, clear local state to unblock the UI
        setCheckoutData(null);
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      },
    });
  };

  // ─── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!checkoutData?.expiresAt) return;

    const interval = setInterval(() => {
      const distance = new Date(checkoutData.expiresAt).getTime() - new Date().getTime();

      if (distance < 0) {
        setTimeLeft('انتهت صلاحية الطلب');
        clearInterval(interval);
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [checkoutData?.expiresAt]);

  const handleCopyWallet = () => {
    if (checkoutData?.vodafoneCashNumber) {
      navigator.clipboard.writeText(checkoutData.vodafoneCashNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleValidateCoupon = async () => {
    setCouponError(null);
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const target = bundleIdParam
        ? { bundleId: bundleIdParam }
        : { courseId: items[0]?.id };
      if (!target.bundleId && !target.courseId) {
        setCouponError('لا يوجد منتج لتطبيق الكوبون عليه.');
        return;
      }
      const res = await axiosInstance.post('/coupons/validate', { code: couponInput.trim(), ...target });
      setAppliedCoupon(res.data);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'كود الخصم غير صالح.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleInitiateCheckout = () => {
    const target = bundleIdParam
      ? { bundleId: bundleIdParam }
      : items.length > 0
        ? { courseId: items[0].id }
        : null;
    if (!target) return;

    checkout(
      {
        ...target,
        ...(appliedCoupon && { couponCode: appliedCoupon.couponCode }),
      },
      {
        onSuccess: (res) => {
          const data: CheckoutData = {
            paymentId: res.paymentId,
            orderReference: res.orderReference,
            amount: res.amount,
            vodafoneCashNumber: res.vodafoneCashNumber,
            expiresAt: res.expiresAt,
            instructions: res.instructions,
          };
          setCheckoutData(data);
          // ─── حفظ في localStorage عشان الـ refresh ────────────────
          localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.message || 'تعذر إنشاء طلب الدفع، قد تكون مشتركاً بالفعل في هذا الكورس';
          // لو الطالب عنده طلب pending بالفعل
          if (err.response?.status === 409) {
            setUploadError('لديك طلب دفع قيد المراجعة بالفعل لهذا الكورس. انتظر مراجعة الأستاذ أو تواصل معه.');
          } else {
            setUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg));
          }
        },
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setFileError('صيغة الملف غير مدعومة. يرجى رفع صورة بصيغة JPG أو PNG أو WebP');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmitReceipt = () => {
    if (!selectedFile || !checkoutData?.paymentId) {
      setFileError('يرجى اختيار صورة الإيصال أولاً');
      return;
    }

    setUploadError(null);
    submitReceipt(
      { paymentId: checkoutData.paymentId, file: selectedFile },
      {
        onSuccess: () => {
          setIsSuccess(true);
          clearCart();
          // مسح بيانات الـ checkout من localStorage بعد النجاح
          localStorage.removeItem(CHECKOUT_STORAGE_KEY);
        },
        onError: (err: any) => {
          const status = err.response?.status;
          if (status === 409) {
            setUploadError('تم استخدام صورة هذا الإيصال مسبقاً في عملية دفع أخرى. يرجى رفع إيصال تحويل صحيح.');
          } else {
            const msg = err.response?.data?.message || 'فشل رفع الإيصال، يرجى المحاولة مرة أخرى';
            setUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg));
          }
        },
      }
    );
  };

  // ─── SUCCESS VIEW ─────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-amiri text-gold-300">
            تم إرسال إيصال الدفع بنجاح!
          </h2>
          <p className="text-xs sm:text-sm text-ivory-muted leading-relaxed">
            طلبك الآن قيد المراجعة بواسطة الأستاذ. سيتم تفعيل الكورس تلقائياً فور تأكيد التحويل.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
          الرقم المرجعي للعملية:{' '}
          <span className="text-gold-300 font-bold" dir="ltr">
            {checkoutData?.orderReference}
          </span>
        </div>

        <div className="pt-2">
          <Link to="/my-courses">
            <Button size="lg" className="w-full">
              الذهاب إلى صفحة كورساتي
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right">
      {/* Header */}
      <div className="space-y-1">
        <Badge variant="gold">إتمام الطلب والدفع</Badge>
        <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">
          الدفع عبر فودافون كاش
        </h1>
      </div>

      {uploadError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main Column: Instructions & Receipt Upload */}
        <div className="lg:col-span-2 space-y-6">
          {!checkoutData ? (
            /* Step 1: Initiate */
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-5">
              <h3 className="text-lg font-bold font-amiri text-gold-300">
                1. تأكيد الطلب وإنشاء مرجع الدفع
              </h3>
              <p className="text-xs text-ivory-muted leading-relaxed">
                اضغط على الزر أدناه للحصول على رقم محفظة فودافون كاش الرسمية والرقم المرجعي الخاص بك.
              </p>

              <Button
                onClick={handleInitiateCheckout}
                isLoading={isCheckingOut}
                disabled={items.length === 0 && !bundleIdParam}
                size="lg"
                className="w-full"
                leftIcon={<CreditCard className="w-5 h-5" />}
              >
                إنشاء طلب الدفع الآن
              </Button>
            </div>
          ) : (
            /* Step 2: Payment Instructions + Receipt Upload */
            <div className="space-y-6">
              {/* Payment Details Card */}
              <div className="p-6 rounded-2xl bg-surface-card border border-gold-500/30 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="block text-xs text-ivory-muted">الرقم المرجعي للطلب:</span>
                    <span className="text-sm font-bold text-gold-300 font-mono" dir="ltr">
                      {checkoutData.orderReference}
                    </span>
                  </div>
                  {/* Cancel checkout */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelCheckout}
                    isLoading={isCancelling}
                    leftIcon={<XCircle className="w-4 h-4 text-red-400" />}
                    className="text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 shrink-0"
                  >
                    إلغاء الطلب
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-ivory-muted">الوقت المتبقي لرفع الإيصال:</span>
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>{timeLeft}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-3">
                  <span className="block text-xs text-ivory-muted">
                    حوّل مبلغ{' '}
                    <strong className="text-gold-300 text-sm">
                      {formatPrice(checkoutData.amount)}
                    </strong>{' '}
                    إلى رقم محفظة فودافون كاش التالي:
                  </span>

                  {/* ─── رقم المحفظة ─────────────────────────────────── */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-bg border border-gold-500/30">
                    <span className="text-base sm:text-lg font-bold text-gold-300 font-mono tracking-widest" dir="ltr">
                      {checkoutData.vodafoneCashNumber || '—'}
                    </span>

                    <button
                      onClick={handleCopyWallet}
                      disabled={!checkoutData.vodafoneCashNumber}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gold-500/15 hover:bg-gold-500/30 text-gold-300 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ الرقم'}</span>
                    </button>
                  </div>

                  {/* تعليمات الدفع */}
                  {checkoutData.instructions && (
                    <p className="text-xs text-ivory-muted leading-relaxed border-t border-surface-border pt-3">
                      {checkoutData.instructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Receipt Upload Box */}
              <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
                <h3 className="text-base font-bold font-amiri text-gold-300">
                  2. رفع صورة إيصال التحويل (سكرين شوت)
                </h3>

                {fileError && (
                  <p className="text-xs text-red-400 font-medium">{fileError}</p>
                )}

                <label className="block border-2 border-dashed border-gold-500/30 hover:border-gold-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-surface/30 group">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {previewUrl ? (
                    <div className="space-y-3">
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="max-h-48 mx-auto rounded-lg border border-gold-500/30 object-contain shadow-md"
                      />
                      <span className="block text-xs text-gold-400 underline">
                        تغيير الصورة المحددة
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="block text-sm font-bold text-ivory">
                        اضغط لرفع صورة إيصال فودافون كاش
                      </span>
                      <span className="block text-xs text-ivory-muted">
                        JPG, PNG, WebP (بحد أقصى 5 ميجابايت)
                      </span>
                    </div>
                  )}
                </label>

                <Button
                  onClick={handleSubmitReceipt}
                  isLoading={isSubmittingReceipt}
                  disabled={!selectedFile}
                  size="lg"
                  className="w-full mt-2"
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                >
                  تأكيد وإرسال الإيصال
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-5">
            <h3 className="text-base font-bold font-amiri text-gold-300">
              {bundleIdParam ? 'ملخص الباقة' : 'ملخص الكورسات'}
            </h3>

            {bundleIdParam ? (
              <p className="text-xs text-ivory-muted">
                ستتم ترقية اشتراكك في جميع كورسات الباقة المدفوعة بعد تأكيد الدفع.
              </p>
            ) : (
              <div className="divide-y divide-surface-border space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="block font-bold text-ivory line-clamp-1">{item.title}</span>
                      <span className="block text-ivory-muted">{formatGradeLevel(item.gradeLevel)}</span>
                    </div>
                    <CoursePrice
                      price={item.price}
                      isFree={item.isFree}
                      size="xs"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Coupon input */}
            {!checkoutData && (
              <div className="pt-4 border-t border-surface-border space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gold-300">
                  <TicketPercent className="w-4 h-4" />
                  كود الخصم
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="أدخل الكود إن وجد"
                    dir="ltr"
                    className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleValidateCoupon}
                    isLoading={isValidatingCoupon}
                    disabled={!couponInput.trim()}
                  >
                    تطبيق
                  </Button>
                </div>
                {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
                {appliedCoupon && (
                  <div className="space-y-1 text-[11px] p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-emerald-400 font-bold">✓ تم تطبيق الكود: {appliedCoupon.couponCode}</p>
                    {appliedCoupon.discountAmount > 0 && (
                      <p className="text-ivory-muted">
                        السعر الأصلي: <s>{formatPrice(appliedCoupon.originalAmount)}</s> • خصم:{' '}
                        <span className="text-emerald-400">{formatPrice(appliedCoupon.discountAmount)}</span> •
                        النهائي: <strong className="text-gold-300">{formatPrice(appliedCoupon.finalAmount)}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-surface-border flex items-center justify-between">
              <span className="text-xs text-ivory-muted">المجموع النهائي:</span>
              {appliedCoupon ? (
                <CoursePrice price={appliedCoupon.finalAmount} size="lg" />
              ) : (
                <CoursePrice
                  price={getTotalPrice()}
                  size="lg"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
