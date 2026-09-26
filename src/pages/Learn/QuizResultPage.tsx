import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ListChecks,
  Timer,
  X,
  XCircle,
  Lightbulb,
  Sparkles,
  Trophy,
  ChevronLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { quizzesApi } from '../../api/quizzes.api';
import { Button } from '../../components/ui/Button';

/* ── Helpers ── */
const formatDateTime = (v?: string | null) => {
  if (!v) return { date: '—', time: '—' };
  try {
    const d = new Date(v);
    return {
      date: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', second: '2-digit' }),
    };
  } catch {
    return { date: '—', time: '—' };
  }
};

/* ── Meta Stat Box ── */
const StatBox: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subValue?: string;
  tone?: string;
}> = ({ icon, label, value, subValue, tone = 'border-surface-border' }) => (
  <div className={`flex items-center gap-3.5 rounded-2xl border ${tone} bg-surface p-4 text-right shadow-xs transition-all`}>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt border border-surface-border">
      {icon}
    </div>
    <div className="min-w-0 flex-1 leading-snug">
      <p className="text-xs font-semibold text-ink-muted">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <strong className="text-base font-black text-ink font-din tabular-nums">{value}</strong>
        {subValue && <span className="text-[11px] text-ink-muted">{subValue}</span>}
      </div>
    </div>
  </div>
);

