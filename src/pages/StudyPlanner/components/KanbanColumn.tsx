import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Sparkles, Flame, PlayCircle, ClipboardList, Clock, ArrowLeft, FileText, Award } from 'lucide-react';
import { StudyTask } from '../../../api/phase2.api';
import { TaskCard } from './TaskCard';
import { BacklogItem } from '../../../types/backlog.types';

export interface ColumnDefinition {
  id: string; // 'overdue' | 'today' | 'upcoming' | 'completed'
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: 'danger' | 'gold' | 'sky' | 'emerald';
  badgeColor: string;
  headerBorder: string;
}

interface KanbanColumnProps {
  column: ColumnDefinition;
  tasks: StudyTask[];
  onToggleComplete: (task: StudyTask) => void;
  onEdit: (task: StudyTask) => void;
  onDelete: (task: StudyTask) => void;
  onQuickAdd: (columnId: string) => void;
  onStartPomodoro?: (task: StudyTask) => void;
  busyTaskId?: string | null;
  overdueBacklogItems?: BacklogItem[];
  onImportBacklogItem?: (item: BacklogItem) => void;
  isImportingBacklog?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onQuickAdd,
  onStartPomodoro,
  busyTaskId,
  overdueBacklogItems = [],
  onImportBacklogItem,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });

  const taskIds = tasks.map((t) => t.id);
  const isOverdueCol = column.id === 'overdue';
  const totalCount = tasks.length + (isOverdueCol ? overdueBacklogItems.length : 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-3xl border transition-all duration-200 min-h-[460px] shadow-sm ${
        isOver
          ? 'border-gold-400 bg-gold-500/[0.03] ring-1 ring-gold-400/30'
          : isOverdueCol && totalCount > 0
          ? 'border-red-500/30 bg-surface/40'
          : 'border-surface-border bg-surface/40'
      }`}
    >
      {/* Column Header */}
      <div
        className={`p-3.5 border-b rounded-t-3xl flex items-center justify-between gap-3 ${column.headerBorder} bg-surface-card/60`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-surface border border-surface-border text-ivory">
            {column.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-ivory font-cairo tracking-wide">
                {column.title}
              </h2>
              <span
                className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${column.badgeColor} tabular-nums`}
              >
                {totalCount}
              </span>
            </div>
            <p className="text-[10px] text-ivory-muted mt-0.5">{column.subtitle}</p>
          </div>
        </div>

        {/* Quick Add Button in header */}
        {column.id !== 'completed' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(column.id);
            }}
            className="p-1.5 rounded-xl bg-surface hover:bg-gold-500/10 text-ivory-muted hover:text-gold-300 border border-surface-border hover:border-gold-500/30 transition-all cursor-pointer relative z-10 active:scale-95"
            title={`إضافة مهمة إلى ${column.title}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-290px)] custom-scrollbar">
        {/* Planned Tasks */}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onStartPomodoro={onStartPomodoro}
              isBusy={busyTaskId === task.id}
            />
          ))}
        </SortableContext>

        {/* ── Automatic Overdue Backlog Lessons & Quizzes (Shown in Overdue Column) ── */}
        {isOverdueCol && overdueBacklogItems.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-red-500/20">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400 animate-pulse" />
                متأخرات المنصة (دروس، كويزات، واجبات، امتحانات) ({overdueBacklogItems.length})
              </span>
            </div>

            {overdueBacklogItems.map((item) => {
              const isQuiz = item.type === 'QUIZ';
              const isHomework = item.type === 'HOMEWORK';
              const isExam = item.type === 'EXAM';
              return (
                <div
                  key={`backlog-${item.courseId}-${item.lessonId}-${item.type}`}
                  className="p-3 rounded-2xl bg-surface-card border border-red-500/30 hover:border-red-500/50 transition-all space-y-2 text-right shadow-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`p-1.5 rounded-xl shrink-0 border ${
                        isQuiz
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          : isHomework
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                          : isExam
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                          : 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                      }`}
                    >
                      {isQuiz ? (
                        <ClipboardList className="w-3.5 h-3.5" />
                      ) : isHomework ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : isExam ? (
                        <Award className="w-3.5 h-3.5" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                            isQuiz
                              ? 'text-purple-300 bg-purple-500/10 border-purple-500/30'
                              : isHomework
                              ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30'
                              : isExam
                              ? 'text-violet-300 bg-violet-500/10 border-violet-500/30'
                              : 'text-gold-400 bg-gold-500/10 border-gold-500/30'
                          }`}
                        >
                          {isQuiz ? 'كويز متأخر' : isHomework ? 'واجب لم يُحل' : isExam ? 'امتحان متأخر' : 'درس متأخر'}
                        </span>
                        <span className="text-[8px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20">
                          متأخر
                        </span>
                      </div>
                      <p className="text-xs font-bold text-ivory mt-0.5 truncate leading-snug">
                        الدرس {item.orderIndex} · {item.lessonTitle}
                      </p>
                      <p className="text-[9px] text-ivory-muted truncate">{item.courseTitle}</p>
                    </div>
                  </div>

                  {/* 1-Click Import button */}
                  {onImportBacklogItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onImportBacklogItem(item);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-xl bg-gold-500/10 border border-gold-500/25 hover:bg-gold-500/20 text-gold-300 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-gold-400" />
                      <span>إضافة لجدول اليوم</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="py-10 px-3 text-center rounded-2xl border border-dashed border-surface-border/70 bg-surface/20 flex flex-col items-center justify-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-surface-card border border-surface-border flex items-center justify-center text-ivory-muted/50">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-ivory-muted">لا توجد مهام هنا</p>
            <p className="text-[9px] text-ivory-muted/70 max-w-[170px]">
              {column.id === 'completed'
                ? 'اسحب المهام المنجزة إلى هنا!'
                : column.id === 'overdue'
                ? 'رائع! لا توجد أي مهام أو كويزات متأخرة.'
                : 'اسحب المهام إلى هذا العمود أو انقر + للإضافة.'}
            </p>

            {column.id !== 'completed' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAdd(column.id);
                }}
                className="mt-1 text-[11px] font-bold text-gold-400 hover:text-gold-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                إضافة مهمة
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
