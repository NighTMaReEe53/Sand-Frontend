import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'gold',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    gold: 'bg-gold-100 text-gold-700 border border-gold-500/40',
    success: 'bg-[#4C7A5A]/10 text-[#35603f] border border-[#4C7A5A]/30',
    warning: 'bg-gold-100 text-gold-700 border border-gold-500/35',
    danger: 'bg-[#A64B3A]/10 text-[#873b2d] border border-[#A64B3A]/30',
    neutral: 'bg-surface-border text-ivory-muted border border-surface-borderLight',
    outline: 'border border-gold-500/40 text-gold-300 bg-transparent',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-md',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 leading-none tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
