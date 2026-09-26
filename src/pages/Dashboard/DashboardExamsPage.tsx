import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileQuestion,
  Plus,
  Edit2,
  Trash2,
  Users,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  CalendarDays,
  FileText,
  Globe,
  GraduationCap,
} from 'lucide-react';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { useCourseExamsQuery } from '../../hooks/queries/useExams';
import { examsApi } from '../../api/exams.api';
import { toast } from 'sonner';
import {
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
} from '../../hooks/mutations/useExamMutations';
import { Course } from '../../types/course.types';
import { formatDuration } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader, EmptyState } from '../../components/dashboard/PageHeader';

export const DashboardExamsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Schedule status for an exam card: scheduled / open / ended
  const scheduleStatus = (exam: { startAt?: string | null; endAt?: string | null; isPublished: boolean }) => {
    const now = new Date();
    if (exam.endAt && new Date(exam.endAt) < now)
      return { label: 'منتهي — مخفي عن الطلاب', variant: 'danger' as const };
    if (exam.startAt && new Date(exam.startAt) > now)
      return { label: 'مجدول — لم يبدأ بعد', variant: 'warning' as const };
    return null;
  };

  const formatDateTime = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleString('ar-EG', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const { data: coursesData } = useCoursesQuery({ limit: 50, mine: true });
  const courses: Course[] = Array.isArray(coursesData?.data)
    ? coursesData.data
    : Array.isArray(coursesData?.courses)
    ? coursesData.courses
    : Array.isArray(coursesData)
    ? (coursesData as Course[])
    : [];

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  // The course selected inside the create form. Keeping it separate from the
  // list filter prevents changing the visible list while the modal is open.
  const [formCourseId, setFormCourseId] = useState<string>('');

  // Auto-select first course when loaded
  React.useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const { data: exams, isLoading } = useCourseExamsQuery(selectedCourseId, !!selectedCourseId);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationMinutes: 45,
    totalMarks: 50,
    passingMarks: 25,
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleOptions: false,
    useQuestionBank: false,
    bankEasyCount: 0,
    bankMediumCount: 5,
    bankHardCount: 0,
    showCorrectAnswersAfterSubmission: true,
    isPublished: true,
    startAt: '',
    endAt: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate: createExam, isPending: isCreating } = useCreateExamMutation(
    formCourseId || selectedCourseId
  );
  const { mutate: updateExam, isPending: isUpdating } = useUpdateExamMutation(
    editingExamId || '',
    selectedCourseId
  );
  const { mutate: deleteExam, isPending: isDeleting } = useDeleteExamMutation(selectedCourseId);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      durationMinutes: 45,
      totalMarks: 50,
      passingMarks: 25,
      maxAttempts: 1,
      shuffleQuestions: true,
      shuffleOptions: false,
      useQuestionBank: false,
      bankEasyCount: 0,
      bankMediumCount: 5,
      bankHardCount: 0,
      showCorrectAnswersAfterSubmission: true,
      isPublished: true,
      startAt: '',
      endAt: '',
    });
    setFormError(null);
    setFormCourseId(selectedCourseId);
    setEditingExamId(null);
    setIsCreateModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // A teacher may own multiple courses, so the course must be explicitly
    // selected for every newly-created exam. The API also validates ownership
    // and stores this id as the exam's course relation.
    const examCourseId = editingExamId ? selectedCourseId : formCourseId || selectedCourseId;
    if (!examCourseId || !courses.some((course) => course.id === examCourseId)) {
      setFormError('اختر الكورس المرتبط بالامتحان أولاً.');
      return;
    }

    // Validate the schedule window
    if (formData.startAt && formData.endAt) {
      if (new Date(formData.startAt) >= new Date(formData.endAt)) {
        setFormError('وقت البداية يجب أن يكون قبل وقت النهاية.');
        return;
      }
    }

    const payload = {
      ...formData,
      startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
      endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
    };

    if (editingExamId) {
      updateExam(payload, {
        onSuccess: () => {
          setIsCreateModalOpen(false);
          setEditingExamId(null);
        },
      });
    } else {
      createExam(payload, {
        onSuccess: () => {
          // Show the exams for the course that was just selected/created.
          setSelectedCourseId(examCourseId);
          setIsCreateModalOpen(false);
        },
      });
    }
  };

  const handleTogglePublish = async (exam: any) => {
    try {
      await examsApi.updateExam(exam.id, { isPublished: !exam.isPublished });
      toast.success(
        !exam.isPublished
          ? 'تم نشر الامتحان للطلاب.'
          : 'تم تحويل الامتحان إلى مسودة وإخفائه عن الطلاب.'
      );
      queryClient.invalidateQueries({ queryKey: ['course-exams', selectedCourseId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر تحديث حالة الامتحان.');
    }
  };

  const handleDelete = () => {
    if (!deletingExamId) return;
    deleteExam(deletingExamId, {
      onSuccess: () => setDeletingExamId(null),
    });
  };

  return (
    <div className="space-y-8 text-right">
      {/* Header */}
      <div className="space-y-6">
        <PageHeader
          id="exams"
          icon={FileText}
          title="إدارة الامتحانات وبنك الأسئلة"
          subtitle="إنشاء امتحانات للكورسات، إضافة الأسئلة، ومتابعة تسليمات وإحصائيات الطلاب."
          action={
            <Button
              onClick={handleOpenCreate}
              disabled={!selectedCourseId}
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              إنشاء امتحان جديد
            </Button>
          }
        />

        {/* Stat chips */}
        {!isLoading && exams && exams.length > 0 && (
          <div className="relative z-10 grid grid-cols-3 gap-3">
            {[
              { icon: FileQuestion, value: exams.length, label: 'إجمالي الامتحانات', tone: 'text-gold-300 bg-gold-500/10 border-gold-500/25' },
              { icon: Globe, value: exams.filter((e) => e.isPublished).length, label: 'منشورة للطلاب', tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
              { icon: Award, value: exams.reduce((s, e) => s + (e.totalMarks || 0), 0), label: 'مجموع الدرجات', tone: 'text-sky-400 bg-sky-500/10 border-sky-500/25' },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div key={stat.label} className="relative overflow-hidden flex items-center gap-3 p-3.5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/30 transition-all duration-300">
                  <span className={`flex w-10 h-10 shrink-0 items-center justify-center rounded-xl border ${stat.tone}`}>
                    <StatIcon className="w-5 h-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-black font-amiri text-ivory leading-none">{stat.value}</p>
                    <p className="text-[10px] font-bold text-ivory-muted mt-1 truncate">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Selector Dropdown */}
      <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center gap-4 hover:border-gold-500/30 transition-colors">
        <span className="flex items-center gap-2 text-xs text-ivory-muted whitespace-nowrap">
          <BookOpen className="w-4 h-4 text-gold-400" />
          اختر الكورس:
        </span>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full sm:w-80 bg-surface border border-surface-border text-ivory rounded-lg px-3 py-2 text-xs outline-none focus:border-gold-400 font-bold"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Exams List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : !exams || exams.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="لا توجد امتحانات في هذا الكورس"
          description="اضغط على زر إنشاء امتحان لإضافة أول امتحان وتجهيز بنك الأسئلة."
          action={
            <Button onClick={handleOpenCreate} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              إنشاء امتحان الآن
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="group relative overflow-hidden p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-all duration-300 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-0.5"
            >
              {/* Top accent line */}
              <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-gold-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Corner ring vector */}
              <svg aria-hidden className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 text-gold-500/10 group-hover:text-gold-500/20 group-hover:rotate-45 transition-all duration-500" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
                <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1" opacity="0.55" />
              </svg>

              <div className="space-y-2 relative z-[1]">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-base font-bold font-amiri text-ivory group-hover:text-gold-200 transition-colors">{exam.title}</h3>
                  <Badge variant={exam.isPublished ? 'success' : 'neutral'}>
                    {exam.isPublished ? 'منشور للطلاب' : 'مسودة'}
                  </Badge>
                  {(() => {
                    const st = scheduleStatus(exam);
                    return st ? (
                      <Badge variant={st.variant}>
                        <Clock className="w-3 h-3 ml-1" />
                        {st.label}
                      </Badge>
                    ) : null;
                  })()}
                </div>

                {exam.description && (
                  <p className="text-xs text-ivory-muted leading-relaxed">{exam.description}</p>
                )}

                {(exam.startAt || exam.endAt) && (
                  <p className="text-[11px] text-ivory-muted flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-gold-400" />
                    {exam.startAt ? `يبدأ: ${formatDateTime(exam.startAt)}` : 'بدون وقت بداية'}
                    {' — '}
                    {exam.endAt ? `ينتهي: ${formatDateTime(exam.endAt)}` : 'بدون وقت نهاية'}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-ivory-muted pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gold-400" />
                    {formatDuration(exam.durationMinutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-gold-400" />
                    الدرجة: {exam.totalMarks} (النجاح {exam.passingMarks})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                <Link to={`/dashboard/exams/${exam.id}/questions`}>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<FileQuestion className="w-4 h-4" />}
                  >
                    بنك الأسئلة
                  </Button>
                </Link>

                <Link to={`/dashboard/exams/${exam.id}/submissions`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Users className="w-4 h-4" />}
                  >
                    التسليمات والإحصائيات
                  </Button>
                </Link>

                <Button
                  variant={exam.isPublished ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleTogglePublish(exam)}
                  leftIcon={exam.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  title={exam.isPublished ? 'إخفاء الامتحان عن الطلاب (مسودة)' : 'نشر الامتحان للطلاب'}
                >
                  {exam.isPublished ? 'تحويل لمسودة' : 'نشر'}
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeletingExamId(exam.id)}
                  title="حذف الامتحان"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create / Edit Exam Modal ────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingExamId ? 'تعديل الامتحان' : 'إنشاء امتحان جديد'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <Input
            label="عنوان الامتحان"
            placeholder="مثال: امتحان شامل على الفصل الأول - تاريخ 3ث"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label
              htmlFor="exam-course-select"
              className="block text-sm font-medium text-ivory/90 font-cairo"
            >
              الكورس المرتبط بالامتحان
            </label>
            <select
              id="exam-course-select"
              value={formCourseId || selectedCourseId}
              onChange={(e) => setFormCourseId(e.target.value)}
              disabled={Boolean(editingExamId)}
              required
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg px-3 py-2.5 text-xs outline-none focus:border-gold-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">اختر الكورس المرتبط بالامتحان...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-ivory-muted">
              سيتم إنشاء الامتحان داخل الكورس المحدد وسيظهر لطلاب هذا الكورس فقط.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              وصف وتعليمات الامتحان
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-gold-400"
              placeholder="مثال: يرجى التركيز، الأسئلة تقيس الفهم والاستنتاج..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="المدة بالدقائق"
              type="number"
              min="5"
              value={formData.durationMinutes}
              onChange={(e) =>
                setFormData({ ...formData, durationMinutes: Number(e.target.value) })
              }
              required
            />
            <Input
              label="الدرجة الكلية"
              type="number"
              min="1"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
              required
            />
            <Input
              label="درجة النجاح"
              type="number"
              min="1"
              value={formData.passingMarks}
              onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
              required
            />
          </div>

          {/* Schedule window */}
          <div className="space-y-2 p-4 rounded-xl bg-surface border border-surface-border">
            <p className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              جدولة الامتحان (اختياري)
            </p>
            <p className="text-[10px] text-ivory-muted">
              حدد وقت البداية والنهاية — يفتح الامتحان للطلاب في وقته، وبعد النهاية يُخفى تلقائيًا ولا يمكن الدخول إليه.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs text-ivory/90 font-cairo">وقت البداية</label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  className="w-full bg-surface-card border border-surface-border text-ivory rounded-lg px-3 py-2 text-xs outline-none focus:border-gold-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-ivory/90 font-cairo">وقت النهاية</label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  className="w-full bg-surface-card border border-surface-border text-ivory rounded-lg px-3 py-2 text-xs outline-none focus:border-gold-400"
                />
              </div>
            </div>
            {formError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="shuffleOptionsCheck"
                checked={formData.shuffleOptions ?? false}
                onChange={(e) =>
                  setFormData({ ...formData, shuffleOptions: e.target.checked })
                }
                className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
              />
              <label htmlFor="shuffleOptionsCheck" className="text-xs text-ivory cursor-pointer">
                ترتيب الخيارات عشوائياً لكل طالب (مضاد للحفظ)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useBankCheck"
                checked={formData.useQuestionBank ?? false}
                onChange={(e) =>
                  setFormData({ ...formData, useQuestionBank: e.target.checked })
                }
                className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
              />
              <label htmlFor="useBankCheck" className="text-xs text-ivory cursor-pointer">
                امتحان عشوائي من بنك الأسئلة المركزي (اختيار تلقائي حسب التوزيع)
              </label>
            </div>

            {(formData.useQuestionBank) && (
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface border border-surface-border">
                <Input
                  label="أسئلة سهلة"
                  type="number"
                  min={0}
                  value={formData.bankEasyCount ?? 0}
                  onChange={(e) => setFormData({ ...formData, bankEasyCount: Number(e.target.value) })}
                />
                <Input
                  label="متوسطة"
                  type="number"
                  min={0}
                  value={formData.bankMediumCount ?? 0}
                  onChange={(e) => setFormData({ ...formData, bankMediumCount: Number(e.target.value) })}
                />
                <Input
                  label="صعبة"
                  type="number"
                  min={0}
                  value={formData.bankHardCount ?? 0}
                  onChange={(e) => setFormData({ ...formData, bankHardCount: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showAnswersCheck"
                checked={formData.showCorrectAnswersAfterSubmission}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    showCorrectAnswersAfterSubmission: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
              />
              <label htmlFor="showAnswersCheck" className="text-xs text-ivory cursor-pointer">
                عرض الإجابات النموذجية وتوضيحات الأسئلة للطالب بعد تسليم الامتحان
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="publishedCheck"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
              />
              <label htmlFor="publishedCheck" className="text-xs text-ivory cursor-pointer">
                نشر الامتحان فوراً لطلاب الكورس
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" isLoading={isCreating || isUpdating}>
              {editingExamId ? 'حفظ التعديلات' : 'إنشاء الامتحان'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Exam Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={!!deletingExamId}
        onClose={() => setDeletingExamId(null)}
        title="تأكيد حذف الامتحان"
      >
        <div className="space-y-4 text-right">
          <p className="text-xs text-ivory-muted leading-relaxed">
            هل أنت متأكد من حذف هذا الامتحان؟ سيتم أرشفة الامتحان ولن يظهر للطلاب.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingExamId(null)}>
              تراجع
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
              نعم، تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
