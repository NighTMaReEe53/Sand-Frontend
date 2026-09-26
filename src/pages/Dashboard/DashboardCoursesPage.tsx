import React, { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileQuestion,
  AlertCircle,
  TriangleAlert,
  Video,
  ListChecks,
  MonitorPlay,
  Users,
  Library,
  Layers,
  CalendarDays,
  GraduationCap,
  ScrollText,
  Globe,
  Wallet,
  Compass,
  CheckCircle,
  Sparkles,
  ChevronDown,
  Tag,
  Timer,
  Infinity as InfinityIcon,
  Search,
} from 'lucide-react';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import {
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} from '../../hooks/mutations/useCourseMutations';
import { Course, CourseStatus } from '../../types/course.types';
import { formatGradeLevels, formatDate } from '../../lib/utils';
import { formatTargets } from '../../lib/formatTargets';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { SkeletonManageRow } from '../../components/ui/Skeleton';
import { CoursePrice } from '../../components/ui/CoursePrice';
import { LessonManagerModal } from '../../components/dashboard/LessonManagerModal';
import { CourseImagePicker } from '../../components/dashboard/CourseImagePicker';
import { coursesApi } from '../../api/courses.api';
import { taxonomyApi } from '../../api/taxonomy.api';
import { studentsApi } from '../../api/students.api';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { EducationTargetPicker } from '../../components/courses/EducationTargetPicker';
import type { CourseTargetRef, TargetInput } from '../../types/taxonomy.types';

/** ISO → «YYYY-MM-DDTHH:mm» in local time for <input type="datetime-local"> */
const toLocalInputValue = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Modern select: icon, chevron, gold focus glow, hover border */
const ModernSelect: React.FC<{
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}> = ({ label, icon, value, onChange, placeholder, options }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-ivory/90 font-cairo">{label}</label>
    <div className="group relative">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400/50 group-focus-within:text-gold-400 transition-colors pointer-events-none">
        {icon}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-surface-border bg-surface ps-10 pe-9 py-3 text-xs font-medium text-ivory outline-none transition-all duration-300 cursor-pointer focus:border-gold-400 focus:bg-bg-elevated focus:shadow-[0_0_0_4px_rgba(201,161,90,0.12)] hover:border-gold-500/40"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted pointer-events-none" />
      <span
        className={`absolute bottom-1.5 right-8 h-0.5 rounded-full bg-gradient-to-l from-gold-300 to-transparent transition-all duration-500 ${
          value ? 'w-[calc(100%-3rem)]' : 'w-0 group-focus-within:w-[calc(100%-3rem)]'
        }`}
      />
    </div>
  </div>
);

