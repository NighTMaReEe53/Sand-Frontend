import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  useVerifyOtpMutation,
  useResendOtpMutation,
  useParentVerifyOtpMutation,
  useParentRequestOtpMutation,
} from '../../hooks/mutations/useAuthMutations';
import { Button } from '../../components/ui/Button';

export const VerifyOtpPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const phone = (location.state as any)?.phone || '';
  const mode: 'student' | 'parent' = (location.state as any)?.mode === 'parent' ? 'parent' : 'student';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtpMutation();
  const { mutate: resendOtp, isPending: isResending } = useResendOtpMutation();
  const { mutate: verifyParentOtp, isPending: isParentVerifying } = useParentVerifyOtpMutation();
  const { mutate: resendParentOtp, isPending: isParentResending } = useParentRequestOtpMutation();

  useEffect(() => {
    if (!phone) {
      navigate(mode === 'parent' ? '/auth/login' : '/auth/register');
      return;
    }

    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => clearInterval(interval);
  }, [timer, phone, navigate, mode]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setServerError('يرجى إدخال كود التحقق كاملاً (6 أرقام)');
      return;
    }

    setServerError(null);
    const onSuccess = () => {
      navigate(mode === 'parent' ? '/parent' : '/', { replace: true });
    };
    const onError = (err: any) => {
      const msg =
        err.response?.data?.message || 'كود التحقق غير صحيح أو انتهت صلاحيته';
      setServerError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    };

    if (mode === 'parent') {
      verifyParentOtp({ phone, otp: fullCode }, { onSuccess, onError });
    } else {
      verifyOtp({ phone, otp: fullCode }, { onSuccess, onError });
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setServerError(null);
    const onResendError = (err: any) => {
      const msg = err.response?.data?.message || 'فشل في إعادة إرسال الكود';
      setServerError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    };

    if (mode === 'parent') {
      resendParentOtp(
        { phone },
        {
          onSuccess: () => {
            setResendSuccess(true);
            setTimer(120);
            setCanResend(false);
            setTimeout(() => setResendSuccess(false), 4000);
          },
          onError: onResendError,
        }
      );
      return;
    }

    resendOtp(
      { phone },
      {
        onSuccess: () => {
          setResendSuccess(true);
          setTimer(120);
          setCanResend(false);
          setTimeout(() => setResendSuccess(false), 4000);
        },
        onError: onResendError,
      }
    );
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-surface-card border border-gold-500/30 overflow-hidden shadow-2xl p-8 sm:p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mx-auto mb-6 shadow-gold-glow">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold font-amiri text-gold-300 mb-2">
          {mode === 'parent' ? 'تأكيد دخول ولي الأمر' : 'تأكيد رقم الهاتف'}
        </h1>
        <p className="text-xs text-ivory-muted leading-relaxed mb-6">
          {mode === 'parent'
            ? 'تم إرسال كود تحقق مكون من 6 أرقام إلى رقم هاتفك:'
            : 'تم إرسال كود تأكيد مكون من 6 أرقام إلى الرقم:'}{' '}
          <span className="text-gold-300 font-bold tracking-wider" dir="ltr">
            {phone}
          </span>
        </p>

        {serverError && (
          <div
            key={serverError}
            className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 animate-error-shake"
          >
            {serverError}
          </div>
        )}

        {resendSuccess && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>تم إرسال كود جديد بنجاح</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-surface border border-surface-border text-gold-300 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
              />
            ))}
          </div>

          <Button
            type="submit"
            isLoading={mode === 'parent' ? isParentVerifying : isVerifying}
            className="w-full"
            size="lg"
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
          >
            {mode === 'parent' ? 'تأكيد ودخول' : 'تأكيد وتفعيل الحساب'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-surface-border flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending || isParentResending}
            className={`flex items-center gap-1.5 font-medium transition-colors ${
              canResend
                ? 'text-gold-400 hover:text-gold-300 cursor-pointer'
                : 'text-ivory-muted/40 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة إرسال الكود</span>
          </button>

          <span className="text-ivory-muted">
            {canResend ? 'متاح الآن' : `متبقي ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>
    </div>
  );
};
