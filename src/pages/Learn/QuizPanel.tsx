import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer,
  RotateCcw,
  Lightbulb,
  Info,
} from 'lucide-react';
import { quizzesApi } from '../../api/quizzes.api';
import {
  LessonQuizInfo,
  StartQuizResponse,
  SubmitQuizResult,
} from '../../types/quiz.types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type Phase = 'idle' | 'loading' | 'taking' | 'submitting' | 'result' | 'error';

interface QuizPanelProps {
  lessonId: string;
  /** يبدأ الحل تلقائياً عند فتح الصفحة المخصّصة */
  autoStart?: boolean;
  /** عند التوجيه لصفحة مخصّصة: زر "بدء الحل" ينتقل لصفحة الحل */
  onSolve?: () => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({ lessonId, autoStart, onSolve }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [info, setInfo] = useState<LessonQuizInfo | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreStartModal, setShowPreStartModal] = useState(false);

  const [attemptData, setAttemptData] = useState<StartQuizResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<SubmitQuizResult | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  // A submitted quiz is always viewed on its dedicated result page.
  useEffect(() => {
    if (info?.action === 'view_result' && info.attempt?.id) {
      navigate(`/quizzes/attempts/${info.attempt.id}/result`, { replace: true });
    }
  }, [info?.action, info?.attempt?.id, navigate]);

  // When result is fetched, switch to result phase
  useEffect(() => {
    if (result && phase !== 'result') {
      setPhase('result');
    }
  }, [result, phase]);

