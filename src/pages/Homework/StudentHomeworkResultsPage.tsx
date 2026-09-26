import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  ListChecks,
  ArrowRight,
  Loader2,
  ChevronDown,
  Check,
  PenLine,
  Eye,
} from 'lucide-react';
import { homeworkApi, StudentHomeworkResult } from '../../api/homework.api';
import { Button } from '../../components/ui/Button';

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const formatDuration = (startedAt?: string | null, submittedAt?: string | null) => {
  if (!startedAt || !submittedAt) return '—';
  return `${Math.max(0, Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 60000))} دقيقة`;
};

/* ── Scoped motion for the collapsible sections (no shapes, just smooth transitions) ── */
const DecorStyles: React.FC = () => (
  <style>{`
    .hw-accordion-body { transition: grid-template-rows 420ms cubic-bezier(0.4, 0, 0.2, 1); display: grid; }
    .hw-accordion-inner { transition: opacity 320ms ease, transform 360ms cubic-bezier(0.4, 0, 0.2, 1); }
  `}</style>
);

const CourseGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
    <path
      d="M8 12c0-2 2-3 5-3h22c3 0 5 1 5 3v24c0 2-2 3-5 3H13c-3 0-5-1-5-3V12Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M16 11v26M32 13c-3 2-6 2-9 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="34" cy="34" r="7" fill="currentColor" opacity="0.18" />
    <path d="M34 31l2 2.5L38 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Status badge ──────────────────────────────────────────────────── */
