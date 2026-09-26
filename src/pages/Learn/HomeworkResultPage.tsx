import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Lightbulb,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  homeworkApi,
  TeacherHomeworkAttemptDetail,
} from "../../api/homework.api";
import { Button } from "../../components/ui/Button";

const formatDateOnly = (d: string | null) => d ? new Date(d).toLocaleDateString('ar-EG') : '—';
const formatTimeOnly = (d?: string | null) => d ? new Date(d).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : '—';
const formatDuration = (startedAt?: string | null, submittedAt?: string | null) => {
  if (!startedAt || !submittedAt) return '—';
  const seconds = Math.max(0, Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes ? `${minutes} د ${remainingSeconds} ث` : `${remainingSeconds} ثانية`;
};

const ScoreRing: React.FC<{ score: number | null; passed: boolean | null }> = ({
  score,
  passed,
}) => {
  const pct = score ?? 0;
  const color = score === null ? "#f0b429" : passed ? "#34d399" : "#f87171";
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative w-[78px] h-[78px] shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="7"
        />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score === null ? (
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
        ) : (
          <span className="text-base font-black" style={{ color }}>
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
};

export const HomeworkResultPage: React.FC = () => {
  const { courseId, lessonId, attemptId } = useParams<{
    courseId: string;
    lessonId: string;
    attemptId: string;
  }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TeacherHomeworkAttemptDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!attemptId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await homeworkApi.getAttemptDetail(attemptId, signal);
      setDetail(data);
    } catch {
      if (signal?.aborted) return;
      setError("تعذر تحميل تفاصيل الواجب.");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 text-center max-w-lg mx-auto mt-10">
        <XCircle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-sm text-red-400">{error}</p>
        <Button size="sm" variant="outline" onClick={() => load()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (!detail) return null;

  const correctCount = detail.answers.filter((a) => a.isCorrect).length;
  const totalQuestions = detail.answers.length;
  const answeredCount = detail.answers.filter((a) => a.selectedOptionIndex !== null || a.imageUrl).length;
  return (
    <main className="hw-result-page mx-auto my-10 w-full max-w-5xl space-y-7 px-4 pb-16 sm:px-6 lg:px-8" dir="rtl">
    <style>{`@keyframes hwResultIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.hw-result-page>div{animation:hwResultIn .45s ease-out both}.hw-answer{animation:hwResultIn .4s ease-out both}@media(prefers-reduced-motion:reduce){.hw-result-page>div,.hw-answer{animation:none}}`}</style>
    <div className="relative rounded-[2rem] bg-surface-card border border-surface-border overflow-hidden shadow-card-dark">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative p-6 sm:p-8 bg-surface-alt/40 border-b border-surface-border">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl border border-surface-border hover:border-primary/50 text-ivory-muted hover:text-ivory bg-surface transition-colors cursor-pointer"
              title="رجوع"
              aria-label="رجوع"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Eye className="w-6 h-6 sm:w-7 sm:h-7" />
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-ivory flex items-center gap-2.5">
                مراجعة إجاباتك
                <Sparkles className="h-5 w-5 text-gold-400" aria-hidden="true" />
              </h2>
              <p className="text-sm sm:text-base text-ivory-muted mt-1">
                {detail.homework.title}
              </p>
            </div>
          </div>

          {detail.score !== null && (
            <div
              className={`relative p-4 sm:p-5 rounded-2xl border text-center shrink-0 min-w-[130px] ${
                detail.isPassed
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <p
                className={`relative text-3xl sm:text-4xl font-black font-amiri ${
                  detail.isPassed ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {detail.score}%
              </p>
              <p className="relative text-xs sm:text-sm text-ivory-muted mt-1 font-bold">
                {detail.earnedMarks} / {detail.totalMarks} درجة
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6 p-4 rounded-2xl bg-surface/70 border border-surface-border sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {correctCount}
              </p>
              <p className="text-sm text-ivory-muted">صحيحة</p>
            </div>
          </div>
          <div className="text-center text-sm text-ivory-muted space-y-1">
            <p>تمت الإجابة</p><b className="text-emerald-400">{answeredCount} / {totalQuestions}</b>
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30">
              <XCircle className="w-5 h-5 text-red-400" />
            </span>
            <div>
              <p className="text-2xl font-bold text-red-400">
                {totalQuestions - correctCount}
              </p>
              <p className="text-sm text-ivory-muted">خاطئة</p>
            </div>
          </div>
          <div className="text-center text-sm text-ivory-muted"><p>بدون إجابة</p><b className="text-amber-400">{Math.max(0, totalQuestions - answeredCount)}</b></div>
          <div className="text-center text-sm text-ivory-muted"><p>الوقت المستغرق</p><b className="text-gold-400">{formatDuration(detail.startedAt, detail.submittedAt)}</b></div>
          <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-surface-border pt-3 text-xs text-ivory-muted sm:col-span-3 lg:col-span-5">
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold-400" />بتاريخ: {formatDateOnly(detail.submittedAt)}</span>
            <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-sky-400" />وقت دخول الواجب: {formatTimeOnly(detail.startedAt)}</span>
            <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />وقت التسليم: {formatTimeOnly(detail.submittedAt)}</span>
            <span className="font-bold text-gold-400">محاولة #{detail.attemptNumber}</span>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="relative p-6 sm:p-8 space-y-6">
        {detail.answers.map((a, i) => {
          const q = a.question;
          const isImage = q.requiresImageAnswer;
          return (
            <div
              key={a.id}
              style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
              className={`hw-answer relative p-5 sm:p-6 rounded-2xl border transition-colors duration-200 ${
                a.isCorrect
                  ? "bg-emerald-500/[0.04] border-emerald-500/25 hover:border-emerald-500/40"
                  : isImage && a.teacherGrade === null
                  ? "bg-amber-500/[0.04] border-amber-500/25 hover:border-amber-500/40"
                  : "bg-red-500/[0.04] border-red-500/25 hover:border-red-500/40"
              }`}
            >
              <div className="absolute -top-3 -right-3">
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black ${
                    a.isCorrect
                      ? "bg-emerald-500 text-white"
                      : isImage && a.teacherGrade === null
                      ? "bg-amber-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {i + 1}
                </span>
              </div>

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
                      className="rounded-2xl border-2 border-violet-500/30 max-h-72 w-auto object-contain group-hover:border-violet-400 transition-all duration-300 cursor-zoom-in shadow-sm shadow-black/10"
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
                        درجة الأستاذ:{" "}
                        <span className="font-bold">
                          {a.teacherGrade}/{q.marks}
                        </span>
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
                        هذا السؤال قيد المراجعة من الأستاذ.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pr-9 space-y-3">
                  <div
                    className={`flex items-center gap-3 p-4 rounded-xl ${
                      a.isCorrect
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "bg-red-500/10 border border-red-500/30"
                    }`}
                  >
                    <p
                      className={`text-base ${
                        a.isCorrect ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      <span className="font-bold">إجابتك:</span>{" "}
                      {q.options?.[a.selectedOptionIndex!] ?? "لم تُجب"}
                    </p>
                  </div>
                  {!a.isCorrect && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-500/10 border border-gold-500/30">
                      <CheckCircle2 className="w-5 h-5 text-gold-400" />
                      <p className="text-base text-gold-300">
                        <span className="font-bold">الصحيحة:</span>{" "}
                        {q.options?.[q.correctOptionIndex]}
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
      <div className="relative p-6 sm:p-8 bg-surface-alt/40 border-t border-surface-border">
        <div className="flex items-center justify-between">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(-1)}
            className="min-w-[160px]"
          >
            العودة
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
    </main>
  );
};

export default HomeworkResultPage;