export const DashboardCoursesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = role === 'ADMIN';

  // ADMIN: عرض كورسات معلم محدد عبر ?teacherId= (User id) — أو كل الكورسات
  const teacherFilter = isAdmin ? searchParams.get('teacherId') ?? '' : '';

  const { data: teachersData } = useQuery({
    queryKey: ['admin-teachers-options'],
    queryFn: () => studentsApi.listTeachers({ limit: 100 }),
    enabled: isAdmin,
  });
  const teacherOptions = teachersData?.teachers ?? [];

  const { data: coursesData, isLoading } = useCoursesQuery(
    isAdmin
      ? { limit: 50, ...(teacherFilter ? { teacherId: teacherFilter } : {}) }
      : { limit: 50, mine: true }
  );
  const courses: Course[] = Array.isArray(coursesData?.data)
    ? coursesData.data
    : Array.isArray(coursesData?.courses)
    ? coursesData.courses
    : Array.isArray(coursesData)
    ? (coursesData as Course[])
    : [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [managingLessonsCourse, setManagingLessonsCourse] = useState<Course | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [thumbnailSource, setThumbnailSource] = useState<'upload' | 'url'>('upload');
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  /** True while post-save work (targets sync / cover upload) is still running —
   *  react-query's isUpdating flips false the moment the course PATCH resolves,
   *  long before the slower image upload finishes. */
  const [isFinishingSave, setIsFinishingSave] = useState(false);
  /** Normalized taxonomy targets (new system) */
  const [formTargets, setFormTargets] = useState<TargetInput[]>([]);
  const [savedTargets, setSavedTargets] = useState<CourseTargetRef[]>([]);
  const [targetsError, setTargetsError] = useState<string | null>(null);

  // Form State - Defaults to PUBLISHED so courses appear immediately
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    learningOutcomes: '',
    price: 150,
    isFree: false,
    thumbnailUrl: '',
    status: 'PUBLISHED' as CourseStatus,
    subjectId: '',
    discountPercent: '' as number | '',
    discountEndsAt: '',
    accessType: 'LIFETIME' as 'LIFETIME' | 'LIMITED',
    durationMonths: 3 as number | '',
  });

  // ─── Teacher's course sections (grouped filters) ────────────────────
  const [sectionSearch, setSectionSearch] = useState('');
  const [activeSection, setActiveSection] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CourseStatus>('ALL');

  // Taxonomy subjects for the select (لغة عربية / رياضيات / فيزياء …)
  const { data: subjects = [] } = useQuery({
    queryKey: ['taxonomy-subjects'],
    queryFn: taxonomyApi.listSubjects,
    staleTime: 1000 * 60 * 30,
  });

  const { mutate: createCourse, isPending: isCreating } = useCreateCourseMutation();
  const { mutate: updateCourse, isPending: isUpdating } = useUpdateCourseMutation(
    editingCourse?.id || ''
  );
  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourseMutation();

  /** Covers the whole save journey including post-PATCH image upload */
  const isBusySaving = isCreating || isUpdating || isFinishingSave;
  const lastBlobUrlRef = React.useRef<string | null>(null);

  /** Switching upload ↔ url must not leak stale file/preview state */
  const handleThumbnailSourceChange = (mode: 'upload' | 'url') => {
    if (mode === thumbnailSource) return;
    setThumbnailSource(mode);
    setSelectedThumbnail(null);
    setThumbnailPreview(mode === 'url' ? formData.thumbnailUrl || null : null);
  };

  const ACCEPTED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleSelectThumbnail = (file: File | null) => {
    // Workaround for a Chromium repaint bug: after the native file picker
    // closes, the window can stay frozen (blank) until a keypress forces a
    // redraw. Nudging a compositor property on <body> schedules an immediate
    // repaint so the modal renders right away.
    requestAnimationFrame(() => {
      document.body.style.transform = 'translateZ(0)';
      requestAnimationFrame(() => {
        document.body.style.transform = '';
      });
    });
    try {
      if (!file) {
        setSelectedThumbnail(null);
        return;
      }
      if (!ACCEPTED_IMAGE_MIMES.includes(file.type)) {
        setSelectedThumbnail(null);
        setThumbnailPreview(null);
        setFormError('صورة الغلاف يجب أن تكون بصيغة JPG أو PNG أو WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSelectedThumbnail(null);
        setThumbnailPreview(null);
        setFormError('حجم صورة الغلاف يجب ألا يزيد عن 5 ميجابايت.');
        return;
      }
      setFormError(null);
      setSelectedThumbnail(file);
      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = null;
      }
      const blobUrl = URL.createObjectURL(file);
      lastBlobUrlRef.current = blobUrl;
      // Instant live preview — the teacher sees the new image immediately
      setThumbnailPreview(blobUrl);
    } catch (error) {
      console.error('[selectThumbnail]', error);
    }
  };

  /** Clears any picked/entered image so the teacher starts fresh */
  const handleClearThumbnail = () => {
    setSelectedThumbnail(null);
    if (lastBlobUrlRef.current) {
      URL.revokeObjectURL(lastBlobUrlRef.current);
      lastBlobUrlRef.current = null;
    }
    setThumbnailPreview(null);
    setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
  };

  const handleThumbnailUrlChange = (value: string) => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: value }));
    setThumbnailPreview(value.trim() || null);
  };

  /** True when the preview shows a freshly picked local file (not yet saved) */
  const isNewImagePicked = thumbnailSource === 'upload' && !!selectedThumbnail;

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      description: '',
      learningOutcomes: '',
      price: 150,
      isFree: false,
      thumbnailUrl: '',
      status: 'PUBLISHED',
      subjectId: '',
      discountPercent: '',
      discountEndsAt: '',
      accessType: 'LIFETIME',
      durationMonths: 3,
    });
    setEditingCourse(null);
    setThumbnailSource('upload');
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
    setFormError(null);
    setFormTargets([]);
    setSavedTargets([]);
    setTargetsError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description,
      learningOutcomes: (course.learningOutcomes || []).join('\n'),
      price: typeof course.price === 'string' ? parseFloat(course.price) : course.price,
      isFree: course.isFree,
      thumbnailUrl: course.thumbnailUrl || '',
      status: course.status,
      subjectId: (course as { subjectRef?: { id: string } | null }).subjectRef?.id ?? '',
      discountPercent:
        course.discountPercent != null && course.discountPercent > 0
          ? course.discountPercent
          : '',
      discountEndsAt: course.discountEndsAt ? toLocalInputValue(course.discountEndsAt) : '',
      accessType: course.accessType ?? 'LIFETIME',
      durationMonths: course.durationMonths ?? 3,
    });
    setEditingCourse(course);
    setThumbnailSource(course.thumbnailUrl ? 'url' : 'upload');
    setSelectedThumbnail(null);
    setThumbnailPreview(course.thumbnailUrl || null);
    setFormError(null);
    setFormTargets([]);
    setTargetsError(null);
    setIsCreateModalOpen(true);
    // Load the saved taxonomy targets for display in the picker
    taxonomyApi
      .getCourseTargets(course.id)
      .then((targets) => setSavedTargets(targets as CourseTargetRef[]))
      .catch(() => setSavedTargets([]));
  };

  // ─── Target group CRUD (edit mode — applied instantly to the server) ──
  const refreshTargets = (courseId: string) =>
    taxonomyApi
      .getCourseTargets(courseId)
      .then((targets) => setSavedTargets(targets as CourseTargetRef[]))
      .catch(() => undefined);

  const handleAddSavedTarget = async (input: TargetInput) => {
    if (!editingCourse) return;
    try {
      await taxonomyApi.addCourseTarget(editingCourse.id, input);
      await refreshTargets(editingCourse.id);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('تم إضافة الفئة المستهدفة');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر إضافة الفئة المستهدفة');
      throw err;
    }
  };

  const handleUpdateSavedTarget = async (targetId: string, input: TargetInput) => {
    if (!editingCourse) return;
    try {
      await taxonomyApi.updateCourseTarget(editingCourse.id, targetId, input);
      await refreshTargets(editingCourse.id);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('تم تحديث الفئة المستهدفة');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر تحديث الفئة المستهدفة');
      throw err;
    }
  };

  const handleRemoveSavedTarget = async (targetId: string) => {
    if (!editingCourse) return;
    try {
      await taxonomyApi.removeCourseTarget(editingCourse.id, targetId);
      await refreshTargets(editingCourse.id);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('تم حذف الفئة المستهدفة');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر حذف الفئة المستهدفة');
      throw err;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const title = formData.title.trim();
    const description = formData.description.trim();
    const rawThumb = formData.thumbnailUrl.trim();
    // Accept absolute URLs and server-relative paths (/uploads/...); anything
    // else is rejected locally so we never trip backend validation.
    const isUsableThumb = /^(https?:\/\/\S+|\/\S+)$/i.test(rawThumb);
    const thumbnailUrl =
      thumbnailSource === 'url' && rawThumb && isUsableThumb ? rawThumb : undefined;
    const learningOutcomes = formData.learningOutcomes
      .split('\n')
      .map((outcome) => outcome.trim())
      .filter(Boolean);

    if (title.length < 3) {
      setFormError('اسم الكورس يجب أن يتكون من 3 أحرف على الأقل.');
      return;
    }

    if (!description) {
      setFormError('وصف الكورس مطلوب.');
      return;
    }

    if (thumbnailSource === 'url' && rawThumb && !isUsableThumb) {
      setFormError('رابط صورة الغلاف غير صالح — استخدم رابطاً يبدأ بـ http أو https.');
      return;
    }

    // The taxonomy picker is now the single targeting source
    if (!editingCourse && formTargets.length === 0) {
      setTargetsError('أضف فئة مستهدفة واحدة على الأقل (النظام ← المرحلة ← الصف).');
      setFormError('حدد الفئة المستهدفة للكورس قبل الإنشاء.');
      return;
    }
    setTargetsError(null);

    // ─── Offer/coupon validation ─────────────────────────────────
    const discountPct = Number(formData.discountPercent);
    if (!formData.isFree && formData.discountPercent !== '' && discountPct > 0) {
      if (discountPct < 1 || discountPct > 90) {
        setFormError('نسبة الخصم يجب أن تكون بين 1% و 90%.');
        return;
      }
      if (!formData.discountEndsAt) {
        setFormError('حدد تاريخ ووقت انتهاء عرض الخصم.');
        return;
      }
      if (new Date(formData.discountEndsAt).getTime() <= Date.now()) {
        setFormError('تاريخ انتهاء العرض يجب أن يكون في المستقبل.');
        return;
      }
    }

    // Offer semantics: empty/0 percent (or a free course) clears any offer.
    const hasDiscount =
      !formData.isFree && Number.isFinite(discountPct) && discountPct >= 1;
    const discountEndsIso = hasDiscount && formData.discountEndsAt
      ? new Date(formData.discountEndsAt).toISOString()
      : null;

    // ─── نوع الوصول: باقة محددة بوقت أم دروس للأبد ────────────────
    if (formData.accessType === 'LIMITED') {
      const months = Number(formData.durationMonths);
      if (!Number.isFinite(months) || months < 1 || !Number.isInteger(months)) {
        setFormError('مدة الباقة يجب أن تكون عدداً صحيحاً بواحد شهر على الأقل.');
        return;
      }
    }
    const durationMonths =
      formData.accessType === 'LIMITED' ? Number(formData.durationMonths) : null;

    const payload = {
      title,
      description,
      learningOutcomes,
      price: formData.isFree ? 0 : Math.max(0, Number(formData.price) || 0),
      isFree: Boolean(formData.isFree),
      thumbnailUrl,
      status: formData.status,
      subjectId: formData.subjectId || undefined,
      discountPercent: hasDiscount ? Math.round(discountPct) : 0,
      discountEndsAt: discountEndsIso,
      accessType: formData.accessType,
      // يُرسَل فقط مع الباقة — الخدمة تمسحه تلقائياً عند LIFETIME
      ...(formData.accessType === 'LIMITED' ? { durationMonths } : {}),
    };

    /** Uploads the picked cover file AFTER the course exists (best-effort). */
    const uploadSelectedThumbnail = async (courseId: string) => {
      if (!selectedThumbnail) return;
      await coursesApi.uploadThumbnail(courseId, selectedThumbnail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['course', courseId] }),
      ]);
    };

    /** Clears the form + resets upload state once everything is done. */
    const finishSave = () => {
      setIsCreateModalOpen(false);
      setEditingCourse(null);
      setFormError(null);
      setSelectedThumbnail(null);
      setThumbnailPreview(null);
      if (lastBlobUrlRef.current) {
        URL.revokeObjectURL(lastBlobUrlRef.current);
        lastBlobUrlRef.current = null;
      }
    };

    const handleMutationError = (err: any) => {
      const data = err?.response?.data;
      // Validation pipes return `message` as an array of strings (or a single
      // string). Surface the real reasons instead of a generic fallback.
      const messages = Array.isArray(data?.message)
        ? data.message
        : typeof data?.message === 'string'
          ? [data.message]
          : [];
      if (messages.length > 0) {
        setFormError(messages.join(' • '));
      } else if (Array.isArray(data?.errors) && data.errors.length > 0) {
        setFormError(data.errors.join(' • '));
      } else if (typeof data?.error === 'string') {
        setFormError(data.error);
      } else {
        setFormError('حدث خطأ أثناء حفظ الكورس، يرجى التأكد من صحة البيانات والمحاولة مجدداً.');
      }
    };

    if (editingCourse) {
      updateCourse(payload, {
        onSuccess: async (updatedCourse) => {
          setIsFinishingSave(true);
          try {
            // Sync taxonomy targets (replace-all) when the teacher added new ones
            if (formTargets.length > 0) {
              try {
                await taxonomyApi.setCourseTargets(editingCourse.id, formTargets);
              } catch (error: any) {
                toast.error(error?.response?.data?.message ?? 'تم حفظ الكورس، لكن تعذر تحديث الفئات المستهدفة.');
              }
            }
            // Cover upload is best-effort — never blocks saving the course itself
            try {
              await uploadSelectedThumbnail(updatedCourse.id);
            } catch (error: any) {
              console.error('[uploadThumbnail]', error);
              toast.error('تم حفظ الكورس، لكن تعذر رفع صورة الغلاف. عدّل الكورس وحاول رفعها مجدداً.');
            }
            finishSave();
            toast.success('تم حفظ التعديلات بنجاح');
          } finally {
            setIsFinishingSave(false);
          }
        },
        onError: handleMutationError,
      });
    } else {
      const createPayload: any = { ...payload };
      if (formTargets.length > 0) createPayload.targets = formTargets;
      createCourse(createPayload, {
        onSuccess: async (newCourse) => {
          setIsFinishingSave(true);
          try {
            // Best-effort cover upload — NEVER keep the modal open here or a
            // re-submit would create a duplicate course.
            try {
              await uploadSelectedThumbnail(newCourse.id);
            } catch (error: any) {
              console.error('[uploadThumbnail]', error);
              toast.error('تم إنشاء الكورس، لكن تعذر رفع صورة الغلاف. عدّل الكورس وحاول رفعها مجدداً.');
            }
            finishSave();
            toast.success('تم إنشاء الكورس بنجاح');
          } finally {
            setIsFinishingSave(false);
          }
        },
        onError: handleMutationError,
      });
    }
  };

  const handleDelete = () => {
    if (!deletingCourseId) return;
    deleteCourse(deletingCourseId, {
      onSuccess: () => {
        setDeletingCourseId(null);
        toast.success('تم حذف الكورس بنجاح');
      },
      onError: (err: any) => {
        setDeletingCourseId(null);
        toast.error(err?.response?.data?.message ?? 'تعذر حذف الكورس — تأكد من صلاحياتك وحاول مجدداً');
      },
    });
  };

  return (
    <div className="space-y-8 text-right">
      {/* ─── Header with decorative vectors ─────────────────────────── */}
      <div className="relative">
        {/* Background vector pattern */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-10 h-64 w-full text-gold-500 opacity-[0.05]"
          viewBox="0 0 1440 256"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <pattern id="courses-hatch" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="1440" height="256" fill="url(#courses-hatch)" />
          <circle cx="1350" cy="16" r="140" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="90" cy="240" r="110" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <span className="absolute -inset-2 rounded-2xl border border-dashed border-gold-500/30 rotate-6" aria-hidden />
              <div className="flex w-14 h-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold-glow">
                <Library className="w-7 h-7 text-bg" strokeWidth={1.8} />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">إدارة الكورسات والمحتوى</h1>
              <p className="text-xs sm:text-sm text-ivory-muted flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gold-500/70 shrink-0" />
                إضافة وتعديل الكورسات، وإدارة الدروس والفيديوهات والامتحانات.
              </p>
            </div>
          </div>

          <Button
            onClick={handleOpenCreate}
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            إنشاء كورس جديد
          </Button>
        </div>

        {/* ─── ADMIN: teacher filter ─────────────────────────────────── */}
        {isAdmin && (
          <div className="relative z-10 mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-gold-500/25 bg-surface/60 p-3">
            <span className="text-[11px] font-bold text-gold-300 flex items-center gap-1.5 shrink-0">
              <Users className="w-3.5 h-3.5" />
              عرض كورسات:
            </span>
            <select
              value={teacherFilter}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setSearchParams({ teacherId: v });
                else setSearchParams({});
              }}
              className="flex-1 min-w-[200px] max-w-xs appearance-none rounded-lg border border-surface-border bg-bg-elevated px-3 py-2 text-xs text-ivory outline-none focus:border-gold-400 cursor-pointer"
            >
              <option value="">كل المعلمين (كل الكورسات)</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teacherProfile?.fullName ?? t.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ─── Stat chips ───────────────────────────────────────────── */}
        {!isLoading && courses.length > 0 && (
          <div className="relative z-10 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: BookOpen,
                value: courses.length,
                label: 'إجمالي الكورسات',
                tone: 'text-gold-300 bg-gold-500/10 border-gold-500/25',
              },
              {
                icon: Globe,
                value: courses.filter((c) => c.status === 'PUBLISHED').length,
                label: 'منشورة للطلاب',
                tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
              },
              {
                icon: Layers,
                value: courses.reduce((sum, c) => sum + (c.lessons?.length || c._count?.lessons || 0), 0),
                label: 'إجمالي الدروس',
                tone: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
              },
              {
                icon: Wallet,
                value: courses.filter((c) => c.isFree).length,
                label: 'كورسات مجانية',
                tone: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
              },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden flex items-center gap-3 p-3.5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/30 transition-all duration-300"
                >
                  <span className={`flex w-10 h-10 shrink-0 items-center justify-center rounded-xl border ${stat.tone}`}>
                    <StatIcon className="w-5 h-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-black font-amiri text-ivory leading-none">{stat.value}</p>
                    <p className="text-[10px] font-bold text-ivory-muted mt-1 truncate">{stat.label}</p>
                  </div>
                  {/* corner dot vector */}
                  <svg aria-hidden className="absolute -bottom-2 -left-2 w-10 h-10 text-gold-500/15 group-hover:text-gold-500/30 transition-colors" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Loading / Empty ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonManageRow key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="relative overflow-hidden p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-5">
          {/* Decorative vectors */}
          <svg aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 text-gold-500/10" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 7" />
            <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            <circle cx="50" cy="50" r="18" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
          </svg>
          <svg aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 w-40 h-40 text-gold-500/10" viewBox="0 0 120 60" fill="none">
            {Array.from({ length: 12 }).map((_, i) => (
              <circle key={i} cx={10 + (i % 6) * 20} cy={i < 6 ? 18 : 42} r="2.4" fill="currentColor" />
            ))}
          </svg>

          <div className="relative mx-auto w-24 h-24">
            <span className="absolute inset-0 rounded-full bg-gold-500/10 animate-ping opacity-30" style={{ animationDuration: '2.6s' }} />
            <span className="absolute -inset-2.5 rounded-full border-2 border-dashed border-gold-500/25 rotate-12" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 shadow-gold-glow">
              <Library className="w-11 h-11 text-bg" strokeWidth={1.6} />
            </div>
          </div>
          <h3 className="text-lg font-bold font-amiri text-ivory">لم تقم بإنشاء كورسات بعد</h3>
          <p className="text-xs text-ivory-muted max-w-sm mx-auto leading-relaxed">
            ابدأ الآن بإنشاء أول كورس لمادتك وحدد المرحلة الدراسية والسعر وأضف الدروس.
          </p>
          <Button onClick={handleOpenCreate} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            إنشاء كورس الآن
          </Button>
        </div>
      ) : null}

      {/* ─── Sections: تجميع الكورسات حسب المادة + فلترة سريعة ─────── */}
      {!isLoading && courses.length > 0 && (() => {
        const subjectOf = (c: Course) =>
          (c as { subjectRef?: { name: string } | null }).subjectRef?.name ??
          (c as { subject?: string | null }).subject ??
          'بدون مادة';
        const sections = Array.from(new Set(courses.map(subjectOf)));
        const filtered = courses.filter((c) => {
          if (activeSection && subjectOf(c) !== activeSection) return false;
          if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
          if (sectionSearch.trim()) {
            const q = sectionSearch.trim().toLowerCase();
            if (!c.title.toLowerCase().includes(q)) return false;
          }
          return true;
        });
        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface-card/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-gold-300 flex items-center gap-1.5 shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                  الأقسام:
                </span>
                <button
                  onClick={() => setActiveSection('')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    !activeSection
                      ? 'bg-primary text-white font-bold -translate-y-0.5'
                      : 'bg-surface-alt text-ink-muted hover:text-ink border border-line'
                  }`}
                >
                  الكل ({courses.length})
                </button>
                {sections.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSection(activeSection === s ? '' : s)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      activeSection === s
                        ? 'bg-primary text-white font-bold -translate-y-0.5'
                        : 'bg-surface-alt text-ink-muted hover:text-ink border border-line'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    {s} ({courses.filter((c) => subjectOf(c) === s).length})
                  </button>
                ))}
                <span className="flex-1" />
                <div className="relative min-w-[180px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-dark pointer-events-none" />
                  <input
                    value={sectionSearch}
                    onChange={(e) => setSectionSearch(e.target.value)}
                    placeholder="ابحث في كورساتك…"
                    className="w-full appearance-none rounded-lg border border-surface-border bg-bg-elevated ps-3 pe-9 py-2 text-xs text-ivory outline-none focus:border-gold-400"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-3">
                {([
                  { v: 'ALL', label: 'كل الحالات' },
                  { v: 'PUBLISHED', label: 'منشورة' },
                  { v: 'DRAFT', label: 'مسودات' },
                  { v: 'ARCHIVED', label: 'مؤرشفة' },
                ] as const).map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => setStatusFilter(v)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                      statusFilter === v
                        ? 'bg-gold-500/20 text-gold-200 border border-gold-500/40'
                        : 'bg-surface text-ivory-muted border border-surface-border hover:text-ivory'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <span className="flex-1" />
                <span className="text-[10px] text-ivory-muted">
                  {filtered.length} من {courses.length} كورس
                </span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-10 rounded-2xl bg-surface-card border border-dashed border-surface-border text-center space-y-3">
                <Library className="mx-auto w-8 h-8 text-ivory-dark" strokeWidth={1.6} />
                <h3 className="text-sm font-bold font-amiri text-ivory">لا توجد كورسات مطابقة</h3>
                <p className="text-xs text-ivory-muted">جرّب تغيير القسم أو البحث بكلمة أخرى.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveSection('');
                    setStatusFilter('ALL');
                    setSectionSearch('');
                  }}
                >
                  مسح الفلاتر
                </Button>
              </div>
            ) : (
              filtered.map((course) => {
                const lessonCount = course.lessons?.length || course._count?.lessons || 0;
                const isPublished = course.status === 'PUBLISHED';
                const studentCount = course._count?.enrollments;
                // Subject display name — normalized taxonomy first, legacy label fallback
                const subjectName =
                  (course as { subjectRef?: { name: string } | null }).subjectRef?.name ??
                  (course as { subject?: string | null }).subject ??
                  '';

                return (
              <div
                key={course.id}
                className="group relative overflow-hidden p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-all duration-300 flex flex-col gap-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {/* Top accent line on hover */}
                <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-gold-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Corner ring vector */}
                <svg aria-hidden className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 text-gold-500/10 group-hover:text-gold-500/20 group-hover:rotate-45 transition-all duration-500" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
                  <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1" opacity="0.55" />
                </svg>

                {/* Info */}
                <div className="flex items-start gap-4 relative z-[1] min-w-0 flex-1">
                  <div className="relative shrink-0">
                    {/* glow ring behind thumbnail */}
                    <span aria-hidden className="absolute -inset-1 rounded-2xl bg-gold-gradient opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-500" />
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-subtle overflow-hidden border border-surface-border group-hover:border-gold-500/50 transition-all duration-300 shadow-md">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-subtle to-gold-500/10">
                          <ScrollText className="w-9 h-9 text-gold-500/50" strokeWidth={1.6} />
                        </div>
                      )}
                    </div>
                    {/* status dot pinned on thumbnail */}
                    <span
                      title={isPublished ? 'منشور' : 'مسودة'}
                      className={`absolute -bottom-1 -right-1 flex w-6 h-6 items-center justify-center rounded-full border-2 border-surface-card ${
                        isPublished ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full bg-white ${isPublished ? 'animate-pulse' : ''}`} />
                    </span>
                  </div>

                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
                      <h3 className="text-lg font-bold font-amiri text-ivory group-hover:text-gold-200 transition-colors leading-snug">{course.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isPublished ? 'success' : 'neutral'}>
                          {isPublished ? 'منشور للطلاب' : 'مسودة (مخفي)'}
                        </Badge>
                        <CoursePrice
                          price={course.price}
                          isFree={course.isFree}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Subject field — prominent dedicated chip */}
                    <div>
                      {subjectName ? (
                        <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300">
                          <span className="flex w-5 h-5 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-400/25">
                            <BookOpen className="w-3 h-3" />
                          </span>
                          المادة: {subjectName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl bg-surface border border-dashed border-surface-border text-ivory-dark">
                          <BookOpen className="w-3 h-3" />
                          بدون مادة محددة — عدّل الكورس لاختيار المادة
                        </span>
                      )}
                    </div>

                    {/* Meta stat pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-ivory-muted" title="الفئة المستهدفة">
                        <GraduationCap className="w-3.5 h-3.5 text-gold-500/80 shrink-0" />
                        {course.targets?.length
                          ? formatTargets(course.targets)
                          : formatGradeLevels(course.gradeLevels?.length ? course.gradeLevels : [course.gradeLevel])}
                      </span>
                      {/* نوع الوصول: باقة أو للأبد */}
                      {course.accessType === 'LIMITED' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-400/30 text-violet-300" title="باقة محددة بوقت">
                          <Timer className="w-3.5 h-3.5 shrink-0" />
                          باقة {course.durationMonths ?? '—'} شهر
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-300" title="وصول دائم">
                          <InfinityIcon className="w-3.5 h-3.5 shrink-0" />
                          للأبد
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-ivory-muted" title="عدد الدروس">
                        <Layers className="w-3.5 h-3.5 text-gold-400/90 shrink-0" />
                        {lessonCount} {lessonCount === 1 ? 'درس' : 'دروس'}
                      </span>
                      {typeof studentCount === 'number' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-ivory-muted" title="عدد الطلاب المشتركين">
                          <Users className="w-3.5 h-3.5 text-sky-400/90 shrink-0" />
                          {studentCount} طالب
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-ivory-muted" title="تاريخ الإنشاء">
                        <CalendarDays className="w-3.5 h-3.5 text-ivory-dark shrink-0" />
                        {formatDate(course.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions — single row under image + info */}
                <div className="relative z-[1] flex flex-wrap items-center gap-2 pt-4 mt-1 border-t border-surface-border">
                  {/* Curriculum & Lesson Management Button */}
                  <Link to={`/dashboard/courses/${course.id}/curriculum`}>
                    <Button
                      variant="primary"
                      size="md"
                      leftIcon={<Video className="w-4 h-4" />}
                      rightIcon={<span className="text-[11px] font-black bg-white/15 rounded-full px-2 py-0.5">{lessonCount}</span>}
                      className="bg-gold-gradient text-bg border-none shadow-gold-glow/40 hover:brightness-110 font-bold !rounded-xl !py-2.5 !text-xs"
                    >
                      إدارة المحتوى والسكاشن
                    </Button>
                  </Link>

                  <Link to={`/dashboard/courses/${course.id}/students`}>
                    <Button variant="secondary" size="md" leftIcon={<Users className="w-4 h-4" />} className="!rounded-xl !py-2.5 !text-xs">
                      الطلاب
                    </Button>
                  </Link>

                  <Link to={`/courses/${course.id}/exams`}>
                    <Button variant="secondary" size="md" leftIcon={<FileQuestion className="w-4 h-4" />} className="!rounded-xl !py-2.5 !text-xs">
                      الامتحانات
                    </Button>
                  </Link>

                  <Link to={`/dashboard/courses/${course.id}/video`}>
                    <Button variant="secondary" size="md" leftIcon={<MonitorPlay className="w-4 h-4" />} className="!rounded-xl !py-2.5 !text-xs">
                      تخصيص الفيديو
                    </Button>
                  </Link>

                  <span className="flex-1" />

                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleOpenEdit(course)}
                    leftIcon={<Edit2 className="w-4 h-4" />}
                    className="!rounded-xl !py-2.5 !text-xs"
                  >
                    تعديل
                  </Button>

                  <Link to={`/courses/${course.id}`} target="_blank">
                    <Button variant="outline" size="md" leftIcon={<Eye className="w-4 h-4" />} className="!rounded-xl !py-2.5 !text-xs" title="معاينة كما يراها الطالب">
                      معاينة
                    </Button>
                  </Link>

                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => setDeletingCourseId(course.id)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    className="!rounded-xl !py-2.5 !text-xs"
                  >
                    حذف
                  </Button>
                </div>
              </div>
                );
              })
            )}
          </div>
        );
      })()}

      {/* ─── Create / Edit Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingCourse ? 'تعديل بيانات الكورس' : 'إنشاء كورس جديد'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-right">
          {/* ─── 1. البيانات الأساسية ─────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface/40 p-4 space-y-4">
            <svg aria-hidden className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 text-gold-500/10" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" />
            </svg>
            <div className="relative flex items-center gap-2 text-gold-300">
              <span className="flex w-8 h-8 items-center justify-center rounded-xl bg-gold-500/15 border border-gold-500/30">
                <BookOpen className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold font-amiri">البيانات الأساسية</h4>
            </div>
            <div className="relative space-y-4">
              <Input
                label="اسم الكورس"
                placeholder="مثال: الباب الأول - الحملة الفرنسية على مصر"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <ModernSelect
                label="المادة الدراسية"
                icon={<BookOpen className="w-4 h-4" />}
                value={formData.subjectId}
                onChange={(v) => setFormData({ ...formData, subjectId: v })}
                placeholder="اختر المادة…"
                options={subjects.map((s: { id: string; name: string; isActive: boolean }) => ({
                  value: s.id,
                  label: s.name,
                  disabled: !s.isActive,
                }))}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-ivory/90 font-cairo">وصف الكورس</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-surface-border bg-surface p-3 text-xs text-ivory outline-none transition-all duration-300 focus:border-gold-400 focus:bg-bg-elevated focus:shadow-[0_0_0_4px_rgba(201,161,90,0.12)]"
                  placeholder="اكتب نبذة توضيحية عن محتوى الكورس والمحاضرات..."
                  required
                />
              </div>
            </div>
          </div>

          {/* ─── 2. الفئة المستهدفة (cascading taxonomy picker) ────────── */}
          <EducationTargetPicker
            existingTargets={savedTargets}
            targets={formTargets}
            onChange={setFormTargets}
            error={targetsError}
            onAddSaved={editingCourse ? handleAddSavedTarget : undefined}
            onRemoveSaved={editingCourse ? handleRemoveSavedTarget : undefined}
            onUpdateSaved={editingCourse ? handleUpdateSavedTarget : undefined}
          />

          {/* ─── 3. ماذا سيستفيد الطالب؟ ──────────────────────────────── */}
          <div className="rounded-2xl border border-surface-border bg-surface/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-gold-300">
              <span className="flex w-8 h-8 items-center justify-center rounded-xl bg-gold-500/15 border border-gold-500/30">
                <ListChecks className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold font-amiri">ماذا سيستفيد الطالب؟</h4>
                <p className="text-[11px] text-ivory-muted">اكتب كل فائدة في سطر منفصل لتظهر كنقاط منظمة للطالب.</p>
              </div>
            </div>
            <textarea
              rows={5}
              value={formData.learningOutcomes}
              onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
              className="w-full rounded-xl border border-surface-border bg-surface p-3 text-xs leading-relaxed text-ivory outline-none transition-all duration-300 focus:border-gold-400 focus:bg-bg-elevated focus:shadow-[0_0_0_4px_rgba(201,161,90,0.12)]"
              placeholder={'مثال:\nفهم أحداث المنهج بترتيبها الزمني\nحل تدريبات متنوعة على كل وحدة\nالاستعداد للامتحانات بدرجة أعلى'}
            />
          </div>

          {/* ─── 4. السعر وحالة النشر ─────────────────────────────────── */}
          <div className="rounded-2xl border border-surface-border bg-surface/40 p-4 space-y-4">
            <div className="flex items-center gap-2 text-gold-300">
              <span className="flex w-8 h-8 items-center justify-center rounded-xl bg-gold-500/15 border border-gold-500/30">
                <Wallet className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold font-amiri">السعر وحالة النشر</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModernSelect
                label="حالة النشر"
                icon={<Globe className="w-4 h-4" />}
                value={formData.status}
                onChange={(v) => setFormData({ ...formData, status: v as CourseStatus })}
                options={[
                  { value: 'PUBLISHED', label: 'منشور فوراً (يظهر للطلاب)' },
                  { value: 'DRAFT', label: 'مسودة (حفظ مؤقت)' },
                  { value: 'ARCHIVED', label: 'مؤرشف' },
                ]}
              />

              {!formData.isFree ? (
                <Input
                  label="سعر الكورس (ج.م)"
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
              ) : (
                <div className="flex items-end pb-1">
                  <p className="w-full flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    كورس مجاني بالكامل للجميع
                  </p>
                </div>
              )}
            </div>

            {/* ─── كوبون الخصم / عرض محدود ─────────────────────────── */}
            {!formData.isFree && (
              <div className="rounded-xl border border-rose-400/25 bg-rose-500/[0.04] p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <Tag className="w-4 h-4" />
                    كوبون خصم — عرض يظهر على كارت الكورس
                  </span>
                  {Number(formData.discountPercent) >= 1 && formData.discountEndsAt && (
                    <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-black text-rose-200">
                      السعر بعد الخصم:{' '}
                      <span className="tabular-nums">
                        {(Math.max(0, Number(formData.price) || 0) * (1 - Number(formData.discountPercent) / 100)).toLocaleString('ar-EG')} ج.م
                      </span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="نسبة الخصم % (اتركها فارغة لإلغاء العرض)"
                    type="number"
                    min="1"
                    max="90"
                    value={formData.discountPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPercent: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    placeholder="مثال: 25"
                  />
                  <Input
                    label="تاريخ ووقت انتهاء العرض"
                    type="datetime-local"
                    value={formData.discountEndsAt}
                    onChange={(e) => setFormData({ ...formData, discountEndsAt: e.target.value })}
                  />
                </div>

                {Number(formData.discountPercent) >= 1 && !formData.discountEndsAt && (
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    لا بد من تحديد وقت انتهاء العرض — بعد هذا الوقت يختفي الخصم تلقائياً ويعود السعر الأصلي.
                  </p>
                )}
              </div>
            )}

            {/* ─── نوع الوصول: باقة محددة بوقت أم دروس للأبد ──────────── */}
            <div className="rounded-xl border border-violet-400/25 bg-violet-500/[0.04] p-3.5 space-y-3">
              <span className="flex items-center gap-2 text-xs font-bold text-violet-300">
                <Timer className="w-4 h-4" />
                نوع الوصول للكورس
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition-colors ${
                    formData.accessType === 'LIFETIME'
                      ? 'border-emerald-400/50 bg-emerald-500/10'
                      : 'border-surface-border bg-surface hover:border-gold-500/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="accessType"
                    checked={formData.accessType === 'LIFETIME'}
                    onChange={() => setFormData({ ...formData, accessType: 'LIFETIME' })}
                    className="mt-0.5 accent-emerald-400"
                  />
                  <span>
                    <span className="block text-xs font-bold text-ivory">دروس للأبد</span>
                    <span className="block text-[10px] text-ivory-muted mt-0.5">الطالب يحتفظ بالوصول الدائم للمحتوى.</span>
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition-colors ${
                    formData.accessType === 'LIMITED'
                      ? 'border-violet-400/50 bg-violet-500/10'
                      : 'border-surface-border bg-surface hover:border-gold-500/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="accessType"
                    checked={formData.accessType === 'LIMITED'}
                    onChange={() => setFormData({ ...formData, accessType: 'LIMITED' })}
                    className="mt-0.5 accent-violet-400"
                  />
                  <span className="flex-1">
                    <span className="block text-xs font-bold text-ivory">باقة بمؤقت</span>
                    <span className="block text-[10px] text-ivory-muted mt-0.5">مثال: 3 شهور — عند الانتهاء يفقد الطالب الوصول تلقائياً.</span>
                    {formData.accessType === 'LIMITED' && (
                      <Input
                        label="مدة الباقة (بالأشهر)"
                        type="number"
                        min="1"
                        value={formData.durationMonths}
                        onChange={(e) =>
                          setFormData({ ...formData, durationMonths: e.target.value === '' ? '' : Number(e.target.value) })
                        }
                        className="!mt-2"
                        required
                      />
                    )}
                  </span>
                </label>
              </div>
            </div>

            {/* Free toggle — modern switch */}
            <label className="flex cursor-pointer select-none items-center justify-between rounded-xl border border-surface-border bg-surface px-3.5 py-3 hover:border-gold-500/30 transition-colors">
              <span className="flex items-center gap-2 text-xs font-medium text-ivory">
                <Sparkles className="w-4 h-4 text-gold-400" />
                تفعيل الوضع المجاني — الكورس متاح لجميع الطلاب بدون رسوم
              </span>
              <span className="relative">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  className="peer sr-only"
                />
                <span className={`block h-6 w-11 rounded-full border transition-colors duration-300 ${formData.isFree ? 'bg-emerald-500 border-emerald-400' : 'bg-surface-elevated border-surface-border'}`} />
                <span className={`absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${formData.isFree ? '-translate-x-5' : ''}`} />
              </span>
            </label>
          </div>

          <CourseImagePicker
            mode={thumbnailSource}
            onModeChange={handleThumbnailSourceChange}
            preview={thumbnailPreview}
            isNewUpload={isNewImagePicked}
            fileName={selectedThumbnail?.name}
            url={formData.thumbnailUrl}
            onUrlChange={handleThumbnailUrlChange}
            onPickFile={handleSelectThumbnail}
            onClear={handleClearThumbnail}
          />

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{formError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isBusySaving}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              isLoading={isBusySaving}
              disabled={isBusySaving}
            >
              {isBusySaving
                ? selectedThumbnail
                  ? 'جاري الحفظ ورفع الصورة...'
                  : 'جاري الحفظ...'
                : editingCourse
                ? 'حفظ التعديلات'
                : 'إنشاء الكورس'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Confirmation Modal ───────────────────────────────── */}
      <Modal
        isOpen={!!deletingCourseId}
        onClose={() => setDeletingCourseId(null)}
        title="تأكيد حذف الكورس"
      >
        <div className="space-y-4 text-right">
          <div className="relative overflow-hidden p-5 rounded-2xl bg-red-500/5 border border-red-500/25 space-y-3">
            {/* corner vector */}
            <svg aria-hidden className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 text-red-500/15" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" />
            </svg>
            <div className="relative flex items-start gap-3.5">
              <span className="flex w-11 h-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/35">
                <TriangleAlert className="w-5 h-5 text-red-400" strokeWidth={1.9} />
              </span>
              <p className="text-xs text-ivory-muted leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا الكورس؟ سيتم أرشفة الكورس ولن يظهر للطلاب الجدد.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingCourseId(null)}>
              تراجع
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
              نعم، تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Lesson Manager Modal ────────────────────────────────────── */}
      {managingLessonsCourse && (
        <LessonManagerModal
          isOpen={!!managingLessonsCourse}
          onClose={() => setManagingLessonsCourse(null)}
          course={managingLessonsCourse}
        />
      )}
    </div>
  );
};
