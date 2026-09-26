import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { FadeIn } from '../animations/FadeIn';

/**
 * Final CTA section (Implementation_plan_EN.md §3.7).
 * Full navy gradient band with floating book & pen line-art.
 * Presentational only.
 */
export const CTASection: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="heritage-container max-w-6xl">
      <FadeIn>
        {/* CTA Banner: Rich royal navy in light mode, calm frosted Glass Effect in dark mode */}
        <div
          className="relative overflow-hidden rounded-[var(--radius-lg)] p-10 text-center sm:p-16 border border-white/15 dark:border-white/[0.08] bg-gradient-to-br from-[#0C233C] via-[#103052] to-[#08182B] dark:from-[#252525]/95 dark:via-[#202020]/90 dark:to-[#191919]/95 shadow-sm"
        >
          {/* Subtle warm glow behind text */}
          <div className="pointer-events-none absolute inset-0 bg-radial from-amber-400/10 via-transparent to-transparent opacity-60" />

          {/* Floating book silhouette — left edge */}
          <motion.svg
            viewBox="0 0 120 90"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 top-1/2 hidden w-44 -translate-y-1/2 opacity-15 sm:block"
            animate={prefersReducedMotion ? undefined : { y: [-8, 8, -8], rotate: [-4, 4, -4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M60 14C48 5 28 3 12 7v62c16-4 36-2 48 7 12-9 32-11 48-7V7C92 3 72 5 60 14Z"
              stroke="#F5C518"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M60 14v62" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" />
          </motion.svg>

          {/* Floating pen silhouette — right edge */}
          <motion.svg
            viewBox="0 0 140 140"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 bottom-0 hidden w-36 opacity-15 sm:block"
            animate={prefersReducedMotion ? undefined : { y: [8, -8, 8], rotate: [6, -6, 6] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            <g transform="rotate(38 70 70)">
              <rect x="58" y="8" width="24" height="86" rx="10" stroke="#F5C518" strokeWidth="2.5" />
              <path d="M58 94c0 14 12 30 12 30s12-16 12-30H58Z" stroke="#F5C518" strokeWidth="2.5" strokeLinejoin="round" />
            </g>
          </motion.svg>

          {/* Sparkle field */}
          {[...Array(6)].map((_, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-amber-400/50"
              style={{ right: `${12 + i * 15}%`, top: `${18 + (i % 3) * 28}%` }}
              animate={prefersReducedMotion ? undefined : { opacity: [0.3, 1, 0.3], scale: [1, 1.6, 1] }}
              transition={{ duration: 2.4 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
            />
          ))}

          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black font-amira text-white tracking-tight leading-snug">
              جاهز لتحقيق <span className="text-[#F5C518] font-amira drop-shadow-sm">الدرجة النهائية</span> والتفوق؟
            </h2>
            <p className="text-sm leading-loose text-white/90 sm:text-base font-din font-medium">
              سجل حسابك الآن واستمتع بمشاهدة الحصص التأسيسية المجانية وامتحانات تحديد المستوى.
            </p>
            <div className="pt-2">
              <Link to="/auth/register">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-10 py-3.5 text-base font-bold font-din bg-[#F5C518] text-[#121212] hover:bg-[#e6b810] active:scale-[0.98] shadow-md transition-all cursor-pointer"
                >
                  <span>ابدأ رحلتك الآن</span>
                  <ArrowLeft className="h-5 w-5 rotate-180 text-[#121212]" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};
