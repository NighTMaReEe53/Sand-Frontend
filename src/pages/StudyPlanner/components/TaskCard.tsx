import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  CheckCircle2,
  Circle,
  Clock,
  Pencil,
  Trash2,
  Timer,
  AlertTriangle,
  Sparkles,
  BookOpen,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import { StudyTask } from '../../../api/phase2.api';

interface TaskCardProps {
  task: StudyTask;
  columnId: string;
  onToggleComplete: (task: StudyTask) => void;
  onEdit: (task: StudyTask) => void;
  onDelete: (task: StudyTask) => void;
  onStartPomodoro?: (task: StudyTask) => void;
  isBusy?: boolean;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const getDayInfo = (dueDateStr: string, isCompleted: boolean) => {
  const due = startOfDay(new Date(dueDateStr));
  const today = startOfDay(new Date());
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  const timeStr = new Date(dueDateStr).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isCompleted) {
    return { text: 'منجزة', tone: 'text-emerald-400', isOverdue: false, timeStr };
  }
  if (diffDays === 0) {
    return { text: `اليوم ${timeStr}`, tone: 'text-gold-300', isOverdue: false, timeStr };
  }
  if (diffDays === 1) {
    return { text: `غداً ${timeStr}`, tone: 'text-sky-300', isOverdue: false, timeStr };
  }
  if (diffDays === -1) {
    return { text: `أمس — متأخرة`, tone: 'text-red-400', isOverdue: true, timeStr };
  }
  if (diffDays < 0) {
    return { text: `متأخرة ${Math.abs(diffDays)} يوم`, tone: 'text-red-400', isOverdue: true, timeStr };
  }
  if (diffDays <= 7) {
    return { text: `بعد ${diffDays} أيام (${timeStr})`, tone: 'text-ivory-muted', isOverdue: false, timeStr };
  }
  return {
    text: new Date(dueDateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
    tone: 'text-ivory-muted',
    isOverdue: false,
    timeStr,
  };
};

const getTaskTypeBadge = (task: StudyTask) => {
  const lowerTitle = (task.title + ' ' + (task.description || '')).toLowerCase();
  if (task.examId || lowerTitle.includes('امتحان') || lowerTitle.includes('اختبار') || lowerTitle.includes('exam')) {
    return { label: 'امتحان', icon: GraduationCap, color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' };
  }
  if (lowerTitle.includes('كويز') || lowerTitle.includes('quiz') || lowerTitle.includes('واجب')) {
    return { label: 'كويز / واجب', icon: HelpCircle, color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
  }
  if (task.lessonId || lowerTitle.includes('درس') || lowerTitle.includes('مذاكرة') || lowerTitle.includes('شرح')) {
    return { label: 'درس / محاضرة', icon: BookOpen, color: 'text-sky-300 bg-sky-500/10 border-sky-500/30' };
  }
  return { label: 'مهمة عامة', icon: Sparkles, color: 'text-gold-300 bg-gold-500/10 border-gold-500/30' };
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onStartPomodoro,
  isBusy,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const dayInfo = getDayInfo(task.dueDate, task.isCompleted);
  const typeBadge = getTaskTypeBadge(task);
  const TypeIcon = typeBadge.icon;

  const cardBorder = task.isCompleted
    ? 'border-emerald-500/25 bg-surface-card hover:border-emerald-500/40 shadow-sm'
    : dayInfo.isOverdue
    ? 'border-red-500/35 bg-surface-card hover:border-red-500/50 shadow-sm'
    : 'border-surface-border bg-surface-card hover:border-gold-500/35 shadow-sm hover:shadow-md';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-2xl border ${cardBorder} p-3 sm:p-3.5 transition-all duration-200 select-none ${
        isBusy ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Top Section: Drag handle + Badges + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1 -mr-1 text-ivory-muted/40 hover:text-gold-400 cursor-grab active:cursor-grabbing rounded hover:bg-surface transition-colors"
            title="اسحب لنقل المهمة"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {/* Type Badge */}
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border ${typeBadge.color}`}
          >
            <TypeIcon className="w-2.5 h-2.5" />
            {typeBadge.label}
          </span>
        </div>

        {/* Action icons — ظاهرة دائماً على كل الشاشات */}
        <div className="flex items-center gap-1 shrink-0">
          {onStartPomodoro && !task.isCompleted && (
            <button
              type="button"
              onClick={() => onStartPomodoro(task)}
              className="p-1.5 rounded-lg bg-surface border border-surface-border text-ivory-muted hover:text-amber-300 hover:border-amber-500/40 transition-colors"
              title="بدء مؤقت التركيز (بومودورو)"
            >
              <Timer className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg bg-surface border border-surface-border text-ivory-muted hover:text-gold-300 hover:border-gold-500/40 transition-colors"
            title="تعديل المهمة"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(task)}
            className="p-1.5 rounded-lg bg-surface border border-surface-border text-ivory-muted hover:text-red-400 hover:border-red-500/40 transition-colors"
            title="حذف المهمة"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content: Checkbox + Title + Description */}
      <div className="mt-2 flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className="mt-0.5 shrink-0 transition-transform active:scale-90 hover:scale-110"
          title={task.isCompleted ? 'تحديد كغير منجزة' : 'إكمال المهمة'}
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Circle className="w-4 h-4 text-gold-400/60 hover:text-gold-400 transition-colors" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-0.5">
          <h3
            className={`text-xs sm:text-sm font-bold leading-snug tracking-tight font-cairo ${
              task.isCompleted ? 'text-ivory-muted line-through opacity-70' : 'text-ivory'
            }`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="text-[10px] sm:text-[11px] text-ivory-muted line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer: Due date, Relative status, Pomodoro quick link */}
      <div className="mt-2.5 pt-2 border-t border-surface-border/50 flex items-center justify-between gap-2 text-[10px]">
        <span className={`inline-flex items-center gap-1 font-bold ${dayInfo.tone}`}>
          {dayInfo.isOverdue ? (
            <AlertTriangle className="w-3 h-3 text-red-400" />
          ) : (
            <Clock className="w-2.5 h-2.5 opacity-70" />
          )}
          {dayInfo.text}
        </span>

        {!task.isCompleted && (
          <button
            type="button"
            onClick={() => onStartPomodoro?.(task)}
            className="text-[9px] text-gold-400 hover:text-gold-300 font-bold flex items-center gap-1 hover:underline"
          >
            <Timer className="w-2.5 h-2.5" />
            بدء التركيز
          </button>
        )}
      </div>
    </div>
  );
};
