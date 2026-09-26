import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MonitorPlay,
  ArrowRight,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
} from 'lucide-react';
import { useCourseDetailQuery } from '../../hooks/queries/useCourses';
import { useCourseVideoQuery } from '../../hooks/queries/useVideos';
import {
  useUpsertCourseVideoMutation,
  useDeleteCourseVideoMutation,
} from '../../hooks/mutations/useVideoMutations';
import { VideoPlayer } from '../../components/video/VideoPlayer';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const CustomizeVideoPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();

  const { data: courseData, isLoading: isCourseLoading } = useCourseDetailQuery(courseId);
  const course = courseData;

  const { data: videoData, isLoading: isVideoLoading } = useCourseVideoQuery(courseId);
  const video = videoData?.video ?? null;

  const { mutateAsync: upsertVideo, isPending: isSaving } = useUpsertCourseVideoMutation(courseId || '');
  const { mutateAsync: deleteVideo, isPending: isDeleting } = useDeleteCourseVideoMutation(courseId || '');

  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync form with loaded video
  useEffect(() => {
    setVideoUrlInput(video?.videoUrl || '');
    setTitleInput(video?.title || '');
  }, [video]);

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (!courseId) return null;

  const handleSave = async () => {
    setFormError(null);
    setSuccessMsg(null);

    if (!videoUrlInput.trim()) {
      setFormError('يرجى إدخال رابط الفيديو.');
      return;
    }
    if (!isValidUrl(videoUrlInput.trim())) {
      setFormError('الرابط غير صالح — يجب أن يبدأ بـ http:// أو https://');
      return;
    }

    try {
      await upsertVideo({
        videoUrl: videoUrlInput.trim(),
        title: titleInput.trim() || undefined,
      });
      setSuccessMsg('تم حفظ فيديو الكورس بنجاح.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'تعذر حفظ الفيديو.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleDelete = async () => {
    setFormError(null);
    setSuccessMsg(null);
    if (!window.confirm('هل أنت متأكد من إزالة فيديو الكورس؟')) return;
    try {
      await deleteVideo();
      setVideoUrlInput('');
      setTitleInput('');
      setSuccessMsg('تمت إزالة الفيديو.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'تعذر إزالة الفيديو.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  if (isCourseLoading || isVideoLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto px-4 py-8 text-right">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="space-y-1.5 border-b border-surface-border pb-6">
        <Link
          to="/dashboard/courses"
          className="text-xs text-gold-400 hover:underline inline-flex items-center gap-1"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>لوحة الكورسات</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300 flex items-center gap-2.5">
          <MonitorPlay className="w-7 h-7 text-gold-400" />
          <span>تخصيص فيديو الكورس</span>
        </h1>
        <p className="text-xs sm:text-sm text-ivory-muted">
          {course?.title
            ? `الكورس: ${course.title}`
            : 'حدد رابط فيديو تعريفي يظهر للطلاب المشتركين في هذا الكورس.'}
        </p>
      </div>

      {/* Messages */}
      {formError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Live preview via custom player */}
      {videoUrlInput.trim() && isValidUrl(videoUrlInput.trim()) ? (
        <VideoPlayer sources={[{ url: videoUrlInput.trim(), label: 'المصدر' }]} title={titleInput || undefined} />
      ) : (
        <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-surface-border bg-surface-card flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs text-ivory-muted">لا يوجد معاينة — أدخل رابط فيديو صالح بالأسفل</p>
        </div>
      )}

      {/* Form */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ivory/90 font-cairo">
            رابط الفيديو <span className="text-red-400">*</span>{' '}
            <span className="text-xs text-gold-400 font-normal">(YouTube أو رابط مباشر)</span>
          </label>
          <input
            type="url"
            dir="ltr"
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50 text-left placeholder-ivory-muted/40"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ivory/90 font-cairo">
            عنوان الفيديو (اختياري)
          </label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="مثال: كلمة ترحيب من الأستاذ"
            maxLength={200}
            className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50"
          />
        </div>

        <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-3">
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={!video || isDeleting || isSaving}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            إزالة الفيديو
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {isSaving ? 'جاري الحفظ...' : video ? 'تحديث الفيديو' : 'حفظ الفيديو'}
          </Button>
        </div>
      </div>
    </div>
  );
};
