import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  BookX,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Compass,
  Eye,
  FileDown,
  GraduationCap,
  Landmark,
  LineChart,
  MonitorPlay,
  PenLine,
  Quote,
  Rocket,
  Search,
  Sparkles,
  Swords,
  Video,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
// Perf: lottie runtime is heavy — load it only when a player actually mounts
const LottiePlayer = React.lazy(
  () => import("../../components/ui/LottiePlayer")
);
import {
  useGsapFadeUp,
  useGsapStaggerReveal,
  useGsapHeroIntro,
} from "../../lib/useGsapReveal";
import { gsap, ScrollTrigger } from "../../lib/gsapConfig";
import "./about.css";

/* ══════════════════════════════════════════════════════════
   CONTENT — «متحف التاريخ التفاعلي»
   ══════════════════════════════════════════════════════════ */

const HERO_LOTTIE = "/lottie/hero%20section.json";
const TEACHER_LOTTIE = "/lottie/education-float.json";
const KNOWLEDGE_LOTTIE = "/lottie/knowledge-books.json";

// const ROTATING_WORDS = ['فهم', 'قصة', 'تحليل', 'شغف'];

const ROTATING_WORDS = ["معرفة", "فهم", "شغف", "طموح"];
/* Exhibits orbiting the hero arch */
const ORBIT_EXHIBITS = [
  {
    Icon: Video,
    label: "محاضرات",
    x: "-6%",
    y: "22%",
    tint: "var(--secondary)",
  },
  {
    Icon: Swords,
    label: "تحديات",
    x: "102%",
    y: "30%",
    tint: "var(--color-exams)",
  },
  {
    Icon: LineChart,
    label: "متابعة",
    x: "100%",
    y: "72%",
    tint: "var(--success)",
  },
  {
    Icon: ClipboardList,
    label: "امتحانات",
    x: "-4%",
    y: "66%",
    tint: "var(--warning)",
  },
  {
    Icon: FileDown,
    label: "ملخصات",
    x: "50%",
    y: "-5%",
    tint: "var(--color-summaries)",
  },
];

const HERO_CHECKLIST = [
  "محتوى علمي متكامل بمسار تعلم واضح",
  "متابعة أسبوعية بكويزات وامتحانات تراكمية",
  "دعم علمي وفني يجاوب على أي سؤال",
  "تجربة واحدة سلسة على الموبايل والكمبيوتر",
];

const TICKER_WORDS = [
  "تعلّم أسهل",
  "فهم أعمق",
  "محتوى أقوى",
  "اختبارات تفاعلية",
  "تقدّم مستمر",
  "تجربة تعليمية متكاملة",
  "تحديات ومكافآت",
  "طريقك للنجاح",
];

const STATS = [
  { value: 5000, suffix: "+", label: "طالب وطالبة", Icon: GraduationCap },
  { value: 300, suffix: "+", label: "فيديو تعليمي", Icon: Video },
  { value: 1000, suffix: "+", label: "سؤال وامتحان", Icon: ClipboardList },
  { value: 98, suffix: "%", label: "رضا الطلاب", Icon: Rocket },
];

const PILLARS = [
  {
    num: "01",
    Icon: BookOpen,
    title: "شرح يوصّل",
    text: "سرد وخرائط ذهنية يحوّلوا كل حادثة لحكاية مرتبطة بسببيها — فهم يفضل معاك بعد الامتحان.",
  },
  {
    num: "02",
    Icon: PenLine,
    title: "تدريب يقيس",
    text: "كويزات وامتحانات تراكمية بنظام تصحيح فوري يقيس الفهم مش التلقين.",
  },
  {
    num: "03",
    Icon: LineChart,
    title: "متابعة تصحّح",
    text: "سجل أخطاء ونِسب إتمام وترتيب — بيانات دقيقة توجه كل طالب للمسار الصح.",
  },
];

const PLAQUES = [
  {
    Icon: Compass,
    code: "لوحة أ",
    title: "رسالتنا — سند في كل خطوة",
    serifLine: '"مش بس نعلّمك… نساعدك تتقدّم"',
    text: "من أول معلومة لحد قياس مستواك وتطوير مهاراتك، بنجمع كل أدوات التعلّم في تجربة واحدة مصممة عشان تساندك في رحلتك."
  },
  {
    Icon: Eye,
    code: "لوحة ب",
    title: "رؤيتنا — تعليم يصنع أثرًا",
    serifLine: '"نبني تجربة تعليمية يستحقها كل طالب"',
    text: "محتوى موثوق، تجربة تفاعلية، ومتابعة مستمرة — عشان التعلّم يبقى أوضح، والتطور يبقى ملموس، والوصول للهدف يبقى أقرب."
  },
];

interface ExhibitItem {
  year: string;
  Icon: React.ElementType;
  tint: string;
  title: string;
  serifLine: string;
  text: string;
}

const EXHIBITS: ExhibitItem[] = [
  {
    year: "2010",
    Icon: BookOpen,
    tint: "var(--secondary)",
    title: "أول فصل… أول خريطة ",
    serifLine: '"الحكاية بدأت بحبر وورق وخريطة حائط"',
    text: "فصل صغير وعدد قليل من الطلبة — أول تجربة أثبتت إن التعليم لما يتحول لقصة وتجربة، المعلومة بتفضل في الذاكرة.",
  },
  {
    year: "2015",
    Icon: PenLine,
    tint: "var(--warning)",
    title: "من فصل… إلى حكاية أكبر",
    serifLine: '"كل سنة كانت بتضيف صفحة جديدة"',
    text: "مع الوقت كبرت التجربة، وكبر معها شغفنا بالتعليم. بدأنا نطوّر المحتوى وطرق الشرح عشان نوصل المعلومة بشكل أبسط وأقرب لكل طالب.",
  },
  {
    year: "2020",
    Icon: MonitorPlay,
    tint: "var(--info)",
    title: "16 سنة… من الخبرة",
    serifLine: '"سنين من التعلّم علّمتنا إزاي نعلّم"',
    text: "16 سنة من التجربة، الأسئلة، المحاولات والنجاحات صنعت خبرة حقيقية في فهم احتياجات الطلاب، وتقديم تعليم يجمع بين المعرفة والفهم.",
  },
  {
    year: "2026",
    Icon: Rocket,
    tint: "var(--success)",
    title: "ومن الحكاية… وُلدت سند",
    serifLine: '"النهارده بنكمّل الحكاية بشكل أكبر"',
    text: "سند هي امتداد لرحلة بدأت من فصل صغير، وتحولت إلى منصة تعليمية متكاملة، هدفها إن كل طالب يلاقي الأدوات والمعرفة اللي تساعده يكمّل طريقه بثقة.",
  },
];

