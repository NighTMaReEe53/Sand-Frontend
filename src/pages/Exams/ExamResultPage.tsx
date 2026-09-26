import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Download,
  Loader2,
  PartyPopper,
  RotateCcw,
  Trophy,
  Clock,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileQuestion,
  ChevronLeft,
  CalendarDays,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { useAttemptResultQuery } from '../../hooks/queries/useExams';
import { examsApi } from '../../api/exams.api';
import { Button } from '../../components/ui/Button';
import { SkeletonExamResult } from '../../components/ui/Skeleton';
import { ExamLeaderboard } from '../../components/exams/ExamLeaderboard';
import { DotsPatternSvg } from '../../components/ui/Doodles';

function formatDetailedDuration(startedAt?: string, submittedAt?: string): string {
  if (!startedAt || !submittedAt) return '—';
  const totalSeconds = Math.max(
    0,
    Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000),
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours} س و ${minutes} د`;
  if (minutes > 0) return `${minutes} دقيقة`;
  return `${seconds} ثانية`;
}

export const ExamResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading, isError } = useAttemptResultQuery(attemptId);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    if (!attemptId) return;
    setIsDownloadingPdf(true);
    setPdfError(null);
    try {
      await examsApi.downloadResultPdf(attemptId);
    } catch (err) {
      console.error('Failed to download PDF', err);
      setPdfError('تعذر تحميل ملف الـ PDF، حاول مرة أخرى.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (result?.isPassed) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#C9A15A', '#E8C97A', '#F4EFE6', '#10B981'],
        });
      } catch {
        // Ignore canvas-confetti errors if headless
      }
    }
  }, [result?.isPassed]);

  if (isLoading) {
    return <SkeletonExamResult />;
  }

  if (isError || !result) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4" dir="rtl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold font-din text-ink">لم يتم العثور على النتيجة</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          تأكد من صحة الرابط أو أنك قمت بتسليم الامتحان بشكل سليم.
        </p>
        <Link to="/courses">
          <Button variant="outline" size="sm">العودة للكورسات</Button>
        </Link>
      </div>
    );
  }

  const {
    score,
    totalMarks = 100,
    passingMarks,
    isPassed,
    startedAt,
    submittedAt,
    examTitle,
    courseId,
    examId,
    questionCount,
    answers,
    actualPerformanceRank,
    leaderboardEligibility,
  } = result;

  const finalScore = score ?? 0;
  const percentage = totalMarks > 0 ? Math.round((finalScore / totalMarks) * 100) : 0;

  // Metric statistics
  const totalQuestions = questionCount ?? answers?.length ?? 0;
  const answeredCount = answers
    ? answers.filter((a) => a.yourAnswer !== null && a.yourAnswer !== undefined).length
    : null;
  const unansweredCount =
    answeredCount !== null && totalQuestions > 0
      ? Math.max(0, totalQuestions - answeredCount)
      : null;
  const correctCount = answers ? answers.filter((a) => a.isCorrect).length : null;
  const wrongCount =
    answeredCount !== null && correctCount !== null
      ? Math.max(0, answeredCount - correctCount)
      : null;

  const durationText = formatDetailedDuration(startedAt, submittedAt);

  const exitCount = leaderboardEligibility?.exitCount ?? 0;
  const isEligible = leaderboardEligibility ? leaderboardEligibility.eligible : exitCount <= 2;
  const maxAllowedExits = leaderboardEligibility?.maxAllowedExits ?? 2;

  // Target ranking page link
  const rankingUrl = `/exam-rankings?${new URLSearchParams({
    ...(courseId ? { courseId } : {}),
    ...(examId ? { examId } : {}),
  }).toString()}`;

  return (
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right overflow-x-hidden" dir="rtl">
      {/* ─── Ambient Glow Background ─── */}
      <div
        className={`pointer-events-none absolute -top-16 right-1/4 h-72 w-72 rounded-full blur-3xl ${
          isPassed ? 'bg-emerald-500/[0.08]' : 'bg-red-500/[0.08]'
        }`}
      />
      <div className="pointer-events-none absolute -top-10 left-10 h-64 w-64 rounded-full bg-gold-500/[0.06] blur-3xl" />
      <DotsPatternSvg className="pointer-events-none absolute left-3 top-2 hidden w-20 opacity-20 md:block" />

      {/* ═══════════════ MAIN RESULT SUMMARY CARD ═══════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={`relative overflow-hidden rounded-3xl border bg-surface-card p-6 sm:p-9 shadow-card ${
          isPassed ? 'border-emerald-500/30' : 'border-red-500/30'
        }`}
      >
        {/* Top glowing accent rail */}
        <span
          className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
            isPassed ? 'from-emerald-400 via-emerald-500 to-emerald-600' : 'from-red-400 via-red-500 to-red-600'
          }`}
        />

        {/* Back Button & Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-surface-border">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => (courseId ? navigate(`/courses/${courseId}/exams`) : navigate(-1))}
              className="p-2.5 rounded-xl border border-surface-border hover:border-gold-500/50 text-ink-muted hover:text-ink bg-surface transition-colors cursor-pointer shrink-0 mt-1"
              title="رجوع"
              aria-label="رجوع"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${
                  isPassed
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}
              >
                {isPassed ? <PartyPopper className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                {isPassed ? 'تم اجتياز الامتحان بنجاح ومتميز' : 'حاول مرة أخرى وعوض في المحاولة القادمة'}
              </span>

              <h1 className="text-2xl sm:text-3xl font-black text-ink font-din leading-tight">
                نتيجة امتحان: <span className="font-amira text-primary inline-block">{examTitle}</span>
              </h1>

              {passingMarks !== undefined && passingMarks !== null && (
                <p className="text-xs text-ink-muted">
                  درجة النجاح المطلوبة لهذا الامتحان: <strong className="font-bold text-ink">{passingMarks}</strong> من أصل {totalMarks} نقطة.
                </p>
              )}
            </div>
          </div>

          {/* Animated Circular Score Display */}
          <div
            className={`flex h-36 w-36 shrink-0 flex-col items-center justify-center rounded-3xl border-2 self-center sm:self-auto ${
              isPassed
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_28px_-6px_rgba(52,211,153,0.3)]'
                : 'border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_28px_-6px_rgba(248,113,113,0.25)]'
            }`}
          >
            <span className="text-4xl font-black tabular-nums font-din">
              {percentage}%
            </span>
            <span className="mt-1 text-xs font-bold text-ink-muted">
              {finalScore} / {totalMarks} درجة
            </span>
            <span className="text-[10px] font-bold mt-0.5 text-ink-muted/80">
              {isPassed ? 'ناجح ومجتاز' : 'لم يجتز'}
            </span>
          </div>
        </div>

        {/* ─── 6 Key Metric Stat Cards Grid ─── */}
        <div className="pt-6">
          <h4 className="text-xs font-bold text-ink mb-3">تفاصيل وأرقام أداء الامتحان:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {/* 1. Total Questions */}
            <div className="rounded-2xl border border-surface-border bg-surface p-3.5 text-center space-y-1 shadow-xs transition-all hover:-translate-y-0.5">
              <FileQuestion className="w-4 h-4 text-gold-400 mx-auto" />
              <b className="block text-base sm:text-lg font-black text-ink font-din">{totalQuestions}</b>
              <span className="text-[10px] font-semibold text-ink-muted">إجمالي الأسئلة</span>
            </div>

            {/* 2. Answered */}
            <div className="rounded-2xl border border-surface-border bg-surface p-3.5 text-center space-y-1 shadow-xs transition-all hover:-translate-y-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
              <b className="block text-base sm:text-lg font-black text-emerald-400 font-din">{answeredCount ?? '—'}</b>
              <span className="text-[10px] font-semibold text-ink-muted">تمت الإجابة</span>
            </div>

            {/* 3. Unanswered */}
            <div className="rounded-2xl border border-surface-border bg-surface p-3.5 text-center space-y-1 shadow-xs transition-all hover:-translate-y-0.5">
              <HelpCircle className="w-4 h-4 text-amber-400 mx-auto" />
              <b className="block text-base sm:text-lg font-black text-amber-400 font-din">{unansweredCount ?? '—'}</b>
              <span className="text-[10px] font-semibold text-ink-muted">بدون إجابة</span>
            </div>

            {/* 4. Correct Answers */}
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 text-center space-y-1 shadow-xs transition-all hover:-translate-y-0.5">
              <Check className="w-4 h-4 text-emerald-400 mx-auto" />
              <b className="block text-base sm:text-lg font-black text-emerald-400 font-din">{correctCount ?? '—'}</b>
              <span className="text-[10px] font-semibold text-emerald-400/80">إجابات صحيحة</span>
            </div>

            {/* 5. Wrong Answers */}
            <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-3.5 text-center space-y-1 shadow-xs transition-all hover:-translate-y-0.5">
              <X className="w-4 h-4 text-red-400 mx-auto" />
              <b className="block text-base sm:text-lg font-black text-red-400 font-din">{wrongCount ?? '—'}</b>
              <span className="text-[10px] font-semibold text-red-400/80">إجابات خاطئة</span>
            </div>

            {/* 6. Time Taken */}
            <div className="rounded-2xl border border-surface-border bg-surface p-3.5 text-center space-y-1 shadow-xs transition-all hover:-translate-y-0.5">
              <Clock className="w-4 h-4 text-sky-400 mx-auto" />
              <b className="block text-xs sm:text-sm font-black text-sky-400 font-din leading-tight mt-0.5">{durationText}</b>
              <span className="text-[10px] font-semibold text-ink-muted">الوقت المستغرق</span>
            </div>
          </div>
        </div>

        {/* ─── Timing strip ─── */}
        {submittedAt && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface-alt/40 px-4 py-2.5 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-gold-400" />
              تاريخ التسليم: <strong className="font-bold text-ink">{new Date(submittedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </span>
            {startedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                وقت البدء: <strong className="font-bold text-ink">{new Date(startedAt).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</strong>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              وقت الإرسال: <strong className="font-bold text-ink">{new Date(submittedAt).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</strong>
            </span>
          </div>
        )}

        {/* ─── Security & Leaderboard Eligibility Notice ─── */}
        <div className="mt-5">
          {isEligible ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-emerald-400 block text-[13px]">
                    مؤهل للمنافسة في لوحة الشرف الرسمية
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    عدد مرات مغادرة شاشة الامتحان: {exitCount} من أصل {maxAllowedExits} (ضمن الحد المسموح به)
                  </span>
                </div>
              </div>

              {actualPerformanceRank && (
                <div className="text-right sm:text-left shrink-0 px-3.5 py-1.5 rounded-xl bg-surface border border-emerald-500/30">
                  <span className="text-[10px] text-ink-muted block font-semibold">ترتيبك الحالي:</span>
                  <span className="text-base font-black font-din text-emerald-400">
                    #{actualPerformanceRank}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-red-400 block text-[13px]">
                  مستبعد من لوحة الشرف الرسمية (خارج الترتيب)
                </span>
                <p className="text-[11px] text-ink-muted">
                  تم رصد خروجك من نافذة الامتحان <b className="text-red-400 font-bold">({exitCount} مرات)</b> متجاوزاً الحد المسموح به ({maxAllowedExits} مرات). درجتك ونقاطك مسجلة بالكامل، ولكن نتيجتك خارج ترتيب لوحة الشرف حفاظاً على تكافؤ الفرص.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={rankingUrl}>
            <Button
              size="md"
              leftIcon={<Trophy className="w-4 h-4 text-gold-300" />}
              className="bg-primary hover:bg-primary/90 text-white font-black shadow-md !rounded-xl"
            >
              عرض لوحة الشرف وترتيب الامتحان 🏆
            </Button>
          </Link>

          <Button
            variant="outline"
            size="md"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="!rounded-xl"
            leftIcon={
              isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
              ) : (
                <Download className="w-4 h-4 text-gold-400" />
              )
            }
          >
            {isDownloadingPdf ? 'جاري التحميل...' : 'تحميل النتيجة (PDF)'}
          </Button>

          {courseId && (
            <Link to={`/courses/${courseId}/exams`}>
              <Button variant="outline" size="md" className="!rounded-xl" rightIcon={<ArrowRight className="w-4 h-4" />}>
                امتحانات الكورس
              </Button>
            </Link>
          )}

          {courseId && (
            <Link to={`/courses/${courseId}`}>
              <Button variant="outline" size="md" className="!rounded-xl" leftIcon={<BookOpen className="w-4 h-4" />}>
                العودة للدروس
              </Button>
            </Link>
          )}
        </div>

        {pdfError && (
          <span className="block text-center text-xs text-red-400 font-bold mt-2">{pdfError}</span>
        )}
      </motion.div>

      {/* ═══════════════ TOP 3 PODIUM PREVIEW ═══════════════ */}
      {result.examId && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base sm:text-lg font-black font-din text-ink flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold-400" />
              لوحة أبطال الامتحان (المراكز الأولى)
            </h3>
            <Link
              to={rankingUrl}
              className="text-xs font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
            >
              <span>عرض الترتيب الكامل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-card">
            <ExamLeaderboard examId={result.examId} />
          </div>
        </section>
      )}

      {/* ═══════════════ MODEL ANSWERS & QUESTIONS REVIEW ═══════════════ */}
      {answers && answers.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <span className="text-xs font-bold text-gold-400">مراجعة نموذجية</span>
              <h2 className="text-xl sm:text-2xl font-black text-ink font-din mt-0.5">
                تفاصيل الأسئلة والإجابات والشروحات
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-3.5 py-1.5 text-xs font-bold text-ink-muted w-fit shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-gold-400" />
              <span>{correctCount} إجابة صحيحة من {totalQuestions}</span>
            </span>
          </div>

          <div className="space-y-4">
            {answers.map((item: any, idx: number) => {
              const isCorrect = Boolean(item.isCorrect);
              const hasExplanation = Boolean(item.explanation && item.explanation.trim());

              return (
                <motion.article
                  key={item.questionId ?? idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.35), duration: 0.28 }}
                  className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all bg-surface-card shadow-card ${
                    isCorrect
                      ? 'border-emerald-500/25 hover:border-emerald-500/40'
                      : 'border-red-500/25 hover:border-red-500/40'
                  }`}
                >
                  {/* Right edge indicator */}
                  <span
                    className={`absolute inset-y-2.5 right-0 w-1 rounded-l-full ${
                      isCorrect
                        ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-b from-red-400 to-red-600'
                    }`}
                    aria-hidden
                  />

                  {/* Header: Question title & marks */}
                  <div className="flex items-start justify-between gap-4 mb-4 pr-1.5">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black font-din ${
                          isCorrect
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <span className="text-[11px] text-ink-muted font-bold block">
                          السؤال {idx + 1}
                        </span>
                        <h4 className="text-base font-bold text-ink leading-relaxed">
                          {item.text}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shrink-0 border ${
                        isCorrect
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-red-500/30 bg-red-500/10 text-red-400'
                      }`}
                    >
                      {isCorrect ? `صحيحة (+${item.awardedMarks ?? 1})` : 'خاطئة (0)'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 pr-1.5 sm:pr-11">
                    {(item.options ?? []).map((opt: string, optIdx: number) => {
                      const isStudentSelected = item.yourAnswer === optIdx;
                      const isCorrectAnswer = item.correctAnswer === optIdx;

                      let rowStyle = 'border-surface-border bg-surface-alt/40 text-ink-muted';
                      if (isCorrectAnswer) {
                        rowStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold';
                      } else if (isStudentSelected && !isCorrect) {
                        rowStyle = 'border-red-500/50 bg-red-500/10 text-red-400 font-bold';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm transition-all ${rowStyle}`}
                        >
                          <span className="flex items-center gap-2.5">
                            <b className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface text-[11px] font-black text-ink font-din border border-surface-border">
                              {String.fromCharCode(65 + optIdx)}
                            </b>
                            <span>{opt}</span>
                          </span>

                          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold">
                            {isStudentSelected && (
                              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]">
                                <span>إجابتك</span>
                                {isCorrect ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <X className="h-3.5 w-3.5 text-red-400" />
                                )}
                              </span>
                            )}
                            {isCorrectAnswer && !isCorrect && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] text-emerald-400">
                                <span>الإجابة الصحيحة</span>
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Teacher Explanation Box */}
                  {hasExplanation && (
                    <div className="mt-4 mr-1.5 sm:mr-11 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-ink">
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="font-bold text-amber-400">توضيح الأستاذ:</strong>
                        <p className="text-ink-muted">{item.explanation}</p>
                      </div>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ExamResultPage;
