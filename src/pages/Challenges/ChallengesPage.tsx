import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Clock,
  Trophy,
  Users,
  Zap,
  Hourglass,
  CheckCheck,
  XCircle,
  RefreshCw,
  Award,
  Bot,
  Flame,
  ArrowRight,
  BookOpen,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  Activity,
  Handshake,
  ShieldAlert,
} from "lucide-react";
import { toastApiError, toastInfo, toastSuccess } from "../../lib/toastHelpers";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { challengesApi } from "../../api/challenges.api";
import {
  useCreateChallengeMutation,
  useMyChallengesQuery,
  useOnlineStudentsQuery,
  useChallengeAvailabilityQuery,
} from "../../hooks/queries/useChallenges";
import { useCoursesQuery } from "../../hooks/queries/useCourses";
import {
  ChallengeListItem,
  ChallengeStatus,
} from "../../types/challenge.types";
import { formatDate } from "../../lib/utils";

const STATUS_META: Record<
  ChallengeStatus,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "neutral" | "gold";
  }
> = {
  PENDING: { label: "بانتظار الموافقة", variant: "warning" },
  READY: { label: "جاهز للبدء", variant: "gold" },
  IN_PROGRESS: { label: "جارية الآن", variant: "success" },
  COMPLETED: { label: "مكتملة", variant: "neutral" },
  REJECTED: { label: "مرفوضة", variant: "danger" },
  EXPIRED: { label: "منتهية الصلاحية", variant: "neutral" },
};

/** Presence heartbeat — keeps the student "online" for challenge matchmaking */
const useHeartbeat = () => {
  useEffect(() => {
    const beat = () => challengesApi.heartbeat().catch(() => undefined);
    beat();
    const timer = setInterval(beat, 60_000);
    return () => clearInterval(timer);
  }, []);
};