const HUB_MODULES = [
  { Icon: CalendarClock, label: "محاضرات منتظمة" },
  { Icon: Video, label: "حل واجب مصور" },
  { Icon: ClipboardList, label: "امتحانات وكويزات" },
  { Icon: BookX, label: "سجل أخطائي" },
  { Icon: Search, label: "بحث ذكي" },
  { Icon: FileDown, label: "ملخصات PDF" },
];

const WINGS = [
  {
    Icon: CalendarClock,
    tint: "var(--color-schedule)",
    code: "جناح ١",
    title: "جدول ثابت طول الترم",
    description:
      "نزول منتظم للمحاضرات والمراجعات والكويزات الأسبوعية — تعرف كل يوم إيه اللي في انتظارك، ومفيش مفاجآت آخر لحظة.",
    chips: ["محاضرة أسبوعيًا", "كويز دوري", "مراجعة نهائية"],
    wide: true,
  },
  {
    Icon: BookX,
    tint: "var(--color-mistakes)",
    code: "جناح ٢",
    title: "سجل أخطائي",
    description:
      "كل غلطة في امتحاناتك محفوظة، تراجعها وتتقنها قبل الامتحان الحقيقي.",
  },
  {
    Icon: Swords,
    tint: "var(--color-exams)",
    code: "جناح ٣",
    title: "تحديات بين الطلبة",
    description: "نافس زمايلك في تحديات سرعة، وشوف اسمك على منصة الترتيب.",
  },
  {
    Icon: Search,
    tint: "var(--color-smart-search)",
    code: "جناح ٤",
    title: "بحث ذكي",
    description: "اكتب أي سؤال أو درس، والنتيجة توصلك فورًا من وسط المنهج كله.",
  },
  {
    Icon: FileDown,
    tint: "var(--color-summaries)",
    code: "جناح ٥",
    title: "ملخصات جاهزة",
    description: "ملخصات PDF منظمة لكل فصل، تنزلها وتذاكر منها في أي وقت.",
  },
];

const ADMISSION_STEPS = [
  {
    num: "٠١",
    title: "أنشئ حسابك",
    description: "تسجيل سريع برقم موبايلك ومرحلك الدراسي.",
  },
  {
    num: "٠٢",
    title: "اشترك في الكورس",
    description: "تصفح الكورسات واختر ما يناسب صعوبتك.",
  },
  {
    num: "٠٣",
    title: "شاهد وتدرب",
    description: "محاضرات مرتبة وواجبات بحلول مصورة.",
  },
  {
    num: "٠٤",
    title: "تابع تقدمك",
    description: "نسبتك وترتيبك وأخطاؤك في لوحة واحدة.",
  },
];

/* Distinct gradient per step box — creative, color-coded sequence */
const STEP_THEMES = [
  { from: "#0D2137", to: "#1B4B84" }, // navy → blue
  { from: "#0F3D3E", to: "#0E7490" }, // teal → cyan
  { from: "#312E81", to: "#6D28D9" }, // indigo → violet
  { from: "#7C2D12", to: "#EA580C" }, // rust → orange
];

/* ══════════════════════════════════════════════════════════
   SMALL PIECES
   ══════════════════════════════════════════════════════════ */

