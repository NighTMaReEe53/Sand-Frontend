import React, { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  LayoutGrid,
  Calendar as CalendarIcon,
  ListFilter,
  Search,
  Flame,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { studyPlannerApi, StudyTask } from '../../api/phase2.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { useMyBacklogQuery } from '../../hooks/queries/useBacklog';
import { BacklogItem } from '../../types/backlog.types';

import { usePlannerNotifications } from './usePlannerAudioAndNotifications';
import { PlannerStats } from './components/PlannerStats';
import { KanbanColumn, ColumnDefinition } from './components/KanbanColumn';
import { TaskCard } from './components/TaskCard';
import { SmartBacklogDrawer } from './components/SmartBacklogDrawer';
import { FocusPomodoroModal } from './components/FocusPomodoroModal';
import { PlannerWeeklyView } from './components/PlannerWeeklyView';

type ViewMode = 'kanban' | 'weekly' | 'list';

const COLUMNS: ColumnDefinition[] = [
  {
    id: 'overdue',
    title: 'المتأخرات',
    subtitle: 'مهام ودروس وكويزات متأخرة',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
    tone: 'danger',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    headerBorder: 'border-b-red-500/20',
  },
  {
    id: 'today',
    title: 'مهام اليوم',
    subtitle: 'خطتك المطلوب إنجازها اليوم',
    icon: <CalendarDays className="w-3.5 h-3.5 text-gold-400" />,
    tone: 'gold',
    badgeColor: 'text-gold-300 bg-gold-500/10 border-gold-500/30',
    headerBorder: 'border-b-gold-500/20',
  },
  {
    id: 'upcoming',
    title: 'المهام القادمة',
    subtitle: 'المهام المجدولة للأيام القادمة',
    icon: <Clock className="w-3.5 h-3.5 text-sky-400" />,
    tone: 'sky',
    badgeColor: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    headerBorder: 'border-b-sky-500/20',
  },
  {
    id: 'completed',
    title: 'المكتملة',
    subtitle: 'المهام التي تم إنجازها بنجاح',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    tone: 'emerald',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    headerBorder: 'border-b-emerald-500/20',
  },
];

export const StudyPlannerPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Notifications and sound synthesizers
  const {
    permission,
    requestPermission,
    soundEnabled,
    setSoundEnabled,
    playSuccess,
    playPop,
  } = usePlannerNotifications();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [mobileKanbanFilter, setMobileKanbanFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [backlogDrawerOpen, setBacklogDrawerOpen] = useState(false);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [taskToDelete, setTaskToDelete] = useState<StudyTask | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [pomodoroTask, setPomodoroTask] = useState<StudyTask | null>(null);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);

  const [activeDragTask, setActiveDragTask] = useState<StudyTask | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['study-planner'],
    queryFn: () => studyPlannerApi.getPlanner({ daysAhead: 30 }),
  });

  const { data: backlogData } = useMyBacklogQuery();

  const invalidate = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['study-planner'] }),
      queryClient.invalidateQueries({ queryKey: ['my-backlog'] }),
    ]);
  }, [queryClient]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#10B981', '#38BDF8', '#F59E0B', '#A855F7'],
      });
    } catch {
      // Ignore
    }
  };

  // Backlog items from enrolled courses (all uncompleted lessons/quizzes)
  const allBacklogItems: BacklogItem[] = useMemo(() => {
    if (!backlogData?.courses) return [];
    return backlogData.courses.flatMap((c) => c.items);
  }, [backlogData]);

  const backlogCount = backlogData?.totalItems ?? allBacklogItems.length;

  // Import a backlog item directly into Study Planner for today
  const handleImportBacklogItem = async (item: BacklogItem) => {
    try {
      const today = new Date();
      today.setHours(20, 0, 0, 0);

      const titlePrefix = item.type === 'QUIZ' ? 'كويز: ' : 'درس: ';
      await studyPlannerApi.create({
        title: `${titlePrefix}${item.lessonTitle}`,
        description: `مستورد من ${item.courseTitle} · الدرس ${item.orderIndex}`,
        dueDate: today.toISOString(),
        courseId: item.courseId,
        lessonId: item.lessonId,
      });

      playSuccess();
      toast.success(`تمت إضافة "${item.lessonTitle}" لمهام اليوم.`);
      await invalidate();
    } catch {
      toast.error('تعذر إضافة المهمة إلى المخطط.');
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return { today: [], upcoming: [], overdue: [], completed: [], all: [] };

    const query = searchQuery.trim().toLowerCase();
    const filterFn = (t: StudyTask) => {
      if (!query) return true;
      return (
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    };

    const today = data.today.filter(filterFn);
    const upcoming = data.upcoming.filter(filterFn);
    const overdue = data.overdue.filter(filterFn);
    const completed = data.completed.filter(filterFn);
    const all = [...overdue, ...today, ...upcoming, ...completed];

    return { today, upcoming, overdue, completed, all };
  }, [data, searchQuery]);

  const stats = useMemo(() => {
    if (!data) {
      return { total: 0, open: 0, done: 0, overdue: 0, todayCount: 0, upcomingCount: 0, percent: 0 };
    }
    const overdueTotal = data.overdue.length + allBacklogItems.length;
    const total =
      data.today.length + data.upcoming.length + overdueTotal + data.completed.length;
    const open = data.today.length + data.upcoming.length + overdueTotal;
    return {
      total,
      open,
      done: data.completed.length,
      overdue: overdueTotal,
      todayCount: data.today.length,
      upcomingCount: data.upcoming.length,
      percent: total > 0 ? Math.round((data.completed.length / total) * 100) : 0,
    };
  }, [data, allBacklogItems]);

  const openCreate = (presetColumnId?: string) => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setFormError(null);

    const d = new Date();
    if (presetColumnId === 'upcoming') {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    } else if (presetColumnId === 'overdue') {
      d.setDate(d.getDate() - 1);
      d.setHours(12, 0, 0, 0);
    } else {
      d.setHours(20, 0, 0, 0);
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    setDueDate(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes()
      )}`
    );
    setFormOpen(true);
  };

  const openCreateForDate = (targetDate: Date) => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setFormError(null);

    const d = new Date(targetDate);
    d.setHours(18, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    setDueDate(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes()
      )}`
    );
    setFormOpen(true);
  };

  const openEdit = (t: StudyTask) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description ?? '');

    const d = new Date(t.dueDate);
    const pad = (n: number) => String(n).padStart(2, '0');
    setDueDate(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes()
      )}`
    );
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      setFormError('يرجى كتابة عنوان المهمة وتحديد موعد الاستحقاق.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingTask) {
        await studyPlannerApi.update(editingTask.id, {
          title: title.trim(),
          description: description.trim() || null,
          dueDate: new Date(dueDate).toISOString(),
        });
        toast.success('تم حفظ التعديلات بنجاح!');
      } else {
        await studyPlannerApi.create({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: new Date(dueDate).toISOString(),
        });
        toast.success('تمت إضافة المهمة إلى خطتك الدراسية.');
        playPop();
      }
      setFormOpen(false);
      invalidate();
    } catch {
      setFormError('تعذر حفظ المهمة، يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (t: StudyTask) => {
    const nextState = !t.isCompleted;
    setBusyTaskId(t.id);

    try {
      await studyPlannerApi.update(t.id, { isCompleted: nextState });
      if (nextState) {
        playSuccess();
        triggerConfetti();
        toast.success(`أحسنت! أكملت "${t.title}"`);
      } else {
        playPop();
      }
      await invalidate();
    } catch {
      toast.error('حدث خطأ أثناء تحديث حالة المهمة.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await studyPlannerApi.delete(taskToDelete.id);
      toast.success('تم حذف المهمة بنجاح.');
      setTaskToDelete(null);
      invalidate();
    } catch {
      setDeleteError('تعذر حذف المهمة، يرجى المحاولة مرة أخرى.');
    } finally {
      setDeleting(false);
    }
  };

  const handleStartPomodoro = (t: StudyTask) => {
    setPomodoroTask(t);
    setPomodoroOpen(true);
  };

  const findTaskById = (taskId: string): StudyTask | undefined => {
    if (!data) return undefined;
    return (
      data.today.find((t) => t.id === taskId) ||
      data.upcoming.find((t) => t.id === taskId) ||
      data.overdue.find((t) => t.id === taskId) ||
      data.completed.find((t) => t.id === taskId)
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(String(active.id));
    if (task) {
      setActiveDragTask(task);
      playPop();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    let targetColumnId: string | null = null;
    if (COLUMNS.some((col) => col.id === overId)) {
      targetColumnId = overId;
    } else {
      if (filteredData.today.some((t) => t.id === overId)) targetColumnId = 'today';
      else if (filteredData.upcoming.some((t) => t.id === overId)) targetColumnId = 'upcoming';
      else if (filteredData.overdue.some((t) => t.id === overId)) targetColumnId = 'overdue';
      else if (filteredData.completed.some((t) => t.id === overId)) targetColumnId = 'completed';
    }

    if (!targetColumnId) return;

    const currentTask = findTaskById(activeId);
    if (!currentTask) return;

    const isCurrentlyCompleted = currentTask.isCompleted;
    if (targetColumnId === 'completed' && isCurrentlyCompleted) return;

    try {
      if (targetColumnId === 'completed') {
        await studyPlannerApi.update(activeId, { isCompleted: true });
        playSuccess();
        triggerConfetti();
        toast.success(`تم نقل "${currentTask.title}" إلى المكتملة.`);
      } else {
        const newDueDate = new Date();
        if (targetColumnId === 'today') {
          newDueDate.setHours(20, 0, 0, 0);
        } else if (targetColumnId === 'upcoming') {
          newDueDate.setDate(newDueDate.getDate() + 1);
          newDueDate.setHours(18, 0, 0, 0);
        } else if (targetColumnId === 'overdue') {
          newDueDate.setDate(newDueDate.getDate() - 1);
          newDueDate.setHours(12, 0, 0, 0);
        }

        await studyPlannerApi.update(activeId, {
          isCompleted: false,
          dueDate: newDueDate.toISOString(),
        });
        playPop();
        toast.success(`تم تحديث موعد "${currentTask.title}" بنجاح.`);
      }

      await invalidate();
    } catch {
      toast.error('تعذر نقل المهمة، حاول مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen pb-16 text-right bg-gradient-to-b from-bg-base via-surface/20 to-bg-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="gold">المخطط الدراسي الذكي</Badge>
              {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" />}
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-din text-ink tracking-wide">
              لوحة التخطيط الدراسي وتنظيم المهام
            </h1>
            <p className="text-xs text-ink-muted max-w-xl font-sst">
              نظّم دروسك، كويزاتك، وواجباتك اليومية بالسحب والإفلات وتتبع نسبة إنجازك.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs py-1.5 px-2.5 text-ivory-muted hover:text-ivory shadow-sm"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBacklogDrawerOpen(true)}
              className="text-xs py-1.5 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 shadow-sm"
              leftIcon={<Flame className="w-3.5 h-3.5 text-amber-400" />}
            >
              المتأخرات ({backlogCount})
            </Button>

            <Button
              size="sm"
              onClick={() => openCreate('today')}
              className="text-xs py-1.5 shadow-sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              مهمة جديدة
            </Button>
          </div>
        </motion.div>

        {/* Stats & Motivation Bar */}
        <PlannerStats
          stats={stats}
          hasNotificationPermission={permission === 'granted'}
          onRequestNotification={requestPermission}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenBacklogDrawer={() => setBacklogDrawerOpen(true)}
          backlogCount={backlogCount}
        />

        {/* Search and View Mode Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-surface-card border border-surface-border shadow-sm"
        >
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ivory-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المهام، الدروس، الكويزات..."
              className="w-full bg-surface/80 border border-surface-border text-ivory rounded-xl pr-9 pl-4 py-2 text-xs focus:border-gold-400 outline-none transition-all"
            />
          </div>

          {/* View Modes */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-surface-border/80 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-gold-500 text-white shadow-sm'
                  : 'text-ivory-muted hover:text-ivory'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              لوحة المهام
            </button>

            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-gold-500 text-white shadow-sm'
                  : 'text-ivory-muted hover:text-ivory'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              الجدول الأسبوعي
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5  rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-gold-500 text-white shadow-sm'
                  : 'text-ivory-muted hover:text-ivory'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              قائمة المهام
            </button>
          </div>
        </motion.div>

        {/* ── Mobile Column Filter Buttons (Visible on Mobile only in Kanban Mode) ── */}
        {viewMode === 'kanban' && (
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setMobileKanbanFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                mobileKanbanFilter === 'all'
                  ? 'bg-gold-500 text-white border-gold-400 shadow-sm'
                  : 'bg-surface-card text-ivory-muted border-surface-border'
              }`}
            >
              عرض الكل
            </button>

            {COLUMNS.map((col) => {
              const count =
                col.id === 'overdue'
                  ? filteredData.overdue.length + allBacklogItems.length
                  : col.id === 'today'
                  ? filteredData.today.length
                  : col.id === 'upcoming'
                  ? filteredData.upcoming.length
                  : filteredData.completed.length;

              const active = mobileKanbanFilter === col.id;

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setMobileKanbanFilter(col.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    active
                      ? 'bg-gold-500 text-white border-gold-400 shadow-sm'
                      : 'bg-surface-card text-ivory-muted border-surface-border'
                  }`}
                >
                  <span>{col.title}</span>
                  <span
                    className={`text-[10px] px-1.5 rounded-full font-black ${
                      active ? 'bg-bg-base text-white/80' : 'bg-surface text-ivory-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          </div>
        ) : isError || !data ? (
          <div className="p-8 rounded-3xl bg-surface-card border border-red-500/30 text-center space-y-3 shadow-sm">
            <AlertTriangle className="w-7 h-7 text-red-400 mx-auto" />
            <h3 className="text-sm font-bold text-ivory">تعذر تحميل بيانات المخطط الدراسي</h3>
            <p className="text-xs text-ivory-muted">يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.</p>
            <Button size="sm" onClick={() => refetch()} variant="outline">
              إعادة المحاولة
            </Button>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Drag & Drop View */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(mobileKanbanFilter === 'all' || mobileKanbanFilter === 'overdue') && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.05, ease: 'easeOut' }}
                >
                  <KanbanColumn
                    column={COLUMNS[0]} // Overdue
                    tasks={filteredData.overdue}
                    onToggleComplete={handleToggleComplete}
                    onEdit={openEdit}
                    onDelete={setTaskToDelete}
                    onQuickAdd={openCreate}
                    onStartPomodoro={handleStartPomodoro}
                    busyTaskId={busyTaskId}
                    overdueBacklogItems={allBacklogItems}
                    onImportBacklogItem={handleImportBacklogItem}
                  />
                </motion.div>
              )}

              {(mobileKanbanFilter === 'all' || mobileKanbanFilter === 'today') && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.1, ease: 'easeOut' }}
                >
                  <KanbanColumn
                    column={COLUMNS[1]} // Today
                    tasks={filteredData.today}
                    onToggleComplete={handleToggleComplete}
                    onEdit={openEdit}
                    onDelete={setTaskToDelete}
                    onQuickAdd={openCreate}
                    onStartPomodoro={handleStartPomodoro}
                    busyTaskId={busyTaskId}
                  />
                </motion.div>
              )}

              {(mobileKanbanFilter === 'all' || mobileKanbanFilter === 'upcoming') && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.15, ease: 'easeOut' }}
                >
                  <KanbanColumn
                    column={COLUMNS[2]} // Upcoming
                    tasks={filteredData.upcoming}
                    onToggleComplete={handleToggleComplete}
                    onEdit={openEdit}
                    onDelete={setTaskToDelete}
                    onQuickAdd={openCreate}
                    onStartPomodoro={handleStartPomodoro}
                    busyTaskId={busyTaskId}
                  />
                </motion.div>
              )}

              {(mobileKanbanFilter === 'all' || mobileKanbanFilter === 'completed') && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.2, ease: 'easeOut' }}
                >
                  <KanbanColumn
                    column={COLUMNS[3]} // Completed
                    tasks={filteredData.completed}
                    onToggleComplete={handleToggleComplete}
                    onEdit={openEdit}
                    onDelete={setTaskToDelete}
                    onQuickAdd={openCreate}
                    onStartPomodoro={handleStartPomodoro}
                    busyTaskId={busyTaskId}
                  />
                </motion.div>
              )}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeDragTask ? (
                <div className="opacity-95 rotate-1 scale-102 shadow-sm pointer-events-none">
                  <TaskCard
                    task={activeDragTask}
                    columnId="overlay"
                    onToggleComplete={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : viewMode === 'weekly' ? (
          /* Weekly View */
          <PlannerWeeklyView
            tasks={filteredData.all}
            onToggleComplete={handleToggleComplete}
            onEdit={openEdit}
            onDelete={setTaskToDelete}
            onQuickAddDate={openCreateForDate}
          />
        ) : (
          /* Detailed List View */
          <div className="space-y-4">
            {COLUMNS.map((col) => {
              const colTasks =
                col.id === 'overdue'
                  ? filteredData.overdue
                  : col.id === 'today'
                  ? filteredData.today
                  : col.id === 'upcoming'
                  ? filteredData.upcoming
                  : filteredData.completed;

              return (
                <motion.section
                  key={col.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * COLUMNS.indexOf(col), ease: 'easeOut' }}
                  className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-surface-border space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-surface border border-surface-border">
                        {col.icon}
                      </span>
                      <h2 className="text-xs sm:text-sm font-bold text-ivory">{col.title}</h2>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${col.badgeColor}`}
                      >
                        {colTasks.length + (col.id === 'overdue' ? allBacklogItems.length : 0)}
                      </span>
                    </div>

                    {col.id !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCreate(col.id)}
                        className="text-xs py-1"
                        leftIcon={<Plus className="w-3 h-3" />}
                      >
                        إضافة
                      </Button>
                    )}
                  </div>

                  {colTasks.length === 0 && (col.id !== 'overdue' || allBacklogItems.length === 0) ? (
                    <p className="text-xs text-ivory-muted py-3 text-center">لا توجد مهام في هذا القسم.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          columnId={col.id}
                          onToggleComplete={handleToggleComplete}
                          onEdit={openEdit}
                          onDelete={setTaskToDelete}
                          onStartPomodoro={handleStartPomodoro}
                          isBusy={busyTaskId === task.id}
                        />
                      ))}
                    </div>
                  )}
                </motion.section>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Smart Backlog Drawer ──────────────────────────────── */}
      <SmartBacklogDrawer
        isOpen={backlogDrawerOpen}
        onClose={() => setBacklogDrawerOpen(false)}
        onTaskImported={() => {
          invalidate();
          playSuccess();
        }}
      />

      {/* ── Focus Pomodoro Timer Modal ───────────────────────── */}
      <FocusPomodoroModal
        task={pomodoroTask}
        isOpen={pomodoroOpen}
        onClose={() => setPomodoroOpen(false)}
        onCompleteTask={handleToggleComplete}
      />

      {/* ── Centered Create / Edit Task Modal ─────────────────── */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        title={editingTask ? 'تعديل المهمة الدراسية' : 'إضافة مهمة جديدة'}
        description={
          editingTask
            ? 'حدّث بيانات المهمة وموعد استحقاقها ثم احفظ التغييرات.'
            : 'اكتب تفاصيل المهمة وسنذكّرك بها في موعد استحقاقها.'
        }
      >
        <form onSubmit={handleSave} className="space-y-4 text-right">
          {formError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2">
              {formError}
            </p>
          )}

          <div className="space-y-1.5 text-right">
            <label htmlFor="task-title-input" className="block text-xs font-bold text-ivory font-cairo">
              عنوان المهمة <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة الباب الأول في التاريخ أو حل تدريبات الكويز"
              required
              autoFocus
              className="w-full bg-surface border border-surface-border text-ivory placeholder-ivory-muted/40 rounded-xl px-3.5 py-2.5 text-xs focus:border-gold-400 focus:ring-1 focus:ring-gold-400/30 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5 text-right">
            <label htmlFor="task-desc-input" className="block text-xs font-bold text-ivory font-cairo">
              ملاحظات أو وصف إضافي (اختياري)
            </label>
            <textarea
              id="task-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب أي ملاحظات أو أرقام صفحات وملاحظات تود تذكرها..."
              rows={3}
              className="w-full bg-surface border border-surface-border text-ivory placeholder-ivory-muted/40 rounded-xl px-3.5 py-2.5 text-xs focus:border-gold-400 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5 text-right">
            <label htmlFor="task-date-input" className="block text-xs font-bold text-ivory font-cairo">
              موعد وتاريخ الاستحقاق <span className="text-red-400">*</span>
            </label>
            <input
              id="task-date-input"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full bg-surface border border-surface-border text-ivory rounded-xl px-3.5 py-2.5 text-xs focus:border-gold-400 focus:ring-1 focus:ring-gold-400/30 outline-none transition-all [color-scheme:dark]"
            />
          </div>

          <div className="flex items-center justify-start gap-2.5 pt-3 border-t border-surface-border/50">
            <Button type="submit" isLoading={saving} size="sm" className="text-xs py-2 shadow-sm" leftIcon={<Zap className="w-3.5 h-3.5" />}>
              {editingTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </Button>
            <Button type="button" variant="outline" size="sm" className="text-xs py-2" onClick={() => setFormOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Centered Delete Confirmation Modal ───────────────── */}
      <Modal
        isOpen={taskToDelete !== null}
        onClose={() => !deleting && setTaskToDelete(null)}
        maxWidth="sm"
        title="تأكيد حذف المهمة"
      >
        <div className="pt-2 space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-ivory leading-relaxed">
              هل أنت متأكد من رغبتك في حذف المهمة التالية؟
            </p>
            <p className="font-bold text-gold-300 text-xs sm:text-sm">«{taskToDelete?.title}»</p>
            <p className="text-[10px] text-ivory-muted">لا يمكن استرجاع المهمة بعد الحذف.</p>
          </div>

          {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}

          <div className="flex items-center justify-center gap-2.5 pt-2">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="text-xs py-2"
              leftIcon={
                deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />
              }
            >
              نعم، احذف
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTaskToDelete(null)}
              disabled={deleting}
              className="text-xs py-2"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
