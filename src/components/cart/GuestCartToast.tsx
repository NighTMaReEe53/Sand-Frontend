import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';

interface GuestCartToastProps {
  toastId: string | number;
  course?: { title?: string; thumbnailUrl?: string | null } | null;
}

/**
 * Rich guest prompt shown instead of the plain warning bubble.
 * Thumbnail + animated bag + explicit sign-in / browse actions.
 */
const GuestCartToastBase: React.FC<GuestCartToastProps> = ({ toastId, course }) => {
  const navigate = useNavigate();

  const goLogin = () => {
    toast.dismiss(toastId);
    navigate('/login');
  };

  return (
    <div
      dir="rtl"
      className="relative flex w-[min(92vw,380px)] items-start gap-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-md backdrop-blur-md"
    >
      {/* right accent spine */}
      <span aria-hidden className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-b from-[var(--gold)] to-[var(--gold-bright)]" />

      {/* course thumbnail with animated bag badge */}
      <div className="relative shrink-0">
        <div className="h-14 w-14 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-alt)]">
          {course?.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--primary)]">
              <ShoppingBag className="h-6 w-6" />
            </div>
          )}
        </div>
        <motion.span
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
          className="absolute -bottom-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] shadow-md"
        >
          <Lock className="h-3 w-3" />
        </motion.span>
      </div>

      {/* text + actions */}
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-black text-[var(--ink)]">سجّل دخولك لإكمال الإضافة</p>
        <p className="mt-1 line-clamp-2 text-[11px] font-medium text-[var(--ink-muted)] leading-relaxed">
          {course?.title ? `«${course.title}»` : 'هذا الكورس'} في انتظارك — أنشئ حساباً أو سجّل دخولك لحفظ كورساتك ومتابعة تقدمك.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={goLogin}
            className="flex cursor-pointer items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-bold text-[var(--on-primary)] transition-all duration-200 hover:brightness-110 active:scale-95 shadow-sm"
          >
            <Lock className="h-3 w-3" />
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(toastId)}
            className="cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-bold text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]"
          >
            لاحقاً
          </button>
        </div>
      </div>

      {/* close */}
      <button
        type="button"
        aria-label="إغلاق"
        onClick={() => toast.dismiss(toastId)}
        className="shrink-0 cursor-pointer rounded-lg p-1 text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

/** Public helper — call anywhere to show the creative guest prompt */
export const showGuestCartToast = (course?: { title?: string; thumbnailUrl?: string | null } | null) => {
  toast.custom((t) => <GuestCartToastBase toastId={t} course={course} />, {
    duration: 7000,
  });
};

export const GuestCartToast = GuestCartToastBase;
