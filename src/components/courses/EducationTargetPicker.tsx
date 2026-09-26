import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, Layers, Plus, X, Loader2, Pencil, Check, Target } from 'lucide-react';
import { taxonomyApi } from '../../api/taxonomy.api';
import type { CourseTargetRef, TargetInput } from '../../types/taxonomy.types';

/**
 * §9.1.1 — Reusable cascading target picker (System → Stage → Grade → Track).
 * Used by BOTH Create Course and Edit Course. Owns its own select state and
 * only emits a clean `{ gradeId, trackId|null }[]` upward via onChange.
 *
 * Create mode: draft targets accumulate and are saved with the course.
 * Edit mode (onAddSaved/onUpdateSaved/onRemoveSaved provided): changes apply
 * immediately against the server and green chips become editable/deletable.
 */
export const EducationTargetPicker: React.FC<{
  existingTargets?: CourseTargetRef[];
  targets: TargetInput[];
  onChange: (targets: TargetInput[]) => void;
  error?: string | null;
  /** When provided (edit mode), "+ Add target" applies instantly via API */
  onAddSaved?: (input: TargetInput) => Promise<void>;
  /** When provided (edit mode), saved target chips get a delete (X) button */
  onRemoveSaved?: (targetId: string) => Promise<void>;
  /** When provided (edit mode), saved target chips get an edit (pencil) button */
  onUpdateSaved?: (targetId: string, input: TargetInput) => Promise<void>;
}> = ({ existingTargets = [], targets, onChange, error, onAddSaved, onRemoveSaved, onUpdateSaved }) => {
  // Draft selects — pushed into `targets` only on "+ Add target"
  const [systemId, setSystemId] = useState('');
  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [trackId, setTrackId] = useState('');

  /** Saved target currently being edited inline */
  const [editingSaved, setEditingSaved] = useState<CourseTargetRef | null>(null);
  const [busy, setBusy] = useState(false);

  /** Human-readable labels captured at add-time so chips never show raw ids */
  const [labels, setLabels] = useState<Record<string, string>>({});
  const rememberLabel = (key: string) => {
    const gradeName = selectedGrade?.name ?? '';
    const trackName = tracks.find((tr) => tr.id === trackId)?.name ?? '';
    setLabels((prev) => ({ ...prev, [key]: trackName ? `${gradeName} · ${trackName}` : gradeName }));
  };
  const labelFor = (t: TargetInput, i: number) =>
    labels[`${t.gradeId}:${t.trackId ?? ''}`] ?? `استهداف ${i + 1}`;

  const { data: systems = [], isLoading: loadingSystems } = useQuery({
    queryKey: ['taxonomy-systems'],
    queryFn: taxonomyApi.listSystems,
    staleTime: 1000 * 60 * 30,
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['taxonomy-stages', systemId],
    queryFn: () => taxonomyApi.listStages(systemId),
    enabled: !!systemId,
    staleTime: 1000 * 60 * 30,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['taxonomy-grades', stageId],
    queryFn: () => taxonomyApi.listGrades(stageId),
    enabled: !!stageId,
    staleTime: 1000 * 60 * 30,
  });

  const selectedGrade = grades.find((g) => g.id === gradeId);
  const tracks = selectedGrade?.tracks ?? [];
  const gradeNeedsTrack = gradeRowHasTracks(selectedGrade);
  const editingSavedId = editingSaved?.id ?? null;

  /** Client-side duplicate check against already-added + existing course targets */
  const isDuplicate = useMemo(() => {
    if (!gradeId) return false;
    const key = `${gradeId}:${gradeRowHasTracks(selectedGrade) ? trackId : ''}`;
    const inNew = targets.some((t) => `${t.gradeId}:${t.trackId ?? ''}` === key);
    const inExisting = existingTargets.some(
      (t) => t.id !== editingSavedId && `${t.grade.id}:${t.track ? t.track.id : ''}` === key,
    );
    return inNew || inExisting;
  }, [gradeId, trackId, targets, existingTargets, selectedGrade, editingSavedId]);

  const canSelect =
    gradeId && (!gradeNeedsTrack || Boolean(trackId)) && !isDuplicate && !busy;
  const canAdd = canSelect && !editingSaved;
  const canSaveEdit = canSelect && editingSaved;

  const resetDraft = () => {
    setGradeId('');
    setTrackId('');
  };

  const handleAdd = async () => {
    if (!canAdd) return;
    const input: TargetInput = { gradeId, trackId: gradeNeedsTrack ? trackId : null };
    if (onAddSaved) {
      setBusy(true);
      try {
        await onAddSaved(input);
        rememberLabel(`${input.gradeId}:${input.trackId ?? ''}`);
        resetDraft();
      } catch {
        /* toast shown upstream — keep selections for retry */
      } finally {
        setBusy(false);
      }
      return;
    }
    rememberLabel(`${input.gradeId}:${input.trackId ?? ''}`);
    onChange([...targets, input]);
    resetDraft();
  };

  const handleStartEditSaved = (t: CourseTargetRef) => {
    setEditingSaved(t);
    setSystemId(t.grade.stage?.educationSystem?.id ?? '');
    setStageId(t.grade.stageId ?? '');
    setGradeId(t.grade.id);
    setTrackId(t.track?.id ?? '');
  };

  const cancelEditSaved = () => {
    setEditingSaved(null);
    setSystemId('');
    setStageId('');
    resetDraft();
  };

  const handleSaveEdited = async () => {
    if (!canSaveEdit || !onUpdateSaved) return;
    const input: TargetInput = { gradeId, trackId: gradeNeedsTrack ? trackId : null };
    setBusy(true);
    try {
      await onUpdateSaved(editingSaved.id, input);
      setEditingSaved(null);
      setSystemId('');
      setStageId('');
      resetDraft();
    } catch {
      /* toast shown upstream — keep selections for retry */
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveSaved = async (targetId: string) => {
    if (!onRemoveSaved || busy) return;
    if (editingSaved?.id === targetId) cancelEditSaved();
    setBusy(true);
    try {
      await onRemoveSaved(targetId);
    } finally {
      setBusy(false);
    }
  };

  const selectCls =
    'w-full appearance-none bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-ivory outline-none focus:border-gold-400 font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="rounded-2xl border border-surface-border bg-surface/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-gold-300">
        <Target className="w-4 h-4" />
        <div>
          <h4 className="text-sm font-bold font-display">الفئة المستهدفة</h4>
          <p className="text-[11px] text-ivory-muted">يمكنك اختيار أكثر من صف أو شعبة لهذا الكورس.</p>
        </div>
      </div>

      {/* Selected target chips */}
      {(targets.length > 0 || existingTargets.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {existingTargets.map((t) => (
            <span
              key={`saved-${t.id}`}
              title={onRemoveSaved ? 'محفوظ على السيرفر — يمكن تعديله أو حذفه' : 'محفوظ حالياً على السيرفر'}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                editingSaved?.id === t.id
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <Layers className="w-3 h-3" />
              {t.grade.name}
              {t.track ? ` · ${t.track.name}` : ''}
              {onUpdateSaved && (
                <button
                  type="button"
                  onClick={() => handleStartEditSaved(t)}
                  disabled={busy}
                  className="hover:text-gold-300 transition-colors disabled:opacity-40"
                  aria-label="تعديل الاستهداف"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {onRemoveSaved && (
                <button
                  type="button"
                  onClick={() => handleRemoveSaved(t.id)}
                  disabled={busy}
                  className="hover:text-red-400 transition-colors disabled:opacity-40"
                  aria-label="حذف الاستهداف"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {targets.map((t, i) => (
            <span
              key={`new-${i}`}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/35 text-gold-300"
            >
              <Layers className="w-3 h-3" />
              {labelFor(t, i)}
              <button
                type="button"
                onClick={() => onChange(targets.filter((_, idx) => idx !== i))}
                className="hover:text-red-400 transition-colors"
                aria-label="حذف الاستهداف"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Cascading selects */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="relative col-span-2 sm:col-span-1">
          <select
            value={systemId}
            onChange={(e) => {
              setSystemId(e.target.value);
              setStageId('');
              setGradeId('');
              setTrackId('');
            }}
            className={selectCls}
          >
            <option value="">نظام التعليم…</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={stageId}
            disabled={!systemId}
            onChange={(e) => {
              setStageId(e.target.value);
              setGradeId('');
              setTrackId('');
            }}
            className={selectCls}
          >
            <option value="">المرحلة…</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={gradeId}
            disabled={!stageId}
            onChange={(e) => {
              setGradeId(e.target.value);
              setTrackId('');
            }}
            className={selectCls}
          >
            <option value="">الصف…</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted pointer-events-none" />
        </div>

        {/* Track select hidden ENTIRELY when the grade has no tracks (§9.1 rule) */}
        {gradeNeedsTrack && (
          <div className="relative">
            <select
              value={trackId}
              disabled={!gradeId}
              onChange={(e) => setTrackId(e.target.value)}
              className={selectCls}
            >
              <option value="">الشعبة…</option>
              {tracks.map((tr) => (
                <option key={tr.id} value={tr.id}>{tr.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted pointer-events-none" />
          </div>
        )}
      </div>

      {loadingSystems && (
        <p className="flex items-center gap-1.5 text-[11px] text-ivory-muted">
          <Loader2 className="w-3 h-3 animate-spin" /> جاري تحميل الأنظمة التعليمية…
        </p>
      )}

      {isDuplicate && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <AlertCircle className="w-3 h-3" />
          هذا الاستهداف مضاف بالفعل.
        </p>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {editingSaved ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveEdited}
            disabled={!canSaveEdit}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            حفظ تعديل الاستهداف
          </button>
          <button
            type="button"
            onClick={cancelEditSaved}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-surface-border text-ivory-muted hover:text-ivory transition-colors disabled:opacity-40"
          >
            إلغاء
          </button>
          <span className="text-[11px] text-sky-300/80">جاري تعديل استهداف محفوظ…</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy && onAddSaved ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          إضافة استهداف
        </button>
      )}
    </div>
  );
};

const gradeRowHasTracks = (grade?: { hasTracks: boolean } | null): boolean =>
  Boolean(grade?.hasTracks);
