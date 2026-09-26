import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Crown,
  Medal,
  Award,
  ChevronLeft,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { leaderboardApi, LeaderboardRow } from '../../api/leaderboard.api';
import { Skeleton } from '../ui/Skeleton';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}د ${sec}ث`;
  return `${sec}ث`;
}

const StudentAvatar = React.memo(function StudentAvatar({
  name, photo, size = 44, ringClass = '',
}: {
  name: string; photo?: string | null; size?: number; ringClass?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || 'ط').trim().charAt(0);
  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 border-2 ${ringClass}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-bold border-2 ${ringClass} shadow-sm select-none`}
      style={{
        width: size, height: size,
        fontSize: Math.round(size * 0.4),
        backgroundColor: 'var(--surface-alt)',
        color: 'var(--ink)',
        borderColor: 'var(--line)',
      }}
    >
      {initial}
    </div>
  );
});

// ─── Rank styling — explicit light + dark colours for guaranteed contrast ───
type RankStyle = {
  rank: 1 | 2 | 3;
  label: string;
  accent: string;
  pedestalH: number;
  elevCls: string;
  // light
  cardL: string; nameL: string; pctL: string; badgeL: string;
  pedL: string; pedNumL: string; ringL: string;
  // dark
  cardD: string; nameD: string; pctD: string; badgeD: string;
  pedD: string; pedNumD: string; ringD: string;
  iconEl: React.ReactNode;
  crownEl: React.ReactNode;
};

const RANK_STYLES: RankStyle[] = [
  {
    rank: 2, label: 'المركز الثاني', accent: '#94A3B8', pedestalH: 60, elevCls: 'mt-6 sm:mt-4',
    cardL: 'bg-gradient-to-b from-slate-100 to-white border-slate-300 shadow-sm',
    nameL: 'text-slate-900 font-bold', pctL: '#0F172A',
    badgeL: 'bg-slate-200 text-slate-800 border-slate-400 font-bold',
    pedL: 'bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100 border-slate-400',
    pedNumL: 'text-slate-700', ringL: 'border-slate-400',
    cardD: 'dark:bg-zinc-800/90 dark:border-zinc-500/50 dark:shadow-md',
    nameD: 'dark:text-zinc-100 font-bold', pctD: '#E4E4E7',
    badgeD: 'dark:bg-zinc-700/60 dark:text-zinc-100 dark:border-zinc-500/60 font-bold',
    pedD: 'dark:from-zinc-600/50 dark:via-zinc-700/40 dark:to-zinc-800/30 dark:border-zinc-500/40',
    pedNumD: 'dark:text-zinc-300', ringD: 'dark:border-zinc-500',
    iconEl: <Medal className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-200" />,
    crownEl: null,
  },
  {
    rank: 1, label: 'البطل الأول', accent: 'var(--primary)', pedestalH: 88, elevCls: 'mt-0 z-10',
    cardL: 'bg-gradient-to-b from-amber-50 via-white to-amber-50/40 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10',
    nameL: 'text-amber-950 font-bold', pctL: '#78350F',
    badgeL: 'bg-amber-200 text-amber-950 border-amber-400 font-black',
    pedL: 'bg-gradient-to-b from-amber-300 via-amber-200 to-amber-100 border-amber-400',
    pedNumL: 'text-amber-900', ringL: 'border-amber-400',
    cardD: 'dark:bg-amber-500/15 dark:border-amber-400/70 dark:ring-2 dark:ring-amber-400/30 dark:shadow-gold-glow',
    nameD: 'dark:text-amber-100 font-bold', pctD: '#F5C518',
    badgeD: 'dark:bg-amber-500/30 dark:text-amber-200 dark:border-amber-400/60 font-black',
    pedD: 'dark:from-amber-500/40 dark:via-amber-600/25 dark:to-amber-700/15 dark:border-amber-400/40',
    pedNumD: 'dark:text-amber-300', ringD: 'dark:border-amber-400',
    iconEl: <Crown className="w-4 h-4 text-amber-800 dark:text-amber-300" />,
    crownEl: (
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-[28px] leading-none drop-shadow-md select-none z-10 animate-bounce">
        👑
      </div>
    ),
  },
  {
    rank: 3, label: 'المركز الثالث', accent: '#F97316', pedestalH: 42, elevCls: 'mt-10 sm:mt-8',
    cardL: 'bg-gradient-to-b from-orange-50 via-white to-orange-50/40 border-orange-300 shadow-sm',
    nameL: 'text-orange-950 font-bold', pctL: '#9A3412',
    badgeL: 'bg-orange-200 text-orange-900 border-orange-300 font-bold',
    pedL: 'bg-gradient-to-b from-orange-300 via-orange-200 to-orange-100 border-orange-300',
    pedNumL: 'text-orange-800', ringL: 'border-orange-400',
    cardD: 'dark:bg-orange-900/20 dark:border-orange-500/50',
    nameD: 'dark:text-orange-100 font-bold', pctD: '#FB923C',
    badgeD: 'dark:bg-orange-600/30 dark:text-orange-200 dark:border-orange-500/50 font-bold',
    pedD: 'dark:from-orange-600/35 dark:via-orange-700/25 dark:to-orange-800/15 dark:border-orange-500/35',
    pedNumD: 'dark:text-orange-300', ringD: 'dark:border-orange-600',
    iconEl: <Award className="w-3.5 h-3.5 text-orange-800 dark:text-orange-400" />,
    crownEl: null,
  },
];

