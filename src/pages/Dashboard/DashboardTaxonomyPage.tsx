import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Network,
  Plus,
  Power,
  RotateCcw,
  Loader2,
  Flag,
  Layers,
  GraduationCap,
  BookOpen,
  School,
} from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '../../api/axiosInstance';
import type { EducationSystem, Subject } from '../../types/taxonomy.types';
import type { Course } from '../../types/course.types';
import { PageHeader, EmptyState } from '../../components/dashboard/PageHeader';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

interface AdminTaxonomyApi {
  get: (url: string) => Promise<{ data?: unknown } & unknown>;
}

const adminApi = axiosInstance as unknown as AdminTaxonomyApi;

export const DashboardTaxonomyPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [newSystem, setNewSystem] = useState({ code: '', name: '' });
  const [newSubject, setNewSubject] = useState({ code: '', name: '' });

  const { data: systems = [], isLoading } = useQuery({
    queryKey: ['admin-taxonomy-systems'],
    queryFn: async () => {
      const res = await adminApi.get('/education-systems');
      return ((res as { data?: unknown }).data ?? res) as EducationSystem[];
    },
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['admin-taxonomy-subjects'],
    queryFn: async () => {
      const res = await adminApi.get('/subjects');
      return ((res as { data?: unknown }).data ?? res) as Subject[];
    },
  });

  const { data: reviewQueue = [] } = useQuery({
    queryKey: ['admin-taxonomy-review'],
    queryFn: async () => {
      const res = await adminApi.get('/admin/taxonomy/review-queue');
      return ((res as { data?: unknown }).data ?? res) as Course[];
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-taxonomy-systems'] });
    void queryClient.invalidateQueries({ queryKey: ['taxonomy-systems'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-taxonomy-subjects'] });
  };

  const createEntity = async (
    path: string,
    body: Record<string, unknown>,
    key: string,
    reset: () => void,
  ) => {
    setBusy(key);
    try {
      await axiosInstance.post(path, body);
      toast.success('تم الإنشاء بنجاح');
      reset();
      invalidate();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'تعذر التنفيذ.';
      toast.error(message);
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (path: string, activate: boolean) => {
    setBusy(path + String(activate));
    try {
      await axiosInstance({
        method: activate ? 'patch' : 'delete',
        url: path,
      });
      toast.success(activate ? 'تم التفعيل' : 'تم الإيقاف');
      invalidate();
    } catch {
      toast.error('تعذر تنفيذ الطلب.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8 text-right">
      <PageHeader
        id="taxonomy"
        icon={Network}
        title="إدارة التصنيف التعليمي"
        subtitle="أنظمة ومراحل وصفوف وشُعب ومواد — إدارة كاملة من قاعدة البيانات بدون تعديل كود."
      />

      {/* Review queue */}
      <section className="relative overflow-hidden rounded-2xl bg-surface-card border border-amber-500/25">
        <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-amber-400/80 to-transparent" />
        <div className="p-4 space-y-3">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Flag className="w-4 h-4" />
            طابور مراجعة الاستهداف ({reviewQueue.length})
          </h2>
          <p className="text-[11px] text-ivory-muted leading-relaxed">
            كورسات قديمة لم يتمكن النظام من ربطها تلقائياً بالتصنيف الجديد — عدّلها من صفحة الكورس
            لتحديد الفئة المستهدفة يدوياً.
          </p>
          {reviewQueue.length === 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
              لا توجد كورسات تحتاج مراجعة — كل شيء مغطّى.
            </p>
          ) : (
            <ul className="divide-y divide-surface-border rounded-xl border border-surface-border overflow-hidden">
              {reviewQueue.slice(0, 10).map((c) => (
                <li key={c.id} className="px-3.5 py-2.5 bg-bg-elevated text-xs flex items-center justify-between gap-3">
                  <span className="font-bold text-ivory truncate">{c.title}</span>
                  <span dir="ltr" className="text-[10px] font-mono text-ivory-muted shrink-0">{String(c.gradeLevel)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Systems tree */}
      <section className="rounded-2xl bg-surface-card border border-surface-border p-4 space-y-4">
        <h2 className="text-sm font-bold text-gold-300 flex items-center gap-2">
          <School className="w-4 h-4" />
          الأنظمة التعليمية والمراحل والصفوف
        </h2>

        {/* Create system */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <input
            value={newSystem.code}
            onChange={(e) => setNewSystem((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            placeholder="CODE (مثال: STEM_SYSTEM)"
            dir="ltr"
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none text-left"
          />
          <input
            value={newSystem.name}
            onChange={(e) => setNewSystem((p) => ({ ...p, name: e.target.value }))}
            placeholder="الاسم بالعربية"
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
          />
          <Button
            size="sm"
            isLoading={busy === 'system'}
            disabled={!newSystem.code || !newSystem.name}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() =>
              createEntity('/admin/taxonomy/systems', { code: newSystem.code, name: newSystem.name }, 'system', () =>
                setNewSystem({ code: '', name: '' }),
              )
            }
          >
            نظام جديد
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {systems.map((sys) => (
              <details key={sys.id} className="group rounded-xl border border-surface-border overflow-hidden">
                <summary className="cursor-pointer select-none px-4 py-3 bg-surface/60 hover:bg-surface transition-colors flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Layers className={`w-4 h-4 ${sys.isActive ? 'text-gold-400' : 'text-ivory-dark'}`} />
                    <span className="text-sm font-bold text-ivory truncate">{sys.name}</span>
                    <span dir="ltr" className="text-[10px] font-mono text-ivory-muted/70">{sys.code}</span>
                    {!sys.isActive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                        موقوف
                      </span>
                    )}
                    <span className="text-[10px] text-ivory-muted">· {(sys.stages ?? []).length} مرحلة</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title={sys.isActive ? 'إيقاف' : 'تفعيل'}
                      onClick={(e) => {
                        e.preventDefault();
                        if (busy) return;
                        void toggleActive(`/admin/taxonomy/systems/${sys.id}${sys.isActive ? '' : '/activate'}`, !sys.isActive);
                      }}
                      className="p-1.5 rounded-lg text-ivory-muted hover:text-gold-300 hover:bg-gold-500/10 transition-colors"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : sys.isActive ? <Power className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    </button>
                  </span>
                </summary>

                <div className="p-3 space-y-1.5 border-t border-surface-border">
                  {(sys.stages ?? []).map((stage) => (
                    <StageNode key={stage.id} stage={stage} busy={busy !== null} onToggle={toggleActive} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* Subjects */}
      <section className="rounded-2xl bg-surface-card border border-surface-border p-4 space-y-4">
        <h2 className="text-sm font-bold text-gold-300 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          المواد الدراسية
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <input
            value={newSubject.code}
            onChange={(e) => setNewSubject((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            placeholder="CODE (مثال: ARABIC)"
            dir="ltr"
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none text-left"
          />
          <input
            value={newSubject.name}
            onChange={(e) => setNewSubject((p) => ({ ...p, name: e.target.value }))}
            placeholder="اسم المادة بالعربية"
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-ivory focus:border-gold-500 outline-none"
          />
          <Button
            size="sm"
            isLoading={busy === 'subject'}
            disabled={!newSubject.code || !newSubject.name}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() =>
              createEntity('/admin/taxonomy/subjects', { code: newSubject.code, name: newSubject.name }, 'subject', () =>
                setNewSubject({ code: '', name: '' }),
              )
            }
          >
            مادة جديدة
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <span
              key={s.id}
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                s.isActive
                  ? 'bg-gold-500/10 border-gold-500/25 text-gold-300'
                  : 'bg-red-500/10 border-red-500/25 text-red-400 line-through'
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              {s.name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

const StageNode: React.FC<{
  stage: { id: string; name: string; isActive: boolean };
  busy: boolean;
  onToggle: (path: string, activate: boolean) => Promise<void>;
}> = ({ stage, busy, onToggle }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-bg-elevated border border-surface-border">
    <span className="flex items-center gap-2 min-w-0">
      <GraduationCap className="w-3.5 h-3.5 text-gold-400/70 shrink-0" />
      <span className={`text-xs font-bold truncate ${stage.isActive ? 'text-ivory' : 'text-ivory-dark line-through'}`}>
        {stage.name}
      </span>
    </span>
    <button
      type="button"
      disabled={busy}
      onClick={() => void onToggle(`/admin/taxonomy/stages/${stage.id}`, false)}
      className="p-1.5 rounded-lg text-ivory-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 shrink-0"
      title="إيقاف المرحلة"
    >
      <Power className="w-3.5 h-3.5" />
    </button>
  </div>
);

export default DashboardTaxonomyPage;