const RotatingWord: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const t = setInterval(() => setIdx((i) => i + 1), 2200);
    return () => clearInterval(t);
  }, [prefersReducedMotion]);

  return (
    <span className="relative inline-block min-w-[4ch] align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={idx}
          className="title-blaka inline-block"
          initial={prefersReducedMotion ? false : { y: "60%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { y: "-60%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {ROTATING_WORDS[idx % ROTATING_WORDS.length]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/** Four-point sparkle star. */
const SparkleStar: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className, style }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    style={style}
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 0l2.6 8.2L23 12l-8.4 3.8L12 24l-2.6-8.2L1 12l8.4-3.8L12 0z" />
  </svg>
);

/** Hand-drawn curly arrow (draws itself on scroll). */
const CurlyArrow: React.FC<{ className?: string; flip?: boolean }> = ({
  className,
  flip,
}) => (
  <svg
    viewBox="0 0 90 60"
    fill="none"
    className={className}
    style={flip ? { transform: "scaleX(-1)" } : undefined}
    aria-hidden
  >
    <path
      className="about-doodle-path"
      pathLength={1}
      d="M84 8 C 64 32, 42 44, 12 42"
      stroke="var(--warning)"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <path
      className="about-doodle-path"
      pathLength={1}
      d="M23 31 L11 42 L26 51"
      stroke="var(--warning)"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Section header: code badge + centered title + rule lines. */
const MuseumHead: React.FC<{
  code: string;
  title: React.ReactNode;
  sub?: string;
  center?: boolean;
}> = ({ code, title, sub, center = true }) => (
  <div className={`museum-head space-y-2.5 ${center ? "text-center" : ""}`}>
    <div className={`museum-head-rule ${center ? "justify-center" : ""}`}>
      <span className="rule-line" aria-hidden />
      <span className="exhibit-code font-oi font-bold">
        <SparkleStar className="h-3 w-3" style={{ color: "var(--warning)" }} />
        {code}
      </span>
      <span className="rule-line" aria-hidden />
    </div>
    <h2
      className="text-2xl sm:text-4xl font-black font-din leading-snug"
      style={{ color: "var(--ink)" }}
    >
      {title}
    </h2>
    {sub && (
      <p
        className={`text-sm sm:text-base leading-relaxed font-body ${
          center ? "mx-auto max-w-xl" : ""
        }`}
        style={{ color: "var(--ink-muted)" }}
      >
        {sub}
      </p>
    )}
  </div>
);

const WavyWord: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="about-wavy">
    <span className="title-blaka">{children}</span>
    <svg
      viewBox="0 0 120 12"
      preserveAspectRatio="none"
      aria-hidden
      className="about-wavy-line"
    >
      <path
        d="M3 8 Q 18 2 33 7 T 63 7 T 93 7 T 117 7"
        stroke="var(--warning)"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  </span>
);

/* ══════════════════════════════════════════════════════════
   HERO — museum arch with spotlight + orbiting exhibits
   ══════════════════════════════════════════════════════════ */

const HeroArch: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".arch-frame",
        { autoAlpha: 0, y: 40, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }
      );
      gsap.fromTo(
        ".spot-beam",
        { scaleY: 0, transformOrigin: "top center", autoAlpha: 0 },
        {
          scaleY: 1,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power2.out",
          delay: 0.35,
        }
      );
      gsap.fromTo(
        ".orbit-chip",
        { autoAlpha: 0, scale: 0.4 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.55,
          ease: "back.out(2.2)",
          stagger: 0.14,
          delay: 0.6,
        }
      );
      /* idle bobbing — paused off-screen for perf */
      gsap.to(".orbit-chip", {
        y: "-=8",
        duration: 2.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.35 },
        delay: 1.4,
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play pause resume pause",
        },
      });
    }, el);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div ref={sceneRef} className="hero-arch-scene">
      {/* spotlight beams from above */}
      <div className="spotlight-rig" aria-hidden>
        <span className="spot-beam beam-a" />
        <span className="spot-beam beam-b" />
        <span className="spot-rail" />
      </div>

      {/* arched exhibit frame */}
      <div className="arch-frame">
        <div className="arch-inner">
          <div className="arch-lottie-wrap">
            <React.Suspense fallback={null}>
              <LottiePlayer
                src={HERO_LOTTIE}
                className="arch-lottie"
                loop
                autoplay={!prefersReducedMotion}
              />
            </React.Suspense>
          </div>
          {/* floor line inside the frame */}
          <span className="arch-floor" aria-hidden />
          {/* museum caption plate */}
          <span className="arch-caption" dir="rtl">
            <Landmark
              className="h-3.5 w-3.5"
              style={{ color: "var(--warning)" }}
            />
            قاعة التاريخ — الجناح الرئيسي
          </span>
        </div>
      </div>

      {/* orbiting exhibit chips */}
      {ORBIT_EXHIBITS.map(({ Icon, label, x, y, tint }) => (
        <span key={label} className="orbit-chip" style={{ left: x, top: y }}>
          <span
            className="orbit-dot"
            style={{
              backgroundColor: `color-mix(in srgb, ${tint} 12%, transparent)`,
              color: tint,
              borderColor: `color-mix(in srgb, ${tint} 30%, transparent)`,
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </span>
          {label}
        </span>
      ))}

      {/* rotating stamp */}
      <div className="hero-stamp" aria-hidden>
        <svg viewBox="0 0 120 120" className="stamp-ring">
          <defs>
            <path
              id="stamp-circle-path"
              d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
            />
          </defs>
          <text className="stamp-text">
            <textPath href="#stamp-circle-path" startOffset="0">
              تاريخ بيتفهم ✦ سند للتعلّم ✦ مذاكرة أذكى كل يوم ✦
            </textPath>
          </text>
        </svg>
        <SparkleStar className="stamp-core" />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */

export const AboutPage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const pageRef = useRef<HTMLDivElement>(null);

  const statsRef = useGsapFadeUp<HTMLDivElement>();
  const pillarsRef = useGsapStaggerReveal<HTMLDivElement>();
  const plaquesRef = useGsapStaggerReveal<HTMLDivElement>();
  const wingsRef = useGsapStaggerReveal<HTMLDivElement>();
  const teacherRef = useGsapFadeUp<HTMLDivElement>();
  const heroIntroRef = useGsapHeroIntro<HTMLDivElement>();

  /* ── Scoped GSAP effects ── */
  useEffect(() => {
    const el = pageRef.current;
    if (!el || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      /* Ticker loop */
      gsap.utils.toArray<HTMLElement>(".ticker-track", el).forEach((track) => {
        gsap.to(track, {
          xPercent: -50,
          repeat: -1,
          duration: 24,
          ease: "none",
        });
      });

      /* Stat counters count-up on scroll */
      gsap.utils.toArray<HTMLElement>("[data-count]", el).forEach((num) => {
        const target = Number(num.dataset.count) || 0;
        gsap.fromTo(
          num,
          { innerText: 0 },
          {
            innerText: target,
            duration: 1.8,
            ease: "power2.out",
            snap: { innerText: 1 },
            scrollTrigger: { trigger: num, start: "top 85%", once: true },
          }
        );
      });

      /* GALLERY CORRIDOR — rail fill line draws as user scrolls */
      const corridorGrid = el.querySelector<HTMLElement>(".corridor-grid");
      const corridorFill = el.querySelector<HTMLElement>(".corridor-fill");
      const corridorPulse = el.querySelector<HTMLElement>(".corridor-pulse");

      if (corridorGrid && corridorFill) {
        gsap.fromTo(
          corridorFill,
          { scaleY: 0, transformOrigin: "top center" },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: corridorGrid,
              start: "top 70%",
              end: "bottom 65%",
              scrub: 0.5,
            },
          }
        );

        if (corridorPulse) {
          gsap.fromTo(
            corridorPulse,
            { y: 0 },
            {
              y: () => corridorGrid.offsetHeight - 24,
              ease: "none",
              scrollTrigger: {
                trigger: ".corridor-grid",
                start: "top 70%",
                end: "bottom 65%",
                scrub: 0.5,
              },
            }
          );
        }
      }

      /* Corridor nodes light up when the scroll line reaches them */
      gsap.utils.toArray<HTMLElement>(".corridor-item", el).forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 62%",
          end: "bottom 40%",
          onEnter: () => item.classList.add("is-active"),
          onEnterBack: () => item.classList.add("is-active"),
          onLeaveBack: () => item.classList.remove("is-active"),
          onLeave: () => item.classList.remove("is-active"),
        });
      });

      /* System links draw toward the hub */
      gsap.utils.toArray<HTMLElement>(".sys-link", el).forEach((link, i) => {
        gsap.fromTo(
          link,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: i === 0 ? "left center" : "right center",
            duration: 0.8,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: ".system-grid",
              start: "top 78%",
              once: true,
            },
            delay: 0.12 * i,
          }
        );
      });

      const packets = gsap.utils.toArray<HTMLElement>(".sys-packet", el);
      if (packets.length) {
        gsap.fromTo(
          packets,
          { left: "-6%" },
          {
            left: "106%",
            duration: 2.2,
            ease: "power1.inOut",
            repeat: -1,
            stagger: 0.45,
            scrollTrigger: {
              trigger: ".system-grid",
              start: "top bottom",
              end: "bottom top",
              toggleActions: "play pause resume pause",
            },
          }
        );
      }

      gsap.fromTo(
        ".system-node-wrap",
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.14,
          scrollTrigger: {
            trigger: ".system-grid",
            start: "top 82%",
            once: true,
          },
        }
      );

      /* DIAGRAM — core pops in */
      gsap.fromTo(
        ".hub-core-circle",
        { autoAlpha: 0, scale: 0.7 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".system-grid",
            start: "top 75%",
            once: true,
          },
        }
      );

      /* DIAGRAM — orbital spokes draw toward the core */
      gsap.utils
        .toArray<SVGPathElement>(".hub-spoke-line", el)
        .forEach((line, i) => {
          gsap.fromTo(
            line,
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 0.7,
              ease: "power2.inOut",
              delay: 0.2 + i * 0.06,
              scrollTrigger: {
                trigger: ".system-grid",
                start: "top 70%",
                once: true,
              },
            }
          );
        });

      /* DIAGRAM — module chips pop onto the orbit */
      gsap.utils.toArray<HTMLElement>(".hub-chip", el).forEach((m, i) => {
        gsap.fromTo(
          m,
          { autoAlpha: 0, scale: 0.5 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.45,
            ease: "back.out(2)",
            delay: 0.25 + i * 0.06,
            scrollTrigger: {
              trigger: ".system-grid",
              start: "top 70%",
              once: true,
            },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div ref={pageRef} className="w-full overflow-x-clip">
      <div className="heritage-container relative space-y-24 py-12">
        {/* ══════════ MUSEUM ENTRANCE — HERO ══════════ */}
        <section className="relative z-10">
          {/* editorial masthead strip */}
          <div className="masthead-strip mb-10 flex items-center gap-4">
            <span className="strip-line flex-1" aria-hidden />
            <span className="strip-text whitespace-nowrap">
              متحف التاريخ ✦ سند للتعلّم ✦ محتوى مرتب وواضح
            </span>
            <span className="strip-line flex-1" aria-hidden />
          </div>

          <div className="flex flex-col items-center gap-16 lg:flex-row-reverse lg:items-center lg:gap-10">
            {/* visual column — arch (right) */}
            <div className="flex w-full justify-center lg:w-[50%]">
              <HeroArch />
            </div>

            {/* copy column — left */}
            <div
              ref={heroIntroRef}
              className="w-full space-y-5 sm:max-w-xl lg:w-[50%]"
            >
              <h1
                className="text-2xl font-heading leading-[1.35] sm:text-4xl lg:text-4xl font-black "
                style={{ color: "var(--ink)" }}
              >
                كل خطوة في رحلتك{" "}
                <span className="whitespace-nowrap">
                  تبدأ بـ <RotatingWord />
                </span>
                <br />
                وتنتهي{" "}
                <span className="title-blaka marker-highlight font-amira">
                  بإنجاز
                </span>
              </h1>

              <p
                className="max-w-xl text-sm sm:text-base leading-8 font-body"
                style={{ color: "var(--ink-muted)" }}
              >
                في سند، بنخلي التعلّم أسهل، والفهم أعمق، والطريق نحو أهدافك
                أوضح. كل ما تحتاجه لتتعلّم، تتطور، وتبني مستقبلك في مكان واحد.
              </p>

              <ul className="grid max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
                {HERO_CHECKLIST.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--success)" }}
                    />
                    <span
                      className="text-xs sm:text-sm"
                      style={{ color: "var(--ink)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/courses">
                  <Button
                    size="lg"
                    rightIcon={<ArrowLeft className="h-5 w-5 rotate-180" />}
                    className="shadow-gold-glow hover:shadow-gold-glow-lg"
                  >
                    ابدأ التعلم الآن
                  </Button>
                </Link>
                <a href="#platform-diagram">
                  <Button
                    size="lg"
                    variant="outline"
                    leftIcon={<Sparkles className="h-5 w-5" />}
                  >
                    جولة داخل المتحف
                  </Button>
                </a>
                <span
                  className="relative hidden items-end sm:inline-flex"
                  aria-hidden
                >
                  <CurlyArrow className="w-20 -rotate-6" />
                  <span
                    className="absolute -bottom-4 end-1 whitespace-nowrap text-[0.65rem] font-bold"
                    style={{ color: "var(--warning)" }}
                  >
                    يلا نبدأ!
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* scroll-down hint */}
          <motion.a
            href="#about-story"
            aria-label="انزل لقصتنا"
            className="about-scroll-hint"
            animate={prefersReducedMotion ? undefined : { y: [0, 7, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="mouse-outline" aria-hidden>
              <span className="mouse-wheel" />
            </span>
            <span className="scroll-hint-label">جولة في الأجنحة</span>
          </motion.a>
        </section>

        {/* ══════════ TICKER BAND ══════════ */}
        <div className="relative z-10" aria-hidden>
          <div className="ticker-band">
            <div className="ticker-track">
              {[...TICKER_WORDS, ...TICKER_WORDS].map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="ticker-item"
                  style={{ fontFamily: "Tajawal" }}
                >
                  <SparkleStar className="star h-4 w-4" />
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ STATS — brass plaques on dark wall ══════════ */}
        <section
          ref={statsRef}
          className="cv-auto dark-wall relative z-10 overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12"
        >
          <svg
            aria-hidden
            viewBox="0 0 800 300"
            preserveAspectRatio="none"
            fill="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1]"
          >
            <circle
              cx="760"
              cy="-20"
              r="160"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <path
              d="M0 260 Q 400 180 800 250"
              stroke="#ffffff"
              strokeWidth="1"
              opacity=".5"
            />
          </svg>

          <div className="flex items-center justify-center gap-1 flex-col">
            <img
              src="/image/logo.png"
              alt="منصه سند"
              className="w-16 h-16 object-cover"
            />
            <p
              className="relative mb-8 text-center text-sm font-bold tracking-wide"
              style={{ color: "#ddb44e" }}
            >
              احصائيات سند
            </p>
          </div>

          <div className="stats-wall relative grid grid-cols-2 gap-y-8 lg:grid-cols-4">
            {STATS.map(({ value, suffix, label, Icon }, i) => (
              <React.Fragment key={label}>
                {i > 0 && (
                  <span className="stat-divider hidden lg:block" aria-hidden />
                )}
                <div className="space-y-1 px-2 text-center">
                  <Icon
                    className="mx-auto mb-2 h-6 w-6"
                    style={{ color: "#ddb44e" }}
                  />
                  <p
                    className="text-3xl font-black sm:text-4xl"
                    dir="ltr"
                    style={{ color: "#ffffff" }}
                  >
                    <span data-count={value}>0</span>
                    {suffix}
                  </p>
                  <p
                    className="text-xs sm:text-sm"
                    style={{ color: "rgba(255,255,255,0.72)" }}
                  >
                    {label}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ══════════ METHOD — three engraved plaques ══════════ */}
        <div className="relative z-10 space-y-8">
          <span aria-hidden className="about-watermark">
            الطريقة
          </span>
          <MuseumHead
            code="القاعة الأولى — طريقتنا"
            title={
              <>
                ثلاث ركائز بتخلي التعلّم <WavyWord>أسهل</WavyWord>
              </>
            }
          />

          <div
            ref={pillarsRef}
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            {PILLARS.map(({ num, Icon, title, text }) => (
              <div
                key={num}
                className="plaque-card group relative rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-2"
              >
                <span className="plaque-num" dir="ltr" aria-hidden>
                  {num}
                </span>
                <span
                  className="plaque-icon"
                  style={{ color: "var(--primary)" }}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <h3
                  className="text-lg font-bold"
                  style={{ color: "var(--ink)" }}
                >
                  {title}
                </h3>
                <p
                  className="mt-2 text-sm leading-7"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {text}
                </p>
                {/* screw dots of the plaque */}
                <span className="plaque-screw top-start" aria-hidden />
                <span className="plaque-screw top-end" aria-hidden />
                <span className="plaque-screw bottom-start" aria-hidden />
                <span className="plaque-screw bottom-end" aria-hidden />
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ STORY — gallery corridor ══════════ */}
        <div
          id="about-story"
          className="cv-auto relative z-10 scroll-mt-24 space-y-10"
        >
          <span aria-hidden className="about-watermark">
            قصتنا
          </span>
          <MuseumHead
            code="القاعة الثانية — قصتنا"
            title={
              <>
                <WavyWord>حكاية</WavyWord> بتتكتب من{" "}
                <span className="title-blaka">١٦ سنة</span>
              </>
            }
            sub="من فصل صغير بخريطة حائط… لمنصة رقمية بتابع كل طالب خطوة بخطوة."
          />

          {/* museum room wrapping the corridor of exhibits */}
          <div className="gallery-room relative mx-auto max-w-6xl px-3 py-12 sm:px-8 lg:py-16">
            <div className="corridor-grid relative space-y-12 lg:space-y-6">
              {/* center rail + scrub fill + traveling pulse */}
              <span aria-hidden className="corridor-rail hidden lg:block" />
              <span aria-hidden className="corridor-fill hidden lg:block" />
              {!prefersReducedMotion && (
                <span aria-hidden className="corridor-pulse hidden lg:block" />
              )}

              {EXHIBITS.map(
                ({ year, Icon, tint, title, serifLine, text }, i) => {
                  const evenRow = i % 2 === 0;
                  return (
                    <div
                      key={year}
                      className="corridor-item relative lg:grid lg:min-h-[190px] lg:grid-cols-[1fr_96px_1fr] lg:items-center"
                    >
                      {/* diamond node on the rail — pinned to center column */}
                      <div
                        className="corridor-node relative z-[2] mx-auto hidden lg:flex lg:col-start-2 lg:row-start-1 lg:flex-col lg:items-center lg:gap-2.5 transition-transform duration-300"
                        aria-hidden
                      >
                        <span
                          className="frame-node"
                          style={{ "--dot": tint } as React.CSSProperties}
                        >
                          <span className="frame-node-icon">
                            <Icon className="h-6 w-6" />
                          </span>
                        </span>
                        <span className="node-year" dir="ltr">
                          {year}
                        </span>
                      </div>

                      {/* framed exhibit card */}
                      <article
                        style={{
                          transform: evenRow
                            ? "rotate(-0.6deg)"
                            : "rotate(0.6deg)",
                        }}
                        className={`exhibit-card group relative space-y-2.5 rounded-xl p-7 sm:p-8 lg:row-start-1 transition-all duration-300 hover:-translate-y-1 hover:rotate-0 ${
                          evenRow ? "lg:col-start-1" : "lg:col-start-3"
                        }`}
                      >
                        {/* wire + nail the frame hangs from */}
                        <svg
                          viewBox="0 0 100 24"
                          className="hang-wire"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M50 3 L8 23 M50 3 L92 23"
                            stroke="color-mix(in srgb, var(--ink) 28%, transparent)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="50"
                            cy="3"
                            r="3.2"
                            fill="var(--warning)"
                            stroke="var(--surface)"
                            strokeWidth="1.4"
                          />
                        </svg>

                        {/* ghost year numeral */}
                        <span aria-hidden className="ghost-year" dir="ltr">
                          {year}
                        </span>

                        {/* mobile year chip */}
                        <span
                          className="year-chip mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.68rem] font-bold lg:hidden"
                          dir="ltr"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${tint} 10%, transparent)`,
                            color: tint,
                            border: `1px solid color-mix(in srgb, ${tint} 25%, transparent)`,
                          }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {year}
                        </span>

                        {/* connector stub to the rail */}
                        <span
                          aria-hidden
                          className={`absolute top-1/2 hidden h-px w-[46px] bg-[color-mix(in_srgb,var(--ink)_14%,transparent)] lg:block ${
                            evenRow ? "start-full" : "end-full"
                          }`}
                        />

                        <span className="exhibit-label">
                          {["٠١", "٠٢", "٠٣", "٠٤"][i]}
                        </span>
                        <h3
                          className="text-xl font-bold sm:text-2xl"
                          style={{ color: "var(--ink)" }}
                        >
                          {title}
                        </h3>
                        <p
                          className="about-serif text-lg sm:text-xl"
                          style={{ color: tint }}
                        >
                          {serifLine}
                        </p>
                        <p
                          className="pt-1 text-sm leading-7 sm:text-[0.95rem]"
                          style={{ color: "var(--ink-muted)" }}
                        >
                          {text}
                        </p>
                      </article>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* ══════════ MISSION & VISION — wall plaques ══════════ */}
        <div className="cv-auto relative z-10 space-y-8">
          <span aria-hidden className="about-watermark">
            رسالة
          </span>
          <MuseumHead
            code="القاعة الثالثة — فكرة المشروع"
            title={
              <>
                منصة <WavyWord>متكامله</WavyWord> … لتجربة تعلّم تصنع فرقًا
              </>
            }
            sub="شرح يوصّل، تدريب يقيس، ومتابعة تصحّح المسار — كل جزء بيخدم التاني."
          />

          <div
            ref={plaquesRef}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {PLAQUES.map(({ Icon, code, title, serifLine, text }) => (
              <div
                key={title}
                className="wall-plaque group relative overflow-hidden rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-2"
              >
                <Quote
                  aria-hidden
                  className="absolute left-5 top-5 h-12 w-12 rotate-180 opacity-[0.07]"
                  style={{ color: "var(--primary)" }}
                />
                <div className="mb-3 flex items-center justify-between">
                  <Icon
                    className="h-7 w-7"
                    style={{ color: "var(--primary)" }}
                  />
                  <span className="plaque-code">{code}</span>
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: "var(--ink)" }}
                >
                  {title}
                </h3>
                <p
                  className="about-serif mt-2 text-base leading-relaxed"
                  style={{ color: "var(--primary-strong)" }}
                >
                  {serifLine}
                </p>
                <p
                  className="mt-2 text-sm leading-7"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ SYSTEM DIAGRAM — With Platform Logo ══════════ */}
        <div
          id="platform-diagram"
          className="cv-auto relative z-10 scroll-mt-24 space-y-8"
        >
          <span aria-hidden className="about-watermark">
            منظومة
          </span>
          <MuseumHead
            code="القاعة الرابعة — كيف تعمل المنصة"
            title={
              <>
                رحلة داخل <span className="title-blaka">المنصة</span>
              </>
            }
            sub="الطالب يتعلم ويتدرب، المنصة تحلل، والنتيجة تظهر في لوحة تقدم تفاعلية."
          />

          <div className="system-grid grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto_1.35fr_auto_1fr]">
            <div className="system-node-wrap">
              <SystemNode
                icon={<GraduationCap className="h-8 w-8" />}
                title="الطالب"
                text="يشاهد، يتدرب، ويختبر نفسه يوميًا"
              />
            </div>

            <div className="sys-link mx-auto hidden lg:block" aria-hidden>
              <span className="sys-packet" />
            </div>

            {/* hub core — orbital reactor with Platform Logo */}
            <div className="system-node-wrap">
              <div className="hub-orbit relative mx-auto aspect-square w-full max-w-[420px] transition-transform duration-300 hover:scale-[1.02]">
                {/* breathing rings around the core */}
                <span aria-hidden className="orbit-ring ring-a" />
                <span aria-hidden className="orbit-ring ring-b" />
                {/* dashed orbit track */}
                <span aria-hidden className="orbit-track" />

                {/* radial spokes + packets flowing into the core (md+) */}
                <svg
                  viewBox="0 0 100 100"
                  className="hub-spokes-svg hidden md:block"
                  fill="none"
                  aria-hidden
                >
                  {HUB_MODULES.map((_, i) => {
                    const rad = ((i * 60 - 90) * Math.PI) / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    const x1 = 50 + 28 * cos;
                    const y1 = 50 + 28 * sin;
                    const x2 = 50 + 43 * cos;
                    const y2 = 50 + 43 * sin;
                    return (
                      <g key={i}>
                        <path
                          className="hub-spoke-line"
                          pathLength={1}
                          d={`M ${x1} ${y1} L ${x2} ${y2}`}
                          stroke="color-mix(in srgb, var(--primary) 38%, transparent)"
                          strokeWidth="1.4"
                        />
                        <circle
                          cx={x2}
                          cy={y2}
                          r="2"
                          fill="var(--warning)"
                          opacity="0.8"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* the core with Platform Logo */}
                <div className="hub-core-circle group">
                  <div className="relative mb-1 flex items-center justify-center">
                    <img
                      src="/image/logo.png"
                      alt="شعار المنصة"
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  </div>
                  <h3>نواة المنصة</h3>
                  <p>ستة أنظمة تعمل معًا خلف الكواليس</p>
                </div>

                {/* module satellites riding the orbit */}
                {HUB_MODULES.map(({ Icon, label }, i) => {
                  const rad = ((i * 60 - 90) * Math.PI) / 180;
                  const left = 50 + 43 * Math.cos(rad);
                  const top = 50 + 43 * Math.sin(rad);
                  return (
                    <span
                      key={label}
                      className="hub-chip"
                      style={{ left: `${left}%`, top: `${top}%` }}
                    >
                      <Icon
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: "var(--primary)" }}
                      />
                      {label}
                    </span>
                  );
                })}
              </div>

              {/* compact grid fallback for small screens */}
              <div className="mt-5 grid grid-cols-2 gap-2.5 md:hidden">
                {HUB_MODULES.map(({ Icon, label }) => (
                  <span key={label} className="hub-chip justify-center">
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--primary)" }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="sys-link mx-auto hidden lg:block" aria-hidden>
              <span className="sys-packet" />
            </div>

            <div className="system-node-wrap">
              <SystemNode
                icon={<LineChart className="h-8 w-8" />}
                title="لوحة التقدم"
                text="نسب الإتمام، الترتيب، والأخطاء المتكررة"
              />
            </div>
          </div>
        </div>

        {/* ══════════ WINGS — gallery wall ══════════ */}
        <div className="cv-auto relative z-10 space-y-8">
          <span aria-hidden className="about-watermark">
            أجنحة
          </span>
          <MuseumHead
            code="القاعة الخامسة — جدار المميزات"
            title={
              <>
                كل اللي تحتاجه… في <span className="title-blaka">مكان</span>{" "}
                واحد
              </>
            }
          />

          <div
            ref={wingsRef}
            className="gallery-wall grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {WINGS.map(
              ({ Icon, tint, code, title, description, chips, wide }) => (
                <div
                  key={title}
                  className={`wing-frame group relative space-y-3 rounded-xl p-6 transition-transform duration-300 hover:-translate-y-1.5 ${
                    wide ? "sm:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-0.5 origin-right scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{
                      background: `linear-gradient(to left, ${tint}, transparent)`,
                    }}
                  />
                  <div
                    className={
                      wide
                        ? "flex flex-wrap items-start justify-between gap-4"
                        : ""
                    }
                  >
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${tint} 9%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${tint} 24%, transparent)`,
                        color: tint,
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="wing-code" style={{ color: `${tint}` }}>
                      {code}
                    </span>
                  </div>
                  <h3
                    className="text-base font-bold sm:text-lg"
                    style={{ color: "var(--ink)" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed sm:text-sm"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {description}
                  </p>
                  {chips && (
                    <div className="flex flex-wrap gap-2">
                      {chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full px-3 py-1 text-[0.68rem] font-bold"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${tint} 8%, transparent)`,
                            color: tint,
                          }}
                        >
                          #{chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* ══════════ ADMISSION — roadmap steps ══════════ */}
        <div className="cv-auto relative z-10 space-y-10">
          <MuseumHead
            code="بوابة الدخول — ابدأ من هنا"
            title={
              <>
                تبدأ إزاي؟ <span className="title-blaka"><span style={{fontFamily: "Tajawal"}}>٤</span> خطوات</span> وبس
              </>
            }
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ADMISSION_STEPS.map(({ num, title, description }, i) => {
              const icons = ["🔑", "📚", "🎬", "📊"];
              const theme = STEP_THEMES[i % STEP_THEMES.length];
              return (
                <div
                  key={num}
                  className="group relative flex flex-col items-center overflow-hidden rounded-3xl p-7 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  style={{
                    background: `linear-gradient(140deg, ${theme.from}, ${theme.to})`,
                  }}
                >
                  {/* big number watermark */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -top-4 -right-1 select-none text-[5.5rem] font-black leading-none opacity-10"
                    style={{ color: "#ffffff" }}
                    dir="ltr"
                  >
                    {num}
                  </span>

                  {/* icon bubble */}
                  <div
                    className="relative z-10 flex h-[70px] w-[70px] items-center justify-center rounded-2xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "rgba(255,255,255,0.16)",
                      border: "1px solid rgba(255,255,255,0.28)",
                    }}
                  >
                    <span className="text-3xl">{icons[i]}</span>
                  </div>

                  {/* step number label */}
                  <span className="relative z-10 mt-1 text-[11px] font-bold tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.7)" }}>
                    الخطوة {num}
                  </span>

                  {/* content */}
                  <div className="relative z-10 mt-1 space-y-2">
                    <h3 className="text-lg font-black leading-snug text-white">{title}</h3>
                    <p className="text-xs leading-relaxed text-white/85 sm:text-sm">{description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════ أمين المتحف — teacher plaque ══════════ */}
        <div
          ref={teacherRef}
          className="cv-auto relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.25fr]"
        >
          <div className="relative mx-auto w-full max-w-sm">
            {/* portrait frame */}
            <div className="portrait-frame">
              <React.Suspense fallback={null}>
                <LottiePlayer
                  src={TEACHER_LOTTIE}
                  className="portrait-lottie"
                  loop
                  autoplay={!prefersReducedMotion}
                />
              </React.Suspense>
              <span className="portrait-caption">فريق سند
              </span>
            </div>
            <CurlyArrow
              className="absolute -bottom-1 end-0 hidden w-20 rotate-[160deg] sm:block"
              aria-hidden
            />
          </div>

          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            className="wall-plaque relative overflow-hidden rounded-3xl p-8"
          >
            <Quote
              aria-hidden
              className="absolute left-6 top-6 h-16 w-16 rotate-180 opacity-[0.06]"
              style={{ color: "var(--primary)" }}
            />

            <div className="flex items-center gap-4">
              <motion.div
                animate={
                  prefersReducedMotion ? undefined : { rotate: [0, -3, 3, 0] }
                }
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] text-4xl font-bold shadow-gold-glow"
                style={{
                  color: "var(--primary)",
                  border:
                    "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                }}
              >
                <img src="image/logo.png" alt="" />
              </motion.div>
              <div>
                <span className="plaque-code block">فريق سند
                </span>
                <h3
                  className="text-xl font-bold"
                  style={{ color: "var(--primary)" }}
                >
من خبرة التعليم… إلى مستقبل التعلّم                </h3>
                <p
                  className="about-serif text-base"
                  style={{ color: "var(--primary-strong)" }}
                >
«خبرة حقيقية، بتجربة مصممة للطالب»
</p>
              </div>
            </div>

            <p
              className="mt-4 text-sm leading-7"
              style={{ color: "var(--ink-muted)" }}
            >
على مدار 16 عامًا، تعلّمنا أن التعليم الحقيقي لا يعتمد على المعلومة وحدها، بل على طريقة تقديمها ومتابعة أثرها. لذلك بنينا سند لتجمع بين الخبرة التعليمية، المحتوى الموثوق، والتقنية الحديثة في تجربة واحدة.            </p>

            <div className="mt-5 flex items-end gap-3">
              <p
                className="about-serif text-2xl leading-none"
                style={{ color: "var(--primary)" }}
              >
                سند للتعلّم
              </p>
              <svg
                viewBox="0 0 160 14"
                className="mb-1 h-3.5 w-32"
                fill="none"
                aria-hidden
              >
                <path
                  className="about-doodle-path"
                  pathLength={1}
                  d="M4 9 Q 40 2 80 8 T 156 7"
                  stroke="var(--warning)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* ══════════ CTA — exit through the gift shop ══════════ */}
        <div className="cv-auto relative z-10 pb-8 pt-2">
          <div className="dark-wall relative overflow-hidden rounded-[2.5rem] px-6 py-14 sm:px-12">
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="cta-grid"
                  width="42"
                  height="42"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M42 0 H0 V42"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-grid)" />
            </svg>

            <SparkleStar
              className="float-slow pointer-events-none absolute top-10 start-[16%] hidden h-5 w-5 opacity-40 lg:block"
              style={{ color: "#ddb44e" }}
            />

            <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-5 text-center lg:text-start">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "#ddb44e",
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  دورك دلوقتي — ابدأ رحلتك
                </span>
                <h2
                  className="text-center text-3xl leading-snug sm:text-4xl"
                  style={{ color: "#ffffff", fontWeight: 900, fontFamily: "Amira" }}
                >
                  جاهز تبدأ رحلتك نحو{" "}
                  <span className="about-wavy">
                    <span style={{ color: "#ddb44e" }}>التفوق</span>
                    <svg
                      viewBox="0 0 120 12"
                      preserveAspectRatio="none"
                      aria-hidden
                      className="about-wavy-line"
                    >
                      <path
                        d="M3 8 Q 18 2 33 7 T 63 7 T 93 7 T 117 7"
                        stroke="#ddb44e"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </span>{" "}
                  في التاريخ؟
                </h2>
                <p
                  className="mx-auto max-w-md text-sm leading-7 lg:mx-0"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  أنشئ حسابك في دقيقة، تصفح الكورسات، وخلّي أول محاضرة هي أول
                  خطوة في حكاية نجاحك — ومعاك دعم علمي وفني طوال الطريق.
                </p>
                <div className="relative flex flex-wrap items-center justify-center gap-3 pt-1 lg:justify-start">
                  <Link to="/courses">
                    <Button
                      size="lg"
                      rightIcon={<ArrowLeft className="h-5 w-5 rotate-180" />}
                      className="shadow-gold-glow hover:shadow-gold-glow-lg"
                    >
                      ابدأ التعلم الآن وتصفح الكورسات
                    </Button>
                  </Link>
                  <CurlyArrow
                    className="-mt-8 hidden w-20 -rotate-[135deg] md:block"
                    flip
                    aria-hidden
                  />
                </div>
              </div>

              <React.Suspense fallback={null}>
                <LottiePlayer
                  src={KNOWLEDGE_LOTTIE}
                  className="cta-lottie mx-auto w-full max-w-[240px]"
                  loop
                  autoplay={!prefersReducedMotion}
                />
              </React.Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SYSTEM NODE
   ══════════════════════════════════════════════════════════ */

interface SystemNodeProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

const SystemNode: React.FC<SystemNodeProps> = ({ icon, title, text }) => {
  return (
    <div className="wall-plaque flex flex-row items-center gap-4 rounded-3xl p-6 lg:flex-col lg:text-center transition-transform duration-300 hover:-translate-y-1.5">
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
          border:
            "1px solid color-mix(in srgb, var(--primary) 22%, transparent)",
          color: "var(--primary)",
        }}
      >
        {icon}
      </span>
      <div>
        <h3 className="text-base font-bold" style={{ color: "var(--ink)" }}>
          {title}
        </h3>
        <p
          className="mt-1 text-xs leading-relaxed"
          style={{ color: "var(--ink-muted)" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
