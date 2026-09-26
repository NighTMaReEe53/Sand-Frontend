import React, { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  courseQaApi,
  CourseQuestion,
  CourseQuestionDetail,
  QAReply,
} from "../../api/courseQa.api";
import { reactionsApi } from "../../api/reactions.api";
import { summariesApi } from "../../api/summaries.api";
import { useAuthStore } from "../../store/authStore";
import { CustomCourseSelect } from "../../components/ui/CustomCourseSelect";
import {
  Camera,
  MessageCircle,
  Send,
  Plus,
  X,
  ThumbsUp,
  Share2,
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  ZoomIn,
  ExternalLink,
  ShieldCheck,
  Loader2,
  BookOpen,
  Download,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  cn,
  resolveMediaUrl,
  parseImages,
  isVideoMedia,
  formatDate,
} from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { VideoPlayer } from "../../components/video/VideoPlayer";

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

/** Helper to get current user's profile image */
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

export function QAListPage() {
  const { courseId: paramCourseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

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
  const [filterMode, setFilterMode] = useState<
    "ALL" | "MINE" | "ANSWERED" | "OPEN"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);

  // Fetch Questions for this course
  const { data, isLoading } = useQuery({
    queryKey: ["courseQuestions", activeCourseId, page, filterMode],
    queryFn: ({ signal }) =>
      courseQaApi.listQuestions(
        activeCourseId!,
        {
          page,
          limit: 20,
          ...(filterMode === "MINE" ? { mine: true } : {}),
        },
        signal
      ),
    enabled: !!activeCourseId,
  });

  const createMutation = useMutation({
    mutationFn: (content: string) =>
      courseQaApi.createQuestion({
        courseId: activeCourseId!,
        content,
        imageUrl: imageUrl || undefined,
      }),
    onSuccess: () => {
      setNewQuestion("");
      setImageUrl("");
      setShowComposer(false);
      queryClient.invalidateQueries({
        queryKey: ["courseQuestions", activeCourseId],
      });
      toast.success("تم نشر سؤالك بنجاح في مجتمع الكورس");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join("، ")
          : message || "تعذر نشر السؤال، يرجى المحاولة لاحقاً"
      );
    },
  });

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await summariesApi.uploadCommunityMedia(file);
      setImageUrl(res.url);
      toast.success("تم رفع الصورة بنجاح");
    } catch {
      toast.error("تعذر رفع الصورة");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestion.trim().length < 5) {
      toast.error("يرجى كتابة سؤال واضح ومفصل");
      return;
    }
    createMutation.mutate(newQuestion.trim());
  };

  const rawQuestions = (data?.questions || []) as CourseQuestion[];

  const filteredQuestions = useMemo(() => {
    return rawQuestions.filter((q) => {
      if (filterMode === "ANSWERED" && q.status !== "ANSWERED") return false;
      if (filterMode === "OPEN" && q.status !== "OPEN") return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          q.content?.toLowerCase().includes(query) ||
          q.studentName?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [rawQuestions, filterMode, searchQuery]);

  const userAvatar = getCurrentUserAvatar(currentUser);

  return (
    <div
      className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 text-right"
      dir="rtl"
    >
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gold-400">
              <BookOpen className="h-4 w-4" />
              <span>مجتمع الكورس والمناقشات</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-amira text-gold-300">
              الأسئلة والأجوبة
            </h1>
            <p className="text-xs sm:text-sm text-ivory-muted">
              اطرح أسئلتك، ناقش الدروس مع زملائك، وتلقّ إجابات مباشرة من معلم
              المادة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowComposer(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover px-5 py-3 text-xs sm:text-sm font-bold text-bg shadow-gold-glow transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>اسأل سؤالاً جديداً</span>
          </button>
        </div>

        {/* Course Filter Bar */}
        <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-ivory-muted">
            <BookOpen className="w-4 h-4 text-gold-400" />
            <span>تصفح أسئلة ومناقشات الكورس:</span>
          </div>
          <CustomCourseSelect
            selectedCourseId={activeCourseId || null}
            onSelectCourse={(id) => {
              setSelectedCourseId(id);
              navigate(`/courses/${id}/qa`, { replace: true });
            }}
          />
        </div>

        {/* Quick Facebook-style "What's on your mind?" bar */}
        <div
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-3 rounded-2xl border border-surface-border bg-bg-elevated p-3 sm:p-4 cursor-pointer hover:border-gold-400 transition-all shadow-inner"
        >
          {userAvatar ? (
            <img
              src={resolveMediaUrl(userAvatar)}
              alt=""
              className="h-10 w-10 rounded-full border border-surface-border object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/20 text-gold-300 font-bold text-sm border border-gold-500/30">
              {currentUser?.email?.charAt(0).toUpperCase() || "أ"}
            </div>
          )}
          <span className="text-xs sm:text-sm text-ivory-muted font-medium flex-1">
            هل لديك استفسار أو جزء غير واضح في الدرس؟ اضغط هنا لكتابة سؤالك...
          </span>
          <Camera className="h-5 w-5 text-gold-400 shrink-0" />
        </div>
      </div>

      {/* ─── Search & Filter Toolbar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-card border border-surface-border shadow-card">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الأسئلة..."
            className="w-full rounded-xl border border-surface-border bg-bg-elevated py-2.5 pr-10 pl-4 text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none transition focus:border-gold-400"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-elevated border border-surface-border">
          {[
            { key: "ALL", label: "الكل" },
            { key: "MINE", label: "أسئلتي" },
            { key: "ANSWERED", label: "تم الرد" },
            { key: "OPEN", label: "بانتظار الرد" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setFilterMode(tab.key as any);
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
                filterMode === tab.key
                  ? "bg-gold-gradient text-white font-black shadow-gold-glow"
                  : "text-ivory/85 hover:text-white hover:bg-surface/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Questions Feed List ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-surface-border bg-surface-card p-6 space-y-4 animate-pulse shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-bg-elevated" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-bg-elevated rounded" />
                  <div className="h-3 w-20 bg-bg-elevated rounded" />
                </div>
              </div>
              <div className="h-16 bg-bg-elevated rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-3xl border border-surface-border bg-surface-card p-12 text-center space-y-4 shadow-card">
          <MessageCircle className="mx-auto h-12 w-12 text-gold-400" />
          <h3 className="text-lg font-bold font-amiri text-ivory">
            لا توجد أسئلة حالياً
          </h3>
          <p className="text-xs text-ivory-muted max-w-sm mx-auto">
            {searchQuery
              ? "لم نجد أي أسئلة تطابق بحثك."
              : "كن أول من يطرح سؤالاً في هذا الكورس وابدأ النقاش مع زملائك!"}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowComposer(true)}
          >
            طرح أول سؤال
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuestions.map((q) => (
            <FacebookQuestionCard
              key={q.id}
              question={q}
              courseId={activeCourseId!}
              currentUser={currentUser}
              onImageClick={(url) => setActiveLightbox(url)}
            />
          ))}
        </div>
      )}

      {/* ─── Pagination ──────────────────────────────────────────────── */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from(
            { length: data.pagination.totalPages },
            (_, i) => i + 1
          ).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "h-9 w-9 rounded-xl font-bold text-xs transition-all",
                p === page
                  ? "bg-gold-gradient text-bg shadow-gold-glow"
                  : "border border-surface-border bg-surface-card text-ivory hover:border-gold-400"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ─── Add Question Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        title="طرح سؤال جديد في الكورس"
        description="شارك استفسارك أو النقطة غير الواضحة وسيقوم المدرس أو زملاؤك بالإجابة."
        maxWidth="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 text-right"
          dir="rtl"
        >
          <div className="space-y-2">
            <label className="block text-xs font-bold text-ivory">
              تفاصيل السؤال أو المشكلة:
            </label>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="اكتب سؤالك بوضوح مع ذكر رقم الدرس أو النقطة غير المفهومة..."
              rows={5}
              className="w-full resize-none rounded-2xl border-2 border-surface-border bg-bg-elevated p-4 text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 shadow-inner"
              required
            />
          </div>

          {/* Attached image preview */}
          {imageUrl && (
            <div className="relative inline-block rounded-2xl border border-surface-border bg-black/40 p-2 shadow-card">
              <img
                src={resolveMediaUrl(imageUrl)}
                alt="معاينة الصورة"
                className="max-h-48 w-auto max-w-full object-contain rounded-xl"
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                title="إزالة الصورة"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border bg-bg-elevated px-4 py-2.5 text-xs font-bold text-ivory-muted hover:border-gold-400 hover:text-gold-300 transition-all">
              {uploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
                  <span>جاري رفع الصورة...</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 text-gold-400" />
                  <span>إرفاق صورة توضيحية</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handleImageUpload(e.target.files?.[0])}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowComposer(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={
                  newQuestion.trim().length < 5 ||
                  createMutation.isPending ||
                  uploadingImage
                }
                isLoading={createMutation.isPending}
                rightIcon={<Send className="h-4 w-4" />}
              >
                نشر السؤال
              </Button>
            </div>
          </div>
        </form>
      </Modal>

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

/** ─── Facebook Post Component for Feed Questions ─────────────────── */
function FacebookQuestionCard({
  question,
  courseId,
  currentUser,
  onImageClick,
}: {
  question: CourseQuestion;
  courseId: string;
  currentUser: any;
  onImageClick: (url: string) => void;
}) {
  const queryClient = useQueryClient();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [expandedReplies, setExpandedReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [inlineReplyContent, setInlineReplyContent] = useState("");
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const reactionOpenRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reactions for this question
  const { data: reactionData } = useQuery({
    queryKey: ["reactions", "QUESTION", question.id],
    queryFn: () => reactionsApi.getReactionSummary("QUESTION", question.id),
  });

  // Query question details (with all replies) when expanded
  const { data: questionDetail, isLoading: isLoadingReplies } = useQuery({
    queryKey: ["courseQuestion", question.id],
    queryFn: () => courseQaApi.getQuestion(question.id),
    enabled: expandedReplies,
  });

  const reactMutation = useMutation({
    mutationFn: (type: string) =>
      reactionsApi.react({
        targetType: "QUESTION",
        targetId: question.id,
        type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", "QUESTION", question.id],
      });
    },
  });

  const unreactMutation = useMutation({
    mutationFn: () => reactionsApi.unreact("QUESTION", question.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", "QUESTION", question.id],
      });
    },
  });

  // Add top-level or nested reply
  const addReplyMutation = useMutation({
    mutationFn: ({
      content,
      parentId,
    }: {
      content: string;
      parentId?: string;
    }) => courseQaApi.addReply(question.id, { content, parentId }),
    onSuccess: () => {
      setReplyContent("");
      setReplyingToId(null);
      setInlineReplyContent("");
      queryClient.invalidateQueries({
        queryKey: ["courseQuestion", question.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["courseQuestions", courseId],
      });
      toast.success("تم نشر ردك بنجاح");
    },
    onError: () => {
      toast.error("تعذر إرسال الرد، يرجى المحاولة لاحقاً");
    },
  });

  const handleReactionClick = (type: string) => {
    setShowReactionMenu(false);
    if (reactionData?.currentUserReaction === type) {
      unreactMutation.mutate();
    } else {
      reactMutation.mutate(type);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/courses/${courseId}/qa/${question.id}`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ رابط السؤال بنجاح!");
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

  const images = parseImages(question.imageUrl)
    .map(resolveMediaUrl)
    .filter(Boolean);
  const isVideo = question.imageUrl ? isVideoMedia(question.imageUrl) : false;
  const replies = (questionDetail?.replies || []) as QAReply[];
  const userAvatar = getCurrentUserAvatar(currentUser);

  return (
    <article className="rounded-3xl border border-surface-border bg-surface-card shadow-card transition-all overflow-hidden">
      {/* ─── Post Header ────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {question.studentPhoto ? (
              <img
                src={resolveMediaUrl(question.studentPhoto)}
                alt=""
                className="h-12 w-12 rounded-full border-2 border-surface-border object-cover shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 border-2 border-gold-500/30 text-base font-bold text-gold-400 shadow-sm">
                {question.studentName?.charAt(0) || "ط"}
              </div>
            )}

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
                <span>عام في مجتمع الكورس</span>
              </div>
            </div>
          </div>

          <div>
            {question.status === "OPEN" && (
              <Badge variant="warning" size="sm">
                <Clock className="h-3 w-3" />
                بانتظار الرد
              </Badge>
            )}
            {question.status === "ANSWERED" && (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="h-3 w-3" />
                تمت الإجابة
              </Badge>
            )}
            {question.status === "CLOSED" && (
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

      {/* ─── Question Text Body ──────────────────────────────────────── */}
      <div className="p-5 sm:p-6 py-4 space-y-4">
        <p className="text-base sm:text-lg leading-relaxed text-ivory font-normal whitespace-pre-line select-text">
          {question.content}
        </p>
      </div>

      {/* ─── Clean Media Showcase with Grid Canvas ───────────────── */}
      {question.imageUrl && (
        <div className="relative border-t border-b border-surface-border bg-surface-card bg-[radial-gradient(rgba(212,175,55,0.16)_1.5px,transparent_1.5px)] [background-size:18px_18px] p-2 sm:p-4 flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <div className="relative aspect-video w-full max-h-[500px] overflow-hidden rounded-2xl bg-black shadow-xl border border-surface-border/60">
              <VideoPlayer
                sources={[{ url: resolveMediaUrl(question.imageUrl) }]}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => onImageClick(img)}
                  className="relative group cursor-pointer overflow-hidden rounded-2xl border border-surface-border/60 bg-surface-card/40 shadow-lg transition-all duration-200 hover:border-gold-400/60 hover:shadow-xl max-w-full flex items-center justify-center"
                >
                  <img
                    src={img}
                    alt="مرفق السؤال"
                    className="max-h-[540px] w-auto max-w-full object-contain rounded-2xl transition-transform duration-200 group-hover:scale-[1.01]"
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

      {/* ─── Reactions & Comments Stats Bar ──────────────────────────── */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3 text-xs text-ivory-muted border-b border-surface-border">
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpandedReplies(!expandedReplies)}
            className="hover:text-gold-300 transition-colors font-bold"
          >
            {question.repliesCount || 0} ردود ومناقشات
          </button>
        </div>
      </div>

      {/* ─── Interactive Action Bar (Like / Comment / Share) ─────────── */}
      <div className="relative px-3 sm:px-4 py-1.5 flex items-center justify-between">
        {showReactionMenu && (
          <div
            className="absolute bottom-full right-4 mb-2 flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card p-2 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150"
            onMouseEnter={() => {
              // Cancel any pending close when mouse enters the picker
              if (reactionCloseRef.current)
                clearTimeout(reactionCloseRef.current);
              if (reactionOpenRef.current)
                clearTimeout(reactionOpenRef.current);
            }}
            onMouseLeave={() => {
              // Close immediately when leaving the picker (no gap)
              setShowReactionMenu(false);
            }}
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

        {/* Like button */}
        <button
          type="button"
          onMouseEnter={() => {
            // Cancel any pending close first
            if (reactionCloseRef.current)
              clearTimeout(reactionCloseRef.current);
            // Open picker after 300ms hold
            reactionOpenRef.current = setTimeout(
              () => setShowReactionMenu(true),
              300
            );
          }}
          onMouseLeave={() => {
            // Cancel pending open
            if (reactionOpenRef.current) clearTimeout(reactionOpenRef.current);
            // Start delayed close to allow cursor to reach picker
            reactionCloseRef.current = setTimeout(
              () => setShowReactionMenu(false),
              150
            );
          }}
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

        {/* Comment button */}
        <button
          type="button"
          onClick={() => {
            setExpandedReplies(true);
            setTimeout(() => commentInputRef.current?.focus(), 150);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-ivory-muted hover:text-ivory hover:bg-gold-500/10 transition-all"
        >
          <MessageCircle className="h-4 w-4 text-gold-400" />
          <span>تعليق ({question.repliesCount || 0})</span>
        </button>

        {/* Share button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold text-ivory-muted hover:text-ivory hover:bg-gold-500/10 transition-all"
        >
          <Share2 className="h-4 w-4 text-sky-400" />
          <span>مشاركة</span>
        </button>
      </div>

      {/* ─── Expandable Inline Comments Section ──────────────────────── */}
      {expandedReplies && (
        <div className="border-t border-surface-border bg-bg-elevated/20 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-ivory-muted uppercase tracking-wider">
              الردود والمناقشات ({replies.length})
            </h4>
            <Link
              to={`/courses/${courseId}/qa/${question.id}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-gold-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>عرض المحادثة الموسعة</span>
            </Link>
          </div>

          {/* Comments List (Recursive Tree) */}
          {isLoadingReplies ? (
            <div className="py-6 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold-400" />
              <p className="mt-2 text-xs text-ivory-muted">
                جاري تحميل الردود...
              </p>
            </div>
          ) : replies.length === 0 ? (
            <div className="py-6 text-center text-xs text-ivory-muted">
              لا توجد ردود حتى الآن. كن أول من يكتب رداً للمساعدة!
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <FeedCommentItem
                  key={reply.id}
                  reply={reply}
                  onReply={(parentId, content) =>
                    addReplyMutation.mutate({ content, parentId })
                  }
                  replyingToId={replyingToId}
                  setReplyingToId={setReplyingToId}
                  inlineContent={inlineReplyContent}
                  setInlineContent={setInlineReplyContent}
                  isSubmitting={addReplyMutation.isPending}
                  onImageClick={onImageClick}
                />
              ))}
            </div>
          )}

          {/* Master Quick Comment Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (replyContent.trim()) {
                addReplyMutation.mutate({ content: replyContent.trim() });
              }
            }}
            className="flex items-start gap-2.5 pt-3 border-t border-surface-border"
          >
            {userAvatar ? (
              <img
                src={resolveMediaUrl(userAvatar)}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full border border-surface-border object-cover mt-0.5"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-bg font-bold text-xs shadow-gold-glow mt-0.5">
                {currentUser?.email?.charAt(0).toUpperCase() || "أ"}
              </div>
            )}

            <div className="flex-1 relative">
              <textarea
                ref={commentInputRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="اكتب رداً أو تعليقاً..."
                rows={1}
                className="w-full resize-none rounded-2xl border border-surface-border bg-surface-card p-3 pl-10 text-xs sm:text-sm text-ivory placeholder:text-ivory-muted outline-none focus:border-gold-400 shadow-inner"
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || addReplyMutation.isPending}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400 hover:text-gold-300 disabled:opacity-30"
              >
                {addReplyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

/** ─── Comment Bubble with Nested Replies & Avatars ──────────────── */
function FeedCommentItem({
  reply,
  onReply,
  replyingToId,
  setReplyingToId,
  inlineContent,
  setInlineContent,
  isSubmitting,
  onImageClick,
}: {
  reply: QAReply;
  onReply: (parentId: string, content: string) => void;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  inlineContent: string;
  setInlineContent: (v: string) => void;
  isSubmitting: boolean;
  onImageClick: (url: string) => void;
}) {
  const queryClient = useQueryClient();
  const isTeacher = reply.isTeacher;
  const isReplyingThis = replyingToId === reply.id;

  const authorPhotoUrl = reply.authorPhoto
    ? resolveMediaUrl(reply.authorPhoto)
    : null;

  // ── Real reactions for this reply via API (QA_REPLY target type) ──
  const { data: reactionData } = useQuery({
    queryKey: ["reactions", "QA_REPLY", reply.id],
    queryFn: () => reactionsApi.getReactionSummary("QA_REPLY", reply.id),
    staleTime: 30 * 1000,
  });

  const myReaction = reactionData?.currentUserReaction ?? null;
  const likeCount = reactionData?.summary?.LIKE ?? 0;
  const loveCount = reactionData?.summary?.LOVE ?? 0;
  const totalReplyReactions = Object.values(reactionData?.summary ?? {}).reduce(
    (a, b) => a + b,
    0
  );

  const reactReplyMutation = useMutation({
    mutationFn: (type: string) =>
      reactionsApi.react({ targetType: "QA_REPLY", targetId: reply.id, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", "QA_REPLY", reply.id],
      });
    },
  });

  const unreactReplyMutation = useMutation({
    mutationFn: () => reactionsApi.unreact("QA_REPLY", reply.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reactions", "QA_REPLY", reply.id],
      });
    },
  });

  const handleCommentReaction = () => {
    if (reactReplyMutation.isPending || unreactReplyMutation.isPending) return;
    if (myReaction === "LIKE") {
      unreactReplyMutation.mutate();
    } else {
      reactReplyMutation.mutate("LIKE");
    }
  };

  return (
    <div className="flex items-start gap-3 text-right group/comment">
      {/* Avatar */}
      {authorPhotoUrl ? (
        <img
          src={authorPhotoUrl}
          alt=""
          className={cn(
            "h-9 w-9 shrink-0 rounded-full border object-cover shadow-sm mt-0.5",
            isTeacher
              ? "border-gold-400 ring-2 ring-gold-500/25"
              : "border-surface-border"
          )}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm mt-0.5",
            isTeacher
              ? "bg-gold-500/20 text-gold-300 border border-gold-500/40"
              : "bg-bg-elevated text-ivory border border-surface-border"
          )}
        >
          {reply.authorName?.charAt(0) || (isTeacher ? "م" : "ط")}
        </div>
      )}

      {/* Bubble + Actions */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <div
          className={cn(
            "inline-block max-w-full rounded-2xl p-3.5 sm:p-4 space-y-1.5 shadow-sm border",
            isTeacher
              ? "bg-surface-card border-gold-500/35 shadow-gold-glow/10"
              : "bg-bg-elevated border-surface-border"
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

          <p className="text-xs sm:text-sm text-ivory font-normal leading-relaxed whitespace-pre-line select-text">
            {reply.content}
          </p>

          {/* Attached image if any */}
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

        {/* Action Links */}
        <div className="flex items-center gap-4 text-[11px] font-bold text-ivory-muted pr-2">
          <span>{formatDate(reply.createdAt)}</span>

          {/* ── Real Like Button with count ─────────────────────── */}
          <button
            type="button"
            onClick={handleCommentReaction}
            disabled={
              reactReplyMutation.isPending || unreactReplyMutation.isPending
            }
            className={cn(
              "flex items-center gap-1 hover:underline transition-colors disabled:opacity-60",
              myReaction === "LIKE"
                ? "text-blue-400 font-bold"
                : myReaction === "LOVE"
                ? "text-red-400 font-bold"
                : "hover:text-ivory"
            )}
          >
            {myReaction === "LIKE" ? "👍" : myReaction === "LOVE" ? "❤️" : "👍"}
            <span>{myReaction ? "أعجبني" : "إعجاب"}</span>
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
                setReplyingToId(null);
                setInlineContent("");
              } else {
                setReplyingToId(reply.id);
                setInlineContent("");
              }
            }}
            className="hover:text-gold-300 hover:underline transition-colors"
          >
            {isReplyingThis ? "إلغاء" : "رد"}
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
                  onClick={() => setReplyingToId(null)}
                  className="rounded-lg px-3 py-1 text-xs font-bold text-ivory-muted hover:text-ivory"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!inlineContent.trim() || isSubmitting}
                  onClick={() => onReply(reply.id, inlineContent.trim())}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient hover:bg-gold-gradient-hover px-4 py-1 text-xs font-bold text-bg shadow-gold-glow transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  <span>إرسال</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nested Children Tree */}
        {reply.children && reply.children.length > 0 && (
          <div className="mt-3 mr-4 sm:mr-6 border-r-2 border-surface-border pr-3 sm:pr-4 space-y-3">
            {reply.children.map((child) => (
              <FeedCommentItem
                key={child.id}
                reply={child}
                onReply={onReply}
                replyingToId={replyingToId}
                setReplyingToId={setReplyingToId}
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

export default QAListPage;
