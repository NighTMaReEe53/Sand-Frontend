import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, PlayCircle, GraduationCap } from "lucide-react";
import { Button } from "../ui/Button";

/** The dedicated hero-section image */
const HERO_IMAGE = "/image/hero-section.png";

/** Phrases the typewriter cycles through */
const TYPE_WORDS = ["تتعلم", "تتابع", "تطبق", "تنجح", "تتفوق", "تحقق هدفك"];
/** Static lead-in shown before the rotating word */
const TYPE_PREFIX = "هنا تقدر";

/**
 * Typewriter — types a phrase letter-by-letter, holds, deletes,
 * then moves to the next. Perfectly centered on mobile and right-aligned on desktop.
 * Uses an invisible slot for the longest word so layout never shifts or pulls to one side.
 */
const Typewriter: React.FC = React.memo(() => {
  const prefersReducedMotion = useReducedMotion();
  const [text, setText] = useState(prefersReducedMotion ? TYPE_WORDS[0] : "");
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">(
    prefersReducedMotion ? "holding" : "typing"
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    const word = TYPE_WORDS[wordIdx % TYPE_WORDS.length];

    const t = setTimeout(
      () => {
        if (phase === "typing") {
          if (text.length < word.length)
            setText(word.slice(0, text.length + 1));
          else setPhase("holding");
        } else if (phase === "holding") {
          setPhase("deleting");
        } else {
          if (text.length > 0) setText(word.slice(0, text.length - 1));
          else {
            setWordIdx((i: number) => i + 1);
            setPhase("typing");
          }
        }
      },
      phase === "typing" ? 110 : phase === "deleting" ? 45 : 1700
    );

    return () => clearTimeout(t);
  }, [text, phase, wordIdx, prefersReducedMotion]);

  const longest = TYPE_WORDS.reduce((a, b) => (b.length > a.length ? b : a));

  return (
    <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-white/5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold shadow-2xs backdrop-blur-xs">
      <span className="shrink-0 text-ink-muted">{TYPE_PREFIX}</span>
      <span className="relative inline-flex items-center justify-center font-black text-primary min-w-[5.5rem] sm:min-w-[6.5rem]">
        {/* Invisible placeholder for longest word so layout never jumps */}
        <span aria-hidden="true" className="invisible inline-block select-none">
          {longest}
        </span>
        <span className="absolute inset-0 flex items-center justify-center gap-1">
          <motion.span
            key={wordIdx}
            className="text-primary font-bold"
            animate={
              prefersReducedMotion || phase !== "typing"
                ? undefined
                : { opacity: [0.35, 1] }
            }
            transition={{ duration: 0.2 }}
          >
            {text}
          </motion.span>
          <motion.span
            aria-hidden="true"
            animate={
              prefersReducedMotion ? undefined : { opacity: [1, 1, 0.15, 0.15] }
            }
            transition={{
              duration: 0.9,
              repeat: Infinity,
              times: [0, 0.45, 0.5, 1],
              ease: "linear",
            }}
            className="inline-block h-3.5 sm:h-4 w-[2px] rounded-full"
            style={{ backgroundColor: "var(--gold)" }}
          />
        </span>
      </span>
    </div>
  );
});

/**
 * Hero section — modern student-centric layout.
 * Flawlessly centered on mobile, right-aligned on desktop.
 * Enhanced readability overlays and balanced value props.
 */
