import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { summariesApi } from '../../api/summaries.api';
import { toast } from 'sonner';
import { ArrowRight, FileImage, Link2, Send } from 'lucide-react';

export function UploadSummaryPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, target: 'image' | 'video') => {
    setUploading(true);
    try {
      const result = await summariesApi.uploadCommunityMedia(file);
      if (target === 'video') setVideoUrl(result.url);
      else setImages((current) => [...current, result.url]);
    } catch { toast.error('تعذر رفع الملف'); } finally { setUploading(false); }
  };

  const createMutation = useMutation({
    mutationFn: summariesApi.createSummary,
    onSuccess: () => {
      toast.success('تم إرسال الملخص للمراجعة');
      navigate(`/courses/${courseId}/summaries`);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إرسال الملخص');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) { toast.error('عنوان الموضوع يجب أن يكون 3 أحرف على الأقل'); return; }
    if (description.trim().length < 10) { toast.error('الوصف يجب أن يكون 10 أحرف على الأقل'); return; }
    createMutation.mutate({
      courseId: courseId!,
      title,
      description,
      videoUrl: videoUrl || undefined,
      images: images.length > 0 ? images : undefined,
    });
  };

  return (
    <div className="community-page mx-auto w-full max-w-2xl space-y-6 p-4" dir="rtl">
      <style>{`@keyframes composerIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.community-page form{animation:composerIn .4s ease-out both}@media(prefers-reduced-motion:reduce){.community-page form{animation:none}}`}</style>
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-ivory-muted transition hover:text-primary"><ArrowRight className="h-4 w-4" />العودة للملخصات</button>
      <div><p className="text-sm text-primary">شارك معرفتك</p><h1 className="mt-1 text-3xl font-black text-ivory">إضافة ملخص جديد</h1><p className="mt-2 text-sm leading-6 text-ivory-muted">اكتب عنوان الموضوع ووصفًا مختصرًا. سيُراجع الملخص من مدرس الكورس قبل نشره.</p></div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-surface-border bg-surface-card p-5 shadow-md sm:p-7">
        <div className="space-y-2">
          <label className="text-sm text-ivory/80">العنوان</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الملخص"
            className="w-full rounded-2xl border border-surface-border bg-surface p-3 text-ivory placeholder:text-ivory-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            maxLength={150}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-ivory/80">الوصف</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف تفصيلي للملخص..."
            className="w-full resize-none rounded-2xl border border-surface-border bg-surface p-3 text-ivory placeholder:text-ivory-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-ivory/80"><Link2 className="h-4 w-4 text-primary" />رابط الفيديو (اختياري)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-2xl border border-surface-border bg-surface p-3 text-ivory placeholder:text-ivory-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-2 text-sm text-primary transition hover:border-primary">رفع فيديو من الجهاز<input type="file" accept="video/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadFile(file, 'video'); }} className="hidden" /></label>
          {videoUrl && <video src={videoUrl} controls className="mt-2 max-h-56 w-full rounded-2xl border border-primary/30" />}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-ivory/80"><FileImage className="h-4 w-4 text-primary" />صورة أو أكثر (اختياري)</label>
          <p className="text-white/40 text-xs">أضف روابط الصور هنا</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-2 text-sm text-primary transition hover:border-primary">رفع صورة من الجهاز<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadFile(file, 'image'); }} className="hidden" /></label>
          {images.map((img, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={img}
                onChange={(e) => {
                  const newImages = [...images];
                  newImages[i] = e.target.value;
                  setImages(newImages);
                }}
                placeholder="رابط الصورة"
                className="min-w-0 flex-1 rounded-xl border border-surface-border bg-surface p-2 text-sm text-ivory placeholder:text-ivory-muted outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                className="text-red-400 px-2"
              >
                حذف
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => setImages([...images, ''])}
              className="text-primary text-sm hover:underline"
            >
              + إضافة صورة
            </button>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={title.trim().length < 3 || description.trim().length < 10 || createMutation.isPending || uploading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white transition hover:bg-primary/80 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />{createMutation.isPending ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white/10 text-ivory px-6 py-3 rounded-lg"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
