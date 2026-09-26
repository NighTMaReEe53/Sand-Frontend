import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Plus,
  Trash2,
  Search,
  Loader2,
  Pencil,
  CheckSquare,
  Square,
  FilePlus,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';
import { questionBankApi, BankQuestion } from '../../api/phase2.api';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { useCourseExamsQuery } from '../../hooks/queries/useExams';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader, EmptyState } from '../../components/dashboard/PageHeader';

interface DraftQuestion {
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic: string;
  tags: string;
  courseId: string;
}

const emptyDraft = (): DraftQuestion => ({
  text: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  explanation: '',
  marks: 1,
  difficulty: 'MEDIUM',
  topic: '',
  tags: '',
  courseId: '',
});

const DIFFICULTY_BADGE: Record<string, 'success' | 'warning' | 'danger'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const DIFFICULTY_AR: Record<string, string> = {
  EASY: 'سهل',
  MEDIUM: 'متوسط',
  HARD: 'صعب',
};

export const QuestionBankPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<BankQuestion | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<DraftQuestion>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ─── Add-to-exam modal state ─────────────────────────────────────
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [addingToExam, setAddingToExam] = useState(false);

  const { data: coursesData } = useCoursesQuery({ limit: 100, mine: true });
  const teacherCourses = (coursesData as any)?.courses ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['question-bank', page, search, difficulty, topic, filterCourseId, sortBy],
    queryFn: () =>
      questionBankApi.list({
        page,
        search: search || undefined,
        difficulty: difficulty || undefined,
        topic: topic || undefined,
        courseId: filterCourseId || undefined,
        sortBy,
        sortOrder: sortBy === 'difficulty' ? 'asc' : 'desc',
        limit: 20,
      }),
  });

  const questions = data?.questions ?? [];

  // ─── Group questions into sections by course title ───────────────
  const courseTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of teacherCourses as Array<{ id: string; title: string }>) {
      m.set(c.id, c.title);
    }
    return m;
  }, [teacherCourses]);

  const sections = useMemo(() => {
    const map = new Map<string, { title: string; courseId: string | null; items: typeof questions }>();
    for (const q of questions) {
      const key = q.courseId && courseTitleById.has(q.courseId) ? q.courseId : '_none';
      if (!map.has(key)) {
        map.set(key, {
          title:
            key === '_none'
              ? 'أسئلة بدون كورس'
              : (courseTitleById.get(q.courseId!) ?? 'أسئلة بدون كورس'),
          courseId: key === '_none' ? null : (q.courseId ?? null),
          items: [],
        });
      }
      map.get(key)!.items.push(q);
    }
    // Named courses first (in the teacher's courses order), then unlinked
    return [...map.entries()].sort(([a], [b]) =>
      a === '_none' ? 1 : b === '_none' ? -1 : 0
    );
  }, [questions, courseTitleById]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['question-bank'] });

  const openCreate = () => {
    setDraft(emptyDraft());
    setCreating(true);
    setError(null);
  };

  const openEdit = (q: BankQuestion) => {
    setEditing(q);
    setDraft({
      text: q.text,
      options: [...q.options, '', '', '', ''].slice(0, Math.max(4, q.options.length)),
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation ?? '',
      marks: q.marks,
      difficulty: q.difficulty,
      topic: q.topic ?? '',
      tags: q.tags.join('، '),
      courseId: q.courseId ?? '',
    });
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const filledOptions = draft.options.map((o) => o.trim()).filter(Boolean);
    if (!draft.text.trim() || filledOptions.length < 2) {
      setError('أدخل نص السؤال وخيارين على الأقل.');
      return;
    }
    if (draft.correctOptionIndex >= filledOptions.length) {
      setError('الإجابة الصحيحة يجب أن تكون ضمن الخيارات المعبأة.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        text: draft.text.trim(),
        options: filledOptions,
        correctOptionIndex: draft.correctOptionIndex,
        explanation: draft.explanation.trim() || null,
        marks: draft.marks || 1,
        difficulty: draft.difficulty,
        topic: draft.topic.trim() || null,
        tags: draft.tags
          .split(/[،,]/)
          .map((t) => t.trim())
          .filter(Boolean),
        courseId: draft.courseId || null,
      };

      if (editing) {
        await questionBankApi.update(editing.id, payload);
        setEditing(null);
      } else {
        await questionBankApi.create(payload);
        setCreating(false);
      }
      invalidate();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'تعذر حفظ السؤال.'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`حذف ${selectedIds.size} سؤال؟`)) return;
    await questionBankApi.bulkDelete([...selectedIds]);
    setSelectedIds(new Set());
    invalidate();
  };

  // ─── Add selected questions to an exam ───────────────────────────
  const { data: examsData, isLoading: isLoadingCourseExams } = useCourseExamsQuery(
    selectedCourseId,
    !!selectedCourseId
  );
  const courseExams = Array.isArray(examsData) ? examsData : [];

  const handleAddToExam = async () => {
    if (!selectedExamId || selectedIds.size === 0) return;
    setAddingToExam(true);
    try {
      const res = await questionBankApi.addToExam(selectedExamId, [...selectedIds]);
      toast.success(res.message ?? `تم إضافة ${res.addedCount ?? selectedIds.size} سؤال إلى الامتحان.`);
      setSelectedIds(new Set());
      setExamModalOpen(false);
      setSelectedCourseId('');
      setSelectedExamId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر إضافة الأسئلة إلى الامتحان.');
    } finally {
      setAddingToExam(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <PageHeader
        id="qbank"
        icon={Database}
        title="بنك الأسئلة المركزي"
        subtitle="أنشئ أسئلتك مرة واحدة واستخدمها في أي عدد من الامتحانات العشوائية."
        action={
          <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
            سؤال جديد
          </Button>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-surface-card border border-surface-border">
        <div className="relative col-span-2 lg:col-span-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="بحث..."
            className="w-full bg-surface border border-surface-border rounded-lg pr-9 pl-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
          />
        </div>
        <select
          value={filterCourseId}
          onChange={(e) => {
            setFilterCourseId(e.target.value);
            setPage(1);
          }}
          className="bg-surface border border-surface-border rounded-lg px-2 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
        >
          <option value="">كل الكورسات</option>
          {teacherCourses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          className="bg-surface border border-surface-border rounded-lg px-2 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
        >
          <option value="">كل المستويات</option>
          <option value="EASY">سهل</option>
          <option value="MEDIUM">متوسط</option>
          <option value="HARD">صعب</option>
        </select>
        <input
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            setPage(1);
          }}
          placeholder="فلترة بالموضوع..."
          className="bg-surface border border-surface-border rounded-lg px-2 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-surface border border-surface-border rounded-lg px-2 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
        >
          <option value="createdAt">الأحدث أولاً</option>
          <option value="difficulty">المستوى</option>
          <option value="marks">الدرجة</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-xl bg-gold-500/10 border border-gold-500/30">
          <span className="text-xs text-gold-300 font-bold">{selectedIds.size} سؤال محدد</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setExamModalOpen(true)}
              leftIcon={<FilePlus className="w-3.5 h-3.5" />}
            >
              إضافة إلى امتحان
            </Button>
            <Button size="sm" variant="danger" onClick={handleBulkDelete} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
              حذف المحدد
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={Database}
          title="لا توجد أسئلة مطابقة"
          description="غيّر عوامل التصفية أو أضف أول سؤال لتبدأ في بناء بنك أسئلتك."
          action={
            <Button size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
              أضف أول سؤال
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {sections.map(([key, section]) => {
            const collapsed = collapsedSections.has(key);
            return (
              <section
                key={key}
                className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden"
              >
                {/* Section header — course title */}
                <button
                  type="button"
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-surface hover:bg-bg-elevated transition-colors text-right"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <FolderOpen className="w-4 h-4 text-gold-400 shrink-0" />
                    <span className="text-sm font-bold font-amiri text-gold-300 truncate">
                      {section.title}
                    </span>
                    <Badge variant="neutral">{section.items.length} سؤال</Badge>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-ivory-muted transition-transform duration-300 shrink-0 ${
                      collapsed ? '' : 'rotate-180'
                    }`}
                  />
                </button>

                {!collapsed && (
                  <ul className="divide-y divide-surface-border border-t border-surface-border">
                    {section.items.map((q) => (
                      <li key={q.id} className="group relative p-4 space-y-2 hover:bg-surface/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-start gap-3 flex-1 cursor-pointer">
                            <button
                              type="button"
                              onClick={() => toggleSelected(q.id)}
                              className="mt-0.5 shrink-0 text-gold-400"
                            >
                              {selectedIds.has(q.id) ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4 opacity-50" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-ivory">{q.text}</p>
                              <p className="text-[11px] mt-1">
                                <span className="text-emerald-400/80">✓ {q.options[q.correctOptionIndex]}</span>
                                {q.explanation && (
                                  <span className="text-ivory-muted"> — {q.explanation}</span>
                                )}
                              </p>
                            </div>
                          </label>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant={DIFFICULTY_BADGE[q.difficulty]}>{DIFFICULTY_AR[q.difficulty]}</Badge>
                            <Badge variant="neutral">{q.marks} درجة</Badge>
                            {q.topic && <Badge variant="neutral">{q.topic}</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-surface-border">
                          <button
                            type="button"
                            onClick={() => openEdit(q)}
                            className="p-1.5 rounded-lg text-ivory-muted hover:text-gold-400 hover:bg-surface transition-colors"
                            title="تعديل"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('حذف هذا السؤال؟')) return;
                              await questionBankApi.delete(q.id);
                              invalidate();
                            }}
                            className="p-1.5 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <span className="text-xs text-ivory-muted">
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

      {/* Create / Edit Modal */}
      {(creating || editing) && (
        <Modal
          isOpen
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          title={editing ? 'تعديل السؤال' : 'سؤال جديد'}
        >
          <form onSubmit={handleSave} className="space-y-3 text-right max-h-[65vh] overflow-y-auto p-1">
            {error && (
              <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</p>
            )}
            <Input label="نص السؤال" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} required />
            <div className="grid sm:grid-cols-2 gap-2">
              {draft.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={draft.correctOptionIndex === oi}
                    onChange={() => setDraft({ ...draft, correctOptionIndex: oi })}
                    className="accent-gold-500"
                  />
                  <input
                    type="text"
                    placeholder={`الخيار ${String.fromCharCode(65 + oi)}`}
                    value={opt}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        options: draft.options.map((o, i) => (i === oi ? e.target.value : o)),
                      })
                    }
                    className="flex-1 bg-bg border border-surface-border rounded-lg px-2 py-1.5 text-xs text-ivory focus:border-gold-500 outline-none"
                  />
                </label>
              ))}
            </div>
            <Input label="التوضيح (اختياري)" value={draft.explanation} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} />
            <div className="grid sm:grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="block text-xs text-ivory/90 font-cairo">المستوى</label>
                <select
                  value={draft.difficulty}
                  onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as DraftQuestion['difficulty'] })}
                  className="w-full bg-surface border border-surface-border rounded-lg px-2 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
                >
                  <option value="EASY">سهل</option>
                  <option value="MEDIUM">متوسط</option>
                  <option value="HARD">صعب</option>
                </select>
              </div>
              <Input label="الدرجة" type="number" min={1} value={draft.marks} onChange={(e) => setDraft({ ...draft, marks: Number(e.target.value) })} />
              <Input label="الموضوع (اختياري)" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <Input label="وسوم (افصل بفاصلة)" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
              <div className="space-y-1">
                <label className="block text-xs text-ivory/90 font-cairo">الكورس المرتبط (اختياري)</label>
                <select
                  value={draft.courseId}
                  onChange={(e) => setDraft({ ...draft, courseId: e.target.value })}
                  className="w-full bg-surface border border-surface-border rounded-lg px-2 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
                >
                  <option value="">بدون ربط</option>
                  {teacherCourses.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit" isLoading={saving}>حفظ</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Add-to-Exam Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={examModalOpen}
        onClose={() => {
          setExamModalOpen(false);
          setSelectedCourseId('');
          setSelectedExamId('');
        }}
        title={`إضافة ${selectedIds.size} سؤال إلى امتحان`}
        maxWidth="sm"
      >
        <div className="space-y-4 text-right">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ivory">١. اختر الكورس</label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedExamId('');
              }}
              className="w-full bg-surface border border-surface-border text-ivory rounded-xl px-3 py-2.5 text-xs outline-none focus:border-gold-400 cursor-pointer"
            >
              <option value="">اختر الكورس...</option>
              {teacherCourses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {selectedCourseId && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-ivory">٢. اختر الامتحان</label>
              {isLoadingCourseExams ? (
                <p className="text-xs text-ivory-muted py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" />
                  جاري تحميل الامتحانات...
                </p>
              ) : courseExams.length === 0 ? (
                <p className="text-[11px] text-amber-400/90">
                  لا توجد امتحانات في هذا الكورس — أنشئ امتحاناً أولاً من صفحة الامتحانات.
                </p>
              ) : (
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-surface border border-surface-border text-ivory rounded-xl px-3 py-2.5 text-xs outline-none focus:border-gold-400 cursor-pointer"
                >
                  <option value="">اختر الامتحان...</option>
                  {courseExams.map((exam: any) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} {!exam.isPublished ? '(مسودة)' : `(${exam._count?.questions ?? 0} سؤال)`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <Button variant="ghost" size="sm" onClick={() => setExamModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleAddToExam}
              isLoading={addingToExam}
              disabled={!selectedExamId || selectedIds.size === 0}
            >
              إضافة الأسئلة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