const PodiumColumn = React.memo(function PodiumColumn({
  rs, row, totalMarks = 100, animIdx = 0,
}: {
  rs: RankStyle; row: LeaderboardRow | undefined;
  totalMarks?: number; animIdx?: number;
}) {
  const isFirst = rs.rank === 1;

  if (!row) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: animIdx * 0.1 }}
        className={`flex flex-col items-center w-full ${rs.elevCls}`}
      >
        <div
          className="w-full rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center min-h-[130px] text-center"
          style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface-alt)' }}
        >
          <span className="text-2xl mb-1 opacity-60">
            {rs.rank === 1 ? '🥇' : rs.rank === 2 ? '🥈' : '🥉'}
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--ink-muted)' }}>{rs.label}</span>
          <span className="text-[10px] mt-0.5" style={{ color: 'var(--ink-muted)', opacity: 0.6 }}>شاغر</span>
        </div>
        <div
          className={`w-full rounded-t-xl border-t border-x mt-2 ${rs.pedL} ${rs.pedD}`}
          style={{ height: rs.pedestalH }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: animIdx * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center w-full group ${rs.elevCls}`}
    >
      {/* Floating card */}
      <div
        className="exam-podium-card w-full relative rounded-2xl border-2 p-3 sm:p-3.5 flex flex-col items-center text-center transition-transform duration-200 hover:-translate-y-1"
        style={{ '--podium-accent': rs.accent } as React.CSSProperties}
      >
        {/* Crown — only 1st place, clearly above badge */}
        {rs.crownEl}

        {/* Rank badge */}
        <div className="exam-podium-rank-badge absolute -top-4 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border-2 flex items-center gap-1.5 whitespace-nowrap shadow-sm">
          {rs.iconEl}
          <span>{rs.label}</span>
        </div>

        {/* Avatar */}
        <div className="mt-4 relative">
          <StudentAvatar
            name={row.studentName}
            photo={row.photoUrl}
            size={isFirst ? 54 : 44}
            ringClass={`${rs.ringL} ${rs.ringD}`}
          />
        </div>

        {/* Name */}
        <h4 className="font-bold text-xs sm:text-sm mt-2 px-1 truncate w-full" style={{ color: 'var(--ink)' }} title={row.studentName}>
          {row.studentName}
        </h4>

        {/* Percentage */}
        <div className="mt-0.5 flex items-baseline justify-center">
          <span className="font-black text-xl sm:text-2xl tabular-nums leading-none" style={{ color: 'var(--podium-accent)' }}>
            {row.percentage}%
          </span>
        </div>

        {/* Score */}
        <span className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--ink-muted)' }}>
          {row.score} / {totalMarks} نقطة
        </span>

        {/* Stats pills */}
        <div className="w-full grid grid-cols-2 gap-1 mt-2.5 pt-2 border-t text-[10px]" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-center gap-1 py-0.5 px-1 rounded-md font-medium"
            style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }}
            title="الوقت المستغرق"
          >
            <Clock className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{formatTime(row.timeTakenSeconds)}</span>
          </div>
          <div className="flex items-center justify-center gap-1 py-0.5 px-1 rounded-md text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20"
            title="الإجابات الصحيحة"
          >
            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{row.correctCount ?? '—'}/{row.totalQuestions ?? '—'}</span>
          </div>
        </div>

        {/* Exit count */}
        <div className="flex items-center gap-1 text-[9px] mt-1" style={{ color: 'var(--ink-muted)' }}>
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
          <span>خروج: {row.exitCount ?? 0}/2</span>
        </div>
      </div>

      {/* Animated Pedestal Diagram Pillar */}
      <motion.div
        initial={{ height: 0, opacity: 0.6 }}
        animate={{ height: rs.pedestalH }}
        transition={{ duration: 0.65, delay: 0.15 + animIdx * 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="exam-podium-pedestal w-full rounded-t-2xl border-t-2 border-x-2 flex flex-col items-center justify-between relative overflow-hidden mt-1 pt-2 pb-1 shadow-inner"
        style={{ height: rs.pedestalH, '--podium-accent': rs.accent } as React.CSSProperties}
      >
        <span className="relative font-black text-[11px] sm:text-xs uppercase tracking-wider select-none" style={{ color: 'var(--ink)' }}>
          {rs.rank === 1 ? '🥇 المركز 1' : rs.rank === 2 ? '🥈 المركز 2' : '🥉 المركز 3'}
        </span>
        <span className="relative font-black text-3xl sm:text-4xl tabular-nums leading-none select-none opacity-[0.3]" style={{ color: 'var(--ink)' }}>
          #{rs.rank}
        </span>
      </motion.div>
    </motion.div>
  );
});

export const ExamLeaderboard: React.FC<{ examId: string }> = ({ examId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['exam-leaderboard', examId],
    queryFn: () => leaderboardApi.getExamLeaderboard(examId),
    enabled: !!examId,
    staleTime: 30_000,
  });

  const podium = useMemo(() => data?.leaderboard.slice(0, 3) ?? [], [data?.leaderboard]);
  const rest   = useMemo(() => data?.leaderboard.slice(3, 10) ?? [], [data?.leaderboard]);
  const byRank = useMemo(() => new Map(podium.map((r) => [r.rank, r])), [podium]);
  const totalMarks = data?.exam.totalMarks ?? 100;

  if (isLoading) {
    return (
      <div className="rounded-2xl border p-6 shadow-sm space-y-4" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}>
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (isError || !data || data.leaderboard.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-5 sm:p-7 shadow-sm text-right space-y-6"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          >
            <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
              منصة التتويج (المراكز الثلاثة الأولى)
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </h3>
            <span className="text-xs truncate" style={{ color: 'var(--ink-muted)' }}>— {data.exam.title}</span>
          </div>
        </div>
        <Link
          to={`/exam-rankings?examId=${examId}`}
          className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors shadow-sm hover:opacity-75"
          style={{ backgroundColor: 'var(--surface-alt)', border: '1px solid var(--line)', color: 'var(--ink)' }}
        >
          <span>جدول الترتيب الكامل</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Podium (RTL: 2nd | 1st | 3rd) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-2 sm:pt-4">
        {RANK_STYLES.map((rs, idx) => (
          <PodiumColumn key={rs.rank} rs={rs} row={byRank.get(rs.rank)} totalMarks={totalMarks} animIdx={idx} />
        ))}
      </div>

      {/* ─── Animated Diagram Comparison for Top 3 ─── */}
      {podium.length > 1 && (
        <div
          className="rounded-2xl border p-4 sm:p-5 space-y-3.5"
          style={{ backgroundColor: 'var(--surface-alt)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
              <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>مخطط المقارنة البياني للأوائل (Diagram)</span>
            </h4>
            <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>نسب الإنجاز والفروق الزمنية</span>
          </div>

          <div className="space-y-2.5">
            {podium.map((p) => {
              const barColor =
                p.rank === 1
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : p.rank === 2
                  ? 'bg-gradient-to-r from-slate-500 to-slate-400'
                  : 'bg-gradient-to-r from-orange-500 to-orange-400';
              return (
                <div key={p.rank} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
                      <span>{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉'}</span>
                      <span className="truncate max-w-[160px] sm:max-w-xs">{p.studentName}</span>
                    </span>
                    <span className="font-black tabular-nums" style={{ color: 'var(--ink)' }}>
                      {p.percentage}% <span className="font-normal text-[10px]" style={{ color: 'var(--ink-muted)' }}>({p.score} نقطة · {formatTime(p.timeTakenSeconds)})</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(8, p.percentage))}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + p.rank * 0.12, ease: 'easeOut' }}
                      className={`h-full rounded-full ${barColor}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranks 4-10 */}
      {rest.length > 0 && (
        <div className="space-y-2.5 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--ink)' }}>
            <span>المراكز التالية (من 4 إلى 10):</span>
            <span className="text-[11px] font-normal" style={{ color: 'var(--ink-muted)' }}>{rest.length} طلاب</span>
          </div>
          <div className="space-y-1.5">
            {rest.map((row, idx) => (
              <motion.div
                key={row.rank}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="flex items-center justify-between p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border hover:opacity-80 transition-colors text-xs"
                style={{ backgroundColor: 'var(--surface-alt)', borderColor: 'var(--line)', color: 'var(--ink)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 text-center font-bold shrink-0" style={{ color: 'var(--ink-muted)' }}>#{row.rank}</span>
                  <StudentAvatar name={row.studentName} photo={row.photoUrl} size={28} />
                  <span className="font-bold truncate" style={{ color: 'var(--ink)' }}>{row.studentName}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  <span className="hidden sm:flex items-center gap-1">
                    <Clock className="w-3 h-3" />{formatTime(row.timeTakenSeconds)}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />{row.correctCount ?? '—'}
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-300 tabular-nums">{row.percentage}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Viewer card */}
      {data.viewer && (
        <div className="pt-2">
          {data.viewer.isEligible === false || (data.viewer.exitCount ?? 0) > 2 ? (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                <span className="text-red-700 dark:text-red-300 font-bold">
                  {data.viewer.disqualifiedReason || `خارج الترتيب الرسمي بسبب الخروج ${data.viewer.exitCount ?? 0} مرات`}
                </span>
              </div>
              <span className="font-bold shrink-0" style={{ color: 'var(--ink)' }}>{data.viewer.percentage}%</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold" style={{ color: 'var(--ink)' }}>ترتيبك في لوحة الامتحان:</span>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {data.viewer.rank ? `#${data.viewer.rank}` : 'مسجل'}
                {' · '}
                <span className="font-black">{data.viewer.percentage}%</span>
                {' · '}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">خروج: {data.viewer.exitCount ?? 0}/2</span>
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
