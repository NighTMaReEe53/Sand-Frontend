import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Ban,
  CalendarClock,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { liveLecturesApi } from '../../api/liveLectures.api';
import {
  useAttendanceQuery,
  useCancelLiveLectureMutation,
  useCreateLiveLectureMutation,
  useDeleteLiveLectureMutation,
  useEndLiveLectureMutation,
  useStartLiveLectureMutation,
  useTeacherHistoryLecturesQuery,
  useTeacherUpcomingLecturesQuery,
} from '../../hooks/queries/useLiveLectures';
import type { LiveLecture } from '../../types/liveLecture.types';
import { LectureStatusBadge } from '../../components/live/LectureStatusBadge';
import { PageHeader, EmptyState } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

const createSchema = z.object({
  courseId: z.string().uuid('اختر الكورس'),
  title: z.string().min(3, 'العنوان مطلوب (3 أحرف على الأقل)').max(150),
  description: z.string().max(2000).optional().or(z.literal('')),
  scheduledAt: z.string().min(1, 'حدد موعد المحاضرة'),
});
type CreateForm = z.infer<typeof createSchema>;

export const TeacherLiveLecturesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<LiveLecture | null>(null);
  const [attendanceFor, setAttendanceFor] = useState<LiveLecture | null>(null);

  const { data: upcoming = [], isLoading: loadingUpcoming } = useTeacherUpcomingLecturesQuery();
  const { data: history = [], isLoading: loadingHistory } = useTeacherHistoryLecturesQuery();
  const { data: coursesData } = useCoursesQuery({ mine: true } as any);

  const startMutation = useStartLiveLectureMutation();
  const endMutation = useEndLiveLectureMutation();
  const cancelMutation = useCancelLiveLectureMutation();
  const deleteMutation = useDeleteLiveLectureMutation();
  const createMutation = useCreateLiveLectureMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const openCreate = () => {
    setEditing(null);
    reset({
      courseId: '',
      title: '',
      description: '',
      scheduledAt: new Date(Date.now() + 3600_000).toISOString().slice(0, 16),
    });
    setCreateOpen(true);
  };

  const openEdit = (lecture: LiveLecture) => {
    setEditing(lecture);
    setValue('courseId', lecture.courseId);
    setValue('title', lecture.title);
    setValue('description', lecture.description ?? '');
    setValue('scheduledAt', new Date(lecture.scheduledAt).toISOString().slice(0, 16));
    setCreateOpen(true);
  };

  const onSubmit = (data: CreateForm) => {
    if (editing) {
      liveLecturesApi
        .update(editing.id, {
          title: data.title,
          description: data.description || undefined,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
        })
        .then(() => {
          toast.success('تم تحديث المحاضرة');
          setCreateOpen(false);
        })
        .catch(() => toast.error('تعذر تحديث المحاضرة'));
      return;
    }

    createMutation.mutate(
      {
        courseId: data.courseId,
        title: data.title,
        description: data.description || undefined,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success('تم جدولة المحاضرة وإشعار الطلاب المشتركين');
          setCreateOpen(false);
        },
        onError: () => toast.error('تعذر إنشاء المحاضرة'),
      },
    );
  };

  const courses = coursesData?.courses ?? (coursesData as any) ?? [];
  const attendanceQuery = useAttendanceQuery(attendanceFor?.id ?? '', !!attendanceFor);
  const lectures = tab === 'upcoming' ? upcoming : history;
  const isLoading = tab === 'upcoming' ? loadingUpcoming : loadingHistory;

  return (
    <div className="space-y-6 text-right">
      <PageHeader
        id="live-t"
        icon={Radio}
        title="المحاضرات المباشرة"
        subtitle="جدول محاضرات مباشرة لطلاب كورساتك وتابع الحضور لحظة بلحظة."
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            محاضرة جديدة
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 w-fit p-1 rounded-2xl bg-surface-card border border-surface-border">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
            tab === 'upcoming'
              ? 'bg-gold-gradient text-bg shadow-gold-glow'
              : 'text-ivory-muted hover:text-ivory'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5" />
          القادمة ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
            tab === 'history'
              ? 'bg-gold-gradient text-bg shadow-gold-glow'
              : 'text-ivory-muted hover:text-ivory'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          المنتهية والملغاة
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : lectures.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={tab === 'upcoming' ? 'لا توجد محاضرات قادمة' : 'لا يوجد سجل بعد'}
          description={
            tab === 'upcoming'
              ? 'أنشئ محاضرة مباشرة جديدة وحدد موعدها ليظهر للطلاب في صفحة الكورس.'
              : 'ستظهر المحاضرات المنتهية والملغاة هنا مع إمكانية الاطلاع على الحضور.'
          }
          action={
            tab === 'upcoming' ? (
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
                إنشاء محاضرة الآن
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture: LiveLecture) => (
            <div
              key={lecture.id}
              className="group relative overflow-hidden p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-all duration-300 space-y-3 hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Top accent line */}
              <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-gold-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <LectureStatusBadge status={lecture.status} />
                  <h3 className="text-sm font-bold text-ivory truncate">{lecture.title}</h3>
                  <span className="text-[11px] text-ivory-muted">• {lecture.course.title}</span>
                </div>
                <span className="text-[11px] text-ivory-muted shrink-0">
                  {new Date(lecture.scheduledAt).toLocaleString('ar-EG', {
                    day: 'numeric',
                    month: 'long',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {lecture.status === 'SCHEDULED' && (
                  <>
                    <Button
                      size="sm"
                      leftIcon={<Video className="w-4 h-4" />}
                      onClick={() =>
                        startMutation.mutate(lecture.id, {
                          onSuccess: () => navigate(`/live-lectures/${lecture.id}/room`),
                        })
                      }
                    >
                      ابدأ البث الآن
                    </Button>
                    <Button size="sm" variant="outline" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(lecture)}>
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Ban className="w-3.5 h-3.5" />}
                      onClick={() => {
                        if (window.confirm('سيتم إلغاء المحاضرة وإرسال إشعار للطلاب. هل أنت متأكد؟')) {
                          cancelMutation.mutate(lecture.id, {
                            onSuccess: () => toast.success('تم إلغاء المحاضرة وإشعار الطلاب'),
                            onError: () => toast.error('تعذر إلغاء المحاضرة'),
                          });
                        }
                      }}
                    >
                      إلغاء
                    </Button>
                  </>
                )}
                {lecture.status === 'LIVE' && (
                  <>
                    <Link to={`/live-lectures/${lecture.id}/room`}>
                      <Button size="sm" leftIcon={<Video className="w-4 h-4" />}>
                        ادخل الغرفة
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => endMutation.mutate(lecture.id)}
                    >
                      إنهاء البث
                    </Button>
                  </>
                )}
                {lecture.status === 'ENDED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAttendanceFor(lecture)}
                  >
                    تقرير الحضور ({lecture._count?.attendances ?? 0})
                  </Button>
                )}
                {(lecture.status === 'CANCELLED' || lecture.status === 'ENDED') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (window.confirm('سيتم حذف المحاضرة نهائياً بدون إرسال أي إشعار للطلاب. متابعة؟')) {
                        deleteMutation.mutate(lecture.id, {
                          onSuccess: () => toast.success('تم حذف المحاضرة (بدون إشعارات)'),
                          onError: () => toast.error('تعذر حذف المحاضرة'),
                        });
                      }
                    }}
                  >
                    حذف
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={editing ? 'تعديل المحاضرة' : 'جدولة محاضرة مباشرة'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-right">
          {!editing && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ivory">الكورس</label>
              <select
                {...register('courseId')}
                className="w-full bg-surface/80 border border-surface-border text-ivory rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gold-400"
              >
                <option value="">— اختر كورساً —</option>
                {(courses as any[]).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {errors.courseId && <p className="text-[11px] text-red-400">{errors.courseId.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ivory">عنوان المحاضرة</label>
            <Input placeholder="مثال: مراجعة الوحدة الثانية" {...register('title')} />
            {errors.title && <p className="text-[11px] text-red-400">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ivory">الوصف (اختياري)</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full bg-surface/80 border border-surface-border text-ivory rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gold-400 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ivory">الموعد</label>
            <input
              type="datetime-local"
              {...register('scheduledAt')}
              className="w-full bg-surface/80 border border-surface-border text-ivory rounded-lg px-4 py-2.5 text-sm outline-none focus:border-gold-400"
            />
            {errors.scheduledAt && <p className="text-[11px] text-red-400">{errors.scheduledAt.message}</p>}
          </div>

          <div className="flex gap-2 pt-2 justify-start">
            <Button type="submit" isLoading={createMutation.isPending}>
              {editing ? 'حفظ التعديلات' : 'جدولة المحاضرة'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
      {/* Attendance modal */}
      <Modal
        isOpen={!!attendanceFor}
        onClose={() => setAttendanceFor(null)}
        title={`تقرير حضور — ${attendanceFor?.title ?? ''}`}
      >
        <div className="space-y-2 text-right max-h-96 overflow-y-auto">
          {attendanceQuery.isLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : (attendanceQuery.data?.attendances ?? []).length === 0 ? (
            <p className="text-xs text-ivory-muted text-center py-6">لم يسجل أي طالب حضوراً.</p>
          ) : (
            attendanceQuery.data!.attendances.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface/60 border border-surface-border text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-ivory truncate">{row.studentName}</p>
                  <p className="text-[10px] text-ivory-muted">
                    {Math.round(row.durationSeconds / 60)} دقيقة مشاركة
                    {row.isOnline && <span className="text-emerald-400"> • متصل الآن</span>}
                  </p>
                </div>
                <span className="text-[10px] text-ivory-muted shrink-0">
                  {new Date(row.joinedAt).toLocaleTimeString('ar-EG', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