type Badge = { label: string; cls: string; icon: React.ReactNode };
const getBadge = (r: StudentHomeworkResult): Badge => {
  if (r.status === 'IN_PROGRESS')
    return { label: 'مسودة غير مسلَّمة', cls: 'bg-surface text-ivory-muted border-surface-border', icon: <Loader2 className="w-3 h-3" /> };
  if (r.essayPendingCount > 0)
    return { label: 'قيد المراجعة', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40', icon: <Clock className="w-3 h-3" /> };
  if (r.isPassed)
    return { label: 'ناجح', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40', icon: <CheckCircle2 className="w-3 h-3" /> };
  return { label: 'راسب', cls: 'bg-red-500/15 text-red-400 border-red-500/40', icon: <XCircle className="w-3 h-3" /> };
};

/* ── Score ring (SVG) ──────────────────────────────────────────────── */
const ScoreRing: React.FC<{ score: number | null; passed: boolean | null }> = ({ score, passed }) => {
  const pct = score ?? 0;
  const color = score === null ? '#f0b429' : passed ? '#34d399' : '#f87171';
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative w-[78px] h-[78px] shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score === null ? <Clock className="w-4 h-4 text-amber-400" /> : <span className="text-base font-black" style={{ color }}>{pct}%</span>}
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number | string; cls?: string }> = ({ label, value, cls }) => (
  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface/60 border border-surface-border">
    <span className={`text-sm font-black ${cls ?? 'text-ivory'}`}>{value}</span>
    <span className="text-[10px] text-ivory-muted mt-0.5 text-center leading-tight">{label}</span>
  </div>
);

/* ── Single homework result card ───────────────────────────────────── */
const ResultCard: React.FC<{
  r: StudentHomeworkResult;
  index: number;
  onOpen: (r: StudentHomeworkResult) => void;
  onAnswers: (r: StudentHomeworkResult) => void;
}> = ({ r, index, onOpen, onAnswers }) => {
  const badge = getBadge(r);
  return (
    <div
      className="animate-sub-fade group rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/30 hover:shadow-sm transition-all duration-300 overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
    >
      <div className="h-1 w-full bg-gold-500/25" />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-ivory-muted truncate flex items-center gap-1"><PenLine className="w-3 h-3" /> {r.lessonTitle}</p>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${badge.cls}`}>{badge.icon}{badge.label}</span>
        </div>

        <div className="flex items-center gap-4">
          <ScoreRing score={r.score} passed={r.isPassed} />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-ivory leading-snug line-clamp-2 group-hover:text-gold-300 transition-colors">{r.title}</h3>
            <p className="text-[11px] text-ivory-muted mt-1 flex items-center gap-1">محاولة #{r.attemptNumber} • {formatDate(r.submittedAt)} • الوقت: {formatDuration(r.startedAt, r.submittedAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="الأسئلة" value={r.questionsCount} />
          <MiniStat label="أجاب" value={r.answeredCount} cls="text-violet-300" />
          <MiniStat label="صحيح" value={r.correctCount} cls="text-emerald-400" />
          <MiniStat label="مراجعة" value={r.essayPendingCount} cls={r.essayPendingCount > 0 ? 'text-amber-400' : 'text-ivory-muted'} />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onAnswers(r)} leftIcon={<Eye className="w-3.5 h-3.5" />}>
            عرض إجاباتي
          </Button>
          <Button size="sm" variant="primary" className="flex-1" onClick={() => onOpen(r)} leftIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            فتح الواجب
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Creative course select (dropdown) ────────────────────────────── */
const CourseDropdown: React.FC<{
  value: string;
  onChange: (id: string) => void;
  courses: { id: string; title: string }[];
}> = ({ value, onChange, courses }) => {
  const [open, setOpen] = useState(false);
  const selected = courses.find((c) => c.id === value) ?? courses[0];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full sm:w-72 flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/40 transition-colors text-right"
      >
        <span className="w-9 h-9 rounded-xl bg-surface border border-surface-border flex items-center justify-center shrink-0">
          <CourseGlyph className="w-5 h-5 text-gold-300" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] text-ivory-muted">الكورس</span>
          <span className="block text-sm font-bold text-ivory truncate">{selected?.title}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-ivory-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button type="button" aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-2 w-full sm:w-72 rounded-2xl bg-surface-card border border-surface-border shadow-sm p-1.5 max-h-72 overflow-y-auto custom-scrollbar animate-sub-fade">
            {courses.map((c) => {
              const active = c.id === value;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-colors ${active ? 'bg-gold-500/15 text-gold-300' : 'text-ivory-muted hover:bg-surface hover:text-ivory'}`}
                >
                  <CourseGlyph className={`w-5 h-5 shrink-0 ${active ? 'text-gold-300' : 'text-ivory-muted'}`} />
                  <span className="flex-1 text-sm font-bold truncate">{c.title}</span>
                  {active && <Check className="w-4 h-4 text-gold-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Collapsible course accordion item ────────────────────────────── */
const CourseAccordionItem: React.FC<{
  courseTitle: string;
  items: StudentHomeworkResult[];
  open: boolean;
  onToggle: () => void;
  onOpen: (r: StudentHomeworkResult) => void;
  onAnswers: (r: StudentHomeworkResult) => void;
}> = ({ courseTitle, items, open, onToggle, onOpen, onAnswers }) => {
  const avg = (() => {
    const scored = items.filter((i) => i.score !== null);
    return scored.length ? Math.round(scored.reduce((s, i) => s + (i.score ?? 0), 0) / scored.length) : null;
  })();
  const passed = items.filter((i) => i.isPassed).length;
  return (
    <div
      className={`animate-sub-fade rounded-2xl bg-surface-card/70 border overflow-hidden transition-colors duration-300 ${
        open ? 'border-gold-500/30 shadow-sm' : 'border-surface-border'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-right hover:bg-surface/60 transition-colors"
      >
        <span className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center shrink-0">
          <CourseGlyph className="w-5 h-5 text-gold-300" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-ivory truncate">{courseTitle}</h2>
          <p className="text-[11px] text-ivory-muted mt-0.5">{items.length} واجب • {passed} ناجح{avg !== null ? ` • متوسط ${avg}%` : ''}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-gold-300 text-sm font-black">
            <Trophy className="w-4 h-4" />{avg !== null ? `${avg}%` : '—'}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-ivory-muted transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${open ? 'rotate-180 text-gold-300' : ''}`}
          />
        </div>
      </button>

      {/* Thin reveal bar that grows under the header when the section opens */}
      <div className="px-4">
        <div className={`h-px bg-gradient-to-l from-transparent via-gold-500/40 to-transparent transition-all duration-500 ${open ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} />
      </div>

      <div
        className="hw-accordion-body"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div
            className="hw-accordion-inner p-4 pt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            style={{ opacity: open ? 1 : 0, transform: open ? 'translateY(0)' : 'translateY(-6px)' }}
          >
            {items.map((r, i) => (
              <ResultCard key={r.attemptId} r={r} index={i} onOpen={onOpen} onAnswers={onAnswers} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Page ─────────────────────────────────────────────────────────── */
export const StudentHomeworkResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['student-homework-results'],
    queryFn: () => homeworkApi.getStudentResults(),
    staleTime: 1000 * 30,
  });

  const results: StudentHomeworkResult[] = data?.results ?? [];
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set(results.length ? [results[0].courseId] : []));

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    results.forEach((r) => map.set(r.courseId, r.courseTitle));
    const list = Array.from(map.entries()).map(([id, title]) => ({ id, title }));
    return [{ id: 'all', title: 'كل الكورسات' }, ...list];
  }, [results]);

  const filtered = courseFilter === 'all' ? results : results.filter((r) => r.courseId === courseFilter);

  const grouped = useMemo(() => {
    const map = new Map<string, StudentHomeworkResult[]>();
    filtered.forEach((r) => {
      if (!map.has(r.courseId)) map.set(r.courseId, []);
      map.get(r.courseId)!.push(r);
    });
    return Array.from(map.entries()).map(([cid, items]) => ({
      courseId: cid,
      courseTitle: items[0].courseTitle,
      items,
    }));
  }, [filtered]);

  const passedCount = filtered.filter((r) => r.isPassed).length;
  const reviewCount = filtered.filter((r) => r.essayPendingCount > 0).length;
  const scored = filtered.filter((r) => r.score !== null);
  const avg = scored.length ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length) : null;

  const toggle = (cid: string) =>
    setOpenSet((prev) => {
      const n = new Set(prev);
      if (n.has(cid)) n.delete(cid);
      else n.add(cid);
      return n;
    });

  const open = (r: StudentHomeworkResult) => navigate(`/courses/${r.courseId}/learn/homework/${r.lessonId}`);
  const openAnswers = (r: StudentHomeworkResult) => navigate(`/courses/${r.courseId}/learn/homework/${r.lessonId}/result/${r.attemptId}`);

  return (
    <div className="relative">
      <DecorStyles />

      {/* Respectable outer container that holds the whole page content — calm, flat, easy on the eye */}
      <div className="space-y-6 bg-surface-card/40 p-4 sm:p-6 lg:p-8">
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl border border-surface-border hover:border-gold-500/40 text-ivory-muted hover:text-ivory transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <ClipboardList className="w-5 h-5 text-violet-400" />
                نتائج الواجبات
              </h1>
              <p className="text-xs text-ivory-muted mt-1.5">
                كل واجباتك مُرتّبة في أقسام قابلة للطي — اختر الكورس من الأعلى.
              </p>
            </div>
          </div>

          {/* Toolbar: creative course select + summary */}
          <div className="mt-4 rounded-3xl bg-surface-card border border-surface-border p-3 sm:p-4 flex flex-wrap items-stretch gap-3">
            <CourseDropdown value={courseFilter} onChange={setCourseFilter} courses={courses} />
            <div className="flex-1 grid grid-cols-3 gap-2 min-w-[240px]">
              {[
                { label: 'متوسط', value: avg !== null ? `${avg}%` : '—', color: 'text-violet-300' },
                { label: 'ناجح', value: passedCount, color: 'text-emerald-400' },
                { label: 'مراجعة', value: reviewCount, color: 'text-amber-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-surface-card border border-surface-border px-3 py-2 flex flex-col items-center justify-center">
                  <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] text-ivory-muted">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible course sections — each is its own container */}
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-16 rounded-3xl bg-surface-card border border-surface-border"><Loader2 className="w-7 h-7 animate-spin text-gold-400" /></div>
            ) : error ? (
              <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400">
                <XCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">تعذر تحميل نتائج الواجبات.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-12 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3">
                <ListChecks className="w-12 h-12 mx-auto text-ivory-muted/30" />
                <p className="text-sm text-ivory-muted">لم تحل أي واجب بعد — ابدأ من صفحة كورسك!</p>
                <Button size="sm" variant="primary" onClick={() => navigate('/my-courses')} leftIcon={<ArrowRight className="w-3.5 h-3.5" />}>كورساتي</Button>
              </div>
            ) : grouped.length === 0 ? (
              <div className="p-10 rounded-3xl bg-surface-card border border-surface-border text-center text-sm text-ivory-muted">لا توجد واجبات مطابقة للكورس المختار.</div>
            ) : (
              grouped.map((g) => (
                <CourseAccordionItem
                  key={g.courseId}
                  courseTitle={g.courseTitle}
                  items={g.items}
                  open={courseFilter === 'all' ? openSet.has(g.courseId) : true}
                  onToggle={() => toggle(g.courseId)}
                  onOpen={open}
                  onAnswers={openAnswers}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHomeworkResultsPage;
