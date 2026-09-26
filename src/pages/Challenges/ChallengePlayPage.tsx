import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Swords,
  Hourglass,
  Trophy,
  Flag,
  ArrowRight,
  Sparkles,
  HelpCircle,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  User,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { toastApiError, toastInfo, toastSuccess } from '../../lib/toastHelpers';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton, SkeletonChallengeResult } from '../../components/ui/Skeleton';
import {
  useAcceptChallengeMutation,
  useChallengeDetailQuery,
  useChallengeResultQuery,
  useFinishChallengeMutation,
  useMyChallengesQuery,
  useRejectChallengeMutation,
  useStartChallengeMutation,
  useSubmitChallengeAnswerMutation,
} from '../../hooks/queries/useChallenges';
import { ChallengeQuestion, ChallengeQuestionReview } from '../../types/challenge.types';
import {
  BookStackSvg,
  BotBuddySvg,
  CapDoodleSvg,
  ComebackSvg,
  ConfettiBurstSvg,
  CorrectCheckSvg,
  CrownSvg,
  CurvedArrowSvg,
  DrawScaleSvg,
  DotsPatternSvg,
  Float,
  PencilSvg,
  StudentAvatarSvg,
  VictoryTrophySvg,
  VsBoltSvg,
  SpotlightBeamsSvg,
  WrongCrossSvg,
} from '../../components/ui/Doodles';

const formatClock = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const ChallengePlayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: detail, isLoading } = useChallengeDetailQuery(id);
  const { data: challengesList } = useMyChallengesQuery();
  const challengeMeta = useMemo(
    () => challengesList?.find((c) => c.id === id),
    [challengesList, id]
  );

  const { mutate: accept, isPending: isAccepting } = useAcceptChallengeMutation();
  const { mutate: rejectChallenge, isPending: isRejecting } = useRejectChallengeMutation();
  const { mutate: start, isPending: isStarting } = useStartChallengeMutation();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <StatusScreen
        icon={<XCircle className="w-10 h-10" />}
        title="التحدي غير موجود"
        subtitle="ربما تم حذفه أو أن الرابط غير صحيح."
      >
        <Link to="/challenges"><Button variant="outline">عودة للتحديات</Button></Link>
      </StatusScreen>
    );
  }

  // ─── PENDING ────────────────────────────────────────────────
  if (detail.status === 'PENDING') {
    const iAmChallenger = challengeMeta ? challengeMeta.iAmChallenger : true;
    if (iAmChallenger) {
      return (
        <StatusScreen
          icon={<Hourglass className="w-10 h-10 animate-pulse text-gold-400" />}
          title="بانتظار موافقة خصمك…"
          subtitle={`أرسلت تحدياً بـ ${challengeMeta?.questionCount ?? detail.questions.length} أسئلة — سنخبرك فور الرد.`}
        >
          <Link to="/challenges"><Button variant="outline">كل التحديات</Button></Link>
        </StatusScreen>
      );
    }
    return (
      <StatusScreen
        icon={<Swords className="w-10 h-10 text-gold-400" />}
        title="تحدٍ جديد!"
        subtitle={`${challengeMeta?.challenger ?? 'زميلك'} يتحداك في كورس «${challengeMeta?.courseTitle ?? ''}» على ${challengeMeta?.questionCount ?? ''} أسئلة. هل تقبل؟`}
      >
        <div className="flex items-center gap-3">
          <Button
            isLoading={isAccepting}
            onClick={() =>
              accept(id!, {
                onSuccess: () => toastSuccess('تم قبول التحدي — اضغط ابدأ عند الاستعداد!'),
                onError: (err: any) => toastApiError(err, 'تعذر قبول التحدي'),
              })
            }
          >
            أقبل التحدي
          </Button>
          <Button
            variant="danger"
            isLoading={isRejecting}
            onClick={() =>
              rejectChallenge(id!, {
                onSuccess: () => navigate('/challenges'),
                onError: (err: any) => toastApiError(err, 'تعذر رفض التحدي'),
              })
            }
          >
            رفض
          </Button>
        </div>
      </StatusScreen>
    );
  }

  // ─── READY ──────────────────────────────────────────────────
  if (detail.status === 'READY') {
    return (
      <StatusScreen
        icon={<ZapIcon />}
        title="التحدي جاهز!"
        subtitle="عند الضغط على ابدأ يبدأ التحدي والعد التنازلي فوراً — ركّز وبالتوفيق!"
      >
        <Button
          size="lg"
          isLoading={isStarting}
          onClick={() =>
            start(id!, {
              onError: (err: any) => toastApiError(err, 'تعذر بدء التحدي'),
            })
          }
        >
          ابدأ الآن
        </Button>
      </StatusScreen>
    );
  }

  // ─── Terminal states → result page ─────────────────────────
  if (detail.status === 'COMPLETED' || detail.status === 'REJECTED' || detail.status === 'EXPIRED') {
    return <RedirectToResult id={id} />;
  }

  // ─── IN_PROGRESS ────────────────────────────────────────────
  return (
    <InPlayView
      challengeId={id!}
      questions={detail.questions}
      initialRemaining={detail.remainingSeconds}
    />
  );
};

const ZapIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-gold-400">
    <path d="M13 2 L4.5 13.5 H11 L10 22 L19.5 10 H13 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const StatusScreen: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <div className="max-w-xl mx-auto px-4 py-20">
    <div className="p-10 sm:p-12 rounded-3xl bg-surface-card border border-surface-border text-center space-y-5 relative overflow-hidden shadow-card-dark">
      <svg aria-hidden className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 text-gold-500/10" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
      </svg>
      <div className="relative flex justify-center text-gold-300">{icon}</div>
      <h2 className="relative text-xl sm:text-2xl font-bold font-display text-ivory">{title}</h2>
      {subtitle && <p className="relative text-xs sm:text-sm text-ivory-muted leading-relaxed max-w-md mx-auto">{subtitle}</p>}
      {children && <div className="relative flex justify-center pt-2">{children}</div>}
    </div>
  </div>
);

/** COMPLETED/REJECTED/EXPIRED → straight to the result screen */
const RedirectToResult: React.FC<{ id?: string }> = ({ id }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (id) navigate(`/challenges/${id}/result`, { replace: true });
  }, [id, navigate]);
  return null;
};

/* ═══════════════ IN-PLAY VIEW ═══════════════ */

const InPlayView: React.FC<{
  challengeId: string;
  questions: ChallengeQuestion[];
  initialRemaining: number;
}> = ({ challengeId, questions, initialRemaining }) => {
  const [remaining, setRemaining] = useState(initialRemaining);
  useEffect(() => {
    setRemaining((cur) => Math.max(cur, initialRemaining));
  }, [initialRemaining]);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const answeredCount = questions.filter((q) => q.alreadyAnswered).length;
  const allAnswered = answeredCount === questions.length;

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: submitAnswer, isPending } = useSubmitChallengeAnswerMutation();
  const { mutate: finish, isPending: isFinishing } = useFinishChallengeMutation();

  // عند انتهاء الوقت
  useEffect(() => {
    if (remaining > 0 || !questions.length) return;
    toastInfo('انتهى الوقت! يتم حساب النتيجة…');
    void queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
    void queryClient.invalidateQueries({ queryKey: ['challenge-result', challengeId] });
    const t = setTimeout(() => navigate(`/challenges/${challengeId}/result`, { replace: true }), 1000);
    return () => clearTimeout(t);
  }, [remaining, questions.length, challengeId, queryClient, navigate]);

  const handleFinish = () => {
    finish(challengeId, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
        void queryClient.invalidateQueries({ queryKey: ['challenge-result', challengeId] });
        void queryClient.invalidateQueries({ queryKey: ['challenges'] });
        toastSuccess('تم تسليم إجاباتك — جاري عرض النتيجة!');
        navigate(`/challenges/${challengeId}/result`, { replace: true });
      },
      onError: (err: any) => toastApiError(err, 'تعذر إنهاء التحدي'),
    });
  };

  const handleAnswer = (questionId: string, selectedOption: number) => {
    submitAnswer(
      { id: challengeId, questionId, selectedOption },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
        },
        onError: (err: any) => toastApiError(err, 'تعذر حفظ الإجابة'),
      }
    );
  };

  const timeCritical = remaining <= 30;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-right">
      {/* Sticky timer header */}
      <div className="sticky top-[72px] z-20 flex items-center justify-between gap-3 p-4 rounded-2xl bg-surface-card/95 backdrop-blur-md border border-surface-border shadow-card-dark">
        <div className="flex items-center gap-2 text-xs text-ivory-muted">
          <Badge variant="gold">
            <Swords className="w-3 h-3" />
            تحدي مباشر
          </Badge>
          <span className="font-mono">{answeredCount} / {questions.length} مُجاب</span>
        </div>
        <div className="flex items-center gap-3">
          {!allAnswered && remaining > 0 && (
            <Button
              size="sm"
              variant="outline"
              isLoading={isFinishing}
              onClick={handleFinish}
              leftIcon={<Flag className="w-3.5 h-3.5" />}
            >
              تسليم وإنهاء
            </Button>
          )}
          <span
            dir="ltr"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-lg font-black tabular-nums transition-colors ${
              timeCritical
                ? 'bg-red-500/15 text-red-400 animate-pulse border border-red-500/30'
                : 'bg-gold-500/10 text-gold-300 border border-gold-500/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatClock(Math.max(0, remaining))}
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.questionId}
            index={idx + 1}
            question={q}
            disabled={q.alreadyAnswered || isPending || remaining <= 0}
            onSelect={(opt) => handleAnswer(q.questionId, opt)}
          />
        ))}
      </div>

      {allAnswered && (
        <div className="p-6 rounded-2xl bg-surface-card border border-gold-500/40 text-center space-y-3 shadow-gold-glow">
          <Trophy className="w-9 h-9 mx-auto text-gold-400 animate-bounce" />
          <p className="text-sm font-bold text-ivory">أجبت على كل الأسئلة! اضغط تسليم لعرض النتيجة والحل فوراً.</p>
          <Button
            size="lg"
            isLoading={isFinishing}
            onClick={handleFinish}
            rightIcon={<ArrowRight className="w-4 h-4 rotate-180" />}
          >
            تسليم وعرض النتيجة الآن
          </Button>
        </div>
      )}
    </div>
  );
};

