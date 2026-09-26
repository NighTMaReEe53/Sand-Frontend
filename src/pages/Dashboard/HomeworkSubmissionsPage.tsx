import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  ClipboardList,
  Loader2,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  BookOpenCheck,
  Send,
  Search,
  SlidersHorizontal,
  Sparkles,
  FileCheck2,
  X,
  Eye,
  UserCheck,
  Flame,
  Phone,
  UserX,
  Users,
} from 'lucide-react';
import {
  homeworkApi,
  HomeworkSubmissionRow,
  HomeworkSubmissionAnswer,
  UnsubmittedStudent,
} from '../../api/homework.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { resolveMediaUrl } from '../../lib/utils';
import { toast } from 'sonner';

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const ScoreChip: React.FC<{ passed: boolean | null; score: number | null }> = ({ passed, score }) => {
  if (score === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <Clock className="w-3 h-3" />
        قيد المراجعة
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${
        passed
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-red-500/15 text-red-300 border-red-500/30'
      }`}
    >
      {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {score}%
    </span>
  );
};

interface GradeModalProps {
  attemptId: string;
  answer: HomeworkSubmissionAnswer;
  onClose: () => void;
  onGraded: () => void;
}

const GradeModal: React.FC<GradeModalProps> = ({ attemptId, answer, onClose, onGraded }) => {
  const [grade, setGrade] = useState<number>(answer.teacherGrade ?? 0);
  const [note, setNote] = useState(answer.teacherNote ?? '');
  const [imgExpanded, setImgExpanded] = useState(true);

  const mutation = useMutation({
    mutationFn: () =>
      homeworkApi.gradeEssayAnswer(attemptId, answer.questionId, {
        awardedMarks: grade,
        teacherNote: note.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success(
        data.allEssayGraded
          ? 'اكتملت مراجعة تسليم الطالب بالكامل! تم إشعاره بالنتيجة.'
          : `تم رصد الدرجة (${grade}/${answer.question.marks}) بنجاح.`
      );
      onGraded();
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'تعذر رصد الدرجة.'),
  });

  const maxMark = answer.question.marks;
  const quickGrades = [0, Math.floor(maxMark / 2), maxMark].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <Modal isOpen onClose={onClose} title="تصحيح ورصد إجابة الطالب" maxWidth="lg">
      <div className="space-y-5 text-right p-1" dir="rtl">
        {/* Question Text */}
        <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-1">
          <p className="text-xs font-bold text-gold-400">نص السؤال المطلوب:</p>
          <p className="text-sm font-bold text-ivory leading-relaxed">{answer.question.text}</p>
          <p className="text-[11px] text-ivory-muted pt-1 border-t border-surface-border mt-2">
            الدرجة القصوى للسؤال: <span className="text-gold-300 font-bold">{maxMark} درجات</span>
          </p>
        </div>

        {/* Student Image Answer */}
        {answer.imageUrl ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setImgExpanded((p) => !p)}
              className="flex items-center gap-2 text-xs font-bold text-violet-300 hover:text-violet-200 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <span>إجابة الطالب المرفقة (صورة كشكول / ورقة):</span>
              {imgExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {imgExpanded && (
              <a
                href={resolveMediaUrl(answer.imageUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="block group relative rounded-2xl overflow-hidden border border-violet-500/30 bg-black/40"
              >
                <img
                  src={resolveMediaUrl(answer.imageUrl)}
                  alt="إجابة الطالب"
                  className="rounded-2xl max-h-96 w-auto object-contain mx-auto group-hover:scale-[1.01] transition-transform duration-300 cursor-zoom-in"
                />
                <span className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-gold-400" />
                  اضغط للتكبير في نافذة جديدة
                </span>
              </a>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>الطالب لم يقم برفع صورة إجابة لهذا السؤال.</span>
          </div>
        )}

        {/* Awarded Marks Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-ivory">
            الدرجة المستحقة للطالب (من 0 إلى {maxMark}):
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={maxMark}
              value={grade}
              onChange={(e) => setGrade(Math.min(maxMark, Math.max(0, Number(e.target.value))))}
              className="w-32 bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-sm font-black text-gold-300 outline-none focus:border-gold-400 transition-colors shadow-inner"
            />
            <div className="flex gap-2 flex-wrap">
              {quickGrades.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setGrade(v)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    grade === v
                      ? 'bg-primary text-white font-black shadow-md border-primary'
                      : 'bg-surface border-surface-border text-ivory-muted hover:border-primary/40 hover:text-ivory'
                  }`}
                >
                  {v === 0 ? 'صفر (0)' : v === maxMark ? `الدرجة كاملة (${maxMark})` : `${v} درجات`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Teacher Feedback Note */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-ivory">ملاحظة وتوجيه للأستاذ (تظهر للطالب):</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: إجابة ممتازة وخطوات واضحة، انتبه فقط لإشارة الناتج الأخير."
            className="w-full bg-surface border border-surface-border rounded-xl px-3.5 py-2.5 text-xs text-ivory outline-none focus:border-gold-400 resize-none transition-colors shadow-inner"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
          <Button variant="ghost" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            size="sm"
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
            leftIcon={<Send className="w-3.5 h-3.5" />}
            className="!rounded-xl font-bold"
          >
            رصد الدرجة وحفظ
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const SubmissionCard: React.FC<{
  submission: HomeworkSubmissionRow;
  onGradeAnswer: (attemptId: string, answer: HomeworkSubmissionAnswer) => void;
}> = ({ submission, onGradeAnswer }) => {
  const [expanded, setExpanded] = useState(submission.essayPendingCount > 0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const essayAnswers = submission.answers.filter((a) => a.question.requiresImageAnswer);
  const mcqAnswers = submission.answers.filter((a) => !a.question.requiresImageAnswer);

  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all shadow-sm ${
        submission.essayPendingCount > 0
          ? 'border-amber-500/40 bg-amber-500/5 shadow-amber-500/5'
          : 'border-surface-border bg-surface-card hover:border-gold-500/30'
      }`}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between gap-4 p-5 text-right hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gold-gradient text-bg flex items-center justify-center font-black text-sm shrink-0 shadow-gold-glow/30">
            {submission.student.fullName?.charAt(0) || 'ط'}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-ivory truncate">{submission.student.fullName}</h3>
            <p className="text-[11px] text-ivory-muted mt-0.5">
              محاولة رقم #{submission.attemptNumber} • {formatDate(submission.submittedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {submission.essayPendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Clock className="w-3.5 h-3.5" />
              {submission.essayPendingCount} أسئلة بانتظار التصحيح
            </span>
          )}
          <ScoreChip passed={submission.isPassed} score={submission.score} />
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-ivory-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-ivory-muted" />
          )}
        </div>
      </button>

      {/* Accordion Content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-surface-border/60 pt-4">
          {/* Quick Score Summary Bar */}
          <div className="flex flex-wrap items-center gap-3 text-xs bg-surface p-3 rounded-2xl border border-surface-border">
            {mcqAnswers.length > 0 && (
              <span className="font-bold text-ivory">
                اختيار من متعدد: <span className="text-emerald-400 font-black">{mcqAnswers.filter((a) => a.isCorrect).length}</span> / {mcqAnswers.length} صحيح
              </span>
            )}
            {essayAnswers.length > 0 && (
              <span className="font-bold text-ivory">
                مقالي: <span className="text-violet-300 font-black">{essayAnswers.filter((a) => a.teacherGrade !== null).length}</span> / {essayAnswers.length} مصحَّح
              </span>
            )}
            {submission.earnedMarks !== null && (
              <span className="text-gold-300 font-black mr-auto bg-gold-500/10 px-2.5 py-1 rounded-xl border border-gold-500/20">
                المجموع الكلي: {submission.earnedMarks} / {submission.totalMarks} درجة
              </span>
            )}
          </div>

          {/* MCQ Answers */}
          {mcqAnswers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-black text-ivory-muted uppercase tracking-wider">
                إجابات الاختيار من متعدد (تصحيح آلي):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {mcqAnswers.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-surface-border text-xs"
                  >
                    {a.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="text-ivory-muted flex-1 truncate">
                      <span className="font-bold text-ivory">س{i + 1}:</span> {a.question.text}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold text-gold-300">
                      {a.awardedMarks} / {a.question.marks}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Essay Answers */}
          {essayAnswers.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-black text-ivory-muted uppercase tracking-wider">
                الأسئلة المقالية والصور (تصحيح المعلم):
              </p>
              <div className="space-y-2.5">
                {essayAnswers.map((a, i) => (
                  <div
                    key={a.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all ${
                      a.teacherGrade !== null
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-amber-500/30 bg-amber-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {a.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setLightbox(resolveMediaUrl(a.imageUrl!))}
                          className="shrink-0 group relative w-16 h-16 rounded-xl overflow-hidden border border-violet-500/30 hover:border-violet-400 transition-colors cursor-zoom-in"
                          title="اضغط لمعاينة الصورة بالحجم الكامل"
                        >
                          <img
                            src={resolveMediaUrl(a.imageUrl)}
                            alt="إجابة الطالب"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </span>
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-ivory-muted shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-bold text-ivory leading-relaxed">
                          سؤال {i + 1}: {a.question.text}
                        </p>
                        <p className="text-[11px] text-ivory-muted">
                          {a.teacherGrade !== null ? (
                            <span className="text-emerald-400 font-bold">
                              تم رصد: {a.teacherGrade} / {a.question.marks} درجة
                              {a.teacherNote ? ` — "${a.teacherNote}"` : ''}
                            </span>
                          ) : a.imageUrl ? (
                            <span className="text-amber-400 font-bold">بانتظار تصحيح المعلم</span>
                          ) : (
                            <span className="text-red-400 font-bold">لم يرفع الطالب الإجابة بعد</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={a.teacherGrade !== null ? 'outline' : 'primary'}
                      onClick={() => onGradeAnswer(submission.id, a)}
                      leftIcon={<Award className="w-3.5 h-3.5" />}
                      className="!rounded-xl font-bold self-end sm:self-center"
                    >
                      {a.teacherGrade !== null ? 'تعديل الدرجة' : 'تصحيح ورصد'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightbox && (
        <Modal isOpen onClose={() => setLightbox(null)} title="معاينة إجابة الطالب (صورة)" maxWidth="3xl">
          <div className="flex justify-center p-2">
            <img
              src={lightbox}
              alt="إجابة الطالب"
              className="rounded-2xl max-h-[80vh] w-auto object-contain shadow-2xl border border-surface-border"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export const HomeworkSubmissionsPage: React.FC = () => {
  const { homeworkId } = useParams<{ homeworkId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [gradingTarget, setGradingTarget] = useState<{
    attemptId: string;
    answer: HomeworkSubmissionAnswer;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsubmitted' | 'pending' | 'graded' | 'passed' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['hw-submissions', homeworkId],
    queryFn: () => homeworkApi.listSubmissions(homeworkId!),
    enabled: !!homeworkId,
    staleTime: 1000 * 30,
  });

  const submissionsAll = data?.submissions ?? [];
  const unsubmittedAll = data?.unsubmittedStudents ?? [];
  const stats = data?.stats;
  const pendingTotal = submissionsAll.reduce((s, r) => s + r.essayPendingCount, 0);

  const filterOptions: { value: typeof statusFilter; label: string; count: number; icon: React.ReactNode }[] = [
    {
      value: 'all',
      label: 'جميع التسليمات',
      count: submissionsAll.length,
      icon: <FileCheck2 className="w-3.5 h-3.5" />,
    },
    {
      value: 'unsubmitted',
      label: 'لم يسلّموا بعد',
      count: unsubmittedAll.length,
      icon: <UserX className="w-3.5 h-3.5" />,
    },
    {
      value: 'pending',
      label: 'بانتظار التصحيح',
      count: submissionsAll.filter((s) => s.essayPendingCount > 0).length,
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    {
      value: 'graded',
      label: 'تم تصحيحها',
      count: submissionsAll.filter((s) => s.essayPendingCount === 0).length,
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    {
      value: 'passed',
      label: 'ناجحون',
      count: submissionsAll.filter((s) => s.isPassed).length,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    {
      value: 'failed',
      label: 'راسبون',
      count: submissionsAll.filter((s) => s.score !== null && !s.isPassed).length,
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
  ];

  const filteredSubmissions = submissionsAll.filter((s) => {
    if (statusFilter === 'unsubmitted') return false;
    if (statusFilter === 'pending' && s.essayPendingCount === 0) return false;
    if (statusFilter === 'graded' && s.essayPendingCount > 0) return false;
    if (statusFilter === 'passed' && !s.isPassed) return false;
    if (statusFilter === 'failed' && (s.isPassed || s.score === null)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!(s.student.fullName ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredUnsubmitted = unsubmittedAll.filter((s) => {
    if (statusFilter !== 'all' && statusFilter !== 'unsubmitted') return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const nameMatch = (s.fullName ?? '').toLowerCase().includes(q);
      const phoneMatch = (s.phone ?? '').includes(q);
      if (!nameMatch && !phoneMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white mb-2 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-gold-400" />
              العودة للدرس والمحتوى
            </button>
            <h1 className="font-amiri text-2xl sm:text-3xl font-black text-gold-300 flex items-center gap-2.5">
              <BookOpenCheck className="w-7 h-7 text-gold-400" />
              مراجعة وتصحيح تسليمات الواجب
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1">
              متابعة إجابات الطلاب، رصد درجات الأسئلة المقالية والصور، والاطلاع على الطلاب الذين لم يسلّموا بعد.
            </p>
          </div>
        </div>

        {pendingTotal > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
            <Flame className="w-5 h-5 text-amber-400 shrink-0" />
            <span>لديك {pendingTotal} سؤال مقالي بانتظار تصحيحك ورصد الدرجات للطلاب.</span>
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      {(submissionsAll.length > 0 || unsubmittedAll.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-surface-card border border-surface-border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/15 text-gold-400 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-300">إجمالي التسليمات</p>
                <p className="text-xl font-bold text-white">{submissionsAll.length}</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('unsubmitted')}
            className="rounded-2xl bg-surface-card border border-surface-border hover:border-amber-500/40 p-4 shadow-card cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-300">لم يسلّموا بعد</p>
                <p className="text-xl font-bold text-rose-400">{unsubmittedAll.length}</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('pending')}
            className="rounded-2xl bg-surface-card border border-surface-border hover:border-amber-500/40 p-4 shadow-card cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-300">بانتظار التصحيح</p>
                <p className="text-xl font-bold text-amber-400">
                  {submissionsAll.filter((s) => s.essayPendingCount > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('passed')}
            className="rounded-2xl bg-surface-card border border-surface-border hover:border-emerald-500/40 p-4 shadow-card cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-300">الناجحون</p>
                <p className="text-xl font-bold text-emerald-400">
                  {submissionsAll.filter((s) => s.isPassed).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Tabs */}
      {(submissionsAll.length > 0 || unsubmittedAll.length > 0) && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gold-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الطالب أو رقم الهاتف..."
              className="w-full pr-11 pl-4 py-3 bg-surface-card border border-surface-border rounded-2xl text-xs sm:text-sm text-white placeholder:text-zinc-400 outline-none focus:border-gold-400 transition shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills with Color UX */}
          <div className="flex items-center gap-2 border-b border-surface-border pb-3 overflow-x-auto">
            {filterOptions.map((opt) => {
              const isActive = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gold-gradient text-white font-black shadow-gold-glow'
                      : 'bg-surface-card border border-surface-border text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-gold-400'}>{opt.icon}</span>
                  <span>{opt.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-surface text-zinc-300'
                    }`}
                  >
                    {opt.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Rendering */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>تعذر تحميل تسليمات الواجب. يرجى إعادة المحاولة.</span>
        </div>
      ) : submissionsAll.length === 0 && unsubmittedAll.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3 shadow-card">
          <ClipboardList className="w-12 h-12 mx-auto text-gold-400/50" />
          <h3 className="text-base font-bold text-white">لا توجد تسليمات أو طلاب مسجلين لهذا الواجب بعد</h3>
          <p className="text-xs text-zinc-300">عند قيام الطلاب بالاشتراك وحل الواجب، ستظهر إجاباتهم وحالتهم هنا.</p>
        </div>
      ) : statusFilter === 'unsubmitted' ? (
        /* Unsubmitted Students List View */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-400" />
              الطلاب المسجلون الذين لم يسلّموا الواجب ({filteredUnsubmitted.length})
            </h2>
            <span className="text-xs text-zinc-300">
              إجمالي غير المسلمين: <strong className="text-gold-300">{unsubmittedAll.length}</strong> طالب
            </span>
          </div>

          {filteredUnsubmitted.length === 0 ? (
            <div className="p-10 rounded-3xl bg-surface-card border border-surface-border text-center space-y-2 shadow-card">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="text-sm font-bold text-white">لا يوجد طلاب مطابقون في قائمة غير المسلمين.</p>
              <p className="text-xs text-zinc-300">جميع الطلاب المسجلين قاموا بتسليم الواجب أو لا توجد نتائج للبحث.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUnsubmitted.map((st) => (
                <div
                  key={st.studentId}
                  className="rounded-2xl border border-surface-border bg-surface-card p-4 space-y-3 hover:border-gold-500/30 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center font-bold text-gold-300 shrink-0">
                        {st.fullName?.charAt(0) || 'ط'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{st.fullName}</h4>
                        <p className="text-[11px] text-zinc-300 mt-0.5">
                          {st.gradeLevel ? `المرحلة: ${st.gradeLevel}` : 'طالب مسجل'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                        st.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {st.status === 'IN_PROGRESS' ? (
                        <>
                          <Clock className="w-3 h-3" />
                          جاري الحل ولم يسلّم
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          لم يبدأ الحل بعد
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gold-400" />
                      <span>{st.phone || 'لا يوجد هاتف مسجل'}</span>
                    </div>

                    {st.phone && (
                      <a
                        href={`tel:${st.phone}`}
                        className="text-xs font-bold text-gold-400 hover:text-gold-300 transition-colors"
                      >
                        اتصال للطالب
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-10 rounded-3xl bg-surface-card border border-surface-border text-center space-y-2 shadow-card">
          <Search className="w-10 h-10 mx-auto text-zinc-400" />
          <p className="text-sm font-bold text-white">لا توجد تسليمات تطابق خيارات الفلترة الحالية.</p>
          <p className="text-xs text-zinc-300">جرب البحث باسم طالب آخر أو تغيير التبويب.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...filteredSubmissions]
            .sort((a, b) => (statusFilter === 'all' ? b.essayPendingCount - a.essayPendingCount : 0))
            .map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                onGradeAnswer={(attemptId, answer) => setGradingTarget({ attemptId, answer })}
              />
            ))}
        </div>
      )}

      {/* Grade Modal */}
      {gradingTarget && (
        <GradeModal
          attemptId={gradingTarget.attemptId}
          answer={gradingTarget.answer}
          onClose={() => setGradingTarget(null)}
          onGraded={() => queryClient.invalidateQueries({ queryKey: ['hw-submissions', homeworkId] })}
        />
      )}
    </div>
  );
};

export default HomeworkSubmissionsPage;
