import React from "react";
import { BookOpen, Award, ScrollText, Users } from "lucide-react";
import { SectionHeader } from "../ui/SectionHeader";

/** Each pillar carries its own identity color so no two nodes look alike */
const FEATURES = [
  {
    icon: BookOpen,
    num: "٠١",
    title: "سرد قصصي شيق",
    description:
      "تحويل المنهج المعقد إلى قصص درامية مرتبطة زمانياً ومكانياً، فاسترجاع المعلومة في الامتحان يصل تلقائياً.",
    accent: "#C9A15A", // ذهبي
    accentSoft: "rgba(201,161,90,0.12)",
  },
  {
    icon: ScrollText,
    num: "٠٢",
    title: "محتوى معتمد ومطوّر",
    description:
      "مذكرات وملفات مبنية على مواصفات وزارة التربية والتعليم، محدثة سنوياً مع أحدث نماذج الامتحانات.",
    accent: "#38BDF8", // سماوي
    accentSoft: "rgba(56,189,248,0.12)",
  },
  {
    icon: Award,
    num: "٠٣",
    title: "بنك أسئلة معتمد",
    description:
      "آلاف الأسئلة بمستويات تفكير عليا مصممة وفقاً لنظام الثانوية العامة والمركز القومي للامتحانات.",
    accent: "#34D399", // زمردي
    accentSoft: "rgba(52,211,153,0.12)",
  },
  {
    icon: Users,
    num: "٠٤",
    title: "متابعة فردية ودورية",
    description:
      "تقييم مستمر بعد كل محاضرة، وإشعارات لولي الأمر بالدرجات والغياب لضمان الانضباط حتى يوم الامتحان.",
    accent: "#C084FC", // بنفسجي
    accentSoft: "rgba(192,132,252,0.12)",
  },
];

/** Corner placement of each node around the hub (desktop) */
const NODE_POS = [
  "right-[2%] top-[6%]", // ٠١ — أعلى اليمين (بداية القراءة RTL)
  "left-[2%] top-[6%]", // ٠٢ — أعلى اليسار
  "right-[2%] bottom-[6%]", // ٠٣ — أسفل اليمين
  "left-[2%] bottom-[6%]", // ٠٤ — أسفل اليسار
];

/** Soft curved spokes hub → corner */
const SPOKE_PATHS = [
  "M50 50 Q39 39 27 27",
  "M50 50 Q61 39 73 27",
  "M50 50 Q39 61 27 73",
  "M50 50 Q61 61 73 73",
];
const NODE_XY: Array<[number, number]> = [
  [27, 27],
  [73, 27],
  [27, 73],
  [73, 73],
];

