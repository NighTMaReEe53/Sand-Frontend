import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseQaApi, CourseQuestionDetail, QAReply } from '../../api/courseQa.api';
import { reactionsApi } from '../../api/reactions.api';
import { summariesApi } from '../../api/summaries.api';
import { useAuthStore } from '../../store/authStore';
import {
  MessageCircle,
  ArrowRight,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  Image as ImageIcon,
  Video,
  ZoomIn,
  X,
  CornerDownLeft,
  Loader2,
  Camera,
  ShieldCheck,
  Share2,
  ThumbsUp,
  Globe,
  Download,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, resolveMediaUrl, parseImages, isVideoMedia, formatDate } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { VideoPlayer } from '../../components/video/VideoPlayer';

const REACTION_EMOJIS: { key: string; label: string; emoji: string; color: string }[] = [
  { key: 'LIKE', label: 'أعجبني', emoji: '👍', color: 'text-blue-400' },
  { key: 'LOVE', label: 'أحببته', emoji: '❤️', color: 'text-red-500' },
  { key: 'HAHA', label: 'ههههه', emoji: '😂', color: 'text-amber-400' },
  { key: 'WOW', label: 'واو', emoji: '😮', color: 'text-amber-400' },
  { key: 'SAD', label: 'أحزنني', emoji: '😢', color: 'text-amber-400' },
];

function getCurrentUserAvatar(user: any): string | null {
  if (!user) return null;
  return (
    user.teacherProfile?.photoUrl ||
    user.teacherProfile?.imageUrl ||
    user.studentProfile?.photoUrl ||
    user.studentProfile?.avatarUrl ||
    user.profile?.photoUrl ||
    null
  );
}

