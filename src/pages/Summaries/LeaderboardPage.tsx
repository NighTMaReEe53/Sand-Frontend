import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  ArrowRight,
  Sparkles,
  MessageCircle,
  ThumbsUp,
  Heart,
  Crown,
  BookOpen,
  FileText,
  User,
  Calendar,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { summariesApi } from '../../api/summaries.api';
import { CustomCourseSelect } from '../../components/ui/CustomCourseSelect';
import { resolveMediaUrl } from '../../lib/utils';
import { SkeletonLeaderboard } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';

interface LeaderboardEntry {
  rank: number;
  id: string;
  title: string;
  studentName: string;
  studentPhoto?: string | null;
  commentsCount: number;
  likesCount?: number;
  score?: number;
  createdAt: string;
}

export function LeaderboardPage() {
  const { courseId: paramCourseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(paramCourseId || null);

  useEffect(() => {
    if (paramCourseId && paramCourseId !== selectedCourseId) {
      setSelectedCourseId(paramCourseId);
    }
  }, [paramCourseId]);

  const activeCourseId = selectedCourseId || paramCourseId;

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', activeCourseId],
    queryFn: () => summariesApi.getLeaderboard(activeCourseId!),
    enabled: !!activeCourseId,
  });

  const leaderboard = (data?.leaderboard || []) as LeaderboardEntry[];
  const topThree = leaderboard.slice(0, 3);
  const remainingList = leaderboard;

  return (
    <div className="min-h-screen bg-bg text-ivory p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              to={activeCourseId ? `/courses/${activeCourseId}/summaries` : '/summaries'}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-gold-400 hover:underline transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى مجتمع الملخصات
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 shadow-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-amiri text-ivory">
                  لوحة المتصدرين وقائمة الشرف
                </h1>
                <p className="text-xs sm:text-sm text-ivory-muted">
                  تكريم أفضل الطلاب تفاعلاً ومشاركةً للملخصات والمذكرات المعتمدة.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-surface border border-surface-border/60 text-xs font-bold text-ivory-muted flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span>مجموع المشاركات: {leaderboard.length}</span>
            </div>
          </div>
        </div>

        {/* Customized Course Select Box */}
        <CustomCourseSelect
          selectedCourseId={activeCourseId || null}
          onSelectCourse={(id) => {
            setSelectedCourseId(id);
            navigate(`/courses/${id}/summaries/leaderboard`, { replace: true });
          }}
          label="اختر الكورس لعرض لوحة شرفه:"
        />
      </div>

      {isLoading ? (
        <SkeletonLeaderboard />
      ) : leaderboard.length === 0 ? (
        <div className="rounded-3xl border border-surface-border/60 bg-surface-card p-12 text-center space-y-4 shadow-card">
          <div className="w-16 h-16 rounded-3xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold font-amiri text-ivory">لا يوجد متصدرون في هذا الكورس بعد</h3>
          <p className="text-xs sm:text-sm text-ivory-muted max-w-md mx-auto">
            كن أول طالب يشارك ملخصه المميز في هذا الكورس واحصل على المركز الأول على لوحة الشرف!
          </p>
          <Link
            to={activeCourseId ? `/courses/${activeCourseId}/summaries` : '/summaries'}
          >
            <Button variant="primary" size="sm">
              إضافة ملخص جديد
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* ── Top 3 Podium Diagram ────────────────────────────────────── */}
          {topThree.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ivory flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-gold-400" />
                  أبطال المنصة (المراكز الثلاثة الأولى)
                </span>
                <span className="text-xs text-ivory-muted">مرتبة حسب مجموع التفاعل والنقاط</span>
              </div>

              {/* 3-Tier Podium (RTL: 2nd Place | 1st Place | 3rd Place) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
                {/* Second Place (🥈) */}
                {topThree[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="order-2 md:order-1 flex flex-col items-center w-full"
                  >
                    <div className="w-full rounded-2xl border-2 border-slate-300 dark:border-zinc-500/50 bg-gradient-to-b from-slate-100 to-white dark:bg-zinc-800/90 p-5 text-center relative overflow-hidden shadow-sm hover:-translate-y-1 transition-all">
                      <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-zinc-700 dark:text-zinc-100 border border-slate-300 dark:border-zinc-600 text-[10px] font-bold shadow-sm">
                        🥈 المركز الثاني
                      </div>
                      <div className="mt-4 flex flex-col items-center gap-2.5">
                        <div className="relative">
                          {topThree[1].studentPhoto ? (
                            <img
                              src={resolveMediaUrl(topThree[1].studentPhoto)}
                              alt=""
                              className="w-16 h-16 rounded-full border-2 border-slate-400 dark:border-zinc-400 object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-zinc-700 border-2 border-slate-300 dark:border-zinc-600 text-slate-800 dark:text-zinc-200 flex items-center justify-center font-bold text-lg">
                              {topThree[1].studentName?.charAt(0) || 'ط'}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-slate-200 dark:bg-zinc-700 border border-slate-300 dark:border-zinc-500 text-slate-800 dark:text-zinc-200 flex items-center justify-center text-xs font-bold shadow-sm">
                            🥈
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{topThree[1].studentName}</h4>
                          <p className="text-[11px] text-ivory-muted truncate max-w-[200px] mt-0.5">
                            {topThree[1].title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold pt-2 border-t border-slate-200 dark:border-zinc-700 w-full justify-center text-ivory-muted">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300 font-bold">
                            <MessageCircle className="w-3.5 h-3.5 text-sky-500" />
                            {topThree[1].commentsCount} تعليق
                          </span>
                          <span className="text-slate-900 dark:text-zinc-100 flex items-center gap-1 font-black">
                            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                            {topThree[1].score ?? topThree[1].commentsCount * 5 + 10} نقطة
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pedestal Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 80 }}
                      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                      className="hidden md:flex w-full rounded-t-2xl border-t-2 border-x-2 border-slate-400 dark:border-zinc-500/40 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100 dark:from-zinc-600/50 dark:via-zinc-700/40 dark:to-zinc-800/30 flex-col items-center justify-between pt-2 pb-1 mt-1 shadow-inner"
                    >
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">المركز الثاني</span>
                      <span className="text-3xl font-black text-slate-600 dark:text-zinc-400 opacity-40">#2</span>
                    </motion.div>
                  </motion.div>
                )}

                {/* First Place (Champion) (🥇) */}
                {topThree[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.0, duration: 0.4 }}
                    className="order-1 md:order-2 flex flex-col items-center w-full z-10"
                  >
                    <div className="w-full rounded-2xl border-2 border-amber-400 ring-2 ring-amber-400/40 dark:ring-amber-400/30 bg-gradient-to-b from-amber-50 via-white to-amber-50/40 dark:bg-amber-500/15 p-6 text-center relative overflow-hidden shadow-lg shadow-amber-500/10 dark:shadow-gold-glow hover:-translate-y-1 transition-all">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                        👑
                      </div>
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-200 text-amber-950 dark:bg-amber-500/30 dark:text-amber-200 border border-amber-400 text-xs font-black flex items-center gap-1 shadow-sm">
                        <Crown className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
                        🥇 المركز الأول
                      </div>
                      <div className="mt-4 flex flex-col items-center gap-2.5">
                        <div className="relative">
                          {topThree[0].studentPhoto ? (
                            <img
                              src={resolveMediaUrl(topThree[0].studentPhoto)}
                              alt=""
                              className="w-20 h-20 rounded-full border-2 border-amber-500 object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-500/20 border-2 border-amber-400 text-amber-950 dark:text-amber-200 flex items-center justify-center font-black text-2xl">
                              {topThree[0].studentName?.charAt(0) || 'ط'}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-md bg-amber-200 dark:bg-amber-500/30 text-amber-950 dark:text-amber-200 border border-amber-400 flex items-center justify-center text-sm font-bold shadow-sm">
                            👑
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-black text-amber-950 dark:text-amber-100">{topThree[0].studentName}</h4>
                          <p className="text-xs text-ivory-muted truncate max-w-[220px] mt-0.5 font-medium">
                            {topThree[0].title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold pt-3 border-t border-amber-200 dark:border-amber-500/30 w-full justify-center text-ivory-muted">
                          <span className="flex items-center gap-1 text-amber-900 dark:text-amber-200 font-bold">
                            <MessageCircle className="w-3.5 h-3.5 text-sky-500" />
                            {topThree[0].commentsCount} تعليق
                          </span>
                          <span className="text-amber-900 dark:text-amber-300 flex items-center gap-1 font-black">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-gold-400" />
                            {topThree[0].score ?? topThree[0].commentsCount * 5 + 10} نقطة
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pedestal Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 120 }}
                      transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                      className="hidden md:flex w-full rounded-t-2xl border-t-2 border-x-2 border-amber-400 dark:border-amber-400/40 bg-gradient-to-b from-amber-300 via-amber-200 to-amber-100 dark:from-amber-500/40 dark:via-amber-600/25 dark:to-amber-700/15 flex-col items-center justify-between pt-2 pb-1 mt-1 shadow-inner"
                    >
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">البطل الأول</span>
                      <span className="text-4xl font-black text-amber-800 dark:text-amber-300 opacity-40">#1</span>
                    </motion.div>
                  </motion.div>
                )}

                {/* Third Place (🥉) */}
                {topThree[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="order-3 flex flex-col items-center w-full"
                  >
                    <div className="w-full rounded-2xl border-2 border-orange-300 dark:border-orange-500/50 bg-gradient-to-b from-orange-50 via-white to-orange-50/40 dark:bg-orange-900/20 p-5 text-center relative overflow-hidden shadow-sm hover:-translate-y-1 transition-all">
                      <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-orange-200 text-orange-900 dark:bg-orange-600/30 dark:text-orange-200 border border-orange-300 text-[10px] font-bold shadow-sm">
                        🥉 المركز الثالث
                      </div>
                      <div className="mt-4 flex flex-col items-center gap-2.5">
                        <div className="relative">
                          {topThree[2].studentPhoto ? (
                            <img
                              src={resolveMediaUrl(topThree[2].studentPhoto)}
                              alt=""
                              className="w-16 h-16 rounded-full border-2 border-orange-400 object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-800/30 border-2 border-orange-300 text-orange-900 dark:text-orange-200 flex items-center justify-center font-bold text-lg">
                              {topThree[2].studentName?.charAt(0) || 'ط'}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md bg-orange-200 dark:bg-orange-700/30 border border-orange-300 text-orange-900 dark:text-orange-200 flex items-center justify-center text-xs font-bold shadow-sm">
                            🥉
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-orange-950 dark:text-orange-100">{topThree[2].studentName}</h4>
                          <p className="text-[11px] text-ivory-muted truncate max-w-[200px] mt-0.5">
                            {topThree[2].title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold pt-2 border-t border-orange-200 dark:border-orange-700 w-full justify-center text-ivory-muted">
                          <span className="flex items-center gap-1 text-orange-800 dark:text-orange-300 font-bold">
                            <MessageCircle className="w-3.5 h-3.5 text-sky-500" />
                            {topThree[2].commentsCount} تعليق
                          </span>
                          <span className="text-orange-950 dark:text-orange-200 flex items-center gap-1 font-black">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {topThree[2].score ?? topThree[2].commentsCount * 5 + 10} نقطة
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pedestal Bar */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 55 }}
                      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                      className="hidden md:flex w-full rounded-t-2xl border-t-2 border-x-2 border-orange-300 dark:border-orange-500/35 bg-gradient-to-b from-orange-300 via-orange-200 to-orange-100 dark:from-orange-600/35 dark:via-orange-700/25 dark:to-orange-800/15 flex-col items-center justify-between pt-2 pb-1 mt-1 shadow-inner"
                    >
                      <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300">المركز الثالث</span>
                      <span className="text-3xl font-black text-orange-700 dark:text-orange-400 opacity-40">#3</span>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* ─── Animated Diagram Comparison for Top 3 ─── */}
              {topThree.length > 1 && (
                <div className="rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-ivory flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>مخطط المقارنة البياني والتفاعل (Diagram)</span>
                    </h4>
                    <span className="text-[11px] text-ivory-muted">نسبة النقاط والمشاركات</span>
                  </div>

                  <div className="space-y-2.5">
                    {topThree.map((item, idx) => {
                      const score = item.score ?? item.commentsCount * 5 + 10;
                      const maxScore = Math.max(1, topThree[0]?.score ?? topThree[0]?.commentsCount * 5 + 10);
                      const pct = Math.min(100, Math.round((score / maxScore) * 100));
                      const barColor =
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                          : idx === 1
                          ? 'bg-gradient-to-r from-slate-400 to-slate-300'
                          : 'bg-gradient-to-r from-orange-500 to-orange-400';
                      return (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-ivory flex items-center gap-1.5">
                              <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                              <span className="truncate max-w-[150px] sm:max-w-xs">{item.studentName}</span>
                            </span>
                            <span className="font-black text-ivory tabular-nums">
                              {score} نقطة <span className="font-normal text-[10px] text-ivory-muted">({item.commentsCount} تعليق)</span>
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-surface-alt overflow-hidden border border-surface-border">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(12, pct)}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + idx * 0.12, ease: 'easeOut' }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Full Professional Ranking Table ────────────────────────── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm sm:text-base font-bold text-ivory flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-600 dark:text-gold-400" />
                الترتيب العام للملخصات
              </h2>
              <span className="text-xs text-ivory-muted">مرتبة حسب مجموع النقاط والتفاعل</span>
            </div>

            <div className="rounded-2xl border border-surface-border bg-surface-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-alt/70 text-[11px] font-bold text-ivory-muted uppercase tracking-wider">
                      <th className="py-3.5 px-4 text-center w-16">الترتيب</th>
                      <th className="py-3.5 px-4">الطالب</th>
                      <th className="py-3.5 px-4">عنوان الملخص</th>
                      <th className="py-3.5 px-4 text-center">التعليقات</th>
                      <th className="py-3.5 px-4 text-center">الإعجابات</th>
                      <th className="py-3.5 px-4 text-center">النقاط الإجمالية</th>
                      <th className="py-3.5 px-4 text-left">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-xs">
                    {remainingList.map((entry) => {
                      const isTop1 = entry.rank === 1;
                      const isTop2 = entry.rank === 2;
                      const isTop3 = entry.rank === 3;
                      const calculatedScore = entry.score ?? entry.commentsCount * 5 + 10;

                      return (
                        <tr
                          key={entry.id}
                          className="transition-colors duration-150 hover:bg-surface-alt/60"
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-bold text-xs ${
                                isTop1
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                                  : isTop2
                                  ? 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-700/30 dark:text-slate-200 dark:border-slate-600/40'
                                  : isTop3
                                  ? 'bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-600/15 dark:text-orange-300 dark:border-orange-600/25'
                                  : 'bg-surface-alt border border-surface-border text-ivory-muted'
                              }`}
                            >
                              {entry.rank}
                            </span>
                          </td>

                          {/* Student */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {entry.studentPhoto ? (
                                <img
                                  src={resolveMediaUrl(entry.studentPhoto)}
                                  alt=""
                                  className="w-8 h-8 rounded-full border border-surface-border object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-surface-alt border border-surface-border text-amber-800 dark:text-gold-300 flex items-center justify-center font-bold text-xs">
                                  {entry.studentName?.charAt(0) || 'ط'}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-ivory">{entry.studentName}</p>
                                {isTop1 && (
                                  <span className="text-[9px] font-bold text-amber-700 dark:text-gold-300">👑 متصدر الكورس</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Summary Title */}
                          <td className="py-3.5 px-4">
                            <Link
                              to={activeCourseId ? `/courses/${activeCourseId}/summaries/${entry.id}` : '#'}
                              className="font-bold text-ivory hover:text-amber-700 dark:hover:text-gold-300 transition-colors line-clamp-1 max-w-xs"
                            >
                              {entry.title}
                            </Link>
                          </td>

                          {/* Comments */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-ivory-muted">
                              <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                              {entry.commentsCount}
                            </span>
                          </td>

                          {/* Likes */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-ivory-muted">
                              <Heart className="w-3.5 h-3.5 text-red-400" />
                              {entry.likesCount ?? 0}
                            </span>
                          </td>

                          {/* Score */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
                                isTop1
                                  ? 'bg-amber-100/90 border-amber-300 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/25 dark:text-gold-300'
                                  : 'bg-surface-alt border-surface-border text-ivory'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-amber-600 dark:text-gold-400" />
                              {calculatedScore}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 text-left text-[11px] text-ivory-muted whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
