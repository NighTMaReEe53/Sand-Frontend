import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardList, Target, Sparkles } from "lucide-react";
import { QuizPanel } from "./QuizPanel";

/* ── Scoped decorative animations (kept local so no global CSS is touched) ── */
const DecorStyles: React.FC = () => (
  <style>{`
    @keyframes qsFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes qsFloatSlow { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(2deg); } }
    @keyframes qsFloatSlow2 { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(12px) rotate(-3deg); } }
    @keyframes qsPulseRing { 0%, 100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
    .qs-fade-up { animation: qsFadeUp 520ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    .qs-float-a { animation: qsFloatSlow 7.5s ease-in-out infinite; }
    .qs-float-b { animation: qsFloatSlow2 8.5s ease-in-out infinite; animation-delay: 0.6s; }
    .qs-pulse-ring { animation: qsPulseRing 2.6s ease-in-out infinite; }
  `}</style>
);

/* ── Decorative inline SVGs ───────── */
const Blob: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden>
    <defs>
      <radialGradient id="qsG1" cx="30%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#f0b429" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
      </radialGradient>
    </defs>
    <path
      fill="url(#qsG1)"
      d="M44 -62C57 -52 66 -38 70 -22C74 -6 73 12 65 27C57 42 42 54 25 62C8 70 -11 74 -29 68C-47 62 -63 46 -70 28C-77 10 -75 -10 -65 -26C-55 -42 -37 -54 -19 -63C-1 -72 18 -78 44 -62Z"
      transform="translate(100 100)"
    />
  </svg>
);

const ClipboardGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
    <rect x="10" y="6" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2.2" />
    <path d="M18 6V4a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2.2" />
    <path d="M16 18h16M16 24h16M16 30h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const PencilGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
    <path d="M33 6.5c1.6-1.6 4.2-1.6 5.8 0l2.7 2.7c1.6 1.6 1.6 4.2 0 5.8L17.5 39l-10 2.5L10 31.5 33 6.5Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M29 11l8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const CircleScribble: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 220 92" className={className} fill="none" aria-hidden>
    <path d="M32 46C29 21 55 6 96 5c42-1 82 13 103 35 15 15 8 33-14 39-32 9-74 9-105-2C54 70 34 63 32 46Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
  </svg>
);

/* ─── صفحة حل الكويز المخصّصة ─── */
export const QuizSolvePage: React.FC = () => {
  const { lessonId, courseId } = useParams<{
    lessonId: string;
    courseId: string;
  }>();
  const navigate = useNavigate();

  if (!lessonId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-lg text-ivory-muted">
        درس غير صالح.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-bg text-ivory overflow-hidden">
      <DecorStyles />

      <div className="relative mx-auto max-w-4xl px-6 py-8 sm:py-10 space-y-6">
        {/* Back link */}
        <button
          type="button"
          onClick={() =>
            navigate(`/courses/${courseId}/learn?lesson=${lessonId}`)
          }
          className="qs-fade-up group inline-flex items-center gap-2 text-base text-ivory-muted hover:text-gold-300 transition-colors"
        >
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
          العودة إلى درس الكويز
        </button>

        {/* Header card */}
        <div
          className="qs-fade-up relative rounded-[1.75rem] border border-surface-border bg-gradient-to-br from-surface-card/90 to-surface-card/50 backdrop-blur-sm shadow-sm shadow-black/10 p-6 sm:p-8 overflow-hidden"
          style={{ animationDelay: "80ms" }}
        >
          <CircleScribble className="pointer-events-none absolute -top-6 -right-10 w-40 h-20 text-gold-500/25 hidden sm:block" />
          <div className="relative flex items-start gap-4">
            <span className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/25 to-amber-500/25 border border-gold-500/30 flex items-center justify-center shrink-0">
              <span className="absolute inset-0 rounded-2xl border border-gold-400/30 qs-pulse-ring" />
              <ClipboardList className="w-7 h-7 text-gold-300" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl md:text-4xl mb-3 font-bold text-ivory flex items-center gap-3 leading-tight">
                حل الكويز
                <Sparkles className="w-5 h-5 text-gold-400/80" />
              </h1>
              <p className="text-base text-ivory-muted mt-1 flex items-center gap-2 leading-relaxed">
                <Target className="w-4 h-4 text-gold-400 shrink-0" />
                ركّز في إجابتك — نتيجتك ستظهر فور التسليم.
              </p>
            </div>
          </div>
        </div>

        {/* Panel container */}
        <div
          className="qs-fade-up relative rounded-[1.75rem] border border-surface-border bg-surface-card/60 shadow-sm shadow-black/20 overflow-hidden"
          style={{ animationDelay: "160ms" }}
        >
          <div className="h-1.5 w-full bg-gradient-to-l from-gold-500/70 via-amber-500/60 to-emerald-500/70 opacity-80" />
          <div className="p-6 sm:p-8">
            <QuizPanel lessonId={lessonId} autoStart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSolvePage;
