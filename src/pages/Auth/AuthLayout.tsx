import React from 'react';

/* ------------------------------------------------------------------ */
/*  Shared shell for the auth pages: ambient low-opacity backdrop      */
/*  and centered content. The site footer is already rendered by       */
/*  PublicLayout in AppRouter — do not add it here again.              */
/* ------------------------------------------------------------------ */

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative flex-1 flex items-center justify-center px-4 py-12 overflow-hidden">
    {/* ─── low-opacity decorative layer ─── */}
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* soft gold glows */}
        <div className="absolute -top-40 right-[8%] w-[480px] h-[480px] rounded-full bg-gold-500/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 left-[5%] w-[440px] h-[440px] rounded-full bg-gold-700/[0.08] blur-3xl" />

        {/* faint concentric circles */}
        <svg
          className="absolute top-[10%] left-[5%] w-56 opacity-[0.06] animate-float-soft"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="96" stroke="#C9A15A" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="64" stroke="#C9A15A" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="32" stroke="#C9A15A" strokeWidth="1.5" />
        </svg>

        {/* faint flowing waves */}
        <svg
          className="absolute bottom-[12%] right-[4%] w-52 opacity-[0.07]"
          viewBox="0 0 200 120"
          fill="none"
        >
          <path d="M0 100c40-60 80-60 120-20s60 30 80 0" stroke="#C9A15A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M0 118c40-60 80-60 120-20s60 30 80 0" stroke="#C9A15A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* faint dots grid */}
        <svg className="absolute top-[55%] left-[42%] w-40 opacity-[0.05]" viewBox="0 0 120 120" fill="none">
          {Array.from({ length: 36 }).map((_, i) => (
            <circle key={i} cx={12 + (i % 6) * 19} cy={12 + Math.floor(i / 6) * 19} r="2" fill="#C9A15A" />
          ))}
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-4xl">{children}</div>
  </div>
);
