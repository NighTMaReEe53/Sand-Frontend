import React, { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  PlayCircle,
  Video,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Eye,
  FileVideo,
  Film,
  CloudUpload,
  Loader2,
  X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { VideoPlayer } from '../video/VideoPlayer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Course, Lesson, CreateLessonDto, UpdateLessonDto } from '../../types/course.types';
import {
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useReorderLessonsMutation,
} from '../../hooks/mutations/useLessonMutations';
import { lessonsApi } from '../../api/lessons.api';
import { useCourseDetailQuery } from '../../hooks/queries/useCourses';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDuration } from '../../lib/utils';

interface LessonManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

const MAX_VIDEO_SIZE_MB = 200;
const ACCEPTED_VIDEO_TYPES = 'video/mp4,video/webm,video/quicktime,video/x-matroska,video/*';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
};

/** قراءة مدة الفيديو محلياً من بيانات الملف الوصفي قبل الرفع */
const extractVideoDuration = (file: File): Promise<number | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(d) && d > 0 ? Math.round(d) : null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });

interface SortableLessonItemProps {
  lesson: Lesson;
  index: number;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onPreview: (lesson: Lesson) => void;
  onUploadVideo: (lessonId: string, file: File) => void;
  isUploadingVideo?: boolean;
  uploadProgress?: number | null;
}

