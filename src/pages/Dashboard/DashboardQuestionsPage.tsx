import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FileQuestion,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Award,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  Database,
  Search,
  CheckSquare,
  Square,
} from 'lucide-react';
import { questionBankApi } from '../../api/phase2.api';
import { useExamQuestionsQuery } from '../../hooks/queries/useExams';
import {
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} from '../../hooks/mutations/useExamMutations';
import { examsApi } from '../../api/exams.api';
import { ExamQuestionFull } from '../../types/exam.types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';

export const DashboardQuestionsPage: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();

  const { data: examData, isLoading, isError, refetch } = useExamQuestionsQuery(examId, !!examId);
  const exam = examData?.exam;
  const questions: ExamQuestionFull[] = examData?.questions || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<ExamQuestionFull | null>(null);

  // Question Form State
  const [questionText, setQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [marks, setMarks] = useState(1);

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate: addQuestion, isPending: isAdding } = useAddQuestionMutation(examId || '');
  const { mutate: updateQuestion, isPending: isUpdating } = useUpdateQuestionMutation(examId);
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestionMutation(examId);

  const handleOpenAdd = () => {
    setQuestionText('');
    setImageUrl('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
    setExplanation('');
    setMarks(1);
    setEditingQuestionId(null);
    setFormError(null);
    setImageUploadError(null);
    setIsModalOpen(true);
  };

  // ─── Add from Question Bank ──────────────────────────────────────
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [bankDebounced, setBankDebounced] = useState('');
  const [bankSelected, setBankSelected] = useState<Set<string>>(new Set());
  const [addingFromBank, setAddingFromBank] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBankDebounced(bankSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [bankSearch]);

  const { data: bankData } = useQuery({
    queryKey: ['question-bank', bankDebounced, 'for-exam'],
    queryFn: () =>
      questionBankApi.list({ search: bankDebounced || undefined, limit: 50 }),
    enabled: bankModalOpen,
  });
  const bankQuestions = bankData?.questions ?? [];

  const toggleBankQuestion = (id: string) => {
    setBankSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddFromBank = async () => {
    if (!examId || bankSelected.size === 0) return;
    setAddingFromBank(true);
    try {
      const res = await questionBankApi.addToExam(examId, [...bankSelected]);
      toast.success(res.message ?? `تم إضافة ${res.addedCount ?? bankSelected.size} سؤال.`);
      setBankSelected(new Set());
      setBankModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر إضافة الأسئلة.');
    } finally {
      setAddingFromBank(false);
    }
  };

  const handleOpenEdit = (q: ExamQuestionFull) => {
    setQuestionText(q.text);
    setImageUrl(q.imageUrl || '');
    const opts = Array.isArray(q.options)
      ? (q.options as string[])
      : typeof q.options === 'string'
      ? JSON.parse(q.options)
      : ['', '', '', ''];
    setOptions(opts.length === 4 ? opts : [...opts, '', '', ''].slice(0, 4));
    setCorrectOptionIndex(q.correctOptionIndex ?? 0);
    setExplanation(q.explanation || '');
    setMarks(q.marks || 1);
    setEditingQuestionId(q.id);
    setFormError(null);
    setImageUploadError(null);
    setIsModalOpen(true);
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !examId) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('حجم الصورة يجب ألا يتعدى 5 ميجابايت.');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const res = await examsApi.uploadQuestionImage(examId, file);
      setImageUrl(res.imageUrl);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'فشل رفع الصورة، يرجى المحاولة مرة أخرى.';
      setImageUploadError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!questionText.trim()) {
      setFormError('يرجى كتابة نص السؤال');
      return;
    }

    if (options.some((opt) => !opt.trim())) {
      setFormError('يرجى ملء جميع الاختيارات الأربعة');
      return;
    }

    if (editingQuestionId) {
      updateQuestion(
        {
          questionId: editingQuestionId,
          data: {
            text: questionText.trim(),
            imageUrl: imageUrl.trim() || undefined,
            options: options.map((o) => o.trim()),
            correctOptionIndex,
            explanation: explanation.trim() || undefined,
            marks: Number(marks),
          },
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingQuestionId(null);
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || 'حدث خطأ أثناء تعديل السؤال.';
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
          },
        }
      );
    } else {
      addQuestion(
        {
          text: questionText.trim(),
          imageUrl: imageUrl.trim() || undefined,
          options: options.map((o) => o.trim()),
          correctOptionIndex,
          explanation: explanation.trim() || undefined,
          marks: Number(marks),
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || 'حدث خطأ أثناء إضافة السؤال.';
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deletingQuestion) return;
    deleteQuestion(deletingQuestion.id, {
      onSuccess: () => setDeletingQuestion(null),
    });
  };

  const totalExamMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4 py-8 text-right">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-amiri text-gold-300">تعذر تحميل أسئلة الامتحان</h2>
        <p className="text-xs text-ivory-muted leading-relaxed">
          تأكد من وجود الامتحان وأنك تملك صلاحيات إدارة هذا الكورس.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
          <Link to="/dashboard/exams">
            <Button variant="outline">العودة للامتحانات</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/exams"
              className="text-xs text-gold-400 hover:underline flex items-center gap-1"
            >
              <span>لوحة الامتحانات</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300 flex items-center gap-2.5">
            <FileQuestion className="w-7 h-7 text-gold-400" />
            <span>بنك أسئلة: {exam?.title || 'الامتحان'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-ivory-muted">
            إضافة وتعديل وحذف أسئلة الاختيار من متعدد، وإرفاق صور وخرائط توضيحية، وتحديد الإجابات الصحيحة وشرح الأستاذ.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Button
            onClick={() => setBankModalOpen(true)}
            size="md"
            variant="outline"
            leftIcon={<Database className="w-4 h-4" />}
            className="shrink-0"
          >
            إضافة من بنك الأسئلة
          </Button>
          <Button
            onClick={handleOpenAdd}
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-bold shadow-gold-glow shrink-0"
          >
            إضافة سؤال جديد
          </Button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
            <FileQuestion className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-ivory-muted block">إجمالي الأسئلة</span>
            <span className="text-lg font-bold font-mono text-ivory">{questions.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-ivory-muted block">مجموع الدرجات</span>
            <span className="text-lg font-bold font-mono text-emerald-300">
              {totalExamMarks} / {exam?.totalMarks || totalExamMarks}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-ivory-muted block">درجة النجاح</span>
            <span className="text-lg font-bold font-mono text-ivory">
              {exam?.passingMarks ?? 50}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-surface-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-ivory-muted block">حالة الامتحان</span>
            <span className="text-xs font-bold text-ivory">
              {exam?.isPublished ? (
                <span className="text-emerald-400">منشور للطلاب</span>
              ) : (
                <span className="text-gold-400">مسودة</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mx-auto">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-amiri text-ivory">
            لم تقم بإضافة أي أسئلة لهذا الامتحان بعد
          </h3>
          <p className="text-xs text-ivory-muted max-w-md mx-auto leading-relaxed">
            اضغط على زر "إضافة سؤال جديد" للبدء في كتابة الأسئلة، رفع الصور التوضيحية، وتحديد الإجابات النموذجية.
          </p>
          <Button onClick={handleOpenAdd} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            إضافة أول سؤال الآن
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-amiri text-gold-300 flex items-center gap-2">
              <span>الأسئلة الحالية</span>
              <Badge variant="gold">{questions.length} أسئلة</Badge>
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              إضافة سؤال
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const opts = Array.isArray(q.options)
                ? (q.options as string[])
                : typeof q.options === 'string'
                ? JSON.parse(q.options)
                : [];

              return (
                <div
                  key={q.id}
                  className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/30 transition-all space-y-5 shadow-lg"
                >
                  {/* Question Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border/60 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-xs font-bold font-mono text-gold-300">
                        {idx + 1}
                      </div>
                      <Badge variant="neutral">
                        {q.marks || 1} {q.marks === 1 ? 'درجة' : 'درجات'}
                      </Badge>
                      {q.imageUrl && (
                        <Badge variant="gold" className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>يحتوي على صورة</span>
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(q)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeletingQuestion(q)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        حذف
                      </Button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-bold font-amiri text-ivory leading-relaxed">
                      {q.text}
                    </h3>

                    {/* Question Illustration Image */}
                    {q.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-surface-border bg-black/40 p-2 max-w-lg">
                        <img
                          src={q.imageUrl}
                          alt="صورة السؤال"
                          className="max-h-60 rounded-lg object-contain mx-auto"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {opts.map((opt: string, optIdx: number) => {
                      const isCorrect = q.correctOptionIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            isCorrect
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-bold shadow-sm'
                              : 'bg-surface/60 border-surface-border text-ivory-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                                isCorrect
                                  ? 'bg-emerald-500 text-surface-dark'
                                  : 'bg-surface-border text-ivory-muted'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {isCorrect && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>الإجابة الصحيحة</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation if provided */}
                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-gold-500/5 border border-gold-500/20 text-xs space-y-1">
                      <span className="font-bold text-gold-400 block">شرح وتوضيح الأستاذ:</span>
                      <p className="text-ivory-muted leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Add / Edit Question Modal ───────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestionId ? 'تعديل السؤال' : 'إضافة سؤال اختيار من متعدد'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              نص السؤال <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="مثال: من هو قائد معركة حطين وما هي نتائجها المباشرة؟"
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="درجة السؤال"
              type="number"
              min="1"
              max="100"
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              required
            />

            {/* Direct Image URL input */}
            <Input
              label="أو الصق رابط صورة مباشرة (اختياري)"
              placeholder="https://example.com/map.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {/* ─── Image Upload Section ───────────────────────────────────── */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-medium text-ivory/80 font-cairo">
              صورة توضيحية / خريطة للسؤال (اختياري - تظهر للطالب في الامتحان)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              className="hidden"
            />

            {imageUrl ? (
              <div className="p-3 rounded-xl bg-surface border border-surface-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-surface-border bg-black/50 shrink-0 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="معاينة الصورة"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="space-y-0.5 overflow-hidden text-right">
                    <span className="text-xs font-bold text-emerald-400 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      تم إرفاق الصورة بنجاح
                    </span>
                    <span className="text-[10px] text-ivory-muted truncate block max-w-xs" dir="ltr">
                      {imageUrl}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="text-xs"
                  >
                    تغيير
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isUploadingImage
                    ? 'border-gold-500/50 bg-gold-500/5'
                    : 'border-surface-border hover:border-gold-500/50 hover:bg-surface/50'
                }`}
              >
                {isUploadingImage ? (
                  <div className="flex items-center gap-2 text-gold-400 text-xs font-bold">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري رفع الصورة إلى الخادم...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-ivory">
                        اضغط هنا لاختيار صورة من جهازك
                      </p>
                      <p className="text-[10px] text-ivory-muted">
                        JPG, PNG, WebP بحد أقصى 5 ميجابايت
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {imageUploadError && (
              <p className="text-xs text-red-400 flex items-center gap-1 pt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{imageUploadError}</span>
              </p>
            )}
          </div>

          {/* Options with Radio Selection */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              الاختيارات الأربعة <span className="text-red-400">*</span>{' '}
              <span className="text-xs text-gold-400 font-normal">
                (اضغط على الدائرة لتحديد الإجابة الصحيحة)
              </span>
            </label>

            {options.map((opt, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  correctOptionIndex === idx
                    ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-surface border-surface-border'
                }`}
              >
                <input
                  type="radio"
                  id={`opt-radio-${idx}`}
                  name="correctOptionRadio"
                  checked={correctOptionIndex === idx}
                  onChange={() => setCorrectOptionIndex(idx)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />

                <span className="text-xs font-bold text-ivory-muted w-5 font-mono">
                  {String.fromCharCode(65 + idx)}.
                </span>

                <input
                  type="text"
                  required
                  placeholder={`اكتب نص الاختيار رقم ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 bg-transparent text-xs text-ivory outline-none placeholder-ivory-muted/40"
                />

                {correctOptionIndex === idx && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    الإجابة الصحيحة
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-sm font-medium text-ivory/90 font-cairo">
              شرح وتوضيح الإجابة النموذجية (يظهر للطالب بعد تسليم الامتحان)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="اكتب التفسير والتعليل التاريخي ولماذا هذه هي الإجابة الصحيحة..."
              className="w-full bg-surface border border-surface-border text-ivory rounded-lg p-3 text-xs outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50"
            />
          </div>

          <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isAdding || isUpdating || isUploadingImage}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              isLoading={isAdding || isUpdating || isUploadingImage}
              disabled={isUploadingImage}
            >
              {editingQuestionId ? 'حفظ التعديلات' : 'إضافة السؤال للبنك'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Delete Question Modal ───────────────────────────────────── */}
      <Modal
        isOpen={!!deletingQuestion}
        onClose={() => setDeletingQuestion(null)}
        title="تأكيد حذف السؤال"
      >
        <div className="space-y-4 text-right">
          <p className="text-xs text-ivory-muted leading-relaxed">
            هل أنت متأكد من رغبتك في حذف هذا السؤال من بنك أسئلة الامتحان؟
          </p>

          {deletingQuestion && (
            <div className="p-3 rounded-xl bg-surface border border-surface-border text-xs text-ivory font-bold">
              {deletingQuestion.text}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeletingQuestion(null)}
              disabled={isDeleting}
            >
              تراجع
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
              نعم، تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Add from Question Bank Modal ────────────────────────────── */}
      <Modal
        isOpen={bankModalOpen}
        onClose={() => {
          setBankModalOpen(false);
          setBankSelected(new Set());
          setBankSearch('');
        }}
        title={`إضافة من بنك الأسئلة${bankSelected.size > 0 ? ` (${bankSelected.size} محدد)` : ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-right">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted" />
            <input
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              placeholder="بحث في بنك الأسئلة..."
              className="w-full bg-surface border border-surface-border rounded-lg pr-9 pl-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
            />
          </div>

          <div className="max-h-[45vh] overflow-y-auto space-y-2">
            {bankQuestions.length === 0 ? (
              <p className="text-center text-xs text-ivory-muted py-6">
                لا توجد أسئلة في البنك — أضف أسئلتك أولاً من صفحة بنك الأسئلة المركزي.
              </p>
            ) : (
              bankQuestions.map((q) => {
                const selected = bankSelected.has(q.id);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => toggleBankQuestion(q.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-right transition-colors ${
                      selected
                        ? 'border-gold-500/50 bg-gold-500/10'
                        : 'border-surface-border bg-surface hover:border-gold-500/30'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-gold-400">
                      {selected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4 opacity-50" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-ivory truncate">{q.text}</span>
                      <span className="block text-[10px] mt-0.5 truncate">
                        <span className="text-emerald-400/80">✓ {q.options[q.correctOptionIndex]}</span>
                        {q.marks ? <span className="text-ivory-muted mr-2">• {q.marks} درجة</span> : null}
                        {q.topic ? <span className="text-ivory-muted mr-2">• {q.topic}</span> : null}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <Button variant="ghost" size="sm" onClick={() => setBankModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleAddFromBank}
              isLoading={addingFromBank}
              disabled={bankSelected.size === 0}
            >
              إضافة {bankSelected.size > 0 ? `(${bankSelected.size})` : ''} إلى الامتحان
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
