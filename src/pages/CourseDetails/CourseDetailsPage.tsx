import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  PlayCircle,
  FileText,
  Clock,
  Award,
  Lock,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
  Loader2,
  ChevronDown,
  FileQuestion,
  TrendingUp,
  ArrowLeft,
  GraduationCap,
  Layers,
  Star,
  Share2,
  Check,
  BookOpenCheck,
  Play,
  Infinity as InfinityIcon,
  Smartphone,
} from "lucide-react";
import { useCourseDetailQuery } from "../../hooks/queries/useCourses";
import { CourseReviewsSection } from "../../components/courses/CourseReviewsSection";
import { CourseIntroVideoModal } from "../../components/courses/CourseIntroVideoModal";
import { useCurriculumQuery } from "../../hooks/queries/useCurriculum";
import {
  useCourseExamsQuery,
  useMyResultsQuery,
} from "../../hooks/queries/useExams";
import { MyResultItem } from "../../api/exams.api";
import { useCourseProgressQuery } from "../../hooks/queries/useProgress";
import { useCartStore } from "../../store/cartStore";
import { AddToCartButton } from "../../components/cart/AddToCartButton";
import { useAuthStore } from "../../store/authStore";
import { useEnrollFreeCourseMutation } from "../../hooks/mutations/useCourseMutations";
import {
  formatGradeLevel,
  formatGradeLevels,
  formatDate,
  formatDuration,
} from "../../lib/utils";
import { formatTargets } from "../../lib/formatTargets";
import { Button } from "../../components/ui/Button";
import { HeadingAccent } from "../../components/ui/HeadingAccent";
import { Badge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/PageLoader";
import { CoursePrice } from "../../components/ui/CoursePrice";
import { Modal } from "../../components/ui/Modal";
import { InlineErrorBoundary } from "../../components/ui/InlineErrorBoundary";
import { Lesson } from "../../types/course.types";
import { lessonsApi } from "../../api/lessons.api";
import { useCourseVideoQuery } from "../../hooks/queries/useVideos";
import { toast } from "sonner";

// Lazy-loaded heavy components for modals
const VideoPlayer = lazy(() =>
  import("../../components/video/VideoPlayer").then((m) => ({
    default: m.VideoPlayer,
  }))
);
const QuizPanel = lazy(() =>
  import("../Learn/QuizPanel").then((m) => ({ default: m.QuizPanel }))
);
const QuizPanelTeacherPreview = lazy(() =>
  import("../Learn/QuizPanel").then((m) => ({
    default: m.QuizPanelTeacherPreview,
  }))
);
const HomeworkPanel = lazy(() =>
  import("../Learn/HomeworkPanel").then((m) => ({ default: m.HomeworkPanel }))
);
const HomeworkPanelTeacherPreview = lazy(() =>
  import("../Learn/HomeworkPanel").then((m) => ({
    default: m.HomeworkPanelTeacherPreview,
  }))
);

const ModalSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-10">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

export const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: course, isLoading, isError } = useCourseDetailQuery(id);
  const { data: curriculum } = useCurriculumQuery(id || "");
  const { hasItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const canViewExams = Boolean(
    isAuthenticated && (course?.isEnrolled || course?.isOwner)
  );
  const { data: exams = [] } = useCourseExamsQuery(id, canViewExams);
  const role = useAuthStore((state) => state.user?.role);
  const isEnrolledStudent =
    isAuthenticated && role === "STUDENT" && Boolean(course?.isEnrolled);
  const { data: progressData } = useCourseProgressQuery(
    id || "",
    isEnrolledStudent
  );
  const { mutate: enrollFree, isPending: isEnrollingFree } =
    useEnrollFreeCourseMutation();

  // الفيديو التعريفي المخصص للكورس
  const { data: courseVideoData } = useCourseVideoQuery(id || undefined);
  const customIntroVideo = courseVideoData?.video ?? null;
  const [introOpen, setIntroOpen] = useState(false);

  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [homeworkLesson, setHomeworkLesson] = useState<Lesson | null>(null);

  type ContentFilter =
    | "all"
    | "lessons"
    | "quizzes"
    | "homeworks"
    | "materials";
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all");
  const CONTENT_FILTERS: {
    value: ContentFilter;
    label: string;
    Icon: typeof Layers;
  }[] = [
    { value: "all", label: "الكل", Icon: Layers },
    { value: "lessons", label: "الدروس", Icon: PlayCircle },
    { value: "quizzes", label: "الكويزات", Icon: FileQuestion },
    { value: "homeworks", label: "الواجبات", Icon: BookOpenCheck },
    { value: "materials", label: "الملفات", Icon: FileText },
  ];

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<
    "syllabus" | "outcomes" | "instructor" | "reviews"
  >("syllabus");
  const [copiedLink, setCopiedLink] = useState(false);

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  useEffect(() => {
    const firstSection = curriculum?.sections?.[0];
    if (firstSection) {
      setOpenSections((current) =>
        current.size === 0 ? new Set([firstSection.id]) : current
      );
    }
  }, [curriculum]);

  const allSectionIds = (curriculum?.sections ?? []).map((s) => s.id);
  const allOpen =
    allSectionIds.length > 0 &&
    allSectionIds.every((sid) => openSections.has(sid));

  const curriculumLessons = useMemo(
    () => curriculum?.sections?.flatMap((s) => s.lessons ?? []) ?? [],
    [curriculum]
  );
  const totalDurationSeconds = useMemo(
    () =>
      curriculumLessons.reduce(
        (acc, l) => acc + (Number(l.durationSeconds) || 0),
        0
      ),
    [curriculumLessons]
  );
  const totalQuizzes = useMemo(
    () =>
      curriculum?.totalQuizzes ??
      curriculumLessons.reduce((acc, l) => acc + (l.quizzes?.length ?? 0), 0),
    [curriculum, curriculumLessons]
  );

  const previewLessons = useMemo(
    () => curriculumLessons.filter((l) => l.isPreview),
    [curriculumLessons]
  );

  const progressByLessonId = useMemo(() => {
    const map = new Map<
      string,
      { isCompleted: boolean; watchedPercentage: number }
    >();
    (progressData?.lessons ?? []).forEach((lp) => {
      map.set(lp.lessonId, {
        isCompleted: lp.isCompleted,
        watchedPercentage: lp.watchedPercentage ?? 0,
      });
    });
    return map;
  }, [progressData]);

  const { data: myResults } = useMyResultsQuery(isEnrolledStudent);
  const quizResultsMap = useMemo(() => {
    const map = new Map<string, MyResultItem>();
    (myResults?.quizAttempts ?? []).forEach((a) => {
      const existing = map.get(a.quizId);
      if (!existing || a.score > existing.score) {
        map.set(a.quizId, a);
      }
    });
    return map;
  }, [myResults]);

  const homeworkResultsMap = useMemo(() => {
    const map = new Map<string, any>();
    (myResults?.homeworkAttempts ?? []).forEach((a: any) =>
      map.set(a.homeworkId, a)
    );
    return map;
  }, [myResults]);

  const handleWatchLesson = async (lesson: Lesson) => {
    setPreviewLesson(lesson);
    setStreamUrl(null);
    setStreamError(null);
    setStreamLoading(true);
    try {
      if (
        lesson.videoUrl &&
        (lesson.videoUrl.includes("youtube.com") ||
          lesson.videoUrl.includes("youtu.be"))
      ) {
        setStreamUrl(lesson.videoUrl);
      } else {
        const url = await lessonsApi.getStreamUrl(lesson.id);
        setStreamUrl(url);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "تعذر تشغيل هذا الفيديو. تأكد من توفر الفيديو.";
      setStreamError(msg);
    } finally {
      setStreamLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: course?.title || "كورس التاريخ - منصة سند",
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("تم نسخ رابط الكورس بنجاح!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return <PageLoader label="جاري تحميل الكورس…" className="min-h-[70vh]" />;
  }

  if (isError || !course) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-display text-primary">
          الكورس غير موجود
        </h2>
        <p className="text-xs text-ivory-muted">
          ربما تم حذف الكورس أو أن الرابط غير صحيح.
        </p>
        <Link to="/courses">
          <Button variant="outline">العودة لقائمة الكورسات</Button>
        </Link>
      </div>
    );
  }

  const handleEnrollOrCart = () => {
    if (!isAuthenticated) {
      toast.warning("يجب تسجيل الدخول أولاً", {
        description: "سجّل دخولك عشان تقدر تضيف الكورس أو تشترك فيه يا بطل!",
        action: {
          label: "تسجيل الدخول",
          onClick: () => navigate("/auth/login"),
        },
        duration: 5000,
      });
      return;
    }
    if (role === "TEACHER" || role === "ADMIN") {
      toast.warning("الاشتراك في الكورسات متاح للطلاب فقط", {
        description:
          role === "TEACHER"
            ? "أنت مسجل بحساب مدرس — إن كان هذا الكورس من إنشائك فاستخدم حساب المدرس الصاحب له."
            : "يمكنك إدارة الكورسات من لوحة التحكم.",
      });
      return;
    }
    enrollFree(course.id, {
      onSuccess: () => {
        navigate("/my-courses");
      },
    });
  };

  const lessons = course.lessons || [];
  const totalDurationMinutes = Math.round(totalDurationSeconds / 60);
  const isEnrolledActive =
    course.isEnrolled || course.enrollmentStatus === "ACTIVE";
  const isPendingEnrollment = course.enrollmentStatus === "PENDING";
  const isOwner = course.isOwner === true;
  const isStaffVisitor =
    isAuthenticated && !isOwner && (role === "TEACHER" || role === "ADMIN");
  const targetGrades = course.gradeLevels?.length
    ? course.gradeLevels
    : [course.gradeLevel];
  const taxonomyTargets = (
    course as {
      targets?: import("../../types/taxonomy.types").CourseTargetRef[];
    }
  ).targets;
  /* The complete taxonomy is useful, but repeating "stage · grade" for
     every track makes the course header unreadable. Keep the full string for
     the tooltip and show a compact, decision-friendly summary in the hero. */
  const audienceSummary = (() => {
    if (taxonomyTargets?.length) {
      const fullLabel = formatTargets(taxonomyTargets);
      const gradeNames = Array.from(
        new Set(taxonomyTargets.map((target) => target.grade.name).filter(Boolean)),
      );
      const trackNames = Array.from(
        new Set(
          taxonomyTargets
            .map((target) => target.track?.name)
            .filter((name): name is string => Boolean(name)),
        ),
      );

      if (gradeNames.length === 1) {
        return {
          label: gradeNames[0],
          detail:
            trackNames.length === 1
              ? trackNames[0]
              : trackNames.length > 1
                ? `${trackNames.length.toLocaleString('ar-EG')} مسارات`
                : null,
          fullLabel,
        };
      }

      return {
        label: gradeNames[0] || 'المرحلة الدراسية',
        detail: `+${(gradeNames.length - 1).toLocaleString('ar-EG')} فئات أخرى`,
        fullLabel,
      };
    }

    return {
      label: targetGrades[0] ? formatGradeLevel(targetGrades[0]) : 'المرحلة الدراسية',
      detail:
        targetGrades.length > 1
          ? `+${(targetGrades.length - 1).toLocaleString('ar-EG')} صفوف أخرى`
          : null,
      fullLabel: formatGradeLevels(targetGrades),
    };
  })();

  const numericPrice = Number(course.price) || 0;
  const hasActiveOffer =
    !!course.discountPercent &&
    course.discountPercent > 0 &&
    !!course.discountEndsAt &&
    new Date(course.discountEndsAt).getTime() > Date.now();
  const discountedPrice = hasActiveOffer
    ? Math.round(numericPrice * (1 - course.discountPercent! / 100))
    : numericPrice;

  const hasFreeVideo = Boolean(customIntroVideo || previewLessons.length > 0);

  const handleOpenFreePreview = () => {
    if (customIntroVideo) {
      setIntroOpen(true);
    } else if (previewLessons.length > 0) {
      handleWatchLesson(previewLessons[0]);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 text-right pb-28 lg:pb-12">
      {/* ─── Breadcrumb & Share Actions ─────────────────────────────── */}
      <div className="w-full flex items-center justify-between gap-3 flex-wrap text-xs text-ivory-muted">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          <Link
            to="/courses"
            className="hover:text-primary transition-colors shrink-0"
          >
            الكورسات
          </Link>
          <span>/</span>
          <span
            title={audienceSummary.fullLabel}
            className="inline-flex min-w-0 max-w-[min(48vw,25rem)] items-center gap-1 rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary"
          >
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{audienceSummary.label}</span>
            {audienceSummary.detail && (
              <span className="shrink-0 text-primary/70">• {audienceSummary.detail}</span>
            )}
          </span>
          <span>/</span>
          <span className="text-primary font-bold truncate max-w-[180px] sm:max-w-xs">
            {course.title}
          </span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-card border border-surface-border hover:border-gold-500/40 text-ivory transition-all text-xs shrink-0"
        >
          {copiedLink ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Share2 className="w-3.5 h-3.5 text-gold-400" />
          )}
          <span>{copiedLink ? "تم النسخ!" : "مشاركة الكورس"}</span>
        </button>
      </div>

      {/* ─── Udemy-Style Hero Section (Fully Responsive 2-Col Grid) ──── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ─── Main Details Column (Desktop 8 Cols) ─── */}
        <div className="w-full min-w-0 lg:col-span-8 space-y-6">
          {/* Main Info Card */}
          <div className="w-full p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-surface-card via-surface/95 to-surface-card border border-primary/20 shadow-sm relative overflow-hidden space-y-5">
            {/* Ambient Background Glow */}
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none bg-gold-500/10 blur-3xl"
            />

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 relative z-10">
              {((course as { subjectRef?: { id: string; name: string } | null })
                .subjectRef ||
                (course as { subject?: string | null }).subject) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300">
                  <BookOpen className="w-3 h-3" />
                  {(course as { subjectRef?: { name: string } | null })
                    .subjectRef?.name ??
                    (course as { subject?: string | null }).subject}
                </span>
              )}
              <Badge
                variant="gold"
                title={audienceSummary.fullLabel}
                className="max-w-full gap-1.5 items-center text-xs"
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{audienceSummary.label}</span>
                {audienceSummary.detail && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary/80">
                    {audienceSummary.detail}
                  </span>
                )}
              </Badge>
              <Badge
                variant={course.isFree ? "success" : "outline"}
                className="text-xs"
              >
                {course.isFree ? "كورس مجاني" : "كورس مدفوع"}
              </Badge>
              {hasFreeVideo && !isEnrolledActive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  معاينة مجانية متاحة
                </span>
              )}
            </div>

            {/* Title & Accent */}
            <div className="space-y-2 relative z-10">
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black font-display text-primary leading-snug break-words">
                {course.title}
              </h1>
              <HeadingAccent variant="arrow" className="w-24 sm:w-28" />
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-ivory-muted leading-relaxed whitespace-pre-line relative z-10 break-words">
              {course.description}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 relative z-10">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface/80 border border-surface-border">
                <BookOpen className="w-4 h-4 text-gold-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-ivory truncate">
                    {curriculum?.totalLessons ?? lessons.length} درس
                  </span>
                  <span className="text-[10px] text-ivory-muted">
                    شرح تفصيلي
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface/80 border border-surface-border">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-ivory truncate">
                    {totalDurationMinutes > 0
                      ? formatDuration(totalDurationMinutes)
                      : "محتوى متجدد"}
                  </span>
                  <span className="text-[10px] text-ivory-muted">
                    المدة الإجمالية
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface/80 border border-surface-border col-span-2 sm:col-span-1">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-ivory truncate">
                    {totalQuizzes > 0
                      ? `${totalQuizzes} كويز وامتحان`
                      : "امتحانات دورية"}
                  </span>
                  <span className="text-[10px] text-ivory-muted">
                    تقييم مستمر
                  </span>
                </div>
              </div>
            </div>

            {/* Teacher Row */}
            {course.teacher && (
              <div className="flex items-center gap-3 pt-3 border-t border-surface-border/60 relative z-10">
                <div className="w-11 h-11 rounded-full bg-primary-soft border border-primary/30 flex items-center justify-center text-primary font-display font-bold text-lg shrink-0 overflow-hidden shadow-gold-glow">
                  {course.teacher.photoUrl ? (
                    <img
                      src={course.teacher.photoUrl}
                      alt={course.teacher.fullName}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    course.teacher.fullName?.[0] || "أ"
                  )}
                </div>
                <div className="text-xs min-w-0">
                  <span className="text-ivory-muted block text-[10px]">
                    المحاضر:
                  </span>
                  <span className="text-ivory font-bold text-sm truncate block">
                    {course.teacher.fullName}
                  </span>
                  {course.teacher.specialization && (
                    <span className="text-gold-400 text-[11px] truncate block">
                      {course.teacher.specialization}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ Udemy-Style Dedicated Free Promo Video Banner ═══ */}
          {customIntroVideo ? (
            <div className="w-full relative group overflow-hidden rounded-3xl border border-gold-500/40 bg-gradient-to-r from-gold-500/10 via-surface-card to-surface-card p-4 sm:p-5 shadow-sm shadow-gold-950/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] border border-gold-500/40 text-white shadow-gold-glow group-hover:scale-105 transition-transform">
                    <Play className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-400 border border-gold-500/40 text-white">
                        معاينة مجانية
                      </span>
                      <span className="text-[11px] text-ivory-muted">
                        متاح للجميع مجاناً
                      </span>
                    </div>
                    <p
                      className="text-md font-bold text-ivory mt-0.5 truncate"
                      style={{ fontFamily: "Tajawal" }}
                    >
                      {customIntroVideo.title ??
                        "المحاضرة التعريفية وشرح محتوى الكورس"}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIntroOpen(true)}
                  className="w-full sm:w-auto text-xs py-2.5 px-5 shadow-gold-glow shrink-0 font-bold"
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                >
                  مشاهدة المحاضرة المجانية
                </Button>
              </div>
            </div>
          ) : previewLessons.length > 0 ? (
            <div className="w-full relative group overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-surface-card to-surface-card p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 group-hover:scale-105 transition-transform">
                    <PlayCircle className="h-6 w-6 fill-current" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                        درس مجاني
                      </span>
                      <span className="text-[11px] text-ivory-muted">
                        معاينة مجانية قبل الاشتراك
                      </span>
                    </div>
                    <p className="text-sm font-bold text-ivory mt-0.5 truncate">
                      {previewLessons[0].title}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleWatchLesson(previewLessons[0])}
                  className="w-full sm:w-auto text-xs py-2.5 px-5 shrink-0 border-emerald-500/40 text-emerald-300 font-bold"
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                >
                  مشاهدة المعاينة ({previewLessons.length} درس)
                </Button>
              </div>
            </div>
          ) : null}

          {/* ═══ Udemy-Style Student Learning Hub Panel (If Enrolled) ═══ */}
          {isEnrolledActive && role === "STUDENT" && (
            <div className="w-full rounded-3xl bg-gradient-to-r  via-surface-card to-surface-card border border-emerald-500/30 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> مشترك نشط
                    </span>
                    <h3 className="text-base font-bold text-ivory mt-1 truncate">
                      مرحباً بك! تابع تقدمك في هذا الكورس
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <Link
                    to={`/courses/${course.id}/learn${
                      progressData?.resume?.lessonId
                        ? `?lesson=${progressData.resume.lessonId}`
                        : ""
                    }`}
                    className="flex-1 sm:flex-none"
                  >
                    <Button
                      size="sm"
                      className="w-full text-xs py-2.5 px-5 shadow-emerald-glow font-bold"
                      leftIcon={<PlayCircle className="w-4 h-4" />}
                    >
                      {progressData?.resume?.lessonId
                        ? "متابعة التعلم"
                        : "ابدأ الكورس"}
                    </Button>
                  </Link>
                  <Link
                    to={`/courses/${course.id}/exams`}
                    className="flex-1 sm:flex-none"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs py-2.5 px-4"
                      leftIcon={<Award className="w-4 h-4" />}
                    >
                      الامتحانات
                    </Button>
                  </Link>
                  <Link
                    to={`/courses/${course.id}/qa`}
                    className="flex-1 sm:flex-none"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs py-2.5 px-4"
                      leftIcon={<HelpCircle className="w-4 h-4" />}
                    >
                      الأسئلة
                    </Button>
                  </Link>
                </div>
              </div>

              {progressData && (
                <div className="space-y-2 pt-2 border-t border-surface-border/60">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      نسبة الإنجاز
                    </span>
                    <span className="text-ivory-muted tabular-nums">
                      {progressData.completedLessons} من{" "}
                      {progressData.totalLessons} درس •{" "}
                      <span className="text-emerald-400 font-bold">
                        {progressData.courseProgressPercentage}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface border border-surface-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-300 transition-all duration-500"
                      style={{
                        width: `${progressData.courseProgressPercentage}%`,
                      }}
                    />
                  </div>
                  {progressData.resume?.lessonId &&
                    !progressData.isCourseCompleted && (
                      <p className="text-[11px] text-ivory-muted pt-1 truncate">
                        آخر درس توقفت عنده:{" "}
                        <span className="text-ivory font-bold">
                          {progressData.resume.title}
                        </span>
                      </p>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Udemy-Style Sticky Action / Pricing Sidebar (Desktop 4 Cols) ─── */}
        <div className="w-full min-w-0 lg:col-span-4 lg:sticky lg:top-24 self-start space-y-5">
          <div className="w-full p-4 sm:p-6 rounded-3xl bg-surface-card border border-surface-border space-y-5 text-center shadow-sm">
            {/* Thumbnail Image taking 100% of Card Width with Cover Fit & Play Trigger */}
            {course.thumbnailUrl && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-surface-border relative group bg-black shadow-sm">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Play Button Overlay for Preview */}
                {hasFreeVideo && !isEnrolledActive && (
                  <button
                    type="button"
                    onClick={handleOpenFreePreview}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white group-hover:bg-black/30 transition-colors"
                  >
                    <span className="p-3.5 sm:p-4 rounded-full bg-gold-500 text-bg-base shadow-sm hover:bg-gold-400 transition-all group-hover:scale-110 transform duration-200">
                      <PlayCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
                    </span>
                    <span className="text-xs font-bold bg-black/75 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm">
                      معاينة هذا الكورس
                    </span>
                  </button>
                )}

                {/* Enrolled Badge on Thumbnail */}
                {isEnrolledActive && (
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" /> مشترك في الكورس
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Price Display */}
            <div className="space-y-1 pb-1">
              <span className="text-xs text-ivory-muted block font-medium">
                سعر الاشتراك في الكورس:
              </span>
              {hasActiveOffer && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-gold-300 bg-gold-500/10 border border-gold-500/30 rounded-full px-3 py-1 w-fit mx-auto">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>عرض خاص: خصم {course.discountPercent}%</span>
                  {course.discountEndsAt && (
                    <span className="text-ivory-muted font-normal">
                      (ينتهي {formatDate(course.discountEndsAt)})
                    </span>
                  )}
                </div>
              )}
              <div className="flex justify-center">
                <CoursePrice
                  price={discountedPrice}
                  isFree={course.isFree}
                  originalPrice={hasActiveOffer ? numericPrice : undefined}
                  size="xl"
                />
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="space-y-3">
              {isOwner ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-primary-soft border border-primary/30 flex items-center justify-center gap-2 text-primary text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>هذا الكورس من إنشائك</span>
                  </div>
                  {/* Primary: start learning */}
                  <Link to={`/courses/${course.id}/learn`} className="block">
                    <Button
                      size="lg"
                      variant="primary"
                      className="w-full"
                      leftIcon={<PlayCircle className="w-5 h-5" />}
                    >
                      ابدأ التعلم الآن
                    </Button>
                  </Link>
                  {/* Accent: manage course — visually different from primary */}
                  <Link to="/dashboard/courses" className="block">
                    <Button
                      size="lg"
                      variant="accent"
                      className="w-full"
                      leftIcon={<BookOpen className="w-5 h-5" />}
                    >
                      إدارة الكورس في لوحة التحكم
                    </Button>
                  </Link>
                </div>
              ) : isStaffVisitor ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-primary-soft border border-primary/30 text-primary text-xs font-bold space-y-1.5 text-center">
                    <p className="flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      {role === "TEACHER"
                        ? "أنت مسجل بحساب مدرس"
                        : "أنت مسجل بحساب أدمن"}
                    </p>
                    <p className="text-[10px] text-ivory-muted font-normal leading-relaxed">
                      {role === "TEACHER"
                        ? "الاشتراك ومشاهدة الدروس متاحان للطلاب المشتركين فقط."
                        : "لوحة التحكم توفر لك وصولاً كاملاً لإدارة أي كورس."}
                    </p>
                  </div>
                  <Link
                    to={
                      role === "TEACHER"
                        ? "/dashboard/courses"
                        : "/dashboard/overview"
                    }
                    className="block"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full"
                      leftIcon={<BookOpen className="w-5 h-5" />}
                    >
                      الذهاب إلى لوحة التحكم
                    </Button>
                  </Link>
                </div>
              ) : isEnrolledActive ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>أنت مشترك بالفعل في هذا الكورس</span>
                  </div>
                  {/* Primary action: resume/start learning */}
                  <Link to={`/courses/${course.id}/learn`} className="block">
                    <Button
                      size="lg"
                      variant="primary"
                      className="w-full"
                      leftIcon={<PlayCircle className="w-5 h-5" />}
                    >
                      {progressData?.resume?.lessonId
                        ? "أكمل من حيث توقفت"
                        : "ابدأ التعلم الآن"}
                    </Button>
                  </Link>
                  {/* Accent: exams — different color from primary */}
                  <Link to={`/courses/${course.id}/exams`} className="block">
                    <Button
                      variant="accent"
                      size="sm"
                      className="w-full text-xs"
                    >
                      امتحانات الكورس
                    </Button>
                  </Link>
                  {/* Secondary grid: equal-weight outline links */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to={`/courses/${course.id}/qa`} className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        leftIcon={<HelpCircle className="h-4 w-4" />}
                      >
                        أسئلة الدورة
                      </Button>
                    </Link>
                    <Link
                      to={`/courses/${course.id}/summaries`}
                      className="block"
                    >
                      <Button
                        variant="soft"
                        size="sm"
                        className="w-full text-xs"
                        leftIcon={<FileText className="h-4 w-4" />}
                      >
                        ملخصات الدورة
                      </Button>
                    </Link>
                  </div>
                  <Link to="/my-homeworks" className="block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      leftIcon={<BookOpenCheck className="h-4 w-4" />}
                    >
                      تسليماتي
                    </Button>
                  </Link>
                </div>
              ) : isPendingEnrollment ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold space-y-1">
                    <p className="flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 animate-pulse" />
                      طلب الاشتراك قيد المراجعة
                    </p>
                    <p className="text-[10px] text-ivory-muted font-normal">
                      تم استلام الإيصال وجاري التفعيل تلقائياً.
                    </p>
                  </div>
                  <Link to="/my-courses" className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      متابعة حالة الاشتراك
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {course.isFree ? (
                    <Button
                      size="lg"
                      className="w-full font-bold"
                      isLoading={isEnrollingFree}
                      variant="primary"
                      onClick={handleEnrollOrCart}
                      leftIcon={<PlayCircle className="w-5 h-5" />}
                    >
                      اشترك الآن مجاناً
                    </Button>
                  ) : (
                    <AddToCartButton course={course} size="lg" fullWidth />
                  )}

                  {hasItem(course.id) && (
                    <Link to="/checkout" className="block">
                      <Button
                        variant="accent"
                        size="sm"
                        className="w-full font-bold"
                      >
                        الذهاب لصفحة الدفع وإتمام الطلب
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Features Checklist inside Sidebar */}
            <div className="pt-4 border-t border-surface-border text-right space-y-2.5 text-xs text-ivory-muted">
              <p className="font-bold text-ivory text-xs pb-1">
                يشمل هذا الكورس:
              </p>
              <div className="flex items-center gap-2 text-xs">
                <PlayCircle className="w-4 h-4 text-gold-400 shrink-0" />
                <span>
                  {curriculum?.totalLessons ?? lessons.length} محاضرة مسجلة
                  بجودة عالية
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>امتحانات وكويزات دورية مع التصحيح</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                <span>مذكرات PDF وتلخيصات قابلة للتحميل</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
                <span>وصول كامل عبر الهاتف والكمبيوتر</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <InfinityIcon className="w-4 h-4 text-teal-400 shrink-0" />
                <span>صلاحية دخول مستمرة طوال العام الدراسي</span>
              </div>
            </div>

            {/* Guarantee Badge */}
            <div className="pt-3 text-[11px] text-ivory-muted flex items-center justify-center gap-1.5 border-t border-surface-border">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ضمان وصول كامل للمحتوى والمراجعات</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs Bar (Sticky & Horizontal Scroll Protected) ─ */}
      <div className="w-full sticky top-[76px] z-30 py-2.5 bg-bg/95 backdrop-blur-xl border-b border-surface-border rounded-2xl">
        <div className="w-full flex items-center gap-2 overflow-x-auto custom-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1">
          <button
            type="button"
            onClick={() => setActiveTab("syllabus")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "syllabus"
                ? "bg-gold-500 text-white shadow-sm shadow-gold-500/20"
                : "text-ivory-muted hover:text-ivory bg-surface-card"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            منهج ومحتوى الكورس ({curriculum?.sections?.length || 0} فصول)
          </button>

          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("outcomes")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === "outcomes"
                  ? "bg-gold-500 text-white shadow-sm shadow-gold-500/20"
                  : "text-ivory-muted hover:text-ivory bg-surface-card"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              ماذا ستتعلم؟
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("instructor")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "instructor"
                ? "bg-gold-500 text-white shadow-sm shadow-gold-500/20"
                : "text-ivory-muted hover:text-ivory bg-surface-card"
            }`}
          >
            <User className="w-4 h-4" />
            عن المحاضر
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === "reviews"
                ? "bg-gold-500 text-white shadow-sm shadow-gold-500/20"
                : "text-ivory-muted hover:text-ivory bg-surface-card"
            }`}
          >
            <Star className="w-4 h-4" />
            آراء الطلاب والتقييمات
          </button>
        </div>
      </div>

      {/* ─── Dynamic Tab Content Body ───────────────────────────────── */}
      <div
        id="syllabus-section"
        className="w-full min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 scroll-mt-32"
      >
        {/* Main Content Area (8 Cols on Desktop) */}
        <div className="w-full min-w-0 lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full min-w-0 space-y-6"
            >
              {activeTab === "syllabus" && (
                <div className="w-full min-w-0 space-y-4">
                  {/* Syllabus Header */}
                  <div className="w-full flex items-center justify-between pb-3 border-b border-surface-border flex-wrap gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold font-display text-primary flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary shrink-0" />
                        <span className="truncate font-amira">
                          خريطة محاضرات ومنهج الكورس
                        </span>
                      </h2>
                      <p className="text-xs text-ivory-muted">
                        انقر على أي فصل لاستعراض الدروس والكويزات المتاحة
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(curriculum?.sections?.length ?? 0) > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSections(
                              allOpen ? new Set() : new Set(allSectionIds)
                            )
                          }
                          className="text-xs font-bold text-gold-400 hover:text-gold-300 transition-colors p-2 rounded-xl bg-surface-card border border-surface-border"
                        >
                          {allOpen ? "طي كافة الفصول" : "توسيع كافة الفصول"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content Filter Pills */}
                  <div className="w-full flex items-center gap-1.5 p-1 rounded-2xl bg-surface-card border border-surface-border overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {CONTENT_FILTERS.map((f) => {
                      const isActive = contentFilter === f.value;
                      const Icon = f.Icon;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => setContentFilter(f.value)}
                          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 flex-1 sm:flex-none justify-center ${
                            isActive
                              ? "text-white bg-gold-500 shadow-sm shadow-gold-500/25"
                              : "text-ivory-muted hover:text-ivory"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sections Accordion */}
                  <div className="w-full min-w-0 space-y-3">
                    {curriculum &&
                    curriculum.sections &&
                    curriculum.sections.length > 0 ? (
                      curriculum.sections.map((section, sIndex) => {
                        const sectionLessons = section.lessons || [];
                        const sectionMaterials = section.materials || [];
                        const isSectionOpen = openSections.has(section.id);
                        const sectionDurationMin = Math.round(
                          sectionLessons.reduce(
                            (acc, l) => acc + (Number(l.durationSeconds) || 0),
                            0
                          ) / 60
                        );
                        const allQuizzes = sectionLessons.flatMap(
                          (l) => l.quizzes ?? []
                        );
                        const allHomeworks = sectionLessons.flatMap(
                          (l) => l.homeworks ?? []
                        );

                        const sectionQuizzes = sectionLessons.flatMap((l) =>
                          (l.quizzes ?? []).map((q) => ({ quiz: q, lesson: l }))
                        );
                        const sectionHomeworks = sectionLessons.flatMap((l) =>
                          (l.homeworks ?? []).map((hw) => ({ hw, lesson: l }))
                        );

                        const renderTreeGroup = (
                          key: string,
                          label: string,
                          GroupIcon: React.ElementType,
                          iconTone: string,
                          badgeCls: string,
                          count: number,
                          children: React.ReactNode
                        ) => {
                          const groupKey = `${section.id}:${key}`;
                          const isGroupOpen = !collapsedGroups.has(groupKey);
                          return (
                            <div
                              key={key}
                              className="w-full rounded-2xl border border-surface-border bg-surface-card overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() => toggleGroup(groupKey)}
                                aria-expanded={isGroupOpen}
                                className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 hover:bg-surface transition-colors text-right"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <GroupIcon
                                    className={`w-4 h-4 shrink-0 ${iconTone}`}
                                  />
                                  <span className="text-xs font-bold text-ivory">
                                    {label}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-black border ${badgeCls}`}
                                  >
                                    {count}
                                  </span>
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 shrink-0 text-gold-400 transition-transform duration-300 ${
                                    isGroupOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              <AnimatePresence initial={false}>
                                {isGroupOpen && (
                                  <motion.div
                                    key="group-content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="overflow-hidden border-t border-surface-border/40 bg-surface/20"
                                  >
                                    <div className="p-2.5 space-y-2">
                                      {children}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        };

                        const hasAnyContent =
                          sectionLessons.length > 0 ||
                          sectionMaterials.length > 0 ||
                          allQuizzes.length > 0 ||
                          allHomeworks.length > 0;
                        const hasVisibleContent =
                          ((contentFilter === "all" ||
                            contentFilter === "lessons") &&
                            sectionLessons.length > 0) ||
                          ((contentFilter === "all" ||
                            contentFilter === "quizzes") &&
                            allQuizzes.length > 0) ||
                          ((contentFilter === "all" ||
                            contentFilter === "homeworks") &&
                            allHomeworks.length > 0) ||
                          ((contentFilter === "all" ||
                            contentFilter === "materials") &&
                            sectionMaterials.length > 0);

                        return (
                          <div
                            key={section.id}
                            className={`w-full rounded-2xl border transition-all overflow-hidden ${
                              isSectionOpen
                                ? "border-gold-500/40 bg-surface-card shadow-sm"
                                : "border-surface-border bg-surface-card/80 hover:border-gold-500/20"
                            }`}
                          >
                            {/* Section Header Button */}
                            <button
                              type="button"
                              onClick={() => toggleSection(section.id)}
                              aria-expanded={isSectionOpen}
                              className="w-full p-4 bg-surface/60 flex items-center justify-between gap-3 text-right hover:bg-surface transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-xs shrink-0">
                                  {sIndex + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-sm font-bold text-ivory font-display truncate">
                                    {section.title}
                                  </h3>
                                  <span className="text-[11px] text-ivory-muted flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                    {sectionLessons.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <PlayCircle className="w-3 h-3 text-gold-400/70 shrink-0" />
                                        {sectionLessons.length} دروس
                                      </span>
                                    )}
                                    {sectionDurationMin > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-gold-400/60 shrink-0" />
                                        {formatDuration(sectionDurationMin)}
                                      </span>
                                    )}
                                    {allQuizzes.length > 0 && (
                                      <span className="flex items-center gap-1 text-purple-300 font-bold">
                                        <FileQuestion className="w-3 h-3 shrink-0" />
                                        {allQuizzes.length} كويز
                                      </span>
                                    )}
                                    {allHomeworks.length > 0 && (
                                      <span className="flex items-center gap-1 text-violet-300 font-bold">
                                        <BookOpenCheck className="w-3 h-3 shrink-0" />
                                        {allHomeworks.length} واجب
                                      </span>
                                    )}
                                    {sectionMaterials.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3 text-sky-400/80 shrink-0" />
                                        {sectionMaterials.length} ملفات
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>

                              <ChevronDown
                                className={`w-5 h-5 text-gold-400 shrink-0 transition-transform duration-300 ${
                                  isSectionOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            {/* Section Content */}
                            <AnimatePresence initial={false}>
                              {isSectionOpen && (
                                <motion.div
                                  key="section-content"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden border-t border-surface-border/50 bg-surface/30"
                                >
                                  <div className="p-3.5 space-y-2.5">
                                    {!hasAnyContent ? (
                                      <div className="p-4 text-center text-xs text-ivory-muted">
                                        جاري تجهيز ورفع محتوى هذا الفصل قريباً
                                      </div>
                                    ) : !hasVisibleContent ? (
                                      <div className="p-4 text-center text-xs text-ivory-muted">
                                        لا يوجد محتوى من هذا النوع في هذا الفصل
                                      </div>
                                    ) : (
                                      <>
                                        {/* ═══ مجموعة الدروس ═══ */}
                                        {(contentFilter === "all" ||
                                          contentFilter === "lessons") &&
                                          sectionLessons.length > 0 &&
                                          renderTreeGroup(
                                            "lessons",
                                            "الدروس",
                                            PlayCircle,
                                            "text-gold-400",
                                            "bg-gold-500/10 border-gold-500/30 text-gold-300",
                                            sectionLessons.length,
                                            <>
                                              {sectionLessons.map(
                                                (lesson, lIndex) => {
                                                  const durationMin =
                                                    lesson.durationSeconds
                                                      ? Math.round(
                                                          lesson.durationSeconds /
                                                            60
                                                        )
                                                      : 0;
                                                  return (
                                                    <div
                                                      key={lesson.id}
                                                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-all text-right"
                                                    >
                                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-[11px] font-bold text-gold-400 shrink-0">
                                                          {lIndex + 1}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                          <div className="flex items-center gap-2 flex-wrap">
                                                            <h4
                                                              className={`text-xs font-bold truncate ${
                                                                progressByLessonId.get(
                                                                  lesson.id
                                                                )?.isCompleted
                                                                  ? "text-emerald-400"
                                                                  : "text-ivory"
                                                              }`}
                                                            >
                                                              {lesson.title}
                                                            </h4>
                                                            {isEnrolledStudent &&
                                                              (() => {
                                                                const lp =
                                                                  progressByLessonId.get(
                                                                    lesson.id
                                                                  );
                                                                if (
                                                                  lp?.isCompleted
                                                                ) {
                                                                  return (
                                                                    <Badge
                                                                      variant="success"
                                                                      size="sm"
                                                                      className="text-[10px]"
                                                                    >
                                                                      <CheckCircle2 className="w-3 h-3 ml-1" />
                                                                      تم
                                                                    </Badge>
                                                                  );
                                                                }
                                                                if (
                                                                  lp &&
                                                                  lp.watchedPercentage >
                                                                    0
                                                                ) {
                                                                  return (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-400 bg-gold-500/10 border border-gold-500/25 px-2 py-0.5 rounded-md">
                                                                      {Math.round(
                                                                        lp.watchedPercentage
                                                                      )}
                                                                      % مشاهدة
                                                                    </span>
                                                                  );
                                                                }
                                                                return null;
                                                              })()}
                                                            {lesson.isPreview && (
                                                              <Badge
                                                                variant="success"
                                                                size="sm"
                                                                className="text-[10px]"
                                                              >
                                                                معاينة مجانية
                                                              </Badge>
                                                            )}
                                                          </div>

                                                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                                            {durationMin >
                                                              0 && (
                                                              <span className="text-[10px] text-ivory-muted flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5 text-gold-400/60" />
                                                                {durationMin}{" "}
                                                                دقيقة
                                                              </span>
                                                            )}
                                                            {(lesson.quizzes
                                                              ?.length ?? 0) >
                                                              0 && (
                                                              <span className="text-[10px] text-purple-300 flex items-center gap-1">
                                                                <FileQuestion className="w-2.5 h-2.5" />
                                                                {
                                                                  lesson.quizzes!
                                                                    .length
                                                                }{" "}
                                                                كويز
                                                              </span>
                                                            )}
                                                            {(lesson.homeworks
                                                              ?.length ?? 0) >
                                                              0 && (
                                                              <span className="text-[10px] text-violet-300 flex items-center gap-1">
                                                                <BookOpenCheck className="w-2.5 h-2.5" />
                                                                {
                                                                  lesson.homeworks!
                                                                    .length
                                                                }{" "}
                                                                واجب
                                                              </span>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>

                                                      <div className="shrink-0">
                                                        {lesson.isPreview ? (
                                                          <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() =>
                                                              handleWatchLesson(
                                                                lesson
                                                              )
                                                            }
                                                            leftIcon={
                                                              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                            }
                                                            className="text-xs py-1.5 px-3 border-emerald-500/30 shadow-sm text-emerald-300"
                                                          >
                                                            معاينة
                                                          </Button>
                                                        ) : isOwner ||
                                                          isEnrolledActive ? (
                                                          <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() =>
                                                              handleWatchLesson(
                                                                lesson
                                                              )
                                                            }
                                                            leftIcon={
                                                              <PlayCircle className="w-3.5 h-3.5" />
                                                            }
                                                            className="text-xs py-1.5 px-3"
                                                          >
                                                            مشاهدة
                                                          </Button>
                                                        ) : (
                                                          <div className="flex items-center gap-1 text-[10px] text-ivory-muted/60 bg-surface px-2.5 py-1.5 rounded-lg border border-surface-border">
                                                            <Lock className="w-3 h-3" />
                                                            <span>مقفول</span>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </>
                                          )}

                                        {/* ═══ مجموعة الكويزات ═══ */}
                                        {(contentFilter === "all" ||
                                          contentFilter === "quizzes") &&
                                          sectionQuizzes.length > 0 &&
                                          renderTreeGroup(
                                            "quizzes",
                                            "الكويزات الإلكترونية",
                                            FileQuestion,
                                            "text-purple-300",
                                            "bg-[#1F1F1F] border-black text-white/80",
                                            sectionQuizzes.length,
                                            <>
                                              {sectionQuizzes.map(
                                                ({ quiz, lesson }) => {
                                                  const quizAttempt =
                                                    quizResultsMap.get(quiz.id);
                                                  const isSolved =
                                                    Boolean(quizAttempt);
                                                  const canOpen =
                                                    isOwner ||
                                                    isEnrolledActive ||
                                                    lesson.isPreview;
                                                  return (
                                                    <button
                                                      key={quiz.id}
                                                      type="button"
                                                      onClick={() => {
                                                        if (!canOpen) {
                                                          handleEnrollOrCart();
                                                          return;
                                                        }
                                                        navigate(
                                                          isSolved
                                                            ? `/quizzes/attempts/${
                                                                quizAttempt!.id
                                                              }/result`
                                                            : `/courses/${id}/learn/quiz/${lesson.id}`
                                                        );
                                                      }}
                                                      className={`group/q w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-all text-right ${
                                                        isSolved
                                                          ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60"
                                                          : canOpen
                                                          ? "bg-surface-card border-surface-border hover:border-purple-500/40 hover:bg-purple-950/20"
                                                          : "bg-surface/50 border-surface-border/60 opacity-80"
                                                      }`}
                                                    >
                                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <span
                                                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                                                            isSolved
                                                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                                              : canOpen
                                                              ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                                                              : "bg-surface-border border-surface-border text-ivory-muted"
                                                          }`}
                                                        >
                                                          {isSolved ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                          ) : (
                                                            <FileQuestion className="w-4 h-4" />
                                                          )}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                          <span className="block text-[13px] font-bold text-ivory truncate">
                                                            كويز: {quiz.title}
                                                          </span>
                                                          <span className="block text-[11px] text-ivory-muted mt-0.5 truncate">
                                                            من درس:{" "}
                                                            {lesson.title}
                                                            {quiz.questionCount
                                                              ? ` • ${quiz.questionCount} سؤال`
                                                              : ""}
                                                            {quiz.timeLimitMinutes
                                                              ? ` • ${quiz.timeLimitMinutes} دقيقة`
                                                              : ""}
                                                          </span>
                                                        </span>
                                                      </div>

                                                      <div className="flex items-center gap-2 shrink-0">
                                                        {isSolved ? (
                                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>
                                                              تم الحل (
                                                              {
                                                                quizAttempt!
                                                                  .score
                                                              }
                                                              /
                                                              {
                                                                quizAttempt!
                                                                  .totalMarks
                                                              }
                                                              )
                                                            </span>
                                                          </span>
                                                        ) : !canOpen ? (
                                                          <span className="inline-flex items-center gap-1 text-[10px] text-ivory-muted/60 bg-surface px-2 py-1 rounded-md border border-surface-border">
                                                            <Lock className="w-3 h-3" />
                                                            <span>مقفول</span>
                                                          </span>
                                                        ) : (
                                                          <span className="text-[12px] font-bold text-purple-300 flex items-center gap-1">
                                                            حل الكويز
                                                            <ArrowLeft className="w-3.5 h-3.5" />
                                                          </span>
                                                        )}
                                                      </div>
                                                    </button>
                                                  );
                                                }
                                              )}
                                            </>
                                          )}

                                        {/* ═══ مجموعة الواجبات ═══ */}
                                        {(contentFilter === "all" ||
                                          contentFilter === "homeworks") &&
                                          sectionHomeworks.length > 0 &&
                                          renderTreeGroup(
                                            "homeworks",
                                            "الواجبات",
                                            BookOpenCheck,
                                            "text-violet-300",
                                            "bg-[#1F1F1F] border-black text-white/80",
                                            sectionHomeworks.length,
                                            <>
                                              {sectionHomeworks.map(
                                                ({ hw, lesson }) => {
                                                  const lessonProg =
                                                    progressByLessonId.get(
                                                      lesson.id
                                                    );
                                                  const homeworkAttempt =
                                                    homeworkResultsMap.get(
                                                      hw.id
                                                    );
                                                  const isDone =
                                                    Boolean(homeworkAttempt) ||
                                                    lessonProg?.isCompleted;
                                                  const canOpen =
                                                    isOwner || isEnrolledActive;
                                                  return (
                                                    <button
                                                      key={hw.id}
                                                      type="button"
                                                      onClick={() => {
                                                        if (!canOpen) {
                                                          handleEnrollOrCart();
                                                          return;
                                                        }
                                                        navigate(
                                                          homeworkAttempt
                                                            ? `/courses/${id}/learn/homework/${lesson.id}/result/${homeworkAttempt.id}`
                                                            : `/courses/${id}/learn/homework/${lesson.id}`
                                                        );
                                                      }}
                                                      className={`group/h w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition-all text-right ${
                                                        isDone
                                                          ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60"
                                                          : canOpen
                                                          ? "bg-surface-card border-surface-border hover:border-violet-500/40 hover:bg-violet-950/20"
                                                          : "bg-surface/50 border-surface-border/60 opacity-80"
                                                      }`}
                                                    >
                                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <span
                                                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                                                            isDone
                                                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                                              : canOpen
                                                              ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                                                              : "bg-surface-border border-surface-border text-ivory-muted"
                                                          }`}
                                                        >
                                                          {isDone ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                          ) : (
                                                            <BookOpenCheck className="w-4 h-4" />
                                                          )}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                          <span className="block text-[13px] font-bold text-ivory truncate">
                                                            {hw.title}
                                                          </span>
                                                          <span className="block text-[11px] text-ivory-muted mt-0.5 truncate">
                                                            من درس:{" "}
                                                            {lesson.title}
                                                            {hw.questionCount
                                                              ? ` • ${hw.questionCount} سؤال`
                                                              : ""}{" "}
                                                            • ورقة PDF
                                                          </span>
                                                        </span>
                                                      </div>

                                                      <div className="flex items-center gap-2 shrink-0">
                                                        {isDone ? (
                                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>
                                                              تم التسليم
                                                            </span>
                                                          </span>
                                                        ) : !canOpen ? (
                                                          <span className="inline-flex items-center gap-1 text-[10px] text-ivory-muted/60 bg-surface px-2 py-1 rounded-md border border-surface-border">
                                                            <Lock className="w-3 h-3" />
                                                            <span>مقفول</span>
                                                          </span>
                                                        ) : (
                                                          <span className="text-[12px] font-bold text-violet-300 flex items-center gap-1">
                                                            حل الواجب
                                                            <ArrowLeft className="w-3.5 h-3.5" />
                                                          </span>
                                                        )}
                                                      </div>
                                                    </button>
                                                  );
                                                }
                                              )}
                                            </>
                                          )}

                                        {/* ═══ مجموعة ملفات PDF والمذكرات ═══ */}
                                        {(contentFilter === "all" ||
                                          contentFilter === "materials") &&
                                          sectionMaterials.length > 0 &&
                                          renderTreeGroup(
                                            "materials",
                                            "ملفات PDF والمذكرات",
                                            FileText,
                                            "text-sky-400",
                                            "bg-sky-500/10 border-sky-500/30 text-sky-300",
                                            sectionMaterials.length,
                                            <>
                                              {sectionMaterials.map((mat) => (
                                                <div
                                                  key={mat.id}
                                                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs text-right"
                                                >
                                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                                                    <span className="text-ivory truncate">
                                                      {mat.title}
                                                    </span>
                                                    <span className="text-[9px] text-ivory-muted uppercase shrink-0">
                                                      ({mat.fileType})
                                                    </span>
                                                  </div>
                                                  {isOwner ||
                                                  isEnrolledActive ? (
                                                    <button
                                                      type="button"
                                                      onClick={async () => {
                                                        try {
                                                          const {
                                                            downloadUrl,
                                                          } =
                                                            await lessonsApi.getMaterialDownloadUrl(
                                                              mat.id
                                                            );
                                                          window.open(
                                                            downloadUrl,
                                                            "_blank"
                                                          );
                                                        } catch {
                                                          toast.error(
                                                            "تعذر تحميل الملف."
                                                          );
                                                        }
                                                      }}
                                                      className="text-sky-400 hover:text-sky-300 text-xs font-bold p-1 shrink-0"
                                                    >
                                                      تحميل PDF
                                                    </button>
                                                  ) : (
                                                    <span className="text-[10px] text-ivory-muted flex items-center gap-1 shrink-0">
                                                      <Lock className="w-3 h-3" />{" "}
                                                      متاح للمشتركين
                                                    </span>
                                                  )}
                                                </div>
                                              ))}
                                            </>
                                          )}
                                      </>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-10 rounded-3xl bg-surface-card border border-surface-border text-center space-y-2">
                        <BookOpen className="w-8 h-8 text-gold-400/40 mx-auto" />
                        <p className="text-xs text-ivory-muted">
                          جاري تجهيز محتوى هذا الكورس قريباً
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "outcomes" && course.learningOutcomes && (
                <div className="w-full p-6 sm:p-8 rounded-3xl bg-surface-card border border-primary/20 space-y-4">
                  <h2 className="text-lg font-bold font-display text-primary">
                    ماذا ستتعلم بالتفصيل من هذا الكورس؟
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-ivory-muted">
                    {course.learningOutcomes.map((outcome, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-surface border border-surface-border"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-ivory leading-relaxed break-words">
                          {outcome}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === "instructor" && course.teacher && (
                <div className="w-full p-6 sm:p-8 rounded-3xl bg-surface-card border border-primary/20 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-soft border border-primary/30 flex items-center justify-center text-primary font-bold text-2xl overflow-hidden shadow-gold-glow shrink-0">
                      {course.teacher.photoUrl ? (
                        <img
                          src={course.teacher.photoUrl}
                          alt={course.teacher.fullName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        course.teacher.fullName?.[0] || "أ"
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold font-display text-primary truncate">
                        {course.teacher.fullName}
                      </h3>
                      <p className="text-xs text-gold-400 font-bold truncate">
                        {course.teacher.specialization || "كبير معلمي التاريخ"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-ivory-muted leading-relaxed whitespace-pre-line break-words">
                    {course.teacher.bio ||
                      "أكثر من 15 عاماً من التميز والخبرة في تدريس المناهج بأساليب تعليمية تفاعلية ومبتكرة وتخريج الأوائل سنوياً."}
                  </p>
                  <Link to="/about">
                    <Button variant="outline" size="sm" className="text-xs">
                      زيارة صفحة السيرة الذاتية للأستاذ
                    </Button>
                  </Link>
                </div>
              )}

              {activeTab === "reviews" && (
                <CourseReviewsSection
                  courseId={id || ""}
                  isEnrolled={isEnrolledActive}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sidebar Info Column on Desktop (4 Cols) */}
        <div className="w-full min-w-0 lg:col-span-4 space-y-6">
          {/* Target Audience */}
          {taxonomyTargets && taxonomyTargets.length > 0 && (
            <div className="w-full p-5 rounded-3xl bg-surface-card border border-surface-border space-y-3">
              <h3 className="text-xs font-bold text-sky-300 flex items-center gap-1.5 font-display">
                <GraduationCap className="w-4 h-4 shrink-0" />
                هذا الكورس موجّه لـ:
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {taxonomyTargets.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface border border-sky-500/30 text-sky-300"
                  >
                    <Layers className="w-3 h-3" />
                    {t.grade.name}
                    {t.track ? ` · ${t.track.name}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features Highlights */}
          <div className="w-full p-5 rounded-3xl bg-surface-card border border-surface-border space-y-3.5">
            <h3 className="text-xs font-bold font-display text-primary">
              مميزات الانضمام للكورس:
            </h3>
            <ul className="space-y-2.5 text-xs text-ivory-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>شرح مبسط وتفاعلي لكل دروس المنهج</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>امتحانات وكويزات إلكترونية مع تصحيح فوري</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>مذكرات PDF وتلخيصات قابلة للتحميل</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>إمكانية طرح الأسئلة والتواصل مع المعلم</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─── Mobile Sticky Bottom Action Bar ─────────────────────────── */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-surface-card/95 backdrop-blur-xl border-t border-surface-border shadow-sm flex items-center justify-between gap-3 text-right"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="space-y-0.5 min-w-0">
          <span className="text-[10px] text-ivory-muted block">
            سعر الكورس:
          </span>
          <CoursePrice price={course.price} isFree={course.isFree} size="md" />
        </div>

        <div className="flex-1 min-w-0 max-w-xs">
          {isOwner ? (
            <Link to="/dashboard/courses" className="block">
              <Button size="sm" className="w-full text-xs py-2">
                إدارة الكورس
              </Button>
            </Link>
          ) : isStaffVisitor ? (
            <Link
              to={
                role === "TEACHER"
                  ? "/dashboard/courses"
                  : "/dashboard/overview"
              }
              className="block"
            >
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs py-2"
              >
                لوحة التحكم
              </Button>
            </Link>
          ) : isEnrolledActive ? (
            <Link to={`/courses/${course.id}/learn`} className="block">
              <Button
                size="sm"
                className="w-full text-xs py-2 font-bold"
                leftIcon={<PlayCircle className="w-4 h-4" />}
              >
                {progressData?.resume?.lessonId ? "أكمل التعلم" : "ابدأ التعلم"}
              </Button>
            </Link>
          ) : isPendingEnrollment ? (
            <Link to="/my-courses" className="block">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs py-2"
              >
                قيد المراجعة
              </Button>
            </Link>
          ) : course.isFree ? (
            <Button
              size="sm"
              className="w-full text-xs py-2 shadow-gold-glow font-bold"
              isLoading={isEnrollingFree}
              onClick={handleEnrollOrCart}
            >
              اشترك مجاناً
            </Button>
          ) : (
            <AddToCartButton course={course} size="sm" fullWidth />
          )}
        </div>
      </div>

      {/* ─── Video Stream Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={!!previewLesson}
        onClose={() => {
          setPreviewLesson(null);
          setStreamUrl(null);
          setStreamError(null);
        }}
        title={previewLesson?.title || "مشاهدة الدرس"}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-right">
          {streamLoading ? (
            <div className="aspect-video w-full rounded-2xl bg-black/50 border border-surface-border flex flex-col items-center justify-center gap-3 text-ivory-muted">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-xs">جاري تجهيز مشغل الفيديو...</span>
            </div>
          ) : streamError ? (
            <div className="aspect-video w-full rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col items-center justify-center gap-3 text-red-400 p-6 text-center">
              <Lock className="w-10 h-10" />
              <p className="text-sm font-bold">تعذر تشغيل الفيديو</p>
              <p className="text-xs text-ivory-muted">{streamError}</p>
            </div>
          ) : streamUrl ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-sm">
              <Suspense fallback={<ModalSpinner />}>
                <InlineErrorBoundary>
                  <VideoPlayer
                    key={streamUrl}
                    sources={[{ url: streamUrl }]}
                    title={previewLesson?.title}
                    onError={() =>
                      setStreamError(
                        "تعذر تحميل ملف الفيديو. قد يكون الرابط غير متوفر أو منتهي الصلاحية."
                      )
                    }
                    className="w-full h-full"
                  />
                </InlineErrorBoundary>
              </Suspense>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-ivory-muted">
              لا يوجد فيديو متوفر لهذا الدرس حالياً.
            </div>
          )}

          {previewLesson?.description && (
            <p className="text-xs text-ivory-muted leading-relaxed break-words">
              {previewLesson.description}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewLesson(null);
                setStreamUrl(null);
                setStreamError(null);
              }}
            >
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Quiz Modal ──────────────────────────────────────────────── */}
      {quizLesson && (
        <Modal
          isOpen
          onClose={() => setQuizLesson(null)}
          title={`كويز: ${quizLesson.title}`}
          maxWidth="lg"
        >
          <div className="text-right">
            <InlineErrorBoundary>
              <Suspense fallback={<ModalSpinner />}>
                {isOwner || isEnrolledActive ? (
                  role === "STUDENT" ? (
                    <QuizPanel key={quizLesson.id} lessonId={quizLesson.id} />
                  ) : (
                    <QuizPanelTeacherPreview
                      key={quizLesson.id}
                      lessonId={quizLesson.id}
                    />
                  )
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <Lock className="w-8 h-8 text-primary/60 mx-auto" />
                    <p className="text-xs text-ivory-muted">
                      اشترك في الكورس أولاً لتتمكن من حل الكويز.
                    </p>
                  </div>
                )}
              </Suspense>
            </InlineErrorBoundary>
          </div>
        </Modal>
      )}

      {/* ─── Homework Modal ─────────────────────────────────────────── */}
      {homeworkLesson && (
        <Modal
          isOpen
          onClose={() => setHomeworkLesson(null)}
          title={`واجب: ${homeworkLesson.title}`}
          maxWidth="lg"
        >
          <div className="text-right">
            <InlineErrorBoundary>
              <Suspense fallback={<ModalSpinner />}>
                {isOwner || isEnrolledActive ? (
                  role === "STUDENT" ? (
                    <HomeworkPanel
                      key={homeworkLesson.id}
                      lessonId={homeworkLesson.id}
                      courseId={id}
                      onSolve={() =>
                        navigate(
                          `/courses/${id}/learn/homework/${homeworkLesson.id}`
                        )
                      }
                    />
                  ) : (
                    <HomeworkPanelTeacherPreview
                      key={homeworkLesson.id}
                      lessonId={homeworkLesson.id}
                    />
                  )
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <Lock className="w-8 h-8 text-primary/60 mx-auto" />
                    <p className="text-xs text-ivory-muted">
                      اشترك في الكورس أولاً لتتمكن من حل الواجب.
                    </p>
                  </div>
                )}
              </Suspense>
            </InlineErrorBoundary>
          </div>
        </Modal>
      )}

      {/* ─── Course Intro Video Modal ───────────────────────────────── */}
      <CourseIntroVideoModal
        courseId={id}
        isOpen={introOpen}
        onClose={() => setIntroOpen(false)}
      />
    </div>
  );
};
