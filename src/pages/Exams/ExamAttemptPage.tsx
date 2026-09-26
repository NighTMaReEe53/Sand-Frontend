import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  HelpCircle,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { examsApi } from '../../api/exams.api';
import { SingleQuestionAttempt } from '../../types/exam.types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ExamSessionMonitor } from '../../components/exams/ExamSessionMonitor';
import { useMyAttemptsQuery } from '../../hooks/queries/useExams';

export const ExamAttemptPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // If the student has already submitted (or timed out) this exam, they may not
  // take it again — send them straight to their result instead of the start.
  const { data: myAttempts } = useMyAttemptsQuery(examId);
  useEffect(() => {
    const done = myAttempts?.attempts?.find(
      (a) => a.status === 'SUBMITTED' || a.status === 'TIMED_OUT',
    );
    if (done) {
      navigate(`/exams/attempts/${done.id}/result`, { replace: true });
    }
  }, [myAttempts, navigate]);

  /** Refresh navbar «أخطائي» + results links right after the attempt is graded */
  const invalidateAfterFinish = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-mistakes'] });
    queryClient.invalidateQueries({ queryKey: ['my-results'] });
    // Pull the EXAM_RESULT notification instantly instead of waiting for the bell poll
    queryClient.invalidateQueries({ queryKey: ['notifications-feed-live'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
  }, [queryClient]);

  // Attempt & Question State
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<SingleQuestionAttempt | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answersCache, setAnswersCache] = useState<Record<number, number | null>>({});

  // UI Flow State
  const [isStartModalOpen, setIsStartModalOpen] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFetchingQuestion, setIsFetchingQuestion] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeftSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Exam Handler
  const handleStartExam = async () => {
    if (!examId) return;
    setErrorMsg(null);
    setIsStarting(true);

    try {
      const res = await examsApi.startExam(examId);
      setAttemptId(res.attempt.id);
      setCurrentIndex(res.attempt.currentIndex || 0);
      setTotalQuestions(res.attempt.totalQuestions || res.questions?.length || 1);
      setTimeLeftSeconds(res.attempt.timeRemainingSeconds ?? res.attempt.durationMinutes * 60);

      if (res.currentQuestion) {
        setCurrentQuestion(res.currentQuestion);
        const opt = res.currentQuestion.selectedOptionIndex ?? null;
        setSelectedOption(opt);
        if (opt !== null) {
          setAnswersCache({ [res.attempt.currentIndex || 0]: opt });
        }
      } else if (res.questions && res.questions.length > 0) {
        const q0 = res.questions[0];
        setCurrentQuestion({
          id: q0.id,
          text: q0.text,
          imageUrl: q0.imageUrl,
          options: q0.options,
          marks: q0.marks,
          selectedOptionIndex: null,
        });
      }

      setIsStartModalOpen(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'لا يمكنك بدء الامتحان (ربما استنفدت عدد المحاولات أو لست مشتركاً في الكورس)';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsStarting(false);
    }
  };

  // Fetch question by index
  const loadQuestionAtIndex = useCallback(async (attId: string, idx: number) => {
    setIsFetchingQuestion(true);
    try {
      const res = await examsApi.getQuestion(attId, idx);
      setCurrentIndex(res.currentIndex);
      setTotalQuestions(res.totalQuestions);
      setCurrentQuestion(res.question);
      const qOpt = res.question.selectedOptionIndex ?? answersCache[idx] ?? null;
      setSelectedOption(qOpt);
      if (res.question.selectedOptionIndex !== null && res.question.selectedOptionIndex !== undefined) {
        const sel = res.question.selectedOptionIndex;
        setAnswersCache((prev) => ({ ...prev, [res.currentIndex]: sel }));
      }
      if (res.timeRemainingSeconds !== undefined) {
        setTimeLeftSeconds(res.timeRemainingSeconds);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء تحميل السؤال.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsFetchingQuestion(false);
    }
  }, [answersCache]);

  // Save only an actual answer. An unanswered question can be revisited or
  // skipped; sending -1 violated the DTO and caused the save-error toast.
  const handleSaveAndMove = async (targetIndex: number, finish = false) => {
    if (!attemptId || !currentQuestion) return;

    setIsSubmittingAnswer(true);
    try {
      if (selectedOption === null && finish) {
        setErrorMsg('اختر إجابة للسؤال الحالي قبل تسليم الامتحان، أو انتقل لسؤال آخر لمراجعته.');
        return;
      }

      if (selectedOption === null) {
        await loadQuestionAtIndex(attemptId, targetIndex);
        return;
      }

      setAnswersCache((prev) => ({ ...prev, [currentIndex]: selectedOption }));
      const res = await examsApi.answerQuestion(attemptId, {
        questionId: currentQuestion.id,
        selectedOptionIndex: selectedOption,
        finish,
      });

      if (res.isFinished || finish) {
        invalidateAfterFinish();
        navigate(`/exams/attempts/${attemptId}/result`, { replace: true });
        return;
      }

      // Load next question
      await loadQuestionAtIndex(attemptId, targetIndex);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ أثناء حفظ الإجابة.';
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleQuestionJump = (targetIndex: number) => {
    if (targetIndex === currentIndex || isSubmittingAnswer) return;
    void handleSaveAndMove(targetIndex);
  };

  const handleTimeExpired = async () => {
    if (!attemptId || !currentQuestion) return;
    try {
      if (selectedOption !== null) {
        await examsApi.answerQuestion(attemptId, {
          questionId: currentQuestion.id,
          selectedOptionIndex: selectedOption,
          finish: true,
        });
      }
    } catch (e) {
      // Ignore
    }
    invalidateAfterFinish();
    navigate(`/exams/attempts/${attemptId}/result`, { replace: true });
  };

  const isLastQuestion = currentIndex >= totalQuestions - 1;

  return (
    <div className="min-h-screen bg-surface-dark py-8 px-4 sm:px-6 lg:px-8 text-right font-sans">
      <ExamSessionMonitor attemptId={attemptId} />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ─── Top Bar: Progress & Timer ─────────────────────────────── */}
        <div className="p-4 sm:p-6 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm sm:text-base ${
                (timeLeftSeconds || 0) < 300
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                  : 'bg-gold-500/10 border-gold-500/30 text-gold-400'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeLeftSeconds !== null ? formatTime(timeLeftSeconds) : '--:--'}</span>
            </div>
            <span className="text-xs text-ivory-muted hidden sm:inline">الوقت المتبقي</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gold-300">
              السؤال {currentIndex + 1} من {totalQuestions || 1}
            </span>
            <Badge variant="outline" size="sm">
              {currentQuestion?.marks || 1} درجات
            </Badge>
          </div>
        </div>

        {/* ─── Progress Bar ────────────────────────────────────────── */}
        <div className="w-full bg-surface-border h-2 rounded-full overflow-hidden">
          <div
            className="bg-gold-500 h-full transition-all duration-300"
            style={{
              width: `${totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0}%`,
            }}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-start">
        {/* ─── Question Card ────────────────────────────────────────── */}
        {currentQuestion && (
          <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border shadow-2xl space-y-6 relative overflow-hidden">
            {isFetchingQuestion && (
              <div className="absolute inset-0 bg-surface-dark/60 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
              </div>
            )}

            {/* Question Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ivory-muted">
                <span className="flex items-center gap-1 font-bold text-gold-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  اختر الإجابة الصحيحة:
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-amiri text-ivory leading-relaxed">
                {currentQuestion.text}
              </h2>

              {currentQuestion.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden border border-surface-border max-h-72 flex justify-center bg-black/40">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="صورة السؤال"
                    className="max-h-72 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Options List */}
            {timeLeftSeconds !== null && timeLeftSeconds <= 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-bold flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>انتهى الوقت المحدد! جاري تسليم الامتحان تلقائياً...</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((opt, idx) => {
                const isLocked = isSubmittingAnswer || isFetchingQuestion || (timeLeftSeconds !== null && timeLeftSeconds <= 0);
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (isLocked) return;
                      setSelectedOption(idx);
                    }}
                    className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-4 text-sm sm:text-base ${
                      isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                    } ${
                      isSelected
                        ? 'bg-gold-500/15 border-gold-500 text-gold-200 shadow-gold-glow'
                        : 'bg-surface/60 border-surface-border text-ivory-muted hover:border-surface-border-light hover:text-ivory'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                          isSelected
                            ? 'bg-gold-500 text-surface-dark font-bold'
                            : 'bg-surface-border text-ivory-muted'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="leading-relaxed font-sans">{opt}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-gold-500 bg-gold-500/20'
                          : 'border-surface-border'
                      }`}
                    >
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="pt-6 border-t border-surface-border flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveAndMove(currentIndex - 1)}
                disabled={currentIndex === 0 || isSubmittingAnswer}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                السابق
              </Button>

              {isLastQuestion ? (
                <Button
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(true)}
                  disabled={isSubmittingAnswer}
                  leftIcon={<Send className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  تسليم الامتحان
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleSaveAndMove(currentIndex + 1)}
                  disabled={isSubmittingAnswer}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  التالي
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Compact answer navigator: desktop sidebar, mobile grid below. */}
        <aside className="rounded-2xl border border-surface-border bg-surface-card p-4 lg:sticky lg:top-24">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-black text-ivory">خريطة الأسئلة</span>
            <span className="text-[10px] text-ivory-muted">{Object.keys(answersCache).length}/{totalQuestions || 0}</span>
          </div>
          <div className="grid grid-cols-6 gap-2 lg:grid-cols-4">
            {Array.from({ length: totalQuestions }, (_, index) => {
              const answered = answersCache[index] !== undefined || (index === currentIndex && selectedOption !== null);
              const active = index === currentIndex;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuestionJump(index)}
                  disabled={isSubmittingAnswer || isFetchingQuestion}
                  aria-label={`السؤال ${index + 1}${answered ? ' تمت إجابته' : ''}`}
                  className={`relative flex h-9 items-center justify-center rounded-lg border text-xs font-black transition-colors ${
                    active
                      ? 'border-gold-400 bg-gold-500/15 text-gold-300 ring-1 ring-gold-400/40'
                      : answered
                        ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300'
                        : 'border-surface-border bg-surface text-ivory-muted hover:border-gold-500/50'
                  }`}
                >
                  {answered ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-ivory-muted">الأخضر: تمت الإجابة · الذهبي: السؤال الحالي</p>
        </aside>
        </div>
      </div>

      {/* ─── Start Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => navigate(-1)}
        title="تعليمات الامتحان"
      >
        <div className="space-y-4 text-right">
          <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-2 text-xs text-ivory-muted leading-relaxed">
            <p className="font-bold text-gold-300">تنبيهات هامة قبل البدء:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>الامتحان يتم بنظام السؤال تلو الآخر.</li>
              <li>الترتيب عشوائي ومثبت لمحاولتك ولا يتغير عند التحديث.</li>
              <li>يتم حفظ إجابة كل سؤال فور الانتقال للسؤال التالي.</li>
              <li>ينتهي الامتحان تلقائياً عند انتهاء عداد الوقت.</li>
            </ul>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
            <Button
              onClick={handleStartExam}
              disabled={isStarting}
              leftIcon={isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
            >
              {isStarting ? 'جاري التحضير...' : 'ابدأ الامتحان الآن'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Submit Confirmation Modal ────────────────────────────── */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="تأكيد تسليم الامتحان"
      >
        <div className="space-y-4 text-right">
          <p className="text-sm text-ivory-muted">
            هل أنت متأكد من رغبتك في إنهاء الامتحان وتسليم جميع الإجابات؟
          </p>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>
              متابعة الإجابة
            </Button>
            <Button
              onClick={() => handleSaveAndMove(currentIndex, true)}
              disabled={isSubmittingAnswer}
              leftIcon={<Send className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSubmittingAnswer ? 'جاري التسليم...' : 'نعم، تسليم الآن'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
