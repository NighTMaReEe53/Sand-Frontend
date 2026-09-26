import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  History,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Eye,
  FileQuestion,
  Clock,
  Trophy,
} from 'lucide-react';
import { useMyAttemptsQuery } from '../../hooks/queries/useExams';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { SectionHeading } from '../../components/ui/SectionHeading';

/**
 * GET /exams/:examId/my-attempts returns:
 * { exam: { id, title, totalMarks, passingMarks }, attempts: [...] }
 */
export const MyAttemptsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { data, isLoading, isError } = useMyAttemptsQuery(examId);
  const exam = data?.exam;
  const attempts = Array.isArray(data?.attempts) ? data.attempts : [];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold font-display text-gold-300">تعذر تحميل المحاولات</h2>
        <p className="text-xs text-ivory-muted">
          تأكد من صحة الرابط أو أن هذا الامتحان ما زال متاحاً.
        </p>
        <Link to="/my-courses">
          <Button variant="outline">العودة لكورساتي</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right">
      {/* ─── Decorative background vectors ───────────────────────────── */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-10 h-80 w-full text-gold-500 opacity-[0.045]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <pattern
            id="attempts-hatch"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="28" stroke="currentColor" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1440" height="320" fill="url(#attempts-hatch)" />
        <circle cx="1340" cy="20" r="160" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="60" cy="300" r="130" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeading
          as="h1"
          accent="arrow"
          badge={<Badge variant="gold">سجل المحاولات</Badge>}
          subtitle={exam ? (
            <span className="flex items-center gap-3">
              <span>الدرجة الكلية: {exam.totalMarks}</span>
              <span className="flex items-center gap-1">
                <FileQuestion className="w-3.5 h-3.5 text-gold-400" />
                النجاح عند: {exam.passingMarks}
              </span>
            </span>
          ) : undefined}
        >
          محاولاتي في امتحان: {exam?.title ?? ''}
        </SectionHeading>

        <Link to={`/exams/${examId}/attempt`}>
          <Button size="sm" leftIcon={<PlayCircle className="w-4 h-4" />}>
            بدء محاولة جديدة
          </Button>
        </Link>
      </div>

      {attempts.length === 0 ? (
        <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-4">
          <History className="w-12 h-12 text-gold-400/40 mx-auto" />
          <h3 className="text-lg font-bold font-display text-ivory">لم تقم بأداء هذا الامتحان بعد</h3>
          <p className="text-xs text-ivory-muted">
            اضغط على زر بدء الامتحان لاختبار معلوماتك وتدريب نفسك.
          </p>
          <Link to={`/exams/${examId}/attempt`}>
            <Button size="sm">بدء الامتحان الآن</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const pct =
              exam && exam.totalMarks > 0 && attempt.score != null
                ? Math.min(100, Math.round((attempt.score / exam.totalMarks) * 100))
                : null;
            const isBest =
              pct !== null &&
              attempts.every(
                (a) =>
                  a.id === attempt.id ||
                  a.score == null ||
                  (exam && exam.totalMarks > 0
                    ? (attempt.score ?? 0) >= a.score
                    : false),
              );
            return (
              <div
                key={attempt.id}
                className={`p-5 rounded-2xl bg-surface-card border transition-all hover:-translate-y-0.5 flex items-center justify-between gap-4 ${
                  isBest && attempt.isPassed
                    ? 'border-gold-500/40 shadow-gold-glow'
                    : 'border-surface-border hover:border-gold-500/30'
                }`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-ivory">
                      المحاولة رقم {attempt.attemptNumber}
                    </span>
                    {isBest && attempt.isPassed && (
                      <Badge variant="gold" size="sm">
                        <Trophy className="w-3 h-3 ml-0.5" />
                        أفضل نتيجة
                      </Badge>
                    )}
                    <Badge variant={attempt.isPassed ? 'success' : 'danger'}>
                      {attempt.isPassed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 ml-1" />
                          ناجح
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 ml-1" />
                          راسب
                        </>
                      )}
                    </Badge>
                    {(attempt.status === 'TIMED_OUT' || attempt.status === 'EXPIRED') && (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3 ml-1" />
                        انتهى الوقت
                      </Badge>
                    )}
                  </div>

                  {/* Score progress bar */}
                  {pct !== null ? (
                    <div className="max-w-xs space-y-1">
                      <div className="h-1.5 rounded-full bg-surface border border-surface-border overflow-hidden" dir="ltr">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            attempt.isPassed
                              ? 'bg-gradient-to-r from-gold-600 to-gold-300'
                              : 'bg-red-500/70'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-ivory-muted">
                        الدرجة:{' '}
                        <strong className="text-gold-300 font-bold">{attempt.score}</strong> من{' '}
                        {exam?.totalMarks} • {formatDate(attempt.submittedAt ?? '')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-ivory-muted">لم يتم تسليم هذه المحاولة.</p>
                  )}
                </div>

                {attempt.submittedAt && attempt.status !== 'IN_PROGRESS' && (
                  <Link to={`/exams/attempts/${attempt.id}/result`} className="shrink-0">
                    <Button variant="secondary" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                      عرض النتيجة
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
