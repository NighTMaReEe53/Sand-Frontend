import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Mail,
  Phone,
  BarChart3,
  BookOpen,
  Power,
  BadgeCheck,
  Pencil,
  Trash2,
  UserRoundSearch,
} from 'lucide-react';
import { studentsApi } from '../../api/students.api';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';
import type { AdminTeacherRow } from '../../api/students.api';

/** ADMIN: edit a teacher account in-place */
const EditTeacherModal: React.FC<{
  teacher: AdminTeacherRow;
  onClose: () => void;
  onSaved: () => void;
}> = ({ teacher, onClose, onSaved }) => {
  const [form, setForm] = useState({
    fullName: teacher.teacherProfile?.fullName ?? '',
    email: teacher.email ?? '',
    phone: teacher.phone ?? '',
    specialization: teacher.teacherProfile?.specialization ?? '',
    isActive: teacher.isActive,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await studentsApi.updateTeacher(teacher.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        specialization: form.specialization.trim(),
        isActive: form.isActive,
      });
      toast.success('تم تحديث بيانات المدرس بنجاح.');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر تحديث بيانات المدرس.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`تعديل بيانات — ${teacher.teacherProfile?.fullName ?? ''}`} maxWidth="lg">
      <form onSubmit={handleSave} className="space-y-4 text-right">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gold-300/90 mb-1.5">الاسم الكامل</label>
            <input
              value={form.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              required
              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gold-300/90 mb-1.5">التخصص</label>
            <input
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gold-300/90 mb-1.5">البريد الإلكتروني</label>
            <input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gold-300/90 mb-1.5">رقم الهاتف</label>
            <input
              dir="ltr"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              required
              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold-400"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-ivory cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="accent-gold-500 w-4 h-4"
          />
          الحساب نشط (يمكن للمدرس تسجيل الدخول)
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" size="sm" isLoading={saving}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const AdminTeachersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminTeacherRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-teachers', page, search],
    queryFn: () =>
      studentsApi.listTeachers({ page, limit: 12, search: search || undefined }),
  });

  const teachers = data?.teachers ?? [];
  const meta = data?.meta;

  const toggleStatus = async (userId: string, isActive: boolean) => {
    setTogglingId(userId);
    try {
      await studentsApi.setAccountStatus(userId, isActive);
      await queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
    } finally {
      setTogglingId(null);
    }
  };

  const deleteTeacher = async (t: AdminTeacherRow) => {
    const name = t.teacherProfile?.fullName ?? t.email;
    if (
      !window.confirm(
        `حذف حساب المدرس ${name} نهائياً؟ سيتم أرشفة كورساته ودروسه أيضاً ولا يمكن التراجع.`
      )
    )
      return;
    try {
      await studentsApi.deleteTeacher(t.id);
      toast.success('تم حذف حساب المدرس.');
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر حذف الحساب.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-right flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--line)] flex items-center justify-center" style={{ color: 'var(--primary)' }}>
              <Users className="w-5 h-5" />
            </span>
            إدارة المعلمين
          </h1>
          <p className="text-xs text-ivory-muted mt-1.5 mr-[52px]">
            {meta ? `${meta.total} معلم مسجل` : '…'} — ابحث ثم افتح ملف المتابعة الكامل لكل معلم
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ابحث بالاسم أو البريد أو الهاتف…"
            className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-surface border border-surface-border text-xs text-ivory placeholder:text-ivory-muted/60 focus:border-gold-400 outline-none transition-colors"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-2xl bg-surface-card border border-surface-border p-10 text-center text-sm text-ivory-muted">
          لا يوجد معلمون مطابقون.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teachers.map((t) => {
            const profile = t.teacherProfile;
            return (
              <div
                key={t.id}
                className="rounded-2xl bg-surface-card border border-surface-border p-5 flex flex-col gap-4 hover:border-gold-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {profile?.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover border border-gold-500/25"
                      />
                    ) : (
                      <span className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center font-bold text-gold-300 shrink-0">
                        {(profile?.fullName ?? '?')[0]}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{profile?.fullName ?? '—'}</p>
                      <p className="text-[11px] text-ivory-muted truncate">
                        {profile?.specialization ?? 'معلم'}
                      </p>
                    </div>
                  </div>

                  {user?.id !== t.id && (
                    <button
                      type="button"
                      onClick={() => toggleStatus(t.id, !t.isActive)}
                      disabled={togglingId === t.id}
                      title={t.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                      className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-colors disabled:opacity-50 ${
                        t.isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {t.isActive ? 'نشط' : 'موقوف'}
                    </button>
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-ivory-muted" dir="ltr">
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {t.email}
                  </p>
                  <p className="flex items-center gap-1.5" dir="ltr">
                    <Phone className="w-3 h-3 shrink-0" /> {t.phone}
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] text-ivory-muted">
                    {t.isVerified ? (
                      <>
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                        موثّق
                      </>
                    ) : (
                      'غير موثّق'
                    )}
                  </span>

                  <div className="flex gap-2 flex-wrap justify-end">
                    <Link to={`/dashboard/teachers/${t.id}`}>
                      <Button size="sm" leftIcon={<UserRoundSearch className="w-3.5 h-3.5" />}>
                        ملف المتابعة
                      </Button>
                    </Link>
                    <Link to={`/dashboard/analytics?teacherId=${t.id}`}>
                      <Button size="sm" variant="outline" leftIcon={<BarChart3 className="w-3.5 h-3.5" />}>
                        تحليلاته
                      </Button>
                    </Link>
                    <Link to={`/dashboard/courses?teacherId=${t.id}`}>
                      <Button size="sm" variant="outline" leftIcon={<BookOpen className="w-3.5 h-3.5" />}>
                        كورساته
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(t)}
                      leftIcon={<Pencil className="w-3.5 h-3.5" />}
                    >
                      تعديل
                    </Button>
                    {/* لا يمكن حذف أكونت الأدمن */}
                    {t.role !== 'ADMIN' && user?.id !== t.id && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteTeacher(t)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        حذف
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <span className="text-xs text-ivory-muted">
            صفحة {meta.page} من {meta.totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Admin: edit teacher modal */}
      {editing && (
        <EditTeacherModal
          teacher={editing}
          onClose={() => setEditing(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-teachers'] })}
        />
      )}
    </div>
  );
};
