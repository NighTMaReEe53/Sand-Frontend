import React, { useState } from 'react';
import {
  X,
  Flame,
  Plus,
  PlayCircle,
  ClipboardList,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  GraduationCap,
  FileText,
  Award,
} from 'lucide-react';
import { useMyBacklogQuery } from '../../../hooks/queries/useBacklog';
import { BacklogItem } from '../../../types/backlog.types';
import { Button } from '../../../components/ui/Button';
import { studyPlannerApi } from '../../../api/phase2.api';
import { toast } from 'sonner';

interface SmartBacklogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskImported: () => void;
}

export const SmartBacklogDrawer: React.FC<SmartBacklogDrawerProps> = ({
  isOpen,
  onClose,
  onTaskImported,
}) => {
  const { data: backlogData, isLoading } = useMyBacklogQuery();
  const [importingId, setImportingId] = useState<string | null>(null);

  const items: BacklogItem[] = React.useMemo(() => {
    if (!backlogData?.courses) return [];
    return backlogData.courses.flatMap((c) => c.items);
  }, [backlogData]);

  if (!isOpen) return null;

  const handleImportToToday = async (item: BacklogItem) => {
    setImportingId(item.lessonId);
    try {
      const today = new Date();
      today.setHours(20, 0, 0, 0); // Scheduled for 8:00 PM today

      const titlePrefix = item.type === 'QUIZ' ? 'كويز: ' : 'درس: ';
      await studyPlannerApi.create({
        title: `${titlePrefix}${item.lessonTitle}`,
        description: `مستورد من الدروس المتأخرة · الدرس ${item.orderIndex}`,
        dueDate: today.toISOString(),
        courseId: item.courseId,
        lessonId: item.lessonId,
      });

      toast.success(`تمت إضافة "${item.lessonTitle}" إلى مهام اليوم.`);
      onTaskImported();
    } catch {
      toast.error('تعذر إضافة الدرس إلى المخطط.');
    } finally {
      setImportingId(null);
    }
  };

  const handleImportToTomorrow = async (item: BacklogItem) => {
    setImportingId(item.lessonId);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);

      const titlePrefix = item.type === 'QUIZ' ? 'كويز: ' : 'درس: ';
      await studyPlannerApi.create({
        title: `${titlePrefix}${item.lessonTitle}`,
        description: `مستورد من الدروس المتأخرة · الدرس ${item.orderIndex}`,
        dueDate: tomorrow.toISOString(),
        courseId: item.courseId,
        lessonId: item.lessonId,
      });

      toast.success(`تمت إضافة "${item.lessonTitle}" إلى المهام القادمة (غداً)! 📅`);
      onTaskImported();
    } catch {
      toast.error('تعذر إضافة الدرس إلى المخطط.');
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-bg-base/80 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-full sm:max-w-md bg-surface-card border-r border-surface-border shadow-sm h-full flex flex-col relative z-50 text-right animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-surface-border/80 flex items-center justify-between gap-3 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ivory font-cairo">
                المتأخرات والدروس غير المكتملة
              </h2>
              <p className="text-[11px] text-ivory-muted">
                استورد دروسك وكويزاتك بنقرة واحدة لجدولتها فوراً في خطتك اليومية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-ivory-muted hover:text-ivory hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-ivory-muted">
              <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
              <span className="text-xs">جاري فحص الدروس والكويزات المتبقية...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-ivory">لا توجد دروس أو كويزات متأخرة!</h3>
              <p className="text-xs text-ivory-muted max-w-xs mx-auto">
                أنت ملتزم تماماً بمشاهدة كافة الدروس والاختبارات في كورساتك المسجل بها.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isQuiz = item.type === 'QUIZ';
              const isHomework = item.type === 'HOMEWORK';
              const isExam = item.type === 'EXAM';
              const isBusy = importingId === item.lessonId;

              return (
                <div
                  key={`${item.courseId}-${item.lessonId}-${item.type}`}
                  className="p-3.5 rounded-2xl bg-surface/80 border border-surface-border hover:border-gold-500/30 transition-all space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`p-2 rounded-xl shrink-0 border ${
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
                        <ClipboardList className="w-4 h-4" />
                      ) : isHomework ? (
                        <FileText className="w-4 h-4" />
                      ) : isExam ? (
                        <Award className="w-4 h-4" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            isQuiz
                              ? 'text-purple-300 bg-purple-500/10 border-purple-500/30'
                              : isHomework
                              ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30'
                              : isExam
                              ? 'text-violet-300 bg-violet-500/10 border-violet-500/30'
                              : 'text-gold-400 bg-gold-500/10 border-gold-500/30'
                          }`}
                        >
                          {isQuiz ? 'كويز' : isHomework ? 'واجب' : isExam ? 'امتحان' : 'درس فيديو'}
                        </span>
                        {item.overdue && (
                          <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                            متأخر
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-ivory mt-1 leading-snug">
                        {item.orderIndex > 0 ? `الدرس ${item.orderIndex} · ` : ''}{item.lessonTitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions for this item */}
                  <div className="flex items-center gap-2 pt-1 border-t border-surface-border/40">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleImportToToday(item)}
                      disabled={isBusy}
                      className="text-xs py-1.5 flex-1"
                      leftIcon={
                        isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      جدولة لليوم
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImportToTomorrow(item)}
                      disabled={isBusy}
                      className="text-xs py-1.5 flex-1"
                      leftIcon={<Clock className="w-3.5 h-3.5" />}
                    >
                      جدولة للغد
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
