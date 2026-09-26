import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'soft' | 'outline' | 'ghost' | 'danger' | 'outline-danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-bold transition-all duration-200 ease-out rounded-md select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500';

    const variants = {
      /* ── Primary: vibrant brand filled button ── */
      primary:
        'bg-[var(--primary)] text-white dark:text-[var(--on-primary)] font-bold rounded-xl border border-[var(--primary)] hover:brightness-105 active:scale-[0.98] shadow-sm transition-all duration-150',

      /* ── Secondary: complement amber ── */
      secondary:
        'bg-[var(--secondary)] text-white dark:text-[var(--on-secondary)] font-bold rounded-xl border border-[var(--secondary-strong)] hover:brightness-105 active:scale-[0.98] shadow-sm transition-all duration-150',

      /* ── Accent: cool teal/slate — visual contrast partner for primary ── */
      accent:
        'bg-[var(--accent,#1e6a8e)] text-white font-bold rounded-xl border border-[var(--accent-strong,#165a78)] hover:brightness-110 active:scale-[0.98] shadow-sm transition-all duration-150',

      /* ── Soft: very light tinted surface ── */
      soft:
        'bg-[var(--primary-soft)] text-[var(--primary)] font-bold rounded-xl border border-[color-mix(in_srgb,var(--primary)_25%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] active:scale-[0.98] transition-all duration-150',

      /* ── Outline: #FFF1 glass effect — translucent white with crisp fine border, no backdrop-blur lag ── */
      outline:
        'border border-black/10 dark:border-white/10 text-[var(--ink)] bg-black/[0.03] dark:bg-white/[0.07] hover:bg-black/[0.07] dark:hover:bg-white/[0.14] hover:border-[var(--primary)]/60 hover:text-[var(--primary)] rounded-xl active:scale-[0.98] shadow-sm transition-all duration-150',

      /* ── Ghost: minimal, text-only feel ── */
      ghost:
        'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:bg-black/[0.08] dark:active:bg-white/[0.09] rounded-xl shadow-none transition-colors duration-150',

      /* ── Danger ── */
      danger:
        'bg-red-600 text-white font-bold rounded-xl border border-red-500 hover:bg-red-700 active:bg-red-800 shadow-sm transition-all duration-150',
      'outline-danger':
        'border border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:text-red-600 rounded-xl transition-colors duration-150',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-md',
      md: 'text-sm px-5 py-2.5 gap-2 rounded-md',
      lg: 'text-base px-7 py-3 gap-2.5 font-bold rounded-md',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
