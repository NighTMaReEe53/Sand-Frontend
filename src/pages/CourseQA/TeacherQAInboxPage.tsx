import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { courseQaApi, CourseQuestion } from '../../api/courseQa.api';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Filter,
  Search,
  Video,
  Send,
  ZoomIn,
  X,
  RotateCcw,
  Layers,
  Compass,
  Inbox,
  Library,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, resolveMediaUrl, parseImages, isVideoMedia, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SkeletonManageRow } from '../../components/ui/Skeleton';
import { VideoPlayer } from '../../components/video/VideoPlayer';

type StatusFilter = 'ALL' | 'OPEN' | 'ANSWERED' | 'CLOSED';

const STATUS_TABS: { key: StatusFilter; label: string; icon: React.ElementType }[] = [
  { key: 'OPEN', label: 'قيد الانتظار', icon: Inbox },
  { key: 'ANSWERED', label: 'تم الرد عليها', icon: CheckCircle },
  { key: 'CLOSED', label: 'المغلقة', icon: XCircle },
  { key: 'ALL', label: 'جميع الأسئلة', icon: Library },
];

export function TeacherQAInboxPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('OPEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLightbox, setActiveLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // Quick Reply Modal state
  const [replyModalQuestion, setReplyModalQuestion] = useState<(CourseQuestion & { courseName: string; courseId: string }) | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Fetch teacher's courses
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const coursesList = useMemo(() => {
    return coursesData?.courses || coursesData?.data || [];
  }, [coursesData]);

  // Fetch teacher inbox questions
  const { data, isLoading } = useQuery({
    queryKey: ['teacherQaInbox', selectedCourse, page],
    queryFn: () =>
      courseQaApi.getTeacherInbox({
        courseId: selectedCourse || undefined,
        page,
        limit: 20,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ questionId, status }: { questionId: string; status: string }) =>
      courseQaApi.updateStatus(questionId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacherQaInbox'] });
      toast.success(
        variables.status === 'ANSWERED'
          ? 'تم تعيين السؤال كـ "تم الرد"'
          : variables.status === 'CLOSED'
          ? 'تم إغلاق السؤال'
          : 'تم تحديث حالة السؤال'
      );
    },
    onError: () => toast.error('تعذر تحديث حالة السؤال'),
  });

  // Submit quick reply from teacher
  const replyMutation = useMutation({
    mutationFn: async ({ questionId, content }: { questionId: string; content: string }) => {
      await courseQaApi.addReply(questionId, { content });
      await courseQaApi.updateStatus(questionId, 'ANSWERED');
    },
    onSuccess: () => {
      setReplyModalQuestion(null);
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['teacherQaInbox'] });
      toast.success('تم إرسال الرد بنجاح وتحديث حالة السؤال');
    },
    onError: () => toast.error('تعذر إرسال الرد، يرجى المحاولة مرة أخرى'),
  });

  const questions = (data?.questions || []) as (CourseQuestion & { courseName: string; courseId: string })[];

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        return (
          q.content?.toLowerCase().includes(query) ||
          q.studentName?.toLowerCase().includes(query) ||
          q.courseName?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [questions, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: questions.length,
      open: questions.filter((q) => q.status === 'OPEN').length,
      answered: questions.filter((q) => q.status === 'ANSWERED').length,
      closed: questions.filter((q) => q.status === 'CLOSED').length,
    };
  }, [questions]);

  const pagination = data?.pagination;

  // Render question attachments (Video or Images)
  const renderQuestionMedia = (q: CourseQuestion) => {
    if (!q.imageUrl) return null;

    const mediaList = parseImages(q.imageUrl).map(resolveMediaUrl).filter(Boolean);
    if (!mediaList.length) return null;

    const firstMedia = mediaList[0];
    const isVideo = isVideoMedia(firstMedia);

    if (isVideo) {
      return (
        <div className="space-y-2 rounded-2xl border border-surface-border bg-bg-elevated/80 p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gold-300">
            <Video className="h-4 w-4" />
            <span>فيديو مرفق مع السؤال:</span>
          </div>
          <div className="relative aspect-video w-full max-h-72 overflow-hidden rounded-xl border border-surface-border bg-black shadow-card">
            <VideoPlayer sources={[{ url: firstMedia }]} className="h-full w-full" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2 rounded-2xl border border-surface-border bg-bg-elevated/80 p-3.5">
        <div className="flex items-center justify-between text-xs font-bold text-ivory">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-gold-400" />
            <span>الصور المرفقة ({mediaList.length}):</span>
          </div>
          <span className="text-[11px] text-ivory-muted font-normal">اضغط للتكبير</span>
        </div>

        <div
          className={cn(
            'grid gap-2',
            mediaList.length === 1 && 'grid-cols-1 max-w-sm',
            mediaList.length === 2 && 'grid-cols-2',
            mediaList.length >= 3 && 'grid-cols-2 sm:grid-cols-3'
          )}
        >
          {mediaList.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveLightbox({ images: mediaList, index: i })}
              className="group/img relative aspect-video w-full overflow-hidden rounded-xl border border-surface-border bg-surface-card transition-all duration-200 hover:border-gold-400 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-gold-400/30"
            >
              <img
                src={img}
                alt={`صورة السؤال ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://placehold.co/600x400/1a1a1a/ddb44e?text=صورة+السؤال';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/img:bg-black/40">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-md backdrop-blur-sm transition-all group-hover/img:scale-110 group-hover/img:opacity-100">
                  <ZoomIn className="h-4 w-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
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
            <pattern id="qa-hatch" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="1440" height="256" fill="url(#qa-hatch)" />
          <circle cx="1350" cy="16" r="140" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="90" cy="240" r="110" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <span className="absolute -inset-2 rounded-2xl border border-dashed border-gold-500/30 rotate-6" aria-hidden />
              <div className="flex w-14 h-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold-glow">
                <MessageCircle className="w-7 h-7 text-bg" strokeWidth={1.8} />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">
                صندوق أسئلة واستفسارات الطلاب
              </h1>
              <p className="text-xs sm:text-sm text-ivory-muted flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gold-500/70 shrink-0" />
                متابعة وإدارة أسئلة واستفسارات الطلاب والرد عليها في جميع دوراتك.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Stat chips ───────────────────────────────────────────── */}
        {!isLoading && (
          <div className="relative z-10 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: Clock,
                value: stats.open,
                label: 'بانتظار الرد (جديدة)',
                tone: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
              },
              {
                icon: CheckCircle,
                value: stats.answered,
                label: 'تمت الإجابة عليها',
                tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
              },
              {
                icon: XCircle,
                value: stats.closed,
                label: 'أسئلة مغلقة',
                tone: 'text-ivory-muted bg-surface-border border-surface-borderLight',
              },
              {
                icon: Layers,
                value: stats.total,
                label: 'إجمالي الأسئلة',
                tone: 'text-gold-300 bg-gold-500/10 border-gold-500/25',
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

      {/* ─── Filter Tabs & Search Controls ───────────────────────────── */}
      <div className="space-y-3.5">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-surface-card border border-surface-border shadow-card">
          {STATUS_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300',
                  active
                    ? 'bg-gold-gradient text-bg shadow-gold-glow'
                    : 'text-ivory-muted hover:text-ivory hover:bg-gold-500/10'
                )}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Course Select */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-card border border-surface-border shadow-card">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="بحث في محتوى السؤال، اسم الطالب، أو الكورس..."
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
      </div>

      {/* ─── Questions List / Loading / Empty ─────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonManageRow key={i} />
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="relative overflow-hidden p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-5 shadow-card">
          <svg aria-hidden className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 text-gold-500/10" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 7" />
            <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          </svg>
          <div className="relative mx-auto w-20 h-20">
            <span className="absolute inset-0 rounded-full bg-gold-500/10 animate-ping opacity-30" style={{ animationDuration: '2.6s' }} />
            <span className="absolute -inset-2 rounded-full border-2 border-dashed border-gold-500/25 rotate-12" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gold-gradient shadow-gold-glow">
              <MessageCircle className="w-9 h-9 text-bg" strokeWidth={1.6} />
            </div>
          </div>
          <h3 className="text-lg font-bold font-amiri text-ivory">لا توجد أسئلة في هذا القسم</h3>
          <p className="text-xs text-ivory-muted max-w-sm mx-auto leading-relaxed">
            {searchQuery || selectedCourse || statusFilter !== 'ALL'
              ? 'لم يتم العثور على أسئلة تطابق الفلاتر المحددة.'
              : 'لم يطرح الطلاب أي أسئلة جديدة حتى الآن.'}
          </p>
          {(searchQuery || selectedCourse || statusFilter !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCourse('');
                setStatusFilter('ALL');
              }}
            >
              إعادة ضبط الفلاتر
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isAnswered = q.status === 'ANSWERED';
            const isClosed = q.status === 'CLOSED';
            const isOpen = q.status === 'OPEN';

            return (
              <div
                key={q.id}
                className="group relative rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6 transition-all duration-300 hover:border-gold-500/30 hover:shadow-card space-y-4"
              >
                {/* Status indicator line */}
                <div
                  className={cn(
                    'absolute right-0 top-0 h-full w-1 rounded-r-2xl',
                    isOpen && 'bg-amber-400',
                    isAnswered && 'bg-emerald-400',
                    isClosed && 'bg-surface-border'
                  )}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Content Column */}
                  <div className="min-w-0 flex-1 space-y-3">
                    {/* Student Info & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {q.studentPhoto ? (
                          <img
                            src={resolveMediaUrl(q.studentPhoto)}
                            alt=""
                            className="h-10 w-10 rounded-xl border border-surface-border object-cover shadow-sm"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 border border-gold-500/30 text-sm font-bold text-gold-400">
                            {q.studentName?.charAt(0) || 'ط'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-ivory">{q.studentName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-ivory-muted">
                            <BookOpen className="h-3.5 w-3.5 text-gold-400" />
                            <span className="font-semibold text-gold-300/90">{q.courseName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge & Date */}
                      <div className="flex items-center gap-2">
                        {isOpen && (
                          <Badge variant="warning" size="sm">
                            <Clock className="h-3 w-3" />
                            بانتظار الرد
                          </Badge>
                        )}
                        {isAnswered && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="h-3 w-3" />
                            تم الرد
                          </Badge>
                        )}
                        {isClosed && (
                          <Badge variant="neutral" size="sm">
                            <XCircle className="h-3 w-3" />
                            مغلق
                          </Badge>
                        )}
                        <span className="rounded-md border border-surface-border bg-bg-elevated px-2.5 py-1 text-[11px] font-medium text-ivory-muted">
                          {formatDate(q.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Question Content Body */}
                    <div className="rounded-xl border border-surface-border bg-bg-elevated p-4">
                      <p className="text-xs sm:text-sm leading-relaxed font-medium text-ivory whitespace-pre-line">
                        {q.content}
                      </p>
                    </div>

                    {/* Attachments */}
                    {renderQuestionMedia(q)}

                    {/* Reply Count */}
                    <div className="flex items-center gap-4 text-xs font-semibold text-ivory-muted">
                      <span className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-bg-elevated px-2.5 py-1 text-gold-300">
                        <MessageCircle className="h-3.5 w-3.5 text-gold-400" />
                        {q.repliesCount || 0} ردود ومناقشات
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col shrink-0 flex-wrap items-center gap-2 pt-3 sm:pt-0 sm:border-r sm:border-surface-border sm:pr-4">
                    {/* Quick Reply Button */}
                    <button
                      onClick={() => {
                        setReplyModalQuestion(q);
                        setReplyContent('');
                      }}
                      className="flex flex-1 sm:w-full items-center justify-center gap-1.5 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover px-4 py-2.5 text-xs font-bold text-bg shadow-gold-glow transition-all active:scale-[0.97]"
                    >
                      <Send className="h-3.5 w-3.5" />
                      رد سريع
                    </button>

                    {/* Mark Answered */}
                    {isOpen && (
                      <button
                        onClick={() => statusMutation.mutate({ questionId: q.id, status: 'ANSWERED' })}
                        disabled={statusMutation.isPending}
                        className="flex flex-1 sm:w-full items-center justify-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-[0.97] disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        تم الرد
                      </button>
                    )}

                    {/* Reopen Question */}
                    {!isOpen && (
                      <button
                        onClick={() => statusMutation.mutate({ questionId: q.id, status: 'OPEN' })}
                        disabled={statusMutation.isPending}
                        className="flex flex-1 sm:w-full items-center justify-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 px-3.5 py-2.5 text-xs font-bold text-gold-400 hover:bg-gold-500/20 transition-all active:scale-[0.97] disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        إعادة فتح
                      </button>
                    )}

                    {/* Close question */}
                    {!isClosed && (
                      <button
                        onClick={() => statusMutation.mutate({ questionId: q.id, status: 'CLOSED' })}
                        disabled={statusMutation.isPending}
                        className="flex flex-1 sm:w-full items-center justify-center gap-1.5 rounded-full border border-surface-border bg-bg-elevated px-3.5 py-2.5 text-xs font-bold text-ivory-muted hover:border-gold-400 hover:text-ivory transition-all active:scale-[0.97] disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        إغلاق
                      </button>
                    )}

                    {/* Open Full Thread */}
                    <button
                      onClick={() => navigate(`/courses/${q.courseId}/qa/${q.id}`)}
                      className="flex flex-1 sm:w-full items-center justify-center gap-1.5 rounded-full border border-surface-border bg-bg-elevated px-3.5 py-2.5 text-xs font-bold text-ivory hover:border-gold-400 hover:text-gold-300 transition-all active:scale-[0.97]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      المحادثة
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

      {/* ─── Quick Reply Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={!!replyModalQuestion}
        onClose={() => {
          setReplyModalQuestion(null);
          setReplyContent('');
        }}
        title="الرد على سؤال الطالب"
        description={`إرسال إجابة مباشرة للطالب: ${replyModalQuestion?.studentName}`}
        maxWidth="lg"
      >
        {replyModalQuestion && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (replyContent.trim()) {
                replyMutation.mutate({
                  questionId: replyModalQuestion.id,
                  content: replyContent.trim(),
                });
              }
            }}
            className="space-y-4 text-right"
            dir="rtl"
          >
            {/* Original question quote */}
            <div className="rounded-xl border border-surface-border bg-bg-elevated p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-ivory-muted">
                <span className="font-bold text-gold-300">{replyModalQuestion.studentName}</span>
                <span>{replyModalQuestion.courseName}</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-ivory whitespace-pre-line">
                {replyModalQuestion.content}
              </p>
            </div>

            {/* Reply Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ivory">نص الإجابة والشرح:</label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={5}
                placeholder="اكتب إجابتك الواضحة والشاملة للطالب هنا..."
                className="w-full resize-none rounded-xl border border-surface-border bg-bg-elevated p-3.5 text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none focus:border-gold-400"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigate(`/courses/${replyModalQuestion.courseId}/qa/${replyModalQuestion.id}`);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-gold-400 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                فتح المحادثة كاملة
              </button>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setReplyModalQuestion(null);
                    setReplyContent('');
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={!replyContent.trim() || replyMutation.isPending}
                >
                  إرسال الإجابة
                </Button>
              </div>
            </div>
          </form>
        )}
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