const SortableLessonItem: React.FC<SortableLessonItemProps> = ({
  lesson,
  index,
  onEdit,
  onDelete,
  onPreview,
  onUploadVideo,
  isUploadingVideo = false,
  uploadProgress = null,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const durationMin = lesson.durationSeconds ? Math.round(lesson.durationSeconds / 60) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-3.5 sm:p-4 rounded-xl bg-surface border transition-all flex items-center justify-between gap-3 overflow-hidden ${
        isDragging
          ? 'border-gold-400 bg-surface-card shadow-2xl scale-[1.02]'
          : isUploadingVideo
          ? 'border-gold-400/60 shadow-[0_0_25px_-8px_rgba(234,179,8,0.45)]'
          : 'border-surface-border hover:border-gold-500/30'
      }`}
    >
      {/* شريط تقدم الرفع السفلي */}
      {isUploadingVideo && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-surface-card">
          <div
            className="h-full rounded-full bg-gradient-to-l from-gold-400 via-gold-500 to-amber-400 transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress ?? 0}%` }}
          />
        </div>
      )}
      {/* Drag handle & Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-ivory-muted/60 hover:text-gold-400 hover:bg-surface-card transition-colors shrink-0 touch-none"
          title="اسحب لإعادة الترتيب"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="w-7 h-7 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-xs font-bold text-gold-400 shrink-0">
          {index + 1}
        </div>

        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-ivory truncate">{lesson.title}</h4>
            {lesson.isPreview && (
              <Badge variant="success" size="sm">
                معاينة مجانية
              </Badge>
            )}
            {lesson.videoUrl ? (
              <span className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                <Video className="w-3 h-3" />
                فيديو متوفر
              </span>
            ) : (
              <span className="text-[11px] text-amber-400/80 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                بدون فيديو
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-ivory-muted">
            {durationMin > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gold-500/70" />
                {durationMin} دقيقة
              </span>
            )}
            {lesson.description && (
              <span className="truncate max-w-xs text-ivory-muted/70">{lesson.description}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isUploadingVideo ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-[11px] font-bold text-gold-300 tabular-nums">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {uploadProgress ?? 0}%
          </span>
        ) : (
          <>
            {/* رفع فيديو من الجهاز مباشرة */}
            <label
              title="رفع فيديو من جهازك"
              className="relative p-2 rounded-xl cursor-pointer group/upl text-ivory-muted hover:text-gold-300 transition-colors"
            >
              <input
                type="file"
                accept={ACCEPTED_VIDEO_TYPES}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadVideo(lesson.id, file);
                  e.target.value = '';
                }}
              />
              <span className="absolute inset-0 rounded-xl border border-dashed border-transparent group-hover/upl:border-gold-500/40 group-hover/upl:bg-gold-500/10 transition-all" />
              <CloudUpload className="relative w-[18px] h-[18px] transition-transform duration-300 group-hover/upl:-translate-y-0.5 group-hover/upl:scale-110" />
            </label>

            {lesson.videoUrl && (
              <button
                type="button"
                onClick={() => onPreview(lesson)}
                className="p-2 rounded-lg text-ivory-muted hover:text-gold-400 hover:bg-surface-card transition-colors"
                title="معاينة الفيديو"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => onEdit(lesson)}
          className="p-2 rounded-lg text-ivory-muted hover:text-gold-400 hover:bg-surface-card transition-colors"
          title="تعديل الدرس"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(lesson)}
          className="p-2 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="حذف الدرس"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const LessonManagerModal: React.FC<LessonManagerModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  // جلب بيانات الكورس الكاملة مع الدروس فور فتح الـ Modal
  const { data: fullCourse, isLoading: isFetchingLessons } = useCourseDetailQuery(isOpen ? course.id : undefined);

  const [lessonsList, setLessonsList] = useState<Lesson[]>(
    fullCourse?.lessons || course.lessons || []
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDurationMinutes, setFormDurationMinutes] = useState<number | ''>(0);
  const [formIsPreview, setFormIsPreview] = useState(false);
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Video Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const dragDepth = useRef(0);

  // رفع فيديو مباشر من صف الدرس
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [rowUploadProgress, setRowUploadProgress] = useState<number | null>(null);

  // Mutations
  const { mutate: createLesson, isPending: isCreating } = useCreateLessonMutation(course.id);
  const { mutate: updateLesson, isPending: isUpdating } = useUpdateLessonMutation(course.id);
  const { mutate: deleteLesson, isPending: isDeleting } = useDeleteLessonMutation(course.id);
  const { mutate: reorderLessons, isPending: isReordering } = useReorderLessonsMutation(course.id);
  const queryClient = useQueryClient();

  // Synchronize lessons list when fullCourse or course prop updates
  React.useEffect(() => {
    if (fullCourse?.lessons) {
      setLessonsList(fullCourse.lessons);
    } else if (course.lessons) {
      setLessonsList(course.lessons);
    }
  }, [fullCourse?.lessons, course.lessons]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lessonsList.findIndex((item) => item.id === active.id);
    const newIndex = lessonsList.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(lessonsList, oldIndex, newIndex);
      setLessonsList(newItems);

      const orders = newItems.map((item, idx) => ({
        lessonId: item.id,
        newOrderIndex: idx + 1,
      }));

      reorderLessons(orders);
    }
  };

  const handleOpenAdd = () => {
    setFormTitle('');
    setFormDescription('');
    setFormDurationMinutes(0);
    setFormIsPreview(false);
    setFormVideoUrl('');
    setVideoMode('upload');
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadSuccess(false);
    setIsDraggingFile(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDetectedDuration(null);
    setFormError(null);
    setEditingLesson(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setFormTitle(lesson.title);
    setFormDescription(lesson.description || '');
    setFormDurationMinutes(lesson.durationSeconds ? Math.round(lesson.durationSeconds / 60) : 0);
    setFormIsPreview(lesson.isPreview || false);
    setFormVideoUrl(lesson.videoUrl || '');
    setVideoMode('upload');
    setSelectedFile(null);
    setUploadProgress(null);
    setUploadSuccess(false);
    setIsDraggingFile(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDetectedDuration(null);
    setFormError(null);
    setEditingLesson(lesson);
    setIsFormOpen(true);
  };

  /** التحقق من الملف + توليد معاينة محلية + استخراج المدة تلقائياً */
  const acceptVideoFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      if (!file.type.startsWith('video/')) {
        setFormError('الملف المحدد ليس فيديو صالحاً — الصيغ المدعومة: MP4, WebM, MOV, MKV.');
        return;
      }
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        setFormError(`حجم الفيديو يتجاوز الحد الأقصى (${MAX_VIDEO_SIZE_MB} ميجابايت).`);
        return;
      }

      setFormError(null);
      setSelectedFile(file);
      setUploadSuccess(false);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));

      const secs = await extractVideoDuration(file);
      if (secs && secs > 0) {
        setDetectedDuration(secs);
        setFormDurationMinutes(Math.max(1, Math.round(secs / 60)));
      }
    },
    [previewUrl]
  );

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDetectedDuration(null);
    setUploadSuccess(false);
    setUploadProgress(null);
  };

  const handleFileUploadAndSave = async (lessonId: string) => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // الفيديو يذهب مباشرة للتخزين (R2/S3)، ولا يمر عبر API الخادم.
      const durationSeconds = (Number(formDurationMinutes) || 0) * 60;
      const updated = await lessonsApi.uploadVideoDirect(
        lessonId,
        selectedFile,
        durationSeconds > 0 ? durationSeconds : undefined,
        (pct) => {
          setUploadProgress(pct);
        }
      );

      const fileUrl = updated?.videoUrl || '';

      // This request bypasses the lesson mutation hook, so invalidate the
      // detail/curriculum caches explicitly. The new video is visible now.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['course', course.id] }),
        queryClient.invalidateQueries({ queryKey: ['curriculum', course.id] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ]);

      setUploadSuccess(true);
      if (fileUrl) setFormVideoUrl(fileUrl);
    } catch (err: any) {
      console.error('Video upload failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        err?.message ||
        'فشل رفع ملف الفيديو';
      setFormError(typeof msg === 'string' ? msg : 'فشل رفع ملف الفيديو');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const title = formTitle.trim();
    if (title.length < 3) {
      setFormError('عنوان الدرس يجب أن يتكون من 3 أحرف على الأقل.');
      return;
    }

    const durationSeconds = (Number(formDurationMinutes) || 0) * 60;

    const payload: CreateLessonDto = {
      title,
      description: formDescription.trim() || undefined,
      durationSeconds,
      isPreview: formIsPreview,
      videoUrl: formVideoUrl.trim() || undefined,
    };

    if (editingLesson) {
      updateLesson(
        { lessonId: editingLesson.id, data: payload },
        {
          onSuccess: async (updated) => {
            if (videoMode === 'upload' && selectedFile) {
              await handleFileUploadAndSave(editingLesson.id);
            }
            setIsFormOpen(false);
            setEditingLesson(null);
          },
          onError: (err: any) => {
            const msg = err?.response?.data?.message || 'حدث خطأ أثناء حفظ التعديلات';
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
          },
        }
      );
    } else {
      createLesson(payload, {
        onSuccess: async (created) => {
          if (videoMode === 'upload' && selectedFile && created.id) {
            await handleFileUploadAndSave(created.id);
          }
          setIsFormOpen(false);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'حدث خطأ أثناء إضافة الدرس';
          setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingLesson) return;
    deleteLesson(deletingLesson.id, {
      onSuccess: () => {
        setDeletingLesson(null);
      },
    });
  };

  /** رفع فيديو مباشرة من صف الدرس (تحديث سريع بدون فتح النموذج) */
  const handleRowVideoUpload = async (lessonId: string, file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('الملف المحدد ليس فيديو صالحاً — الصيغ المدعومة: MP4, WebM, MOV, MKV.');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`حجم الفيديو يتجاوز الحد الأقصى (${MAX_VIDEO_SIZE_MB} ميجابايت).`);
      return;
    }

    setUploadingLessonId(lessonId);
    setRowUploadProgress(0);

    try {
      const updated = await lessonsApi.uploadVideoDirect(lessonId, file, undefined, (pct) =>
        setRowUploadProgress(pct)
      );

      setLessonsList((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, videoUrl: updated?.videoUrl || l.videoUrl } : l))
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['course', course.id] }),
        queryClient.invalidateQueries({ queryKey: ['curriculum', course.id] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ]);

      toast.success(`تم رفع الفيديو وتحديث الدرس "${updated?.title || ''}" بنجاح`);
    } catch (err: any) {
      console.error('Row video upload failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors ||
        err?.message ||
        'فشل رفع ملف الفيديو';
      toast.error(typeof msg === 'string' ? msg : 'فشل رفع ملف الفيديو');
    } finally {
      setUploadingLessonId(null);
      setRowUploadProgress(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`إدارة دروس ومحتوى: ${course.title}`}
        maxWidth="2xl"
      >
        <div className="space-y-6 text-right">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-surface-border">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-display text-gold-300">قائمة الدروس والمحاضرات</span>
                <Badge variant="gold" size="sm">
                  {lessonsList.length} دروس
                </Badge>
              </div>
              <p className="text-xs text-ivory-muted">
                اسحب الدروس من المقبض لإعادة ترتيبها فوراً، أو أضف دروساً جديدة بفيديوهات وروابط.
              </p>
            </div>

            <Button
              onClick={handleOpenAdd}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              إضافة درس جديد
            </Button>
          </div>

          {/* Lessons Sortable List */}
          {lessonsList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface/50 border border-dashed border-surface-border text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
                <Video className="w-6 h-6 opacity-60" />
              </div>
              <h4 className="text-sm font-bold text-ivory">لا توجد دروس مضافة حتى الآن</h4>
              <p className="text-xs text-ivory-muted max-w-sm mx-auto">
                اضغط على زر "إضافة درس جديد" لإضافة المحاضرات وتحديد روابط الفيديوهات ومدتها.
              </p>
              <Button onClick={handleOpenAdd} size="sm" variant="outline">
                إضافة أول درس
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={lessonsList.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {lessonsList.map((lesson, idx) => (
                    <SortableLessonItem
                      key={lesson.id}
                      lesson={lesson}
                      index={idx}
                      onEdit={handleOpenEdit}
                      onDelete={setDeletingLesson}
                      onPreview={setPreviewLesson}
                      onUploadVideo={handleRowVideoUpload}
                      isUploadingVideo={uploadingLessonId === lesson.id}
                      uploadProgress={rowUploadProgress}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="pt-3 border-t border-surface-border flex items-center justify-end">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Add / Edit Lesson Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingLesson ? 'تعديل بيانات الدرس' : 'إضافة درس جديد'}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-right">
          <Input
            label="عنوان الدرس"
            placeholder="مثال: الدرس الأول - أسباب الحملة الفرنسية وأحوال مصر"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-body">
              وصف الدرس (اختياري)
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-gold-400"
              placeholder="اكتب نبذة مختصرة عما سيتعلمه الطالب في هذا الدرس..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <Input
              label="مدة الدرس التقريبية (بالدقائق)"
              type="number"
              min="0"
              placeholder="مثال: 45"
              value={formDurationMinutes === 0 ? '' : formDurationMinutes}
              onChange={(e) =>
                setFormDurationMinutes(e.target.value ? parseInt(e.target.value, 10) : 0)
              }
            />

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPreviewCheckbox"
                checked={formIsPreview}
                onChange={(e) => setFormIsPreview(e.target.checked)}
                className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
              />
              <label
                htmlFor="isPreviewCheckbox"
                className="text-xs text-ivory font-medium cursor-pointer"
              >
                متاح للمعاينة المجانية للطلاب غير المشتركين
              </label>
            </div>
          </div>

          {/* Video Section */}
          <div className="space-y-3 pt-4 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-gold-300 font-display">
                <Film className="w-4 h-4" />
                مصدر فيديو الدرس
              </label>

              {/* Segmented Mode Toggle */}
              <div className="relative flex items-center bg-surface p-1 rounded-xl border border-surface-border text-xs">
                <span
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gold-500/20 border border-gold-500/30 transition-all duration-300 ease-out ${
                    videoMode === 'url' ? 'right-1' : 'right-[calc(50%+0px)]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVideoMode('url')}
                  className={`relative z-10 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    videoMode === 'url'
                      ? 'text-gold-300 font-bold'
                      : 'text-ivory-muted hover:text-ivory'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  رابط خارجي
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('upload')}
                  className={`relative z-10 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    videoMode === 'upload'
                      ? 'text-gold-300 font-bold'
                      : 'text-ivory-muted hover:text-ivory'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  رفع من جهازك
                </button>
              </div>
            </div>

            {videoMode === 'url' ? (
              <div className="space-y-1 animate-in fade-in">
                <Input
                  placeholder="https://www.youtube.com/watch?v=... أو رابط مباشر"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  rightIcon={<LinkIcon className="w-4 h-4" />}
                />
                <p className="text-[11px] text-ivory-muted">
                  يمكنك استخدام رابط من YouTube, Vimeo, BunnyCDN, أو رابط فيديو مباشر MP4/m3u8.
                </p>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                {editingLesson?.videoUrl && !selectedFile && (
                  <div className="p-2.5 rounded-xl bg-surface border border-surface-border flex items-center gap-2 text-[11px] text-ivory-muted">
                    <FileVideo className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>الدرس يحتوي على فيديو حالياً — رفع ملف جديد سيستبدله تلقائياً عند الحفظ.</span>
                  </div>
                )}
                {selectedFile && previewUrl && !isUploading ? (
                  /* ── بطاقة المعاينة بعد اختيار الملف ── */
                  <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 bg-black/40 group/card">
                    <video
                      src={previewUrl}
                      controls
                      className="w-full aspect-video object-contain bg-black"
                    />
                    <div className="p-3 flex flex-wrap items-center justify-between gap-2 bg-surface border-t border-surface-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <FileVideo className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-ivory truncate max-w-[220px]" dir="ltr">
                            {selectedFile.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-surface-card border border-surface-border text-[10px] text-ivory-muted">
                              {formatFileSize(selectedFile.size)}
                            </span>
                            {detectedDuration !== null && (
                              <span className="px-1.5 py-0.5 rounded-md bg-gold-500/10 border border-gold-500/30 text-[10px] text-gold-300 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                تم استخراج المدة تلقائياً: {Math.floor(detectedDuration / 60)}:{String(detectedDuration % 60).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="cursor-pointer px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gold-300 hover:bg-gold-500/10 border border-transparent hover:border-gold-500/30 transition-colors">
                          تغيير الفيديو
                          <input
                            type="file"
                            accept={ACCEPTED_VIDEO_TYPES}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                acceptVideoFile(e.target.files[0]);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          disabled={isUploading}
                          className="p-1.5 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          title="إزالة الملف"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── منطقة السحب والإفلات ── */
                  <div
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dragDepth.current += 1;
                      setIsDraggingFile(true);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dragDepth.current -= 1;
                      if (dragDepth.current <= 0) {
                        dragDepth.current = 0;
                        setIsDraggingFile(false);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      dragDepth.current = 0;
                      setIsDraggingFile(false);
                      acceptVideoFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => document.getElementById('lesson-video-input')?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.getElementById('lesson-video-input')?.click();
                      }
                    }}
                    className={`relative rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-300 group ${
                      isDraggingFile
                        ? 'border-gold-400 bg-gold-500/10 scale-[1.015] shadow-[0_0_50px_-12px_rgba(234,179,8,0.5)]'
                        : 'border-surface-border hover:border-gold-500/50 bg-surface/60 hover:bg-surface'
                    }`}
                  >
                    <input
                      id="lesson-video-input"
                      type="file"
                      accept={ACCEPTED_VIDEO_TYPES}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          acceptVideoFile(e.target.files[0]);
                        }
                        e.target.value = '';
                      }}
                    />

                    {isDraggingFile ? (
                      /* حالة السحب النشط */
                      <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
                        <div className="w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-400 flex items-center justify-center text-gold-300 animate-bounce shadow-[0_0_30px_-5px_rgba(234,179,8,0.6)]">
                          <Upload className="w-7 h-7" />
                        </div>
                        <p className="text-sm font-extrabold text-gold-200">أفلت ملف الفيديو الآن!</p>
                      </div>
                    ) : (
                      /* الحالة الافتراضية */
                      <div className="relative py-10 px-6 flex flex-col items-center justify-center gap-3 text-center">
                        {/* هالات نابضة حول الأيقونة */}
                        <div className="relative">
                          <span className="absolute inset-0 rounded-full bg-gold-500/20 animate-ping opacity-20" />
                          <span className="absolute -inset-1.5 rounded-full border border-gold-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gold-500/25 to-amber-600/10 border border-gold-500/40 flex items-center justify-center text-gold-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                            <CloudUpload className="w-7 h-7" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-extrabold text-ivory">
                            اسحب الفيديو وأفلته هنا
                          </p>
                          <p className="text-xs text-ivory-muted">
                            أو <span className="text-gold-300 font-bold underline decoration-gold-500/40 underline-offset-4">تصفح من جهازك</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                          {['MP4', 'WebM', 'MOV', 'MKV'].map((fmt) => (
                            <span
                              key={fmt}
                              className="px-2 py-0.5 rounded-md bg-surface-card border border-surface-border text-[10px] font-bold text-ivory-muted tracking-wide"
                            >
                              {fmt}
                            </span>
                          ))}
                          <span className="px-2 py-0.5 rounded-md bg-surface-card border border-surface-border text-[10px] text-ivory-muted">
                            حتى {MAX_VIDEO_SIZE_MB}MB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* شريط التقدم أثناء الرفع */}
                {isUploading && uploadProgress !== null && (
                  <div className="space-y-2 p-4 rounded-2xl bg-surface border border-gold-500/30 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-gold-300">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        جاري رفع الفيديو إلى السيرفر...
                      </span>
                      <span className="text-gold-400 tabular-nums">{uploadProgress}%</span>
                    </div>
                    <div className="relative w-full h-2.5 rounded-full bg-surface-card overflow-hidden">
                      <div
                        className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-gold-400 via-gold-500 to-amber-400 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                      </div>
                    </div>
                    <p className="text-[10px] text-ivory-muted/70 text-left" dir="ltr">
                      {selectedFile?.name}
                    </p>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>تم رفع الفيديو وربطه بالدرس بنجاح!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsFormOpen(false)}
              disabled={isCreating || isUpdating || isUploading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              isLoading={isCreating || isUpdating || isUploading}
              disabled={isCreating || isUpdating || isUploading}
            >
              {isCreating || isUpdating || isUploading
                ? 'جاري الحفظ والرفع...'
                : editingLesson
                ? 'حفظ تعديلات الدرس'
                : 'إضافة الدرس'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Confirmation Modal ───────────────────────────────── */}
      <Modal
        isOpen={!!deletingLesson}
        onClose={() => setDeletingLesson(null)}
        title="تأكيد حذف الدرس"
      >
        <div className="space-y-4 text-right">
          <p className="text-xs text-ivory-muted leading-relaxed">
            هل أنت متأكد من رغبتك في حذف الدرس:{' '}
            <strong className="text-ivory font-bold">"{deletingLesson?.title}"</strong>؟ سيتم حذف
            الدرس والمواد المرفقة به.
          </p>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingLesson(null)}>
              تراجع
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDeleteConfirm}>
              نعم، تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Video Preview Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={!!previewLesson}
        onClose={() => setPreviewLesson(null)}
        title={`معاينة: ${previewLesson?.title || ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-right">
          {previewLesson?.videoUrl ? (
            <VideoPlayer
              key={previewLesson.id}
              sources={[{ url: previewLesson.videoUrl }]}
              title={previewLesson.title}
              className="w-full"
            />
          ) : (
            <p className="text-xs text-ivory-muted py-6 text-center">لا يوجد فيديو متاح لهذا الدرس.</p>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPreviewLesson(null)}>
              إغلاق
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
