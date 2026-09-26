import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { summariesApi, Summary, SummaryComment } from "../../api/summaries.api";
import { reactionsApi } from "../../api/reactions.api";
import { useAuthStore } from "../../store/authStore";
import {
  FileText,
  MessageCircle,
  Plus,
  Trophy,
  Sparkles,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Video,
  Image as ImageIcon,
  Share2,
  ThumbsUp,
  Send,
  CornerDownLeft,
  Loader2,
  ShieldCheck,
  ExternalLink,
  X,
} from "lucide-react";
import { SummaryComposerModal } from "./SummaryComposerModal";
import { CustomCourseSelect } from "../../components/ui/CustomCourseSelect";
import { VideoPlayer } from "../../components/video/VideoPlayer";
import { SkeletonSummaryCard } from "../../components/ui/Skeleton";
import {
  resolveMediaUrl,
  parseImages,
  formatDate,
  formatGradeLevel,
  cn,
} from "../../lib/utils";
import { toast } from "sonner";

const REACTION_EMOJIS: {
  key: string;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: "LIKE", label: "أعجبني", emoji: "👍", color: "text-blue-400" },
  { key: "LOVE", label: "أحببته", emoji: "❤️", color: "text-red-500" },
  { key: "HAHA", label: "ههههه", emoji: "😂", color: "text-amber-400" },
  { key: "WOW", label: "واو", emoji: "😮", color: "text-amber-400" },
  { key: "SAD", label: "أحزنني", emoji: "😢", color: "text-amber-400" },
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