  const loadInfo = useCallback(async () => {
    setPhase('loading');
    try {
      const data = await quizzesApi.getLessonQuiz(lessonId);
      setInfo(data);
      setPhase('idle');
    } catch {
      setPhase('error');
      setErrorMsg('تعذر تحميل الكويز.');
    }
  }, [lessonId]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  // Countdown timer (driven by server-provided expiry)
  useEffect(() => {
    if (phase !== 'taking' || timeRemaining === null) return;
    if (timeRemaining <= 0) return;

    const t = setTimeout(() => setTimeRemaining((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [phase, timeRemaining]);

  const submit = useCallback(
    async (data: StartQuizResponse, currentAnswers: Record<string, number>) => {
      setPhase('submitting');
      try {
        if (!data.attempt) throw new Error('Missing quiz attempt');
        const payload = (data.questions ?? []).map((q) => ({
          questionId: q.id,
          selectedOptionIndex: currentAnswers[q.id] ?? 0,
        }));
        const res = await quizzesApi.submitAttempt(data.attempt.id, payload);
        setResult(res);
        navigate(`/quizzes/attempts/${res.attemptId ?? data.attempt.id}/result`);
        queryClient.invalidateQueries({ queryKey: ['my-mistakes'] });
        queryClient.invalidateQueries({ queryKey: ['my-results'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-feed-live'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
        queryClient.invalidateQueries({ queryKey: ['course-progress'] });
        loadInfo();
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'تعذر تسليم الكويز.';
        setErrorMsg(msg);
        setPhase('error');
      }
    },
    [loadInfo, navigate, queryClient]
  );

  // Auto-submit when timer hits zero
  useEffect(() => {
    if (phase === 'taking' && timeRemaining === 0 && attemptData) {
      submit(attemptData, answers);
    }
  }, [timeRemaining, phase, attemptData, answers, submit]);

  const startOrResume = async () => {
    if (!info?.quiz?.id) return;
    setPhase('loading');
    try {
      const data = await quizzesApi.startAttempt(info.quiz.id);

      // If already submitted, open the dedicated result page.
      if (data.action === 'view_result') {
        if (data.attemptId) {
          navigate(`/quizzes/attempts/${data.attemptId}/result`);
        } else {
          setPhase('idle');
        }
        return;
      }

      setAttemptData(data);
      setAnswers({});
      setCurrentQIndex(0);
      setTimeRemaining(data.attempt?.timeRemainingSeconds ?? null);
      setShowPreStartModal(false);
      setPhase('taking');
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'تعذر بدء الكويز.';
      setErrorMsg(msg);
      setPhase('error');
    }
  };

  // فتح صفحة الحل المخصّصة: يبدأ الحل تلقائياً
  useEffect(() => {
    if (
      autoStart &&
      phase === 'idle' &&
      info?.hasQuiz &&
      info.action !== 'view_result'
    ) {
      startOrResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, phase, info]);

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const bestScore = useMemo(() => {
    const attempt = info?.attempt;
    if (!attempt || attempt.status !== 'SUBMITTED' || attempt.score === null) return null;
    return attempt.score;
  }, [info]);

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 p-6 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
        <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
        جاري تحميل الكويز...
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto" />
        <p className="text-sm text-red-400">{errorMsg}</p>
        <Button size="sm" variant="outline" onClick={loadInfo}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (!info?.hasQuiz) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
        <ClipboardList className="w-4 h-4 text-gold-400/50" />
        لا يوجد كويز على هذا الدرس.
      </div>
    );
  }

  const quiz = info.quiz!;

  if (quiz.questionCount === 0) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
        <ClipboardList className="w-4 h-4 text-gold-400/50" />
        الكويز موجود لكن لا توجد أسئلة بعد — يرجى إبلاغ المدرس.
      </div>
    );
  }

  // ─── Pre-start Modal ──────────────────────────────────────────────
  if (showPreStartModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-surface-card border border-surface-border shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-b from-gold-500/10 to-transparent border-b border-surface-border">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/30">
                <Info className="w-6 h-6 text-gold-400" />
              </span>
              <h3 className="text-lg font-bold text-ivory">معلومات الكويز</h3>
            </div>
            <h4 className="text-xl font-bold text-gold-300 font-amiri">{quiz.title}</h4>
          </div>

          {/* Info grid */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-surface border border-surface-border">
                <p className="text-[10px] text-ivory-muted mb-1">عدد الأسئلة</p>
                <p className="text-lg font-bold text-ivory">{quiz.questionCount} سؤال</p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-surface-border">
                <p className="text-[10px] text-ivory-muted mb-1">المدة</p>
                <p className="text-lg font-bold text-ivory">
                  {quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} دقيقة` : 'بلا حد'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-surface-border">
                <p className="text-[10px] text-ivory-muted mb-1">النجاح عند</p>
                <p className="text-lg font-bold text-ivory">50%</p>
              </div>
            </div>

            {info?.action === 'resume' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-300 font-bold">
                  لديك محاولة نشطة — سيتم استكمالها من حيث توقفت.
                </p>
              </div>
            )}

            {bestScore !== null && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-xs text-emerald-300 font-bold">
                  نتيجتك: {bestScore}%
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex items-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowPreStartModal(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              size="lg"
              onClick={startOrResume}
              className="flex-1 bg-primary hover:brightness-110 text-white font-bold"
            >
              {info?.action === 'resume' ? 'استكمال المحاولة' : 'ابدأ الكويز'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Taking phase ──────────────────────────────────────────────
  if (phase === 'taking' || phase === 'submitting') {
    const questions = attemptData?.questions ?? [];
    const q = questions[currentQIndex];
    const answeredCount = Object.keys(answers).length;
    const progressPct = questions.length
      ? Math.round((answeredCount / questions.length) * 100)
      : 0;

    return (
      <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
        {/* Header with timer */}
        <div className="flex items-center justify-between p-4 bg-surface border-b border-surface-border">
          <span className="text-xs font-bold text-gold-300">{attemptData?.quizTitle}</span>
          {timeRemaining !== null && (
            <Badge variant={timeRemaining < 60 ? 'danger' : timeRemaining < 300 ? 'warning' : 'neutral'}>
              <Timer className="w-3 h-3 ml-1" />
              <span dir="ltr">{formatTime(Math.max(0, timeRemaining))}</span>
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* ── Side Navigator ── */}
          <aside className="order-2 lg:order-1 p-5 bg-surface/40 lg:border-l lg:border-surface-border">
            <p className="text-sm font-bold text-ivory-muted mb-4">أرقام الأسئلة</p>
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2.5">
              {questions.map((qq, qi) => {
                const answered = answers[qq.id] !== undefined;
                const isCurrent = qi === currentQIndex;
                return (
                  <button
                    key={qq.id}
                    type="button"
                    onClick={() => setCurrentQIndex(qi)}
                    title={`سؤال ${qi + 1}${answered ? ' — تمت الإجابة' : ''}`}
                    className={`relative aspect-square rounded-xl text-sm font-black flex items-center justify-center border transition-all duration-200 ${
                      isCurrent
                        ? 'bg-gold-500 text-bg-base border-gold-400 shadow-md scale-105'
                        : answered
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:border-emerald-500/60'
                        : 'bg-surface text-ivory-muted border-surface-border hover:border-gold-500/40'
                    }`}
                  >
                    {isCurrent ? (
                      qi + 1
                    ) : answered ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      qi + 1
                    )}
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
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
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ivory-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-gold-500" />
                  الحالي
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/30 border border-emerald-500/40" />
                  تمت الإجابة
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-surface border border-surface-border" />
                  بلا إجابة
                </span>
              </div>
            </div>
          </aside>

          {/* ── Question Area ── */}
          <section className="order-1 lg:order-2 p-6 min-w-0">
            {q && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-300 text-base font-black flex items-center justify-center">
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

                {timeRemaining !== null && timeRemaining <= 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
                    <Timer className="w-4 h-4 animate-spin" />
                    <span>انتهى الوقت المحدد! جاري تسليم إجاباتك تلقائياً...</span>
                  </div>
                )}

                <div className="space-y-3">
                  {q.options.map((opt, idx) => {
                    const isLocked = phase === 'submitting' || (timeRemaining !== null && timeRemaining <= 0);
                    const isSelected = answers[q.id] === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          if (isLocked) return;
                          setAnswers((prev) => ({ ...prev, [q.id]: idx }));
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-right text-base transition-all ${
                          isLocked ? 'cursor-not-allowed opacity-75' : ''
                        } ${
                          isSelected
                            ? 'border-gold-400 bg-gold-500/10 text-gold-300'
                            : 'border-surface-border bg-surface hover:border-gold-500/40 text-ivory'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm shrink-0 ${
                            isSelected
                              ? 'border-primary bg-primary text-white font-bold'
                              : 'border-surface-border'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer with navigation */}
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
              <Button
                size="md"
                onClick={() => setCurrentQIndex((i) => i + 1)}
              >
                التالي
              </Button>
            ) : (
              <Button
                size="md"
                onClick={() => attemptData && submit(attemptData, answers)}
                isLoading={phase === 'submitting'}
                disabled={answeredCount === 0}
              >
                تسليم الكويز
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Result phase ──────────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
        <div
          className={`p-6 flex items-center gap-5 border-b border-surface-border ${
            result.isPassed ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}
        >
          {result.isPassed ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          ) : (
            <XCircle className="w-10 h-10 text-red-400" />
          )}
          <div className="space-y-1">
            <p className={`text-2xl font-bold font-amiri ${result.isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.score}%
            </p>
            <p className="text-base text-ivory-muted">
              {result.earnedMarks}/{result.totalMarks} درجة • النجاح عند {result.passingPercentage}%
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-96 overflow-y-auto custom-scrollbar">
          {result.modelAnswers.map((a, i) => (
            <div key={a.questionId} className="space-y-2 pb-4 border-b border-surface-border last:border-0">
              <p className="text-base font-bold text-ivory flex items-start gap-2">
                {a.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                سؤال {i + 1}: {a.text}
              </p>
              <p className="text-sm pr-7">
                <span className={a.isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                  إجابتك: {a.yourAnswer !== null ? a.options[a.yourAnswer] : 'لم تُجب'}
                </span>
                {!a.isCorrect && (
                  <span className="text-gold-300">
                    {' '}
                    • الصحيحة: {a.options[a.correctOptionIndex]}
                  </span>
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

        <div className="p-5 bg-surface border-t border-surface-border flex items-center justify-between gap-3 flex-wrap">
          <Button size="md" variant="outline" onClick={() => setPhase('idle')}>
            إغلاق النتيجة
          </Button>
        </div>
      </div>
    );
  }

  // ─── Idle: show quiz info & start button ──────────────────────
  if (info.action === 'view_result') {
    if (resultLoading) {
      return (
        <div className="flex items-center justify-center gap-2 p-6 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
          <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
          جاري تحميل النتيجة...
        </div>
      );
    }
    if (resultError) {
      return (
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3 text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{resultError}</p>
          <Button size="sm" variant="outline" onClick={() => { setResultError(null); setResultLoading(false); }}>
            إعادة المحاولة
          </Button>
        </div>
      );
    }
    if (result) {
      return null;
    }
  }

  const handleViewResult = () => {
    if (onSolve) {
      onSolve();
    } else if (info.attempt?.id) {
      setResultLoading(true);
      setResultError(null);
      quizzesApi
        .getResult(info.attempt.id)
        .then((data) => {
          setResult(data as unknown as SubmitQuizResult);
        })
        .catch(() => {
          setResultError('تعذر تحميل النتيجة. حاول مرة أخرى.');
        })
        .finally(() => {
          setResultLoading(false);
        });
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-surface-card border border-surface-border space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <h3 className="text-xl font-bold text-ivory flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-gold-400" />
            {quiz.title}
          </h3>
          <p className="text-base text-ivory-muted">
            {quiz.questionCount} سؤال
            {quiz.timeLimitMinutes ? ` • ${quiz.timeLimitMinutes} دقيقة` : ''}
            {bestScore !== null && ` • نتيجتك: ${bestScore}%`}
          </p>
        </div>
        {bestScore !== null && (
          <Badge variant={bestScore >= 50 ? 'success' : 'warning'}>
            {bestScore}%
          </Badge>
        )}
      </div>

      {/* ── Cooldown Wait Banner ── */}
      {info.action === 'cooldown_wait' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
              <Timer className="w-6 h-6 animate-pulse" />
            </span>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-amber-300">فترة الانتظار بين المحاولات (24 ساعة)</h4>
              <p className="text-xs text-ivory-muted leading-relaxed">
                لم تحقق نسبة النجاح المطلوبة (50%). لإتقان المادة، يُرجى مراجعة شرح الدرس أولاً، وسيتم فتح المحاولة التالية تلقائياً بعد انتهاء الوقت.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface/60 border border-surface-border">
            <div className="text-center sm:text-right">
              <p className="text-xs text-ivory-muted mb-1">الوقت المتبقي حتى فتح المحاولة رقم {Math.min(3, (info.attemptNumber ?? 1) + 1)}</p>
              <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-amber-300" dir="ltr">
                {(() => {
                  const s = info.cooldownRemainingSeconds ?? 0;
                  const h = Math.floor(s / 3600);
                  const m = Math.floor((s % 3600) / 60);
                  const sec = s % 60;
                  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                })()}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleViewResult}
              className="text-xs"
            >
              مراجعة إجابات المحاولة السابقة
            </Button>
          </div>
        </div>
      )}

      {/* ── Locked Exhausted Banner ── */}
      {info.action === 'locked_exhausted' && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/30 space-y-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-red-500/20 text-red-300">
              <XCircle className="w-6 h-6" />
            </span>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-red-300">تم استنفاد جميع المحاولات (3 محاولات)</h4>
              <p className="text-xs text-ivory-muted leading-relaxed">
                لقد استنفدت الحد الأقصى للمحاولات المتاحة ولم تحقق نسبة النجاح (50%). تظل المحاضرة التالية مغلقة حتى يقوم معلم المادة بتنشيط المحاولة لك.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewResult}
              className="text-xs"
            >
              عرض النتيجة والإجابات
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {info.action === 'resume' ? (
          <Button
            size="lg"
            onClick={() => {
              if (onSolve) {
                onSolve();
              } else {
                setShowPreStartModal(true);
              }
            }}
            className="shadow-sm font-bold"
            leftIcon={<RotateCcw className="w-5 h-5" />}
          >
            استكمال المحاولة الحالية
          </Button>
        ) : info.action === 'start' ? (
          <Button
            size="lg"
            onClick={() => {
              if (onSolve) {
                onSolve();
              } else {
                setShowPreStartModal(true);
              }
            }}
            className="shadow-sm font-bold"
          >
            {info.attemptNumber && info.attemptNumber > 0
              ? `بدء المحاولة رقم ${info.attemptNumber + 1}`
              : 'ابدأ الكويز'}
          </Button>
        ) : info.action === 'view_result' ? (
          <Button
            size="lg"
            onClick={handleViewResult}
            isLoading={resultLoading}
            className="shadow-sm font-bold"
          >
            عرض النتيجة
          </Button>
        ) : null}
      </div>
    </div>
  );
};

// ─── Teacher/Admin preview — read-only list of quizzes on the lesson ────────

export const QuizPanelTeacherPreview: React.FC<QuizPanelProps> = ({ lessonId }) => {
  const [quizzes, setQuizzes] = useState<
    Awaited<ReturnType<typeof quizzesApi.getTeacherLessonQuizzes>>['quizzes'] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await quizzesApi.getTeacherLessonQuizzes(lessonId);
      setQuizzes(data.quizzes);
    } catch {
      setError('تعذر تحميل كويزات الدرس.');
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

  if (!quizzes) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
        <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
        جاري تحميل الكويز...
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-surface-card border border-surface-border text-xs text-ivory-muted">
        <ClipboardList className="w-4 h-4 text-gold-400/50" />
        لا يوجد كويز على هذا الدرس.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold text-ivory truncate flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gold-400 shrink-0" />
              {quiz.title}
            </p>
            <p className="text-[11px] text-ivory-muted mt-1">
              {quiz.questions.length} سؤال
              {quiz.timeLimitMinutes ? ` • ${quiz.timeLimitMinutes} دقيقة` : ''}
              {` • ${quiz.maxAttempts} محاولات`}
            </p>
          </div>
          <Badge variant={quiz.isPublished ? 'success' : 'warning'}>
            {quiz.isPublished ? 'منشور' : 'مسودة'}
          </Badge>
        </div>
      ))}
    </div>
  );
};