const QuestionCard: React.FC<{
  index: number;
  question: ChallengeQuestion;
  disabled: boolean;
  onSelect: (option: number) => void;
}> = ({ index, question: q, disabled, onSelect }) => {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (q.alreadyAnswered) setSelected(null);
  }, [q.alreadyAnswered]);

  const answered = q.alreadyAnswered || q.wasCorrect !== null;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm sm:text-base font-bold text-ivory leading-relaxed">
          <span className="text-gold-400 font-black me-1.5">{index}.</span>
          {q.text}
        </p>
        {answered && (
          q.wasCorrect ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              صحيحة
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg shrink-0">
              <XCircle className="w-4 h-4" />
              خاطئة
            </span>
          )
        )}
      </div>

      {q.imageUrl && (
        <img src={q.imageUrl} alt="" loading="lazy" className="max-h-56 rounded-xl border border-surface-border object-contain bg-bg" />
      )}

      <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled || answered}
              onClick={() => {
                setSelected(i);
                onSelect(i);
              }}
              className={`rounded-xl border px-4 py-3 text-xs sm:text-sm text-right transition-all flex items-center justify-between gap-2 ${
                answered
                  ? 'border-surface-border bg-surface-subtle text-ivory-muted opacity-70 cursor-default'
                  : isSelected
                  ? 'border-gold-500 bg-gold-500/15 text-gold-200 font-bold shadow-gold-glow'
                  : disabled
                  ? 'border-surface-border bg-surface-subtle text-ivory-muted cursor-not-allowed'
                  : 'border-surface-border bg-surface text-ivory hover:border-gold-500/60 hover:bg-gold-500/5 active:scale-[0.99]'
              }`}
            >
              <span>{opt}</span>
              <span className="w-5 h-5 rounded-full border border-surface-border flex items-center justify-center text-[10px] shrink-0 font-mono">
                {['أ', 'ب', 'ج', 'د', 'هـ'][i] ?? i + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════ ENHANCED RESULT VIEW ═══════════════ */

export const ChallengeResultPage: React.FC = () => {
  return <ResultView />;
};

/** Compact duelist medallion used in the hero face-off scene */
const HeroPlayerMedal: React.FC<{
  name: string;
  score: number;
  isBot: boolean;
  isWinner: boolean;
  photoUrl?: string | null;
}> = ({ name, score, isBot, isWinner, photoUrl }) => (
  <div className="flex flex-col items-center gap-1.5 shrink-0 w-[74px] sm:w-24">
    <div
      className={`relative w-14 h-14 sm:w-[68px] sm:h-[68px] rounded-2xl border flex items-end justify-center overflow-visible ${
        isWinner
          ? 'border-gold-500/60 bg-gold-500/10 shadow-gold-glow'
          : 'border-surface-border bg-surface-card'
      }`}
    >
      {isWinner && (
        <span className="absolute -top-4 z-10 rotate-[-14deg]">
          <CrownSvg className="w-9 h-9 drop-shadow-md" />
        </span>
      )}
      <ResultPlayerAvatar
        name={name}
        photoUrl={photoUrl}
        isBot={isBot}
        className="h-12 w-12 sm:h-14 sm:w-14"
      />
    </div>
    <span className="text-[10px] sm:text-[11px] font-bold text-ivory truncate max-w-full text-center">
      {name}
    </span>
    <span
      dir="ltr"
      className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-mono tabular-nums border ${
        isWinner
          ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
          : 'bg-surface-subtle border-surface-border text-ivory-muted'
      }`}
    >
      {score}
    </span>
  </div>
);

const ResultPlayerAvatar: React.FC<{
  name: string;
  photoUrl?: string | null;
  isBot: boolean;
  className: string;
}> = ({ name, photoUrl, isBot, className }) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [photoUrl]);

  if (isBot) return <BotBuddySvg className={className} />;
  if (photoUrl && !imageFailed) {
    return (
      <img
        src={photoUrl}
        alt={`صورة ${name}`}
        loading="lazy"
        className={`${className} rounded-xl object-cover`}
        onError={() => setImageFailed(true)}
      />
    );
  }
  return <StudentAvatarSvg className={className} />;
};

const ResultView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading } = useChallengeResultQuery(id);
  const { data: challengesList } = useMyChallengesQuery();
  const challengeMeta = useMemo(
    () => challengesList?.find((c) => c.id === id),
    [challengesList, id]
  );
  const vsBot = !!challengeMeta?.vsBot;
  const [filter, setFilter] = useState<'ALL' | 'CORRECT' | 'WRONG'>('ALL');

  if (isLoading) {
    return <SkeletonChallengeResult />;
  }

  if (!result) {
    return (
      <StatusScreen icon={<XCircle className="w-10 h-10" />} title="لم يتم العثور على نتيجة">
        <Link to="/challenges"><Button variant="outline">كل التحديات</Button></Link>
      </StatusScreen>
    );
  }

  if (!result.revealed) {
    return (
      <StatusScreen
        icon={<Hourglass className="w-10 h-10 animate-pulse text-gold-400" />}
        title="بانتظار إعلان النتيجة"
        subtitle={
          result.message ??
          `سيتم كشف النتيجة فور انتهاء الطرفين.${result.remainingSeconds ? ` الوقت المتبقي: ${formatClock(result.remainingSeconds)}.` : ''}`
        }
      >
        <div className="flex items-center gap-3">
          <Button onClick={() => window.location.reload()} variant="outline" leftIcon={<RotateCcw className="w-4 h-4" />}>
            تحديث النتيجة
          </Button>
          <Link to="/challenges"><Button variant="secondary">كل التحديات</Button></Link>
        </div>
      </StatusScreen>
    );
  }

  const outcomeMeta =
    result.outcome === 'WON'
      ? {
          label: 'فوز مستحق وتفوق رائع!',
          subtitle: 'أداء مميز وسرعة عالية، استمر في خوض التحديات وإثبات جدارتك.',
          gradient: 'from-emerald-500/20 via-surface-card to-surface-card',
          borderColor: 'border-emerald-500/40',
          titleGradient: 'from-emerald-800 via-emerald-600 to-emerald-900 dark:from-emerald-100 dark:via-emerald-300 dark:to-emerald-500',
        }
      : result.outcome === 'LOST'
      ? {
          label: 'محاولة جيدة — التحدي القادم لك!',
          subtitle: 'راجع الأسئلة والتفسيرات النموذجية بالأسفل لتصحيح المفاهيم وتجاوز أخطائك.',
          gradient: 'from-red-500/20 via-surface-card to-surface-card',
          borderColor: 'border-red-500/40',
          titleGradient: 'from-rose-800 via-rose-600 to-rose-950 dark:from-red-100 dark:via-red-300 dark:to-red-500',
        }
      : {
          label: 'تعادل حماسي ومستوى متقارب!',
          subtitle: 'أداء متكافئ جداً بين الطرفين — خض جولة أخرى لحسم النتيجة.',
          gradient: 'from-amber-500/20 via-surface-card to-surface-card',
          borderColor: 'border-amber-500/40',
          titleGradient: 'from-amber-800 via-amber-600 to-amber-950 dark:from-amber-100 dark:via-amber-300 dark:to-amber-500',
        };

  const reviews = result.review ?? [];
  const filteredReviews =
    filter === 'ALL'
      ? reviews
      : filter === 'CORRECT'
      ? reviews.filter((r) => r.isCorrect)
      : reviews.filter((r) => !r.isCorrect);

  const correctCount = reviews.filter((r) => r.isCorrect).length;
  const wrongCount = reviews.filter((r) => !r.isCorrect).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-right">
      {/* ─── Hero: Duel Arena ─── */}
      <div
        className={`relative p-6 sm:p-10 pt-8 rounded-[2rem] bg-gradient-to-b ${outcomeMeta.gradient} border ${outcomeMeta.borderColor} text-center space-y-5 overflow-hidden shadow-card-dark`}
      >
        {/* stage spotlights + ambient glows */}
        <SpotlightBeamsSvg aria-hidden className="pointer-events-none absolute -top-6 inset-x-0 w-full h-72 opacity-80" />
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 w-52 h-52 rounded-full bg-gold-500/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-14 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* celebration confetti overlay (win only) */}
        {result.outcome === 'WON' && (
          <ConfettiBurstSvg aria-hidden className="pointer-events-none absolute inset-0 w-full h-full" />
        )}

        {/* floating study doodles */}
        <Float className="-top-4 -right-4 w-20 sm:w-24 opacity-90" duration={6}>
          <BookStackSvg />
        </Float>
        <Float className="-bottom-7 -left-4 w-16 sm:w-20" delay={1.2} duration={5}>
          <PencilSvg />
        </Float>
        <Float className="top-24 left-4 w-14 hidden sm:block" delay={0.5} distance={8}>
          <CurvedArrowSvg />
        </Float>

        {(() => {
          const hasDuel = (result.players?.length ?? 0) >= 2;
          const me = result.players?.[0];
          const opp = result.players?.[1];
          const iWon = result.outcome === 'WON';
          const oppWon = result.outcome === 'LOST';

          const centerpiece = (
            <motion.div
              initial={{ opacity: 0, scale: 0.55, rotate: -7 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 160, damping: 16 }}
              className="relative w-40 sm:w-52 shrink-0 mx-auto"
            >
              <div
                aria-hidden
                className="absolute inset-[-13%] rounded-full border-2 border-dashed border-gold-500/25 animate-spin"
                style={{ animationDuration: '26s' }}
              />
              <div
                aria-hidden
                className="absolute inset-[-26%] rounded-full border border-gold-500/10"
              />
              <div
                aria-hidden
                className="absolute inset-[-3%] rounded-full bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent"
              />
              <Swords
                aria-hidden
                className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 w-24 h-24 text-gold-500/10 rotate-45"
                strokeWidth={1.2}
              />
              <div className="relative drop-shadow-xl">
                {result.outcome === 'WON' ? (
                  <VictoryTrophySvg />
                ) : result.outcome === 'LOST' ? (
                  <ComebackSvg />
                ) : (
                  <DrawScaleSvg />
                )}
              </div>
            </motion.div>
          );

          if (!hasDuel) return centerpiece;

          return (
            <div className="relative flex items-center justify-center gap-2 sm:gap-3">
              {/* you */}
              <HeroPlayerMedal name={me!.fullName} score={me!.score} photoUrl={me!.photoUrl} isBot={false} isWinner={iWon} />
              {/* duel connector */}
              <div className="hidden sm:block relative flex-1 max-w-16 -mt-10">
                <div className="border-t-2 border-dashed border-gold-500/30" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-gold-400/70" />
              </div>
              {/* center stage */}
              {centerpiece}
              {/* duel connector */}
              <div className="hidden sm:block relative flex-1 max-w-16 -mt-10">
                <div className="border-t-2 border-dashed border-gold-500/30" />
                <Swords className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-gold-400/60" />
              </div>
              {/* opponent */}
              <HeroPlayerMedal
                name={opp!.fullName}
                score={opp!.score}
                photoUrl={opp!.photoUrl}
                isBot={vsBot}
                isWinner={oppWon}
              />
            </div>
          );
        })()}

        {/* outcome title — gradient display text */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.15 }}
          className={`relative text-[26px] sm:text-4xl font-black font-display leading-tight bg-gradient-to-b ${outcomeMeta.titleGradient} bg-clip-text text-transparent drop-shadow-sm`}
        >
          {outcomeMeta.label}
        </motion.h1>
        <p className="relative text-xs sm:text-sm text-ivory-muted max-w-md mx-auto leading-relaxed">
          {outcomeMeta.subtitle}
        </p>

        {/* course chip */}
        {challengeMeta?.courseTitle && (
          <div className="relative flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card/70 border border-surface-border text-[11px] text-ivory-muted">
              <BookOpen className="w-3 h-3 text-gold-400" />
              {challengeMeta.courseTitle}
            </span>
          </div>
        )}

        {/* glass stats bar */}
        {(result.players?.length ?? 0) >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
            className="relative mx-auto flex items-center justify-center gap-x-3 gap-y-2 px-4 py-2.5 rounded-2xl bg-bg/50 backdrop-blur-sm border border-surface-border flex-wrap max-w-lg"
          >
            {(() => {
              const me = result.players![0];
              const opp = result.players![1];
              const totalQ = Math.max(1, challengeMeta?.questionCount ?? reviews.length);
              const acc = Math.min(100, Math.round((me.correct / totalQ) * 100));
              return (
                <>
                  <span className="text-[10px] text-ivory-muted">النتيجة</span>
                  <span
                    dir="ltr"
                    className="px-3.5 py-1 rounded-xl bg-gold-500/15 border border-gold-500/35 text-sm font-black font-mono text-amber-800 dark:text-gold-300 tabular-nums"
                  >
                    {me.score} : {opp.score}
                  </span>
                  <span className="text-surface-border/60">•</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                    <CorrectCheckSvg className="w-4 h-4" /> دقة {acc}%
                  </span>
                  <span className="text-surface-border/60">•</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-ivory-muted">
                    <Swords className="w-3.5 h-3.5 text-gold-400" /> {totalQ} أسئلة
                  </span>
                  {me.timeTakenSeconds != null && (
                    <>
                      <span className="text-surface-border/60 hidden sm:inline">•</span>
                      <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-ivory-muted" dir="ltr">
                        <Clock className="w-3.5 h-3.5 text-gold-400" />
                        {formatClock(me.timeTakenSeconds)}
                      </span>
                    </>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}
      </div>

      {/* Head to Head Comparison */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-ivory flex items-center gap-2">
          <Swords className="w-4 h-4 text-gold-400" />
          مقارنة النتائج والسرعة
        </h2>
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(result.players ?? []).map((p, i) => {
            const isWinner = result.outcome === 'WON' ? i === 0 : result.outcome === 'LOST' ? i === 1 : false;
            const isBotOpponent = i === 1 && vsBot;
            const totalQ = Math.max(1, challengeMeta?.questionCount ?? reviews.length);
            const accPct = Math.min(100, Math.round((p.correct / totalQ) * 100));
            return (
              <div
                key={p.studentId}
                className={`relative p-6 pt-7 rounded-2xl bg-surface-card border transition-all space-y-4 ${
                  isWinner
                    ? 'border-gold-500/50 shadow-gold-glow bg-gold-500/[0.04]'
                    : 'border-surface-border'
                }`}
              >
                {/* winner crown */}
                {isWinner && (
                  <Float className="-top-5 right-4 w-12" distance={6} duration={4}>
                    <CrownSvg />
                  </Float>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border ${
                        isBotOpponent
                          ? 'bg-emerald-500/10 border-emerald-500/25'
                          : 'bg-gold-500/10 border-gold-500/20'
                      }`}
                    >
                      <ResultPlayerAvatar
                        name={p.fullName}
                        photoUrl={p.photoUrl}
                        isBot={isBotOpponent}
                        className="h-9 w-9"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ivory truncate max-w-[150px]">{p.fullName}</p>
                      <span className="text-[11px] text-ivory-muted">
                        {i === 0 ? 'أنت' : isBotOpponent ? 'البوت الذكي 🤖' : 'الخصم'}
                      </span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-3xl font-black font-display text-amber-700 dark:text-gold-400 block tabular-nums">
                      {p.score}
                    </span>
                    <span className="text-[10px] text-ivory-muted">نقاط</span>
                  </div>
                </div>

                {/* accuracy bar */}
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-surface-alt border border-surface-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${accPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-ivory-muted">دقة الإجابات {accPct}%</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-border text-center text-xs">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold block">{p.correct}</span>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">صحيحة</span>
                  </div>
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/25">
                    <span className="text-red-800 dark:text-red-300 font-bold block">{p.wrong}</span>
                    <span className="text-[10px] text-red-700/80 dark:text-red-400/80">خاطئة</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <span className="text-amber-900 dark:text-amber-300 font-bold font-mono block" dir="ltr">
                      {p.timeTakenSeconds != null ? formatClock(p.timeTakenSeconds) : '--'}
                    </span>
                    <span className="text-[10px] text-amber-800/80 dark:text-amber-400/80">الوقت</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* center VS badge (desktop) */}
          <div className="hidden sm:flex absolute inset-0 items-center justify-center pointer-events-none z-10">
            <div className="w-14 h-14 rounded-full bg-bg border-2 border-dashed border-gold-500/60 shadow-gold-glow flex items-center justify-center -rotate-6">
              <VsBoltSvg className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Question Review Section */}
      {reviews.length > 0 && (
        <div className="relative space-y-4 pt-2">
          <DotsPatternSvg
            aria-hidden
            className="pointer-events-none absolute -top-8 -left-8 w-28 opacity-[0.06]"
          />
          <Float className="-bottom-10 -right-6 w-16 hidden sm:block" delay={0.8} distance={7}>
            <PencilSvg />
          </Float>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
            <div>
              <h2 className="text-base font-bold text-ivory flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-400" />
                مراجعة الأسئلة والحل النموذجي ({reviews.length})
              </h2>
              <p className="text-xs text-ivory-muted">تحليل الإجابات والتفسيرات لجميع أسئلة التحدي</p>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-card p-1 rounded-xl border border-surface-border text-xs">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'ALL'
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'text-ivory-muted hover:text-ivory'
                }`}
              >
                الكل ({reviews.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('CORRECT')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'CORRECT'
                    ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'text-ivory-muted hover:text-ivory'
                }`}
              >
                الصحيحة ({correctCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('WRONG')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === 'WRONG'
                    ? 'bg-red-500/20 text-red-800 dark:text-red-300 font-bold'
                    : 'text-ivory-muted hover:text-ivory'
                }`}
              >
                الخاطئة ({wrongCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.map((r, i) => (
              <ReviewCard key={r.questionId} item={r} index={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-surface-border">
        <Link to="/challenges">
          <Button size="lg" leftIcon={<Swords className="w-4 h-4" />}>
            تحدٍ جديد
          </Button>
        </Link>
        <Link to="/profile">
          <Button variant="outline" size="lg" leftIcon={<User className="w-4 h-4" />}>
            الملف الشخصي وإحصائياتي
          </Button>
        </Link>
      </div>
    </div>
  );
};

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];

const ReviewCard: React.FC<{ item: ChallengeQuestionReview; index: number }> = ({ item }) => {
  // wrong answers start expanded so the student sees the fix immediately
  const [open, setOpen] = useState(!item.isCorrect);

  const sourceMeta =
    item.sourceType === 'MISTAKE'
      ? {
          label: 'من أخطائك السابقة',
          variant: 'warning' as const,
          icon: <WrongCrossSvg className="w-3 h-3" />,
        }
      : item.sourceType === 'EXAM'
      ? {
          label: 'من امتحانات الأستاذ',
          variant: 'gold' as const,
          icon: <CapDoodleSvg className="w-4 h-4" />,
        }
      : {
          label: 'من بنك الأسئلة',
          variant: 'neutral' as const,
          icon: <BookStackSvg className="w-4 h-4" />,
        };

  return (
    <div
      className={`relative rounded-2xl bg-surface-card border overflow-hidden transition-all ${
        item.isCorrect
          ? 'border-emerald-500/30 hover:border-emerald-500/50'
          : 'border-red-500/40 hover:border-red-500/60 shadow-card-dark'
      }`}
    >
      {/* colored side accent */}
      <span
        aria-hidden
        className={`absolute inset-y-0 right-0 w-1.5 ${
          item.isCorrect
            ? 'bg-gradient-to-b from-emerald-500 to-emerald-600'
            : 'bg-gradient-to-b from-red-500 to-red-600'
        }`}
      />

      {/* clickable header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right p-5 sm:p-6 pb-4 flex items-start justify-between gap-3 focus:outline-none"
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* question number medallion */}
          <span
            className={`shrink-0 w-9 h-9 mt-0.5 rounded-xl flex items-center justify-center font-black font-display text-sm border ${
              item.isCorrect
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-500/15 border-red-500/35 text-red-800 dark:text-red-300'
            }`}
          >
            {item.order}
          </span>
          <div className="space-y-1.5 min-w-0">
            <div>
              <Badge variant={sourceMeta.variant}>
                {sourceMeta.icon}
                {sourceMeta.label}
              </Badge>
            </div>
            <p className="text-sm sm:text-base font-bold text-ivory leading-relaxed">{item.text}</p>
          </div>
        </div>

        {/* sketchy verdict + expand chevron */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
          {item.isCorrect ? (
            <>
              <CorrectCheckSvg className="w-7 h-7" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">صحيحة</span>
            </>
          ) : (
            <>
              <WrongCrossSvg className="w-6 h-6" />
              <span className="text-[10px] font-bold text-red-700 dark:text-red-400">خاطئة</span>
            </>
          )}
          <ChevronDown
            className={`w-4 h-4 text-ivory-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* collapsible body */}
      {open && (
        <div className="relative px-5 sm:px-6 pb-5 sm:pb-6 pt-4 space-y-3.5 border-t border-surface-border">
          <DotsPatternSvg
            aria-hidden
            className="pointer-events-none absolute -bottom-6 -left-6 w-24 opacity-[0.05]"
          />

          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              className="max-h-52 rounded-xl border border-surface-border object-contain bg-bg"
            />
          )}

          {/* options with letter medallions */}
          <div className="grid sm:grid-cols-2 gap-2.5">
            {item.options.map((opt, idx) => {
              const isUserChoice = item.selectedOption === idx;
              const isCorrectChoice = item.correctOptionIndex === idx;

              let style = 'border-surface-border bg-surface-alt/40 text-ivory';
              if (isCorrectChoice) {
                style = 'border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 font-medium';
              } else if (isUserChoice && !item.isCorrect) {
                style = 'border-red-500/60 bg-red-50 dark:bg-red-500/15 text-red-900 dark:text-red-200 font-medium';
              }

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-sm ${style}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black font-display border ${
                        isCorrectChoice
                          ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-800 dark:text-emerald-200'
                          : isUserChoice && !item.isCorrect
                          ? 'bg-red-500/25 border-red-400/50 text-red-800 dark:text-red-200'
                          : 'bg-surface border-surface-border text-ivory-muted'
                      }`}
                    >
                      {OPTION_LETTERS[idx] ?? idx + 1}
                    </span>
                    <span className={`text-xs sm:text-sm ${isUserChoice && !item.isCorrect ? 'line-through opacity-80' : ''}`}>
                      {opt}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCorrectChoice && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> النموذجية
                      </span>
                    )}
                    {isUserChoice && !item.isCorrect && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-400">
                        <XCircle className="w-3.5 h-3.5" /> اختيارك
                      </span>
                    )}
                    {isUserChoice && item.isCorrect && (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">اختيارك ✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* explanation — gold parchment note */}
          {item.explanation && (
            <div className="relative p-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/25 space-y-1.5 overflow-hidden">
              <PencilSvg className="pointer-events-none absolute -bottom-4 -left-3 w-12 opacity-30 text-amber-500" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                تفسير الإجابة النموذجية:
              </div>
              <p className="text-xs sm:text-sm text-ivory leading-relaxed">{item.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

