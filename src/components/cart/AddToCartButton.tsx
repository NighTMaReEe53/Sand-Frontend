import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Check, Clock, GraduationCap, PartyPopper, Settings, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { showGuestCartToast } from './GuestCartToast';
import { Button } from '../ui/Button';
import type { Course } from '../../types/course.types';

const CONFETTI_COLORS = ['#d4af37', '#f5d97a', '#b8912c', '#ffffff'];

interface Props {
  course: Course;
  /** Called when a guest tries to add — pages usually redirect to login */
  requireAuth?: () => void;
  size?: 'sm' | 'lg';
  fullWidth?: boolean;
  labels?: { idle?: string; added?: string; inCart?: string };
}

/**
 * Creative "add to cart" button.
 * Guards against duplicate enrollment:
 * - If already enrolled / ACTIVE: transforms to "استكمل التعلم"
 * - If PENDING review: transforms to "بانتظار المراجعة"
 * - If course owner: transforms to "إدارة الكورس"
 * Guests get a sign-in toast (no silent failure).
 */
export const AddToCartButton: React.FC<Props> = ({
  course,
  requireAuth,
  size = 'sm',
  fullWidth,
  labels,
}) => {
  const { addItem, hasItem, setOpen } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // ─── Guard 1: Already Enrolled Active ────────────────────────
  if (course.isEnrolled || course.enrollmentStatus === 'ACTIVE') {
    return (
      <Link to={`/courses/${course.id}`} className={fullWidth ? 'w-full block' : 'inline-block'}>
        <Button
          size={size === 'lg' ? 'lg' : 'md'}
          variant="primary"
          className={`w-full !rounded-xl ${size === 'lg' ? '!py-3.5 !text-sm' : '!py-2.5 !text-xs'} bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm`}
          leftIcon={<GraduationCap className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
        >
          استكمل التعلم
        </Button>
      </Link>
    );
  }

  // ─── Guard 2: Pending Approval ───────────────────────────────
  if (course.enrollmentStatus === 'PENDING') {
    return (
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        <Button
          size={size === 'lg' ? 'lg' : 'md'}
          variant="outline"
          disabled
          className={`w-full !rounded-xl ${size === 'lg' ? '!py-3.5 !text-sm' : '!py-2.5 !text-xs'} opacity-80 cursor-not-allowed text-amber-400 border-amber-500/40`}
          leftIcon={<Clock className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
        >
          بانتظار المراجعة
        </Button>
      </div>
    );
  }

  // ─── Guard 3: Course Owner ──────────────────────────────────
  if (course.isOwner) {
    return (
      <Link to="/dashboard/courses" className={fullWidth ? 'w-full block' : 'inline-block'}>
        <Button
          size={size === 'lg' ? 'lg' : 'md'}
          variant="accent"
          className={`w-full !rounded-xl ${size === 'lg' ? '!py-3.5 !text-sm' : '!py-2.5 !text-xs'}`}
          leftIcon={<Settings className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
        >
          إدارة الكورس
        </Button>
      </Link>
    );
  }

  const [justAdded, setJustAdded] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [flying, setFlying] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const burstConfetti = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBursting(true);
    window.setTimeout(() => setBursting(false), 500);
    void confetti({
      particleCount: 28,
      spread: 65,
      startVelocity: 26,
      gravity: 0.9,
      scalar: 0.75,
      ticks: 100,
      origin: {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
  }, []);

  const handleGuestClick = useCallback(() => {
    showGuestCartToast({ title: course.title, thumbnailUrl: course.thumbnailUrl });
    // small shake cue on the button itself
    btnRef.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 320, easing: 'ease-in-out' }
    );
    requireAuth?.();
  }, [course.title, course.thumbnailUrl, requireAuth]);

  const handleClick = () => {
    if (!isAuthenticated) {
      handleGuestClick();
      return;
    }
    if (hasItem(course.id)) {
      setOpen(true); // already there — show the drawer instead
      return;
    }
    if (addItem(course)) {
      setJustAdded(true);
      setFlying(true);
      burstConfetti();
      window.setTimeout(() => setFlying(false), 700);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setJustAdded(false), 2400);
    }
  };

  const inCartNow = hasItem(course.id) || justAdded;
  const isSuccess = justAdded;

  const text = inCartNow
    ? isSuccess
      ? (labels?.added ?? 'أُضيف للسلة!')
      : (labels?.inCart ?? 'في السلة')
    : (labels?.idle ?? (size === 'lg' ? 'أضف الكورس للسلة' : 'أضف للسلة'));

  return (
    <motion.button
      ref={btnRef}
      type="button"
      whileTap={{ scale: 0.93 }}
      whileHover={!inCartNow ? { y: -1.5 } : undefined}
      onClick={handleClick}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-visible rounded-xl font-black whitespace-nowrap transition-colors duration-300 ${
        size === 'lg' ? 'w-full px-6 py-3.5 text-sm' : 'px-4 py-2.5 text-xs'
      } ${fullWidth ? 'w-full' : ''} ${
        inCartNow
          ? isSuccess
            ? 'border border-emerald-400/60 bg-emerald-500/15 text-emerald-300'
            : 'border border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          : 'bg-[var(--primary)] text-[var(--on-primary)] hover:brightness-105 active:scale-[0.98] border border-[var(--primary)] shadow-sm'
      }`}
    >
      {/* Inner clip layer so the shine sweep stays inside the rounded corners */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
        {/* Shine sweep (idle state only) */}
        {!inCartNow && (
          <span className="absolute inset-0 -translate-x-[130%] transition-transform duration-700 ease-out group-hover:-translate-x-[130%] group-hover:animate-[cart-shine_.9s_ease-out]" />
        )}
      </span>

      {/* Success ring pulse */}
      {isSuccess && (
        <motion.span
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 1.45 }}
          transition={{ duration: 0.7 }}
          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-emerald-400"
        />
      )}

      {/* Flying course thumbnail — arcs up out of the button on add */}
      {flying && (
        <motion.span
          initial={{ opacity: 1, x: '-50%', y: 0, scale: 0.9 }}
          animate={{ opacity: 0, x: 'calc(-50% - 14px)', y: -72, scale: 0.45 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="pointer-events-none absolute top-0 left-1/2 z-20 h-9 w-9 overflow-hidden rounded-lg border-2 border-[var(--primary)] shadow-sm"
        >
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[var(--primary-soft)]">
              <ShoppingBag className="h-4 w-4 text-[var(--primary)]" />
            </span>
          )}
        </motion.span>
      )}

      <span className="relative z-10 flex items-center gap-2">
        <motion.span
          key={text}
          initial={isSuccess ? { scale: 0.4, rotate: -30 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="flex items-center"
        >
          {isSuccess ? (
            <Check className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={3} />
          ) : inCartNow ? (
            <PartyPopper className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
          ) : (
            <ShoppingBag
              className={`${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110`}
            />
          )}
        </motion.span>

        {/* Burst sparkles behind the icon right at click time */}
        {bursting && (
          <span className="pointer-events-none absolute inset-0">
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <motion.span
                key={deg}
                initial={{ opacity: 1, x: '-50%', y: '-50%', scale: 1 }}
                animate={{
                  opacity: 0,
                  x: `calc(-50% + ${Math.cos((deg * Math.PI) / 180) * 26}px)`,
                  y: `calc(-50% + ${Math.sin((deg * Math.PI) / 180) * 26}px)`,
                  scale: 0.2,
                }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-[var(--primary)]"
              />
            ))}
          </span>
        )}

        {text}
      </span>
    </motion.button>
  );
};
