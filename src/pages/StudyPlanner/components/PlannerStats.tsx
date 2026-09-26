import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  Clock,
  Sparkles,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PlannerStatsProps {
  stats: {
    total: number;
    open: number;
    done: number;
    overdue: number;
    todayCount: number;
    upcomingCount: number;
    percent: number;
  };
  hasNotificationPermission: boolean;
  onRequestNotification: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenBacklogDrawer: () => void;
  backlogCount?: number;
}

export const PlannerStats: React.FC<PlannerStatsProps> = ({
  stats,
  hasNotificationPermission,
  onRequestNotification,
  soundEnabled,
  onToggleSound,
  onOpenBacklogDrawer,
  backlogCount = 0,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Banner / Quick Control Bar with Small Subtle Shadow */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-surface-border relative overflow-hidden shadow-sm">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gold-500/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          {/* Motivation Title & Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-cairo">
                المخطط الدراسي الذكي
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-amiri text-ivory flex items-center gap-2">
              {stats.overdue > 0 ? (
                <>
                  <span className="text-red-400">تنبيه:</span> لديك مهام متأخرة تحتاج لإنجازها.
                </>
              ) : stats.percent === 100 && stats.total > 0 ? (
                <>
                  <Sparkles className="w-5 h-5 text-gold-400" />
                  أداء رائع! أتممت جميع مهامك بنجاح.
                </>
              ) : (
                <>
                  نظّم يومك الدراسي وتابع إنجازك خطوة بخطوة.
                </>
              )}
            </h2>
            <p className="text-xs text-ivory-muted max-w-xl">
              اسحب المهام بين الأعمدة لتحديث مواعيدها، أو استورد الكويزات والدروس المتأخرة بنقرة واحدة.
            </p>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            {backlogCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenBacklogDrawer}
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs py-1.5 shadow-sm"
                leftIcon={<Flame className="w-3.5 h-3.5 text-amber-400" />}
              >
                المتأخرات ({backlogCount})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSound}
              className={`text-xs py-1.5 shadow-sm ${
                soundEnabled ? 'text-gold-300 border-gold-500/30' : 'text-ivory-muted border-surface-border'
              }`}
              leftIcon={soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-gold-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تفعيل المؤثرات الصوتية'}
            >
              {soundEnabled ? 'الصوت مفعّل' : 'صامت'}
            </Button>

            <Button
              variant={hasNotificationPermission ? 'outline' : 'primary'}
              size="sm"
              onClick={onRequestNotification}
              className="text-xs py-1.5 shadow-sm"
              leftIcon={
                hasNotificationPermission ? (
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-gold-400" />
                )
              }
            >
              {hasNotificationPermission ? 'التنبيهات مفعلة' : 'تفعيل التنبيهات'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3.5 border-t border-surface-border/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-ivory font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
              معدل الإنجاز العام
            </span>
            <span className="font-bold text-gold-300 font-display">
              {stats.done} من {stats.total} مهمة ({stats.percent}%)
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-surface border border-surface-border/80 overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.percent}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                stats.percent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-gold-500 to-emerald-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Grid of 4 Key Stats Cards with Small Shadows */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today Card */}
        <motion.div
          whileHover={{ y: -1.5 }}
          className="p-3.5 rounded-2xl bg-surface-card border border-gold-500/25 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="p-1.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <CalendarDays className="w-4 h-4" />
            </span>
            <span className="text-xl font-black font-display text-gold-300 tabular-nums">
              {stats.todayCount}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-bold text-ivory">مهام اليوم</p>
          <p className="text-[10px] text-ivory-muted">المطلوبة لليوم</p>
        </motion.div>

        {/* Overdue Card */}
        <motion.div
          whileHover={{ y: -1.5 }}
          className={`p-3.5 rounded-2xl bg-surface-card border shadow-sm hover:shadow-md transition-all ${
            stats.overdue > 0 ? 'border-red-500/35 bg-red-500/[0.02]' : 'border-surface-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`p-1.5 rounded-xl border ${
                stats.overdue > 0
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-surface/50 text-ivory-muted border-surface-border'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span
              className={`text-xl font-black font-display tabular-nums ${
                stats.overdue > 0 ? 'text-red-400' : 'text-ivory-muted'
              }`}
            >
              {stats.overdue}
            </span>
          </div>
          <p className={`mt-1.5 text-xs font-bold ${stats.overdue > 0 ? 'text-red-300' : 'text-ivory'}`}>
            المتأخرات
          </p>
          <p className="text-[10px] text-ivory-muted">
            {stats.overdue > 0 ? 'تحتاج للمتابعة' : 'لا توجد متأخرات'}
          </p>
        </motion.div>

        {/* Upcoming Card */}
        <motion.div
          whileHover={{ y: -1.5 }}
          className="p-3.5 rounded-2xl bg-surface-card border border-surface-border shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Clock className="w-4 h-4" />
            </span>
            <span className="text-xl font-black font-display text-sky-300 tabular-nums">
              {stats.upcomingCount}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-bold text-ivory">المهام القادمة</p>
          <p className="text-[10px] text-ivory-muted">الأيام القادمة</p>
        </motion.div>

        {/* Completed Card */}
        <motion.div
          whileHover={{ y: -1.5 }}
          className="p-3.5 rounded-2xl bg-surface-card border border-emerald-500/25 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <span className="text-xl font-black font-display text-emerald-400 tabular-nums">
              {stats.done}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-bold text-ivory">المهام المنجزة</p>
          <p className="text-[10px] text-ivory-muted">أحسنت الاستمرار.</p>
        </motion.div>
      </div>
    </div>
  );
};
