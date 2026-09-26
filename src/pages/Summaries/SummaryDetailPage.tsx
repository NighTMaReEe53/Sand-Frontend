import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { summariesApi, Summary, SummaryComment } from '../../api/summaries.api';
import { reactionsApi } from '../../api/reactions.api';
import { useAuthStore } from '../../store/authStore';
import { VideoPlayer } from '../../components/video/VideoPlayer';
import {
  ArrowRight,
  Send,
  CheckCircle2,
  Clock,
  BookOpen,
  ZoomIn,
  X,
  Loader2,
  ShieldCheck,
  Share2,
  ThumbsUp,
  MessageCircle,
  Globe,
  XCircle,
  Reply,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, resolveMediaUrl, parseImages, formatDate, formatGradeLevel } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,20})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = trimmed.match(/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{6,20})/);
  if (embedMatch) return embedMatch[1];
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,20})/);
  if (vMatch) return vMatch[1];
  return null;
}

const REACTION_EMOJIS = [
  { key: 'LIKE',  label: 'أعجبني', emoji: '👍', color: 'text-blue-400'  },
  { key: 'LOVE',  label: 'أحببته', emoji: '❤️', color: 'text-red-400'   },
  { key: 'HAHA',  label: 'ههههه',  emoji: '😂', color: 'text-amber-400' },
  { key: 'WOW',   label: 'واو',    emoji: '😮', color: 'text-amber-400' },
  { key: 'SAD',   label: 'أحزنني', emoji: '😢', color: 'text-amber-400' },
];

