import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  Radio,
  User,
  Video,
} from 'lucide-react';
import { useLiveLectureQuery } from '../../hooks/queries/useLiveLectures';
import { LectureStatusBadge } from '../../components/live/LectureStatusBadge';
import { CountdownTimer, useServerTimeOffset } from '../../components/live/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

const formatArabicDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const LiveLectureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lecture, isLoading, isError, error } = useLiveLectureQuery(id);
  const offsetMs = useServerTimeOffset(!!lecture && lecture.status === 'SCHEDULED');

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-10 w-1/2 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !lecture) {
    const status = (error as any)?.response?.status;
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-gold-300">
          {status === 403 ? 'لا تملك صلاحية الوصول' : 'المحاضرة غير موجودة'}
        </h2>
        <p className="text-xs text-ivory-muted">
          {status === 403
            ? 'هذه المحاضرة متاحة فقط لطلاب مشتركين في الكورس.'
            : 'ربما تم حذف المحاضرة أو أن الرابط غير صحيح.'}
        </p>
        <Link to="/live-lectures">
          <Button variant="outline">العودة لقائمة المحاضرات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6 text-right">
      {/* Breadcrumb */}
      <Link
        to="/live-lectures"
        className="inline-flex items-center gap-1 text-xs text-ivory-muted hover:text-gold-300 transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5" />
        المحاضرات المباشرة
      </Link>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <LectureStatusBadge status={lecture.status} />
          <span className="text-[11px] text-ivory-muted bg-surface-card border border-surface-border rounded-lg px-2.5 py-1">
            {lecture.course.title}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-gold-300">{lecture.title}</h1>
        {lecture.description && (
          <p className="text-sm text-ivory-muted leading-relaxed whitespace-pre-line">
            {lecture.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-ivory-muted flex-wrap">
          <User className="w-4 h-4 text-gold-400" />
          <span>{lecture.teacher.fullName}</span>
          <span>•</span>
          <Clock className="w-4 h-4 text-gold-400" />
          <span>{formatArabicDate(lecture.scheduledAt)}</span>
        </div>
      </header>

      {/* State card */}
      {lecture.status === 'SCHEDULED' && (
        <section className="p-8 rounded-3xl bg-surface-card border border-gold-500/30 text-center space-y-4 shadow-card-dark">
          <Radio className="w-10 h-10 text-gold-400 mx-auto opacity-60" />
          <h2 className="font-bold text-ivory">المحاضرة لم تبدأ بعد</h2>
          <p className="text-xs text-ivory-muted">
            تبدأ المحاضرة بعد{' '}
            <CountdownTimer targetIso={lecture.scheduledAt} offsetMs={offsetMs} className="text-gold-300 font-bold text-sm" />
            {' '}— سيظهر زر الانضمام هنا تلقائياً بمجرد أن يبدأ المعلم البث.
          </p>
          <div className="pt-2 inline-flex items-center gap-2 text-[11px] text-gold-400 bg-gold-500/10 border border-gold-500/25 rounded-full px-4 py-1.5">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            في انتظار بدء البث…
          </div>
        </section>
      )}

      {lecture.status === 'LIVE' && (
        <section className="p-8 rounded-3xl bg-red-500/5 border border-red-500/40 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-400 font-bold">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            المحاضرة مباشرة الآن!
          </div>
          <Button
            size="lg"
            className="min-w-56"
            leftIcon={<Video className="w-5 h-5" />}
            onClick={() => navigate(`/live-lectures/${lecture.id}/room`)}
          >
            انضم للمحاضرة الآن
          </Button>
          <p className="text-[11px] text-ivory-muted">
            ستدخل غرفة البث كمستمع — ارفع يدك لو حبيت تتكلم.
          </p>
        </section>
      )}

      {lecture.status === 'ENDED' && (
        <section className="p-8 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
          <h2 className="font-bold text-ivory">انتهت هذه المحاضرة</h2>
          <p className="text-xs text-ivory-muted">
            تم تسجيل حضورك تلقائياً — تابع قائمة المحاضرات القادمة.
          </p>
          <Link to="/live-lectures" className="block">
            <Button variant="outline" size="sm">كل المحاضرات</Button>
          </Link>
        </section>
      )}

      {lecture.status === 'CANCELLED' && (
        <section className="p-8 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3">
          <Ban className="w-10 h-10 text-ivory-muted mx-auto opacity-70" />
          <h2 className="font-bold text-ivory">تم إلغاء هذه المحاضرة</h2>
          <p className="text-xs text-ivory-muted">سيتم جدولة محاضرة بديلة قريباً بإذن الله.</p>
        </section>
      )}
    </div>
  );
};
