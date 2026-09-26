import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Bookmark,
  Send,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  examsApi,
  MistakePracticeExamResponse,
  PracticeExamResultResponse,
} from '../../api/exams.api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import {
  CorrectCheckSvg,
  WrongCrossSvg,
  PerfectScoreSvg,
} from '../../components/ui/Doodles';

const ARABIC_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
const letter = (i: number) => ARABIC_LETTERS[i] ?? String(i + 1);

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const MistakePracticeExamPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId') || undefined;
  const courseId = searchParams.get('courseId') || undefined;

  // Exam session state
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exam, setExam] = useState<MistakePracticeExamResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | null>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<PracticeExamResultResponse | null>(null);

  // Modals
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // 1. Fetch practice exam on mount
  const fetchExam = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setResults(null);
    setSelectedAnswers({});
    setFlaggedQuestions(new Set());
    setCurrentIndex(0);

    try {
      const data = await examsApi.generateMistakePracticeExam({
        groupId,
        courseId,
        count: 20,
      });
      setExam(data);
      const totalSec = (data.timeLimitMinutes || 10) * 60;
      setSecondsRemaining(totalSec);
      startTimeRef.current = Date.now();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'تعذر تجهيز الامتحان التدريبي. تأكد من وجود أخطاء مسجلة وحاول مجدداً.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }, [groupId, courseId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  // Submit action definition
  const handleSubmit = useCallback(
    async (isTimeout = false) => {
      if (!exam || isSubmitting || results) return;
      setIsSubmitting(true);
      setShowSubmitConfirm(false);

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const timeSpent = Math.max(
        1,
        Math.round((Date.now() - startTimeRef.current) / 1000),
      );

      const answersPayload = exam.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: selectedAnswers[q.id] ?? null,
      }));

      try {
        const res = await examsApi.submitMistakePracticeExam({
          practiceId: exam.practiceId,
          timeSpentSeconds: timeSpent,
          answers: answersPayload,
        });
        setResults(res);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          'حدث خطأ أثناء تسليم الامتحان التدريبي. حاول مرة أخرى.';
        setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        setIsSubmitting(false);
      }
    },
    [exam, isSubmitting, results, selectedAnswers],
  );

  // 2. Countdown timer
  useEffect(() => {
    if (!exam || results || loading) return;

    timerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [exam, results, loading, handleSubmit]);

  // Derived statistics
  const currentQuestion = useMemo(
    () => (exam ? exam.questions[currentIndex] : null),
    [exam, currentIndex],
  );

  const answeredCount = useMemo(() => {
    if (!exam) return 0;
    return Object.values(selectedAnswers).filter((v) => v !== null && v !== undefined).length;
  }, [exam, selectedAnswers]);

  const progressPercentage = useMemo(() => {
    if (!exam || exam.questions.length === 0) return 0;
    return Math.round((answeredCount / exam.questions.length) * 100);
  }, [exam, answeredCount]);

  const toggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSelectOption = (questionId: string, optIndex: number) => {
    if (results) return; // Read-only after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optIndex ? null : optIndex,
    }));
  };

  const isLowTime = secondsRemaining <= 120 && secondsRemaining > 0;

  // ══════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <Clock className="h-8 w-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-ink">جاري تجهيز امتحان التدريب من الأخطاء...</h2>
          <p className="text-xs text-ink-muted">
            نقوم بجمع الأسئلة التي تعثرت بها سابقاً وخلطها لضمان تدريب فعّال.
          </p>
        </div>
        <div className="mx-auto max-w-md space-y-3 pt-4">
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ERROR STATE
  // ══════════════════════════════════════════════════════════════
  if (errorMsg || !exam) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-5 text-right">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold text-ink">لا يمكن بدء الامتحان التدريبي</h2>
          <p className="text-xs text-ink-muted leading-relaxed">{errorMsg}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button variant="primary" onClick={() => navigate('/mistakes')}>
            العودة لدفتر الأخطاء
          </Button>
          <Button variant="outline" onClick={fetchExam}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RESULTS SCREEN (POST-SUBMISSION)
  // ══════════════════════════════════════════════════════════════
  if (results) {
    const isHigh = results.percentage >= 80;
    const isMedium = results.percentage >= 50 && results.percentage < 80;

    return (
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 text-right sm:px-6">
        {/* Results Hero Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`relative overflow-hidden rounded-3xl border p-6 sm:p-10 text-center ${
            isHigh
              ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-surface to-surface'
              : isMedium
              ? 'border-gold-500/30 bg-gradient-to-b from-gold-500/10 via-surface to-surface'
              : 'border-red-500/25 bg-gradient-to-b from-red-500/10 via-surface to-surface'
          }`}
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

          {/* Badge & Icon */}
          <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-alt/70 px-4 py-1 text-xs font-bold text-ink-muted backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            نتيجة الامتحان التدريبي من الأخطاء
          </div>

          {/* Score percentage display */}
          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-surface-border bg-surface shadow-2xl">
              <span className="text-4xl font-black tabular-nums text-ink font-din">
                {results.percentage}%
              </span>
              {isHigh && (
                <span className="absolute -top-2 -right-1 text-2xl animate-bounce">🏆</span>
              )}
            </div>

            <h1 className="mt-5 text-2xl sm:text-3xl font-black text-ink">
              {isHigh
                ? 'أداء ممتاز! تمكنت من إتقان أخطائك بنجاح'
                : isMedium
                ? 'محاولة جيدة جداً! خطواتك ثابتة نحو النجاح'
                : 'فرصة رائعة للتعلّم! راجع الشرح أدناه لتثبيت الحل'}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-ink-muted max-w-lg">
              {exam.title} — تم حل {results.score} من إجمالي {results.totalMarks} أسئلة بشكل صحيح.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-surface-border bg-surface-card p-3.5 text-center">
              <span className="text-[11px] font-bold text-ink-muted">الدرجة النهائية</span>
              <p className="mt-1 text-lg font-black text-ink">
                {results.score} / {results.totalMarks}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-card p-3.5 text-center">
              <span className="text-[11px] font-bold text-ink-muted">الوقت المستغرق</span>
              <p className="mt-1 text-lg font-black text-ink">
                {formatTime(results.timeSpentSeconds)}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-card p-3.5 text-center">
              <span className="text-[11px] font-bold text-emerald-400">إجابات صحيحة</span>
              <p className="mt-1 text-lg font-black text-emerald-400 font-din">
                {results.score}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-card p-3.5 text-center">
              <span className="text-[11px] font-bold text-red-400">تحتاج مراجعة</span>
              <p className="mt-1 text-lg font-black text-red-400 font-din">
                {results.totalMarks - results.score}
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={fetchExam}
            >
              إعادة التدريب على هذه الأخطاء
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate('/mistakes')}
            >
              العودة لدفتر الأخطاء
            </Button>
          </div>
        </motion.div>

        {/* Detailed Review Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              مراجعة الأسئلة وتوضيح الإجابات
            </h2>
            <span className="text-xs text-ink-muted">
              {results.detailedResults.length} أسئلة
            </span>
          </div>

          <div className="space-y-4">
            {results.detailedResults.map((item, idx) => (
              <div
                key={item.questionId}
                className={`overflow-hidden rounded-2xl border bg-surface p-5 sm:p-6 transition-all ${
                  item.isCorrect
                    ? 'border-emerald-500/25 bg-surface'
                    : 'border-red-500/25 bg-surface'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-alt text-xs font-bold text-ink">
                      {idx + 1}
                    </span>
                    <Badge variant={item.isCorrect ? 'success' : 'danger'} size="sm">
                      {item.isCorrect ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}
                    </Badge>
                  </div>
                  {item.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>

                {/* Question text */}
                <p className="mt-4 text-base font-semibold leading-relaxed text-ink">
                  {item.text}
                </p>

                {/* Options List */}
                <div className="mt-4 space-y-2">
                  {item.options.map((opt, optIdx) => {
                    const isCorrectAnswer = optIdx === item.correctOptionIndex;
                    const isSelectedByStudent = optIdx === item.selectedOptionIndex;

                    let optCls = 'border-surface-border bg-surface-card/60 text-ink-muted';
                    if (isCorrectAnswer) {
                      optCls =
                        'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold';
                    } else if (isSelectedByStudent && !isCorrectAnswer) {
                      optCls = 'border-red-500/40 bg-red-500/10 text-red-300 font-semibold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-xs sm:text-sm leading-relaxed ${optCls}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                          {letter(optIdx)}
                        </span>
                        <span className="min-w-0 flex-1">{opt}</span>
                        {isCorrectAnswer && (
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            الإجابة الصحيحة
                          </span>
                        )}
                        {isSelectedByStudent && !isCorrectAnswer && (
                          <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                            إجابتك
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-surface-border bg-surface-alt/70 p-3.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
                      <Lightbulb className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-[11px] font-bold text-gold-400">الشرح والتوضيح</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ACTIVE PRACTICE EXAM VIEW (IN PROGRESS)
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-right sm:px-6">
      {/* Top Header Bar */}
      <header className="rounded-3xl border border-surface-border bg-surface-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Exam info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                <BookOpen className="h-3 w-3" />
                {exam.courseTitle}
              </span>
              <span className="text-[11px] font-bold text-ink-muted">
                سؤال {currentIndex + 1} من {exam.questions.length}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-ink truncate max-w-md">
              {exam.title}
            </h1>
          </div>

          {/* Timer & Submit controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {/* Countdown Badge */}
            <div
              className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 font-mono text-sm font-black tabular-nums transition-colors ${
                isLowTime
                  ? 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse'
                  : 'border-surface-border bg-surface text-ink'
              }`}
            >
              <Clock className={`h-4 w-4 ${isLowTime ? 'text-red-400 animate-spin' : 'text-primary'}`} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Exit button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExitConfirm(true)}
              className="text-xs"
            >
              خروج
            </Button>

            {/* Finish & Submit button */}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="h-3.5 w-3.5" />}
              onClick={() => setShowSubmitConfirm(true)}
              className="text-xs font-bold"
            >
              تسليم الامتحان
            </Button>
          </div>
        </div>

        {/* Progress Line */}
        <div className="mt-4 pt-3 border-t border-surface-border">
          <div className="flex items-center justify-between text-[11px] font-bold text-ink-muted mb-1.5">
            <span>نسبة الإنجاز</span>
            <span>
              {answeredCount} من {exam.questions.length} تم الإجابة عليها ({progressPercentage}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-alt">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      {/* Question Navigator Pills */}
      <nav aria-label="Question Navigator" className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {exam.questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered =
              selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== null;
            const isFlagged = flaggedQuestions.has(idx);

            let pillCls = 'border-surface-border bg-surface-card text-ink-muted hover:border-primary/40';
            if (isCurrent) {
              pillCls = 'border-primary ring-2 ring-primary/20 bg-primary/10 text-primary font-bold';
            } else if (isAnswered) {
              pillCls = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-black transition-all ${pillCls}`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Question Display */}
      {currentQuestion && (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 space-y-6 shadow-sm"
        >
          {/* Top question bar */}
          <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary text-sm font-black">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-bold text-ink-muted">
                السؤال {currentIndex + 1} من {exam.questions.length}
              </span>
            </div>

            {/* Flag toggle */}
            <button
              type="button"
              onClick={() => toggleFlag(currentIndex)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                flaggedQuestions.has(currentIndex)
                  ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                  : 'border-surface-border text-ink-muted hover:border-surface-borderLight'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>{flaggedQuestions.has(currentIndex) ? 'مُميز للمراجعة' : 'تمييز للمراجعة'}</span>
            </button>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold leading-relaxed text-ink">
              {currentQuestion.text}
            </h2>

            {/* Optional Image */}
            {currentQuestion.imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-surface-border max-w-lg mx-auto">
                <img
                  src={currentQuestion.imageUrl}
                  alt={`توضيح السؤال ${currentIndex + 1}`}
                  className="w-full object-contain max-h-80 bg-surface-alt"
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === optIdx;

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-right transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-ink shadow-sm'
                      : 'border-surface-border bg-surface hover:border-primary/40 text-ink-muted hover:text-ink'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-black transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-surface-border text-ink-muted'
                    }`}
                  >
                    {letter(optIdx)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium leading-relaxed">
                    {optionText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-border">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowRight className="h-4 w-4" />}
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              السابق
            </Button>

            <span className="text-xs text-ink-muted tabular-nums">
              {selectedAnswers[currentQuestion.id] !== undefined &&
              selectedAnswers[currentQuestion.id] !== null
                ? 'تم حفظ الإجابة'
                : 'لم يتم الإجابة بعد'}
            </span>

            {currentIndex < exam.questions.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
              >
                التالي
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send className="h-3.5 w-3.5" />}
                onClick={() => setShowSubmitConfirm(true)}
              >
                مراجعة وتسليم
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="تأكيد تسليم الامتحان التدريبي"
      >
        <div className="space-y-4 text-right">
          <p className="text-sm text-ink-muted leading-relaxed">
            أنت على وشك تسليم الامتحان التدريبي وتصحيح إجاباتك.
          </p>

          <div className="rounded-2xl border border-surface-border bg-surface-alt p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">إجمالي الأسئلة:</span>
              <span className="font-bold text-ink">{exam.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">الأسئلة المُجابة:</span>
              <span className="font-bold text-emerald-400">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">الأسئلة غير المُجابة:</span>
              <span className="font-bold text-red-400">
                {exam.questions.length - answeredCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">المُميزة للمراجعة:</span>
              <span className="font-bold text-amber-400">{flaggedQuestions.size}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowSubmitConfirm(false)}>
              متابعة الحل
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSubmit(false)}
            >
              تسليم نهائي
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="الخروج من الامتحان التدريبي"
      >
        <div className="space-y-4 text-right">
          <p className="text-sm text-ink-muted leading-relaxed">
            هل تريد مغادرة الامتحان التدريبي الآن؟ لن يتم حفظ تقدمك في هذه الجلسة التدريبية.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowExitConfirm(false)}>
              البقاء وإكمال الحل
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => navigate('/mistakes')}
            >
              خروج
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MistakePracticeExamPage;
