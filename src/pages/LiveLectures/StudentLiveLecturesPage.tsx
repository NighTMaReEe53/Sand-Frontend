import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  CalendarClock,
  ChevronLeft,
  Clock,
  Loader2,
  User,
  BookOpen,
  Sparkles,
  Wifi,
  WifiOff,
  Bell,
  PlayCircle,
  GraduationCap,
  Zap,
  Video,
} from 'lucide-react';
import { useStudentUpcomingLecturesQuery } from '../../hooks/queries/useLiveLectures';
import { LectureStatusBadge } from '../../components/live/LectureStatusBadge';
import { CountdownTimer, useServerTimeOffset } from '../../components/live/CountdownTimer';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  DotsPatternSvg,
  Float,
  ShapesClusterSvg,
} from '../../components/ui/Doodles';

/* ── helpers ──────────────────────────────────────────────── */
const formatArabicDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      numberingSystem: 'latn',
    });
  } catch {
    return iso;
  }
};

/* ── Live lecture card ─────────────────────────────────────── */
const LiveCard: React.FC<{ lecture: any; index: number }> = ({ lecture, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.07, 0.35), duration: 0.35, ease: 'easeOut' }}
  >
    <Link to={`/live-lectures/${lecture.id}`} className="block group">
      <div className="relative overflow-hidden rounded-3xl border border-red-500/35 bg-surface-card transition-all duration-300 hover:border-red-400/60 hover:shadow-[0_0_44px_-10px_rgba(239,68,68,0.3)] hover:-translate-y-0.5">
        {/* red left accent bar */}
        <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-b from-red-400 to-red-600 rounded-l-full" aria-hidden />
        {/* glow blob */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-red-500/10 blur-2xl" />

        <div className="relative p-5 sm:p-6 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <LectureStatusBadge status={lecture.status} />
              {/* pulsing live dot */}
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                مباشر الآن
              </span>
            </div>
            <ChevronLeft className="w-5 h-5 text-red-400 group-hover:-translate-x-1 transition-transform shrink-0" />
          </div>

          <h3 className="text-lg font-bold text-ink group-hover:text-red-400 transition-colors leading-snug">
            {lecture.title}
          </h3>

          <div className="flex items-center gap-3 flex-wrap text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-gold-400/70 shrink-0" />
              {lecture.course.title}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold-400/70 shrink-0" />
              {lecture.teacher.fullName}
            </span>
          </div>

          {/* CTA row */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-red-600 to-red-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform active:scale-95">
              <PlayCircle className="w-4 h-4" />
              انضم للمحاضرة الآن
            </span>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

/* ── Scheduled lecture card ────────────────────────────────── */
const ScheduledCard: React.FC<{ lecture: any; index: number; offsetMs: number }> = ({
  lecture,
  index,
  offsetMs,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.07, 0.4), duration: 0.35, ease: 'easeOut' }}
  >
    <Link to={`/live-lectures/${lecture.id}`} className="block group">
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface-card transition-all duration-300 hover:border-gold-500/40 hover:shadow-[0_10px_36px_-14px_rgba(201,161,90,0.2)] hover:-translate-y-0.5">
        {/* gold left accent bar */}
        <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-gold-400/60 to-gold-600/30 rounded-l-full" aria-hidden />
        {/* glow blob */}
        <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gold-400/[0.06] blur-2xl" />

        <div className="relative p-5 sm:p-6 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <LectureStatusBadge status={lecture.status} />
              <span className="flex items-center gap-1.5 text-[11px] text-ink-muted bg-surface-alt border border-surface-border rounded-full px-3 py-1">
                <Clock className="w-3 h-3 text-gold-400 shrink-0" />
                تبدأ بعد{' '}
                <CountdownTimer targetIso={lecture.scheduledAt} offsetMs={offsetMs} className="text-gold-300 font-bold" />
              </span>
            </div>
            <ChevronLeft className="w-5 h-5 text-ink-muted/60 group-hover:text-gold-300 group-hover:-translate-x-1 transition-all shrink-0" />
          </div>

          <h3 className="text-base font-bold text-ink group-hover:text-gold-300 transition-colors leading-snug">
            {lecture.title}
          </h3>

          <div className="flex items-center gap-3 flex-wrap text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-gold-400/70 shrink-0" />
              {formatArabicDate(lecture.scheduledAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-gold-400/70 shrink-0" />
              {lecture.course.title}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold-400/70 shrink-0" />
              {lecture.teacher.fullName}
            </span>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════ */
/*  Page                                                        */
/* ═══════════════════════════════════════════════════════════ */
export const StudentLiveLecturesPage: React.FC = () => {
  const { data: lectures, isLoading } = useStudentUpcomingLecturesQuery();
  const offsetMs = useServerTimeOffset();

  const liveNow   = (lectures ?? []).filter((l) => l.status === 'LIVE');
  const scheduled = (lectures ?? []).filter((l) => l.status === 'SCHEDULED');
  const total     = (lectures ?? []).length;

  return (
    <div className="mx-auto max-w-5xl space-y-10 overflow-x-hidden px-4 py-10 text-right sm:px-6 lg:px-8" dir="rtl">

      {/* ══════════ HERO ══════════ */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative"
      >
        {/* ambient blobs */}
        <div className="pointer-events-none absolute -top-14 right-1/4 h-64 w-64 rounded-full bg-gold-500/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-0 h-52 w-52 rounded-full bg-red-500/[0.05] blur-3xl" />
        <DotsPatternSvg className="pointer-events-none absolute left-2 -top-4 hidden w-20 opacity-20 md:block" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_auto]">
          {/* ── copy ── */}
          <div className="max-w-xl space-y-6">
            <motion.span
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-card/60 px-4 py-1.5 text-[11px] font-bold text-ink-muted backdrop-blur-sm"
            >
              <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />
              بث مباشر تفاعلي
            </motion.span>

            <h1 className="text-4xl font-black leading-[1.35] text-ink sm:text-[2.75rem] font-din">
              المحاضرات{' '}
              <span className="relative inline-block">
                <span
                  className="relative"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, #ef4444) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  المباشرة
                </span>
                {/* animated underline */}
                <svg viewBox="0 0 220 14" fill="none" aria-hidden className="absolute -bottom-2 right-0 h-3 w-full text-gold-400/80" preserveAspectRatio="none">
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
              كل محاضرات كورساتك المشترك فيها في مكان واحد — هتلاقي إشعار فور ما المعلم يبدأ البث.
            </p>

            {/* stat chips */}
            {total > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap items-center gap-2.5 pt-1"
              >
                {[
                  { icon: Wifi, value: liveNow.length, label: 'مباشر الآن', cls: 'text-red-300 border-red-500/30' },
                  { icon: CalendarClock, value: scheduled.length, label: 'محاضرات قادمة', cls: 'text-gold-300 border-gold-500/30' },
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
          <div className="relative mx-auto hidden w-64 shrink-0 sm:block lg:w-72">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 110 }}
              className="relative"
            >
              <Float distance={8} duration={5}>
                {/* Custom live broadcast illustration SVG */}
                <svg viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-[0_18px_40px_rgba(201,161,90,0.12)]">
                  {/* screen */}
                  <rect x="20" y="20" width="220" height="140" rx="18" fill="currentColor" className="text-surface-card" stroke="currentColor" strokeWidth="2" style={{ stroke: 'var(--primary)', opacity: 0.2 }} />
                  <rect x="30" y="30" width="200" height="120" rx="12" fill="currentColor" className="text-surface-alt" />
                  {/* live indicator ring */}
                  <circle cx="130" cy="90" r="40" fill="currentColor" style={{ fill: 'color-mix(in srgb, #ef4444 8%, transparent)' }} />
                  <circle cx="130" cy="90" r="28" fill="currentColor" style={{ fill: 'color-mix(in srgb, #ef4444 15%, transparent)' }} />
                  <circle cx="130" cy="90" r="16" fill="#ef4444" opacity="0.9" />
                  <polygon points="124,82 124,98 140,90" fill="white" opacity="0.95" />
                  {/* signal arcs */}
                  <path d="M100 65 Q130 50 160 65" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
                  <path d="M88 52 Q130 32 172 52" stroke="#d97706" strokeWidth="2" strokeLinecap="round" opacity="0.35" fill="none" />
                  {/* stand */}
                  <rect x="110" y="160" width="40" height="10" rx="5" fill="currentColor" style={{ fill: 'var(--line)' }} />
                  <rect x="95" y="170" width="70" height="8" rx="4" fill="currentColor" style={{ fill: 'var(--line)' }} />
                </svg>
              </Float>
            </motion.div>

            <ShapesClusterSvg className="pointer-events-none absolute -bottom-4 -left-4 w-20 opacity-25 hidden lg:block" />

            {/* live badge chip */}
            {liveNow.length > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.85, type: 'spring', stiffness: 240, damping: 14 }}
                className="absolute -bottom-3 right-4 flex items-center gap-2 rounded-2xl border border-red-500/35 bg-surface-card/80 px-4 py-2 shadow-card backdrop-blur-sm"
              >
                <span className="flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-sm font-black tabular-nums leading-none text-red-300">{liveNow.length}</span>
                <span className="text-[9px] font-bold leading-tight text-ink-muted">
                  مباشر<br />الآن
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* creative divider */}
        <div className="relative mt-12 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 border-t border-dashed border-surface-border" />
          <Radio className="w-4 h-4 text-red-400/60 animate-pulse" />
          <motion.span
            className="h-px w-10 border-t border-dashed border-gold-500/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <Sparkles className="w-4 h-4 text-gold-400/60" />
          <span className="h-px flex-1 border-t border-dashed border-surface-border" />
        </div>
      </motion.header>

      {/* ══════════ BODY ══════════ */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-3xl" />
            ))}
          </motion.div>

        ) : total === 0 ? (
          /* ── Empty state ── */
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[2.5rem] border border-dashed border-gold-500/30 bg-gradient-to-bl from-surface-card to-gold-500/[0.04] p-10 text-center sm:p-16"
          >
            <div className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-gold-500/10 blur-3xl" />

            <motion.div
              initial={{ scale: 0.75, opacity: 0, rotate: 6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 140, damping: 14, delay: 0.2 }}
              className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/25"
              style={{ boxShadow: '0 0 40px -10px color-mix(in srgb, var(--primary) 30%, transparent)' }}
            >
              <WifiOff className="w-12 h-12 text-gold-400" />
            </motion.div>

            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.55 }}
              className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-2xl border border-gold-500/30 bg-gold-500/8 px-5 py-2.5"
            >
              <CalendarClock className="w-5 h-5 text-gold-400" />
              <span className="text-base font-black text-gold-300">لا توجد محاضرات قادمة</span>
            </motion.div>

            <p className="mx-auto mt-4 max-w-sm text-xs leading-loose text-ink-muted">
              اشترك في الكورسات أولاً، وستظهر المحاضرات المباشرة هنا وتصلك الإشعارات تلقائياً.
            </p>

            <Link to="/my-courses">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-l from-gold-300 to-gold-600 px-6 py-3 text-xs font-black text-bg shadow-gold-glow"
              >
                <GraduationCap className="h-4 w-4" />
                اشترك في كورس جديد
              </motion.span>
            </Link>
          </motion.div>

        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">

            {/* ── Live now ── */}
            {liveNow.length > 0 && (
              <section className="space-y-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between px-1"
                >
                  <h2 className="flex items-center gap-2 text-sm font-black text-ink">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                    مباشر الآن
                    <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[11px] font-black text-red-400">
                      {liveNow.length}
                    </span>
                  </h2>
                  <span className="text-[10px] text-ink-muted/70">انقر للانضمام مباشرة</span>
                </motion.div>
                <div className="space-y-3">
                  {liveNow.map((lecture, i) => (
                    <LiveCard key={lecture.id} lecture={lecture} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Upcoming ── */}
            {scheduled.length > 0 && (
              <section className="space-y-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center justify-between px-1"
                >
                  <h2 className="flex items-center gap-2 text-sm font-black text-ink">
                    <CalendarClock className="h-4 w-4 text-gold-400" />
                    المحاضرات القادمة
                    <span className="rounded-full bg-gold-500/12 border border-gold-500/25 px-2 py-0.5 text-[11px] font-black text-gold-300">
                      {scheduled.length}
                    </span>
                  </h2>
                  <span className="text-[10px] text-ink-muted/70">ستصلك إشعارات قبل البدء</span>
                </motion.div>
                <div className="space-y-3">
                  {scheduled.map((lecture, i) => (
                    <ScheduledCard key={lecture.id} lecture={lecture} index={i} offsetMs={offsetMs} />
                  ))}
                </div>
              </section>
            )}

            {/* footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 pt-3 text-[11px] text-ink-muted/60"
            >
              <Bell className="h-3.5 w-3.5" />
              يُحدَّث التقويم تلقائياً كلما أضاف المعلم محاضرة جديدة
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const LiveLecturesLoading: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
  </div>
);
