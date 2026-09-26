import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  SearchX,
  GraduationCap,
  FileQuestion,
  ClipboardList,
  BookOpen,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ShieldOff,
  ShieldCheck,
  FileText,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';
import { studentsApi, StudentSearchResult } from '../../api/students.api';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../lib/utils';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { AttemptSheetModal, SheetTarget } from '../../components/dashboard/AttemptSheetModal';
import { Modal } from '../../components/ui/Modal';

const DEBOUNCE_MS = 300;

const GRADE_OPTIONS: [string, string][] = [
  ['PREP_1', '1 إعدادي'],
  ['PREP_2', '2 إعدادي'],
  ['PREP_3', '3 إعدادي'],
  ['SEC_1', '1 ثانوي'],
  ['SEC_2', '2 ثانوي'],
  ['SEC_3_LITERARY', '3ث أدبي'],
  ['SEC_3_SCIENTIFIC', '3ث علمي'],
  ['AZHAR_PREP', 'أزهري إعدادي'],
  ['AZHAR_SEC', 'أزهري ثانوي'],
  ['BAC', 'بكالوريا'],
];

/** ADMIN: edit a student account in-place */
const EditStudentModal: React.FC<{
  student: StudentSearchResult;
  onClose: () => void;
  onSaved: () => void;
}> = ({ student, onClose, onSaved }) => {
  const [form, setForm] = useState({
    fullName: student.fullName ?? '',
    email: student.email ?? '',
    studentPhone: student.phone ?? '',
    guardianPhone: student.guardianPhone ?? '',
    gradeLevel: student.gradeLevel ?? 'SEC_1',
    isActive: student.isActive !== false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await studentsApi.updateStudent(student.userId, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        studentPhone: form.studentPhone.trim(),
        guardianPhone: form.guardianPhone.trim(),
        gradeLevel: form.gradeLevel,
        isActive: form.isActive,
      });
      toast.success('تم تحديث بيانات الطالب بنجاح.');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر تحديث بيانات الطالب.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`تعديل بيانات — ${student.fullName}`} maxWidth="lg">
      <form onSubmit={handleSave} className="space-y-4 text-right">
        <div>
          <label className="block text-xs font-bold text-gold-300/90 mb-1.5">الاسم الكامل</label>
          <input
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            required
            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold-400"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="block text-xs font-bold text-gold-300/90 mb-1.5">هاتف الطالب</label>
            <input
              dir="ltr"
              value={form.studentPhone}
              onChange={(e) => set('studentPhone', e.target.value)}
              required
              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gold-300/90 mb-1.5">هاتف ولي الأمر</label>
            <input
              dir="ltr"
              value={form.guardianPhone}
              onChange={(e) => set('guardianPhone', e.target.value)}
              required
              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gold-300/90 mb-1.5">المرحلة الدراسية</label>
            <select
              value={form.gradeLevel}
              onChange={(e) => set('gradeLevel', e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold-400 cursor-pointer"
            >
              {GRADE_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-ivory cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="accent-gold-500 w-4 h-4"
          />
          الحساب نشط (يمكن للطالب تسجيل الدخول)
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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'SUBMITTED')
    return (
      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> مُسلّم
      </span>
    );
  if (status === 'IN_PROGRESS')
    return (
      <span className="text-[10px] text-amber-400 flex items-center gap-1">
        <Clock className="w-3 h-3" /> قيد الأداء
      </span>
    );
  return (
    <span className="text-[10px] text-red-400 flex items-center gap-1">
      <XCircle className="w-3 h-3" /> منتهي
    </span>
  );
};

const StudentCard: React.FC<{
  student: StudentSearchResult;
  isAdmin: boolean;
  onToggleStatus: (s: StudentSearchResult) => void;
  onOpenSheet: (t: NonNullable<SheetTarget>) => void;
  onEdit: (s: StudentSearchResult) => void;
  onDelete: (s: StudentSearchResult) => void;
}> = ({ student, isAdmin, onToggleStatus, onOpenSheet, onEdit, onDelete }) => {
  const passedExams =
    student.examAttempts.filter((a) => a.isPassed && a.status === 'SUBMITTED').length ?? 0;
  const submittedExams = student.examAttempts.filter((a) => a.status !== 'IN_PROGRESS').length;

  return (
    <div
      id={`student-${student.userId}`}
      className="group relative overflow-hidden p-6 rounded-2xl bg-surface-card border border-gold-500/25 hover:border-gold-500/50 transition-all duration-300 space-y-5 shadow-card-dark scroll-mt-24 hover:shadow-xl"
    >
      {/* Top accent line */}
      <span className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-l from-transparent via-gold-500/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-[1]">
      {/* Identity */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 p-0.5 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-bg flex items-center justify-center text-gold-300 font-display font-bold text-xl">
              {student.fullName?.[0] || '?'}
            </div>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold font-display text-ivory truncate">
                {student.fullName}
              </h3>
              {student.isActive === false ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                  <ShieldOff className="w-3 h-3" />
                  حساب موقوف
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  حساب نشط
                </span>
              )}
            </div>
            {student.gradeLevel && (
              <p className="text-xs text-gold-400 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                المرحلة
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ivory-muted pt-0.5">
              {student.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gold-400" />
                  <span dir="ltr">{student.phone}</span>
                </span>
              )}
              {student.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-gold-400" />
                  {student.email}
                </span>
              )}
              {student.guardianPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gold-400" />
                  ولي الأمر: <span dir="ltr">{student.guardianPhone}</span>
                </span>
              )}
              {student.memberSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gold-400" />
                  عضو منذ {formatDate(student.memberSince)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-4 text-center shrink-0">
          <div>
            <p className="text-lg font-bold font-display text-gold-300 tabular-nums">
              {student.courses.length}
            </p>
            <p className="text-[10px] text-ivory-muted">كورسات</p>
          </div>
          <div>
            <p className="text-lg font-bold font-display text-emerald-400 tabular-nums">
              {passedExams}/{submittedExams}
            </p>
            <p className="text-[10px] text-ivory-muted">امتحانات ناجحة</p>
          </div>
          <div>
            <p className="text-lg font-bold font-display text-gold-300 tabular-nums">
              {student.quizAttempts.length}
            </p>
            <p className="text-[10px] text-ivory-muted">محاولات كويز</p>
          </div>
        </div>
      </div>

      {/* Courses with enrollment status */}
      {student.courses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {student.courses.map((c) => (
            <span
              key={c.id}
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${
                c.enrollmentStatus === 'ACTIVE'
                  ? 'bg-bg-elevated border-surface-border text-ivory-muted'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
              title={c.enrollmentStatus === 'ACTIVE' ? 'اشتراك نشط' : 'اشتراك قيد المراجعة'}
            >
              <BookOpen className="w-3 h-3 text-gold-400" />
              {c.title}
              {c.enrollmentStatus !== 'ACTIVE' && ' (قيد المراجعة)'}
            </span>
          ))}
        </div>
      )}

      {/* Admin: account management actions */}
      {isAdmin && (
        <div className="flex justify-end gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(student)}
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
          >
            تعديل البيانات
          </Button>
          <Button
            size="sm"
            variant={student.isActive === false ? 'primary' : 'danger'}
            onClick={() => onToggleStatus(student)}
            leftIcon={
              student.isActive === false ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldOff className="w-3.5 h-3.5" />
              )
            }
          >
            {student.isActive === false ? 'تنشيط الحساب' : 'إيقاف الحساب'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onDelete(student)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            حذف الحساب
          </Button>
        </div>
      )}

      {/* Exams */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
          <FileQuestion className="w-3.5 h-3.5" /> الامتحانات
        </h4>
        {student.examAttempts.length === 0 ? (
          <p className="text-[11px] text-ivory-muted">لم يؤدِّ أي امتحان بعد.</p>
        ) : (
          <ul className="divide-y divide-surface-border rounded-xl border border-surface-border overflow-hidden">
            {student.examAttempts.map((a) => (
              <li key={a.attemptId} className="bg-bg-elevated">
                <button
                  type="button"
                  onClick={() =>
                    onOpenSheet({ type: 'EXAM', attemptId: a.attemptId, title: a.examTitle })
                  }
                  disabled={a.status === 'IN_PROGRESS'}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-right transition-colors hover:bg-gold-500/5 disabled:opacity-60 disabled:cursor-not-allowed group/row"
                  title={a.status === 'IN_PROGRESS' ? 'الورقة متاحة بعد التسليم' : 'فتح ورقة الإجابة'}
                >
                  <div className="min-w-0">
                    <p className="text-xs text-ivory truncate">
                      {a.examTitle}
                      <span className="text-[10px] text-ivory-muted/70 mr-1.5">#{a.attemptNumber}</span>
                    </p>
                    <p className="text-[10px] text-ivory-muted/70 truncate">{a.courseTitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={a.status} />
                    {a.score !== null && a.status === 'SUBMITTED' && (
                      <BadgeLike passed={a.isPassed}>{`${a.score}/${100}`}</BadgeLike>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-gold-400 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quizzes */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" /> الكويزات
        </h4>
        {student.quizAttempts.length === 0 ? (
          <p className="text-[11px] text-ivory-muted">لم يحل أي كويز بعد.</p>
        ) : (
          <ul className="divide-y divide-surface-border rounded-xl border border-surface-border overflow-hidden">
            {student.quizAttempts.map((a) => (
              <li key={a.attemptId} className="bg-bg-elevated">
                <button
                  type="button"
                  onClick={() =>
                    onOpenSheet({ type: 'QUIZ', attemptId: a.attemptId, title: a.quizTitle })
                  }
                  disabled={a.status === 'IN_PROGRESS'}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-right transition-colors hover:bg-gold-500/5 disabled:opacity-60 disabled:cursor-not-allowed group/row"
                  title={a.status === 'IN_PROGRESS' ? 'الورقة متاحة بعد التسليم' : 'فتح ورقة الإجابة'}
                >
                  <div className="min-w-0">
                    <p className="text-xs text-ivory truncate">
                      {a.quizTitle}
                      <span className="text-[10px] text-ivory-muted/70 mr-1.5">#{a.attemptNumber}</span>
                    </p>
                    <p className="text-[10px] text-ivory-muted/70 truncate">{a.lessonTitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={a.status} />
                    {a.score !== null && a.status === 'SUBMITTED' && (
                      <BadgeLike passed={a.isPassed}>{`${a.score}%`}</BadgeLike>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-gold-400 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Homeworks */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> الواجبات
        </h4>
        {(student.homeworkAttempts?.length ?? 0) === 0 ? (
          <p className="text-[11px] text-ivory-muted">لم يحل أي واجب بعد.</p>
        ) : (
          <ul className="divide-y divide-surface-border rounded-xl border border-surface-border overflow-hidden">
            {student.homeworkAttempts!.map((a) => (
              <li key={a.attemptId} className="bg-bg-elevated">
                <button
                  type="button"
                  onClick={() =>
                    onOpenSheet({ type: 'HOMEWORK', attemptId: a.attemptId, title: a.homeworkTitle })
                  }
                  disabled={a.status === 'IN_PROGRESS'}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-right transition-colors hover:bg-gold-500/5 disabled:opacity-60 disabled:cursor-not-allowed group/row"
                  title={a.status === 'IN_PROGRESS' ? 'الورقة متاحة بعد التسليم' : 'فتح ورقة الإجابة'}
                >
                  <div className="min-w-0">
                    <p className="text-xs text-ivory truncate">
                      {a.homeworkTitle}
                      <span className="text-[10px] text-ivory-muted/70 mr-1.5">#{a.attemptNumber}</span>
                    </p>
                    <p className="text-[10px] text-ivory-muted/70 truncate">{a.lessonTitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={a.status} />
                    {a.score !== null && a.status === 'SUBMITTED' && (
                      <BadgeLike passed={a.isPassed}>{`${a.score}%`}</BadgeLike>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-gold-400 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </div>
  );
};

const BadgeLike: React.FC<{ passed: boolean; children: React.ReactNode }> = ({
  passed,
  children,
}) => (
  <span
    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
      passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
    }`}
  >
    {children}
  </span>
);

export const DashboardStudentSearchPage: React.FC = () => {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === 'ADMIN';

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sheetTarget, setSheetTarget] = useState<SheetTarget>(null);
  const [editing, setEditing] = useState<StudentSearchResult | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [term]);

  const enabled = debounced.length >= 2;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-search', debounced],
    queryFn: () => studentsApi.search(debounced),
    enabled,
  });

  const results = useMemo(() => data?.results ?? [], [data]);

  const toggleAccountStatus = async (s: StudentSearchResult) => {
    const action = s.isActive === false ? 'تنشيط' : 'إيقاف';
    if (!window.confirm(`${action} حساب ${s.fullName}؟`)) return;
    try {
      await studentsApi.setAccountStatus(s.userId, !s.isActive);
      toast.success(s.isActive ? 'تم إيقاف الحساب.' : 'تم تنشيط الحساب.');
      queryClient.invalidateQueries({ queryKey: ['student-search'] });
    } catch {
      toast.error('تعذر تغيير حالة الحساب.');
    }
  };

  const deleteStudent = async (s: StudentSearchResult) => {
    if (
      !window.confirm(
        `حذف حساب ${s.fullName} نهائياً؟ سيتم حذف كل محاولاته واشتراكاته ولا يمكن التراجع.`
      )
    )
      return;
    try {
      await studentsApi.deleteStudent(s.userId);
      toast.success('تم حذف الحساب نهائياً.');
      queryClient.invalidateQueries({ queryKey: ['student-search'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر حذف الحساب.');
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto space-y-6 text-right">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-8 h-72 w-full text-gold-500 opacity-[0.045]"
        viewBox="0 0 1440 288"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <pattern id="stu-hatch" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1440" height="288" fill="url(#stu-hatch)" />
        <circle cx="1340" cy="20" r="150" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="70" cy="260" r="120" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="relative z-10">
        <PageHeader
          id="stu-search"
          icon={Search}
          title="البحث عن طالب"
          subtitle="ابحث بالاسم أو البريد أو الهاتف لعرض الملف الكامل: الكورسات، الامتحانات، والكويزات."
        />
      </div>

      {/* Search box — glowing focus ring + animated gold underline */}
      <div className="relative z-10 p-5 rounded-2xl bg-surface-card border border-surface-border">
        <div className="relative group">
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gold-400/50 group-focus-within:text-gold-400 transition-colors">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </span>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="اكتب اسم الطالب أو رقم هاتفه أو بريده... (حرفان على الأقل)"
            autoFocus
            className="peer w-full bg-surface border border-surface-border rounded-xl ps-10 pe-4 py-3.5 text-sm text-ivory placeholder-ivory-muted/40 outline-none transition-all duration-300 focus:border-gold-400 focus:bg-bg-elevated focus:shadow-[0_0_0_4px_rgba(201,161,90,0.12)]"
          />
          <span
            className={`absolute bottom-0 right-3 h-0.5 rounded-full bg-gradient-to-l from-gold-300 to-transparent transition-all duration-500 ${
              term.length > 0 ? 'w-[calc(100%-2rem)]' : 'w-0 peer-focus:w-[calc(100%-2rem)]'
            }`}
          />
        </div>
      </div>

      {/* Results */}
      <div className="relative z-10 space-y-4">
        {!enabled ? (
          <p className="text-xs text-ivory-muted text-center py-10 flex items-center justify-center gap-2">
            <Search className="w-4 h-4 text-gold-400/60" />
            ابدأ بكتابة حرفين على الأقل للبحث.
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-ivory-muted">
            <Loader2 className="w-5 h-5 animate-spin text-gold-400" />
            جاري البحث...
          </div>
        ) : isError ? (
          <div className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-xs text-red-400">تعذر تنفيذ البحث. حاول مرة أخرى.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-10 rounded-2xl bg-surface-card border border-surface-border text-center space-y-2.5">
            <SearchX className="w-9 h-9 text-gold-400/50 mx-auto" />
            <p className="text-sm font-bold text-ivory">لا يوجد طالب مطابق</p>
            <p className="text-xs text-ivory-muted">
              لا توجد نتائج لـ «{debounced}» — تأكد من الإملاء أو جرّب رقم الهاتف.
            </p>
          </div>
        ) : (
          results.map((s) => (
            <StudentCard
              key={s.userId}
              student={s}
              isAdmin={isAdmin}
              onToggleStatus={toggleAccountStatus}
              onOpenSheet={(t) => setSheetTarget(t)}
              onEdit={(st) => setEditing(st)}
              onDelete={deleteStudent}
            />
          ))
        )}
      </div>

      {/* Full answer-sheet paper modal (exam / quiz / homework) */}
      <AttemptSheetModal target={sheetTarget} onClose={() => setSheetTarget(null)} />

      {/* Admin: edit student modal */}
      {editing && (
        <EditStudentModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['student-search'] })}
        />
      )}

    </div>
  );
};
