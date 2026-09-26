import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserPlus,
  User as UserIcon,
  Mail,
  Phone,
  Users,
  GraduationCap,
  BookOpen,
  KeyRound,
  CheckCircle2,
  Loader2,
  Sparkles,
  Briefcase,
  MapPin,
  FileText,
  Upload,
  Trash2,
  Landmark,
  ScrollText,
  Building2,
} from 'lucide-react';
import { studentsApi } from '../../api/students.api';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { HeadingAccent } from '../../components/ui/HeadingAccent';
import { useAuthStore } from '../../store/authStore';

/** All GradeLevel enum values from the database, grouped by educational stage */
const GRADE_STAGE_GROUPS: Array<{
  label: string;
  icon: React.ElementType;
  options: [string, string][];
}> = [
  {
    label: 'المرحلة الإعدادية',
    icon: ScrollText,
    options: [
      ['PREP_1', '1 إعدادي'],
      ['PREP_2', '2 إعدادي'],
      ['PREP_3', '3 إعدادي'],
    ],
  },
  {
    label: 'الثانوية العامة',
    icon: Landmark,
    options: [
      ['SEC_1', '1 ثانوي'],
      ['SEC_2', '2 ثانوي'],
      ['SEC_3_LITERARY', '3ث أدبي'],
      ['SEC_3_SCIENTIFIC', '3ث علمي'],
    ],
  },
  {
    label: 'الأزهرية',
    icon: Building2,
    options: [
      ['AZHAR_PREP', 'أزهري إعدادي'],
      ['AZHAR_SEC', 'أزهري ثانوي'],
    ],
  },
  {
    label: 'البكالوريا',
    icon: GraduationCap,
    options: [['BAC', 'بكالوريا']],
  },
];

/** Text input with icon, floating gold focus glow and animated border */
const EffectInput: React.FC<{
  label: string;
  icon: React.ReactNode;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  dir?: string;
  type?: string;
}> = ({ label, icon, placeholder, value, onChange, required, dir, type = 'text' }) => (
  <div>
    <label className="block text-xs font-bold text-gold-300/90 mb-1.5">{label}</label>
    <div className="relative group">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400/50 group-focus-within:text-gold-400 transition-colors">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`peer w-full bg-surface border border-surface-border rounded-xl ps-10 pe-3 py-3 text-sm text-ivory placeholder-ivory-muted/40 outline-none transition-all duration-300 focus:border-gold-400 focus:bg-bg-elevated focus:shadow-[0_0_0_4px_rgba(201,161,90,0.12)] ${dir === 'ltr' ? 'text-left' : ''}`}
      />
      <span className="absolute bottom-0 right-3 h-0.5 w-0 bg-gradient-to-l from-gold-300 to-transparent rounded-full transition-all duration-500 peer-focus:w-[calc(100%-1.5rem)]" />
    </div>
  </div>
);

