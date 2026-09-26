import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, Target, Sparkles } from "lucide-react";
import { HomeworkPanel } from "./HomeworkPanel";

/* ── Scoped decorative animations (kept local so no global CSS is touched) ── */
const DecorStyles: React.FC = () => (
  <style>{`
    @keyframes hwsFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes hwsFloatSlow { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(2deg); } }
    @keyframes hwsFloatSlow2 { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(12px) rotate(-3deg); } }
    @keyframes hwsPenDraw { 0% { stroke-dashoffset: 26; opacity: 0.35; } 45% { stroke-dashoffset: 0; opacity: 1; } 100% { stroke-dashoffset: -26; opacity: 0.35; } }
    @keyframes hwsArrowDash { to { stroke-dashoffset: -20; } }
    @keyframes hwsPulseRing { 0%, 100% { opacity: 0.35; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
    .hws-fade-up { animation: hwsFadeUp 520ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    .hws-float-a { animation: hwsFloatSlow 7.5s ease-in-out infinite; }
    .hws-float-b { animation: hwsFloatSlow2 8.5s ease-in-out infinite; animation-delay: 0.6s; }
    .hws-pen-line { stroke-dasharray: 26; animation: hwsPenDraw 3.2s ease-in-out infinite; }
    .hws-arrow-dash { stroke-dasharray: 3 7; animation: hwsArrowDash 1.6s linear infinite; }
    .hws-pulse-ring { animation: hwsPulseRing 2.6s ease-in-out infinite; }
  `}</style>
);

/* ── Decorative inline SVGs (same family as the results page) ───────── */
const Blob: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden>
    <defs>
      <radialGradient id="hwsG1" cx="30%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#f0b429" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
      </radialGradient>
    </defs>
    <path
      fill="url(#hwsG1)"
      d="M44 -62C57 -52 66 -38 70 -22C74 -6 73 12 65 27C57 42 42 54 25 62C8 70 -11 74 -29 68C-47 62 -63 46 -70 28C-77 10 -75 -10 -65 -26C-55 -42 -37 -54 -19 -63C-1 -72 18 -78 44 -62Z"
      transform="translate(100 100)"
    />
  </svg>
);

const PenGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
    <path
      d="M33 6.5c1.6-1.6 4.2-1.6 5.8 0l2.7 2.7c1.6 1.6 1.6 4.2 0 5.8L17.5 39l-10 2.5L10 31.5 33 6.5Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path
      d="M29 11l8 8"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M13.5 34.5l3 3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      className="hws-pen-line"
      d="M4 45c5-1.4 10-1.6 15-4.2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const BookGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
    <path
      d="M24 13c-3.4-2.6-8.4-3.7-14.6-3.7-1 0-1.6.6-1.6 1.6v24.6c0 1 .6 1.7 1.6 1.7 6.2 0 11.2 1.1 14.6 3.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 13c3.4-2.6 8.4-3.7 14.6-3.7 1 0 1.6.6 1.6 1.6v24.6c0 1-.6 1.7-1.6 1.7-6.2 0-11.2 1.1-14.6 3.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 13v28"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.7"
    />
    <path
      d="M10.5 17c3 0 6.2.7 8.7 2.1M10.5 23c3 0 6.2.7 8.7 2.1M28.8 19.1c2.5-1.4 5.7-2.1 8.7-2.1M28.8 25.1c2.5-1.4 5.7-2.1 8.7-2.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.55"
    />
  </svg>
);

const ArrowDoodle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 64" className={className} fill="none" aria-hidden>
    <path
      className="hws-arrow-dash"
      d="M6 8c22 1 44 13 50 36"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M42 37l12 9 5-14"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* Hand-drawn circle scribble, sits behind the page title as a highlight */
const CircleScribble: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 220 92" className={className} fill="none" aria-hidden>
    <path
      d="M32 46C29 21 55 6 96 5c42-1 82 13 103 35 15 15 8 33-14 39-32 9-74 9-105-2C54 70 34 63 32 46Z"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.55"
    />
  </svg>
);

/* ─── صفحة حل الواجب المخصّصة ───
   تعرض أسئلة الواجب وصناديق الإجابة في صفحة مستقلة (لا داخل صفحة الكورس/التعلّم).
   تبدأ الحل تلقائياً عبر autoStart، وتعود للدرس عبر زر الرجوع. */
export const HomeworkSolvePage: React.FC = () => {
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

      {/* Ambient background — same visual family as the results page */}
      {/* <Blob className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 opacity-30" /> */}
      {/* <Blob className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 opacity-20" /> */}
      {/* <BookGlyph className="hws-float-a pointer-events-none absolute top-24 left-8 w-9 h-9 text-violet-400/15 hidden lg:block" /> */}
      {/* <PenGlyph className="hws-float-b pointer-events-none absolute bottom-16 left-14 w-8 h-8 text-gold-400/15 hidden lg:block" /> */}

      <div className="relative mx-auto max-w-4xl px-6 py-8 sm:py-10 space-y-6">
        {/* Back link */}
        <button
          type="button"
          onClick={() =>
            navigate(`/courses/${courseId}/learn?lesson=${lessonId}`)
          }
          className="hws-fade-up group inline-flex items-center gap-2 text-base text-ivory-muted hover:text-gold-300 transition-colors"
        >
          <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
          العودة إلى درس الواجب
        </button>

        {/* Header card — respectable container framing the whole solving experience */}
        <div
          className="hws-fade-up relative rounded-[1.75rem] border border-surface-border bg-gradient-to-br from-surface-card/90 to-surface-card/50 backdrop-blur-sm shadow-sm shadow-black/10 p-6 sm:p-8 overflow-hidden"
          style={{ animationDelay: "80ms" }}
        >
          <CircleScribble className="pointer-events-none absolute -top-6 -right-10 w-40 h-20 text-gold-500/25 hidden sm:block" />
          <div className="relative flex items-start gap-4">
            <span className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/25 to-gold-500/25 border border-gold-500/30 flex items-center justify-center shrink-0">
              <span className="absolute inset-0 rounded-2xl border border-gold-400/30 hws-pulse-ring" />
              <BookOpenCheck className="w-7 h-7 text-gold-300" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl md:text-4xl mb-3 font-bold text-ivory flex items-center gap-3 leading-tight">
                حل الواجب
                <Sparkles className="w-5 h-5 text-gold-400/80" />
              </h1>
              <p className="text-base text-ivory-muted mt-1 flex items-center gap-2 leading-relaxed">
                <Target className="w-4 h-4 text-violet-400 shrink-0" />
                ركّز في إجابتك — نتيجتك وتفاصيل حلّك هتظهر بشكل واضح فور
                التسليم.
              </p>
            </div>
            <ArrowDoodle className="hidden md:block w-16 h-10 text-violet-400/40 shrink-0 mt-1 -scale-x-100" />
          </div>
        </div>

        {/* Panel container — gives the questions / answer boxes / result a polished frame */}
        <div
          className="hws-fade-up relative rounded-[1.75rem] border border-surface-border bg-surface-card/60 shadow-sm shadow-black/20 overflow-hidden"
          style={{ animationDelay: "160ms" }}
        >
          <div className="h-1.5 w-full bg-gradient-to-l from-violet-500/70 via-gold-500/60 to-emerald-500/70 opacity-80" />
          <div className="p-6 sm:p-8">
            <HomeworkPanel lessonId={lessonId} courseId={courseId} autoStart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkSolvePage;
