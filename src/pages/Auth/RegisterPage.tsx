import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import * as z from 'zod';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  GraduationCap,
  Layers,
  BookOpen,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useRegisterStudentMutation } from '../../hooks/mutations/useAuthMutations';
import { taxonomyApi } from '../../api/taxonomy.api';
import type { Grade } from '../../types/taxonomy.types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthShell } from './AuthShell';
import { cn } from '../../lib/utils';

const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'الاسم الثلاثي أو الرباعي مطلوب'),
    email: z.string().trim().toLowerCase().email('يرجى إدخال بريد إلكتروني صحيح'),
    phone: z
      .string().trim()
      .regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف يجب أن يكون رقم مصري صحيح (11 رقم)'),
    guardianPhone: z
      .string().trim()
      .regex(/^01[0125][0-9]{8}$/, 'رقم ولي الأمر يجب أن يكون رقم مصري صحيح (11 رقم)'),
    password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
    confirmPassword: z.string().min(6, 'تأكيد كلمة المرور مطلوب'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  })
  .refine((data) => data.phone !== data.guardianPhone, {
    message: 'رقم هاتف الطالب يجب أن يختلف عن رقم ولي الأمر',
    path: ['guardianPhone'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const selectClass =
  'w-full appearance-none bg-surface/80 border border-surface-border text-ivory rounded-lg px-4 py-2.5 text-sm transition-all outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const passwordScore = (pw: string): number => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'];
const STRENGTH_COLORS = [
  'bg-red-500/70',
  'bg-orange-400/70',
  'bg-yellow-400/70',
  'bg-lime-400/70',
  'bg-emerald-400/70',
];

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [stepDir, setStepDir] = useState<'fwd' | 'back'>('fwd');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ─── Taxonomy cascading selection (system → stage → grade → track) ───
  const [systemId, setSystemId] = useState('');
  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [trackId, setTrackId] = useState('');
  const [educationError, setEducationError] = useState<string | null>(null);
  const [stepValidationAttempt, setStepValidationAttempt] = useState(0);

  const { data: systems = [], isLoading: systemsLoading } = useQuery({
    queryKey: ['taxonomy-systems'],
    queryFn: taxonomyApi.listSystems,
    staleTime: 1000 * 60 * 30,
  });

  const stages = useMemo(
    () => systems.find((s) => s.id === systemId)?.stages ?? [],
    [systems, systemId]
  );

  const { data: grades = [], isLoading: gradesLoading, isFetching: gradesFetching } = useQuery({
    queryKey: ['taxonomy-grades', stageId],
    queryFn: () => taxonomyApi.listGrades(stageId),
    enabled: !!stageId,
    staleTime: 1000 * 60 * 30,
  });

  const selectedGrade: Grade | undefined = useMemo(
    () => grades.find((g) => g.id === gradeId),
    [grades, gradeId]
  );
  const needsTrack = Boolean(selectedGrade?.hasTracks);
  const tracks = selectedGrade?.tracks ?? [];

  const navigate = useNavigate();
  const { mutate: registerStudent, isPending } = useRegisterStudentMutation();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, submitCount },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      guardianPhone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const watchedPassword = watch('password');
  const strength = passwordScore(watchedPassword ?? '');

  const goToStep = (next: 1 | 2) => {
    setStepDir(next === 2 ? 'fwd' : 'back');
    setStep(next);
  };

  const handleNext = async () => {
    setServerError(null);
    setStepValidationAttempt((value) => value + 1);
    const valid = await trigger(['fullName', 'email', 'phone', 'password', 'confirmPassword']);
    if (valid) goToStep(2);
  };

  const onSubmit = (data: RegisterFormValues) => {
    // Enter key / implicit submit: advance to step 2 once account fields are valid
    if (step === 1) {
      goToStep(2);
      return;
    }

    setServerError(null);
    setEducationError(null);

    if (!systemId || !stageId || !gradeId) {
      setEducationError('يجب اختيار النظام التعليمي والمرحلة والصف الدراسي');
      return;
    }
    if (needsTrack && !trackId) {
      setEducationError('هذا الصف يتطلب اختيار شعبة إلزامية');
      return;
    }

    registerStudent(
      {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        guardianPhone: data.guardianPhone,
        gradeId,
        trackId: trackId || null,
        password: data.password,
      },
      {
        onSuccess: () => {
          navigate('/auth/verify-otp', { state: { phone: data.phone } });
        },
        onError: (err: any) => {
          const message =
            err.response?.data?.message || 'حدث خطأ أثناء التسجيل، قد يكون البريد أو الهاتف مسجلاً بالفعل';
          setServerError(typeof message === 'string' ? message : JSON.stringify(message));
        },
      }
    );
  };

  const STEPS = [
    { num: 1 as const, label: 'بيانات الحساب' },
    { num: 2 as const, label: 'الدراسة وولي الأمر' },
  ];

  return (
    <AuthShell
          badge="انضم إلى منصة سند"
      title="ابدأ رحلة التفوق في التاريخ"
      subtitle="حسابك في دقيقتين — شروحات وامتحانات ومتابعة يومية لولي الأمر."
    >
      <div className="mb-6 text-right">
        <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">إنشاء حساب طالب</h1>
        <div className="flex items-center gap-3 justify-end mt-2">
          <span className="text-xs sm:text-sm text-ivory-muted">خطوتان فقط تفصلك عن البداية</span>
          <span className="h-px flex-1 max-w-[90px] bg-gradient-to-l from-gold-500/50 to-transparent" />
        </div>
      </div>

      {/* Progress rail */}
      <div className="mb-7 flex items-center" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
              {STEPS.map((s, i) => {
                const active = step >= s.num;
                const completed = s.num < step;
                return (
                  <React.Fragment key={s.num}>
                    {i > 0 && (
                      <div className="relative flex-1 h-[3px] mx-2 rounded-full bg-surface-border overflow-hidden">
                        <motion.div
                          initial={false}
                          animate={{ width: step === 2 ? '100%' : '0%' }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="absolute inset-y-0 right-0 bg-gradient-to-l from-gold-400 to-gold-600 rounded-full"
                        />
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-1.5">
                      <motion.div
                        animate={
                          active
                            ? { scale: 1.08, backgroundColor: 'rgba(201,161,90,0.16)', borderColor: 'rgba(201,161,90,0.6)' }
                            : { scale: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.12)' }
                        }
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold ${
                          active ? 'text-gold-300 shadow-gold-glow' : 'text-ivory-muted'
                        }`}
                      >
                        {completed ? (
                          <Check className="w-4 h-4 animate-check-pop" />
                        ) : (
                          s.num
                        )}
                      </motion.div>
                      <span className={`text-[10px] font-cairo ${active ? 'text-gold-300' : 'text-ivory-muted'}`}>
                        {s.label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
      </div>

      {serverError && (
        <div
          key={serverError}
          className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 text-right leading-relaxed animate-error-shake"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ─── Step 1: account basics ─── */}
        {step === 1 && (
          <div key="step-1" className={cn('space-y-4', stepDir === 'fwd' ? 'animate-step-fwd' : 'animate-step-back')}>
            <Input
              label="الاسم بالكامل"
              placeholder="محمد أحمد علي"
              autoComplete="name"
              autoFocus
              rightIcon={<User className="w-4 h-4" />}
              error={errors.fullName?.message}
              shakeKey={stepValidationAttempt}
              {...register('fullName')}
            />

            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="student@example.com"
              dir="ltr"
              autoComplete="email"
              rightIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              shakeKey={stepValidationAttempt}
              {...register('email')}
            />

            <Input
              label="رقم هاتف الطالب (واتساب)"
              placeholder="01012345678"
              dir="ltr"
              autoComplete="tel"
              rightIcon={<Phone className="w-4 h-4" />}
              error={errors.phone?.message}
              shakeKey={stepValidationAttempt}
              {...register('phone')}
            />

            <Input
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              rightIcon={<Lock className="w-4 h-4" />}
              leftIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-ivory-muted hover:text-ivory focus:outline-none transition-colors"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              shakeKey={stepValidationAttempt}
              {...register('password')}
            />

            {watchedPassword && (
              <div className="flex items-center gap-2 -mt-1">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors duration-300',
                        i < strength ? STRENGTH_COLORS[strength] : 'bg-surface-border'
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-ivory-muted w-14 text-left">{STRENGTH_LABELS[strength]}</span>
              </div>
            )}

            <Input
              label="تأكيد كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              rightIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              shakeKey={stepValidationAttempt}
              {...register('confirmPassword')}
            />

            <Button
              type="button"
              onClick={handleNext}
              className="w-full mt-3 group btn-shine"
              size="lg"
              leftIcon={<ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />}
            >
              التالي — بيانات الدراسة
            </Button>
          </div>
        )}

        {/* ─── Step 2: education + guardian ─── */}
        {step === 2 && (
          <div key="step-2" className={cn('space-y-4', stepDir === 'fwd' ? 'animate-step-fwd' : 'animate-step-back')}>
            <div className="space-y-1.5 text-right">
              <label className="block text-sm font-medium text-ivory/90 font-cairo">
                المرحلة الدراسية <span className="text-gold-400">*</span>
              </label>

              {educationError && (
                <p key={educationError} className="text-[11px] text-red-400 font-bold animate-error-shake">
                  {educationError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Layers className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold-400/70" />
                  <select
                    value={systemId}
                    autoFocus
                    onChange={(e) => {
                      setSystemId(e.target.value);
                      setStageId('');
                      setGradeId('');
                      setTrackId('');
                      setEducationError(null);
                    }}
                    className={`${selectClass} pr-9`}
                    disabled={systemsLoading}
                  >
                    <option value="">النظام التعليمي…</option>
                    {systems.map((s) => (
                      <option key={s.id} value={s.id} className="bg-surface text-ivory">
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted" />
                </div>

                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold-400/70" />
                  <select
                    value={stageId}
                    onChange={(e) => {
                      setStageId(e.target.value);
                      setGradeId('');
                      setTrackId('');
                      setEducationError(null);
                    }}
                    className={`${selectClass} pr-9`}
                    disabled={!systemId}
                  >
                    <option value="">المرحلة…</option>
                    {stages.map((st) => (
                      <option key={st.id} value={st.id} className="bg-surface text-ivory">
                        {st.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted" />
                </div>

                <div className="relative">
                  <BookOpen className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold-400/70" />
                  <select
                    value={gradeId}
                    onChange={(e) => {
                      setGradeId(e.target.value);
                      setTrackId('');
                      setEducationError(null);
                    }}
                    className={`${selectClass} pr-9`}
                    disabled={!stageId || gradesLoading || gradesFetching}
                  >
                    <option value="">
                      {!stageId ? 'اختر المرحلة أولاً…' : gradesLoading || gradesFetching ? 'جاري التحميل…' : 'الصف الدراسي…'}
                    </option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id} className="bg-surface text-ivory">
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted" />
                </div>
              </div>

              {needsTrack && (
                <div className="relative pt-1">
                  <select
                    value={trackId}
                    onChange={(e) => {
                      setTrackId(e.target.value);
                      setEducationError(null);
                    }}
                    className={selectClass}
                  >
                    <option value="">اختر الشعبة…</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id} className="bg-surface text-ivory">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ivory-muted" />
                </div>
              )}
            </div>

            <Input
              label="رقم هاتف ولي الأمر"
              placeholder="01112345678"
              dir="ltr"
              autoComplete="tel"
              rightIcon={<Phone className="w-4 h-4" />}
              error={errors.guardianPhone?.message}
              shakeKey={submitCount}
              {...register('guardianPhone')}
            />

            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25 text-right">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                تأكد من صحة الرقم — سيستخدمه ولي الأمر لتسجيل الدخول ومتابعة
                درجاتك ودروسك عبر كود تحقق يصله على هذا الرقم.
              </p>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-3 mt-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => goToStep(1)}
                leftIcon={<ArrowRight className="w-4 h-4" />}
                aria-label="رجوع للخطوة السابقة"
              >
                رجوع
              </Button>
              <Button
                type="submit"
                isLoading={isPending}
                className="group btn-shine"
                size="lg"
                leftIcon={<UserCheck className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />}
              >
                تأكيد وإنشاء الحساب
              </Button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-7 pt-5 border-t border-gold-500/10 text-center text-xs text-ivory-muted flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        لديك حساب بالفعل؟{' '}
        <Link to="/auth/login" className="text-gold-400 hover:text-gold-300 font-bold underline mr-1 transition-colors">
          تسجيل الدخول
        </Link>
      </div>
    </AuthShell>
  );
};