export const QuizResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    quizzesApi
      .getResult(attemptId, controller.signal)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-muted" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        <p className="text-sm font-bold">جاري تحميل نتيجة الكويز...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto my-16 max-w-lg rounded-3xl border border-red-500/30 bg-surface-card p-10 text-center space-y-4" dir="rtl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-black text-ink font-din">تعذر تحميل نتيجة الكويز</h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          حدث خطأ أثناء محاولة جلب تفاصيل النتيجة، يرجى المحاولة لاحقاً.
        </p>
        <Link to="/my-results">
          <Button variant="outline" size="sm">
            العودة إلى سجل النتائج
          </Button>
        </Link>
      </div>
    );
  }

  const answers = result.answers ?? result.modelAnswers ?? [];
  const totalQuestions = result.questionCount ?? answers.length;
  const answeredCount = answers.filter((a: any) => a.yourAnswer !== null && a.yourAnswer !== undefined).length;
  const correctCount = answers.filter((a: any) => a.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;

  const submitted = formatDateTime(result.submittedAt);
  const started = formatDateTime(result.startedAt);

  const durationMinutes =
    result.startedAt && result.submittedAt
      ? Math.max(0, Math.round((new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000))
      : null;

  return (
    <main className="quiz-result-page mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 text-right overflow-x-hidden" dir="rtl">
      {/* ═══════════════ TOP HEADER & SUMMARY CARD ═══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-3xl border bg-surface-card p-6 sm:p-8 shadow-card ${
          result.isPassed ? 'border-emerald-500/30' : 'border-red-500/30'
        }`}
      >
        {/* Glow ambient background */}
        <div
          className={`pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full blur-3xl ${
            result.isPassed ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}
        />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-gold-500/5 blur-3xl" />

        {/* Back navigation & Title bar */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-surface-border">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl border border-surface-border hover:border-gold-500/50 text-ink-muted hover:text-ink bg-surface transition-colors cursor-pointer shrink-0 mt-1"
              title="رجوع"
              aria-label="رجوع"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${
                  result.isPassed
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}
              >
                {result.isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {result.isPassed ? 'تم اجتياز الكويز بنجاح' : 'لم يتم اجتياز الكويز'}
              </span>

              <h1 className="text-2xl sm:text-3xl font-black text-ink font-din leading-tight">
                {result.quizTitle || 'نتيجة الكويز'}
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted">
                محاولة مسجلة وموثقة — راجع إجاباتك بالتفصيل وتعرّف على الإجابات النموذجية والشروحات.
              </p>
            </div>
          </div>

          {/* Large circular score display */}
          <div
            className={`flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-3xl border-2 self-center sm:self-auto ${
              result.isPassed
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_24px_-6px_rgba(52,211,153,0.3)]'
                : 'border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_24px_-6px_rgba(248,113,113,0.25)]'
            }`}
          >
            <span className="text-3xl sm:text-4xl font-black tabular-nums font-din">
              {result.score}%
            </span>
            <span className="mt-1 text-xs font-bold text-ink-muted">
              {result.earnedMarks} / {result.totalMarks} درجة
            </span>
          </div>
        </div>

        {/* 4 Key Stat Metric Boxes */}
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox
            icon={<ListChecks className="h-5 w-5 text-gold-400" />}
            label="إجمالي الأسئلة"
            value={totalQuestions}
            subValue="سؤال"
          />
          <StatBox
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            label="إجابات صحيحة"
            value={correctCount}
            subValue="سؤال"
            tone="border-emerald-500/20"
          />
          <StatBox
            icon={<XCircle className="h-5 w-5 text-red-400" />}
            label="إجابات خاطئة"
            value={wrongCount}
            subValue="سؤال"
            tone="border-red-500/20"
          />
          <StatBox
            icon={<Timer className="h-5 w-5 text-sky-400" />}
            label="الوقت المستغرق"
            value={durationMinutes === null ? '—' : durationMinutes}
            subValue={durationMinutes === null ? '' : 'دقيقة'}
          />
        </div>

        {/* Metadata timing banner */}
        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface-alt/50 px-4 py-3 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold-400" />
            <span>تاريخ التسليم: <strong className="font-bold text-ink">{submitted.date}</strong></span>
          </div>
          {started.time !== '—' && (
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-sky-400" />
              <span>وقت البدء: <strong className="font-bold text-ink">{started.time}</strong></span>
            </div>
          )}
          {submitted.time !== '—' && (
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-emerald-400" />
              <span>وقت الإنهاء: <strong className="font-bold text-ink">{submitted.time}</strong></span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══════════════ DETAILED QUESTION REVIEW ═══════════════ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <span className="text-xs font-bold text-gold-400">مراجعة شاملة</span>
            <h2 className="text-xl sm:text-2xl font-black text-ink font-din mt-0.5">
              تفاصيل إجاباتك والاختيارات
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-3.5 py-1.5 text-xs font-bold text-ink-muted w-fit shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-gold-400" />
            <span>{correctCount} إجابة صحيحة من {totalQuestions}</span>
          </span>
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          {answers.map((a: any, i: number) => {
            const correctAnswerIdx = a.correctOptionIndex ?? a.correctAnswer;
            const hasExplanation = Boolean(a.explanation && a.explanation.trim());

            return (
              <motion.article
                key={a.questionId || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.3 }}
                className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all bg-surface-card shadow-card ${
                  a.isCorrect
                    ? 'border-emerald-500/25 hover:border-emerald-500/40'
                    : 'border-red-500/25 hover:border-red-500/40'
                }`}
              >
                {/* Right edge indicator */}
                <span
                  className={`absolute inset-y-2.5 right-0 w-1 rounded-l-full ${
                    a.isCorrect
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                      : 'bg-gradient-to-b from-red-400 to-red-600'
                  }`}
                  aria-hidden
                />

                {/* Question title & index */}
                <div className="flex items-start gap-3.5 mb-4 pr-1.5">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black font-din ${
                      a.isCorrect
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          a.isCorrect
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-red-500/10 text-red-400 border-red-500/25'
                        }`}
                      >
                        {a.isCorrect ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-ink leading-relaxed pt-0.5">
                      {a.text}
                    </h3>
                  </div>
                </div>

                {/* Options list */}
                <div className="space-y-2 pr-1.5 sm:pr-11">
                  {(a.options ?? []).map((option: string, oi: number) => {
                    const isMyAnswer = oi === a.yourAnswer;
                    const isCorrectOption = oi === correctAnswerIdx;

                    let rowStyle = 'border-surface-border bg-surface-alt/40 text-ink-muted';
                    if (isCorrectOption) {
                      rowStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold';
                    } else if (isMyAnswer && !a.isCorrect) {
                      rowStyle = 'border-red-500/50 bg-red-500/10 text-red-400 font-bold';
                    }

                    return (
                      <div
                        key={oi}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm transition-all ${rowStyle}`}
                      >
                        <span className="flex items-center gap-2.5">
                          <b className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface text-[11px] font-black text-ink font-din border border-surface-border">
                            {String.fromCharCode(65 + oi)}
                          </b>
                          <span>{option}</span>
                        </span>

                        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold">
                          {isMyAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]">
                              <span>إجابتك</span>
                              {a.isCorrect ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-red-400" />
                              )}
                            </span>
                          )}
                          {isCorrectOption && !a.isCorrect && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-400">
                              <span>الإجابة النموذجية</span>
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {hasExplanation && (
                  <div className="mt-4 mr-1.5 sm:mr-11 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-ink">
                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="font-bold text-amber-400">توضيح المعلم:</strong>
                      <p className="text-ink-muted">{a.explanation}</p>
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* ═══════════════ BOTTOM ACTIONS ═══════════════ */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link to="/my-results">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
            العودة إلى سجل النتائج
          </Button>
        </Link>
        <Link to="/courses">
          <Button variant="outline" size="md">
            تصفح باقي الكورسات
          </Button>
        </Link>
      </div>
    </main>
  );
};

export default QuizResultPage;
