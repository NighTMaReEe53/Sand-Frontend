import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileQuestion,
  Clock,
  Award,
  PlayCircle,
  History,
  ArrowRight,
  Plus,
  Edit,
  Users,
  Settings,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useCourseExamsQuery } from '../../hooks/queries/useExams';
import { useCourseDetailQuery } from '../../hooks/queries/useCourses';
import { useAuthStore } from '../../store/authStore';
import { formatDuration } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { SectionHeading } from '../../components/ui/SectionHeading';

/** Live ticking countdown ("يبدأ خلال 02:15:30") until the target ISO date */
const CountdownChip: React.FC<{ targetIso: string; onFinish?: () => void }> = ({
  targetIso,
  onFinish,
}) => {
  const [now, setNow] = React.useState(Date.now());
  const finishedRef = React.useRef(false);
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const diff = new Date(targetIso).getTime() - now;

  React.useEffect(() => {
    if (diff <= 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinish?.();
    }
  }, [diff, onFinish]);

  if (diff <= 0) return <Badge variant="success" size="sm">بدأ الآن</Badge>;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 px-2.5 py-1 text-[11px] font-bold text-gold-300 tabular-nums">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      يبدأ خلال {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
};

export const CourseExamsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const queryClient = useQueryClient();

  const isTeacherOrAdmin = role === 'TEACHER' || role === 'ADMIN';

  const { data: course, isLoading: isLoadingCourse } = useCourseDetailQuery(courseId);
  const { data: exams, isLoading: isLoadingExams, isError } = useCourseExamsQuery(courseId);

  if (isLoadingExams || isLoadingCourse) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
          {isTeacherOrAdmin ? <ShieldAlert className="w-8 h-8" /> : <FileQuestion className="w-8 h-8" />}
        </div>
        <h2 className="text-xl font-bold font-display text-gold-300">
          {isTeacherOrAdmin
            ? 'لا تملك صلاحية الوصول لامتحانات هذا الكورس'
            : 'يجب أن تكون مشتركاً في الكورس لعرض الامتحانات'}
        </h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {isTeacherOrAdmin
            ? 'تأكد من أن هذا الكورس يتبع حسابك التدريسي لتتمكن من إدارة امتحاناته.'
            : 'يرجى الاشتراك في الكورس وتفعيل الدفع لتتمكن من دخول الامتحانات وحل بنك الأسئلة.'}
        </p>
        <Link to={isTeacherOrAdmin ? '/dashboard/courses' : `/courses/${courseId}`}>
          <Button variant="primary">
            {isTeacherOrAdmin ? 'العودة لإدارة الكورسات' : 'الذهاب لصفحة الكورس'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right">
      {/* ─── Decorative background vectors ───────────────────────────── */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-10 h-96 w-full text-gold-500 opacity-[0.045]"
        viewBox="0 0 1440 384"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <pattern
            id="exams-hatch"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1440" height="384" fill="url(#exams-hatch)" />
        <circle cx="1320" cy="20" r="180" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="1320" cy="20" r="115" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        <circle cx="80" cy="360" r="140" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-border pb-6 relative z-10">
        <SectionHeading
          as="h1"
          accent="arrow"
          icon={<FileQuestion className="w-7 h-7 text-gold-400" />}
          badge={
            <Link
              to={`/courses/${courseId}`}
              className="text-xs text-gold-400 hover:underline flex items-center gap-1"
            >
              <span>{course?.title || 'الكورس'}</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          }
          subtitle={
            isTeacherOrAdmin
              ? 'يمكنك من هنا مراجعة امتحانات الكورس، إدارة الأسئلة وبنك التدريبات، ومتابعة تسليمات الطلاب.'
              : 'امتحانات دورية وشاملة لقياس مستوى الفهم والتدريب على نمط أسئلة الثانوية العامة.'
          }
        >
          امتحانات وبنك أسئلة الكورس
        </SectionHeading>

        {/* Teacher Action: Create Exam Button */}
        {isTeacherOrAdmin && (
          <Link to="/dashboard/exams">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              className="font-bold shadow-gold-glow"
            >
              إنشاء امتحان جديد
            </Button>
          </Link>
        )}

        {/* Student Action: Practice Mistakes Exam */}
        {!isTeacherOrAdmin && (
          <Link to={`/my-mistakes/practice?courseId=${courseId}`}>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4 text-gold-400" />}
              className="font-bold shadow-gold-glow"
            >
              امتحان من أخطائي في الكورس
            </Button>
          </Link>
        )}
      </div>

      {/* ─── Counters strip (per-subject summary) ────────────────────── */}
      {exams && exams.length > 0 && (() => {
        const now = Date.now();
        const total = exams.length;
        const availableNow = exams.filter(
          (e: any) =>
            e.isAvailable !== false &&
            (!e.startAt || new Date(e.startAt).getTime() <= now) &&
            (!e.endAt || new Date(e.endAt).getTime() >= now),
        ).length;
        const upcoming = exams.filter(
          (e: any) => !!e.startAt && new Date(e.startAt).getTime() > now,
        ).length;
        const ended = exams.filter(
          (e: any) => !!e.endAt && new Date(e.endAt).getTime() < now,
        ).length;

        const counters = [
          { label: 'إجمالي الامتحانات', value: total, icon: FileQuestion, tone: 'text-gold-300 border-gold-500/30 bg-gold-500/10' },
          { label: 'متاح الآن', value: availableNow, icon: PlayCircle, tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
          { label: 'يبدأ قريباً', value: upcoming, icon: Clock, tone: 'text-sky-300 border-sky-500/30 bg-sky-500/10' },
          { label: 'انتهى', value: ended, icon: History, tone: 'text-red-300 border-red-500/30 bg-red-500/10' },
        ];

        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 relative z-10">
            {counters.map((c) => (
              <div
                key={c.label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${c.tone}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/30 bg-white/5">
                  <c.icon className="h-4.5 w-4.5" />
                </span>
                <div className="leading-tight">
                  <p className="text-lg font-black font-display tabular-nums">{c.value}</p>
                  <p className="text-[11px] text-ink-muted">{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Exams List */}
      {!exams || exams.length === 0 ? (
        <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4">
          <FileQuestion className="w-12 h-12 text-gold-400/40 mx-auto" />
          <h3 className="text-lg font-bold font-display text-ink">
            {isTeacherOrAdmin ? 'لم تقم بإنشاء أي امتحانات لهذا الكورس بعد' : 'لا توجد امتحانات منشورة حالياً'}
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            {isTeacherOrAdmin
              ? 'ابدأ الآن بإنشاء أول امتحان وأضف الأسئلة من بنك الأسئلة ليتمكن طلابك من التدرب فوراً.'
              : 'سيقوم الأستاذ بنشر امتحانات جديدة بعد الانتهاء من شرح الدروس.'}
          </p>
          {isTeacherOrAdmin && (
            <Link to="/dashboard/exams">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                إنشاء امتحان الآن
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {exams.map((exam: any, idx: number) => {
            const now = Date.now();
            const isAvailable = exam.isAvailable !== false;
            const notStarted = !!exam.startAt && new Date(exam.startAt).getTime() > now;
            const formatDT = (iso?: string | null) =>
              iso
                ? new Date(iso).toLocaleString('ar-EG', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;
            return (
              <div
                key={exam.id}
                className={`relative p-6 pr-7 rounded-2xl bg-surface-card border transition-all duration-200 hover:-translate-y-0.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-card overflow-hidden ${
                  isAvailable
                    ? 'border-surface-border hover:border-gold-500/40'
                    : 'border-surface-border/60 opacity-75'
                }`}
              >
                {/* Gold index rail */}
                <span className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-gold-400 via-gold-500 to-gold-700" />

                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-300 font-display font-bold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-bold font-display text-ink">{exam.title}</h3>
                    <Badge variant="gold" size="sm">
                      {exam._count?.questions ?? exam.questionCount ?? 0} أسئلة
                    </Badge>
                    {!isTeacherOrAdmin && (exam.myAttemptsCount ?? 0) > 0 && (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3 ml-0.5" />
                        تم الحل ({exam.myAttemptsCount} محاولات)
                      </Badge>
                    )}
                    {!isTeacherOrAdmin && !isAvailable && (
                      <Badge variant="warning" size="sm">
                        <Clock className="w-3 h-3 ml-0.5" />
                        غير متاح حالياً
                      </Badge>
                    )}
                    {/* Live countdown until a scheduled exam opens — refetches when it hits zero */}
                    {!isTeacherOrAdmin && notStarted && exam.startAt && (
                      <CountdownChip
                        targetIso={exam.startAt}
                        onFinish={() =>
                          queryClient.invalidateQueries({ queryKey: ['course-exams', courseId] })
                        }
                      />
                    )}
                    {isTeacherOrAdmin && (
                      <Badge variant={exam.isPublished ? 'success' : 'neutral'} size="sm">
                        {exam.isPublished ? 'منشور للطلاب' : 'مسودة'}
                      </Badge>
                    )}
                  </div>

                  {exam.description && (
                    <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                      {exam.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gold-400" />
                      المدة: {formatDuration(exam.durationMinutes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-gold-400" />
                      الدرجة الكلية: {exam.totalMarks} (النجاح من {exam.passingMarks})
                    </span>
                    {exam.maxAttempts > 1 && (
                      <span className="flex items-center gap-1">
                        <History className="w-3.5 h-3.5 text-gold-400" />
                        حتى {exam.maxAttempts} محاولات
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions based on Role */}
                <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center shrink-0">
                  {isTeacherOrAdmin ? (
                    <>
                      <Link to={`/dashboard/exams/${exam.id}/questions`}>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Settings className="w-4 h-4" />}
                          className="text-xs font-bold"
                        >
                          إدارة الأسئلة
                        </Button>
                      </Link>

                      <Link to={`/dashboard/exams/${exam.id}/submissions`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Users className="w-4 h-4" />}
                          className="text-xs"
                        >
                          إجابات الطلاب
                        </Button>
                      </Link>

                      <Link to="/dashboard/exams">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          تعديل
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {(exam.myAttemptsCount ?? 0) > 0 && (
                        <Link to={`/exams/${exam.id}/my-attempts`}>
                          <Button variant="secondary" size="sm" leftIcon={<History className="w-4 h-4" />}>
                            محاولاتي السابقة
                          </Button>
                        </Link>
                      )}

                      {(exam.myAttemptsCount ?? 0) > 0 ? (
                        <Link to={`/exams/${exam.id}/my-attempts`}>
                          <Button size="sm" variant="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                            عرض النتيجة
                          </Button>
                        </Link>
                      ) : isAvailable ? (
                        <Link to={`/exams/${exam.id}/attempt`}>
                          <Button size="sm" leftIcon={<PlayCircle className="w-4 h-4" />}>
                            بدء الامتحان
                          </Button>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted/60 bg-surface px-3 py-1.5 rounded-lg border border-surface-border cursor-not-allowed">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>غير متاح</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
