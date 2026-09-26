import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, LogIn, Users, Phone, GraduationCap, ArrowLeft } from 'lucide-react';
import { useLoginMutation, useParentRequestOtpMutation } from '../../hooks/mutations/useAuthMutations';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AuthShell } from './AuthShell';

const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف'),
  password: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const parentPhoneSchema = z.object({
  guardianPhone: z
    .string()
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)'),
});

type ParentFormValues = z.infer<typeof parentPhoneSchema>;

const MODES = [
  { key: 'student' as const, label: 'طالب', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'parent' as const, label: 'ولي أمر', icon: <Users className="w-4 h-4" /> },
];

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mode, setMode] = useState<'student' | 'parent'>('student');

  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending } = useLoginMutation();
  const { mutate: requestParentOtp, isPending: isParentOtpPending } = useParentRequestOtpMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    register: registerParent,
    handleSubmit: handleParentSubmit,
    formState: { errors: parentErrors, submitCount: parentSubmitCount },
  } = useForm<ParentFormValues>({
    resolver: zodResolver(parentPhoneSchema),
    defaultValues: { guardianPhone: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const onParentSubmit = (data: ParentFormValues) => {
    setServerError(null);
    requestParentOtp(
      { phone: data.guardianPhone },
      {
        onSuccess: () => {
          navigate('/auth/verify-otp', {
            state: { phone: data.guardianPhone, mode: 'parent' },
          });
        },
        onError: (err: any) => {
          const message =
            err.response?.data?.message || 'تعذر إرسال كود التحقق، حاول مرة أخرى';
          setServerError(typeof message === 'string' ? message : JSON.stringify(message));
        },
      }
    );
  };

  const onSubmit = (data: LoginFormValues) => {
    setServerError(null);

    const isEmail = data.identifier.includes('@');
    const payload = isEmail
      ? { email: data.identifier, password: data.password }
      : { phone: data.identifier, password: data.password };

    login(payload, {
      onSuccess: (res) => {
        const from = (location.state as any)?.from?.pathname;
        const isStaff = res.user.role === 'TEACHER' || res.user.role === 'ADMIN';
        const staffOnlyRoute =
          !!from && (from.startsWith('/dashboard') || from.startsWith('/admin'));
        const fromIsSafe =
          !!from &&
          from !== '/403' &&
          from !== '/auth/login' &&
          from !== '/auth/register' &&
          (isStaff || !staffOnlyRoute);

        if (fromIsSafe) {
          navigate(from, { replace: true });
        } else if (isStaff) {
          navigate('/dashboard', { replace: true });
        } else if (res.user.role === 'PARENT') {
          navigate('/parent', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      },
      onError: (err: any) => {
        const message =
          err.response?.data?.message ||
          'بيانات الدخول غير صحيحة، أو الحساب غير مفعّل بعد';
        setServerError(typeof message === 'string' ? message : JSON.stringify(message));
      },
    });
  };

  return (
    <AuthShell
          badge="أهلاً بك في سند"
      title="مستقبلك يبدأ من هنا"
      subtitle="منصة تعليمية مصممة تساعدك تفهم، تتدرّب، وتتقدم بثقة."
    >
      <div className="mb-6 text-right">
        <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">تسجيل الدخول</h1>
        <div className="flex items-center gap-3 justify-end mt-2">
          <span className="text-xs sm:text-sm text-ivory-muted">أدخل بيانات حسابك للمتابعة</span>
          <span className="h-px flex-1 max-w-[90px] bg-gradient-to-l from-gold-500/50 to-transparent" />
        </div>
      </div>

      {/* Segmented control — spring-animated gold pill */}
      <div
        className="mb-6 grid grid-cols-2 gap-1 p-1.5 rounded-2xl bg-surface/70 border border-gold-500/20"
        role="tablist"
        aria-label="نوع الحساب"
      >
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(m.key);
                setServerError(null);
              }}
              className={`relative flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 outline-none ${
                active ? 'text-white' : 'text-ivory-muted hover:text-ivory/90'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="login-mode-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-[var(--primary)] border border-gold-500/45 shadow-gold-glow"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {m.icon}
                {m.label}
              </span>
            </button>
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

      <div key={mode} className="animate-auth-tab-in">
        {mode === 'parent' ? (
          <form onSubmit={handleParentSubmit(onParentSubmit)} className="space-y-5">
            <Input
              label="رقم هاتف ولي الأمر"
              placeholder="01012345678"
              dir="ltr"
              autoComplete="tel"
              rightIcon={<Phone className="w-4 h-4" />}
              error={parentErrors.guardianPhone?.message}
              shakeKey={parentSubmitCount}
              {...registerParent('guardianPhone')}
            />

            <p className="text-[11px] text-ivory-muted leading-relaxed text-right -mt-1">
              أدخل الرقم الذي سجّله الابن كـ "رقم ولي الأمر"، وسيصلك كود تحقق
              لمتابعة درجاته ودروسه لحظة بلحظة.
            </p>

            <Button
              type="submit"
              isLoading={isParentOtpPending}
              className="w-full mt-2 group btn-shine"
              size="lg"
              leftIcon={
                <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
              }
            >
              إرسال كود التحقق
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="البريد الإلكتروني أو رقم الهاتف"
              placeholder="example@mail.com أو 01012345678"
              autoComplete="username"
              rightIcon={<Mail className="w-4 h-4" />}
              error={errors.identifier?.message}
              shakeKey={submitCount}
              {...register('identifier')}
            />

            <Input
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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
              shakeKey={submitCount}
              {...register('password')}
            />

            <Button
              type="submit"
              isLoading={isPending}
              className="w-full mt-2 group btn-shine"
              size="lg"
              leftIcon={<LogIn className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />}
            >
              تسجيل الدخول
            </Button>
          </form>
        )}
      </div>

      <div className="mt-7 pt-5 border-t border-gold-500/10 text-center text-xs text-ivory-muted">
        ليس لديك حساب بعد؟{' '}
        <Link
          to="/auth/register"
          className="text-gold-400 hover:text-gold-300 font-bold underline mr-1 transition-colors"
        >
          إنشاء حساب جديد
        </Link>
      </div>
    </AuthShell>
  );
};
