import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  ExternalLink,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { homeworkApi } from '../../api/homework.api';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';

interface TeacherHomeworkQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string | null;
  marks: number;
}

interface TeacherHomework {
  id: string;
  title: string;
  description: string | null;
  availableFrom?: string | null;
  passingPercentage: number;
  maxAttempts: number;
  pdfUrl: string | null;
  isPublished: boolean;
  questions: TeacherHomeworkQuestion[];
  _count?: { attempts: number };
}

interface HomeworkManagerModalProps {
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
  requiresImageAnswer: boolean;
}

const emptyQuestion = (): QuestionDraft => ({
  text: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  explanation: '',
  marks: 1,
  requiresImageAnswer: false,
});

const MAX_SHEET_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_SHEET_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];

const formatFileSize = (size: number) =>
  size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;

const toLocalDatetimeInputValue = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatArabicDateTime = (isoOrDateString: string): string => {
  try {
    const d = new Date(isoOrDateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const HomeworkManagerModal: React.FC<HomeworkManagerModalProps> = ({
  lessonId,
  lessonTitle,
  onClose,
}) => {
  const [items, setItems] = useState<TeacherHomework[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [hwTitle, setHwTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [availableFrom, setAvailableFrom] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const newSheetInputRef = useRef<HTMLInputElement>(null);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await homeworkApi.getTeacherLessonHomeworks(lessonId);
      setItems(data.homeworks);
    } catch {
      setError('تعذر تحميل الواجبات.');
      setItems([]);
    }
  }, [lessonId]);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const selectHomeworkSheet = (file: File | null) => {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_SHEET_EXTENSIONS.includes(extension)) {
      setError('الصيغ المدعومة لورقة الواجب: PDF، Word، أو PowerPoint فقط.');
      return;
    }
    if (file.size > MAX_SHEET_SIZE_BYTES) {
      setError('حجم ورقة الواجب يجب أن يكون 50MB أو أقل.');
      return;
    }
    setError(null);
    setPdfFile(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pdfFile) {
      setError('ارفع ملف PDF لورقة الواجب أولاً.');
      return;
    }

    const validQuestions = draftQuestions.filter(
      (q) => q.text.trim() && q.options.filter((o) => o.trim()).length >= 2
    );
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
      const scheduledAt = availableFrom ? new Date(availableFrom) : null;
      if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
        setError('اختر تاريخ ووقت صحيحين لفتح الواجب.');
        return;
      }

      // 1. إنشاء الواجب بكل الأسئلة بنفس ترتيب الـ PDF — لا خلط
      const created = await homeworkApi.createHomework(lessonId, {
        title: hwTitle.trim(),
        description: description.trim() || undefined,
        passingPercentage,
        isPublished: true,
        availableFrom: scheduledAt?.toISOString(),
        questions: validQuestions.map((q, idx) => {
          const filledOptions = q.options.map((o) => o.trim()).filter(Boolean);
          return {
            text: q.text.trim(),
            options: filledOptions,
            correctOptionIndex: Math.min(q.correctOptionIndex, filledOptions.length - 1),
            explanation: q.explanation.trim() || undefined,
            marks: q.marks || 1,
            orderIndex: idx + 1, // نفس ترتيب أسئلة الـ PDF
            requiresImageAnswer: q.requiresImageAnswer,
          };
        }),
      });

      // 2. رفع ملف الـ PDF
      const homeworkId = created?.homework?.id;
      if (homeworkId && pdfFile) {
        await homeworkApi.uploadSheet(homeworkId, pdfFile);
      }

      toast.success('تم إنشاء الواجب بنجاح');
      setCreating(false);
      setHwTitle('');
      setDescription('');
      setAvailableFrom('');
      setPdfFile(null);
      if (newSheetInputRef.current) newSheetInputRef.current.value = '';
      setDraftQuestions([emptyQuestion()]);
      loadItems();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'تعذر إنشاء الواجب.'
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (hw: TeacherHomework) => {
    await homeworkApi.updateHomework(hw.id, { isPublished: !hw.isPublished });
    loadItems();
  };

  const deleteHw = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
    await homeworkApi.deleteHomework(id);
    loadItems();
  };

  const handlePdfUpload = async (homeworkId: string, file: File) => {
    setUploadingFor(homeworkId);
    try {
      await homeworkApi.uploadSheet(homeworkId, file);
      toast.success('تم رفع ملف الواجب');
      loadItems();
    } catch {
      toast.error('تعذر رفع ملف الواجب');
    } finally {
      setUploadingFor(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
    }
  };

  const updateDraft = (idx: number, patch: Partial<QuestionDraft>) =>
    setDraftQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

  return (
    <Modal isOpen onClose={onClose} title={`واجبات الدرس: ${lessonTitle}`}>
      <div className="space-y-4 text-right max-h-[70vh] overflow-y-auto custom-scrollbar p-1">
        {error && (
          <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Existing homeworks */}
        {items === null ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
          </div>
        ) : items.length === 0 && !creating ? (
          <div className="p-8 rounded-xl bg-surface border border-surface-border text-center space-y-3">
            <BookOpenCheck className="w-10 h-10 mx-auto text-violet-400/40" />
            <p className="text-xs text-ivory-muted">لا يوجد واجب على هذا الدرس بعد.</p>
            <Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="w-4 h-4" />}>
              إنشاء واجب
            </Button>
          </div>
        ) : (
          !creating &&
          items.map((hw) => (
            <div key={hw.id} className="p-4 rounded-xl bg-surface border border-surface-border space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm font-bold text-violet-300">{hw.title}</h4>
                  <p className="text-[11px] text-ivory-muted">
                    {hw.questions.length} سؤال • النجاح عند {hw.passingPercentage}%
                    {` • ${hw._count?.attempts ?? 0} محاولة`}
                  </p>
                  <p className="text-[11px] flex items-center gap-1.5">
                    {hw.pdfUrl ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> ملف PDF مرفوع ✓
                      </span>
                    ) : (
                      <span className="text-red-400">لا يوجد ملف PDF</span>
                    )}
                  </p>
                  {hw.availableFrom ? (
                    <p className="text-[11px] flex items-center gap-1.5 text-amber-300">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(hw.availableFrom) > new Date()
                        ? `يفتح للطلاب في: ${formatArabicDateTime(hw.availableFrom)}`
                        : `متاح للطلاب منذ: ${formatArabicDateTime(hw.availableFrom)}`}
                    </p>
                  ) : (
                    <p className="text-[11px] flex items-center gap-1.5 text-emerald-400">
                      <CalendarDays className="w-3 h-3" /> متاح للطلاب فوراً ⚡
                    </p>
                  )}
                  <div className="pt-1">
                    <Link
                      to={`/dashboard/homework/${hw.id}/submissions`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/20 text-violet-200 border border-violet-500/40 hover:bg-violet-500/30 text-xs font-bold transition-all shadow-sm"
                    >
                      <BookOpenCheck className="w-4 h-4 text-violet-400" />
                      <span>مراجعة وتصحيح تسليمات الطلاب ({hw._count?.attempts ?? 0})</span>
                      <ExternalLink className="w-3 h-3 text-violet-300 mr-1" />
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePdfUpload(hw.id, f);
                      }}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-card border border-surface-border text-ivory hover:border-gold-500/40 transition-colors cursor-pointer">
                      {uploadingFor === hw.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                      {hw.pdfUrl ? 'استبدال PDF' : 'رفع PDF'}
                    </span>
                  </label>
                  <Button
                    size="sm"
                    variant={hw.isPublished ? 'secondary' : 'outline'}
                    onClick={() => togglePublish(hw)}
                    leftIcon={
                      hw.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                    }
                  >
                    {hw.isPublished ? 'إلغاء النشر' : 'نشر'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => deleteHw(hw.id)}
                    className="p-1.5 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="حذف الواجب"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <ul className="space-y-1.5 pr-2">
                {hw.questions.map((qq, i) => (
                  <li key={qq.id} className="text-[11px] text-ivory-muted flex items-start gap-1.5">
                    {(qq as any).requiresImageAnswer ? (
                      <>
                        <ImageIcon className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
                        <span>سؤال {i + 1}: {qq.text}{' '}
                          <span className="text-violet-400/80">(مقالي — صورة)</span>{' '}
                          ({qq.marks} درجة)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-ivory-muted/40 mt-1.5 shrink-0" />
                        <span>سؤال {i + 1}: {qq.text}{' '}
                          <span className="text-emerald-400/80">✓ {(qq.options as string[])[qq.correctOptionIndex]}</span>{' '}
                          ({qq.marks} درجة)
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        {!creating && items !== null && items.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreating(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            واجب جديد
          </Button>
        )}

        {creating && (
          <form onSubmit={handleCreate} className="space-y-4 p-4 rounded-xl bg-surface border border-violet-500/25">
            <p className="text-[11px] font-bold text-violet-300">
              ارفع ورقة الواجب PDF ثم أدخل نفس أسئلتها بالترتيب — لن يتم خلط الأسئلة أبداً.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="عنوان الواجب"
                value={hwTitle}
                onChange={(e) => setHwTitle(e.target.value)}
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
            </div>

            <Input
              label="وصف مختصر (اختياري)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* موعد الفتح — اختيار مرن وسهل مع اختصارات سريعة وتنسيق عربي واضح */}
            <div className="space-y-2.5 rounded-xl bg-surface-card/70 border border-surface-border p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-ivory flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-violet-400" />
                  موعد نزول / فتح الواجب للطلاب (اختياري)
                </label>
                {availableFrom && (
                  <button
                    type="button"
                    onClick={() => setAvailableFrom('')}
                    className="text-[10px] font-bold text-red-400 hover:underline"
                  >
                    إلغاء الموعد (جعله فورياً)
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="datetime-local"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  onClick={(e) => (e.target as any).showPicker?.()}
                  className="w-full bg-surface border border-surface-border text-ivory rounded-lg px-3.5 py-2.5 text-xs focus:border-violet-400 outline-none transition-all cursor-pointer [color-scheme:dark]"
                />
              </div>

              {/* أزرار اختصار سريعة */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-ivory-muted ml-1">اختيار سريع:</span>
                <button
                  type="button"
                  onClick={() => setAvailableFrom('')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    !availableFrom
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                      : 'border-surface-border text-ivory-muted hover:border-violet-400/40 hover:text-ivory'
                  }`}
                >
                  متاح فوراً ⚡
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setHours(20, 0, 0, 0);
                    setAvailableFrom(toLocalDatetimeInputValue(d));
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-surface-border text-ivory-muted hover:border-violet-400/40 hover:text-ivory transition-colors"
                >
                  اليوم 08:00 م
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(9, 0, 0, 0);
                    setAvailableFrom(toLocalDatetimeInputValue(d));
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-surface-border text-ivory-muted hover:border-violet-400/40 hover:text-ivory transition-colors"
                >
                  غداً 09:00 ص
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 2);
                    d.setHours(9, 0, 0, 0);
                    setAvailableFrom(toLocalDatetimeInputValue(d));
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-surface-border text-ivory-muted hover:border-violet-400/40 hover:text-ivory transition-colors"
                >
                  بعد يومين
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    d.setHours(9, 0, 0, 0);
                    setAvailableFrom(toLocalDatetimeInputValue(d));
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-surface-border text-ivory-muted hover:border-violet-400/40 hover:text-ivory transition-colors"
                >
                  بعد أسبوع
                </button>
              </div>

              {availableFrom ? (
                <p className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5 shrink-0" />
                  سيتم فتح الواجب للطلاب في: {formatArabicDateTime(availableFrom)}
                </p>
              ) : (
                <p className="text-[10px] text-ivory-muted leading-relaxed">
                  متروك فارغاً — سيُفتح الواجب للطلاب فور نشره. عند تحديد موعد سيظل مغلقاً حتى يحين الموعد ثم يفتح وتصلهم إشعارات.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ivory">ورقة الواجب (PDF / Word / PowerPoint)</label>
              <input
                ref={newSheetInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={(e) => selectHomeworkSheet(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => newSheetInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') newSheetInputRef.current?.click();
                }}
                onDragEnter={(e) => { e.preventDefault(); setIsSheetDragging(true); }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => setIsSheetDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsSheetDragging(false);
                  selectHomeworkSheet(e.dataTransfer.files?.[0] ?? null);
                }}
                className={`group cursor-pointer rounded-xl border-2 border-dashed p-4 transition-all text-center ${
                  isSheetDragging
                    ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
                    : pdfFile
                      ? 'border-emerald-500/45 bg-emerald-500/5'
                      : 'border-surface-border hover:border-violet-400/60 hover:bg-violet-500/5'
                }`}
              >
                {pdfFile ? (
                  <div className="flex items-center gap-3 text-right">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center"><FileCheck2 className="w-5 h-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ivory truncate">{pdfFile.name}</p>
                      <p className="text-[10px] text-emerald-400 mt-0.5">جاهز للرفع · {formatFileSize(pdfFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPdfFile(null); if (newSheetInputRef.current) newSheetInputRef.current.value = ''; }}
                      className="p-1.5 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10"
                      title="إزالة الملف"
                    ><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="mx-auto mb-2 w-10 h-10 rounded-xl bg-violet-500/10 text-violet-300 flex items-center justify-center group-hover:scale-110 transition-transform"><UploadCloud className="w-5 h-5" /></span>
                    <p className="text-xs font-bold text-ivory">اسحب ورقة الواجب هنا أو اضغط للاختيار</p>
                    <p className="text-[10px] text-ivory-muted mt-1">PDF، Word، PowerPoint · حتى 50MB</p>
                  </>
                )}
              </div>
            </div>

            {draftQuestions.map((dq, qi) => (
              <div key={qi} className="p-3 rounded-xl bg-surface-card border border-surface-border space-y-2">
                <Input
                  label={`سؤال ${qi + 1} (نفس ترتيب الـ PDF)`}
                  value={dq.text}
                  onChange={(e) => updateDraft(qi, { text: e.target.value })}
                />

                {dq.requiresImageAnswer ? (
                  /* سؤال صورة — الطالب يرفع صورة حله بدلاً من الاختيارات */
                  <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-violet-200 leading-relaxed">
                      سؤال إجابة بصورة — سيُطلب من الطالب رفع صورة حل هذا السؤال
                      (تُراجع يدوياً ولا تدخل في التصحيح الآلي).
                      اكتب نص السؤال كما في الورقة.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {dq.options.map((opt, oi) => (
                      <label key={oi} className="flex items-center gap-2 text-xs">
                        <input
                          type="radio"
                          name={`correct-hw-${qi}`}
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
                )}

                <label className="flex items-center gap-2 text-xs cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={dq.requiresImageAnswer}
                    onChange={(e) =>
                      updateDraft(qi, {
                        requiresImageAnswer: e.target.checked,
                        correctOptionIndex: 0,
                      })
                    }
                    className="accent-violet-500 w-3.5 h-3.5"
                  />
                  <span className="text-ivory flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-violet-300" />
                    يتطلب رفع صورة من الطالب بدلاً من الاختيار
                  </span>
                </label>

                {!dq.requiresImageAnswer && (
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
                )}
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
                حفظ ونشر الواجب
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
