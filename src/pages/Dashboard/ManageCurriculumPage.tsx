import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Video,
  FileText,
  PlayCircle,
  Download,
  ArrowRight,
  FolderPlus,
  Layers,
  AlertCircle,
  Clock,
  Eye,
  Upload,
  Link as LinkIcon,
  ArrowUp,
  ArrowDown,
  FileQuestion,
  ClipboardList,
  MessageSquareText,
  CloudUpload,
  Loader2,
  FileVideo,
  Film,
  X,
  BookOpenCheck,
  CheckCircle2,
} from 'lucide-react';
import { useCourseDetailQuery } from '../../hooks/queries/useCourses';
import { useCurriculumQuery } from '../../hooks/queries/useCurriculum';
import {
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useReorderSectionsMutation,
} from '../../hooks/mutations/useCurriculumMutations';
import {
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
} from '../../hooks/mutations/useLessonMutations';
import { lessonsApi } from '../../api/lessons.api';
import { Section, Lesson } from '../../types/course.types';
import { formatDuration, formatGradeLevel, formatGradeLevels } from '../../lib/utils';
import { formatTargets } from '../../lib/formatTargets';
import { Button } from '../../components/ui/Button';
import { VideoPlayer } from '../../components/video/VideoPlayer';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { refreshCourseViews } from '../../lib/courseCache';
import { taxonomyApi } from '../../api/taxonomy.api';
import type { CourseTargetRef } from '../../types/taxonomy.types';
import { QuizManagerModal } from './QuizManagerModal';
import { HomeworkManagerModal } from './HomeworkManagerModal';