/** Color-coded pillar node — quiet card, alive on hover */
const FeatureNode: React.FC<{
  feature: (typeof FEATURES)[number];
  index: number;
}> = ({ feature, index }) => {
  const Icon = feature.icon;
  return (
    <div
      className={`group relative isolate overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-4 transition-all duration-300 hover:border-gold-500/50 hover:shadow-lg sm:p-5 shadow-sm`}
      style={{ "--whyus-accent": feature.accent } as React.CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${feature.accent}70`;
        e.currentTarget.style.boxShadow = `0 12px 28px -10px ${feature.accent}35`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* ghost numeral watermark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-3 left-3 select-none text-7xl font-black leading-none opacity-[0.05] transition-opacity duration-500 group-hover:opacity-[0.1]"
        style={{ color: feature.accent }}
      >
        {feature.num}
      </span>

      <div className="relative flex items-center justify-between gap-2">
        {/* icon tile in the pillar's own color */}
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110"
          style={{
            borderColor: `${feature.accent}47`,
            backgroundColor: feature.accentSoft,
            boxShadow: `0 0 18px -8px ${feature.accent}66`,
          }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: feature.accent }}
            strokeWidth={1.7}
            aria-hidden="true"
          />
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-black tabular-nums border"
          style={{ color: feature.accent, backgroundColor: feature.accentSoft, borderColor: `${feature.accent}30` }}
        >
          {feature.num}
        </span>
      </div>

      <h3
        className="relative mt-3 text-base font-bold sm:text-lg text-ivory font-display"
      >
        {feature.title}
      </h3>
      <p
        className="relative mt-1.5 text-xs text-ivory-muted leading-relaxed"
      >
        {feature.description}
      </p>
    </div>
  );
};

/**
 * "Why Sanad?" — a smooth, creative hub-and-spoke diagram:
 * Fixed layout shift issues, eliminated sluggish jumpy entry animations,
 * and enabled clean, instant 60fps presentation.
 */
export const WhyUs: React.FC = () => {
  return (
    <section className="heritage-container relative py-6">
      <SectionHeader
        eyebrow="ليه سند؟"
        shape="swoosh"
        fontMix
        title="طريقة تدريس تضمن لك الفهم قبل الحفظ"
        description="نجمع بين عمق المعلومة التاريخية وأحدث وسائل التعلم الرقمي التفاعلي."
        className="mb-12 text-center"
      />

      {/* ══ Desktop / tablet: hub-and-spoke diagram ══ */}
      <div className="relative hidden md:block w-full max-w-5xl mx-auto">
        <div className="relative mx-auto aspect-[16/9] max-h-[520px] min-h-[420px] w-full">
          {/* ── curved spokes: clean vector lines ── */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {SPOKE_PATHS.map((d, i) => (
              <React.Fragment key={d}>
                {/* faint rail */}
                <path
                  d={d}
                  fill="none"
                  stroke={FEATURES[i].accent}
                  strokeOpacity="0.12"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                />
                {/* Static connector */}
                <path
                  d={d}
                  fill="none"
                  stroke={FEATURES[i].accent}
                  strokeOpacity="0.55"
                  strokeWidth="0.6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </React.Fragment>
            ))}

            {/* diamond endpoints in each pillar's color */}
            {NODE_XY.map(([x, y], i) => (
              <rect
                key={`n-${x}-${y}`}
                x={x - 1}
                y={y - 1}
                width="2"
                height="2"
                transform={`rotate(45 ${x} ${y})`}
                fill={FEATURES[i].accent}
                opacity="0.75"
              />
            ))}
          </svg>

          {/* Central hub */}
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="group relative flex h-40 w-40 items-center justify-center xl:h-48 xl:w-48 transition-transform duration-300">
              <span
                aria-hidden="true"
                className="whyus-orbit absolute inset-0 rounded-full border border-dashed border-gold-500/30"
              />

              {/* four static color studs — one per pillar, sitting on the orbit */}
              {FEATURES.map((f, i) => (
                <span
                  key={`stud-${f.num}`}
                  aria-hidden="true"
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: f.accent,
                    boxShadow: `0 0 8px 2px ${f.accent}55`,
                    ...(i === 0
                      ? { top: "9%", right: "9%" }
                      : i === 1
                      ? { top: "9%", left: "9%" }
                      : i === 2
                      ? { bottom: "9%", right: "9%" }
                      : { bottom: "9%", left: "9%" }),
                  }}
                />
              ))}

              <span
                aria-hidden="true"
                className="absolute inset-2 rounded-full border border-gold-500/20"
              />

              <div
                className="flex h-[80%] w-[80%] flex-col items-center justify-center gap-1.5 rounded-full border border-gold-500/40 text-center shadow-gold-glow transition-transform duration-500 group-hover:scale-105 bg-surface-card"
              >
                <span
                  className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-gold-500/40 bg-bg"
                >
                  <img
                    src="/image/logo.png"
                    alt="Sanad Logo"
                    className="h-9 w-9 sm:h-10 sm:w-10 object-contain drop-shadow-[0_0_8px_rgba(201,161,90,0.45)] transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <p className="px-4 font-bold leading-snug text-xs sm:text-[13px] text-gold-300 font-display">
                  طريقة مذاكرة أذكى
                </p>
                <p
                  className="text-[10px] text-ivory-muted"
                >
                  فهم ← تثبيت ← إتقان
                </p>
              </div>
            </div>
          </div>

          {/* ── the four pillars, pinned to the diagram corners ── */}
          <div className="pointer-events-none absolute inset-0">
            {FEATURES.map((feature, i) => (
              <div
                key={`abs-${feature.title}`}
                className={`pointer-events-auto absolute w-[38%] max-w-[330px] ${NODE_POS[i]}`}
              >
                <FeatureNode feature={feature} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Mobile: vertical journey cards ══ */}
      <div className="relative mx-auto max-w-md space-y-4 md:hidden">
        {FEATURES.map((feature, i) => (
          <div key={feature.title} className="relative">
            <FeatureNode feature={feature} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyUs;
