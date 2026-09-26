import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { summariesApi, Summary } from '../../api/summaries.api';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
  ZoomIn,
  Video,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Compass,
  X,
  Loader2,
  CheckCircle,
  FileCheck,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, resolveMediaUrl, parseImages, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SkeletonManageRow } from '../../components/ui/Skeleton';
import { VideoPlayer } from '../../components/video/VideoPlayer';

export function TeacherModerationQueuePage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editing, setEditing] = useState<Summary | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [activeLightbox, setActiveLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Fetch teacher's courses
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const coursesList = useMemo(() => {
    return coursesData?.courses || coursesData?.data || [];
  }, [coursesData]);

  // Fetch moderation queue
  const { data, isLoading } = useQuery({
    queryKey: ['moderationQueue', selectedCourse, page],
    queryFn: () =>
      summariesApi.getModerationQueue({
        courseId: selectedCourse || undefined,
        page,
        limit: 20,
      }),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ summaryId, approve, rejectionReason }: { summaryId: string; approve: boolean; rejectionReason?: string }) =>
      summariesApi.moderateSummary(summaryId, { approve, rejectionReason }),
    onSuccess: (_, variables) => {
      setRejectModal(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      toast.success(variables.approve ? 'تم اعتماد ونشر الملخص بنجاح' : 'تم رفض الملخص وإخطار الطالب');
    },
    onError: () => toast.error('تعذر مراجعة الملخص، يرجى المحاولة لاحقاً'),
  });

  const updateMutation = useMutation({
    mutationFn: () => summariesApi.updateSummary(editing!.id, { title: editTitle, description: editDescription }),
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      toast.success('تم تعديل الملخص بنجاح');
    },
    onError: () => toast.error('تعذر تعديل الملخص'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => summariesApi.deleteSummary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationQueue'] });
      toast.success('تم حذف الملخص نهائياً');
    },
    onError: () => toast.error('تعذر حذف الملخص'),
  });

  const rawSummaries = (data?.summaries || []) as (Summary & { courseName: string; courseId: string })[];
  const pagination = data?.pagination;

  // Client search filter
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return rawSummaries;
    const q = searchQuery.toLowerCase().trim();
    return rawSummaries.filter((s) => {
      return (
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.studentName?.toLowerCase().includes(q) ||
        s.courseName?.toLowerCase().includes(q)
      );
    });
  }, [rawSummaries, searchQuery]);

  const quickRejectionReasons = [
    'المحتوى لا يطابق موضوع الدرس المقرر.',
    'روابط الفيديو أو المرفقات لا تعمل بشكل صحيح.',
    'جودة الشرح تحتاج إلى تنظيم وتنسيق أفضل.',
    'يرجى كتابة شرح وافٍ ومفصل للنقاط المستفادة.',
  ];

  // Helper to render media
  const renderMedia = (s: Summary & { courseName: string }) => {
    const videoUrl = s.videoUrl ? resolveMediaUrl(s.videoUrl) : null;
    const images = parseImages(s.images).map(resolveMediaUrl).filter(Boolean);
    const hasVideo = !!videoUrl;
    const hasImages = images.length > 0;

    if (!hasVideo && !hasImages) return null;

    return (
      <div className="mt-4 space-y-3.5 rounded-2xl border border-surface-border bg-bg-elevated/80 p-4">
        {/* Video section */}
        {hasVideo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gold-300">
              <Video className="h-4 w-4" />
              <span>فيديو توضيحي مرفق من الطالب:</span>
            </div>
            <div className="relative aspect-video w-full max-h-[380px] overflow-hidden rounded-xl border border-surface-border bg-black shadow-card">
              <VideoPlayer
                sources={[{ url: videoUrl }]}
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        {/* Images section */}
        {hasImages && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-ivory">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gold-400" />
                <span>الصور المرفقة ({images.length}):</span>
              </div>
              <span className="text-[11px] text-ivory-muted font-normal">اضغط على أي صورة لتكبيرها</span>
            </div>

            <div
              className={cn(
                'grid gap-2.5',
                images.length === 1 && 'grid-cols-1 max-w-sm',
                images.length === 2 && 'grid-cols-2',
                images.length >= 3 && 'grid-cols-2 sm:grid-cols-3'
              )}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveLightbox({ images, index: i })}
                  className="group/img relative aspect-video w-full overflow-hidden rounded-xl border border-surface-border bg-surface-card transition-all duration-200 hover:border-gold-400 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-gold-400/30"
                >
                  <img
                    src={img}
                    alt={`صورة ملخص ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://placehold.co/600x400/1a1a1a/ddb44e?text=صورة+غير+متاحة';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/img:bg-black/40">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 group-hover/img:scale-110 group-hover/img:opacity-100">
                      <ZoomIn className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-medium text-ivory backdrop-blur-sm">
                    {i + 1} / {images.length}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* ─── Header with decorative vectors ─────────────────────────── */}
      <div className="relative">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-10 h-64 w-full text-gold-500 opacity-[0.05]"
          viewBox="0 0 1440 256"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <pattern id="summaries-hatch" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="1440" height="256" fill="url(#summaries-hatch)" />
          <circle cx="1350" cy="16" r="140" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="90" cy="240" r="110" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <span className="absolute -inset-2 rounded-2xl border border-dashed border-gold-500/30 rotate-6" aria-hidden />
              <div className="flex w-14 h-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold-glow">
                <FileText className="w-7 h-7 text-bg" strokeWidth={1.8} />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">
                إدارة ومراجعة ملخصات الطلاب
              </h1>
              <p className="text-xs sm:text-sm text-ivory-muted flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gold-500/70 shrink-0" />
                مراجعة واعتماد أو رفض ملخصات ومشاركات الطلاب قبل نشرها في مجتمع الكورس.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Stat chips ───────────────────────────────────────────── */}
        {!isLoading && (
          <div className="relative z-10 mt-6 grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: Clock,
                value: pagination?.total ?? rawSummaries.length,
                label: 'بانتظار المراجعة',
                tone: 'text-gold-300 bg-gold-500/10 border-gold-500/25',
              },
              {
                icon: Layers,
                value: filteredSummaries.length,
                label: 'المعروض حالياً',
                tone: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
              },
              {
                icon: FileCheck,
                value: pagination?.totalPages || 1,
                label: 'إجمالي الصفحات',
                tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
              },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden flex items-center gap-3 p-3.5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/30 transition-all duration-300 shadow-card"
                >
                  <span className={`flex w-10 h-10 shrink-0 items-center justify-center rounded-xl border ${stat.tone}`}>
                    <StatIcon className="w-5 h-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-black font-amiri text-ivory leading-none">{stat.value}</p>
                    <p className="text-[10px] font-bold text-ivory-muted mt-1 truncate">{stat.label}</p>
                  </div>
                  <svg aria-hidden className="absolute -bottom-2 -left-2 w-10 h-10 text-gold-500/15 group-hover:text-gold-500/30 transition-colors" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Search & Course Select Toolbar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-card border border-surface-border shadow-card">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بعنوان الملخص، اسم الطالب، أو الكورس..."
            className="w-full rounded-xl border border-surface-border bg-bg-elevated py-2.5 pr-10 pl-4 text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none transition focus:border-gold-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ivory-muted hover:text-ivory"
            >
              مسح
            </button>
          )}
        </div>

        {/* Course Filter Dropdown */}
        <div className="relative min-w-[240px]">
          <Filter className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-400" />
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setPage(1);
            }}
            className="w-full appearance-none rounded-xl border border-surface-border bg-bg-elevated py-2.5 pr-10 pl-9 text-xs sm:text-sm font-semibold text-ivory outline-none focus:border-gold-400 cursor-pointer"
          >
            <option value="">جميع الدورات التعليمية</option>
            {coursesList.map((course: any) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ivory-muted">
            <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
          </div>
        </div>
      </div>

      {/* ─── Summaries List / Loading / Empty ─────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonManageRow key={i} />
          ))}
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="relative overflow-hidden p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-5 shadow-card">
          <svg aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 text-gold-500/10" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 7" />
            <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          </svg>
          <div className="relative mx-auto w-20 h-20">
            <span className="absolute inset-0 rounded-full bg-gold-500/10 animate-ping opacity-30" style={{ animationDuration: '2.6s' }} />
            <span className="absolute -inset-2 rounded-full border-2 border-dashed border-gold-500/25 rotate-12" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gold-gradient shadow-gold-glow">
              <FileText className="w-9 h-9 text-bg" strokeWidth={1.6} />
            </div>
          </div>
          <h3 className="text-lg font-bold font-amiri text-ivory">لا توجد ملخصات بانتظار المراجعة</h3>
          <p className="text-xs text-ivory-muted max-w-sm mx-auto leading-relaxed">
            {searchQuery || selectedCourse
              ? 'لم يتم العثور على نتائج تطابق معايير البحث الحالية.'
              : 'جميع ملخصات الطلاب تمت مراجعتها، وستظهر الملخصات الجديدة هنا فور رفعها.'}
          </p>
          {(searchQuery || selectedCourse) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCourse('');
              }}
            >
              إعادة ضبط الفلاتر
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSummaries.map((s) => {
            const isExpanded = expandedCard === s.id;

            return (
              <div
                key={s.id}
                className="group relative rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6 transition-all duration-300 hover:border-gold-500/30 hover:shadow-card space-y-4"
              >
                {/* Pending accent line */}
                <div className="absolute right-0 top-0 h-full w-1 rounded-r-2xl bg-gold-400" />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-3">
                    {/* Student Info & Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {s.studentPhoto ? (
                          <img
                            src={resolveMediaUrl(s.studentPhoto)}
                            alt=""
                            className="h-10 w-10 rounded-xl border border-surface-border object-cover shadow-sm"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 border border-gold-500/30 text-sm font-bold text-gold-400">
                            {s.studentName?.charAt(0) || 'ط'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-ivory">{s.studentName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-ivory-muted">
                            <BookOpen className="h-3.5 w-3.5 text-gold-400" />
                            <span className="font-semibold text-gold-300/90">{s.courseName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Date */}
                      <div className="flex items-center gap-2">
                        <Badge variant="warning" size="sm">
                          <Clock className="h-3 w-3" />
                          بانتظار المراجعة
                        </Badge>
                        <span className="rounded-md border border-surface-border bg-bg-elevated px-2.5 py-1 text-[11px] font-medium text-ivory-muted">
                          {formatDate(s.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Summary Title */}
                    <h2 className="text-lg font-bold font-amiri text-ivory tracking-tight pt-1">
                      {s.title}
                    </h2>

                    {/* Description */}
                    <p
                      className={cn(
                        'text-xs sm:text-sm leading-relaxed text-ivory-muted whitespace-pre-line',
                        !isExpanded && 'line-clamp-3'
                      )}
                    >
                      {s.description}
                    </p>
                    {s.description && s.description.length > 180 && (
                      <button
                        type="button"
                        onClick={() => setExpandedCard(isExpanded ? null : s.id)}
                        className="text-xs font-bold text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        {isExpanded ? 'عرض أقل ↑' : 'عرض الوصف كاملاً ↓'}
                      </button>
                    )}

                    {/* Media Render */}
                    {renderMedia(s)}
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col shrink-0 flex-wrap items-center gap-2 pt-3 sm:pt-0 sm:border-r sm:border-surface-border sm:pr-4">
                    <button
                      onClick={() => moderateMutation.mutate({ summaryId: s.id, approve: true })}
                      disabled={moderateMutation.isPending}
                      className="flex flex-1 sm:w-full items-center justify-center gap-1.5 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover px-4 py-2.5 text-xs font-bold text-bg shadow-gold-glow transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      اعتماد ونشر
                    </button>

                    <button
                      onClick={() => setRejectModal(s.id)}
                      disabled={moderateMutation.isPending}
                      className="flex flex-1 sm:w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-[var(--color-danger)]/20 transition-all active:scale-[0.97] disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      رفض الملخص
                    </button>

                    <button
                      onClick={() => {
                        setEditing(s);
                        setEditTitle(s.title);
                        setEditDescription(s.description);
                      }}
                      className="flex flex-1 sm:w-full items-center justify-center gap-1.5 rounded-full border border-surface-border bg-bg-elevated px-4 py-2.5 text-xs font-bold text-ivory hover:border-gold-400 hover:text-gold-300 transition-all active:scale-[0.97]"
                    >
                      <Pencil className="h-3.5 w-3.5 text-gold-400" />
                      تعديل
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذا الملخص نهائياً؟')) {
                          deleteMutation.mutate(s.id);
                        }
                      }}
                      className="flex items-center justify-center rounded-xl border border-surface-border bg-bg-elevated p-2.5 text-ivory-muted hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
                      title="حذف نهائي"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Pagination ──────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card text-ivory transition-all hover:border-gold-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="rounded-xl border border-surface-border bg-bg-elevated px-4 py-2 text-xs font-bold font-amiri text-gold-300">
            صفحة {page} من {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface-card text-ivory transition-all hover:border-gold-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Reject Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => {
          setRejectModal(null);
          setRejectReason('');
        }}
        title="رفض ملخص الطالب"
        description="حدد سبب الرفض ليتم إرساله كإشعار توضيحي للطالب."
        maxWidth="md"
      >
        <div className="space-y-4 text-right" dir="rtl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-ivory">أسباب شائعة (انقر للاختيار السريع):</label>
            <div className="flex flex-wrap gap-1.5">
              {quickRejectionReasons.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className="rounded-lg border border-surface-border bg-bg-elevated px-2.5 py-1 text-[11px] font-medium text-ivory-muted hover:border-gold-400 hover:text-gold-300 transition-all"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ivory">تفاصيل سبب الرفض:</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="اكتب سبب الرفض وتوجيهات التصحيح للطالب..."
              className="w-full resize-none rounded-xl border border-surface-border bg-bg-elevated p-3.5 text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none focus:border-gold-400"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRejectModal(null);
                setRejectReason('');
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectReason.trim() || moderateMutation.isPending}
              onClick={() => {
                if (rejectModal) {
                  moderateMutation.mutate({
                    summaryId: rejectModal,
                    approve: false,
                    rejectionReason: rejectReason.trim(),
                  });
                }
              }}
            >
              تأكيد الرفض
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="تعديل بيانات الملخص"
        description="تعديل عنوان أو محتوى الملخص قبل اعتماده."
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4 text-right"
          dir="rtl"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ivory">عنوان الملخص</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={150}
              className="w-full rounded-xl border border-surface-border bg-bg-elevated p-3 text-xs sm:text-sm font-bold text-ivory placeholder:text-ivory-muted outline-none focus:border-gold-400"
              placeholder="عنوان الملخص"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ivory">محتوى الملخص</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-xl border border-surface-border bg-bg-elevated p-3 text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none focus:border-gold-400"
              placeholder="وصف الملخص"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(null)}>
              إلغاء
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={!editTitle.trim() || !editDescription.trim() || updateMutation.isPending}>
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Lightbox Modal ──────────────────────────────────────────── */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setActiveLightbox(null)}
        >
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
            <div className="rounded-full bg-surface-card px-4 py-1 text-xs font-bold font-amiri text-gold-300 border border-surface-border">
              صورة {activeLightbox.index + 1} من {activeLightbox.images.length}
            </div>
            <button
              onClick={() => setActiveLightbox(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ivory border border-surface-border hover:border-gold-400 hover:text-gold-300 transition-colors"
              title="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {activeLightbox.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightbox((prev) =>
                    prev
                      ? {
                          ...prev,
                          index: (prev.index - 1 + prev.images.length) % prev.images.length,
                        }
                      : null
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-surface-card text-ivory border border-surface-border hover:border-gold-400 hover:text-gold-300 transition-all z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightbox((prev) =>
                    prev
                      ? {
                          ...prev,
                          index: (prev.index + 1) % prev.images.length,
                        }
                      : null
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-surface-card text-ivory border border-surface-border hover:border-gold-400 hover:text-gold-300 transition-all z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="relative max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeLightbox.images[activeLightbox.index]}
              alt="معاينة الصورة"
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain border border-surface-border"
            />
          </div>
        </div>
      )}
    </div>
  );
}