export const ChallengesPage: React.FC = () => {
  useHeartbeat();

  const { data: challenges, isLoading } = useMyChallengesQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [tabFilter, setTabFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">(
    "ALL"
  );

  // Stats computation
  const stats = useMemo(() => {
    if (!challenges)
      return { total: 0, wins: 0, losses: 0, draws: 0, winRate: 0 };
    const completed = challenges.filter((c) => c.status === "COMPLETED");
    const wins = completed.filter((c) => c.outcome === "WON").length;
    const losses = completed.filter((c) => c.outcome === "LOST").length;
    const draws = completed.filter((c) => c.outcome === "DRAW").length;
    const winRate =
      completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;
    return { total: challenges.length, wins, losses, draws, winRate };
  }, [challenges]);

  const filteredChallenges = useMemo(() => {
    if (!challenges) return [];
    if (tabFilter === "ACTIVE") {
      return challenges.filter(
        (c) =>
          c.status === "PENDING" ||
          c.status === "READY" ||
          c.status === "IN_PROGRESS"
      );
    }
    if (tabFilter === "COMPLETED") {
      return challenges.filter((c) => c.status === "COMPLETED");
    }
    return challenges;
  }, [challenges, tabFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right">
      {/* Header */}
      <div className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-10 h-56 w-full text-gold-500 opacity-[0.04]"
          viewBox="0 0 1440 224"
          preserveAspectRatio="none"
        >
          <circle
            cx="1300"
            cy="20"
            r="120"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle
            cx="120"
            cy="200"
            r="100"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <span
                className="absolute -inset-2 rounded-2xl border border-dashed border-gold-500/30 rotate-6"
                aria-hidden
              />
              <div className="flex w-14 h-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold-glow">
                <Swords className="w-7 h-7 text-bg" strokeWidth={1.8} />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black font-din text-ink">
                تحديات السرعة التنافسية
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted font-sst">
                ميكس أسئلة ذكي من بنك الأسئلة والامتحانات وأخطائك السابقة — نافس زملاءك أو البوت!
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setCreateOpen(true)}
            leftIcon={<Zap className="w-4 h-4" />}
          >
            تحدٍ جديد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-1 text-center">
          <div className="flex items-center justify-center gap-1.5 text-ivory-muted text-xs">
            <Swords className="w-3.5 h-3.5 text-gold-400" />
            <span>إجمالي التحديات</span>
          </div>
          <span className="text-2xl font-black font-display text-ivory block tabular-nums">
            {stats.total}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-emerald-500/30 space-y-1 text-center bg-emerald-500/[0.02]">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs">
            <Trophy className="w-3.5 h-3.5" />
            <span>مرات الفوز</span>
          </div>
          <span className="text-2xl font-black font-display text-emerald-400 block tabular-nums">
            {stats.wins}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-red-500/25 space-y-1 text-center bg-red-500/[0.02]">
          <div className="flex items-center justify-center gap-1.5 text-red-400 text-xs">
            <Flame className="w-3.5 h-3.5" />
            <span>الهزائم</span>
          </div>
          <span className="text-2xl font-black font-display text-red-400 block tabular-nums">
            {stats.losses}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-gold-500/30 space-y-1 text-center bg-gold-500/[0.03]">
          <div className="flex items-center justify-center gap-1.5 text-gold-300 text-xs">
            <Award className="w-3.5 h-3.5" />
            <span>نسبة الفوز</span>
          </div>
          <span className="text-2xl font-black font-display text-gold-400 block tabular-nums">
            {stats.winRate}%
          </span>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <button
          type="button"
          onClick={() => setTabFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tabFilter === "ALL"
              ? "bg-gold-500 text-bg shadow-sm"
              : "text-ivory-muted hover:text-ivory bg-surface-card"
          }`}
        >
          جميع التحديات ({challenges?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTabFilter("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tabFilter === "ACTIVE"
              ? "bg-gold-500 text-bg shadow-sm"
              : "text-ivory-muted hover:text-ivory bg-surface-card"
          }`}
        >
          الجارية وبانتظار الرد (
          {challenges?.filter(
            (c) =>
              c.status === "PENDING" ||
              c.status === "READY" ||
              c.status === "IN_PROGRESS"
          ).length ?? 0}
          )
        </button>
        <button
          type="button"
          onClick={() => setTabFilter("COMPLETED")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tabFilter === "COMPLETED"
              ? "bg-gold-500 text-bg shadow-sm"
              : "text-ivory-muted hover:text-ivory bg-surface-card"
          }`}
        >
          المكتملة والنتائج (
          {challenges?.filter((c) => c.status === "COMPLETED").length ?? 0})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredChallenges.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="space-y-3">
          {filteredChallenges.map((c) => (
            <ChallengeRow key={c.id} challenge={c} />
          ))}
        </div>
      )}

      <CreateChallengeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
};

const EmptyState: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="p-14 sm:p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-5 relative overflow-hidden shadow-card-dark">
    <svg
      aria-hidden
      className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 text-gold-500/10"
      viewBox="0 0 100 100"
      fill="none"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="4 7"
      />
    </svg>
    <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-black via-[var(--primary)] to-[var(--primary)] shadow-gold-glow">
      <Swords className="w-10 h-10 text-bg" strokeWidth={1.6} />
    </div>
    <h3 className="text-xl font-bold font-display text-ivory">
      لا توجد تحديات في هذه القائمة
    </h3>
    <p className="text-xs sm:text-sm text-ivory-muted max-w-sm mx-auto leading-relaxed">
      اختر كورساً من كورساتك، والعب ضد البوت الذكي فوراً أو نافس أحد زملائك
      المتصلين!
    </p>
    <Button size="lg" onClick={onCreate} leftIcon={<Zap className="w-4 h-4" />}>
      ابدأ تحدٍ جديد الآن
    </Button>
  </div>
);

const ChallengeRow: React.FC<{ challenge: ChallengeListItem }> = ({
  challenge: c,
}) => {
  const meta = STATUS_META[c.status];
  const opponentName = c.iAmChallenger ? c.opponent : c.challenger;
  const opponentPhotoUrl = c.iAmChallenger ? c.opponentPhotoUrl : c.challengerPhotoUrl;

  let action: React.ReactNode;
  switch (c.status) {
    case "PENDING":
      action = c.iAmChallenger ? (
        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
          <Hourglass className="w-3.5 h-3.5 animate-pulse" /> بانتظار رد الخصم…
        </span>
      ) : (
        <Link to={`/challenges/${c.id}`}>
          <Button size="sm" leftIcon={<CheckCheck className="w-4 h-4" />}>
            رد على التحدي
          </Button>
        </Link>
      );
      break;
    case "READY":
      action = (
        <Link to={`/challenges/${c.id}`}>
          <Button size="sm" leftIcon={<Zap className="w-4 h-4" />}>
            ابدأ التحدي
          </Button>
        </Link>
      );
      break;
    case "IN_PROGRESS":
      action = (
        <Link to={`/challenges/${c.id}`}>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Clock className="w-4 h-4" />}
          >
            أكمل أسئلتك
          </Button>
        </Link>
      );
      break;
    case "COMPLETED":
      action = (
        <Link to={`/challenges/${c.id}/result`}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Trophy className="w-4 h-4" />}
          >
            عرض النتيجة والحل
          </Button>
        </Link>
      );
      break;
    default:
      action = (
        <span className="flex items-center gap-1.5 text-xs text-ivory-muted/70">
          <XCircle className="w-3.5 h-3.5" /> لا يوجد إجراء
        </span>
      );
  }

  const outcomeBadge =
    c.outcome === "WON" ? (
      <Badge variant="success">
        <Trophy className="w-3 h-3 ml-1" />
        فوز
      </Badge>
    ) : c.outcome === "LOST" ? (
      <Badge variant="danger">
        <ShieldAlert className="w-3 h-3 ml-1" />
        خسارة
      </Badge>
    ) : c.outcome === "DRAW" ? (
      <Badge variant="warning">
        <Handshake className="w-3 h-3 ml-1" />
        تعادل
      </Badge>
    ) : null;

  return (
    <div className="group rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-5 transition-all duration-300 hover:border-gold-500/40 hover:shadow-card-dark">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3.5">
          <PlayerAvatar name={opponentName} photoUrl={opponentPhotoUrl} isBot={Boolean(c.vsBot)} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold font-display text-ivory sm:text-base">أنت × {opponentName}</h3>
              <Badge variant={meta.variant}>{meta.label}</Badge>
              {outcomeBadge}
            </div>
            <p className="truncate text-xs text-ivory-muted">{c.courseTitle}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ivory-muted/75">
              <span className="flex items-center gap-1"><Swords className="h-3 w-3 text-gold-400" />{c.questionCount} أسئلة</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(c.createdAt)}</span>
              {c.myScore != null && c.status === "COMPLETED" && (
                <span className="font-mono font-bold text-gold-400">{c.myScore}{c.opponentScore != null ? ` : ${c.opponentScore}` : ""}</span>
              )}
            </div>
          </div>
        </div>
        <div className="self-end shrink-0 md:self-center">{action}</div>
      </div>
    </div>
  );
};

const PlayerAvatar: React.FC<{ name: string; photoUrl?: string | null; isBot?: boolean }> = ({
  name,
  photoUrl,
  isBot = false,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = name.trim().charAt(0) || '؟';

  useEffect(() => setImageFailed(false), [photoUrl]);

  return (
    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gold-500/25 bg-gold-500/10 text-sm font-black text-gold-300">
      {isBot ? (
        <Bot className="h-6 w-6" />
      ) : photoUrl && !imageFailed ? (
        <img src={photoUrl} alt={`صورة ${name}`} loading="lazy" className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
      ) : initial}
      {!isBot && <span className="absolute bottom-0.5 left-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-card bg-emerald-400" />}
    </span>
  );
};

/* ═══════════════ CREATIVE ADD CHALLENGE MODAL (CENTERED & MODERN) ═══════════════ */

const CreateChallengeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { data: availability } = useChallengeAvailabilityQuery(isOpen);
  const eligibleCourseIds = availability?.eligibleCourseIds ?? [];

  const { data: coursesData, isLoading: isLoadingCourses } = useCoursesQuery({
    enrolledOnly: true,
    status: "PUBLISHED",
    limit: 50,
  });
  const allCourses = Array.isArray(coursesData?.data)
    ? coursesData.data
    : Array.isArray(coursesData?.courses)
    ? coursesData.courses
    : [];

  // Only show courses that have enough questions (bank + exams + mistakes)
  const courses = eligibleCourseIds.length > 0
    ? (allCourses as { id: string; title: string }[]).filter((c) =>
        eligibleCourseIds.includes(c.id)
      )
    : (allCourses as { id: string; title: string }[]);

  const [courseId, setCourseId] = useState("");
  const [opponentUserId, setOpponentUserId] = useState("");
  const [vsBot, setVsBot] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCourseId("");
      setOpponentUserId("");
      setVsBot(false);
      setQuestionCount(10);
      setDurationMinutes(5);
    }
  }, [isOpen]);

  const { data: onlineStudents = [], isLoading: isLoadingStudents } =
    useOnlineStudentsQuery(isOpen && courseId ? courseId : undefined);

  const { mutate: createChallenge, isPending: isCreating } =
    useCreateChallengeMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    if (!vsBot && !opponentUserId) return;
    createChallenge(
      {
        courseId,
        ...(vsBot ? { vsBot: true } : { opponentUserId }),
        questionCount,
        durationSeconds: durationMinutes * 60,
      },
      {
        onSuccess: (res) => {
          toastSuccess(
            vsBot
              ? 'البوت جاهز! اضغط "ابدأ التحدي" عند استعدادك.'
              : "تم إرسال التحدي! سيصدر إشعار لخصمك فوراً."
          );
          if (res?.warnings?.length) toastInfo(res.warnings.join(" "));
          onClose();
        },
        onError: (err: any) =>
          toastApiError(err, "تعذر إنشاء التحدي — حاول مجدداً"),
      }
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Centered Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 350 }}
            className="relative w-full max-w-xl my-auto rounded-3xl bg-surface-card border border-gold-500/30 shadow-2xl overflow-hidden flex flex-col text-right z-10"
          >
            {/* Modal Header */}
            <div className="relative p-6 sm:p-7 border-b border-surface-border/60 flex items-center justify-between gap-4 bg-gradient-to-b from-surface-elevated/80 to-surface-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gold-gradient p-0.5 shadow-gold-glow shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-bg flex items-center justify-center text-gold-300">
                    <Swords className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-display text-ivory">
                    إنشاء تحدٍ تنافسي جديد
                  </h2>
                  <p className="text-xs text-ivory-muted">
                    اختر الكورس ونوع الخصم وإعدادات التحدي
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-12 h-12 rounded-xl border border-surface-border bg-rose-500 flex items-center justify-center text-white hover:text-ivory hover:border-gold-500/40 transition-colors shrink-0"
              >
                <XCircle className="w-7 h-7" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 sm:p-7 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)]"
            >
              {/* Step 1: Course */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-ivory">
                  <BookOpen className="w-4 h-4 text-gold-400" />
                  الكورس التعليمي
                </label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setOpponentUserId("");
                  }}
                  className="w-full bg-surface border border-surface-border text-ivory rounded-2xl p-3.5 text-xs outline-none focus:border-gold-400 transition-colors"
                >
                  <option value="">اختر الكورس للبدء…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                {!isLoadingCourses && courses.length === 0 && allCourses.length > 0 && (
                  <p className="text-[11px] text-amber-400/80">
                    لا يوجد كورس فيه أسئلة كافية لبدء تحدٍ — انتظر إضافة المزيد من الأسئلة أو اجتاز امتحانات أكثر.
                  </p>
                )}
                {!isLoadingCourses && allCourses.length === 0 && (
                  <p className="text-[11px] text-amber-400/80">
                    لست مشتركاً بنشاط في أي كورس بعد.
                  </p>
                )}
                {courseId && (
                  <p className="text-[11px] text-emerald-400/80 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ميكس من بنك الأسئلة + امتحانات الأستاذ + أخطاءك السابقة
                  </p>
                )}
              </div>

              {/* Step 2: Special Opponent Selector (Bot vs Human) */}
              {courseId && (
                <div className="space-y-3.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-ivory">
                    <Users className="w-4 h-4 text-gold-400" />
                    تحديد الخصم
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card A: Peer Challenge */}
                    <button
                      type="button"
                      onClick={() => setVsBot(false)}
                      className={`relative p-4 rounded-2xl border text-right transition-all duration-300 flex flex-col justify-between gap-3 ${
                        !vsBot
                          ? "border-gold-500 bg-gold-500/15 shadow-gold-glow ring-1 ring-gold-500/40"
                          : "border-surface-border bg-surface text-ivory-muted hover:border-gold-500/30 hover:bg-surface-card"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            !vsBot
                              ? "bg-[var(--primary)] border-gold-500/50 text-white"
                              : "bg-surface-subtle border-surface-border text-amber-50"
                          }`}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            !vsBot
                              ? "border-gold-400 bg-gold-400"
                              : "border-surface-border"
                          }`}
                        >
                          {!vsBot && (
                            <span className="w-1.5 h-1.5 rounded-full bg-bg" />
                          )}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-ivory">
                            زميل متصل الآن
                          </span>
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                          </span>
                        </div>
                        <span className="block text-[10px] text-ivory-muted">
                          مواجهة حية مع طلاب الكورس
                        </span>
                      </div>
                    </button>

                    {/* Card B: Bot Challenge */}
                    <button
                      type="button"
                      onClick={() => {
                        setVsBot(true);
                        setOpponentUserId("");
                      }}
                      className={`relative p-4 rounded-2xl border text-right transition-all duration-300 flex flex-col justify-between gap-3 ${
                        vsBot
                          ? "border-gold-500 bg-gold-500/15 shadow-gold-glow ring-1 ring-gold-500/40"
                          : "border-surface-border bg-surface text-ivory-muted hover:border-gold-500/30 hover:bg-surface-card"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            vsBot
                              ? "bg-gold-500/25 border-gold-500/50 text-gold-300"
                              : "bg-surface-subtle border-surface-border text-ivory-muted"
                          }`}
                        >
                          <Bot className="w-5 h-5" />
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            vsBot
                              ? "border-gold-400 bg-gold-400"
                              : "border-surface-border"
                          }`}
                        >
                          {vsBot && (
                            <span className="w-1.5 h-1.5 rounded-full bg-bg" />
                          )}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-ivory">
                            البوت التفاعلي
                          </span>
                          <Badge variant="gold" size="sm">
                            فوري
                          </Badge>
                        </div>
                        <span className="block text-[10px] text-ivory-muted">
                          جاهز دائماً · إنهاء فوري معك
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Online Students List (When Peer Mode active) */}
                  {!vsBot && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-ivory-muted">
                        <span className="font-bold text-ivory flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          الطلاب المتصلون حالياً ({onlineStudents.length}):
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gold-400 font-mono">
                          <RefreshCw
                            className="w-3 h-3 animate-spin"
                            style={{ animationDuration: "6s" }}
                          />
                          تحديث لحظي
                        </span>
                      </div>

                      {isLoadingStudents ? (
                        <Skeleton className="h-20 w-full rounded-2xl" />
                      ) : onlineStudents.length === 0 ? (
                        <div className="p-5 rounded-2xl border border-dashed border-surface-border text-center space-y-3 bg-surface-subtle/50">
                          <p className="text-xs text-ivory-muted">
                            لا يوجد زملاء متصلون حالياً في هذا الكورس.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setVsBot(true)}
                            leftIcon={
                              <Bot className="w-3.5 h-3.5 text-gold-400" />
                            }
                          >
                            التحويل للعب ضد البوت الذكي فوراً
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                          {onlineStudents.map((s) => {
                            const isSelected =
                              opponentUserId === s.studentId ||
                              (s.userId && opponentUserId === s.userId);
                            return (
                              <button
                                key={s.studentId}
                                type="button"
                                onClick={() =>
                                  setOpponentUserId(s.userId || s.studentId)
                                }
                                className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-xs transition-all ${
                                  isSelected
                                    ? "border-gold-500 bg-gold-500/20 text-gold-200 font-bold shadow-sm"
                                    : "border-surface-border bg-surface text-ivory hover:border-gold-500/40 hover:bg-surface-card"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <PlayerAvatar name={s.fullName} photoUrl={s.photoUrl} />
                                  <span className="truncate">{s.fullName}</span>
                                </div>
                                {isSelected ? (
                                  <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0" />
                                ) : (
                                  <span className="text-[10px] text-ivory-muted shrink-0">
                                    اختيار
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Question Count & Mix Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 font-bold text-ivory">
                    <SlidersHorizontal className="w-4 h-4 text-gold-400" />
                    عدد الأسئلة
                  </label>
                  <span className="font-mono text-sm font-black text-gold-400 bg-gold-500/10 px-2.5 py-0.5 rounded-lg border border-gold-500/20">
                    {questionCount} أسئلة
                  </span>
                </div>

                {/* Quick Preset Pills */}
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                        questionCount === num
                          ? "border-gold-500 bg-gold-500 text-bg shadow-sm"
                          : "border-surface-border bg-surface text-ivory-muted hover:border-gold-500/40"
                      }`}
                    >
                      {num} أسئلة
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-[var(--color-gold-500)] cursor-pointer"
                  dir="ltr"
                />

                {/* Intelligent Mix Callout */}
                <div className="p-3.5 rounded-2xl bg-gold-500/[0.06] border border-gold-500/20 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-ivory-muted leading-relaxed">
                    <strong className="text-gold-300">
                      نظام الميكس الذكي:
                    </strong>{" "}
                    يتم اختيار الأسئلة تلقائياً وتوزيعها بين بنك الأسئلة،
                    امتحانات الأستاذ، وأخطائك السابقة لتعزيز نقاط قوتك.
                  </p>
                </div>
              </div>

              {/* Step 4: Duration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 font-bold text-ivory">
                    <Clock className="w-4 h-4 text-gold-400" />
                    المدة القصوى
                  </label>
                  <span className="font-mono text-sm font-black text-gold-400 bg-gold-500/10 px-2.5 py-0.5 rounded-lg border border-gold-500/20">
                    {durationMinutes} دقائق
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                        durationMinutes === mins
                          ? "border-gold-500 bg-gold-500 text-bg shadow-sm"
                          : "border-surface-border bg-surface text-ivory-muted hover:border-gold-500/40"
                      }`}
                    >
                      {mins} د
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full accent-[var(--color-gold-500)] cursor-pointer"
                  dir="ltr"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-surface-border">
                <Button type="button" variant="ghost" onClick={onClose}>
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  isLoading={isCreating}
                  disabled={!courseId || (!vsBot && !opponentUserId)}
                  leftIcon={<Swords className="w-4 h-4" />}
                >
                  إطلاق التحدي الآن
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
