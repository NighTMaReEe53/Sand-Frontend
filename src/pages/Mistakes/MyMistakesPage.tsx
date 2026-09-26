import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookX,
  FileText,
  BookOpen,
  ChevronDown,
  CalendarDays,
  Lightbulb,
  Layers,
  ListChecks,
  EyeOff,
  Target,
  Quote,
  XCircle,
  CheckCircle2,
  PlayCircle,
  BookCheck,
  Sparkles,
} from 'lucide-react';
import { useMyMistakesQuery } from '../../hooks/queries/useExams';
import type { MistakeGroup, MistakeQuestion } from '../../api/exams.api';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  WrongCrossSvg,
  CorrectCheckSvg,
  XToCheckSvg,
  PerfectScoreSvg,
  BookStackSvg,
  PencilSvg,
  DotsPatternSvg,
  Float,
} from '../../components/ui/Doodles';

const ARABIC_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
const letter = (i: number) => ARABIC_LETTERS[i] ?? String(i + 1);

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

/* ════════════════════════════════════════════════════════════ */
/*  One wrong question — calm, spacious review layout            */
/* ════════════════════════════════════════════════════════════ */
const AnswerRow: React.FC<{
  kind: 'wrong' | 'correct';
  label: string;
  letterHint?: string;
  children: React.ReactNode;
}> = ({ kind, label, letterHint, children }) => {
  const isCorrect = kind === 'correct';
  return (
    <div
      className={`relative flex items-start gap-3.5 overflow-hidden rounded-2xl border p-4 ${
        isCorrect
          ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
          : 'border-red-500/15 bg-red-500/[0.035]'
      }`}
    >
      {/* soft accent edge */}
      <span
        className={`absolute inset-y-3 w-[3px] rounded-full ${
          isCorrect ? 'bg-emerald-400/60' : 'bg-red-400/50'
        }`}
        style={{ insetInlineStart: 0 }}
      />

      {/* status icon */}
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.25 }}
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isCorrect ? 'bg-emerald-500/12 text-emerald-300' : 'bg-red-500/10 text-red-300'
        }`}
      >
        {isCorrect ? <CorrectCheckSvg className="w-4" /> : <WrongCrossSvg className="w-4" />}
      </motion.span>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className={`flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-wide ${isCorrect ? 'text-emerald-300/80' : 'text-red-300/70'}`}>
          <span>{label}</span>
          {letterHint && (
            <span className={`rounded-md px-1.5 py-0.5 text-[9px] ${isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {letterHint}
            </span>
          )}
          {isCorrect && <CheckCircle2 className="h-3 w-3 opacity-60" />}
        </p>
        <div className={`text-sm leading-loose ${isCorrect ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

const MistakeQuestionCard: React.FC<{ question: MistakeQuestion; index: number }> = ({
  question,
  index,
}) => {
  const [showAll, setShowAll] = useState(false);
  const answered = question.yourAnswerIndex !== null && question.yourAnswerIndex !== undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.07, 0.4), duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden rounded-3xl border border-surface-border bg-surface-card"
    >
      {/* ── question strip ── */}
      <header className="flex items-start gap-3.5 border-b border-surface-border bg-gold-500/[0.04] px-5 py-4 sm:px-6">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-500/35 text-xs font-black tabular-nums text-gold-300">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <p className="text-[15px] font-semibold leading-loose text-ink">{question.text}</p>
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt=""
              loading="lazy"
              className="max-h-48 rounded-xl border border-surface-border bg-white/5 object-contain"
            />
          )}
        </div>
      </header>

      {/* ── answers body ── */}
      <div className="space-y-2.5 p-5 sm:p-6">
        {answered ? (
          <>
            <AnswerRow kind="wrong" label="إجابتك" letterHint={`الاختيار (${letter(question.yourAnswerIndex!)})`}>
              {question.options[question.yourAnswerIndex!]}
            </AnswerRow>

            {/* gentle connector */}
            <div className="flex items-center justify-center gap-3 py-0.5" aria-hidden>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-surface-border to-transparent" />
              <motion.span
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-500/30 bg-surface-alt text-gold-400"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-surface-border to-transparent" />
            </div>

            <AnswerRow
              kind="correct"
              label="الإجابة الصحيحة"
              letterHint={`الاختيار (${letter(question.correctAnswerIndex)})`}
            >
              {question.options[question.correctAnswerIndex]}
            </AnswerRow>
          </>
        ) : (
          /* unanswered → single amber note + correct answer */
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                <XCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-wide text-amber-300/80">لم تُجب</p>
                <p className="mt-0.5 text-sm text-ink-muted">لم تختر أي إجابة لهذا السؤال</p>
              </div>
            </div>

            <AnswerRow
              kind="correct"
              label="الإجابة الصحيحة"
              letterHint={`الاختيار (${letter(question.correctAnswerIndex)})`}
            >
              {question.options[question.correctAnswerIndex]}
            </AnswerRow>
          </>
        )}

        {/* ── all options toggle ── */}
        {question.options.length > 2 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-3.5 py-1.5 text-[11px] font-semibold text-ink-muted transition-all hover:border-gold-500/40 hover:text-gold-300"
            >
              {showAll ? <EyeOff className="h-3.5 w-3.5" /> : <ListChecks className="h-3.5 w-3.5" />}
              {showAll ? 'إخفاء الاختيارات' : `كل الاختيارات (${question.options.length})`}
            </button>

            <AnimatePresence initial={false}>
              {showAll && (
                <motion.div
                  key="all-options"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <ul className="mt-3 space-y-1.5">
                    {question.options.map((opt, i) => {
                      const isCorrect = i === question.correctAnswerIndex;
                      const isYours = i === question.yourAnswerIndex;
                      const active = isCorrect || isYours;
                      return (
                        <li
                          key={i}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${
                            isCorrect
                              ? 'border-emerald-500/25 bg-emerald-500/[0.06] font-semibold text-emerald-100'
                              : isYours
                              ? 'border-red-500/20 bg-red-500/[0.05] font-medium text-red-100/90'
                              : 'border-surface-border/60 text-ink-muted'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-black ${
                              active ? 'border-current' : 'border-surface-borderLight text-ink-muted/70'
                            }`}
                          >
                            {letter(i)}
                          </span>
                          <span className="min-w-0 flex-1">{opt}</span>
                          {isCorrect && (
                            <span className="shrink-0 text-[9px] font-bold text-emerald-300/80">الصحيح</span>
                          )}
                          {isYours && !isCorrect && (
                            <span className="shrink-0 text-[9px] font-bold text-red-300/70">إجابتك</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── explanation ── */}
        {question.explanation && (
          <div className="flex items-start gap-3 rounded-2xl border border-surface-border bg-surface-alt/60 px-4 py-3.5">
            <motion.span
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.45 }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/12"
            >
              <Lightbulb className="h-4 w-4 text-gold-400" />
            </motion.span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gold-300/80">الشرح</p>
              <p className="mt-1 text-xs leading-loose text-ink-muted">{question.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── meta footer ── */}
      <footer className="flex items-center justify-between border-t border-surface-border px-5 py-3 text-[10px] tabular-nums text-ink-muted/60 sm:px-6">
        <span>المحاولة #{question.attemptNumber}</span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 text-gold-400/60" />
          {fmtDate(question.answeredAt)}
        </span>
      </footer>
    </motion.article>
  );
};