export const DashboardStudentAddPage: React.FC = () => {
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole === 'ADMIN';
  /** ADMIN chooses the account type; TEACHER can only create students */
  const [accountType, setAccountType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    studentPhone: '',
    guardianPhone: '',
    gradeLevel: 'SEC_1',
    password: '',
    courseId: '',
    specialization: '',
    photoUrl: '',
    bio: '',
    address: '',
  });
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password?: string } | null>(null);
  const [shaking, setShaking] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('صيغة الصورة غير مدعومة — استخدم JPEG أو PNG أو WebP.');
      triggerShake();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يتجاوز 5MB.');
      triggerShake();
      return;
    }
    setUploadingPhoto(true);
    try {
      const { url } = await studentsApi.uploadTeacherImage(file);
      set('photoUrl', url);
      toast.success('تم رفع صورة المدرس بنجاح.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر رفع الصورة.');
      triggerShake();
    } finally {
      setUploadingPhoto(false);
    }
  };

  const { data: coursesData } = useCoursesQuery({ limit: 50, mine: true });
  const courses: any[] = Array.isArray(coursesData?.courses)
    ? coursesData.courses
    : Array.isArray(coursesData?.data)
    ? coursesData.data
    : [];

  const set = (key: string, v: string) => setForm((p) => ({ ...p, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (isAdmin && accountType === 'TEACHER') {
        await studentsApi.createTeacher({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.studentPhone.trim(),
          password: form.password,
          specialization: form.specialization.trim() || 'مدرس',
          ...(form.photoUrl.trim() ? { photoUrl: form.photoUrl.trim() } : {}),
          ...(form.bio.trim() ? { bio: form.bio.trim() } : {}),
          ...(form.address.trim() ? { address: form.address.trim() } : {}),
        });
        setCreatedCreds({ email: form.email.trim(), password: form.password });
      } else {
        const res = await studentsApi.createStudent({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          studentPhone: form.studentPhone.trim(),
          guardianPhone: form.guardianPhone.trim(),
          gradeLevel: form.gradeLevel,
          ...(form.password ? { password: form.password } : {}),
          ...(form.courseId ? { courseId: form.courseId } : {}),
        });
        setCreatedCreds({ email: res.email ?? form.email.trim(), password: res.generatedPassword ?? undefined });
      }
      resetForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر إنشاء الحساب.');
      triggerShake();
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      email: '',
      studentPhone: '',
      guardianPhone: '',
      gradeLevel: 'SEC_1',
      password: '',
      courseId: '',
      specialization: '',
      photoUrl: '',
      bio: '',
      address: '',
    });
  };

  return (
    <div className="relative max-w-3xl mx-auto space-y-6 text-right">
      {/* Decorative vectors */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-8 h-72 w-full text-gold-500 opacity-[0.045]"
        viewBox="0 0 1440 288"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <pattern id="addstu-hatch" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1440" height="288" fill="url(#addstu-hatch)" />
        <circle cx="1340" cy="20" r="150" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="70" cy="260" r="120" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="relative z-10 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-gold-300 flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-gold-400" />
          {isAdmin && accountType === 'TEACHER' ? 'إضافة مدرس جديد' : 'إضافة طالب جديد'}
        </h1>
        <HeadingAccent variant="arrow" className="w-28" />
        <p className="text-xs text-ivory-muted pt-1">
          {isAdmin && accountType === 'TEACHER'
            ? 'أنشئ حساب مدرس مفعّلاً يمكنه فوراً إنشاء الكورسات وإدارة المحتوى.'
            : 'أنشئ حساب طالب وفعّله فوراً — ويمكنك تسجيله في أحد كورساتك مباشرة.'}
        </p>
      </div>

      {/* Account-type switcher (ADMIN only — teachers create students only) */}
      {isAdmin && !createdCreds && (
        <div className="relative z-10 flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-surface-border w-fit">
          <button
            type="button"
            onClick={() => setAccountType('STUDENT')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
              accountType === 'STUDENT'
                ? 'bg-gold-gradient text-bg shadow-gold-glow'
                : 'text-ivory-muted hover:text-ivory'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            حساب طالب
          </button>
          <button
            type="button"
            onClick={() => setAccountType('TEACHER')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
              accountType === 'TEACHER'
                ? 'bg-gold-gradient text-bg shadow-gold-glow'
                : 'text-ivory-muted hover:text-ivory'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            حساب مدرس
          </button>
        </div>
      )}

      {createdCreds ? (
        /* ─── Success card with one-time credentials ─── */
        <div className="relative z-10 p-8 rounded-3xl bg-surface-card border border-emerald-500/30 shadow-card-dark space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold font-display text-emerald-400">تم إنشاء الحساب بنجاح</h2>
          <div className="max-w-sm mx-auto p-4 rounded-2xl bg-bg-elevated border border-surface-border space-y-2 text-xs">
            <p className="flex items-center justify-between gap-2">
              <span className="text-ivory-muted flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gold-400" /> البريد
              </span>
              <span dir="ltr" className="font-bold text-ivory">{createdCreds.email}</span>
            </p>
            {createdCreds.password && (
              <p className="flex items-center justify-between gap-2">
                <span className="text-ivory-muted flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-gold-400" /> كلمة المرور
                </span>
                <span dir="ltr" className="font-mono font-bold text-gold-300 tracking-wider">
                  {createdCreds.password}
                </span>
              </p>
            )}
          </div>
          {createdCreds.password && (
            <p className="text-[11px] text-amber-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              احفظ كلمة المرور الآن — لن تظهر مرة أخرى.
            </p>
          )}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button size="sm" onClick={() => setCreatedCreds(null)} leftIcon={<UserPlus className="w-4 h-4" />}>
              {isAdmin && accountType === 'TEACHER' ? 'إضافة مدرس آخر' : 'إضافة طالب آخر'}
            </Button>
          </div>
        </div>
      ) : (
        /* ─── Create Form ─── */
        <form
          onSubmit={handleSubmit}
          className={`relative z-10 p-6 sm:p-8 rounded-3xl bg-surface-card border border-surface-border shadow-card-dark space-y-5 ${shaking ? 'animate-form-shake border-red-500/50' : ''}`}
        >
          <EffectInput
            label="الاسم الكامل"
            icon={<UserIcon className="w-4 h-4" />}
            placeholder={isAdmin && accountType === 'TEACHER' ? 'أدخل اسم المدرس' : 'أدخل اسم الطالب الثلاثي'}
            value={form.fullName}
            onChange={(v) => set('fullName', v)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EffectInput
              label="البريد الإلكتروني"
              icon={<Mail className="w-4 h-4" />}
              placeholder={isAdmin && accountType === 'TEACHER' ? 'teacher@example.com' : 'student@example.com'}
              value={form.email}
              onChange={(v) => set('email', v)}
              required
              dir="ltr"
              type="email"
            />
            <EffectInput
              label={isAdmin && accountType === 'TEACHER' ? 'هاتف المدرس' : 'هاتف الطالب'}
              icon={<Phone className="w-4 h-4" />}
              placeholder="01012345678"
              value={form.studentPhone}
              onChange={(v) => set('studentPhone', v)}
              required
              dir="ltr"
            />
            {accountType === 'STUDENT' && (
              <>
                <EffectInput
                  label="هاتف ولي الأمر"
                  icon={<Users className="w-4 h-4" />}
                  placeholder="01098765432"
                  value={form.guardianPhone}
                  onChange={(v) => set('guardianPhone', v)}
                  required
                  dir="ltr"
                />
                <EffectInput
                  label="كلمة المرور (اختياري)"
                  icon={<KeyRound className="w-4 h-4" />}
                  placeholder="تلقائي إن تُرك فارغاً"
                  value={form.password}
                  onChange={(v) => set('password', v)}
                  dir="ltr"
                  type="text"
                />
              </>
            )}
            {isAdmin && accountType === 'TEACHER' && (
              <>
                <EffectInput
                  label="التخصص"
                  icon={<BookOpen className="w-4 h-4" />}
                  placeholder="مثال: مدرس أول لغة عربية"
                  value={form.specialization}
                  onChange={(v) => set('specialization', v)}
                />
                <EffectInput
                  label="كلمة المرور"
                  icon={<KeyRound className="w-4 h-4" />}
                  placeholder="٨ أحرف مع حرف كبير وصغير ورقم"
                  value={form.password}
                  onChange={(v) => set('password', v)}
                  dir="ltr"
                  type="text"
                  required
                />
              </>
            )}
          </div>

          {/* Teacher extra profile fields */}
          {isAdmin && accountType === 'TEACHER' && (
            <div className="p-4 rounded-2xl bg-surface/60 border border-surface-border space-y-4">
              <div className="flex items-center gap-2 text-gold-300">
                <Briefcase className="w-4 h-4" />
                <h4 className="text-sm font-bold font-amiri">بيانات المدرس الإضافية (اختياري)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-xs font-bold text-gold-300/90 mb-1.5">صورة المدرس</label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-surface border border-dashed border-gold-500/40 rounded-xl px-3 py-3 text-xs font-bold text-gold-300 transition-all duration-300 hover:border-gold-400 hover:bg-bg-elevated hover:shadow-[0_0_0_4px_rgba(201,161,90,0.12)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري الرفع...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {form.photoUrl.trim() ? 'تغيير الصورة' : 'رفع صورة من الجهاز'}
                      </>
                    )}
                  </button>
                </div>
                <EffectInput
                  label="العنوان / المحافظة"
                  icon={<MapPin className="w-4 h-4" />}
                  placeholder="مثال: مدينة نصر، القاهرة"
                  value={form.address}
                  onChange={(v) => set('address', v)}
                />
              </div>

              {form.photoUrl.trim() && (
                <div className="flex items-center gap-3">
                  <img
                    src={form.photoUrl}
                    alt="معاينة صورة المدرس"
                    className="w-16 h-16 rounded-full object-cover border border-gold-500/40 shadow-gold-glow/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => set('photoUrl', '')}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    إزالة الصورة
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gold-300/90 mb-1.5">نبذة عن المدرس</label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={form.bio}
                  onChange={(e) => set('bio', e.target.value)}
                  placeholder="مثال: خبرة 15 عاماً في تدريس الثانوية العامة و مؤلف سلسلة كتب التفوق..."
                  className="w-full bg-surface border border-surface-border text-ivory rounded-xl p-3 text-xs leading-relaxed outline-none focus:border-gold-400 focus:shadow-[0_0_0_4px_rgba(201,161,90,0.12)]"
                />
              </div>

              <p className="flex items-center gap-1.5 text-[10px] text-ivory-muted">
                <FileText className="w-3 h-3 shrink-0" />
                تظهر هذه البيانات للطلاب في صفحة الكورس والملف التعريفي للمدرس.
              </p>
            </div>
          )}

          {/* Grade level pills — students only, grouped by stage (matches DB GradeLevel enum) */}
          {accountType === 'STUDENT' && (
            <div>
              <label className="block text-xs font-bold text-gold-300/90 mb-2">المرحلة الدراسية</label>
              <div className="space-y-3">
                {GRADE_STAGE_GROUPS.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.label}>
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-ivory-muted mb-1.5">
                        <GroupIcon className="w-3 h-3 text-gold-400" />
                        {group.label}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {group.options.map(([value, label]) => {
                          const active = form.gradeLevel === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => set('gradeLevel', value)}
                              className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                                active
                                  ? 'bg-gold-gradient text-bg font-bold shadow-gold-glow -translate-y-0.5'
                                  : 'bg-surface text-ivory-muted hover:text-ivory border border-surface-border hover:border-gold-500/40'
                              }`}
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Course enrollment — students only */}
          {accountType === 'STUDENT' && (
            <div>
              <label className="block text-xs font-bold text-gold-300/90 mb-1.5">
                تسجيل الطالب في كورس (اختياري)
              </label>
              <div className="relative">
                <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400/50" />
                <select
                  value={form.courseId}
                  onChange={(e) => set('courseId', e.target.value)}
                  className="w-full appearance-none bg-surface border border-surface-border rounded-xl ps-10 pe-3 py-3 text-sm text-ivory outline-none transition-all duration-300 focus:border-gold-400 focus:shadow-[0_0_0_4px_rgba(201,161,90,0.12)] cursor-pointer"
                >
                  <option value="">بدون كورس حالياً — اشتراك نشط مباشرة عند الاختيار</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Button type="submit" size="md" isLoading={creating} className="w-full" leftIcon={<UserPlus className="w-4 h-4" />}>
            {isAdmin && accountType === 'TEACHER' ? 'إنشاء حساب المدرس' : 'إنشاء حساب الطالب'}
          </Button>

          {creating && (
            <p className="text-center text-[10px] text-ivory-muted flex items-center justify-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              جاري إنشاء الحساب وتفعيله...
            </p>
          )}
        </form>
      )}
    </div>
  );
};
