import React, { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  FileText,
  FileImage,
  Presentation,
  FileType2,
  Trash2,
  Download,
  Library,
  BookOpen,
  AlertCircle,
  Layers,
  CheckCircle2,
  Search,
  CloudUpload,
  X,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { useCourseMaterialsQuery } from '../../hooks/queries/useMaterials';
import { useCurriculumQuery } from '../../hooks/queries/useCurriculum';
import { lessonsApi } from '../../api/lessons.api';
import { MaterialLibraryItem } from '../../api/materials.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { CustomCourseSelect } from '../../components/ui/CustomCourseSelect';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';

const TYPE_META: Record<string, { label: string; icon: React.ElementType; tone: string; badge: string }> = {
  PDF: {
    label: 'مستند PDF',
    icon: FileText,
    tone: 'text-red-400 bg-red-500/10 border-red-500/30',
    badge: 'bg-red-500/15 text-red-300 border border-red-500/30',
  },
  DOC: {
    label: 'Word',
    icon: FileType2,
    tone: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    badge: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  },
  PPTX: {
    label: 'PowerPoint',
    icon: Presentation,
    tone: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  },
  IMAGE: {
    label: 'صورة / رسمة',
    icon: FileImage,
    tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
};

const ACCEPTED_EXT = /\.(pdf|doc|docx|ppt|pptx|jpe?g|png|webp)$/i;
const formatSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DashboardMaterialsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Course selection
  const { data: coursesData, isLoading: isLoadingCourses } = useCoursesQuery({
    limit: 50,
    mine: true,
  });
  const courses = useMemo(() => {
    const d = coursesData as { data?: unknown[]; courses?: unknown[] } | undefined;
    return (
      (Array.isArray(d?.data) ? d!.data : Array.isArray(d?.courses) ? d!.courses : [])
    ) as { id: string; title: string }[];
  }, [coursesData]);
  const [courseId, setCourseId] = useState('');

  const activeCourseId = courseId || courses[0]?.id || '';

  // Sections + materials of the selected course
  const { data: curriculum } = useCurriculumQuery(activeCourseId || undefined);
  const sections = useMemo(
    () => (curriculum?.sections ?? []).map((s) => ({ id: s.id, title: s.title })),
    [curriculum]
  );
  const { data: materials = [], isLoading: isLoadingMaterials } = useCourseMaterialsQuery(
    activeCourseId || undefined
  );

  // Upload form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<MaterialLibraryItem | null>(null);

  // List filters
  const [listFilter, setListFilter] = useState<'ALL' | 'PDF' | 'IMAGE' | 'DOC' | 'PPTX'>('ALL');
  const [listSearch, setListSearch] = useState('');

  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (listFilter !== 'ALL') {
      list = list.filter((m) => m.fileType === listFilter);
    }
    if (listSearch.trim()) {
      const q = listSearch.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.section?.title && m.section.title.toLowerCase().includes(q))
      );
    }
    return list;
  }, [materials, listFilter, listSearch]);

  // Group by section title for display
  const groupedBySection = useMemo(() => {
    const map = new Map<string, MaterialLibraryItem[]>();
    for (const m of filteredMaterials) {
      const key = m.section?.title || 'محتوى عام للكورس';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [filteredMaterials]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['course-materials'] }),
      queryClient.invalidateQueries({ queryKey: ['my-materials'] }),
      queryClient.invalidateQueries({ queryKey: ['curriculum', activeCourseId] }),
    ]);
  };

  const handlePickFile = (picked: File | null) => {
    if (!picked) {
      setFile(null);
      setImagePreview(null);
      return;
    }
    if (!ACCEPTED_EXT.test(picked.name)) {
      setFormError('صيغة غير مدعومة — المسموح: PDF, DOCX, PPTX, JPG, PNG, WEBP');
      return;
    }
    if (picked.size > 50 * 1024 * 1024) {
      setFormError('حجم الملف يجب ألا يزيد عن 50 ميجابايت');
      return;
    }
    setFormError(null);
    setFile(picked);
    if (!title.trim()) setTitle(picked.name.replace(/\.[^.]+$/, ''));
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(picked.type.startsWith('image/') ? URL.createObjectURL(picked) : null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handlePickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const clearFile = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseId) return;
    if (!title.trim()) {
      setFormError('عنوان الملف مطلوب');
      return;
    }
    if (!file) {
      setFormError('يرجى اختيار الملف أولاً');
      return;
    }
    setFormError(null);
    setIsUploading(true);
    try {
      await lessonsApi.uploadMaterialFile(activeCourseId, {
        title: title.trim(),
        description: description.trim() || undefined,
        sectionId: sectionId || sections[0]?.id || undefined,
        kind: 'MATERIAL',
        file,
      });
      clearFile();
      setTitle('');
      setDescription('');
      setIsUploading(false);
      toast.success('تم رفع الملف بنجاح — أصبح متاحاً للطلاب في مكتبة الملفات');
      await refreshAll();
    } catch (err: any) {
      setIsUploading(false);
      setFormError(err?.response?.data?.message ?? 'فشل رفع الملف — تأكد من الصيغة والحجم');
    }
  };

  const handleDownload = async (item: MaterialLibraryItem) => {
    try {
      const info = await lessonsApi.getMaterialDownloadUrl(item.id);
      window.open(info.downloadUrl, '_blank');
    } catch {
      toast.error('تعذر تحميل الملف');
    }
  };

  const handleDelete = () => {
    if (!deletingItem) return;
    lessonsApi
      .deleteMaterial(deletingItem.id)
      .then(async () => {
        setDeletingItem(null);
        toast.success('تم حذف الملف بنجاح');
        await refreshAll();
      })
      .catch((err: any) => {
        setDeletingItem(null);
        toast.error(err?.response?.data?.message ?? 'تعذر حذف الملف');
      });
  };

  if (isLoadingCourses) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3 text-right" dir="rtl">
        <Library className="mx-auto w-12 h-12 text-gold-400/60" strokeWidth={1.5} />
        <h2 className="font-amiri text-xl font-bold text-ivory">لا توجد كورسات مخصصة لك بعد</h2>
        <p className="text-xs sm:text-sm text-ivory-muted">أنشئ كورساً أولاً، ثم ارفع الملفات والمذكرات من هنا.</p>
      </div>
    );
  }

  const pdfCount = materials.filter((m) => m.fileType === 'PDF').length;
  const imageCount = materials.filter((m) => m.fileType === 'IMAGE').length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ─── Header & Course Selector ─────────────────────── */}
      <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gold-400">
              <Library className="h-4 w-4" />
              <span>إدارة المحتوى والمرفقات</span>
            </div>
            <h1 className="font-amiri text-2xl sm:text-3xl font-black text-gold-300">مكتبة ملفات الكورس</h1>
            <p className="text-xs sm:text-sm text-ivory-muted">
              ارفع ملخصات PDF وعروض PowerPoint ونماذج الإجابة — تظهر فوراً لطلابك في «مكتبة ملفاتي».
            </p>
          </div>
        </div>

        {/* Course Filter Bar with Custom Select */}
        <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ivory-muted">
            <BookOpen className="w-4 h-4 text-gold-400" />
            <span>اختر الكورس لإدارة ملفاته:</span>
          </div>
          <CustomCourseSelect
            selectedCourseId={activeCourseId}
            onSelectCourse={(id) => setCourseId(id)}
          />
        </div>
      </div>

      {/* ─── Summary Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ivory-muted">إجمالي الملفات</p>
              <p className="text-xl font-bold text-ivory">{materials.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ivory-muted">مستندات PDF</p>
              <p className="text-xl font-bold text-red-400">{pdfCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ivory-muted">صور ورسومات</p>
              <p className="text-xl font-bold text-emerald-400">{imageCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ivory-muted">السكاشن المغطاة</p>
              <p className="text-xl font-bold text-violet-300">{sections.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ═══════════ Upload Form Panel ═══════════ */}
        <form
          onSubmit={handleUpload}
          className={`lg:col-span-2 relative space-y-4 self-start overflow-hidden rounded-3xl border bg-surface-card p-6 shadow-card transition-all duration-300 ${
            isDragging
              ? 'border-gold-400 shadow-[0_0_0_4px_rgba(201,161,90,0.12)] scale-[1.01]'
              : 'border-surface-border'
          }`}
        >
          {isUploading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg/85 backdrop-blur-sm">
              <CloudUpload className="h-10 w-10 animate-bounce text-gold-400" />
              <p className="text-xs font-bold text-gold-300">جاري رفع الملف وحفظه في السحابة...</p>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-border">
                <div className="h-full w-1/2 animate-shimmer rounded-full bg-gold-gradient" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-gold-300">
            <div className="w-8 h-8 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Upload className="h-4 w-4" />
            </div>
            <h2 className="font-amiri text-base font-bold">رفع ملف أو ملخص جديد</h2>
          </div>

          {/* Drag & Drop Zone */}
          {!file && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-border hover:border-gold-400/60 bg-surface/50 p-6 text-center transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloudUpload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-ivory group-hover:text-gold-300 transition-colors">
                  اضغط لاختيار ملف، أو اسحبه هنا
                </p>
                <p className="text-[10px] text-ivory-muted mt-1">PDF, Word, PowerPoint, أو صور (حتى 50MB)</p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
            onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />

          {/* Selected File Card */}
          {file && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold-500/30 bg-gold-500/10 p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="h-10 w-10 rounded-xl object-cover border border-gold-500/30 shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/20 text-gold-400">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ivory">{file.name}</p>
                  <p className="text-[10px] text-gold-300 font-mono" dir="ltr">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="rounded-lg p-1.5 text-ivory-muted hover:bg-gold-500/20 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ivory">عنوان الملف المعروض للطلاب *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مذكرة مراجعة ليلة الامتحان — الباب الأول"
              className="w-full rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-xs text-ivory outline-none focus:border-gold-400 transition-all shadow-inner"
            />
          </div>

          {/* Section Picker */}
          {sections.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ivory">السكشن المرتبط (اختياري)</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-xs text-ivory outline-none focus:border-gold-400 transition-all cursor-pointer"
              >
                <option value="">محتوى عام للكورس</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ivory">وصف أو ملاحظات للطلاب</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف اختياري للملف ومحتواه..."
              rows={2}
              className="w-full rounded-xl border border-surface-border bg-surface px-3.5 py-2.5 text-xs text-ivory outline-none focus:border-gold-400 resize-none transition-all shadow-inner"
            />
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium leading-relaxed text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Button
            type="submit"
            isLoading={isUploading}
            disabled={isUploading}
            leftIcon={<Upload className="w-4 h-4" />}
            className="w-full !rounded-xl !py-3 !text-xs font-bold"
          >
            رفع الملف وإتاحته للطلاب
          </Button>
        </form>

        {/* ═══════════ Materials List ═══════════ */}
        <div className="lg:col-span-3 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-surface-border bg-surface-card p-4 shadow-card">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { v: 'ALL', l: 'الكل' },
                { v: 'PDF', l: 'PDF' },
                { v: 'IMAGE', l: 'صور' },
                { v: 'DOC', l: 'Word' },
                { v: 'PPTX', l: 'PowerPoint' },
              ].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setListFilter(v as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    listFilter === v
                      ? 'bg-gold-gradient text-white font-black shadow-gold-glow'
                      : 'bg-surface border border-surface-border text-ivory/80 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ivory-muted" />
              <input
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="ابحث في الملفات..."
                className="w-full rounded-xl border border-surface-border bg-surface ps-3 pe-9 py-2 text-xs text-ivory outline-none focus:border-gold-400 shadow-inner"
              />
            </div>
          </div>

          {isLoadingMaterials ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-3xl w-full" />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="rounded-3xl border border-surface-border bg-surface-card p-12 text-center space-y-2 shadow-card">
              <Upload className="mx-auto h-8 w-8 text-gold-400/60" strokeWidth={1.5} />
              <p className="text-sm font-bold text-ivory">
                {materials.length === 0
                  ? 'لم تقم برفع أي ملفات لهذا الكورس بعد.'
                  : 'لا توجد ملفات مطابقة لكلمة البحث أو التصفية الحالية.'}
              </p>
              <p className="text-xs text-ivory-muted">استخدم النموذج الجانبي لرفع أول ملف ومشاركته مع الطلاب.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedBySection.map(([sectionTitle, items]) => (
                <div key={sectionTitle} className="space-y-3">
                  {/* Section Heading */}
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 shrink-0 text-gold-400" />
                    <h3 className="text-xs font-bold text-ivory">{sectionTitle}</h3>
                    <span className="rounded-full bg-gold-500/10 border border-gold-400/25 px-2 py-0.5 text-[10px] font-black text-gold-300">
                      {items.length} ملف
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-l from-surface-border to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {items.map((item) => {
                      const meta = TYPE_META[item.fileType] ?? TYPE_META.PDF;
                      const Icon = meta.icon;
                      return (
                        <div
                          key={item.id}
                          className="group relative flex flex-col justify-between gap-3 overflow-hidden rounded-3xl bg-surface-card border border-surface-border hover:border-gold-500/40 p-4 transition-all duration-300 hover:shadow-card shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${meta.tone}`}>
                              <Icon className="h-5 w-5" strokeWidth={1.8} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <h4 className="truncate text-xs font-bold text-ivory" title={item.title}>
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-[11px] text-ivory-muted line-clamp-1">{item.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <span className={`rounded-md px-2 py-0.5 text-[9px] font-black ${meta.badge}`}>
                                  {meta.label}
                                </span>
                                <span className="text-[10px] text-ivory-muted font-mono" dir="ltr">
                                  {formatSize(item.fileSizeBytes)}
                                </span>
                                <span className="text-[10px] text-ivory-muted">• {formatDate(item.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-surface-border/40">
                            <button
                              type="button"
                              onClick={() => handleDownload(item)}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-bold text-gold-300 hover:bg-gold-500/20 active:scale-95 cursor-pointer transition-all"
                            >
                              <Download className="h-3.5 w-3.5" />
                              تحميل الملف
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 active:scale-95 cursor-pointer transition-all"
                              title="حذف الملف"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingItem} onClose={() => setDeletingItem(null)} title="تأكيد حذف الملف">
        <div className="space-y-4 text-right" dir="rtl">
          <p className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-xs leading-relaxed text-ivory">
            هل أنت متأكد من حذف الملف «{deletingItem?.title}»؟ لن يتمكن الطلاب من تحميله أو الوصول إليه بعد الحذف.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeletingItem(null)}>
              تراجع
            </Button>
            <Button variant="danger" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
              نعم، تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
