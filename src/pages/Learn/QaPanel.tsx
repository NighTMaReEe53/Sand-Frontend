import React, { useCallback, useEffect, useState } from 'react';
import {
  Pin,
  CheckCircle2,
  Trash2,
  Loader2,
  Reply,
} from 'lucide-react';
import { qaApi, QaQuestion } from '../../api/qa.api';
import { useAuthStore } from '../../store/authStore';
import { useCourseVideoQuery } from '../../hooks/queries/useVideos';
import { VideoPlayer } from '../../components/video/VideoPlayer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface QaPanelProps {
  lessonId: string;
  /** Optional course context — enables the teacher's custom course video */
  courseId?: string;
}

export const QaPanel: React.FC<QaPanelProps> = ({ lessonId, courseId }) => {
  const role = useAuthStore((state) => state.user?.role);
  const isTeacher = role === 'TEACHER' || role === 'ADMIN';

  // الفيديو المخصص للكورس من الأستاذ — يظهر فوق الأسئلة
  const { data: courseVideoData } = useCourseVideoQuery(courseId);
  const customVideo = courseVideoData?.video ?? null;

  const [questions, setQuestions] = useState<QaQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyVideoUrl, setReplyVideoUrl] = useState('');
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);

  const loadQuestions = useCallback(async () => {
    try {
      const res = await qaApi.listQuestions(lessonId, { onlyUnanswered: onlyUnanswered || undefined });
      setQuestions(res.questions);
      setError(null);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'تعذر تحميل الأسئلة.'
      );
      setQuestions([]);
    }
  }, [lessonId, onlyUnanswered]);

  useEffect(() => {
    setQuestions(null);
    loadQuestions();
  }, [loadQuestions]);

  const handleAsk = async () => {
    if (!newQuestion.trim() || asking) return;
    setAsking(true);
    try {
      await qaApi.createQuestion(lessonId, newQuestion.trim());
      setNewQuestion('');
      loadQuestions();
    } catch {
      setError('تعذر إرسال السؤال.');
    } finally {
      setAsking(false);
    }
  };

  const handleReply = async (questionId: string) => {
    if (!replyContent.trim()) return;
    try {
      await qaApi.addAnswer(
        questionId,
        replyContent.trim(),
        isTeacher && replyVideoUrl.trim() ? replyVideoUrl.trim() : undefined
      );
      setReplyTo(null);
      setReplyContent('');
      setReplyVideoUrl('');
      loadQuestions();
    } catch {
      setError('تعذر إرسال الرد.');
    }
  };

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
      {/* No inner header here — the AccordionSection already shows
          "أسئلة وأجوبة الدرس"; rendering it twice duplicated the title */}
      <div className="p-4 space-y-4">
        {isTeacher && questions !== null && questions.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOnlyUnanswered((v) => !v)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                onlyUnanswered
                  ? 'border-gold-400 text-gold-300'
                  : 'border-surface-border text-ivory-muted'
              }`}
            >
              غير المجاب فقط
            </button>
          </div>
        )}
        {error && <p className="text-[11px] text-red-400">{error}</p>}

        {/* الفيديو المخصص للأستاذ لهذا الكورس */}
        {customVideo && (
          <div className="space-y-1.5">
            <VideoPlayer
              sources={[{ url: customVideo.videoUrl, label: 'المصدر' }]}
              title={customVideo.title ?? 'فيديو الأستاذ'}
            />
          </div>
        )}

        {/* Ask form — students only */}
        {role === 'STUDENT' && (
          <div className="space-y-2">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="عندك سؤال عن هذا الدرس؟ اكتبه هنا..."
              rows={2}
              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-xs text-ivory placeholder-ivory-muted/50 focus:border-gold-500 outline-none resize-none text-right"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAsk} isLoading={asking} disabled={!newQuestion.trim()}>
                إرسال السؤال
              </Button>
            </div>
          </div>
        )}

        {/* Questions list */}
        {questions === null ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
          </div>
        ) : questions.length === 0 ? (
          <p className="text-center text-[11px] text-ivory-muted py-4">
            لا توجد أسئلة بعد.
          </p>
        ) : (
          <ul className="space-y-3 max-h-[28rem] overflow-y-auto">
            {questions.map((q) => (
              <li key={q.id} className="space-y-2">
                <div
                  className={`p-3 rounded-xl border space-y-1.5 ${
                    q.isPinned
                      ? 'border-gold-500/50 bg-gold-500/5'
                      : 'border-surface-border bg-surface'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-xs font-bold text-ivory leading-relaxed">{q.content}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {q.isPinned && (
                        <Badge variant="gold">
                          <Pin className="w-2.5 h-2.5 ml-0.5" />
                          مثبت
                        </Badge>
                      )}
                      {q.isAnswered && (
                        <Badge variant="success">
                          <CheckCircle2 className="w-2.5 h-2.5 ml-0.5" />
                          تمت الإجابة
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-ivory-muted/70">{q.studentName}</span>
                    <div className="flex items-center gap-1.5">
                      {(isTeacher || q.isOwn) && (
                        <>
                          {isTeacher && (
                            <button
                              type="button"
                              onClick={async () => {
                                await qaApi.togglePin(q.id);
                                loadQuestions();
                              }}
                              className={`p-1 rounded transition-colors ${
                                q.isPinned ? 'text-gold-400' : 'text-ivory-muted hover:text-gold-400'
                              }`}
                              title={q.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('حذف هذا السؤال؟')) return;
                              await qaApi.deleteQuestion(q.id);
                              loadQuestions();
                            }}
                            className="p-1 rounded text-ivory-muted hover:text-red-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(replyTo === q.id ? null : q.id);
                          setReplyContent('');
                          setReplyVideoUrl('');
                        }}
                        className="flex items-center gap-1 text-[10px] text-gold-400 hover:text-gold-300"
                      >
                        <Reply className="w-3 h-3" />
                        رد
                      </button>
                    </div>
                  </div>

                  {/* Answers */}
                  {q.answers.length > 0 && (
                    <ul className="space-y-1.5 pt-2 pr-4 border-r border-surface-border">
                      {q.answers.map((a) => {
                        return (
                          <li key={a.id} className="space-y-1.5">
                            <p
                              className={`text-[11px] leading-relaxed ${
                                a.isTeacherReply ? 'text-emerald-300' : 'text-ivory-muted'
                              }`}
                            >
                              {a.isTeacherReply && (
                                <span className="font-bold">الأستاذ: </span>
                              )}
                              {a.content}
                            </p>
                            {a.videoUrl && (
                              <div className="max-w-md">
                                <VideoPlayer
                                  sources={[{ url: a.videoUrl }]}
                                  title="رد الفيديو"
                                  onError={() =>
                                    setError('تعذر تشغيل فيديو الرد، تحقق من الرابط.')
                                  }
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Reply box */}
                  {replyTo === q.id && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                        placeholder="اكتب ردك..."
                        className="w-full bg-bg border border-surface-border rounded-lg px-2 py-1.5 text-xs text-ivory focus:border-gold-500 outline-none resize-none text-right"
                      />
                      {isTeacher && (
                        <input
                          type="url"
                          value={replyVideoUrl}
                          onChange={(e) => setReplyVideoUrl(e.target.value)}
                          placeholder="رابط فيديو الرد (اختياري - يوتيوب أو رابط مباشر)"
                          dir="ltr"
                          className="w-full bg-bg border border-surface-border rounded-lg px-2 py-1.5 text-xs text-ivory placeholder-ivory-muted/50 focus:border-gold-500 outline-none text-left"
                        />
                      )}
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleReply(q.id)}
                          disabled={!replyContent.trim()}
                        >
                          إرسال الرد
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
