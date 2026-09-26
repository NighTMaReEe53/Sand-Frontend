import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Change this on submit/trigger to replay the shake for the same error. */
  shakeKey?: string | number;
  shakeOnError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    id,
    shakeKey,
    shakeOnError = true,
    name,
    ...props
  }, ref) => {
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId.replace(/:/g, '')}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-help`;
    const [isShaking, setIsShaking] = React.useState(false);

    React.useEffect(() => {
      if (!error || !shakeOnError) {
        setIsShaking(false);
        return;
      }

      // Remove and re-add the class on the next frame so repeated submits
      // replay the animation even when the error text is unchanged.
      setIsShaking(false);
      const frame = requestAnimationFrame(() => setIsShaking(true));
      const timer = window.setTimeout(() => setIsShaking(false), 600);
      return () => {
        cancelAnimationFrame(frame);
        window.clearTimeout(timer);
      };
    }, [error, shakeKey, shakeOnError]);

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full space-y-1.5 text-right">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ivory/90 font-cairo">
            {label}
          </label>
        )}

        {/* Do not key this wrapper by the error message. Doing so remounts
            the native input whenever validation changes and steals focus
            while the learner is correcting a form field. */}
        <div className={cn('relative flex items-center', isShaking && 'animate-error-shake')}>
          {leftIcon && (
            <div className="absolute left-3.5 text-ivory-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            aria-describedby={describedBy}
            className={cn(
              'w-full bg-surface/80 border border-surface-border text-ivory placeholder-ivory-muted/50 rounded-lg px-4 py-2.5 text-sm transition-all duration-200 outline-none',
              'focus:border-gold-400 focus:ring-2 focus:ring-gold-500/20 focus:bg-surface',
              'disabled:opacity-50 disabled:bg-surface-subtle disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error &&
                'border-red-500/70 focus:border-red-500 focus:ring-red-500/20 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]',
              className
            )}
            aria-invalid={!!error || undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-ivory-muted flex items-center">{rightIcon}</div>
          )}
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-xs text-red-400 mt-1 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-ivory-muted mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
