import { toast } from 'sonner';
import { getApiErrorMessage } from './errorMessages';

const BASE = 'font-cairo shadow-lg';

/** توست نجاح — خلفية خضراء */
export const toastSuccess = (message: string, description?: string) =>
  toast.success(message, {
    description,
    classNames: {
      toast: `!bg-emerald-600 !text-white !border-emerald-400/50 ${BASE}`,
      title: '!text-white !font-bold',
      description: '!text-white/90',
    },
  });

/** توست خطأ — خلفية حمراء */
export const toastError = (message: string, description?: string) =>
  toast.error(message, {
    description,
    duration: 5000,
    classNames: {
      toast: `!bg-red-600 !text-white !border-red-400/50 ${BASE}`,
      title: '!text-white !font-bold',
      description: '!text-white/90',
    },
  });

/** توست خطأ من استجابة API — يترجم الرسالة للعربية تلقائياً */
export const toastApiError = (err: unknown, fallback = 'حدث خطأ ما — حاول مرة أخرى') =>
  toastError(getApiErrorMessage(err, fallback));

/** توست معلومات */
export const toastInfo = (message: string) =>
  toast.info(message, {
    classNames: {
      toast: `!bg-[var(--primary)] !text-white !border-primary/50 ${BASE}`,
      title: '!text-white !font-bold',
      description: '!text-white/85',
    },
  });

/** توست تحذير — خلفية كهرمانية */
export const toastWarning = (message: string) =>
  toast.warning(message, {
    classNames: {
      toast: `!bg-amber-500 !text-white !border-amber-300/60 ${BASE}`,
      title: '!text-white !font-bold',
      description: '!text-white/90',
    },
  });

/**
 * توست احتفالي لكسب العملات الذهبية 🪙
 * يظهر تلقائياً لما الطالب يكمل درس أو كويز أو واجب
 */
export const toastCoinsEarned = (amount: number, reason?: string) =>
  toast(reason ? `🪙 ربحت ${amount} عملة — ${reason}` : `🪙 ربحت ${amount} عملة ذهبية!`, {
    duration: 5000,
    classNames: {
      toast: `!bg-[#1a1408] !border !border-amber-400/40 !text-amber-200 ${BASE}`,
      title: '!text-amber-200 !font-black',
    },
  });

