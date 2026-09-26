import React from 'react';
import { motion } from 'framer-motion';
import { MonitorPlay, ListChecks, Trophy } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
  badge: string;
  title: string;
  subtitle: string;
}

/* ── Hand-drawn style decorative SVGs ─────────────────────────── */

export const BooksStack: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 92" fill="none" className={className} aria-hidden="true">
    <g stroke="#C9A15A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="64" width="98" height="17" rx="3" />
      <path d="M24 72 H70" opacity=".45" />
      <rect x="20" y="46" width="82" height="16" rx="3" />
      <path d="M34 54 H80" opacity=".45" />
      <g transform="rotate(-4 64 37)">
        <rect x="32" y="29" width="68" height="15" rx="3" />
        <path d="M44 36 H88" opacity=".45" />
      </g>
      <path d="M92 46 v16 l7 -6 7 6 V49" />
    </g>
  </svg>
);

export const QuillDoodle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <g stroke="#C9A15A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M54 6 C38 10 22 26 15 46 l-4 11 11 -4 C42 46 58 28 56 10 Z" />
      <path d="M46 16 C36 22 27 31 21 42" opacity=".5" />
      <path d="M50 24 C43 28 35 35 29 44" opacity=".35" />
    </g>
  </svg>
);

export const ArrowCurve: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 84 64" fill="none" className={className} aria-hidden="true">
    <g stroke="#C9A15A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M76 8 C48 12 22 28 16 50" strokeDasharray="5 6" />
      <path d="M8 42 l8 11 12 -7" />
    </g>
  </svg>
);

/** Big showcase art: open book + quill + rising sparks + pyramid */
const BookArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 290 195" fill="none" className={className} aria-hidden="true">
    <ellipse cx="145" cy="172" rx="115" ry="10" fill="#C9A15A" opacity="0.09" />

    <g opacity="0.3" stroke="#C9A15A" strokeWidth="2" strokeLinecap="round">
      <path d="M204 100 L238 50 L272 100 Z" />
      <circle cx="238" cy="40" r="4" />
    </g>

    <g stroke="#C9A15A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M145 56 C123 41 88 37 61 43 L61 136 C88 130 123 134 145 149 Z"
        fill="rgba(201,161,90,0.06)"
      />
      <path
        d="M145 56 C167 41 202 37 229 43 L229 136 C202 130 167 134 145 149 Z"
        fill="rgba(201,161,90,0.06)"
      />
      <path d="M145 56 V149" />
      <path d="M75 63 C96 60 117 62 133 68" opacity=".5" />
      <path d="M75 80 C96 77 117 79 133 85" opacity=".5" />
      <path d="M75 97 C96 94 117 96 133 102" opacity=".5" />
      <path d="M215 63 C194 60 173 62 157 68" opacity=".5" />
      <path d="M215 80 C194 77 173 79 157 85" opacity=".5" />
      <path d="M215 97 C194 94 173 96 157 102" opacity=".5" />
      <path d="M200 47 v21 l7 -6 7 6 V50" opacity=".75" />
    </g>

    <g stroke="#C9A15A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M34 158 C60 124 98 96 136 80" />
      <path d="M136 80 c-9 2 -17 8 -21 16" opacity=".55" />
      <path d="M34 158 l-7 13 13 -7 Z" fill="rgba(201,161,90,0.3)" />
    </g>

    <g fill="#C9A15A">
      <circle cx="88" cy="28" r="2.5" opacity=".8" />
      <circle cx="146" cy="17" r="3" opacity=".9" />
      <circle cx="192" cy="25" r="2" opacity=".7" />
      <path d="M166 32 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 Z" opacity=".85" />
    </g>
  </svg>
);

const FEATURES = [
  { icon: <MonitorPlay className="w-4 h-4" />, label: 'شروحات فيديو حصرية' },
  { icon: <ListChecks className="w-4 h-4" />, label: 'بنك أسئلة وامتحانات' },
  { icon: <Trophy className="w-4 h-4" />, label: 'تحديات وشهادات' },
];

export const AuthShell: React.FC<AuthShellProps> = ({ children, badge, title, subtitle }) => {
  return (
    <div className="relative flex-1 flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 right-[10%] w-[400px] h-[400px] rounded-full bg-gold-500/[0.05] blur-3xl" />
        <div className="absolute -bottom-36 left-[5%] w-[380px] h-[380px] rounded-full bg-gold-700/[0.07] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 0.68, 0.32, 1] }}
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] rounded-[2rem] bg-surface-card border border-gold-500/25 overflow-hidden"
      >
        {/* ── FORM SECTION (top-right in RTL) ── */}
        <div className="relative flex flex-col p-7 sm:p-9 lg:p-10">
          {/* corner doodles */}
          <ArrowCurve className="pointer-events-none absolute bottom-24 left-5 w-14 rotate-[185deg] opacity-20 hidden sm:block" />
          <QuillDoodle className="pointer-events-none absolute top-6 left-6 w-9 -rotate-12 opacity-20 hidden sm:block" />

          {/* logo — top right */}
          <div className="flex items-center justify-between mb-7">
            <img
              src="/image/logo.png"
      alt="شعار منصة سند التعليمية"
              className="w-14 h-14 rounded-xl object-contain bg-surface border border-gold-500/30 p-1 shadow-gold-glow"
            />
            <span className="sm:hidden px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/25 text-[11px] text-gold-200/90 font-cairo">
              {badge}
            </span>
          </div>

          {children}

          <BooksStack className="pointer-events-none absolute bottom-4 left-4 w-24 opacity-[0.12]" />
        </div>

        {/* ── SHOWCASE SECTION ── */}
        <div className="relative hidden lg:flex flex-col justify-center gap-5 px-8 py-8 bg-gradient-to-b from-bg-subtle via-surface to-bg-subtle border-r border-gold-500/20 overflow-hidden">
          <span className="absolute top-6 right-8 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/25 text-[11px] text-gold-200/90 font-cairo">
            {badge}
          </span>

          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <BookArt className="w-full max-w-[230px]" />

            <div className="space-y-2">
              <h2 className="text-xl font-black font-din leading-snug text-ink">{title}</h2>
              <p className="text-xs text-ink-muted leading-relaxed max-w-[260px] mx-auto font-sst">{subtitle}</p>
            </div>
          </div>

          <div className="relative z-10 space-y-3.5 font-sst">
            <ul className="space-y-2">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-[11px] text-ink-muted">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    {f.icon}
                  </span>
                  {f.label}
                </li>
              ))}
            </ul>

            <div className="p-3.5 rounded-2xl bg-surface/70 border border-primary/20 shadow-sm">
              <p className="text-xs text-primary font-bold italic leading-relaxed font-sst">
                "التاريخ ليس مجرد ماضٍ يُروى، بل هو تجربة تُعاش ودرجة كاملة تُحصد."
              </p>
              <span className="block text-[11px] text-ink-muted mt-1.5">— معاك خطوة بخطوة في سند</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
