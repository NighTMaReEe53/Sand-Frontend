import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Landmark,
  ScrollText,
  Map,
  Swords,
  BookOpen,
} from "lucide-react";
import { useCoursesQuery } from "../../hooks/queries/useCourses";
import { reviewsApi, TestimonialItem } from "../../api/phase2-teacher.api";
import { useAuthStore } from "../../store/authStore";
import { AddToCartButton } from "../../components/cart/AddToCartButton";
import { showGuestCartToast } from "../../components/cart/GuestCartToast";
import { useEnrollFreeCourseMutation } from "../../hooks/mutations/useCourseMutations";
import { Course } from "../../types/course.types";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { CourseCard } from "../../components/courses/CourseCard";
import { FeatureMarquee } from "../../components/sections/FeatureMarquee";
import { Hero } from "../../components/sections/Hero";
import { WhyUs } from "../../components/sections/WhyUs";

/* Perf: below-the-fold sections are code-split so the eager landing
   chunk stays small — each section streams in with its own Suspense
   fallback sized to avoid layout shift. */

const FeaturesSection = React.lazy(
  () => import("../../components/FeaturesSection/FeaturesSection")
);
const CourseSlider = React.lazy(() =>
  import("../../components/courses/CourseSlider").then((m) => ({
    default: m.CourseSlider,
  }))
);
const Testimonials = React.lazy(() =>
  import("../../components/sections/Testimonials").then((m) => ({
    default: m.Testimonials,
  }))
);
const CTASection = React.lazy(() =>
  import("../../components/sections/CTASection").then((m) => ({
    default: m.CTASection,
  }))
);
const LottiePlayer = React.lazy(
  () => import("../../components/ui/LottiePlayer")
);
import { SectionHeader } from "../../components/ui/SectionHeader";
import { IconCircle } from "../../components/ui/IconCircle";
import { useGsapScrollReveal } from "../../hooks/useGsapScrollReveal";
import { toast } from "sonner";
import { formatGradeLevel } from "../../lib/utils";

