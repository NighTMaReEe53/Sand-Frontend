import React, { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  FileImage,
  Presentation,
  FileType2,
  Download,
  Eye,
  BookOpen,
  Library,
  AlertCircle,
  Search,
  Layers,
  ClipboardList,
  GraduationCap,
  ChevronLeft,
  CalendarDays,
  FolderOpen,
} from 'lucide-react';
import { useMyMaterialsQuery } from '../../hooks/queries/useMaterials';
import { materialsApi, MaterialLibraryItem } from '../../api/materials.api';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import {
  BookStackSvg,
  PencilSvg,
  DotsPatternSvg,
  ShapesClusterSvg,
  EmptyStateIllustrationSvg,
  Float,
} from '../../components/ui/Doodles';

/* ═══════════════ Helpers & Type Config ═══════════════ */

type TypeFilter = 'ALL' | 'PDF' | 'DOC' | 'PPTX' | 'IMAGE';
type KindFilter = 'ALL' | 'MATERIAL' | 'HOMEWORK';

const TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; tone: string; ring: string; gradient: string }
> = {
  PDF: {
    label: 'PDF',
    icon: FileText,
    tone: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    ring: 'border-rose-400/30',
    gradient: 'from-rose-400 to-rose-600',
  },
  DOC: {
    label: 'Word',
    icon: FileType2,
    tone: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
    ring: 'border-sky-400/30',
    gradient: 'from-sky-400 to-sky-600',
  },
  PPTX: {
    label: 'PowerPoint',
    icon: Presentation,
    tone: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    ring: 'border-amber-400/30',
    gradient: 'from-amber-400 to-amber-600',
  },
  IMAGE: {
    label: 'صورة',
    icon: FileImage,
    tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    ring: 'border-emerald-400/30',
    gradient: 'from-emerald-400 to-emerald-600',
  },
};

const formatSize = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** يفتح الرابط في تبويب جديد أو يبدأ التنزيل الفوري */
const openOrDownload = async (id: string, mode: 'view' | 'download') => {
  try {
    const info = await materialsApi.getDownloadInfo(id);
    if (mode === 'download') {
      const a = document.createElement('a');
      a.href = info.downloadUrl;
      a.download = info.fileName;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.open(info.downloadUrl, '_blank', 'noopener');
    }
  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? 'تعذر فتح الملف — حاول مجدداً');
  }
};

/* ═══════════════ Material Card (3-Column Grid) ═══════════════ */