export function QAThreadPage() {
  const { courseId, questionId } = useParams<{ courseId: string; questionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [replyContent, setReplyContent] = useState('');
  const [replyImage, setReplyImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [inlineReplyContent, setInlineReplyContent] = useState('');
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const reactionOpenRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch question details
  const { data, isLoading, isError } = useQuery({
    queryKey: ['courseQuestion', questionId],
    queryFn: () => courseQaApi.getQuestion(questionId!),
    enabled: !!questionId,
  });

  // Fetch reactions summary for this question
  const { data: reactionData } = useQuery({
    queryKey: ['reactions', 'QUESTION', questionId],
    queryFn: () => reactionsApi.getReactionSummary('QUESTION', questionId!),
    enabled: !!questionId,
  });

  // Reaction Mutations
  const reactMutation = useMutation({
    mutationFn: (type: string) =>
      reactionsApi.react({ targetType: 'QUESTION', targetId: questionId!, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', 'QUESTION', questionId] });
    },
  });

  const unreactMutation = useMutation({
    mutationFn: () => reactionsApi.unreact('QUESTION', questionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', 'QUESTION', questionId] });
    },
  });

  // Reply Mutation
  const replyMutation = useMutation({
    mutationFn: (payload: { content: string; imageUrl?: string; parentId?: string }) =>
      courseQaApi.addReply(questionId!, payload),
    onSuccess: () => {
      setReplyContent('');
      setReplyImage('');
      setReplyingTo(null);
      setInlineReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['courseQuestion', questionId] });
      queryClient.invalidateQueries({ queryKey: ['teacherQaInbox'] });
      queryClient.invalidateQueries({ queryKey: ['courseQuestions', courseId] });
      toast.success('تم نشر ردك بنجاح');
    },
    onError: () => {
      toast.error('تعذر إرسال الرد، يرجى المحاولة مرة أخرى');
    },
  });

  const handleUploadImage = async (file?: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await summariesApi.uploadCommunityMedia(file);
      setReplyImage(res.url);
      toast.success('تم إرفاق الصورة بنجاح');
    } catch {
      toast.error('تعذر رفع الصورة');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleMasterReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    replyMutation.mutate({
      content: replyContent.trim(),
      imageUrl: replyImage || undefined,
    });
  };

  const handleInlineReply = (parentId: string) => {
    if (!inlineReplyContent.trim()) return;
    replyMutation.mutate({
      content: inlineReplyContent.trim(),
      parentId,
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('تم نسخ رابط المنشور بنجاح!');
  };

  const handleReactionClick = (type: string) => {
    setShowReactionMenu(false);
    if (reactionData?.currentUserReaction === type) {
      unreactMutation.mutate();
    } else {
      reactMutation.mutate(type);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 text-right" dir="rtl">
        <div className="rounded-3xl border border-surface-border bg-surface-card p-8 text-center space-y-4 shadow-card">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-400" />
          <p className="text-sm font-bold text-ivory">جاري تحميل المنشور والمناقشات...</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.question) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 text-right" dir="rtl">
        <div className="rounded-3xl border border-surface-border bg-surface-card p-12 text-center space-y-4 shadow-card">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="text-xl font-bold font-amiri text-ivory">المنشور غير متوفر</h2>
          <p className="text-xs text-ivory-muted">تعذر الوصول إلى هذا السؤال، ربما تم حذفه أو ليس لديك صلاحية.</p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            الرجوع للخلف
          </Button>
        </div>
      </div>
    );
  }

  const question = data.question as CourseQuestionDetail;
  const replies = (data.replies || []) as QAReply[];
  const questionImages = parseImages(question.imageUrl).map(resolveMediaUrl).filter(Boolean);
  const isVideo = question.imageUrl ? isVideoMedia(question.imageUrl) : false;

  const currentReaction = reactionData?.currentUserReaction;
  const reactionSummary = reactionData?.summary || {};
  const totalReactions = Object.values(reactionSummary).reduce((a, b) => a + b, 0);
  const activeReactionMeta = REACTION_EMOJIS.find((r) => r.key === currentReaction);

  const userAvatar = getCurrentUserAvatar(currentUser);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 text-right" dir="rtl">
      {/* ─── Top Breadcrumb Bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card px-4 py-2 text-xs font-bold text-ivory hover:border-gold-400 hover:text-gold-300 transition-all shadow-sm"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للأسئلة
        </button>

        <span className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card px-3.5 py-1.5 text-xs font-bold text-gold-300 shadow-sm">
          <BookOpen className="h-3.5 w-3.5 text-gold-400" />
          {question.courseTitle}
        </span>
      </div>

      {/* ─── Facebook-Style Question Post Card ──────────────────────── */}
      <article className="rounded-3xl border border-surface-border bg-surface-card shadow-card transition-all overflow-hidden">
        {/* Post Header */}
        <div className="p-5 sm:p-6 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                {question.studentPhoto ? (
                  <img
                    src={resolveMediaUrl(question.studentPhoto)}
                    alt=""
                    className="h-12 w-12 rounded-full border-2 border-surface-border object-cover shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 border-2 border-gold-500/30 text-base font-bold text-gold-400 shadow-sm">
                    {question.studentName?.charAt(0) || 'ط'}
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-ivory">
                    {question.studentName}
                  </span>
                  <span className="rounded-md border border-surface-border bg-bg-elevated px-2 py-0.5 text-[10px] font-bold text-gold-300">
                    صاحب السؤال
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ivory-muted">
                  <span>{formatDate(question.createdAt)}</span>
                  <span>•</span>
                  <Globe className="h-3 w-3 text-ivory-muted" />
                  <span>عام في {question.courseTitle}</span>
                </div>
              </div>
            </div>

            <div>
              {question.status === 'OPEN' && (
                <Badge variant="warning" size="sm">
                  <Clock className="h-3 w-3" />
                  قيد الانتظار
                </Badge>
              )}
              {question.status === 'ANSWERED' && (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="h-3 w-3" />
                  تمت الإجابة
                </Badge>
              )}
              {question.status === 'CLOSED' && (
                <Badge variant="neutral" size="sm">
                  <XCircle className="h-3 w-3" />
                  مغلق
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-border mx-5 sm:mx-6" />

        {/* Post Text Body */}
        <div className="p-5 sm:p-6 py-4 space-y-4">
          <p className="text-base sm:text-lg leading-relaxed text-ivory font-normal whitespace-pre-line select-text">
            {question.content}
          </p>
        </div>

        {/* ─── Clean Media Showcase with Grid Canvas ───────────────── */}
        {question.imageUrl && (
          <div className="relative border-t border-b border-surface-border bg-surface-card bg-[radial-gradient(rgba(212,175,55,0.16)_1.5px,transparent_1.5px)] [background-size:18px_18px] p-2 sm:p-4 flex items-center justify-center overflow-hidden">
            {isVideo ? (
              <div className="relative aspect-video w-full max-h-[520px] overflow-hidden rounded-2xl bg-black shadow-xl border border-surface-border/60">
                <VideoPlayer sources={[{ url: resolveMediaUrl(question.imageUrl) }]} className="h-full w-full" />
              </div>
            ) : (
              <div className="w-full flex items-center justify-center">
                {questionImages.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveLightbox(img)}
                    className="relative group cursor-pointer overflow-hidden rounded-2xl border border-surface-border/60 bg-surface-card/40 shadow-lg transition-all duration-200 hover:border-gold-400/60 hover:shadow-xl max-w-full flex items-center justify-center"
                  >
                    <img
                      src={img}
                      alt="مرفق السؤال"
                      className="max-h-[580px] w-auto max-w-full object-contain rounded-2xl transition-transform duration-200 group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 rounded-2xl bg-black/0 transition-all duration-150 group-hover:bg-black/20 flex items-center justify-center">
                      <span className="flex items-center gap-1.5 rounded-full bg-black/80 px-3.5 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl backdrop-blur-md transition-all duration-150 group-hover:scale-105 group-hover:opacity-100 border border-white/15">
                        <ZoomIn className="h-4 w-4 text-gold-300" />
                        <span>عرض بحجم كامل</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Post Stats Summary with Reactor Avatars Stack ─────────── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 text-xs text-ivory-muted border-b border-surface-border">
          <div className="flex items-center gap-2">
            {totalReactions > 0 ? (
              <div className="flex items-center gap-2">
                {/* Reaction Emoji Icons */}
                <div className="flex -space-x-1 space-x-reverse">
                  {reactionSummary.LOVE ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] ring-2 ring-surface-card animate-in zoom-in-50 duration-200">
                      ❤️
                    </span>
                  ) : null}
                  {reactionSummary.LIKE ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] ring-2 ring-surface-card animate-in zoom-in-50 duration-200">
                      👍
                    </span>
                  ) : null}
                  {reactionSummary.HAHA ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] ring-2 ring-surface-card animate-in zoom-in-50 duration-200">
                      😂
                    </span>
                  ) : null}
                </div>

                {/* Top 3 Reactors Avatars Stack */}
                {reactionData?.reactors && reactionData.reactors.length > 0 && (
                  <div className="flex -space-x-2 space-x-reverse mr-1">
                    {reactionData.reactors.slice(0, 3).map((r, i) => (
                      <div key={r.userId || i} className="relative inline-block" title={r.name}>
                        {r.photo ? (
                          <img
                            src={resolveMediaUrl(r.photo)}
                            alt={r.name}
                            className="h-5 w-5 rounded-full border border-surface-border object-cover ring-1 ring-gold-400/40"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-gradient text-[9px] font-bold text-bg ring-1 ring-surface-card">
                            {r.name?.charAt(0) || 'م'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <span className="font-bold text-ivory mr-0.5">
                  {reactionData?.reactors && reactionData.reactors.length > 0
                    ? `${reactionData.reactors[0].name}${
                        totalReactions > 1 ? ` و ${totalReactions - 1} آخرين` : ''
                      }`
                    : `${totalReactions} تفاعل`}
                </span>
              </div>
            ) : (
              <span>كن أول من يتفاعل مع هذا السؤال</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>{replies.length} تعليق وإجابة</span>
          </div>
        </div>

        {/* ─── Interactive Action Bar (Animated Like / Comment / Share) ─ */}
        <div className="relative px-3 sm:px-4 py-1.5 flex items-center justify-between">
          {/* Animated Floating Reaction Picker (Facebook Style) */}
          {showReactionMenu && (
            <div
              className="absolute bottom-full right-4 mb-2.5 flex items-center gap-2 rounded-full border border-gold-500/30 bg-surface-card/95 px-3.5 py-2 shadow-2xl backdrop-blur-xl z-30 animate-in fade-in slide-in-from-bottom-3 duration-200"
              onMouseEnter={() => {
                if (reactionCloseRef.current) clearTimeout(reactionCloseRef.current);
                if (reactionOpenRef.current) clearTimeout(reactionOpenRef.current);
              }}
              onMouseLeave={() => setShowReactionMenu(false)}
            >
              {REACTION_EMOJIS.map((r, idx) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleReactionClick(r.key)}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className="group/emoji relative flex flex-col items-center hover:scale-140 hover:-translate-y-2 transition-all duration-150 active:scale-90"
                  title={r.label}
                >
                  <span className="text-2xl sm:text-3xl drop-shadow-md select-none transform transition-transform group-hover/emoji:rotate-6">
                    {r.emoji}
                  </span>
                  <span className="absolute -top-8 rounded-md bg-bg-elevated border border-surface-border px-2 py-0.5 text-[11px] font-bold text-gold-300 shadow-xl opacity-0 group-hover/emoji:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Like button with hover trigger */}
          <button
            type="button"
            onMouseEnter={() => {
              if (reactionCloseRef.current) clearTimeout(reactionCloseRef.current);
              reactionOpenRef.current = setTimeout(() => setShowReactionMenu(true), 300);
            }}
            onMouseLeave={() => {
              if (reactionOpenRef.current) clearTimeout(reactionOpenRef.current);
              reactionCloseRef.current = setTimeout(() => setShowReactionMenu(false), 150);
            }}
            onClick={() => handleReactionClick(currentReaction || 'LIKE')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all hover:bg-gold-500/10 active:scale-95',
              activeReactionMeta ? activeReactionMeta.color : 'text-ivory-muted hover:text-ivory'
            )}
          >
            {activeReactionMeta ? (
              <>
                <span className="text-lg animate-in zoom-in-50 duration-150">{activeReactionMeta.emoji}</span>
                <span>{activeReactionMeta.label}</span>
              </>
            ) : (
              <>
                <ThumbsUp className="h-4 w-4" />
                <span>إعجاب</span>
              </>
            )}
          </button>

          {/* Comment button */}
          <button
            type="button"
            onClick={() => commentInputRef.current?.focus()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-ivory-muted hover:text-ivory hover:bg-gold-500/10 transition-all active:scale-95"
          >
            <MessageCircle className="h-4 w-4 text-gold-400" />
            <span>تعليق</span>
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-ivory-muted hover:text-ivory hover:bg-gold-500/10 transition-all active:scale-95"
          >
            <Share2 className="h-4 w-4 text-sky-400" />
            <span>مشاركة</span>
          </button>
        </div>

        {/* ─── Comment Composer (Write Comment Box) ───────────────────── */}
        <div className="border-t border-surface-border bg-bg-elevated/40 p-4 sm:p-5">
          <form onSubmit={handleMasterReply} className="flex items-start gap-3">
            {userAvatar ? (
              <img
                src={resolveMediaUrl(userAvatar)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-surface-border object-cover mt-1"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-bg font-bold text-sm shadow-gold-glow mt-1">
                {currentUser?.email?.charAt(0).toUpperCase() || 'أ'}
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="relative rounded-2xl border border-surface-border bg-surface-card focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/20 transition-all shadow-inner">
                <textarea
                  ref={commentInputRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="اكتب تعليقاً أو رداً للمساعدة..."
                  rows={2}
                  className="w-full resize-none bg-transparent p-3.5 text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none"
                  required
                />

                <div className="flex items-center justify-between border-t border-surface-border/60 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <label className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-ivory-muted hover:bg-gold-500/10 hover:text-gold-300 transition-colors">
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
                      ) : (
                        <Camera className="h-4 w-4 text-gold-400" />
                      )}
                      <span className="hidden sm:inline">إرفاق صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleUploadImage(e.target.files?.[0])}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!replyContent.trim() || replyMutation.isPending || isUploadingImage}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover px-4 py-1.5 text-xs font-bold text-bg shadow-gold-glow transition-all disabled:opacity-40 active:scale-95"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>إرسال</span>
                  </button>
                </div>
              </div>

              {/* Uploaded image preview */}
              {replyImage && (
                <div className="relative inline-block rounded-xl border border-surface-border bg-surface-card p-1.5 shadow-md">
                  <img
                    src={resolveMediaUrl(replyImage)}
                    alt="معاينة الصورة"
                    className="max-h-24 w-auto object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setReplyImage('')}
                    className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* ─── Facebook-Style Comments List ──────────────────────────── */}
        <div className="p-5 sm:p-6 space-y-4 border-t border-surface-border bg-bg-elevated/20">
          <h4 className="text-xs font-bold text-ivory-muted uppercase tracking-wider">
            التعليقات والمناقشات ({replies.length})
          </h4>

          {replies.length === 0 ? (
            <div className="py-8 text-center text-xs text-ivory-muted">
              لا توجد تعليقات حتى الآن. كن أول من يكتب رداً!
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <FacebookThreadItem
                  key={reply.id}
                  reply={reply}
                  onReply={handleInlineReply}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  inlineContent={inlineReplyContent}
                  setInlineContent={setInlineReplyContent}
                  isSubmitting={replyMutation.isPending}
                  onImageClick={(url) => setActiveLightbox(url)}
                />
              ))}
            </div>
          )}
        </div>
      </article>

      {/* ─── Clean Simple Portal Lightbox Modal ─────────────────── */}
      {activeLightbox &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-sm select-none animate-in fade-in duration-150"
            onClick={() => setActiveLightbox(null)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveLightbox(null)}
              className="absolute top-5 left-5 flex h-11 w-11 items-center justify-center rounded-full bg-surface-card text-ivory border border-surface-border hover:border-red-400 hover:text-red-400 transition-all shadow-xl z-20"
              title="إغلاق"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Centered Clean Image */}
            <div
              className="relative flex items-center justify-center max-h-[90vh] max-w-[92vw] animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeLightbox}
                alt="معاينة الصورة"
                className="max-h-[88vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl border border-white/10"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/** ─── Comment Item with Direct Reply Capability ─────────────────── */
function FacebookThreadItem({
  reply,
  onReply,
  replyingTo,
  setReplyingTo,
  inlineContent,
  setInlineContent,
  isSubmitting,
  onImageClick,
}: {
  reply: QAReply;
  onReply: (parentId: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  inlineContent: string;
  setInlineContent: (v: string) => void;
  isSubmitting: boolean;
  onImageClick: (url: string) => void;
}) {
  const queryClient = useQueryClient();
  const isTeacher = reply.isTeacher;
  const isReplyingThis = replyingTo === reply.id;

  const authorPhotoUrl = reply.authorPhoto ? resolveMediaUrl(reply.authorPhoto) : null;

  // ── Real reactions for this reply via API (QA_REPLY target type) ──
  const { data: reactionData } = useQuery({
    queryKey: ['reactions', 'QA_REPLY', reply.id],
    queryFn: () => reactionsApi.getReactionSummary('QA_REPLY', reply.id),
    staleTime: 30 * 1000,
  });

  const myReaction = reactionData?.currentUserReaction ?? null;
  const totalReplyReactions = Object.values(reactionData?.summary ?? {}).reduce((a, b) => a + b, 0);

  const reactReplyMutation = useMutation({
    mutationFn: (type: string) =>
      reactionsApi.react({ targetType: 'QA_REPLY', targetId: reply.id, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', 'QA_REPLY', reply.id] });
    },
  });

  const unreactReplyMutation = useMutation({
    mutationFn: () => reactionsApi.unreact('QA_REPLY', reply.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', 'QA_REPLY', reply.id] });
    },
  });

  const handleCommentReaction = () => {
    if (reactReplyMutation.isPending || unreactReplyMutation.isPending) return;
    if (myReaction === 'LIKE') {
      unreactReplyMutation.mutate();
    } else {
      reactReplyMutation.mutate('LIKE');
    }
  };

  return (
    <div className="flex items-start gap-3 text-right group/comment">
      {authorPhotoUrl ? (
        <img
          src={authorPhotoUrl}
          alt=""
          className={cn(
            'h-9 w-9 shrink-0 rounded-full border object-cover shadow-sm mt-0.5',
            isTeacher ? 'border-gold-400 ring-2 ring-gold-500/25' : 'border-surface-border'
          )}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm mt-0.5',
            isTeacher
              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
              : 'bg-bg-elevated text-ivory border border-surface-border'
          )}
        >
          {reply.authorName?.charAt(0) || (isTeacher ? 'م' : 'ط')}
        </div>
      )}

      <div className="flex-1 space-y-1.5 min-w-0">
        <div
          className={cn(
            'inline-block max-w-full rounded-2xl p-3.5 sm:p-4 text-right space-y-1.5 shadow-sm border',
            isTeacher
              ? 'bg-surface-card border-gold-500/35 shadow-gold-glow/10'
              : 'bg-bg-elevated border-surface-border'
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-ivory hover:underline cursor-pointer">
              {reply.authorName}
            </span>
            {isTeacher ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-gradient px-2 py-0.5 text-[10px] font-bold text-bg shadow-gold-glow">
                <ShieldCheck className="h-3 w-3" />
                مدرس المادة
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-surface-border bg-surface-card px-1.5 py-0.5 text-[9px] font-semibold text-ivory-muted">
                طالب
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-ivory font-normal whitespace-pre-line select-text">
            {reply.content}
          </p>

          {reply.imageUrl && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onImageClick(resolveMediaUrl(reply.imageUrl!))}
                className="group/img relative block overflow-hidden rounded-xl border border-surface-border bg-black/40 hover:border-gold-400 transition-all max-w-xs"
              >
                <img
                  src={resolveMediaUrl(reply.imageUrl)}
                  alt="مرفق التعليق"
                  className="max-h-44 w-auto object-contain rounded-lg"
                />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold text-ivory-muted pr-2">
          <span>{formatDate(reply.createdAt)}</span>

          {/* ── Real Like Button with count ─────────────────────── */}
          <button
            type="button"
            onClick={handleCommentReaction}
            disabled={reactReplyMutation.isPending || unreactReplyMutation.isPending}
            className={cn(
              'flex items-center gap-1 hover:underline transition-colors disabled:opacity-60',
              myReaction === 'LIKE' ? 'text-blue-400 font-bold' :
              myReaction === 'LOVE' ? 'text-red-400 font-bold' : 'hover:text-ivory'
            )}
          >
            {myReaction === 'LIKE' ? '👍' : myReaction === 'LOVE' ? '❤️' : '👍'}
            <span>{myReaction ? 'أعجبني' : 'إعجاب'}</span>
            {totalReplyReactions > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-card border border-surface-border px-1.5 py-0.5 text-[9px] font-bold text-ivory-muted">
                {totalReplyReactions}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isReplyingThis) {
                setReplyingTo(null);
                setInlineContent('');
              } else {
                setReplyingTo(reply.id);
                setInlineContent('');
              }
            }}
            className="hover:text-gold-300 hover:underline transition-colors"
          >
            {isReplyingThis ? 'إلغاء' : 'رد'}
          </button>
        </div>

        {/* Inline Reply Composer */}
        {isReplyingThis && (
          <div className="pt-2 space-y-2 pr-2">
            <div className="rounded-2xl border border-surface-border bg-surface-card p-3 shadow-inner space-y-2">
              <textarea
                value={inlineContent}
                onChange={(e) => setInlineContent(e.target.value)}
                placeholder={`اكتب رداً على ${reply.authorName}...`}
                rows={2}
                className="w-full resize-none bg-transparent text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 border-t border-surface-border/60 pt-2">
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="rounded-lg px-3 py-1 text-xs font-bold text-ivory-muted hover:text-ivory"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!inlineContent.trim() || isSubmitting}
                  onClick={() => onReply(reply.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover px-4 py-1 text-xs font-bold text-bg shadow-gold-glow transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  <span>إرسال</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nested Children Thread */}
        {reply.children && reply.children.length > 0 && (
          <div className="mt-3 mr-4 sm:mr-6 border-r-2 border-surface-border pr-3 sm:pr-4 space-y-3">
            {reply.children.map((child) => (
              <FacebookThreadItem
                key={child.id}
                reply={child}
                onReply={onReply}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                inlineContent={inlineContent}
                setInlineContent={setInlineContent}
                isSubmitting={isSubmitting}
                onImageClick={onImageClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