/* ─── Decorative SVG divider: book → dotted journey → pen ──────── */
const JourneyDivider: React.FC = () => (
  <div
    aria-hidden="true"
    className="mx-auto flex max-w-xl items-center justify-center gap-4 py-2 opacity-80"
  >
    {/* Mini open book */}
    <svg viewBox="0 0 40 28" fill="none" className="h-7 w-10 shrink-0">
      <path
        d="M20 5C15.5 1.5 9 .8 3 2.5V24c6-1.7 12.5-.8 17 2.5C24.5 23.2 31 22.3 37 24V2.5C31 .8 24.5 1.5 20 5Z"
        fill="var(--primary-soft)"
        stroke="var(--primary)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20 5v21.5"
        stroke="var(--primary)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>

    {/* Dotted journey line with a milestone star */}
    <svg viewBox="0 0 220 24" fill="none" className="h-6 w-40 shrink-0 sm:w-56">
      <path
        d="M4 12h84"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 8"
        opacity="0.6"
      />
      <path
        d="M110 3l2.2 5.4L118 10l-5.8 1.6L110 17l-2.2-5.4L102 10l5.8-1.6L110 3Z"
        fill="var(--gold-500, #b8860b)"
      />
      <path
        d="M132 12h84"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 8"
        opacity="0.6"
      />
    </svg>

    {/* Mini pen */}
    <svg viewBox="0 0 16 34" fill="none" className="h-8 w-4 shrink-0">
      <rect
        x="4"
        y="2"
        width="8"
        height="20"
        rx="3.5"
        fill="var(--surface)"
        stroke="var(--primary)"
        strokeWidth="1.8"
      />
      <path
        d="M4 22c0 4.5 4 10 4 10s4-5.5 4-10H4Z"
        fill="var(--primary-soft)"
        stroke="var(--primary)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const HomePage: React.FC = () => {
  // §7: scroll-linked reveals — vertical motion only so it feels native in RTL (§11)
  const revealRef = useGsapScrollReveal();
  // Perf: the lottie JSON (~heavy) is only fetched when its section approaches
  // the viewport instead of blocking initial page load.
  const lottieSectionRef = React.useRef<HTMLDivElement>(null);
  const [lottieVisible, setLottieVisible] = React.useState(false);
  const coursesSectionRef = React.useRef<HTMLElement>(null);
  const [coursesVisible, setCoursesVisible] = React.useState(false);
  const testimonialsSectionRef = React.useRef<HTMLDivElement>(null);
  const [testimonialsVisible, setTestimonialsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = lottieSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLottieVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The course carousel is several sections below the hero. Defer its list
  // request until it is close enough to be useful for the visitor.
  React.useEffect(() => {
    const el = coursesSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCoursesVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "650px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Testimonials are below the course preview; postpone their API call until
  // the visitor is approaching that section instead of competing with the hero.
  React.useEffect(() => {
    const el = testimonialsSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTestimonialsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { data: coursesData, isLoading: isLoadingCourses } = useCoursesQuery(
    {
      limit: 8,
      status: "PUBLISHED",
    },
    coursesVisible
  );
  const courses: Course[] = Array.isArray(coursesData?.data)
    ? coursesData.data
    : Array.isArray(coursesData?.courses)
    ? coursesData.courses
    : Array.isArray(coursesData)
    ? (coursesData as Course[])
    : [];
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { mutate: enrollFree, isPending: isEnrollingFree } =
    useEnrollFreeCourseMutation();

  const requireAuth = () => {
    toast.warning("يجب تسجيل الدخول أولاً", {
      description: "سجّل دخولك عشان تقدر تضيف الكورس أو تشترك فيه يا بطل!",
      action: {
        label: "تسجيل الدخول",
        onClick: () => navigate("/auth/login"),
      },
      duration: 5000,
    });
  };

  const stages = [
    {
      id: "SEC_3_LITERARY",
      title: "الثانوية العامة (أدبي)",
      desc: "الشرح المعمق للمنهج مع تدريبات بنك الأسئلة والخرائط التاريخية",
      icon: Landmark,
    },
    {
      id: "SEC_2",
      title: "الصف الثاني الثانوي",
      desc: "تأسيس قوي في التاريخ الإسلامي والحضارات القديمة",
      icon: ScrollText,
    },
    {
      id: "SEC_1",
      title: "الصف الأول الثانوي",
      desc: "مدخل ممتع لدراسة الحضارة والتاريخ برؤية حديثة",
      icon: Map,
    },
    {
      id: "PREP_3",
      title: "الصف الثالث الإعدادي",
      desc: "المراجعات النهائية وأقوى ملخصات التاريخ لشهادة الإعدادية",
      icon: Swords,
    },
  ];

  // §12.8 — curated testimonials from the backend (real enrolled students only),
  // falling back to the static showcase items while loading or if empty.
  const staticTestimonials = [
    {
      name: "أحمد محمود",
      grade: "أولى جمهورية - دفعة 2025",
      text: "سند خلّى مذاكرة التاريخ أوضح وأسهل. الكورسات والاختبارات وبنك الأسئلة بيساعدوك تراجع وتدخل الامتحان وانت واثق.",
    },
    {
      name: "سارة خالد",
      grade: "الدرجة النهائية في التاريخ",
      text: "المنصة سهلت عليا جداً متابعة الدروس وإعادة الفيديوهات والامتحانات الفورية بعد كل درس. شكراً جداً لأستاذنا الغالي.",
    },
    {
      name: "عمر ياسر",
      grade: "ثانوية عامة",
      text: "الخرائط التفاعلية وطريقة ربط الأحداث ببعضها كانت السر في تثبيت المعلومة من أول مرة بدون حفظ أعمى.",
    },
  ];

  const { data: apiTestimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => reviewsApi.getTestimonials(6),
    enabled: testimonialsVisible,
    staleTime: 1000 * 60 * 10, // rotation pool refreshes periodically
  });

  const testimonials = apiTestimonials?.length
    ? (apiTestimonials as TestimonialItem[]).map((t) => ({
        name: t.studentName,
        grade: formatGradeLevel(t.gradeLevel),
        text: t.comment ?? "",
        photoUrl: t.photoUrl,
        courseTitle: t.courseTitle,
        rating: t.rating,
      }))
    : staticTestimonials;

  return (
    <div className="heritage-page space-y-24 pb-20">
      {/* ─── SECTION 1: HERO ─────────────────────────────────────────── */}
      <Hero />

      {/* ─── SECTION 3: WHY US ───────────────────────────────────────── */}
      <div className="content-auto">
        <WhyUs />
      </div>

      {/* ─── PLATFORM FEATURES ───────────────────────────────────────── */}
      <div className="content-auto">
        <React.Suspense
          fallback={
            <div
              className="min-h-[560px] md:min-h-[640px]"
              aria-hidden="true"
            />
          }
        >
          <FeaturesSection />
        </React.Suspense>
      </div>

      {/* ─── SECTION 5: ACADEMIC STAGES ──────────────────────────────── */}
      <section ref={revealRef} className="heritage-container content-auto">
        <SectionHeader
          eyebrow="المراحل الدراسية"
          shape="arc"
          fontMix
          title="برامج متخصصة لكل صف دراسي"
          description="اختر مرحلتك الدراسية للوصول مباشرة إلى الكورسات والمحاضرات الخاصة بك"
          className="mb-12"
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, idx) => (
            <Link
              key={stage.id}
              to={`/courses?gradeLevel=${stage.id}`}
              className="heritage-card reveal group relative flex flex-col justify-between overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold-500 hover:shadow-gold-glow"
            >
              {/* Corner watermark number */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-3 -top-5 select-none text-[72px] font-black leading-none opacity-[0.07]"
                style={{ color: "var(--primary)" }}
              >
                {idx + 1}
              </span>

              <div className="space-y-4">
                <IconCircle>
                  <stage.icon className="h-6 w-6" strokeWidth={1.5} />
                </IconCircle>
                <h3
                  className="text-lg font-bold transition-colors"
                  style={{ color: "var(--ink)" }}
                >
                  {stage.title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {stage.desc}
                </p>
              </div>

              <div
                className="pt-6 flex items-center text-xs font-bold gap-1"
                style={{ color: "var(--primary)" }}
              >
                <span>تصفح الكورسات</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <JourneyDivider />
      </section>

      {/* ─── FEATURES MARQUEE: flowing ribbons after the stages ──────── */}
      <div className="content-auto">
        <FeatureMarquee />
      </div>

      {/* ─── SECTION 6: COURSES PREVIEW (CONNECTED TO LIVE BACKEND) ──── */}
      <section ref={coursesSectionRef} className="relative content-auto">
        {/* Decorative background pattern */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--primary)]/[0.03] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[var(--gold)]/[0.04] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/[0.02] blur-[100px]" />
        </div>

        <div className="heritage-container relative">
          <div className="mb-14 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5 w-full">
              {/* Online-learning animation anchors the section header (lazy-mounted) */}
              <div ref={lottieSectionRef} className="hidden shrink-0 md:block">
                {lottieVisible && (
                  <React.Suspense fallback={null}>
                    <LottiePlayer
                      src="/lottie/Online%20Learning%20Platform.json"
                      loop
                      className="h-32 w-32"
                    />
                  </React.Suspense>
                )}
              </div>
              <div className="w-full space-y-3 text-center sm:text-right flex flex-col items-center sm:items-start">
                <span className="section-eyebrow-row justify-center sm:justify-start">
                  <i className="eyebrow-dot" aria-hidden />
                  <span>الكورسات المتاحة</span>
                  <i className="eyebrow-dot" aria-hidden />
                </span>
                <h2 className="section-title section-title-stroked section-title-mixed justify-center sm:justify-start w-full">
                  <span className="title-mix-1">أحدث</span>
                  <span className="title-mix-2 font-black" style={{fontFamily: "Cairo"}}>الكورسات</span>
                  <span className="title-mix-3" style={{ fontFamily: "Amira" }}>
                    والمراجعات
                  </span>
                </h2>
                <p
                  className="max-w-lg text-sm leading-relaxed mx-auto sm:mx-0"
                  style={{ color: "var(--ink-muted)" }}
                >
                  محتوى شامل يغطي المناهج كاملة مع حلول الامتحانات — اختر كورسك
                  وابدأ رحلتك نحو التفوق
                </p>
              </div>
            </div>

            <Link to="/courses" className="group/btn shrink-0">
              <Button
                variant="outline"
                size="sm"
                rightIcon={
                  <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover/btn:-translate-x-1" />
                }
                className="!border-[var(--primary)]/30 !text-[var(--primary)] hover:!bg-[var(--primary)] hover:!text-white"
              >
                عرض كل الكورسات
              </Button>
            </Link>
          </div>

          {!coursesVisible || isLoadingCourses ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
                >
                  <div className="skeleton-sweep relative h-48 w-full overflow-hidden rounded-xl bg-[var(--surface-alt)]" />
                  <div className="mt-4 space-y-3">
                    <div className="skeleton-sweep h-5 w-3/4 overflow-hidden rounded-lg bg-[var(--surface-alt)]" />
                    <div className="skeleton-sweep h-4 w-full overflow-hidden rounded-lg bg-[var(--surface-alt)]" />
                    <div className="skeleton-sweep h-4 w-2/3 overflow-hidden rounded-lg bg-[var(--surface-alt)]" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="skeleton-sweep h-10 flex-1 overflow-hidden rounded-xl bg-[var(--surface-alt)]" />
                    <div className="skeleton-sweep h-10 flex-1 overflow-hidden rounded-xl bg-[var(--surface-alt)]" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-soft)]">
                <BookOpen
                  className="h-8 w-8 text-[var(--primary)]"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
                لا توجد كورسات حالياً
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
                تابعنا قريباً — كورسات جديدة قادمة темbrew!
              </p>
            </div>
          ) : (
            <React.Suspense
              fallback={
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
                    >
                      <div className="skeleton-sweep relative h-48 w-full overflow-hidden rounded-xl bg-[var(--surface-alt)]" />
                      <div className="mt-4 space-y-3">
                        <div className="skeleton-sweep h-5 w-3/4 overflow-hidden rounded-lg bg-[var(--surface-alt)]" />
                        <div className="skeleton-sweep h-4 w-full overflow-hidden rounded-lg bg-[var(--surface-alt)]" />
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <CourseSlider>
                {courses.map((course) => (
                  <div key={course.id} className="h-full">
                    <CourseCard course={course}>
                      {/* Action button — filled / prominent */}
                      {course.isOwner ? (
                        <Link to="/dashboard/courses" className="contents">
                          <Button
                            size="md"
                            variant="accent"
                            className="w-full !rounded-xl !py-2.5 !text-xs"
                          >
                            إدارة الكورس
                          </Button>
                        </Link>
                      ) : course.enrollmentStatus === "PENDING" ? (
                        <Button
                          size="md"
                          variant="outline"
                          disabled
                          className="w-full !rounded-xl !py-2.5 !text-xs cursor-not-allowed opacity-70"
                        >
                          بانتظار المراجعة
                        </Button>
                      ) : course.isEnrolled ||
                        course.enrollmentStatus === "ACTIVE" ? (
                        <Link to={`/courses/${course.id}`} className="contents">
                          <Button
                            size="md"
                            variant="primary"
                            className="w-full !rounded-xl !py-2.5 !text-xs !bg-emerald-600 !border-emerald-600 !text-white hover:!bg-emerald-700"
                          >
                            استكمل التعلم
                          </Button>
                        </Link>
                      ) : course.isFree ? (
                        <Button
                          size="md"
                          variant="primary"
                          isLoading={isEnrollingFree}
                          onClick={() => {
                            if (!isAuthenticated) {
                              showGuestCartToast({
                                title: course.title,
                                thumbnailUrl: course.thumbnailUrl,
                              });
                              return;
                            }
                            enrollFree(course.id);
                          }}
                          className="w-full !rounded-xl !py-2.5 !text-xs"
                        >
                          ابدأ الآن
                        </Button>
                      ) : (
                        <AddToCartButton course={course} fullWidth />
                      )}

                      {/* Details link — #FFF1 glass/outline always */}
                      <Link to={`/courses/${course.id}`} className="contents">
                        <Button
                          variant="outline"
                          size="md"
                          className="w-full !rounded-xl !py-2.5 !text-xs"
                        >
                          عرض التفاصيل
                        </Button>
                      </Link>
                    </CourseCard>
                  </div>
                ))}
              </CourseSlider>
            </React.Suspense>
          )}
        </div>
      </section>

      {/* ─── SECTION 6: TESTIMONIALS ─────────────────────────────────── */}
      <div ref={testimonialsSectionRef} className="content-auto">
        <React.Suspense
          fallback={<div className="min-h-[420px]" aria-hidden="true" />}
        >
          <Testimonials items={testimonials} />
        </React.Suspense>
      </div>

      {/* ─── SECTION 7: FINAL CTA ────────────────────────────────────── */}
      <div className="content-auto">
        <React.Suspense
          fallback={<div className="min-h-[280px]" aria-hidden="true" />}
        >
          <CTASection />
        </React.Suspense>
      </div>
    </div>
  );
};
