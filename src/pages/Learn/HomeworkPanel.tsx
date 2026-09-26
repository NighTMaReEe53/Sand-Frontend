import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Lightbulb,
  Loader2,
  Lock,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";
import { TeacherHomeworkAttemptDetail } from "../../api/homework.api";
import { homeworkApi } from "../../api/homework.api";
import {
  LessonHomeworkInfo,
  StartHomeworkResponse,
  SubmitHomeworkResult,
} from "../../types/homework.types";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

type Phase =
  | "idle"
  | "loading"
  | "taking"
  | "submitting"
  | "result"
  | "review"
  | "error";

interface HomeworkPanelProps {
  lessonId: string;
  courseId?: string;
  /** عند توفّره، زر "بدء الحل" ينتقل لصفحة الحل المخصّصة بدل الفتح داخل الصفحة */
  onSolve?: () => void;
  /** يبدأ الحل تلقائياً عند فتح الصفحة المخصّصة (صفحة الحل) */
  autoStart?: boolean;
}

export const HomeworkPanel: React.FC<HomeworkPanelProps> = ({
  lessonId,
  courseId,
  onSolve,
  autoStart,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [info, setInfo] = useState<LessonHomeworkInfo | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [attemptData, setAttemptData] = useState<StartHomeworkResponse | null>(
    null
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [imageAnswers, setImageAnswers] = useState<Record<string, string>>({});
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(
    null
  );
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [result, setResult] = useState<SubmitHomeworkResult | null>(null);
  const [reviewDetail, setReviewDetail] =
    useState<TeacherHomeworkAttemptDetail | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openReview = async (attemptId: string) => {
    if (courseId) {
      navigate(`/courses/${courseId}/learn/homework/${lessonId}/result/${attemptId}`);
      return;
    }
    setReviewLoading(true);
    try {
      const detail = await homeworkApi.getAttemptDetail(attemptId);
      setReviewDetail(detail);
      setPhase("review");
    } catch {
      setErrorMsg("تعذر تحميل تفاصيل الواجب.");
      setPhase("error");
    } finally {
      setReviewLoading(false);
    }
  };

  const loadInfo = useCallback(async () => {
    setPhase("loading");
    try {
      const data = await homeworkApi.getLessonHomework(lessonId);
      setInfo(data);
      setPhase("idle");
    } catch {
      setPhase("error");
      setErrorMsg("تعذر تحميل الواجب.");
    }
  }, [lessonId]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  // Never render a second solving form after submission; go straight to the
  // persisted result page.
  useEffect(() => {
    if (info?.homework?.hasSubmittedAttempt && info.homework.submittedAttemptId && courseId) {
      navigate(`/courses/${courseId}/learn/homework/${lessonId}/result/${info.homework.submittedAttemptId}`, { replace: true });
    }
  }, [courseId, info?.homework?.hasSubmittedAttempt, info?.homework?.submittedAttemptId, lessonId, navigate]);

  const openPdf = async () => {
    if (!info?.homework?.id) return;
    setPdfLoading(true);
    try {
      const url = await homeworkApi.getPdfUrl(info.homework.id);
      window.open(url, "_blank", "noopener");
    } catch {
      setErrorMsg("تعذر فتح ملف الواجب.");
      setPhase("error");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleImageUpload = async (questionId: string, file: File) => {
    if (!attemptData) return;
    setUploadingQuestionId(questionId);
    try {
      const { imageUrl } = await homeworkApi.uploadAnswerImage(
        attemptData.attempt.id,
        questionId,
        file
      );
      setImageAnswers((prev) => ({ ...prev, [questionId]: imageUrl }));
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "تعذر رفع صورة الإجابة.";
      setErrorMsg(msg);
      setPhase("error");
    } finally {
      setUploadingQuestionId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = useCallback(
    async (
      data: StartHomeworkResponse,
      currentAnswers: Record<string, number>
    ) => {
      setPhase("submitting");
      try {
        // أسئلة الصور تُحفظ لحظياً عند الرفع (uploadAnswerImage) — لا تُضمَّن هنا
        const payload = data.questions
          .filter((q) => !q.requiresImageAnswer)
          .map((q) => ({
            questionId: q.id,
            selectedOptionIndex: currentAnswers[q.id] ?? 0,
          }));
        const res = await homeworkApi.submitAttempt(data.attempt.id, payload);
        navigate(`/courses/${courseId}/learn/homework/${lessonId}/result/${res.attemptId ?? data.attempt.id}`);
        queryClient.invalidateQueries({ queryKey: ["course-progress"] });
        queryClient.invalidateQueries({
          queryKey: ["notifications-feed-live"],
        });
        loadInfo();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "تعذر تسليم الواجب.";
        setErrorMsg(msg);
        setPhase("error");
      }
    },
    [courseId, lessonId, loadInfo, navigate, queryClient]
  );

  const startOrResume = async () => {
    if (!info?.homework?.id) return;
    setPhase("loading");
    try {
      const data = await homeworkApi.startAttempt(info.homework.id);
      setAttemptData(data);
      setAnswers({});
      setImageAnswers({});
      setCurrentQIndex(0);
      setPhase("taking");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "تعذر بدء حل الواجب.";
      setErrorMsg(msg);
      setPhase("error");
    }
  };

  // فتح صفحة الحل المخصّصة: يبدأ الحل تلقائياً إن كان مسموحاً (محاولة نشطة أو محاولات متبقية)
  useEffect(() => {
    if (
      autoStart &&
      phase === "idle" &&
      info?.hasHomework &&
      info.homework &&
      (info.homework.hasActiveAttempt || info.homework.remainingAttempts > 0)
    ) {
      startOrResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, phase, info]);

  const bestScore = useMemo(() => {
    const submitted = (info?.attempts ?? []).filter(
      (a) => a.status === "SUBMITTED" && a.score !== null
    );
    if (!submitted.length) return null;
    return Math.max(...submitted.map((a) => a.score!));
  }, [info]);

  if (phase === "loading") {
    return (
      <div className="relative p-8 rounded-3xl bg-gradient-to-br from-surface-card to-violet-500/5 border border-violet-500/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col items-center text-center space-y-4">
          <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-gold-500/20 border border-violet-500/30">
            <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-ivory mb-2">جاري التحميل</h3>
            <p className="text-base text-ivory-muted">يرجى الانتظار...</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="relative p-8 rounded-3xl bg-gradient-to-br from-surface-card to-red-500/5 border border-red-500/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col items-center text-center space-y-4">
          <span className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30">
            <XCircle className="w-8 h-8 text-red-400" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-ivory mb-2">حدث خطأ</h3>
            <p className="text-base text-red-400">{errorMsg}</p>
          </div>
          <Button size="lg" variant="outline" onClick={loadInfo}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (!info?.hasHomework || !info.homework) {
    return null;
  }

  const homework = info.homework;

  // ─── الواجب مغلق قبل موعد الفتح الذي حدده المدرس ───
  if (!homework.isOpen) {
    return (
      <div className="p-6 rounded-2xl bg-surface-card border border-amber-500/30 space-y-4 text-center relative overflow-hidden">
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        <span className="relative inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <Lock className="w-7 h-7 text-amber-400" />
        </span>
        <h3 className="relative text-sm font-bold text-ivory">
          {homework.title}
        </h3>
        {homework.description && (
          <p className="relative text-[11px] text-ivory-muted leading-relaxed">
            {homework.description}
          </p>
        )}
        <p className="relative text-xs text-amber-300 font-bold">
          سيُفتح هذا الواجب للحل في الموعد التالي:
        </p>
        <p
          className="relative text-sm font-black font-display text-gold-300"
          dir="ltr"
        >
          {homework.availableFrom
            ? new Date(homework.availableFrom).toLocaleString("ar-EG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </p>
        {homework.availableFrom && (
          <div className="relative flex justify-center pt-1">
            <OpenCountdown iso={homework.availableFrom} onDone={loadInfo} />
          </div>
        )}
        <p className="relative text-[10px] text-ivory-muted/70">
          ستصلك إشعارات عند فتح الواجب — ترتيب الأسئلة سيطابق ورقة الـ PDF.
        </p>
      </div>
    );
  }

  if (homework.questionCount === 0) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
        <BookOpenCheck className="w-4 h-4 text-gold-400/50" />
        الواجب موجود لكن لا توجد أسئلة بعد — يرجى إبلاغ المدرس.
      </div>
    );
  }

  // ─── Taking phase ──────────────────────────────────────────────
  if (phase === "taking" || phase === "submitting") {
    // الأسئلة بنفس ترتيب ملف الـ PDF — بدون خلط (كما وردت من السيرفر بـ orderIndex)
    const questions = [...(attemptData?.questions ?? [])].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    const q = questions[currentQIndex];
    const isAnswered = (qq: (typeof questions)[number]) =>
      qq.requiresImageAnswer
        ? !!imageAnswers[qq.id]
        : answers[qq.id] !== undefined;
    const answeredCount = questions.filter(isAnswered).length;
    const progressPct = questions.length
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

    return (
      <div className="rounded-2xl bg-surface-card border border-violet-500/25 overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-surface border-b border-surface-border">
          <span className="text-base font-bold text-violet-300 flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5" />
            {attemptData?.quizTitle}
          </span>
          <Badge variant="neutral" size="md">
            سؤال {currentQIndex + 1} من {questions.length}
          </Badge>
        </div>

        {/* ورقة الواجب PDF */}
        {homework.hasPdf && (
          <button
            onClick={openPdf}
            className="w-full flex items-center justify-between gap-3 px-6 py-3.5 bg-violet-500/[0.06] border-b border-violet-500/20 text-right hover:bg-violet-500/[0.12] transition-colors"
          >
            <span className="text-base font-bold text-violet-300 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              ورقة الواجب — افتحها وراجع الأسئلة بالترتيب
            </span>
            {pdfLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-violet-300" />
            ) : (
              <ExternalLink className="w-5 h-5 text-violet-300" />
            )}
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* ── صندوق أرقام الأسئلة (الحالي ذهبي • المجاب عليه أخضر مع علامة صح) ── */}
          <aside className="order-2 lg:order-1 p-5 bg-surface/40 lg:border-l lg:border-surface-border">
            <p className="text-sm font-bold text-ivory-muted mb-4">
              أرقام الأسئلة
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2.5">
              {questions.map((qq, qi) => {
                const answered = isAnswered(qq);
                const isCurrent = qi === currentQIndex;
                const isWrong =
                  answered &&
                  !qq.requiresImageAnswer &&
                  answers[qq.id] !== qq.correctOptionIndex;
                return (
                  <button
                    key={qq.id}
                    type="button"
                    onClick={() => setCurrentQIndex(qi)}
                    title={`سؤال ${qi + 1}${
                      isWrong
                        ? " — إجابة خاطئة ✗"
                        : answered
                        ? " — تمت الإجابة ✓"
                        : ""
                    }`}
                    className={`relative aspect-square rounded-xl text-sm font-black flex items-center justify-center border transition-all duration-200 ${
                      isCurrent
                        ? "bg-gold-500 text-bg-base border-gold-400 shadow-md scale-105"
                        : isWrong
                        ? "bg-red-500/15 text-red-300 border-red-500/40 hover:border-red-500/60"
                        : answered
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:border-emerald-500/60"
                        : "bg-surface text-ivory-muted border-surface-border hover:border-gold-500/40"
                    }`}
                  >
                    {isCurrent ? (
                      qi + 1
                    ) : isWrong ? (
                      <XCircle className="w-5 h-5" />
                    ) : answered ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      qi + 1
                    )}
                  </button>
                );
              })}
            </div>

            {/* شريط التقدّم */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-ivory-muted mb-2">
                <span>التقدّم</span>
                <span className="text-emerald-300 font-bold">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ivory-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-gold-500" />
                  الحالي
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-red-500/50 border border-red-500/60" />
                  خطأ
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/30 border border-emerald-500/40" />
                  صحيح
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-surface border border-surface-border" />
                  بلا إجابة
                </span>
              </div>
            </div>
          </aside>

          {/* ── السؤال وصندوق الإجابة بجانبه ── */}
          <section className="order-1 lg:order-2 p-6 min-w-0">
            {q && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-base font-black flex items-center justify-center">
                    {currentQIndex + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-ivory leading-relaxed">
                      {q.text}
                    </p>
                    <span className="inline-block mt-2 text-sm text-ivory-muted bg-surface border border-surface-border rounded-full px-3 py-1">
                      {q.marks} درجة
                    </span>
                  </div>
                </div>

                {q.requiresImageAnswer ? (
                  /* ── سؤال إجابة بصورة ── */
                  <div className="space-y-3">
                    <p className="text-sm text-violet-200 bg-violet-500/10 border border-violet-500/30 rounded-xl px-4 py-3 leading-relaxed">
                      ارفع صورة لحل هذا السؤال (JPG / PNG — حتى 10MB).
                      <br />
                      <span className="text-gold-300 font-bold">
                        سيتم مراجعة هذا السؤال بواسطة الأستاذ بعد التسليم، فلا
                        تقلق من النتيجة الفورية.
                      </span>
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(q.id, f);
                      }}
                    />

                    {imageAnswers[q.id] ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06]">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="text-base font-bold text-emerald-300 flex-1 text-right">
                          تم رفع صورة الإجابة بنجاح
                        </span>
                        <Button
                          size="md"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingQuestionId === q.id}
                          leftIcon={<RotateCcw className="w-4 h-4" />}
                        >
                          استبدال
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingQuestionId === q.id}
                        className="w-full p-8 rounded-xl border-2 border-dashed border-violet-500/40 bg-violet-500/[0.04] hover:border-violet-400 hover:bg-violet-500/[0.08] transition-all flex flex-col items-center justify-center gap-3 cursor-pointer"
                      >
                        {uploadingQuestionId === q.id ? (
                          <>
                            <Loader2 className="w-8 h-8 animate-spin text-violet-300" />
                            <span className="text-base font-bold text-violet-200">
                              جاري رفع الصورة...
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="p-3 rounded-full bg-violet-500/15 border border-violet-500/30">
                              <Upload className="w-7 h-7 text-violet-300" />
                            </span>
                            <span className="text-base font-bold text-violet-200">
                              اضغط لرفع صورة الحل
                            </span>
                            <span className="text-sm text-ivory-muted">
                              JPG / PNG / WEBP — 10MB
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  /* ── سؤال اختيار من متعدد ── */
                  <div className="space-y-3">
                    {q.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: idx }))
                        }
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-right text-base transition-all ${
                          answers[q.id] === idx
                            ? "border-violet-400 bg-violet-500/10 text-violet-200"
                            : "border-surface-border bg-surface hover:border-violet-500/40 text-ivory"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm shrink-0 ${
                            answers[q.id] === idx
                              ? "border-violet-400 bg-violet-500 text-white"
                              : "border-surface-border"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-between p-5 bg-surface border-t border-surface-border">
          <span className="text-sm text-ivory-muted">
            تمت الإجابة على {answeredCount} من {questions.length}
          </span>
          <div className="flex items-center gap-3">
            {currentQIndex > 0 && (
              <Button
                size="md"
                variant="outline"
                onClick={() => setCurrentQIndex((i) => i - 1)}
              >
                السابق
              </Button>
            )}
            {currentQIndex < questions.length - 1 ? (
              <Button size="md" onClick={() => setCurrentQIndex((i) => i + 1)}>
                التالي
              </Button>
            ) : (
              <Button
                size="md"
                onClick={() => attemptData && submit(attemptData, answers)}
                isLoading={phase === "submitting"}
                disabled={answeredCount === 0}
              >
                تسليم الواجب
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Result phase ──────────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
        <div
          className={`p-6 flex items-center gap-5 border-b border-surface-border ${
            result.isPassed ? "bg-emerald-500/10" : "bg-red-500/10"
          }`}
        >
          {result.isPassed ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          ) : (
            <XCircle className="w-10 h-10 text-red-400" />
          )}
          <div className="space-y-1">
            <p
              className={`text-2xl font-bold font-amiri ${
                result.isPassed ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {result.score}%
            </p>
            <p className="text-base text-ivory-muted">
              {result.earnedMarks}/{result.totalMarks} درجة • النجاح عند{" "}
              {result.passingPercentage}%
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-96 overflow-y-auto custom-scrollbar">
          {result.modelAnswers.map((a, i) => (
            <div
              key={a.questionId}
              className="space-y-2 pb-4 border-b border-surface-border last:border-0"
            >
              <p className="text-base font-bold text-ivory flex items-start gap-2">
                {a.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                سؤال {i + 1}: {a.text}
              </p>
              <p className="text-sm pr-7">
                {a.requiresImageAnswer ? (
                  <span className="text-violet-300">
                    تم تسليم صورة الحل —{" "}
                    <span className="font-bold text-gold-300">
                      هذا السؤال سيُراجَع بواسطة الأستاذ
                    </span>{" "}
                    وسيُعلَمك بالنتيجة عند الانتهاء، فلا تقلق.
                  </span>
                ) : (
                  <>
                    <span
                      className={
                        a.isCorrect ? "text-emerald-400" : "text-red-400"
                      }
                    >
                      إجابتك:{" "}
                      {a.yourAnswer !== null
                        ? a.options[a.yourAnswer]
                        : "لم تُجب"}
                    </span>
                    {!a.isCorrect && (
                      <span className="text-gold-300">
                        {" "}
                        • الصحيحة: {a.options[a.correctOptionIndex]}
                      </span>
                    )}
                  </>
                )}
              </p>
              {a.explanation && (
                <p className="text-sm text-ivory-muted pr-7 flex items-start gap-1.5">
                  <Lightbulb className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  {a.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="p-5 bg-surface border-t border-surface-border flex items-center gap-3 flex-wrap">
          <Button size="md" variant="outline" onClick={() => setPhase("idle")}>
            إغلاق النتيجة
          </Button>
          {/* زر مراجعة الحل — متاح دائماً بعد التسليم */}
          {result && (
            <Button
              size="md"
              variant="secondary"
              isLoading={reviewLoading}
              onClick={() => openReview(result.attemptId ?? "")}
              leftIcon={<Eye className="w-5 h-5" />}
            >
              مراجعة حلي
            </Button>
          )}
          {homework.remainingAttempts > 0 && !homework.hasActiveAttempt && (
            <Button size="md" variant="secondary" onClick={startOrResume}>
              <RotateCcw className="w-5 h-5" />
              حاول مرة أخرى ({homework.remainingAttempts} محاولات متبقية)
            </Button>
          )}
          {homework.remainingAttempts === 0 && (
            <p className="text-base text-emerald-400/90 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              تم التسليم بنجاح — لا يمكن الإعادة.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Review phase: student sees their submitted answers ─────────────
  if (phase === "review" && reviewDetail) {
    const rd = reviewDetail;
    const correctCount = rd.answers.filter((a) => a.isCorrect).length;
    const totalQuestions = rd.answers.length;
    
    return (
      <div className="relative rounded-3xl bg-gradient-to-br from-surface-card via-surface-card to-violet-500/5 border border-violet-500/30 overflow-hidden shadow-2xl shadow-violet-500/10">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gold-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-l from-white via-transparent to-gold-500/5 border-b border-violet-500/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="relative">
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black to-[var(--primary)]" />
                <span className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-gold-500/20 border border-violet-500/30">
                  <Eye className="w-7 h-7 text-white" />
                </span>
              </span>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-ivory flex items-center gap-3">
                  مراجعة إجاباتك
                  <span className="text-gold-400">✦</span>
                </h2>
                <p className="text-base text-ivory-muted mt-1">{rd.homework.title}</p>
              </div>
            </div>
            
            {/* Score card */}
            {rd.score !== null && (
              <div className={`relative p-4 rounded-2xl border ${
                rd.isPassed 
                  ? "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/30" 
                  : "bg-gradient-to-br from-red-500/15 to-red-500/5 border-red-500/30"
              }`}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <p className={`relative text-3xl sm:text-4xl font-black font-amiri ${
                  rd.isPassed ? "text-emerald-400" : "text-red-400"
                }`}>
                  {rd.score}%
                </p>
                <p className="relative text-sm text-ivory-muted mt-1">
                  {rd.earnedMarks}/{rd.totalMarks} درجة
                </p>
              </div>
            )}
          </div>
          
          {/* Stats bar */}
          <div className="flex items-center gap-6 mt-6 p-4 rounded-2xl bg-surface/50 border border-surface-border/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{correctCount}</p>
                <p className="text-sm text-ivory-muted">صحيحة</p>
              </div>
            </div>
            <div className="w-px h-10 bg-surface-border" />
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30">
                <XCircle className="w-5 h-5 text-red-400" />
              </span>
              <div>
                <p className="text-2xl font-bold text-red-400">{totalQuestions - correctCount}</p>
                <p className="text-sm text-ivory-muted">خاطئة</p>
              </div>
            </div>
            <div className="w-px h-10 bg-surface-border" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-ivory-muted mb-2">
                <span>التقدم</span>
                <span className="font-bold">{Math.round((correctCount / totalQuestions) * 100)}%</span>
              </div>
              <div className="h-3 rounded-full bg-surface-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
                  style={{ width: `${(correctCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Answers list */}
        <div className="relative p-6 sm:p-8 space-y-6 max-h-[32rem] overflow-y-auto custom-scrollbar">
          {rd.answers.map((a, i) => {
            const q = a.question as any;
            const isImage = q.requiresImageAnswer;
            return (
              <div
                key={a.id}
                className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                  a.isCorrect 
                    ? "bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20 hover:border-emerald-500/40" 
                    : isImage && a.teacherGrade === null
                    ? "bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20 hover:border-amber-500/40"
                    : "bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20 hover:border-red-500/40"
                }`}
              >
                {/* Question number badge */}
                <div className="absolute -top-3 -right-3">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black ${
                    a.isCorrect 
                      ? "bg-emerald-500 text-white" 
                      : isImage && a.teacherGrade === null
                      ? "bg-amber-500 text-white"
                      : "bg-red-500 text-white"
                  }`}>
                    {i + 1}
                  </span>
                </div>
                
                {/* Question text */}
                <div className="flex items-start gap-3 mb-4">
                  {a.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : isImage && a.teacherGrade === null ? (
                    <Loader2 className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-spin" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <p className="text-lg font-bold text-ivory leading-relaxed">
                    {q.text}
                  </p>
                </div>
                
                {/* Answer content */}
                {isImage ? (
                  <div className="pr-9 space-y-4">
                    {a.imageUrl ? (
                      <a
                        href={a.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <img
                          src={a.imageUrl}
                          alt="إجابتك"
                          className="rounded-2xl border-2 border-violet-500/30 max-h-72 w-auto object-contain group-hover:border-violet-400 transition-all duration-300 cursor-zoom-in shadow-lg shadow-violet-500/10"
                        />
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <p className="text-base text-amber-400">
                          لم ترفع صورة الإجابة.
                        </p>
                      </div>
                    )}
                    {a.teacherGrade !== null ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <p className="text-base text-emerald-400">
                          درجة الأستاذ: <span className="font-bold">{a.teacherGrade}/{q.marks}</span>
                          {a.teacherNote && (
                            <span className="text-ivory-muted">
                              {" "}— {a.teacherNote}
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        <p className="text-base text-amber-400/80">
                          هذا السؤال قيد المراجعة من الأستاذ — سيُعلَمك بالنتيجة
                          فور انتهائه، فاطمئن.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pr-9 space-y-3">
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${
                      a.isCorrect 
                        ? "bg-emerald-500/10 border border-emerald-500/30" 
                        : "bg-red-500/10 border border-red-500/30"
                    }`}>
                      <p className={`text-base ${
                        a.isCorrect ? "text-emerald-400" : "text-red-400"
                      }`}>
                        <span className="font-bold">إجابتك:</span> {q.options?.[a.selectedOptionIndex!] ?? "لم تُجب"}
                      </p>
                    </div>
                    {!a.isCorrect && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-500/10 border border-gold-500/30">
                        <CheckCircle2 className="w-5 h-5 text-gold-400" />
                        <p className="text-base text-gold-300">
                          <span className="font-bold">الصحيحة:</span> {q.options?.[q.correctOptionIndex]}
                        </p>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                        <Lightbulb className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                        <p className="text-base text-ivory-muted leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-l from-violet-500/5 via-transparent to-gold-500/5 border-t border-violet-500/20">
          <div className="flex items-center justify-between">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setPhase("idle")}
              className="min-w-[160px]"
            >
              إغلاق المراجعة
            </Button>
            <div className="flex items-center gap-2 text-sm text-ivory-muted">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>صحيحة</span>
              <span className="w-3 h-3 rounded-full bg-red-500 ml-3" />
              <span>خاطئة</span>
              <span className="w-3 h-3 rounded-full bg-amber-500 ml-3" />
              <span>قيد المراجعة</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Idle: show homework info & start button ──────────────────
  const canAttempt =
    homework.remainingAttempts > 0 || homework.hasActiveAttempt;
  const isDone = bestScore !== null;

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-violet-500/20 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <h3 className="text-xl font-bold text-ivory flex items-center gap-3">
            <BookOpenCheck className="w-6 h-6 text-violet-400" />
            {homework.title}
          </h3>
          <p className="text-base text-ivory-muted leading-relaxed">
            {homework.description}
          </p>
          <p className="text-base text-ivory-muted">
            {homework.questionCount} سؤال • بنفس ترتيب ورقة الـ PDF
            {homework.remainingAttempts > 0
              ? homework.remainingAttempts === 1
                ? " • محاولة واحدة متبقية"
                : ` • ${homework.remainingAttempts} محاولات متبقية`
              : " • لا توجد محاولات متبقية"}
            {bestScore !== null && ` • أفضل نتيجة: ${bestScore}%`}
          </p>
        </div>
        {isDone && (
          <Badge
            variant={
              bestScore! >= homework.passingPercentage ? "success" : "warning"
            }
          >
            {bestScore}%
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {canAttempt ? (
          <Button
            size="md"
            onClick={() => (onSolve ? onSolve() : startOrResume())}
          >
            {homework.hasActiveAttempt ? (
              <>
                <RotateCcw className="w-5 h-5" />
                استكمال حل الواجب
              </>
            ) : isDone ? (
              "إعادة حل الواجب"
            ) : (
              "ابدأ حل الواجب"
            )}
          </Button>
        ) : isDone ? (
          <p className="text-base text-emerald-400/90 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            تم تسليم الواجب بنجاح — لا يمكن الإعادة.
          </p>
        ) : (
          <p className="text-base text-amber-400/90">
            استنفدت كل محاولات هذا الواجب.
          </p>
        )}
        {homework.hasPdf && (
          <button 
            onClick={openPdf}
            disabled={pdfLoading}
            className="flex items-center gap-2.5 text-base text-white border bg-[var(--primary)] px-4 py-2.5 rounded-3xl hover:opacity-90 transition-opacity"
          >
            {pdfLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            عرض ورقة الواجب PDF
          </button>
        )}
        {/* زر مراجعة الحل من الـ idle — للمحاولات المسلمة */}
        {isDone && info?.attempts && info.attempts.length > 0 && (
          <Button
            size="md"
            variant="outline"
            isLoading={reviewLoading}
            onClick={() =>
              openReview(info.attempts[info.attempts.length - 1].id)
            }
            leftIcon={<Eye className="w-5 h-5" />}
          >
            مراجعة حلي
          </Button>
        )}
      </div>

      {!isDone && (
        <p className="text-sm text-amber-400/90">
          مطلوب حل الواجب لفتح الدرس التالي.
        </p>
      )}
    </div>
  );
};

// ─── عدّاد تنازلي حي حتى موعد فتح الواجب ───
const OpenCountdown: React.FC<{ iso: string; onDone: () => void }> = ({
  iso,
  onDone,
}) => {
  const [remaining, setRemaining] = useState(
    () => new Date(iso).getTime() - Date.now()
  );

  useEffect(() => {
    const t = setInterval(() => {
      const ms = new Date(iso).getTime() - Date.now();
      setRemaining(ms);
      if (ms <= 0) {
        clearInterval(t);
        onDone();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [iso, onDone]);

  if (remaining <= 0) return null;
  const total = Math.floor(remaining / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return (
    <span
      dir="ltr"
      className="inline-block font-mono text-base font-bold text-gold-300 tabular-nums bg-gold-500/10 border border-gold-500/25 rounded-xl px-3 py-1"
    >
      {d > 0 ? `${d}d ` : ""}
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:
      {String(s).padStart(2, "0")}
    </span>
  );
};

// ─── Teacher/Admin preview — read-only list of homeworks on the lesson ────
export const HomeworkPanelTeacherPreview: React.FC<HomeworkPanelProps> = ({
  lessonId,
}) => {
  const [items, setItems] = useState<
    | Awaited<
        ReturnType<typeof homeworkApi.getTeacherLessonHomeworks>
      >["homeworks"]
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await homeworkApi.getTeacherLessonHomeworks(lessonId);
      setItems(data.homeworks);
    } catch {
      setError("تعذر تحميل واجبات الدرس.");
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-sm text-red-400">{error}</p>
        <Button size="sm" variant="outline" onClick={load}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
        <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
        جاري تحميل الواجب...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
        <BookOpenCheck className="w-4 h-4 text-violet-400/50" />
        لا يوجد واجب على هذا الدرس — أضفه من إدارة المنهج.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((hw) => (
        <div
          key={hw.id}
          className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold text-ivory truncate flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-violet-400 shrink-0" />
              {hw.title}
            </p>
            <p className="text-[11px] text-ivory-muted mt-1">
              {hw.questions.length} سؤال
              {` • ${hw.maxAttempts} محاولات • النجاح عند ${hw.passingPercentage}%`}
              {hw.pdfUrl ? " • ملف PDF مرفوع ✓" : " • لا يوجد ملف PDF"}
            </p>
          </div>
          <Badge variant={hw.isPublished ? "success" : "warning"}>
            {hw.isPublished ? "منشور" : "مسودة"}
          </Badge>
        </div>
      ))}
    </div>
  );
};
