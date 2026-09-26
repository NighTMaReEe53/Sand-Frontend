import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2, Pencil, Trash2, CheckCircle2, MessageSquareHeart } from 'lucide-react';
import { reviewsApi, CourseReviewItem } from '../../api/phase2-teacher.api';
import { useAuthStore } from '../../store/authStore';
import { useGsapFadeUp } from '../../lib/useGsapReveal';
import { Button } from '../ui/Button';
import { HeadingAccent } from '../ui/HeadingAccent';

const Stars: React.FC<{ value: number; onChange?: (v: number) => void; size?: string }> = ({
  value,
  onChange,
  size = 'w-4 h-4',
}) => (
  <span className="inline-flex items-center gap-0.5" dir="ltr">
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type="button"
        disabled={!onChange}
        onClick={() => onChange?.(i)}
        className={onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
      >
        <Star
          className={`${size} ${i <= value ? 'fill-gold-400 text-gold-400' : 'text-surface-border'}`}
        />
      </button>
    ))}
  </span>
);

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
};

export const CourseReviewsSection: React.FC<{
  courseId: string;
  isEnrolled?: boolean;
}> = ({ courseId, isEnrolled }) => {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const isTeacher = role === 'TEACHER' || role === 'ADMIN';
  const canReview = Boolean(isEnrolled) && role === 'STUDENT';

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sectionRef = useGsapFadeUp<HTMLElement>([courseId]);

  const { data, isLoading } = useQuery({
    queryKey: ['course-reviews', courseId, page],
    queryFn: () => reviewsApi.getCourseReviews(courseId, page),
    enabled: !!courseId,
  });

  // The student's existing vote — one per course (update/delete, never re-add)
  const { data: myReviewsData, isLoading: isLoadingMine } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewsApi.getMyReviews(),
    enabled: canReview,
  });
  const myReview = myReviewsData?.reviews.find((r) => r.courseId === courseId);

  // Pre-fill the form with the existing vote
  useEffect(() => {
    if (myReview) {
      setMyRating(myReview.rating);
      setMyComment(myReview.comment ?? '');
      setEditing(false);
    }
  }, [myReview]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await reviewsApi.upsertReview(courseId, {
        rating: myRating,
        comment: myComment.trim() || undefined,
      });
      setMessage(myReview ? 'تم تحديث تقييمك بنجاح.' : 'شكراً لك! تم حفظ تقييمك.');
      setEditing(false);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    } catch (err) {
      setMessage(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'تعذر حفظ التقييم.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('هل تريد حذف تقييمك لهذا الكورس؟')) return;
    setDeleting(true);
    try {
      await reviewsApi.deleteReview(courseId);
      setMyRating(5);
      setMyComment('');
      setMessage('تم حذف تقييمك.');
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    } catch {
      setMessage('تعذر حذف التقييم.');
    } finally {
      setDeleting(false);
    }
  };

  const handleModerate = async (r: CourseReviewItem) => {
    if (!window.confirm('إخفاء هذا التقييم؟')) return;
    await reviewsApi.moderate(r.id, true);
    invalidate();
  };

  return (
    <section ref={sectionRef} id="reviews-section" className="mt-10 space-y-6 text-right">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-display text-gold-300 flex items-center gap-2">
            <MessageSquareHeart className="w-6 h-6 text-gold-400" />
            تقييمات الطلاب
          </h2>
          <HeadingAccent variant="wave" className="w-24" />
        </div>

        {data && data.averageRating !== null && (
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-bg-elevated border border-surface-border">
            <span className="text-3xl font-bold font-display text-gold-300 tabular-nums leading-none">
              {data.averageRating}
            </span>
            <div className="space-y-0.5">
              <Stars value={Math.round(data.averageRating)} />
              <p className="text-[11px] text-ivory-muted">({data.totalReviews} تقييم)</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── My vote: view / update / delete ────────────────────── */}
      {canReview && (
        <>
          {isLoadingMine ? (
            <div className="flex justify-center py-5">
              <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
            </div>
          ) : myReview && !editing ? (
            /* Existing vote — read-only card with update/delete actions */
            <div className="p-5 rounded-2xl bg-bg-elevated border border-gold-500/25 space-y-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-bold text-ivory">تقييمك لهذا الكورس</p>
                  <Stars value={myReview.rating} size="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMyRating(myReview.rating);
                      setMyComment(myReview.comment ?? '');
                      setEditing(true);
                      setMessage(null);
                    }}
                    leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  >
                    تعديل تقييمي
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDelete}
                    isLoading={deleting}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                    className="text-red-400"
                  >
                    حذف
                  </Button>
                </div>
              </div>
              {myReview.comment && (
                <p className="text-xs text-ivory-muted leading-relaxed">{myReview.comment}</p>
              )}
              <p className="text-[10px] text-ivory-muted/70">
                يمكنك تعديل تقييمك أو حذفه في أي وقت — لا يمكن إضافة أكثر من تقييم واحد.
              </p>
            </div>
          ) : (
            /* Fresh vote OR edit mode */
            <form onSubmit={handleSave} className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-3">
              <p className="text-sm font-bold font-display text-gold-300 flex items-center gap-2">
                {myReview ? 'تعديل تقييمك' : 'قيّم هذا الكورس'}
              </p>
              <Stars value={myRating} onChange={setMyRating} size="w-6 h-6" />
              <textarea
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                rows={2}
                placeholder="شاركنا رأيك في الكورس (اختياري)..."
                className="w-full bg-bg-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-ivory placeholder-ivory-muted/50 focus:border-gold-500 outline-none resize-none text-right"
              />
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {message && <span className="text-[11px] text-gold-300">{message}</span>}
                <div className="flex items-center gap-2 mr-auto">
                  {myReview && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(false);
                        setMyRating(myReview.rating);
                        setMyComment(myReview.comment ?? '');
                        setMessage(null);
                      }}
                    >
                      إلغاء
                    </Button>
                  )}
                  <Button type="submit" size="sm" isLoading={saving}>
                    {myReview ? 'حفظ التعديلات' : 'إرسال التقييم'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </>
      )}

      {/* ─── Reviews list ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
        </div>
      ) : !data || data.reviews.length === 0 ? (
        <p className="text-xs text-ivory-muted text-center py-6">
          لا توجد تقييمات بعد. كن أول من يقيّم!
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.reviews.map((r) => (
              <li key={r.id} className="p-4 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/30 transition-colors space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold-gradient p-0.5 shrink-0">
                      <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[11px] font-bold text-gold-300">
                        {r.studentName[0]}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ivory">{r.studentName}</p>
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} size="w-3 h-3" />
                        <span className="text-[10px] text-ivory-muted/70">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {isTeacher && (
                    <Button size="sm" variant="ghost" onClick={() => handleModerate(r)}>
                      إخفاء
                    </Button>
                  )}
                </div>
                {r.comment && <p className="text-xs text-ivory-muted leading-relaxed">{r.comment}</p>}
              </li>
            ))}
          </ul>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                السابق
              </Button>
              <span className="text-[11px] text-ivory-muted">
                صفحة {data.pagination.page} من {data.pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};
