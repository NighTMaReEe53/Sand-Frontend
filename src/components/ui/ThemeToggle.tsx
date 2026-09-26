import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

/** Compact, accessible switch shared by the desktop and mobile navigation. */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const nextLabel = isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={nextLabel}
      aria-pressed={isDark}
      title={nextLabel}
      className={`group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-[background-color,border-color,color,transform,box-shadow] duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-bright)] active:scale-95 ${className}`}
      style={{
        backgroundColor: isDark ? 'var(--primary-soft)' : 'var(--surface)',
        borderColor: isDark ? 'color-mix(in srgb, var(--gold) 55%, var(--line))' : 'var(--line)',
        color: isDark ? 'var(--gold-bright)' : 'var(--primary)',
        boxShadow: isDark ? '0 8px 20px -14px color-mix(in srgb, var(--gold) 85%, transparent)' : undefined,
      }}
    >
      <Sun
        aria-hidden="true"
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'
        }`}
      />
      <Moon
        aria-hidden="true"
        className={`absolute h-[17px] w-[17px] transition-all duration-300 ${
          isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
    </button>
  );
};