export const ManageCurriculumPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading: isCourseLoading } = useCourseDetailQuery(courseId || '');
  const { data: curriculum, isLoading: isCurriculumLoading } = useCurriculumQuery(courseId || '');

  // Targets (new taxonomy system) — the course detail endpoint doesn't embed them,
  // so we fetch them from their dedicated endpoint.
  const { data: courseTargets } = useQuery<CourseTargetRef[]>({
    queryKey: ['course-targets', courseId],
    queryFn: () => taxonomyApi.getCourseTargets(courseId!),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
  });


  const { mutate: createSection, isPending: isCreatingSection } = useCreateSectionMutation(courseId || '');
  const { mutate: updateSection, isPending: isUpdatingSection } = useUpdateSectionMutation(courseId || '');
  const { mutate: deleteSection, isPending: isDeletingSection } = useDeleteSectionMutation(courseId || '');
  const { mutate: reorderSections, isPending: isReordering } = useReorderSectionsMutation(courseId || '');

  const { mutate: createLesson, isPending: isCreatingLesson } = useCreateLessonMutation(courseId || '');
  const { mutate: updateLesson, isPending: isUpdatingLesson } = useUpdateLessonMutation(courseId || '');
  const { mutate: deleteLesson, isPending: isDeletingLesson } = useDeleteLessonMutation(courseId || '');

  // Section Accordion expanded states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Section Modals
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

  // Lesson Modals
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [targetSectionIdForLesson, setTargetSectionIdForLesson] = useState<string>('');
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    durationSeconds: 0,
    isPreview: false,
    orderIndex: 1,
  });
  const [videoSourceType, setVideoSourceType] = useState<'url' | 'upload'>('url');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  // Real duration read from the uploaded file's metadata — replaces manual entry
  const [detectedDurationSeconds, setDetectedDurationSeconds] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoDragDepth = useRef(0);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);
  const [homeworkLesson, setHomeworkLesson] = useState<Lesson | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Material Modals
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [targetSectionIdForMaterial, setTargetSectionIdForMaterial] = useState<string>('');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [selectedMaterialFile, setSelectedMaterialFile] = useState<File | null>(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);

  // Video Preview Modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const sections = curriculum?.sections || [];

  const totalHomeworksCount = React.useMemo(() => {
    if (typeof (curriculum as any)?.totalHomeworks === 'number') {
      return (curriculum as any).totalHomeworks;
    }
    return sections.reduce(
      (acc, s) => acc + (s.lessons?.reduce((lAcc, l) => lAcc + (l.homeworks?.length || 0), 0) || 0),
      0
    );
  }, [curriculum, sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId] === undefined ? false : !prev[sectionId],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    sections.forEach((s) => {
      next[s.id] = true;
    });
    setExpandedSections(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    sections.forEach((s) => {
      next[s.id] = false;
    });
    setExpandedSections(next);
  };

  // Section Handlers
  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) {
      setSectionError('يرجى كتابة عنوان الفصل');
      return;
    }
    setSectionError(null);

    if (editingSection) {
      updateSection(
        { sectionId: editingSection.id, data: { title: sectionTitle.trim() } },
        {
          onSuccess: () => {
            setEditingSection(null);
            setSectionTitle('');
            setIsAddSectionModalOpen(false);
          },
          onError: (err: any) => {
            setSectionError(err?.response?.data?.message || 'حدث خطأ أثناء تعديل الفصل');
          },
        }
      );
    } else {
      createSection(
        { title: sectionTitle.trim() },
        {
          onSuccess: () => {
            setSectionTitle('');
            setIsAddSectionModalOpen(false);
          },
          onError: (err: any) => {
            setSectionError(err?.response?.data?.message || 'حدث خطأ أثناء إنشاء الفصل');
          },
        }
      );
    }
  };

  const handleDeleteSectionConfirm = () => {
    if (!deletingSectionId) return;
    deleteSection(deletingSectionId, {
      onSuccess: () => {
        setDeletingSectionId(null);
        setSectionError(null);
      },
      onError: (err: any) => {
        setSectionError(err?.response?.data?.message || 'لا يمكن حذف هذا الفصل');
      },
    });
  };

  const handleMoveSection = (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(currentIndex, 1);
    newSections.splice(targetIndex, 0, moved);

    reorderSections({
      sectionIds: newSections.map((s) => s.id),
    });
  };

  // Lesson Handlers
  const handleOpenAddLesson = (sectionId: string) => {
    setTargetSectionIdForLesson(sectionId);
    setEditingLesson(null);
    setLessonFormData({
      title: '',
      description: '',
      videoUrl: '',
      durationSeconds: 0,
      isPreview: false,
      orderIndex: (sections.find((s) => s.id === sectionId)?.lessons.length || 0) + 1,
    });
    setVideoSourceType('upload');
    setSelectedVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setDetectedDurationSeconds(null);
    setLessonError(null);
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setTargetSectionIdForLesson(lesson.sectionId || '');
    setLessonFormData({
      title: lesson.title,
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      durationSeconds: lesson.durationSeconds || 0,
      isPreview: lesson.isPreview,
      orderIndex: lesson.orderIndex,
    });
    setVideoSourceType('upload');
    setSelectedVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setDetectedDurationSeconds(null);
    setLessonError(null);
    setIsLessonModalOpen(true);
  };

  // Read the real duration from the video file's metadata (exact, not rounded)
  const handleVideoFileSelected = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setLessonError('الملف المحدد ليس فيديو صالحاً — الصيغ المدعومة: MP4, WebM, MOV, MKV.');
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setLessonError('حجم الفيديو يتجاوز الحد الأقصى (200 ميجابايت).');
      return;
    }

    setLessonError(null);
    setSelectedVideoFile(file);
    setDetectedDurationSeconds(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(file));

    const url = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) {
        const secs = Math.round(probe.duration);
        setDetectedDurationSeconds(secs);
        setLessonFormData((prev) => ({ ...prev, durationSeconds: secs }));
      }
      URL.revokeObjectURL(url);
    };
    probe.onerror = () => URL.revokeObjectURL(url);
    probe.src = url;
  };

  const removeSelectedVideoFile = () => {
    setSelectedVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setDetectedDurationSeconds(null);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonFormData.title.trim()) {
      setLessonError('عنوان الدرس مطلوب');
      return;
    }
    setLessonError(null);

    try {
      if (editingLesson) {
        // عند اختيار ملف فيديو محلي في وضع التعديل: تحديث البيانات ثم رفع الملف ليستبدل القديم
        if (videoSourceType === 'upload' && selectedVideoFile) {
          setIsUploadingVideo(true);
          setUploadProgress(0);
        }

        updateLesson(
          {
            lessonId: editingLesson.id,
            data: {
              ...lessonFormData,
              sectionId: targetSectionIdForLesson || undefined,
            },
          },
          {
            onSuccess: async () => {
              if (videoSourceType === 'upload' && selectedVideoFile) {
                await lessonsApi.uploadVideoDirect(
                  editingLesson.id,
                  selectedVideoFile,
                  lessonFormData.durationSeconds || undefined,
                  (progress) => setUploadProgress(progress)
                );
                await refreshCourseViews(queryClient, courseId);
                setIsUploadingVideo(false);
              }
              setIsLessonModalOpen(false);
              setEditingLesson(null);
            },
            onError: (err: any) => {
              setIsUploadingVideo(false);
              setLessonError(err?.response?.data?.message || 'حدث خطأ أثناء تعديل الدرس');
            },
          }
        );
      } else {
        if (videoSourceType === 'upload' && selectedVideoFile) {
          setIsUploadingVideo(true);
          const newLesson = await lessonsApi.create(courseId!, {
            ...lessonFormData,
            sectionId: targetSectionIdForLesson || undefined,
          });

          // رفع إلى التخزين مباشرة حتى لا يستهلك الفيديو ذاكرة خادم الـAPI.
          await lessonsApi.uploadVideoDirect(
            newLesson.id,
            selectedVideoFile,
            lessonFormData.durationSeconds || undefined,
            (progress) => {
              setUploadProgress(progress);
            }
          );

          setIsUploadingVideo(false);
          setIsLessonModalOpen(false);
          await refreshCourseViews(queryClient, courseId);
        } else {
          createLesson(
            {
              ...lessonFormData,
              sectionId: targetSectionIdForLesson || undefined,
            },
            {
              onSuccess: () => {
                setIsLessonModalOpen(false);
              },
              onError: (err: any) => {
                setLessonError(err?.response?.data?.message || 'حدث خطأ أثناء إضافة الدرس');
              },
            }
          );
        }
      }
    } catch (err: any) {
      setIsUploadingVideo(false);
      const isUploadFailure = !err?.response && !!selectedVideoFile;
      setLessonError(
        isUploadFailure
          ? 'تعذر رفع الفيديو إلى السيرفر — تأكد من تشغيل الـ Backend ومن صحة عنوان الـ API ثم أعد المحاولة.'
          : err?.response?.data?.message || err?.message || 'حدث خطأ غير متوقع'
      );
    }
  };

  const handleDeleteLessonConfirm = () => {
    if (!deletingLessonId) return;
    deleteLesson(deletingLessonId, {
      onSuccess: () => {
        setDeletingLessonId(null);
      },
    });
  };

  // Material Handlers
  const handleOpenAddMaterial = (sectionId: string) => {
    setTargetSectionIdForMaterial(sectionId);
    setMaterialTitle('');
    setMaterialDescription('');
    setSelectedMaterialFile(null);
    setMaterialError(null);
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim()) {
      setMaterialError('عنوان المرفق مطلوب');
      return;
    }
    if (!selectedMaterialFile) {
      setMaterialError('يرجى اختيار ملف لرفعه (PDF, PPTX, DOC)');
      return;
    }
    setMaterialError(null);
    setIsUploadingMaterial(true);

    try {
      await lessonsApi.uploadMaterialFile(courseId!, {
        title: materialTitle.trim(),
        description: materialDescription.trim() || undefined,
        sectionId: targetSectionIdForMaterial,
        kind: 'MATERIAL',
        file: selectedMaterialFile,
      });

      setIsUploadingMaterial(false);
      setIsMaterialModalOpen(false);
      await refreshCourseViews(queryClient, courseId);
    } catch (err: any) {
      setIsUploadingMaterial(false);
      setMaterialError(err?.response?.data?.message || 'فشل رفع الملف. تأكد من الصيغة والحجم (أقل من 50MB).');
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await lessonsApi.deleteMaterial(materialId);
      await refreshCourseViews(queryClient, courseId);
    } catch (err: any) {
      alert('حدث خطأ أثناء حذف الملف');
    }
  };

  const handleDownloadMaterial = async (materialId: string) => {
    try {
      const { downloadUrl } = await lessonsApi.getMaterialDownloadUrl(materialId);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      alert('تعذر تحميل الملف');
    }
  };

  const handlePreviewLesson = async (lesson: Lesson) => {
    setPreviewTitle(lesson.title);
    if (lesson.videoUrl?.includes('youtube.com') || lesson.videoUrl?.includes('youtu.be')) {
      setPreviewVideoUrl(lesson.videoUrl);
    } else {
      try {
        const streamUrl = await lessonsApi.getStreamUrl(lesson.id);
        setPreviewVideoUrl(streamUrl || lesson.videoUrl || null);
      } catch (err) {
        setPreviewVideoUrl(lesson.videoUrl || null);
      }
    }
  };

  if (isCourseLoading || isCurriculumLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border/60 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-ivory-muted font-medium">
            <Link to="/dashboard/courses" className="hover:text-gold-400 flex items-center gap-1 transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
              العودة لكورساتي
            </Link>
            <span>/</span>
            <span className="text-gold-400">إدارة محتوى الكورس والسكاشن</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold font-amiri text-ivory flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-gold-400" />
              {course?.title || 'إدارة المحتوى والسكاشن'}
            </h1>
            <Badge variant={course?.status === 'PUBLISHED' ? 'success' : 'neutral'}>
              {course?.status === 'PUBLISHED' ? 'منشور للطلاب' : 'مسودة'}
            </Badge>
            {(() => {
              // Priority: new taxonomy targets → legacy gradeLevels → legacy gradeLevel
              const label = courseTargets?.length
                ? formatTargets(courseTargets)
                : course?.gradeLevels?.length
                ? formatGradeLevels(course.gradeLevels)
                : course?.gradeLevel
                ? formatGradeLevel(course.gradeLevel)
                : null;
              return label ? (
                <Badge variant="gold" className="text-xs">
                  {label}
                </Badge>
              ) : null;
            })()}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddSectionModalOpen(true)}
            leftIcon={<FolderPlus className="w-4 h-4 text-gold-400" />}
            className="border-gold-500/40 text-gold-300 hover:bg-gold-500/10 font-bold"
          >
            إضافة فصل جديد
          </Button>

          <Link to={`/courses/${courseId}/exams`}>
            <Button variant="secondary" size="sm" leftIcon={<FileQuestion className="w-4 h-4" />}>
              امتحانات الكورس
            </Button>
          </Link>

          <Link to={`/courses/${courseId}`} target="_blank">
            <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
              معاينة كطالب
            </Button>
          </Link>
        </div>
      </div>

      {/* Course Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-4 sm:p-5 rounded-2xl bg-surface/80 border border-surface-border shadow-lg">
        <div className="text-center p-3 rounded-xl bg-bg/40 border border-surface-border/40">
          <span className="block text-2xl font-bold text-gold-400 font-cairo">
            {curriculum?.totalSections || sections.length}
          </span>
          <span className="text-xs text-ivory-muted font-medium">إجمالي الفصول</span>
        </div>
        <div className="text-center p-3 rounded-xl bg-bg/40 border border-surface-border/40">
          <span className="block text-2xl font-bold text-gold-400 font-cairo">
            {curriculum?.totalLessons || 0}
          </span>
          <span className="text-xs text-ivory-muted font-medium">المحاضرات والدروس</span>
        </div>
        <div className="text-center p-3 rounded-xl bg-bg/40 border border-violet-500/20 bg-violet-500/5">
          <span className="block text-2xl font-bold text-violet-400 font-cairo">
            {totalHomeworksCount}
          </span>
          <span className="text-xs text-violet-300/80 font-medium">الواجبات والتطبيقات</span>
        </div>
        <div className="text-center p-3 rounded-xl bg-bg/40 border border-surface-border/40">
          <span className="block text-2xl font-bold text-blue-400 font-cairo">
            {curriculum?.totalMaterials || 0}
          </span>
          <span className="text-xs text-ivory-muted font-medium">الملفات والملازم</span>
        </div>
        <div className="text-center p-3 rounded-xl bg-bg/40 border border-surface-border/40 col-span-2 sm:col-span-1">
          <span className="block text-2xl font-bold text-emerald-400 font-cairo">
            {course?.isFree ? 'مجاني' : `${course?.price} ج.م`}
          </span>
          <span className="text-xs text-ivory-muted font-medium">سعر الكورس</span>
        </div>
      </div>

      {/* Accordion Controls & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-ivory font-amiri">هيكلية وفصول الكورس (Curriculum)</h2>
          <span className="text-xs text-ivory-muted">({sections.length} فصول)</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={expandAll}
            className="text-ivory-muted hover:text-gold-400 transition-colors px-2.5 py-1 rounded-lg bg-surface border border-surface-border"
          >
            توسيع الكل
          </button>
          <button
            onClick={collapseAll}
            className="text-ivory-muted hover:text-gold-400 transition-colors px-2.5 py-1 rounded-lg bg-surface border border-surface-border"
          >
            طي الكل
          </button>
        </div>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface/50 border border-dashed border-gold-500/30 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto text-gold-400">
            <FolderPlus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-ivory font-amiri">لا توجد فصول مضافة بعد</h3>
            <p className="text-xs text-ivory-muted max-w-md mx-auto">
              قم بإنشاء أول فصل (Section) لتنظيم المحاضرات والملفات بطريقة منظمة وجذابة لطلابك مثل Udemy.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddSectionModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            إنشاء أول فصل الآن
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sIndex) => {
            const isExpanded = expandedSections[section.id] !== false; // expanded by default
            const lessonsCount = section.lessons?.length || 0;
            const materialsCount = section.materials?.length || 0;
            const sectionHomeworksCount =
              section.lessons?.reduce((acc, l) => acc + (l.homeworks?.length || 0), 0) || 0;

            return (
              <div
                key={section.id}
                className="rounded-2xl bg-surface/90 border border-surface-border shadow-md overflow-hidden transition-all duration-200 hover:border-gold-500/30"
              >
                {/* Section Header */}
                <div
                  className={`p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                    isExpanded ? 'bg-surface-elevated/70 border-b border-surface-border/60' : 'bg-surface/50'
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-[240px]">
                    <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400 font-bold text-xs shrink-0 font-cairo">
                      {sIndex + 1}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-ivory font-amiri">{section.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ivory-muted flex-wrap">
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-gold-400/80" />
                          {lessonsCount} {lessonsCount === 1 ? 'محاضرة' : 'محاضرات'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-400/80" />
                          {materialsCount} {materialsCount === 1 ? 'ملف' : 'ملفات'}
                        </span>
                        {sectionHomeworksCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-violet-300 font-medium">
                              <BookOpenCheck className="w-3.5 h-3.5 text-violet-400" />
                              {sectionHomeworksCount} {sectionHomeworksCount === 1 ? 'واجب' : 'واجبات'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Controls */}
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Move Up / Down */}
                    <div className="flex items-center gap-0.5 bg-bg/60 rounded-lg p-0.5 border border-surface-border">
                      <button
                        type="button"
                        disabled={sIndex === 0 || isReordering}
                        onClick={() => handleMoveSection(sIndex, 'up')}
                        title="تحريك لأعلى"
                        className="p-1.5 text-ivory-muted hover:text-gold-400 disabled:opacity-30 disabled:hover:text-ivory-muted transition-colors rounded"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={sIndex === sections.length - 1 || isReordering}
                        onClick={() => handleMoveSection(sIndex, 'down')}
                        title="تحريك لأسفل"
                        className="p-1.5 text-ivory-muted hover:text-gold-400 disabled:opacity-30 disabled:hover:text-ivory-muted transition-colors rounded"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add Lesson */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenAddLesson(section.id)}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="bg-gold-500/10 text-gold-300 border border-gold-500/30 hover:bg-gold-500 hover:text-bg text-xs font-bold"
                    >
                      إضافة درس
                    </Button>

                    {/* Add Material */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddMaterial(section.id)}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      إضافة ملف
                    </Button>

                    {/* Edit Section */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSection(section);
                        setSectionTitle(section.title);
                        setIsAddSectionModalOpen(true);
                      }}
                      title="تعديل اسم الفصل"
                      className="p-2 rounded-lg text-ivory-muted hover:text-gold-400 hover:bg-surface-elevated transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Section */}
                    <button
                      type="button"
                      onClick={() => setDeletingSectionId(section.id)}
                      title="حذف الفصل"
                      className="p-2 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand/Collapse Toggle */}
                    <div className="p-1 text-ivory-muted">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Section Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-5 bg-bg/30">
                    {/* Lessons Sub-section */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gold-400/90 font-cairo flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" />
                          المحاضرات والدروس ({lessonsCount})
                        </span>
                      </div>

                      {lessonsCount === 0 ? (
                        <div className="p-4 text-center rounded-xl bg-surface/30 border border-surface-border/40 text-xs text-ivory-muted">
                          لا توجد محاضرات في هذا الفصل بعد.{' '}
                          <button
                            onClick={() => handleOpenAddLesson(section.id)}
                            className="text-gold-400 hover:underline font-bold"
                          >
                            أضف درساً الآن
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {section.lessons.map((lesson, lIndex) => (
                            <div
                              key={lesson.id}
                              className="p-3 sm:p-3.5 rounded-xl bg-surface border border-surface-border flex flex-wrap items-center justify-between gap-3 hover:border-gold-500/30 transition-all"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                <span className="w-6 h-6 rounded-lg bg-surface-elevated text-ivory-muted flex items-center justify-center text-xs font-bold shrink-0 font-cairo">
                                  {lIndex + 1}
                                </span>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-bold text-ivory font-amiri">{lesson.title}</h4>
                                    {lesson.isPreview && (
                                      <Badge variant="gold" className="text-[10px] py-0 px-1.5">
                                        معاينة مجانية
                                      </Badge>
                                    )}
                                    {lesson.homeworks && lesson.homeworks.length > 0 && (
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setHomeworkLesson(lesson);
                                          }}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 cursor-pointer transition-colors"
                                          title="إدارة وتعديل الواجب"
                                        >
                                          <BookOpenCheck className="w-3 h-3 text-violet-400" />
                                          {lesson.homeworks.length === 1
                                            ? `واجب (${lesson.homeworks[0]?.questionCount ?? 0} أسئلة)`
                                            : `${lesson.homeworks.length} واجبات`}
                                        </span>
                                        <Link
                                          to={`/dashboard/homework/${lesson.homeworks[0].id}/submissions`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                          title="عرض وتصحيح تسليمات الطلاب"
                                        >
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          تصحيح تسليمات الطلاب
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                  {lesson.description && (
                                    <p className="text-xs text-ivory-muted line-clamp-1">{lesson.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {lesson.durationSeconds > 0 && (
                                  <span className="text-xs text-ivory-muted flex items-center gap-1 font-cairo">
                                    <Clock className="w-3.5 h-3.5 text-gold-400/70" />
                                    {formatDuration(lesson.durationSeconds)}
                                  </span>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePreviewLesson(lesson)}
                                  leftIcon={<PlayCircle className="w-4 h-4 text-gold-400" />}
                                  className="text-xs"
                                >
                                  تشغيل
                                </Button>

                                <button
                                  type="button"
                                  onClick={() => navigate(`/courses/${courseId}/learn?lesson=${lesson.id}`)}
                                  className="p-1.5 rounded-lg text-ivory-muted hover:text-emerald-400 hover:bg-surface-elevated transition-colors"
                                  title="أسئلة الطلاب"
                                >
                                  <MessageSquareText className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setQuizLesson(lesson)}
                                  className="p-1.5 rounded-lg text-ivory-muted hover:text-gold-400 hover:bg-surface-elevated transition-colors"
                                  title="إدارة الكويز"
                                >
                                  <ClipboardList className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setHomeworkLesson(lesson)}
                                  className={`relative p-1.5 rounded-lg transition-colors ${
                                    (lesson.homeworks?.length ?? 0) > 0
                                      ? 'text-violet-300 bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 shadow-sm'
                                      : 'text-ivory-muted hover:text-violet-400 hover:bg-surface-elevated'
                                  }`}
                                  title="إدارة الواجب"
                                >
                                  <BookOpenCheck className="w-3.5 h-3.5" />
                                  {(lesson.homeworks?.length ?? 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                                      {lesson.homeworks?.length}
                                    </span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLesson(lesson)}
                                  className="p-1.5 rounded-lg text-ivory-muted hover:text-gold-400 hover:bg-surface-elevated transition-colors"
                                  title="تعديل الدرس"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDeletingLessonId(lesson.id)}
                                  className="p-1.5 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="حذف الدرس"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Materials Sub-section */}
                    <div className="space-y-2.5 pt-2 border-t border-surface-border/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400/90 font-cairo flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          الملفات والمذكرات المرفقة ({materialsCount})
                        </span>
                      </div>

                      {materialsCount === 0 ? (
                        <div className="p-3 text-center rounded-xl bg-surface/20 border border-dashed border-surface-border/40 text-xs text-ivory-muted">
                          لا توجد ملفات مرفقة في هذا الفصل.{' '}
                          <button
                            onClick={() => handleOpenAddMaterial(section.id)}
                            className="text-blue-400 hover:underline font-bold"
                          >
                            ارفع ملف PDF أو عرض تقديمي
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {section.materials.map((mat) => (
                            <div
                              key={mat.id}
                              className="p-3 rounded-xl bg-surface border border-surface-border flex items-center justify-between gap-3 hover:border-blue-400/30 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-bold text-ivory truncate">{mat.title}</h5>
                                  <span className="text-[10px] text-ivory-muted uppercase">
                                    {mat.fileType}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadMaterial(mat.id)}
                                  className="p-1.5 rounded-lg text-ivory-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                  title="تحميل الملف"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMaterial(mat.id)}
                                  className="p-1.5 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="حذف الملف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create/Edit Section */}
      <Modal
        isOpen={isAddSectionModalOpen}
        onClose={() => {
          setIsAddSectionModalOpen(false);
          setEditingSection(null);
          setSectionTitle('');
          setSectionError(null);
        }}
        title={editingSection ? 'تعديل عنوان الفصل' : 'إضافة فصل جديد (Section)'}
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <Input
            label="عنوان الفصل / الباب"
            placeholder="مثال: الفصل الأول - مقدمة وتأسيس"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            required
            autoFocus
          />

          {sectionError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sectionError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddSectionModalOpen(false);
                setEditingSection(null);
              }}
              disabled={isCreatingSection || isUpdatingSection}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              isLoading={isCreatingSection || isUpdatingSection}
              disabled={isCreatingSection || isUpdatingSection}
            >
              {editingSection ? 'حفظ التعديلات' : 'إنشاء الفصل'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Section Confirmation */}
      <Modal
        isOpen={!!deletingSectionId}
        onClose={() => {
          setDeletingSectionId(null);
          setSectionError(null);
        }}
        title="تأكيد حذف الفصل"
      >
        <div className="space-y-4">
          <p className="text-sm text-ivory/90 leading-relaxed">
            هل أنت متأكد من رغبتك في حذف هذا الفصل؟ لن يمكن حذفه إذا كان يحتوي على محاضرات أو ملفات بداخله.
          </p>

          {sectionError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sectionError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setDeletingSectionId(null);
                setSectionError(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSectionConfirm}
              isLoading={isDeletingSection}
            >
              تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add/Edit Lesson */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => {
          setIsLessonModalOpen(false);
          setEditingLesson(null);
          setLessonError(null);
        }}
        title={editingLesson ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}
      >
        <form onSubmit={handleSaveLesson} className="space-y-4">
          <Input
            label="عنوان المحاضرة"
            placeholder="مثال: المحاضرة الأولى - شرح تفصيلي"
            value={lessonFormData.title}
            onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              الفصل التابع له
            </label>
            <select
              value={targetSectionIdForLesson}
              onChange={(e) => setTargetSectionIdForLesson(e.target.value)}
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg px-3 py-2 text-xs outline-none focus:border-gold-400"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              وصف المحاضرة (اختياري)
            </label>
            <textarea
              rows={2}
              value={lessonFormData.description}
              onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-gold-400 resize-none"
              placeholder="اكتب نبذة مختصرة عما سيتعلمه الطالب في هذا الدرس..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-bold text-gold-300 font-amiri">
              <Film className="w-4 h-4" />
              طريقة إضافة الفيديو
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVideoSourceType('url')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  videoSourceType === 'url'
                    ? 'bg-gold-500/15 border-gold-400 text-gold-300 shadow-[0_0_20px_-8px_rgba(234,179,8,0.5)]'
                    : 'bg-surface border-surface-border text-ivory-muted hover:border-surface-border/80'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                رابط يوتيوب أو فيديو خارجي
              </button>
              <button
                type="button"
                onClick={() => setVideoSourceType('upload')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  videoSourceType === 'upload'
                    ? 'bg-gold-500/15 border-gold-400 text-gold-300 shadow-[0_0_20px_-8px_rgba(234,179,8,0.5)]'
                    : 'bg-surface border-surface-border text-ivory-muted hover:border-surface-border/80'
                }`}
              >
                <Upload className="w-4 h-4" />
                رفع من جهازك
              </button>
            </div>
          </div>

          {videoSourceType === 'url' ? (
            <Input
              label="رابط الفيديو (YouTube أو رابط مباشر)"
              placeholder="https://www.youtube.com/watch?v=..."
              value={lessonFormData.videoUrl}
              onChange={(e) => setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })}
            />
          ) : (
            <div className="space-y-3">
              {editingLesson?.videoUrl && !selectedVideoFile && (
                <div className="p-2.5 rounded-xl bg-surface border border-surface-border flex items-center gap-2 text-[11px] text-ivory-muted">
                  <FileVideo className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>الدرس يحتوي على فيديو حالياً — رفع ملف جديد سيستبدله تلقائياً عند الحفظ.</span>
                </div>
              )}

              {selectedVideoFile && videoPreviewUrl && !isUploadingVideo ? (
                /* ── بطاقة المعاينة بعد اختيار الملف ── */
                <div className="relative rounded-2xl overflow-hidden border border-gold-500/30 bg-black/40">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full aspect-video object-contain bg-black"
                  />
                  <div className="p-3 flex flex-wrap items-center justify-between gap-2 bg-surface border-t border-surface-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <FileVideo className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-ivory truncate max-w-[220px]" dir="ltr">
                          {selectedVideoFile.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-surface-card border border-surface-border text-[10px] text-ivory-muted">
                            {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} ميجابايت
                          </span>
                          {detectedDurationSeconds !== null && (
                            <span className="px-1.5 py-0.5 rounded-md bg-gold-500/10 border border-gold-500/30 text-[10px] text-gold-300 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              المدة تلقائياً: {Math.floor(detectedDurationSeconds / 60)}:
                              {String(detectedDurationSeconds % 60).padStart(2, '0')}
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
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            handleVideoFileSelected(e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          removeSelectedVideoFile();
                          setVideoSourceType('upload');
                        }}
                        disabled={isUploadingVideo}
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
                    videoDragDepth.current += 1;
                    setIsDraggingFile(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    videoDragDepth.current -= 1;
                    if (videoDragDepth.current <= 0) {
                      videoDragDepth.current = 0;
                      setIsDraggingFile(false);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    videoDragDepth.current = 0;
                    setIsDraggingFile(false);
                    handleVideoFileSelected(e.dataTransfer.files?.[0] || null);
                  }}
                  onClick={() => document.getElementById('curriculum-video-input')?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      document.getElementById('curriculum-video-input')?.click();
                    }
                  }}
                  className={`relative rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-300 group ${
                    isDraggingFile
                      ? 'border-gold-400 bg-gold-500/10 scale-[1.015] shadow-[0_0_50px_-12px_rgba(234,179,8,0.5)]'
                      : 'border-surface-border hover:border-gold-500/50 bg-surface/60 hover:bg-surface'
                  }`}
                >
                  <input
                    id="curriculum-video-input"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      handleVideoFileSelected(e.target.files?.[0] || null);
                      e.target.value = '';
                    }}
                  />

                  {isDraggingFile ? (
                    <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-400 flex items-center justify-center text-gold-300 animate-bounce shadow-[0_0_30px_-5px_rgba(234,179,8,0.6)]">
                        <Upload className="w-7 h-7" />
                      </div>
                      <p className="text-sm font-extrabold text-gold-200">أفلت ملف الفيديو الآن!</p>
                    </div>
                  ) : (
                    <div className="relative py-10 px-6 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-gold-500/20 animate-ping opacity-20" />
                        <span className="absolute -inset-1.5 rounded-full border border-gold-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gold-500/25 to-amber-600/10 border border-gold-500/40 flex items-center justify-center text-gold-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                          <CloudUpload className="w-7 h-7" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-ivory">اسحب الفيديو وأفلته هنا</p>
                        <p className="text-xs text-ivory-muted">
                          أو{' '}
                          <span className="text-gold-300 font-bold underline decoration-gold-500/40 underline-offset-4">
                            تصفح من جهازك
                          </span>
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
                          حتى 200MB
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* شريط التقدم أثناء الرفع */}
              {isUploadingVideo && (
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
                    {selectedVideoFile?.name}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={
                videoSourceType === 'upload' && detectedDurationSeconds !== null
                  ? `المدة (مكتشفة تلقائياً: ${Math.floor(detectedDurationSeconds / 60)}:${String(
                      detectedDurationSeconds % 60
                    ).padStart(2, '0')})`
                  : 'المدة بالدقائق'
              }
              type="number"
              min="0"
              // Duration is derived from the uploaded file's metadata — manual
              // entry stays available only for external URL sources
              disabled={videoSourceType === 'upload' && detectedDurationSeconds !== null}
              value={Math.round(lessonFormData.durationSeconds / 60)}
              onChange={(e) =>
                setLessonFormData({
                  ...lessonFormData,
                  durationSeconds: Number(e.target.value) * 60,
                })
              }
            />

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="lessonPreviewCheck"
                checked={lessonFormData.isPreview}
                onChange={(e) => setLessonFormData({ ...lessonFormData, isPreview: e.target.checked })}
                className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
              />
              <label htmlFor="lessonPreviewCheck" className="text-xs text-ivory font-medium cursor-pointer">
                معاينة مجانية لجميع الطلاب
              </label>
            </div>
          </div>

          {lessonError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lessonError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLessonModalOpen(false)}
              disabled={isCreatingLesson || isUpdatingLesson || isUploadingVideo}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              isLoading={isCreatingLesson || isUpdatingLesson || isUploadingVideo}
              disabled={isCreatingLesson || isUpdatingLesson || isUploadingVideo}
            >
              {isCreatingLesson || isUpdatingLesson || isUploadingVideo
                ? 'جاري الحفظ والرفع...'
                : editingLesson
                ? 'حفظ التعديلات'
                : 'إضافة الدرس'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Lesson Confirmation */}
      <Modal
        isOpen={!!deletingLessonId}
        onClose={() => setDeletingLessonId(null)}
        title="تأكيد حذف الدرس"
      >
        <div className="space-y-4">
          <p className="text-sm text-ivory/90">هل أنت متأكد من رغبتك في حذف هذا الدرس؟</p>
          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeletingLessonId(null)}>
              إلغاء
            </Button>
            <Button variant="danger" onClick={handleDeleteLessonConfirm} isLoading={isDeletingLesson}>
              حذف
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Quiz Manager */}
      {quizLesson && (
        <QuizManagerModal
          lessonId={quizLesson.id}
          lessonTitle={quizLesson.title}
          onClose={() => setQuizLesson(null)}
        />
      )}

      {/* Modal: Homework Manager */}
      {homeworkLesson && (
        <HomeworkManagerModal
          lessonId={homeworkLesson.id}
          lessonTitle={homeworkLesson.title}
          onClose={() => setHomeworkLesson(null)}
        />
      )}

      {/* Modal: Add Material */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setMaterialError(null);
        }}
        title="إضافة ملف أو مذكرة جديدة للفصل"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <Input
            label="عنوان الملف / المذكرة"
            placeholder="مثال: مذكرة شرح الباب الأول وتلخيص القوانين"
            value={materialTitle}
            onChange={(e) => setMaterialTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              الفصل التابع له
            </label>
            <select
              value={targetSectionIdForMaterial}
              onChange={(e) => setTargetSectionIdForMaterial(e.target.value)}
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg px-3 py-2 text-xs outline-none focus:border-gold-400"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              وصف المرفق (اختياري)
            </label>
            <textarea
              rows={2}
              value={materialDescription}
              onChange={(e) => setMaterialDescription(e.target.value)}
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-gold-400 resize-none"
              placeholder="وصف تفصيلي لمحتوى الملف..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              اختر الملف (PDF أو PowerPoint أو Word أو صورة — بحد أقصى 50MB)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setSelectedMaterialFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-ivory file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              required
            />
          </div>

          {materialError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{materialError}</span>
            </div>
          )}

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsMaterialModalOpen(false)}
              disabled={isUploadingMaterial}
            >
              إلغاء
            </Button>
            <Button type="submit" isLoading={isUploadingMaterial} disabled={isUploadingMaterial}>
              رفع المرفق
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Video Player Preview */}
      <Modal
        isOpen={!!previewVideoUrl}
        onClose={() => setPreviewVideoUrl(null)}
        title={previewTitle || 'معاينة الفيديو'}
      >
        <div className="space-y-4">
          <VideoPlayer
            key={previewVideoUrl || 'preview'}
            sources={[{ url: previewVideoUrl || '' }]}
            title={previewTitle}
            className="w-full"
          />
        </div>
      </Modal>
    </div>
  );
};
export default ManageCurriculumPage;