/* ─────────────────────────────────────────────────────────────── */
export function SummaryDetailPage() {
  const { id } = useParams<{ courseId: string; id: string }>();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const commentRef  = useRef<HTMLTextAreaElement>(null);

  const [commentContent,       setCommentContent]       = useState('');
  const [replyingTo,           setReplyingTo]           = useState<string | null>(null);
  const [inlineCommentContent, setInlineCommentContent] = useState('');
  const [activeLightbox,       setActiveLightbox]       = useState<string | null>(null);
  const [showReactionMenu,     setShowReactionMenu]     = useState(false);
  const reactionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── data ── */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['summaryDetail', id],
    queryFn:  () => summariesApi.getSummaryDetail(id!),
    enabled:  !!id,
  });
  const { data: reactionData } = useQuery({
    queryKey: ['reactions', 'SUMMARY', id],
    queryFn:  () => reactionsApi.getReactionSummary('SUMMARY', id!),
    enabled:  !!id,
  });

  /* ── mutations ── */
  const reactMutation = useMutation({
    mutationFn: (type: string) => reactionsApi.react({ targetType: 'SUMMARY', targetId: id!, type }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['reactions', 'SUMMARY', id] }),
  });
  const unreactMutation = useMutation({
    mutationFn: () => reactionsApi.unreact('SUMMARY', id!),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['reactions', 'SUMMARY', id] }),
  });
  const commentMutation = useMutation({
    mutationFn: (p: { content: string; parentId?: string }) => summariesApi.addComment(id!, p),
    onSuccess:  () => {
      setCommentContent('');
      setReplyingTo(null);
      setInlineCommentContent('');
      qc.invalidateQueries({ queryKey: ['summaryDetail', id] });
      toast.success('تم نشر تعليقك بنجاح');
    },
    onError: () => toast.error('تعذر إرسال التعليق'),
  });

  const handleReactionClick = (type: string) => {
    setShowReactionMenu(false);
    if (reactionData?.currentUserReaction === type) unreactMutation.mutate();
    else reactMutation.mutate(type);
  };

  /* ── states ── */
  if (isLoading) return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6" dir="rtl">
      <div className="rounded-3xl border border-line bg-surface p-12 text-center space-y-4 shadow-card">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-400" />
        <p className="text-sm font-semibold text-ink">جاري تحميل الملخص...</p>
      </div>
    </div>
  );
  if (isError || !data?.summary) return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6" dir="rtl">
      <div className="rounded-3xl border border-line bg-surface p-12 text-center space-y-4 shadow-card">
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="text-lg font-bold text-ink">الملخص غير متوفر أو قيد المراجعة</h2>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>الرجوع للخلف</Button>
      </div>
    </div>
  );

  const summary  = data.summary  as Summary;
  const comments = (data.comments || []) as SummaryComment[];
  const images   = parseImages(summary.images).map(resolveMediaUrl).filter(Boolean);
  const videoUrl = summary.videoUrl ? resolveMediaUrl(summary.videoUrl) : null;
  const ytId     = extractYouTubeId(summary.videoUrl);

  const currentReaction    = reactionData?.currentUserReaction;
  const reactionSummary    = reactionData?.summary || {};
  const totalReactions     = Object.values(reactionSummary).reduce((a, b) => a + b, 0);
  const activeReactionMeta = REACTION_EMOJIS.find((r) => r.key === currentReaction);

  const myPhoto = (currentUser?.teacherProfile as any)?.photoUrl
    || (currentUser?.teacherProfile as any)?.imageUrl
    || currentUser?.studentProfile?.photoUrl;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-3 sm:p-5 text-right bg-bg text-ink" dir="rtl">

      {/* ── breadcrumb ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-bold text-ink hover:border-primary hover:text-primary transition-all shadow-sm"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للملخصات
        </button>
        {summary.courseTitle && (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
            <BookOpen className="h-3.5 w-3.5 text-gold-400" />
            {summary.courseTitle}
          </span>
        )}
      </div>

      {/* ═══════════════ POST CARD ═══════════════ */}
      <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">

        {/* ── header ── */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
          <div className="flex items-center gap-3">
            {/* avatar */}
            {summary.studentPhoto ? (
              <img
                src={resolveMediaUrl(summary.studentPhoto)}
                alt={summary.studentName}
                className="h-12 w-12 shrink-0 rounded-full border-2 border-primary/50 object-cover shadow ring-2 ring-primary/15"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-lg font-black text-primary shadow">
                {summary.studentName?.charAt(0) || 'ط'}
              </div>
            )}
            {/* meta */}
            <div className="min-w-0 space-y-0.5">
              <p className="text-[15px] font-extrabold leading-tight text-primary">
                {summary.studentName}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-px text-[11px] font-bold text-primary">
                  {formatGradeLevel(summary.studentGradeLevel)}
                </span>
                <span className="text-ink-muted">·</span>
                <Clock className="h-3 w-3 text-zinc-500" />
                <span className="text-[11px] text-ink-muted">{formatDate(summary.createdAt)}</span>
                <span className="text-ink-muted">·</span>
                <Globe className="h-3 w-3 text-zinc-500" />
                <span className="text-[11px] text-ink-muted">مجتمع الكورس</span>
              </div>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            معتمد
          </span>
        </div>

        {/* ── title + body ── */}
        <div className="px-4 pb-5 sm:px-5 sm:pb-6 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black leading-snug font-heading text-primary">
            {summary.title}
          </h1>
          <p className="text-base sm:text-lg leading-[1.95] text-ink/90 whitespace-pre-line select-text font-body">
            {summary.description}
          </p>
        </div>

        {/* ── media ── */}
        {(videoUrl || images.length > 0) && (
          <div className="border-y border-line bg-gradient-to-b from-surface-alt/50 to-surface-alt/20 flex flex-col gap-4 p-4 sm:p-5">
            {videoUrl && (
              <div className="overflow-hidden rounded-2xl bg-black border border-gold-500/20 shadow-[0_18px_45px_-15px_rgba(0,0,0,0.7)] aspect-video">
                <VideoPlayer
                  sources={[{ url: ytId ? `https://www.youtube.com/watch?v=${ytId}` : videoUrl, label: ytId ? 'يوتيوب' : 'الملخص' }]}
                  title={summary.title}
                  className="w-full h-full"
                />
              </div>
            )}
            {images.length > 0 && (
              <div className="flex flex-col gap-4">
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveLightbox(img)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-line/60 bg-black flex items-center justify-center hover:border-gold-500/50 transition-all shadow-md"
                  >
                    <img
                      src={img}
                      alt="مرفق الملخص"
                      className="max-h-[640px] w-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <span className="flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl backdrop-blur border border-white/15">
                        <ZoomIn className="h-3.5 w-3.5 text-gold-300" />
                        عرض بحجم كامل
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── reaction stats row ── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-line text-[12px] text-ink-muted">
          <div className="flex items-center gap-2">
            {totalReactions > 0 ? (
              <>
                <div className="flex -space-x-1 space-x-reverse">
                  {reactionSummary.LOVE ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] ring-2 ring-surface-card">❤️</span> : null}
                  {reactionSummary.LIKE ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] ring-2 ring-surface-card">👍</span> : null}
                  {reactionSummary.HAHA ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] ring-2 ring-surface-card">😂</span> : null}
                </div>
                <span className="font-semibold text-ink">{totalReactions} تفاعل</span>
              </>
            ) : (
              <span>كن أول من يتفاعل</span>
            )}
          </div>
          <span className="font-semibold text-ink-muted">{comments.length} تعليق</span>
        </div>

        {/* ── action bar ── */}
        <div className="relative flex items-center border-b border-line">
          {/* reaction picker */}
          {showReactionMenu && (
            <div
              className="absolute bottom-full right-2 mb-2 flex items-center gap-2 rounded-full border border-primary/30 bg-surface/95 px-3 py-2 shadow-2xl backdrop-blur-xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-200"
              onMouseEnter={() => { if (reactionTimeout.current) clearTimeout(reactionTimeout.current); }}
              onMouseLeave={() => setShowReactionMenu(false)}
            >
              {REACTION_EMOJIS.map((r, i) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleReactionClick(r.key)}
                  style={{ animationDelay: `${i * 25}ms` }}
                  className="group/e relative flex flex-col items-center hover:-translate-y-2 hover:scale-125 transition-all duration-150 active:scale-90"
                  title={r.label}
                >
                  <span className="text-2xl select-none">{r.emoji}</span>
                  <span className="absolute -top-7 rounded bg-surface-alt border border-line px-1.5 py-px text-[10px] font-bold text-primary opacity-0 group-hover/e:opacity-100 transition-opacity whitespace-nowrap">{r.label}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onMouseEnter={() => { reactionTimeout.current = setTimeout(() => setShowReactionMenu(true), 200); }}
            onMouseLeave={() => { if (reactionTimeout.current) clearTimeout(reactionTimeout.current); }}
            onClick={() => handleReactionClick(currentReaction || 'LIKE')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold transition-all hover:bg-black/5 active:scale-95',
              activeReactionMeta ? activeReactionMeta.color : 'text-ink-muted hover:text-ink'
            )}
          >
            {activeReactionMeta
              ? <><span className="text-base">{activeReactionMeta.emoji}</span><span>{activeReactionMeta.label}</span></>
              : <><ThumbsUp className="h-4 w-4" /><span>إعجاب</span></>
            }
          </button>

          <div className="w-px h-6 bg-line/60 shrink-0" />

          <button
            type="button"
            onClick={() => commentRef.current?.focus()}
            className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold text-ink-muted hover:text-ink hover:bg-black/5 transition-all"
          >
            <MessageCircle className="h-4 w-4 text-gold-400" />
            <span>تعليق</span>
          </button>

          <div className="w-px h-6 bg-line/60 shrink-0" />

          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('تم نسخ الرابط!'); }}
            className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-bold text-ink-muted hover:text-ink hover:bg-black/5 transition-all"
          >
            <Share2 className="h-4 w-4 text-sky-400" />
            <span>مشاركة</span>
          </button>
        </div>

        {/* ── comment composer ── */}
        <div className="bg-surface-alt/50 px-4 py-4 sm:px-5">
          <form onSubmit={(e) => { e.preventDefault(); if (!commentContent.trim()) return; commentMutation.mutate({ content: commentContent.trim() }); }} className="flex gap-3">
            {myPhoto ? (
              <img src={resolveMediaUrl(myPhoto)} alt="" className="h-9 w-9 shrink-0 rounded-full border-line object-cover mt-0.5" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-sm mt-0.5">
                {currentUser?.email?.charAt(0).toUpperCase() || 'أ'}
              </div>
            )}
            <div className="flex-1">
              <div className="rounded-2xl border border-line bg-surface focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15 transition-all overflow-hidden">
                <textarea
                  ref={commentRef}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="اكتب تعليقاً أو استفساراً..."
                  rows={3}
                  className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[14px] text-ink placeholder:text-ink-muted outline-none leading-relaxed"
                  required
                />
                <div className="flex items-center justify-between border-t border-line/50 px-4 py-2.5">
                  <span className="text-[11px] text-ink-muted">
                    {commentContent.length > 0 ? `${commentContent.length} حرف` : 'اضغط إرسال لنشر تعليقك'}
                  </span>
                  <button
                    type="submit"
                    disabled={!commentContent.trim() || commentMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-40 active:scale-95 hover:opacity-90"
                  >
                    {commentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    إرسال
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* ── comments list ── */}
        <div className="px-4 pb-5 pt-2 sm:px-5 space-y-1">
          <div className="flex items-center justify-between py-2">
            <span className="text-[12px] font-bold text-ink-muted uppercase tracking-widest flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-gold-400" />
              التعليقات
            </span>
            {comments.length > 0 && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-px text-[11px] font-black text-primary">
                {comments.length}
              </span>
            )}
          </div>

          {comments.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <MessageCircle className="mx-auto h-7 w-7 text-ink-muted" />
              <p className="text-[13px] text-ink-muted">لا توجد تعليقات بعد — كن أول من يناقش!</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {comments.map((c) => (
                <CommentBubble
                  key={c.id}
                  comment={c}
                  onReply={(pid) => commentMutation.mutate({ content: inlineCommentContent.trim(), parentId: pid })}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  inlineContent={inlineCommentContent}
                  setInlineContent={setInlineCommentContent}
                  isSubmitting={commentMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </article>

      {/* ── lightbox ── */}
      {activeLightbox && createPortal(
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setActiveLightbox(null)}
            className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ivory border border-surface-border hover:border-red-400 hover:text-red-400 transition-all shadow-xl z-20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-[90vh] max-w-[92vw] animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <img src={activeLightbox} alt="معاينة" className="max-h-[88vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl border border-white/10" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Comment Bubble                                                 */
/* ═══════════════════════════════════════════════════════════════ */
function CommentBubble({
  comment,
  onReply,
  replyingTo,
  setReplyingTo,
  inlineContent,
  setInlineContent,
  isSubmitting,
}: {
  comment: SummaryComment;
  onReply: (pid: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  inlineContent: string;
  setInlineContent: (v: string) => void;
  isSubmitting: boolean;
}) {
  const qc           = useQueryClient();
  const isTeacher    = comment.isTeacher;
  const isReplying   = replyingTo === comment.id;
  const myReaction   = comment.currentUserReaction;
  const reactCount   = comment.reactionCount || 0;

  const reactMutation = useMutation({
    mutationFn: (type: string) => reactionsApi.react({ targetType: 'SUMMARY_COMMENT', targetId: comment.id, type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['summaryDetail'] }),
  });
  const unreactMutation = useMutation({
    mutationFn: () => reactionsApi.unreact('SUMMARY_COMMENT', comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['summaryDetail'] }),
  });

  const toggleLove = () => {
    if (myReaction === 'LOVE') unreactMutation.mutate();
    else reactMutation.mutate('LOVE');
  };

  return (
    <div className="flex items-start gap-3 text-right">
      {/* avatar */}
      {comment.authorPhoto ? (
        <img
          src={resolveMediaUrl(comment.authorPhoto)}
          alt=""
          className={cn(
            'h-10 w-10 shrink-0 rounded-full border-2 object-cover mt-0.5 shadow-sm',
            isTeacher ? 'border-gold-500/40 ring-1 ring-gold-500/20' : 'border-surface-border'
          )}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black mt-0.5 shadow-sm',
          isTeacher
            ? 'border-gold-500/40 bg-gold-500/15 text-gold-300'
            : 'border-surface-border bg-surface text-ivory'
        )}>
          {comment.authorName?.charAt(0) || 'م'}
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* QA-style comment card */}
        <div className={cn(
          'w-full rounded-2xl px-4 py-3 border border-surface-border bg-surface-card shadow-sm'
        )}>
          {/* name row */}
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className={cn(
              'text-[15px] sm:text-base font-black leading-none',
              isTeacher ? 'text-gold-300' : 'text-ivory'
            )}>
              {comment.authorName}
            </span>
            {isTeacher && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/15 px-2 py-0.5 text-[9px] font-black text-gold-300 shadow-sm">
                <ShieldCheck className="h-2.5 w-2.5" />
                مدرس المادة
              </span>
            )}
          </div>
          {/* content */}
          <p className="text-[14px] sm:text-[15px] leading-relaxed text-ivory/90 whitespace-pre-line select-text">
            {comment.content}
          </p>
        </div>

        {/* action row */}
        <div className="flex items-center gap-3 px-1 text-[12px] text-ivory-muted">
          <span>{formatDate(comment.createdAt)}</span>

          <button
            type="button"
            disabled={reactMutation.isPending || unreactMutation.isPending}
            onClick={toggleLove}
            className={cn(
              'inline-flex items-center gap-1 font-bold transition-all disabled:opacity-50 hover:scale-105 active:scale-95',
              myReaction === 'LOVE' ? 'text-red-400' : 'hover:text-red-400'
            )}
          >
            <span className={cn('transition-transform duration-200 text-[13px]', myReaction === 'LOVE' ? 'scale-125' : '')}>
              {myReaction === 'LOVE' ? '❤️' : '🤍'}
            </span>
            <span>{myReaction === 'LOVE' ? 'أعجبك' : 'إعجاب'}</span>
            {reactCount > 0 && (
              <span className="rounded-full bg-red-500/15 px-1.5 py-px text-red-400 font-black">{reactCount}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isReplying) { setReplyingTo(null); setInlineContent(''); }
              else { setReplyingTo(comment.id); setInlineContent(''); }
            }}
            className="inline-flex items-center gap-1.5 font-bold text-gold-400 hover:text-gold-300 transition-colors"
          >
            {isReplying ? (<><X className="h-3.5 w-3.5" /> إلغاء</>) : (<><Reply className="h-3.5 w-3.5" /> رد</>)}
          </button>
        </div>

        {/* reply composer */}
        {isReplying && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200 pt-1">
            <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card focus-within:border-gold-500/60 focus-within:ring-2 focus-within:ring-gold-500/15 transition-all">
              <textarea
                value={inlineContent}
                onChange={(e) => setInlineContent(e.target.value)}
                placeholder={`↩ رد على ${comment.authorName}...`}
                rows={2}
                autoFocus
                className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[14px] text-ivory placeholder:text-ivory-muted outline-none leading-relaxed"
              />
              <div className="flex items-center justify-between border-t border-surface-border/60 px-3 py-2">
                <button
                  type="button"
                  onClick={() => { setReplyingTo(null); setInlineContent(''); }}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-ivory-muted hover:text-ivory transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!inlineContent.trim() || isSubmitting}
                  onClick={() => onReply(comment.id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-1.5 text-xs font-bold text-bg shadow-sm transition-all disabled:opacity-50 active:scale-95 hover:opacity-90"
                >
                  {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  إرسال الرد
                </button>
              </div>
            </div>
          </div>
        )}

        {/* nested replies */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-2 mr-4 border-r-2 border-gold-500/20 pr-3 space-y-2.5">
            {comment.children.map((child) => (
              <CommentBubble
                key={child.id}
                comment={child}
                onReply={onReply}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                inlineContent={inlineContent}
                setInlineContent={setInlineContent}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
