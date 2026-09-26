import React, { useCallback, useState } from 'react';
import { ClipboardList, Plus, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { ENDPOINTS } from '../../api/endpoints';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface TeacherQuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string | null;
  marks: number;
}

interface TeacherQuiz {
  id: string;
  lessonId: string;
  title: string;
  passingPercentage: number;
  timeLimitMinutes: number | null;
  maxAttempts: number;
  isPublished: boolean;
  questions: TeacherQuizQuestion[];
  _count?: { attempts: number };
}

interface QuizManagerModalProps {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
}

interface QuestionDraft {
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
}

const emptyQuestion = (): QuestionDraft => ({
  text: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  explanation: '',
  marks: 1,
});

export const QuizManagerModal: React.FC<QuizManagerModalProps> = ({
  lessonId,
  lessonTitle,
  onClose,
}) => {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>('');
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    try {
      const res = await axiosInstance.get<{ quizzes: TeacherQuiz[] }>(
        ENDPOINTS.QUIZZES.TEACHER_LESSON_QUIZZES(lessonId)
      );
      setQuizzes(res.data.quizzes);
    } catch {
      setError('تعذر تحميل الكويزات.');
      setQuizzes([]);
    }
  }, [lessonId]);

  React.useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validQuestions = draftQuestions.filter((q) => q.text.trim() && q.options.filter((o) => o.trim()).length >= 2);
    if (validQuestions.length === 0) {
      setError('أضف سؤالاً واحداً على الأقل مع خيارين على الأقل.');
      return;
    }
    for (const q of validQuestions) {
      if (q.correctOptionIndex >= q.options.filter((o) => o.trim()).length) {
        setError('تأكد من اختيار الإجابة الصحيحة ضمن الخيارات المعبأة.');
        return;
      }
    }

    setSaving(true);
    try {
      // Create the quiz with all questions in one atomic request — creating
      // the quiz first and adding questions separately could leave a published
      // empty quiz if any step failed midway.
      await axiosInstance.post(ENDPOINTS.QUIZZES.CREATE(lessonId), {
        title: quizTitle.trim(),
        passingPercentage,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
        isPublished: true,
        questions: validQuestions.map((q, idx) => {
          const filledOptions = q.options.map((o) => o.trim()).filter(Boolean);
          return {
            text: q.text.trim(),
            options: filledOptions,
            correctOptionIndex: Math.min(q.correctOptionIndex, filledOptions.length - 1),
            explanation: q.explanation.trim() || undefined,
            marks: q.marks || 1,
            orderIndex: idx + 1,
          };
        }),
      });

      setCreating(false);
      setQuizTitle('');
      setDraftQuestions([emptyQuestion()]);
      loadQuizzes();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'تعذر إنشاء الكويز.'
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (quiz: TeacherQuiz) => {
    await axiosInstance.patch(ENDPOINTS.QUIZZES.UPDATE(quiz.id), {
      isPublished: !quiz.isPublished,
    });
    loadQuizzes();
  };

  const deleteQuiz = async (quizId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكويز؟')) return;
    await axiosInstance.delete(ENDPOINTS.QUIZZES.DELETE(quizId));
    loadQuizzes();
  };

  const updateDraft = (idx: number, patch: Partial<QuestionDraft>) =>
    setDraftQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

  return (
    <Modal isOpen onClose={onClose} title={`كويزات الدرس: ${lessonTitle}`}>
      <div className="space-y-4 text-right max-h-[70vh] overflow-y-auto p-1">
        {error && (
          <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Existing quizzes */}
        {quizzes === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
          </div>
        ) : quizzes.length === 0 && !creating ? (
          <div className="p-8 rounded-xl bg-surface border border-surface-border text-center space-y-3">
            <ClipboardList className="w-10 h-10 mx-auto text-gold-500/30" />
            <p className="text-xs text-ivory-muted">لا يوجد كويز على هذا الدرس بعد.</p>
            <Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="w-4 h-4" />}>
              إنشاء كويز
            </Button>
          </div>
        ) : (
          !creating &&
          quizzes.map((quiz) => (
            <div key={quiz.id} className="p-4 rounded-xl bg-surface border border-surface-border space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gold-300">{quiz.title}</h4>
                  <p className="text-[11px] text-ivory-muted">
                    {quiz.questions.length} سؤال • النجاح عند {quiz.passingPercentage}%
                    {quiz.timeLimitMinutes ? ` • ${quiz.timeLimitMinutes} دقيقة` : ''}
                    {` • ${quiz._count?.attempts ?? 0} محاولة`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={quiz.isPublished ? 'secondary' : 'outline'}
                    onClick={() => togglePublish(quiz)}
                    leftIcon={
                      quiz.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                    }
                  >
                    {quiz.isPublished ? 'إلغاء النشر' : 'نشر'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => deleteQuiz(quiz.id)}
                    className="p-1.5 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="حذف الكويز"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <ul className="space-y-1.5 pr-2">
                {quiz.questions.map((qq, i) => (
                  <li key={qq.id} className="text-[11px] text-ivory-muted">
                    {i + 1}. {qq.text}{' '}
                    <span className="text-emerald-400/80">
                      ✓ {qq.options[qq.correctOptionIndex]}
                    </span>{' '}
                    ({qq.marks} درجة)
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        {/* Creation form */}
        {!creating && quizzes !== null && quizzes.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreating(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            كويز جديد
          </Button>
        )}

        {creating && (
          <form onSubmit={handleCreateQuiz} className="space-y-4 p-4 rounded-xl bg-surface border border-surface-border">
            <div className="grid sm:grid-cols-3 gap-3">
              <Input
                label="عنوان الكويز"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                required
              />
              <Input
                label="نسبة النجاح %"
                type="number"
                min={0}
                max={100}
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Number(e.target.value))}
              />
              <Input
                label="مدة (دقائق — اختياري)"
                type="number"
                min={1}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
              />
            </div>

            {draftQuestions.map((dq, qi) => (
              <div key={qi} className="p-3 rounded-xl bg-surface-card border border-surface-border space-y-2">
                <Input
                  label={`السؤال ${qi + 1}`}
                  value={dq.text}
                  onChange={(e) => updateDraft(qi, { text: e.target.value })}
                />
                <div className="grid sm:grid-cols-2 gap-2">
                  {dq.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2 text-xs">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={dq.correctOptionIndex === oi}
                        onChange={() => updateDraft(qi, { correctOptionIndex: oi })}
                        className="accent-gold-500"
                      />
                      <input
                        type="text"
                        placeholder={`الخيار ${String.fromCharCode(65 + oi)}`}
                        value={opt}
                        onChange={(e) =>
                          updateDraft(qi, {
                            options: dq.options.map((o, i) => (i === oi ? e.target.value : o)),
                          })
                        }
                        className="flex-1 bg-bg border border-surface-border rounded-lg px-2 py-1.5 text-xs text-ivory focus:border-gold-500 outline-none"
                      />
                    </label>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input
                    label="التوضيح (اختياري)"
                    value={dq.explanation}
                    onChange={(e) => updateDraft(qi, { explanation: e.target.value })}
                  />
                  <Input
                    label="الدرجة"
                    type="number"
                    min={1}
                    value={dq.marks}
                    onChange={(e) => updateDraft(qi, { marks: Number(e.target.value) })}
                  />
                </div>
                {draftQuestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDraftQuestions((prev) => prev.filter((_, i) => i !== qi))}
                    className="text-[11px] text-red-400 hover:underline"
                  >
                    حذف السؤال
                  </button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDraftQuestions((prev) => [...prev, emptyQuestion()])}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              إضافة سؤال
            </Button>

            <div className="flex items-center gap-2 justify-end pt-2 border-t border-surface-border">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
                إلغاء
              </Button>
              <Button type="submit" size="sm" isLoading={saving}>
                حفظ ونشر الكويز
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
