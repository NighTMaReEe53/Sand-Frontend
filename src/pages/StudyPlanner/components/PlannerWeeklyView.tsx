import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { StudyTask } from '../../../api/phase2.api';
import { Button } from '../../../components/ui/Button';

interface PlannerWeeklyViewProps {
  tasks: StudyTask[];
  onToggleComplete: (task: StudyTask) => void;
  onEdit: (task: StudyTask) => void;
  onDelete: (task: StudyTask) => void;
  onQuickAddDate: (date: Date) => void;
}

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const PlannerWeeklyView: React.FC<PlannerWeeklyViewProps> = ({
  tasks,
  onToggleComplete,
  onEdit,
  onQuickAddDate,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMobileDayIndex, setSelectedMobileDayIndex] = useState(() => {
    const todayIndex = new Date().getDay();
    return todayIndex;
  });

  // Generate 7 days for current week offset
  const weekDays = useMemo(() => {
    const days = [];
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek + weekOffset * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekOffset]);

  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const getTasksForDay = (d: Date) => {
    return tasks.filter((t) => {
      const taskDate = new Date(t.dueDate);
      return (
        taskDate.getDate() === d.getDate() &&
        taskDate.getMonth() === d.getMonth() &&
        taskDate.getFullYear() === d.getFullYear()
      );
    });
  };

  const selectedDay = weekDays[selectedMobileDayIndex] || weekDays[0];
  const selectedDayTasks = getTasksForDay(selectedDay);

  return (
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface-card border border-surface-border shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gold-400" />
          <span className="text-xs sm:text-sm font-bold text-ivory">
            الجدول الأسبوعي (
            {weekDays[0].toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} —{' '}
            {weekDays[6].toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })})
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="text-xs p-1.5 h-8"
            title="الأسبوع السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="text-xs px-2.5 h-8"
          >
            الأسبوع الحالي
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="text-xs p-1.5 h-8"
            title="الأسبوع التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Mobile Day Tabs (< md) ────────────────────────────── */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {weekDays.map((day, idx) => {
          const count = getTasksForDay(day).length;
          const active = selectedMobileDayIndex === idx;
          const today = isToday(day);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedMobileDayIndex(idx)}
              className={`flex-1 min-w-[70px] p-2 rounded-xl border text-center transition-all ${
                active
                  ? 'bg-gold-500 text-bg-base border-gold-400 font-bold shadow-sm'
                  : today
                  ? 'bg-gold-500/10 text-gold-300 border-gold-500/30'
                  : 'bg-surface-card text-ivory-muted border-surface-border'
              }`}
            >
              <p className="text-[10px] truncate font-cairo">{ARABIC_DAYS[day.getDay()]}</p>
              <p className="text-xs font-bold font-display mt-0.5">{day.getDate()}</p>
              {count > 0 && (
                <span
                  className={`inline-block text-[9px] px-1.5 rounded-full mt-0.5 font-bold ${
                    active ? 'bg-bg-base text-gold-300' : 'bg-gold-500/20 text-gold-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Mobile Selected Day Content (< md) ────────────────── */}
      <div className="block md:hidden p-4 rounded-2xl bg-surface-card border border-surface-border space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border/50">
          <div>
            <h3 className="text-sm font-bold text-ivory">
              {ARABIC_DAYS[selectedDay.getDay()]} (
              {selectedDay.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })})
            </h3>
            <span className="text-[10px] text-ivory-muted">{selectedDayTasks.length} مهام مسجلة</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickAddDate(selectedDay)}
            className="text-xs py-1 px-2.5"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            إضافة مهمة
          </Button>
        </div>

        <div className="space-y-2">
          {selectedDayTasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 ${
                task.isCompleted
                  ? 'border-emerald-500/20 bg-emerald-500/5 opacity-75'
                  : 'border-surface-border bg-surface'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleComplete(task)}
                className="mt-0.5 shrink-0"
              >
                {task.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-gold-400/60" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  onClick={() => onEdit(task)}
                  className={`text-xs font-bold cursor-pointer hover:text-gold-300 truncate ${
                    task.isCompleted ? 'text-ivory-muted line-through' : 'text-ivory'
                  }`}
                >
                  {task.title}
                </p>
                <span className="text-[10px] text-ivory-muted flex items-center gap-1 mt-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(task.dueDate).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {selectedDayTasks.length === 0 && (
            <div className="py-8 text-center text-ivory-muted space-y-1">
              <Sparkles className="w-5 h-5 mx-auto text-gold-400/40" />
              <p className="text-xs font-bold">لا توجد مهام مسجلة لهذا اليوم</p>
              <button
                type="button"
                onClick={() => onQuickAddDate(selectedDay)}
                className="text-xs text-gold-400 hover:underline pt-1 inline-block"
              >
                + انقر لإضافة مهمة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop & Tablet 7-Days Grid (>= md) ──────────────── */}
      <div className="hidden md:grid md:grid-cols-7 gap-2.5 lg:gap-3">
        {weekDays.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const activeToday = isToday(day);

          return (
            <div
              key={idx}
              className={`rounded-2xl border flex flex-col min-h-[290px] transition-all shadow-sm ${
                activeToday
                  ? 'border-gold-400/50 bg-gold-500/[0.02]'
                  : 'border-surface-border bg-surface-card/60'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-2.5 border-b rounded-t-2xl flex items-center justify-between gap-1.5 ${
                  activeToday ? 'bg-gold-500/10 border-gold-500/20' : 'border-surface-border/60 bg-surface/50'
                }`}
              >
                <div>
                  <p
                    className={`text-xs font-bold font-cairo ${
                      activeToday ? 'text-gold-300' : 'text-ivory'
                    }`}
                  >
                    {ARABIC_DAYS[day.getDay()]}
                  </p>
                  <p className="text-[10px] text-ivory-muted">
                    {day.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onQuickAddDate(day)}
                  className="p-1 rounded-lg text-ivory-muted hover:text-gold-400 hover:bg-gold-500/10 transition-colors"
                  title="إضافة مهمة لهذا اليوم"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tasks in this day */}
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[300px] custom-scrollbar">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-2 rounded-xl border text-right transition-all group ${
                      task.isCompleted
                        ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70'
                        : 'border-surface-border bg-surface hover:border-gold-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleComplete(task)}
                        className="mt-0.5 shrink-0"
                      >
                        {task.isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-gold-400/60 group-hover:text-gold-400" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          onClick={() => onEdit(task)}
                          className={`text-xs font-bold cursor-pointer hover:text-gold-300 truncate ${
                            task.isCompleted ? 'text-ivory-muted line-through' : 'text-ivory'
                          }`}
                        >
                          {task.title}
                        </p>
                        <span className="text-[9px] text-ivory-muted flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(task.dueDate).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {dayTasks.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-center text-ivory-muted/40">
                    <span className="text-[10px]">فارغ</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