const MaterialCard: React.FC<{ item: MaterialLibraryItem; showCourse?: boolean }> = ({
  item,
  showCourse,
}) => {
  const meta = TYPE_META[item.fileType] ?? {
    label: 'ملف',
    icon: FileText,
    tone: 'text-gold-400 bg-gold-500/10 border-gold-500/25',
    ring: 'border-gold-400/30',
    gradient: 'from-gold-400 to-gold-600',
  };
  const Icon = meta.icon;
  const isHomework = item.kind === 'HOMEWORK';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-card">
      {/* Top accent gradient line on hover */}
      <span
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${meta.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden
      />

      {/* Header: Icon + Badges + Title */}
      <div className="flex items-start gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105 ${meta.tone}`}
        >
          <Icon className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* File type badge */}
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${meta.tone}`}>
              {meta.label}
            </span>
            {/* Kind badge */}
            {isHomework ? (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25">
                <ClipboardList className="h-2.5 w-2.5" />
                واجب
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/25">
                مادة دراسية
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 text-sm font-bold text-ink leading-snug group-hover:text-gold-300 transition-colors">
            {item.title}
          </h3>
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {item.description}
        </p>
      )}

      {/* Meta Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
        {showCourse && item.course && (
          <span
            className="inline-flex items-center gap-1 max-w-full rounded-lg border border-surface-border bg-surface-alt px-2 py-0.5 font-bold text-ink-muted"
            title="الكورس"
          >
            <BookOpen className="h-3 w-3 shrink-0 text-gold-400" />
            <span className="truncate">{item.course.title}</span>
          </span>
        )}
        {item.section?.title && (
          <span
            className="inline-flex items-center gap-1 max-w-full rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 font-bold text-violet-400"
            title="السكشن"
          >
            <Layers className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.section.title}</span>
          </span>
        )}
        {item.createdAt && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-surface-border bg-surface-alt px-2 py-0.5 font-medium text-ink-muted">
            <CalendarDays className="h-3 w-3 text-gold-400/80" />
            {formatDate(item.createdAt)}
          </span>
        )}
        {item.fileSizeBytes > 0 && (
          <span
            className="rounded-lg border border-surface-border bg-surface-alt px-2 py-0.5 font-medium text-ink-muted"
            dir="ltr"
          >
            {formatSize(item.fileSizeBytes)}
          </span>
        )}
      </div>

      {/* Action Buttons: 2 columns */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-surface-border pt-3">
        <button
          type="button"
          onClick={() => openOrDownload(item.id, 'view')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-surface-border bg-surface-alt px-3 py-2 text-xs font-bold text-ink-muted hover:text-ink hover:border-gold-500/40 active:scale-95 transition-all cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5 text-gold-400" />
          <span>معاينة</span>
        </button>
        <button
          type="button"
          onClick={() => openOrDownload(item.id, 'download')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gold-gradient px-3 py-2 text-xs font-bold text-bg shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>تحميل</span>
        </button>
      </div>
    </div>
  );
};

/* ═════════════════════════════════════════════════════════════ */
/*  Main Component: MyMaterialsPage                              */
/* ═════════════════════════════════════════════════════════════ */

export const MyMaterialsPage: React.FC = () => {
  const { data: materials, isLoading, isError, error } = useMyMaterialsQuery(true);

  // ─── Filters state ──────────────────────────────────────────────
  const [courseId, setCourseId] = useState<string>(''); // '' = كل الكورسات
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [kindFilter, setKindFilter] = useState<KindFilter>('ALL');
  const [search, setSearch] = useState('');

  /** الكورسات المتاحة من الملفات نفسها */
  const courses = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>();
    for (const m of materials ?? []) {
      if (!m.course) continue;
      const existing = map.get(m.course.id);
      if (existing) existing.count += 1;
      else map.set(m.course.id, { id: m.course.id, title: m.course.title, count: 1 });
    }
    return Array.from(map.values());
  }, [materials]);

  // Overall statistics for hero & stat cards
  const stats = useMemo(() => {
    const list = materials ?? [];
    return {
      total: list.length,
      pdfCount: list.filter((m) => m.fileType === 'PDF').length,
      homeworkCount: list.filter((m) => m.kind === 'HOMEWORK').length,
      mediaCount: list.filter((m) => m.fileType === 'IMAGE' || m.fileType === 'PPTX' || m.fileType === 'DOC').length,
      coursesCount: courses.length,
    };
  }, [materials, courses]);

  // Filtered materials
  const filtered = useMemo(() => {
    let list = materials ?? [];
    if (courseId) list = list.filter((m) => m.courseId === courseId);
    if (typeFilter !== 'ALL') list = list.filter((m) => m.fileType === typeFilter);
    if (kindFilter !== 'ALL') list = list.filter((m) => m.kind === kindFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description ?? '').toLowerCase().includes(q) ||
          (m.course?.title ?? '').toLowerCase().includes(q) ||
          (m.section?.title ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [materials, courseId, typeFilter, kindFilter, search]);

  /** التجميع: كورس ← سكشن ← ملفات */
  const grouped = useMemo(() => {
    const byCourse = new Map<
      string,
      { title: string; sections: Map<string, { title: string; items: MaterialLibraryItem[] }> }
    >();
    for (const m of filtered) {
      if (!byCourse.has(m.courseId)) {
        byCourse.set(m.courseId, { title: m.course?.title ?? 'كورس عام', sections: new Map() });
      }
      const courseGroup = byCourse.get(m.courseId)!;
      const sectionKey = m.section?.id ?? 'general';
      if (!courseGroup.sections.has(sectionKey)) {
        courseGroup.sections.set(sectionKey, { title: m.section?.title || 'محتوى عام', items: [] });
      }
      courseGroup.sections.get(sectionKey)!.items.push(m);
    }
    return Array.from(byCourse.entries()).map(([cid, g]) => ({
      courseId: cid,
      title: g.title,
      sections: Array.from(g.sections.values()),
    }));
  }, [filtered]);

  const clearFilters = useCallback(() => {
    setCourseId('');
    setTypeFilter('ALL');
    setKindFilter('ALL');
    setSearch('');
  }, []);

  /* ─── Loading Skeleton ─── */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-right sm:px-6 lg:px-8" dir="rtl">
        <Skeleton className="h-56 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ─── Error (403 = غير مشترك / غير مسموح) ─── */
  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-4" dir="rtl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="font-din text-2xl font-black text-ink">
          {status === 403 ? 'يجب الاشتراك أولاً' : 'تعذر تحميل مكتبة الملفات'}
        </h2>
        <p className="text-xs leading-relaxed text-ink-muted">
          {status === 403
            ? 'المكتبة متاحة فقط للطلاب المشتركين في كورس واحد على الأقل باشتراك نشط.'
            : 'حدث خطأ أثناء جلب الملفات والمذكرات، يرجى إعادة تحديث الصفحة.'}
        </p>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-xs font-bold text-bg hover:brightness-110 transition-all shadow-sm"
        >
          <GraduationCap className="h-4 w-4" />
          تصفح الكورسات واشترك الآن
        </Link>
      </div>
    );
  }

  const hasItems = stats.total > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-10 overflow-x-hidden px-4 py-10 text-right sm:px-6 lg:px-8" dir="rtl">
      {/* ═══════════════ HERO HEADER (Same Design Language as MyBacklogPage) ═══════════════ */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative"
      >
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -top-14 right-1/4 h-64 w-64 rounded-full bg-gold-500/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-0 h-52 w-52 rounded-full bg-sky-500/[0.05] blur-3xl" />
        <DotsPatternSvg className="pointer-events-none absolute left-2 -top-4 hidden w-20 opacity-25 md:block" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_auto]">
          {/* Copy text column */}
          <div className="max-w-xl space-y-5">
            <motion.span
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-card/60 px-4 py-1.5 text-[11px] font-bold text-ink-muted backdrop-blur-sm shadow-sm"
            >
              <Library className="h-3.5 w-3.5 text-gold-400" />
              مكتبة الملفات والمذكرات الدراسية
            </motion.span>

            <h1 className="text-4xl font-black leading-[1.35] text-ink sm:text-[2.75rem] font-din">
              مذكراتك{' '}
              <span className="font-amira text-primary relative inline-block">
                وملفاتك الدراسية
                {/* Animated hand-drawn underline */}
                <svg
                  viewBox="0 0 240 14"
                  fill="none"
                  aria-hidden
                  className="absolute -bottom-2 right-0 h-3 w-full text-gold-400/80"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M6 9 C 60 3, 170 3, 234 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }}
                  />
                </svg>
              </span>
            </h1>

            <p className="max-w-lg text-sm leading-loose text-ink-muted font-sst">
              كل مذكرات الشرح بصيغة PDF، ملفات الواجبات، ملخصات الدروس، والخرائط التوضيحية مجمّعة ومرتبة لك — جاهزة للمعاينة والتحميل الفوري لتسهيل مذاكرتك وتفوقك.
            </p>

            {/* Micro chips */}
            {hasItems ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-2.5 pt-1"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-400 bg-gold-500/10 border border-gold-500/25 rounded-full px-3.5 py-1">
                  <Library className="w-3.5 h-3.5 text-gold-400" />
                  لديك {stats.total} ملف دراسي متاح
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-full px-3.5 py-1">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  {stats.pdfCount} مذكرة PDF
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/25 rounded-full px-3.5 py-1">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  {stats.coursesCount} كورس متاح
                </span>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 text-xs font-bold text-ink-muted bg-surface-card/60 border border-surface-border rounded-full px-4 py-2 w-fit pt-1"
              >
                <FolderOpen className="w-4 h-4 text-gold-400" />
                <span>المكتبة جاهزة — سيظهر هنا أي ملف أو مذكرة يرفعها مدرسوك تلقائياً.</span>
              </motion.div>
            )}
          </div>

          {/* Decorative Doodles cluster */}
          <div className="relative hidden w-64 lg:block">
            <Float duration={6} className="relative z-10 w-44 mx-auto">
              <BookStackSvg className="w-full drop-shadow-xl" />
            </Float>
            <Float duration={5} delay={0.6} className="absolute -bottom-6 -right-4 w-20 opacity-80">
              <PencilSvg className="w-full" />
            </Float>
            <ShapesClusterSvg className="pointer-events-none absolute -top-8 -left-8 w-24 opacity-30" />
          </div>
        </div>
      </motion.header>

      {/* ═══════════════ STAT CARDS (4 Cards Grid) ═══════════════ */}
      {hasItems && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'إجمالي الملفات',
              value: stats.total,
              sub: `عبر ${stats.coursesCount} كورسات`,
              icon: Library,
              color: 'text-amber-400',
              borderHover: 'hover:border-amber-500/40',
              bgIcon: 'bg-amber-500/10 border-amber-500/20',
            },
            {
              label: 'مذكرات وملخصات PDF',
              value: stats.pdfCount,
              sub: 'جاهزة للطباعة والتحميل',
              icon: FileText,
              color: 'text-rose-400',
              borderHover: 'hover:border-rose-500/40',
              bgIcon: 'bg-rose-500/10 border-rose-500/20',
            },
            {
              label: 'ملفات الواجبات',
              value: stats.homeworkCount,
              sub: 'تدريبات وأسئلة تفاعلية',
              icon: ClipboardList,
              color: 'text-violet-400',
              borderHover: 'hover:border-violet-500/40',
              bgIcon: 'bg-violet-500/10 border-violet-500/20',
            },
            {
              label: 'عروض وصور ومستندات',
              value: stats.mediaCount,
              sub: 'شروحات بصرية وخرائط',
              icon: Presentation,
              color: 'text-cyan-400',
              borderHover: 'hover:border-cyan-500/40',
              bgIcon: 'bg-cyan-500/10 border-cyan-500/20',
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.35 }}
              className={`relative overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 shadow-card ${card.borderHover}`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.bgIcon} ${card.color}`}
                >
                  <card.icon className="w-5 h-5" />
                </span>
                <span className="text-2xl sm:text-3xl font-black tabular-nums text-ink font-din">
                  {card.value}
                </span>
              </div>
              <p className="text-xs font-bold text-ink leading-tight">{card.label}</p>
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">{card.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══════════════ FULL FILTERS BAR (Always Visible for All Courses) ═══════════════ */}
      <div className="space-y-3.5 rounded-2xl border border-surface-border bg-surface-card/80 p-4 backdrop-blur-sm shadow-card">
        {/* Row 1: Course Selector Pills + Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-gold-400 pl-1">
              <BookOpen className="w-3.5 h-3.5" />
              الكورس:
            </span>

            {/* الكل button */}
            <button
              type="button"
              onClick={() => setCourseId('')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                !courseId
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'border border-surface-border bg-surface-alt/70 text-ink-muted hover:border-gold-500/30 hover:text-ink'
              }`}
            >
              <span>الكل</span>
              <span className="rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-black bg-surface-card text-ink-muted">
                {materials?.length ?? 0}
              </span>
            </button>

            {/* Individual Course Buttons (Always rendered, regardless of count) */}
            {courses.map((c) => {
              const active = courseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCourseId(courseId === c.id ? '' : c.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                      : 'border border-surface-border bg-surface-alt/70 text-ink-muted hover:border-gold-500/30 hover:text-ink'
                  }`}
                >
                  <span className="truncate max-w-[140px] sm:max-w-none">{c.title}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-black ${
                      active ? 'bg-gold-400/20 text-gold-300' : 'bg-surface-card text-ink-muted'
                    }`}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو السكشن…"
              className="w-full rounded-xl border border-surface-border bg-surface-alt/80 pr-9 pl-4 py-1.5 text-xs text-ink placeholder:text-ink-muted/60 focus:border-gold-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Row 2: File Type Filter + Kind Filter */}
        <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-3">
          {/* File type filter */}
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-gold-400 pl-1">
            <FileType2 className="w-3.5 h-3.5" />
            النوع:
          </span>
          {[
            { id: 'ALL', label: 'كل الصيغ' },
            { id: 'PDF', label: 'PDF' },
            { id: 'DOC', label: 'Word' },
            { id: 'PPTX', label: 'PowerPoint' },
            { id: 'IMAGE', label: 'صورة' },
          ].map((tab) => {
            const active = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id as TypeFilter)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                    : 'border border-surface-border bg-surface-alt/70 text-ink-muted hover:border-gold-500/30 hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}

          <span className="mx-1 hidden h-5 w-px bg-surface-border sm:block" />

          {/* Kind filter */}
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-gold-400 pl-1">
            <ClipboardList className="w-3.5 h-3.5" />
            التصنيف:
          </span>
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'MATERIAL', label: 'مواد دراسية' },
            { id: 'HOMEWORK', label: 'واجبات' },
          ].map((tab) => {
            const active = kindFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setKindFilter(tab.id as KindFilter)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-primary/20 text-primary border border-primary/40 shadow-sm'
                    : 'border border-surface-border bg-surface-alt/70 text-ink-muted hover:border-primary/30 hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ CONTENT (Course Sections & 3-Column Grid) ═══════════════ */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-dashed border-surface-border bg-surface-card/60 p-10 sm:p-14 text-center space-y-4"
        >
          <EmptyStateIllustrationSvg className="w-56 sm:w-72 mx-auto" />
          <h3 className="text-lg font-bold text-ink">
            {hasItems ? 'لا توجد ملفات مطابقة لخيارات الفلترة' : 'لا توجد مذكرات أو ملفات مرفوعة حالياً'}
          </h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            {search || courseId || typeFilter !== 'ALL' || kindFilter !== 'ALL'
              ? 'جرّب تغيير خيارات الفلترة أو مسح كلمات البحث للوصول لباقي الملفات والمذكرات.'
              : 'لم يقم المدرس برفع ملفات في كورساتك بعد، تابع الصفحة وسيتم إشعارك فور إضافة أي مذكرات جديدة.'}
          </p>
          {(courseId || typeFilter !== 'ALL' || kindFilter !== 'ALL' || search) && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs font-bold text-gold-400 hover:bg-gold-500/20 transition-all cursor-pointer"
            >
              <span>مسح كل الفلاتر</span>
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-10">
          {grouped.map((courseGroup) => (
            <section key={courseGroup.courseId} className="space-y-6">
              {/* Course heading bar (visible when showing all courses or if multiple courses exist) */}
              {(!courseId || courses.length > 1) && (
                <div className="flex items-center justify-between gap-3 border-b border-surface-border/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/10 border border-gold-500/25 text-gold-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h2 className="font-din text-lg font-bold text-ink">{courseGroup.title}</h2>
                    <span className="rounded-full bg-surface-alt border border-surface-border px-2.5 py-0.5 text-[10px] font-bold text-ink-muted">
                      {courseGroup.sections.reduce((acc, s) => acc + s.items.length, 0)} ملف
                    </span>
                  </div>
                  <Link
                    to={`/courses/${courseGroup.courseId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gold-400 hover:text-gold-300 transition-colors"
                  >
                    <span>صفحة الكورس</span>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {/* Sections inside the course */}
              {courseGroup.sections.map((sec) => (
                <div key={`${courseGroup.courseId}-${sec.title}`} className="space-y-3.5">
                  {/* Section heading */}
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 shrink-0 text-violet-400" />
                    <h3 className="text-sm font-bold text-ink">{sec.title}</h3>
                    <span className="rounded-full bg-violet-500/10 border border-violet-500/25 px-2 py-0.2 text-[10px] font-black text-violet-400">
                      {sec.items.length} ملف
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-l from-violet-500/25 to-transparent" />
                  </div>

                  {/* 3-column Grid of Material Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sec.items.map((item) => (
                      <MaterialCard key={item.id} item={item} showCourse={!courseId} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMaterialsPage;