/* ────────────────────────────────────────────────────── */
export function SummariesFeedPage() {
  const { courseId: paramCourseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    paramCourseId || null
  );

  useEffect(() => {
    if (paramCourseId && paramCourseId !== selectedCourseId) {
      setSelectedCourseId(paramCourseId);
    }
  }, [paramCourseId]);

  const activeCourseId = selectedCourseId || paramCourseId;

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("newest");
  const [showComposer, setShowComposer] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["summaries", activeCourseId, page, sort],
    queryFn: ({ signal }) =>
      summariesApi.listSummaries(
        activeCourseId!,
        { page, limit: 20, sort },
        signal
      ),
    enabled: !!activeCourseId,
  });

  return (
    <div
      className="community-page mx-auto w-full max-w-4xl space-y-6 p-4"
      dir="rtl"
    >
      <style>{`@keyframes communityItemIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.community-page>div{animation:communityItemIn .35s ease-out both}@media(prefers-reduced-motion:reduce){.community-page>div{animation:none}}`}</style>
      <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gold-400 font-bold">
              مجتمع المعرفة والمذكرات
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black font-amira text-gold-300">
              ملخصات الطلاب
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-ivory-muted">
              اكتشف ملخصات زملائك المعتمدة وشارك ما تعلمته من تلخيصات وملاحظات.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient hover:bg-gold-gradient-hover px-4 py-2.5 text-xs sm:text-sm font-bold text-bg shadow-gold-glow transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              إضافة ملخص
            </button>
            {activeCourseId && (
              <Link
                to={`/courses/${activeCourseId}/summaries/leaderboard`}
                className="inline-flex items-center gap-1.5 bg-surface border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition"
              >
                <Trophy className="w-4 h-4 text-gold-400" />
                المتصدرون
              </Link>
            )}
          </div>
        </div>

        {/* Course Filter Bar */}
        <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ivory-muted">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>تصفح ملخصات حسب الكورس:</span>
          </div>
          <CustomCourseSelect
            selectedCourseId={activeCourseId}
            onSelectCourse={(id) => {
              setSelectedCourseId(id);
              navigate(`/courses/${id}/summaries`, { replace: true });
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-surface-border bg-surface-card p-2">
        {[
          { value: "newest", label: "الأحدث" },
          { value: "mostLiked", label: "الأكثر إعجاباً" },
          { value: "mostCommented", label: "الأكثر تعليقاً" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setSort(s.value);
              setPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              sort === s.value
                ? "bg-gold-gradient text-white font-black shadow-gold-glow border border-gold-400/50"
                : "bg-surface border border-surface-border text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => {
            setSort("mine");
            setPage(1);
          }}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            sort === "mine"
              ? "bg-gold-gradient text-white font-black shadow-gold-glow border border-gold-400/50"
              : "bg-surface border border-surface-border text-zinc-300 hover:text-white hover:bg-white/10"
          }`}
        >
          ملخصاتي
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <SkeletonSummaryCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {data?.summaries?.map((s: Summary) => (
            <SummaryCard key={s.id} summary={s} courseId={activeCourseId!} />
          ))}
          {data?.summaries?.length === 0 && (
            <div className="col-span-full text-center text-ivory-muted py-8 font-bold text-sm">
              لا توجد ملخصات بعد في هذا الكورس
            </div>
          )}
        </div>
      )}

      {activeCourseId && data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-surface-border bg-surface-card px-5 py-2 text-sm font-bold text-ivory disabled:opacity-40 hover:border-gold-400 transition"
          >
            السابق
          </button>
          <span className="text-xs text-ivory-muted font-bold">
            صفحة {page} من {data.pagination.totalPages}
          </span>
          <button
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-surface-border bg-surface-card px-5 py-2 text-sm font-bold text-ivory disabled:opacity-40 hover:border-gold-400 transition"
          >
            التالي
          </button>
        </div>
      )}

      {showComposer && activeCourseId && (
        <SummaryComposerModal
          courseId={activeCourseId}
          onClose={() => setShowComposer(false)}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/** Facebook-style full interactive summary card */
function SummaryCard({
  summary,
  courseId,
}: {
  summary: Summary;
  courseId: string;
}) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const images = parseImages(summary.images)
    .map(resolveMediaUrl)
    .filter(Boolean);
  const rawVideoUrl = summary.videoUrl
    ? resolveMediaUrl(summary.videoUrl)
    : null;

  const [expandedComments, setExpandedComments] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [inlineReplyContent, setInlineReplyContent] = useState("");
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reactions query (only when mounted, shared cache)
  const { data: reactionData } = useQuery({
    queryKey: ["reactions", "SUMMARY", summary.id],
    queryFn: () => reactionsApi.getReactionSummary("SUMMARY", summary.id),
    staleTime: 30_000,
  });

  // ── Comments query (lazy – only when expanded)
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ["summaryDetail", summary.id],
    queryFn: () => summariesApi.getSummaryDetail(summary.id),
    enabled: expandedComments,
    staleTime: 20_000,
  });

  const reactMutation = useMutation({
    mutationFn: (type: string) =>
      reactionsApi.react({ targetType: "SUMMARY", targetId: summary.id, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", "SUMMARY", summary.id],
      });
    },
  });

  const unreactMutation = useMutation({
    mutationFn: () => reactionsApi.unreact("SUMMARY", summary.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", "SUMMARY", summary.id],
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (payload: { content: string; parentId?: string }) =>
      summariesApi.addComment(summary.id, payload),
    onSuccess: () => {
      setCommentContent("");
      setReplyingTo(null);
      setInlineReplyContent("");
      queryClient.invalidateQueries({
        queryKey: ["summaryDetail", summary.id],
      });
      queryClient.invalidateQueries({ queryKey: ["summaries", courseId] });
      toast.success("تم نشر تعليقك بنجاح ✓");
    },
    onError: () => {
      toast.error("تعذر إرسال التعليق");
    },
  });

  const handleReactionClick = (type: string) => {
    clearTimeout(closeTimeoutRef.current!);
    setShowReactionMenu(false);
    if (reactionData?.currentUserReaction === type) {
      unreactMutation.mutate();
    } else {
      reactMutation.mutate(type);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/courses/${courseId}/summaries/${summary.id}`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط!");
  };

  // ── Hover logic: open after 300ms, close after 150ms gap
  const handleLikeMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    reactionTimeoutRef.current = setTimeout(
      () => setShowReactionMenu(true),
      300
    );
  };
  const handleLikeMouseLeave = () => {
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setShowReactionMenu(false), 150);
  };
  const handlePickerMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
  };
  const handlePickerMouseLeave = () => {
    setShowReactionMenu(false);
  };

  const currentReaction = reactionData?.currentUserReaction;
  const reactionSummary = reactionData?.summary || {};
  const totalReactions = Object.values(reactionSummary).reduce(
    (a, b) => a + b,
    0
  );
  const activeReactionMeta = REACTION_EMOJIS.find(
    (r) => r.key === currentReaction
  );
  const comments = (commentsData?.comments || []) as SummaryComment[];
  const userAvatar = getCurrentUserAvatar(currentUser);
  const userName =
    (currentUser as any)?.studentProfile?.fullName ||
    (currentUser as any)?.teacherProfile?.fullName ||
    (currentUser as any)?.name ||
    "أنت";

  return (
    <article className="rounded-3xl border border-surface-border bg-surface-card shadow-card transition-all overflow-hidden">
      {/* ─── 1. Header: Avatar + Name + Grade + Time ──────────────── */}
      <div className="p-5 sm:p-6 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              {summary.studentPhoto ? (
                <img
                  src={resolveMediaUrl(summary.studentPhoto)}
                  alt={summary.studentName}
                  className="h-12 w-12 rounded-full border-2 border-surface-border object-cover shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 border-2 border-gold-500/30 text-base font-bold text-gold-400 shadow-sm">
                  {summary.studentName?.charAt(0) || "ط"}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold text-ivory leading-tight">
                  {summary.studentName}
                </span>
                {summary.studentGradeLevel && (
                  <span className="rounded-md border border-gold-500/30 bg-[var(--primary)] px-2 py-0.5 text-[11px] font-bold text-white">
                    {formatGradeLevel(summary.studentGradeLevel)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                <span>{formatDate(summary.createdAt)}</span>
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ملخص معتمد
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-surface-border mx-5 sm:mx-6" />

      {/* ─── 2. Title + Description ───────────────────────────────── */}
      <div className="px-5 sm:px-6 py-4 space-y-2">
        <Link
          to={`/courses/${courseId}/summaries/${summary.id}`}
          className="group block"
        >
          <h2 className="text-lg sm:text-xl font-black text-[var(--primary)] group-hover:text-gold-200 transition-colors leading-snug">
            {summary.title}
          </h2>
        </Link>
        <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-zinc-500 font-normal">
          {summary.description}
        </p>
      </div>

      {/* ─── 3. Media: Video + Images ─────────────────────────────── */}
      {(rawVideoUrl || images.length > 0) && (
        <div className="relative border-t border-b border-surface-border bg-surface-card p-3 sm:p-4 flex flex-col items-center gap-3">
          {rawVideoUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg border border-surface-border">
              <VideoPlayer
                sources={[{ url: rawVideoUrl }]}
                title={summary.title}
                className="h-full w-full"
              />
            </div>
          )}

          {images.length > 0 && (
            <div
              className={`grid gap-2.5 w-full ${
                images.length > 1 ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {images.map((img, idx) => (
                <Link
                  key={idx}
                  to={`/courses/${courseId}/summaries/${summary.id}`}
                  className="overflow-hidden rounded-2xl border border-surface-border bg-black/20 group cursor-pointer"
                >
                  <img
                    src={img}
                    alt="صورة مرفقة"
                    className="w-full max-h-72 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 4. Stats Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-2.5 text-xs text-ivory-muted border-b border-surface-border">
        <div className="flex items-center gap-1.5">
          {totalReactions > 0 ? (
            <>
              <div className="flex -space-x-1 space-x-reverse">
                {reactionSummary.LOVE ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] ring-2 ring-surface-card">
                    ❤️
                  </span>
                ) : null}
                {reactionSummary.LIKE ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] ring-2 ring-surface-card">
                    👍
                  </span>
                ) : null}
                {reactionSummary.HAHA ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] ring-2 ring-surface-card">
                    😂
                  </span>
                ) : null}
              </div>
              <span className="font-bold text-ivory mr-1">
                {totalReactions} تفاعل
              </span>
            </>
          ) : (
            <span>كن أول من يتفاعل</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setExpandedComments(!expandedComments);
          }}
          className="hover:text-gold-300 transition-colors font-bold"
        >
          {summary.commentsCount || 0} تعليقات
        </button>
      </div>

      {/* ─── 5. Action Bar: Like / Comment / Share ────────────────── */}
      <div className="relative px-3 sm:px-4 py-1 flex items-center justify-between">
        {/* Reaction picker popup */}
        {showReactionMenu && (
          <div
            className="absolute bottom-full right-4 mb-2 flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card p-2 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={handlePickerMouseEnter}
            onMouseLeave={handlePickerMouseLeave}
          >
            {REACTION_EMOJIS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => handleReactionClick(r.key)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-all duration-150 hover:scale-125 hover:bg-white/10",
                  currentReaction === r.key && "bg-white/10 scale-110"
                )}
                title={r.label}
              >
                <span className="text-xl leading-none">{r.emoji}</span>
                <span className="text-[9px] font-bold text-ivory-muted leading-none">
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Like Button */}
        <button
          type="button"
          onMouseEnter={handleLikeMouseEnter}
          onMouseLeave={handleLikeMouseLeave}
          onClick={() => handleReactionClick("LIKE")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all hover:bg-gold-500/10",
            activeReactionMeta
              ? activeReactionMeta.color
              : "text-ivory-muted hover:text-ivory"
          )}
        >
          {activeReactionMeta ? (
            <>
              <span className="text-base">{activeReactionMeta.emoji}</span>
              <span>{activeReactionMeta.label}</span>
            </>
          ) : (
            <>
              <ThumbsUp className="h-4 w-4" />
              <span>إعجاب</span>
            </>
          )}
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => {
            setExpandedComments(true);
            setTimeout(() => commentInputRef.current?.focus(), 150);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-ivory-muted hover:text-ivory hover:bg-gold-500/10 transition-all"
        >
          <MessageCircle className="h-4 w-4 text-gold-400" />
          <span>تعليق</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-ivory-muted hover:text-ivory hover:bg-gold-500/10 transition-all"
        >
          <Share2 className="h-4 w-4 text-sky-400" />
          <span>مشاركة</span>
        </button>

        {/* Detail Link */}
        <Link
          to={`/courses/${courseId}/summaries/${summary.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-ivory-muted hover:text-gold-300 hover:bg-gold-500/10 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          <span>التفاصيل</span>
        </Link>
      </div>

      {/* ─── 6. Inline Comments Section ───────────────────────────── */}
      {expandedComments && (
        <div className="border-t border-surface-border bg-bg-elevated/30 p-4 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-ivory-muted uppercase tracking-wider">
              التعليقات ({comments.length})
            </h4>
            <button
              type="button"
              onClick={() => setExpandedComments(false)}
              className="rounded-lg p-1 text-ivory-muted hover:text-ivory hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Comments list */}
          {isLoadingComments ? (
            <div className="py-5 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-400" />
              <p className="mt-2 text-xs text-ivory-muted">
                جاري تحميل التعليقات...
              </p>
            </div>
          ) : comments.length === 0 ? (
            <p className="py-4 text-center text-xs text-ivory-muted">
              لا توجد تعليقات بعد. كن أول من يعلّق!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentBubble
                  key={comment.id}
                  comment={comment}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  inlineReplyContent={inlineReplyContent}
                  setInlineReplyContent={setInlineReplyContent}
                  onSubmitReply={(parentId) => {
                    if (!inlineReplyContent.trim()) return;
                    commentMutation.mutate({
                      content: inlineReplyContent.trim(),
                      parentId,
                    });
                  }}
                  isPending={commentMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* New comment input */}
          <div className="flex items-start gap-3 pt-2 border-t border-surface-border">
            {userAvatar ? (
              <img
                src={resolveMediaUrl(userAvatar)}
                alt={userName}
                className="h-9 w-9 shrink-0 rounded-full border-2 border-surface-border object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/15 border-2 border-gold-500/30 text-xs font-bold text-gold-400">
                {userName?.charAt(0) || "أ"}
              </div>
            )}
            <div className="flex-1 relative">
              <textarea
                ref={commentInputRef}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (commentContent.trim()) {
                      commentMutation.mutate({
                        content: commentContent.trim(),
                      });
                    }
                  }
                }}
                placeholder="اكتب تعليقاً... (Enter للإرسال)"
                rows={1}
                className="w-full resize-none rounded-2xl border border-surface-border bg-surface px-4 py-2.5 text-sm text-ivory placeholder:text-ivory-muted/60 outline-none focus:border-gold-400/60 transition pr-12"
              />
              <button
                type="button"
                disabled={!commentContent.trim() || commentMutation.isPending}
                onClick={() => {
                  if (commentContent.trim()) {
                    commentMutation.mutate({ content: commentContent.trim() });
                  }
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl bg-gold-gradient text-bg disabled:opacity-40 transition active:scale-95 shadow"
              >
                {commentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/* ─── Comment Bubble with nested reply ───────────────── */
function CommentBubble({
  comment,
  replyingTo,
  setReplyingTo,
  inlineReplyContent,
  setInlineReplyContent,
  onSubmitReply,
  isPending,
}: {
  comment: SummaryComment;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  inlineReplyContent: string;
  setInlineReplyContent: (v: string) => void;
  onSubmitReply: (parentId: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {comment.authorPhoto ? (
          <img
            src={resolveMediaUrl(comment.authorPhoto)}
            alt={comment.authorName}
            className="h-8 w-8 shrink-0 rounded-full border border-surface-border object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/15 border border-gold-500/30 text-xs font-bold text-gold-400">
            {comment.authorName?.charAt(0) || "؟"}
          </div>
        )}
        <div className="flex-1">
          <div className="rounded-2xl rounded-tr-sm bg-surface px-4 py-2.5 border border-surface-border">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[14px] font-black text-[var(--primary)] leading-tight"
                style={{ fontFamily: "Tajawal" }}
              >
                {comment.authorName}
              </span>
              {comment.isTeacher && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] text-white border border-gold-500/30 px-2 py-0.5 text-[10px] font-bold ">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  مدرس
                </span>
              )}
            </div>
            <p className="text-[14px] text-black/80 " style={{fontFamily: "Tajawal"}}>
            {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[11px] text-ivory-muted">
              {formatDate(comment.createdAt)}
            </span>
            <button
              type="button"
              onClick={() =>
                setReplyingTo(replyingTo === comment.id ? null : comment.id)
              }
              className="text-[11px] font-bold text-ivory-muted hover:text-gold-300 transition-colors"
            >
              رد
            </button>
          </div>

          {/* Inline reply box */}
          {replyingTo === comment.id && (
            <div className="flex items-center gap-2 mt-2 pr-1">
              <CornerDownLeft className="h-3.5 w-3.5 text-gold-400 shrink-0" />
              <input
                autoFocus
                value={inlineReplyContent}
                onChange={(e) => setInlineReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmitReply(comment.id);
                  }
                  if (e.key === "Escape") setReplyingTo(null);
                }}
                placeholder={`رد على ${comment.authorName}...`}
                className="flex-1 rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs text-ivory placeholder:text-ivory-muted/60 outline-none focus:border-gold-400/60 transition"
              />
              <button
                type="button"
                disabled={!inlineReplyContent.trim() || isPending}
                onClick={() => onSubmitReply(comment.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-bg disabled:opacity-40 transition active:scale-95"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.children && comment.children.length > 0 && (
        <div className="mr-8 space-y-2 border-r-2 border-gold-500/20 pr-3">
          {comment.children.map((child) => (
            <div key={child.id} className="flex items-start gap-2">
              {child.authorPhoto ? (
                <img
                  src={resolveMediaUrl(child.authorPhoto)}
                  alt={child.authorName}
                  className="h-7 w-7 shrink-0 rounded-full border border-surface-border object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-bold text-gold-400">
                  {child.authorName?.charAt(0) || "؟"}
                </div>
              )}
              <div className="flex-1">
                <div className="rounded-2xl rounded-tr-sm bg-surface/70 px-3.5 py-2 border border-surface-border">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-extrabold text-[var(--primary)] " style={{fontFamily: "Tajawal"}}>
                      {child.authorName}
                    </span>
                    {child.isTeacher && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 px-1.5 py-px text-[9px] font-bold text-gold-300">
                        <ShieldCheck className="h-2 w-2" />
                        مدرس
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-black/80 " style={{fontFamily: "Tajawal"}}>
                    {child.content}
                  </p>
                </div>
                <span className="mt-0.5 block px-1 text-[10px] text-ivory-muted">
                  {formatDate(child.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