/* ════════════════════════════════════════════════════════════ */
/*  Collapsible group: section → exam/quiz → date                */
/* ════════════════════════════════════════════════════════════ */
const MistakeGroupCard: React.FC<{
  group: MistakeGroup;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ group, isOpen, onToggle }) => {
  const isExam = group.type === 'EXAM';
  const isHomework = group.type === 'HOMEWORK';

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`overflow-hidden rounded-3xl border bg-surface-card transition-shadow ${
        isOpen
          ? 'border-red-500/40 shadow-[0_0_44px_-14px_rgba(239,68,68,0.3)]'
          : 'border-surface-border hover:border-red-500/30 hover:shadow-[0_10px_36px_-18px_rgba(239,68,68,0.25)]'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="flex flex-1 items-center gap-4 text-right cursor-pointer min-w-0"
        >
          {/* icon tile with count bubble */}
          <span className="relative shrink-0">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                isExam
                  ? 'border-sky-500/40 bg-gradient-to-br from-sky-500/20 to-transparent text-sky-300'
                  : isHomework
                  ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-transparent text-emerald-300'
                  : 'border-violet-500/40 bg-gradient-to-br from-violet-500/20 to-transparent text-violet-300'
              }`}
            >
              {isExam ? <FileText className="h-5 w-5" /> : isHomework ? <BookCheck className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
            </span>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 15, delay: 0.2 }}
              className="absolute -bottom-1.5 -left-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-surface-card bg-red-500 px-1 text-[10px] font-black tabular-nums text-white"
            >
              {group.questions.length}
            </motion.span>
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-md px-2 py-0.5 text-[9px] font-black tracking-wide ${
                  isExam ? 'bg-sky-500/15 text-sky-300' : isHomework ? 'bg-emerald-500/15 text-emerald-300' : 'bg-violet-500/15 text-violet-300'
                }`}
              >
                {isExam ? 'امتحان' : isHomework ? 'واجب' : 'كويز'}
              </span>
              {group.sectionName && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gold-500/12 px-2 py-0.5 text-[9px] font-black text-gold-300">
                  <Layers className="h-2.5 w-2.5" />
                  {group.sectionName}
                </span>
              )}
              {!isOpen && (
                <span className="text-[9px] font-bold text-red-300/70">
                  {group.questions.length} أسئلة تحتاج مراجعة
                </span>
              )}
            </div>
            <h3 className="truncate text-[15px] font-bold text-ink">{group.title}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-muted">
              <span className="flex max-w-[200px] items-center gap-1 truncate">
                <BookOpen className="h-3 w-3 shrink-0" />
                {group.courseTitle}
              </span>
              <span className="flex items-center gap-1 tabular-nums">
                <CalendarDays className="h-3 w-3 shrink-0 text-gold-400/70" />
                {fmtDate(group.lastDate)}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-border">
          <Link
            to={`/my-mistakes/practice?groupId=${encodeURIComponent(group.id)}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all active:scale-95"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            <span>امتحان تدريبي</span>
          </Link>
          <button
            type="button"
            onClick={onToggle}
            className="p-1 text-ink-muted hover:text-ink cursor-pointer"
            aria-label="تبديل القائمة"
          >
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-red-300' : 'text-ink-muted'
              }`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeInOut' }}
          >
            <div className="space-y-4 border-t border-dashed border-surface-border bg-bg-subtle/30 p-4 sm:p-5">
              {group.questions.map((q, i) => (
                <MistakeQuestionCard key={q.questionId} question={q} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

/* ════════════════════════════════════════════════════════════ */
/*  Page                                                         */
/* ════════════════════════════════════════════════════════════ */
export const MyMistakesPage: React.FC = () => {
  const { data, isLoading } = useMyMistakesQuery();
  const [openId, setOpenId] = useState<string | null>(null);

  const groups = useMemo(() => data?.groups ?? [], [data]);
  const summary = data?.summary ?? { totalWrong: 0, examWrong: 0, quizWrong: 0, homeworkWrong: 0 };

  return (
    <div className="mx-auto max-w-5xl space-y-10 overflow-x-hidden px-4 py-10 text-right sm:px-6 lg:px-8">
      {/* ═══════════════ HERO — open, clean, no heavy background ═══════════════ */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative"
      >
        {/* whisper-soft ambience only */}
        <div className="pointer-events-none absolute -top-14 right-1/4 h-64 w-64 rounded-full bg-gold-500/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-0 h-52 w-52 rounded-full bg-red-500/[0.05] blur-3xl" />
        <DotsPatternSvg className="pointer-events-none absolute left-2 -top-4 hidden w-20 opacity-25 md:block" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_auto]">
          {/* ── copy ── */}
          <div className="max-w-xl space-y-6">
            <motion.span
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-card/60 px-4 py-1.5 text-[11px] font-bold text-ink-muted backdrop-blur-sm"
            >
              <BookX className="h-3.5 w-3.5 text-red-400" />
              دفتر الأخطاء الذكي
            </motion.span>

            <h1 className="text-4xl font-black leading-[1.35] text-ink sm:text-[2.75rem] font-din">
              حوّل{' '}
              <span className="relative inline-block px-1">
                <WrongCrossSvg className="absolute -top-3 right-0 w-7" />
                <span className="invisible">✗</span>
                <span className="absolute inset-0 text-red-500">✗</span>
              </span>{' '}
              كل خطأ إلى{' '}
              <span className="font-amira text-primary relative inline-block">
                خطوة نجاح
                {/* animated hand-drawn underline */}
                <svg
                  viewBox="0 0 220 14"
                  fill="none"
                  aria-hidden
                  className="absolute -bottom-2 right-0 h-3 w-full text-gold-400/80"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M6 9 C 60 3, 150 3, 214 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 0.7, ease: 'easeOut' }}
                  />
                </svg>
              </span>
            </h1>

            <p className="max-w-md text-sm leading-loose text-ink-muted font-sst">
              كل سؤال أخطأت فيه في امتحاناتك وكويزاتك مجمّع هنا — قارن إجابتك
              بالإجابة الصحيحة، اقرأ الشرح، وارجع جاهزاً.
            </p>

            {/* quote */}
            <p className="flex max-w-md items-center gap-2.5 text-xs italic leading-relaxed text-ink-muted/80">
              <Quote className="h-4 w-4 shrink-0 -scale-x-100 text-gold-400/60" />
              الخطأ لا يهدمك… إنما يعلّمك كيف تنجح
            </p>

            {/* Quick Practice Exam CTA */}
            {summary.totalWrong > 0 && (
              <div className="pt-1">
                <Link
                  to="/my-mistakes/practice"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-strong px-5 py-3 text-xs sm:text-sm font-black text-on-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>ابدأ امتحاناً تدريبياً مؤقتاً من كل أخطائك</span>
                </Link>
              </div>
            )}

            {/* minimal outline stat chips */}
            {summary.totalWrong > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-2.5 pt-1"
              >
                {[
                  { icon: BookX, value: summary.totalWrong, label: 'خطأ', cls: 'text-red-300 border-red-500/30' },
                  { icon: FileText, value: summary.examWrong, label: 'امتحانات', cls: 'text-sky-300 border-sky-500/30' },
                  { icon: BookOpen, value: summary.quizWrong, label: 'كويزات', cls: 'text-violet-300 border-violet-500/30' },
                  ...(summary.homeworkWrong ? [{ icon: BookCheck, value: summary.homeworkWrong, label: 'واجبات', cls: 'text-emerald-300 border-emerald-500/30' }] : []),
                ].map((s, i) => (
                  <motion.span
                    key={s.label}
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.09, type: 'spring', stiffness: 280, damping: 17 }}
                    className={`inline-flex items-center gap-2 rounded-full border bg-transparent px-4 py-1.5 ${s.cls}`}
                  >
                    <s.icon className="h-3.5 w-3.5 opacity-80" />
                    <span className="text-base font-black tabular-nums leading-none">{s.value}</span>
                    <span className="text-[10px] font-bold opacity-70">{s.label}</span>
                  </motion.span>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── illustration ── */}
          <div className="relative mx-auto hidden w-72 shrink-0 sm:block lg:w-80">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 110 }}
            >
              <Float distance={10} duration={5.5}>
                <XToCheckSvg className="w-full drop-shadow-[0_18px_40px_rgba(201,161,90,0.15)]" />
              </Float>
            </motion.div>

            {/* books holding the scene up */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="relative z-[-1] mx-auto -mt-5 w-40 opacity-95"
            >
              <BookStackSvg />
            </motion.div>

            {/* pen drawing the arrow */}
            <Float className="-bottom-1 left-0 w-14 opacity-90" delay={0.9} duration={4.5}>
              <PencilSvg />
            </Float>

            {/* drifting mini-X that slowly spins */}
            <motion.div
              className="pointer-events-none absolute -top-4 right-2 w-9 opacity-70"
              animate={{ rotate: [0, 10, 0, -10, 0], y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            >
              <WrongCrossSvg />
            </motion.div>

            {/* total counter chip */}
            {summary.totalWrong > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.85, type: 'spring', stiffness: 240, damping: 14 }}
                className="absolute -bottom-3 right-4 flex items-center gap-2 rounded-2xl border border-red-500/35 bg-surface-card/80 px-4 py-2 shadow-card backdrop-blur-sm"
              >
                <span className="text-lg font-black tabular-nums leading-none text-red-300">
                  {summary.totalWrong}
                </span>
                <span className="text-[9px] font-bold leading-tight text-ink-muted">
                  سؤال
                  <br />
                  خاطئ
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── creative divider: ✗ ──→── ✓ ── */}
        <div className="relative mt-12 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 border-t border-dashed border-surface-border" />
          <WrongCrossSvg className="w-5 opacity-70" />
          <motion.span
            className="h-px w-10 border-t border-dashed border-gold-500/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <CorrectCheckSvg className="w-5 opacity-70" />
          <span className="h-px flex-1 border-t border-dashed border-surface-border" />
        </div>
      </motion.header>

      {/* ═══════════════ BODY ═══════════════ */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-3xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        /* ── empty state ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-[2.5rem] border border-dashed border-emerald-500/40 bg-gradient-to-bl from-surface-card to-emerald-500/[0.06] p-10 text-center sm:p-16"
        >
          <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
          <motion.div
            initial={{ scale: 0.75, opacity: 0, rotate: 6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.2 }}
          >
            <PerfectScoreSvg className="mx-auto w-56 sm:w-72" />
          </motion.div>
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.55 }}
            className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5"
          >
            <CorrectCheckSvg className="w-7" />
            <span className="text-base font-black text-emerald-300">لا توجد أخطاء بعد</span>
          </motion.div>
          <p className="mx-auto mt-4 max-w-sm text-xs leading-loose text-ink-muted">
            لم ترتكب أي خطأ في امتحاناتك وكويزاتك حتى الآن — أو لم تدخل أي امتحان بعد.
            ادخل أول امتحان لك، وإن أخطأت ستجد كل شيء هنا لتتقنه.
          </p>
          <Link to="/my-courses">
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-l from-gold-300 to-gold-600 px-6 py-3 text-xs font-black text-bg shadow-gold-glow"
            >
              <BookOpen className="h-4 w-4" />
              ابدأ امتحاناً من كورساتك
            </motion.span>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between px-1"
          >
            <h2 className="flex items-center gap-2 text-sm font-black text-ink">
              <BookX className="h-4 w-4 text-red-400" />
              أخطاؤك حسب الامتحان
            </h2>
            <span className="text-[10px] text-ink-muted/70">اضغط على أي بطاقة لعرض الأسئلة</span>
          </motion.div>

          {groups.map((g, gi) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(gi * 0.07, 0.35) }}
            >
              <MistakeGroupCard
                group={g}
                isOpen={openId === g.id}
                onToggle={() => setOpenId(openId === g.id ? null : g.id)}
              />
            </motion.div>
          ))}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 pt-3 text-[11px] text-ink-muted/60"
          >
            <Target className="h-3.5 w-3.5" />
            يُحدَّث سجل أخطائك تلقائياً بعد تسليم كل امتحان أو كويز
          </motion.p>
        </div>
      )}
    </div>
  );
};