export const Hero: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };
  const item = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <section
      className="relative min-h-[92vh] overflow-hidden"
      style={{ backgroundColor: "transparent" }}
    >
      {/* ─── Full-screen absolute image background ─────────────────── */}
      <img
        src={HERO_IMAGE}
        alt=""
        aria-hidden="true"
        width={941}
        height={1672}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* ─── Mobile overlay: soft gradient scrim for 100% readability without hiding art ─── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 lg:hidden"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--bg-primary) 96%, transparent) 0%, color-mix(in srgb, var(--bg-primary) 88%, transparent) 40%, color-mix(in srgb, var(--bg-primary) 94%, transparent) 85%, var(--bg-primary) 100%)",
        }}
      />

      {/* ─── Desktop readability overlays — deep fade from the right (RTL) ─────────────────── */}
      <div
        aria-hidden="true"
        className="hidden lg:block absolute inset-0"
        style={{
          background:
            "linear-gradient(to left, var(--bg-primary) 8%, color-mix(in srgb, var(--bg-primary) 86%, transparent) 42%, color-mix(in srgb, var(--bg-primary) 30%, transparent) 72%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(to bottom, var(--bg-primary), transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background: "linear-gradient(to top, var(--bg-primary), transparent)",
        }}
      />

      {/* ─── Text block — overlaid, fully readable ───────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="heritage-container relative z-10 flex min-h-[92vh] items-center pt-14 pb-16 sm:pt-20 sm:pb-24"
      >
        <div className="w-full max-w-xl mx-auto lg:mx-0 flex flex-col items-center lg:items-start text-center lg:text-right space-y-4 sm:space-y-6">

          {/* Top student kicker badge */}
          <motion.div variants={item} className="flex justify-center lg:justify-start w-full">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-gold-600 dark:text-gold-300 shadow-2xs backdrop-blur-xs">
              <GraduationCap className="h-4 w-4 text-gold-500" />
              <span>منصه سند هنا لمساعدتك للوصل لاهدافك</span>
            </span>
          </motion.div>

          {/* Hero H1 — LARGE & ATTENTION-GRABBING WITH AMIRA */}
          <motion.h1
            variants={item}
            className="font-amira relative text-3xl font-black leading-[1.3] text-ink sm:text-4xl lg:text-5xl tracking-tight text-center lg:text-right w-full"
          >
            <span
              aria-hidden="true"
              className="absolute -right-6 top-2 hidden h-16 w-1 rounded-full bg-gold-400 shadow-[0_0_18px_rgba(201,161,90,0.6)] lg:block"
            />
            <span
              aria-hidden="true"
              className="absolute -right-[1.9rem] top-[4.6rem] hidden h-2.5 w-2.5 rounded-full border-2 border-gold-300 bg-bg lg:block"
            />
            <span className="block">تعليمك أسهل</span>
            <span className="relative isolate inline-block font-black text-primary font-amira mt-1 px-3">
              مما تتخيل
              {/* Hand-drawn marker: key promise emphasis */}
              <svg
                aria-hidden="true"
                viewBox="0 0 340 82"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -inset-x-3 -bottom-3 -z-10 h-10 sm:h-12 w-[calc(100%+1.5rem)] overflow-visible"
              >
                <ellipse
                  cx="170"
                  cy="41"
                  rx="160"
                  ry="32"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeDasharray="240 30"
                  opacity="0.75"
                />
                <path
                  d="M20 62 C110 74, 230 74, 320 60"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  opacity="0.9"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Typewriter line — centered on mobile, right-aligned on desktop */}
          <motion.div variants={item} className="flex justify-center lg:justify-start w-full">
            <Typewriter />
          </motion.div>

          <motion.p
            variants={item}
            className="mx-auto lg:mx-0 max-w-xl text-xs sm:text-sm lg:text-base text-center lg:text-right font-medium"
            style={{
              color: "var(--ink-muted)",
              lineHeight: "1.8",
            }}
          >
            كل اللي محتاجه للتفوق في الثانوية في مكان واحد: كورسات شرح منظمة
            مع نخبة من المدرسين، تدريب مكثف على نظام الامتحانات الجديد، وبنك أسئلة
            ذكي يتابع مستواك خطوة بخطوة.
          </motion.p>

          {/* Quick value props — responsive chips with no overflow */}
          <motion.ul
            variants={item}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 w-full"
          >
            {[
              {
                label: "بنك أسئلة ذكي",
                d: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Zm4 2h6",
              },
              {
                label: "امتحانات نظام الثانوية",
                d: "M8 3h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v5h4M9 13h6M9 17h4",
              },
              {
                label: "متابعة لحظية لتقدمك",
                d: "M3 20h18M6 16v-5m5 5V8m5 8v-3",
              },
            ].map((f) => (
              <li
                key={f.label}
                className="flex items-center gap-2 rounded-xl bg-surface/85 dark:bg-surface/60 border border-line/60 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-2xs backdrop-blur-xs"
                style={{ color: "var(--ink)" }}
              >
                <span
                  className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--primary-soft) 85%, transparent)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    aria-hidden="true"
                  >
                    <path d={f.d} />
                  </svg>
                </span>
                <span>{f.label}</span>
              </li>
            ))}
          </motion.ul>

          {/* CTAs — Radiant gold action & glass secondary */}
          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 lg:justify-start w-full sm:w-auto"
          >
            <Link to="/courses" className="w-full sm:w-auto">
              <Button
                size="lg"
                rightIcon={<ArrowLeft className="h-5 w-5 rotate-180" />}
                className="w-full sm:w-auto !rounded-2xl border !border-[#0D2137] !bg-[#0D2137] !text-white shadow-[0_14px_34px_-10px_rgba(13,33,55,0.85)] hover:!bg-[#12314F] dark:!border-amber-400 dark:!bg-gradient-to-r dark:!from-amber-400 dark:!via-amber-500 dark:!to-amber-600 dark:!text-neutral-950 dark:shadow-[0_8px_24px_rgba(245,197,24,0.35)] dark:hover:brightness-110 font-black transition-all active:scale-[0.98] py-3 px-6 sm:px-7"
              >
                ابدأ رحلتك الآن
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              leftIcon={<PlayCircle className="h-5 w-5 text-current" />}
              className="w-full sm:w-auto !rounded-2xl !border-[#0D2137]/30 !bg-surface/80 !text-[#0D2137] hover:!bg-[#0D2137]/10 dark:!border-white/20 dark:!bg-white/10 dark:!text-white dark:hover:!bg-white/15 transition-all shadow-sm py-3 px-6 font-bold"
            >
              شاهد الإعلان التعريفي
            </Button>
          </motion.div>

          {/* Student trust proof */}
          <motion.div
            variants={item}
            className="flex items-center justify-center lg:justify-start gap-2 pt-1 text-xs text-ink-muted"
          >
            <div className="flex -space-x-1.5 rtl:space-x-reverse">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-[9px] font-black text-neutral-950 ring-2 ring-bg">★</span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white ring-2 ring-bg">٩٩٪</span>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white ring-2 ring-bg">✓</span>
            </div>
            <span className="font-medium">
              أكثر من <strong className="font-bold text-ink">15,000+ طالب</strong> يذاكرون بذكاء يومياً
            </span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
