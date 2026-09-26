import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Trophy,
  Phone,
  FileText,
} from 'lucide-react';
import {
  useExamSubmissionsQuery,
  useAttemptDetailQuery,
} from '../../hooks/queries/useExams';
import { examsApi } from '../../api/exams.api';
import { formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { AnswerSheetReview } from '../../components/dashboard/AnswerSheetReview';
import { useQuery } from '@tanstack/react-query';

const isInProgressStatus = (status: string) => status === 'IN_PROGRESS';

export const DashboardSubmissionsPage: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();

  const { data: submissionsData, isLoading } = useExamSubmissionsQuery(examId, !!examId);
  const [viewingAttemptId, setViewingAttemptId] = useState<string | null>(null);

  const { data: attemptDetail, isLoading: isLoadingDetail } = useAttemptDetailQuery(
    viewingAttemptId || undefined,
    !!viewingAttemptId
  );

  // The backend returns raw attempt rows (key: attempts) — map them into
  // display-friendly submission rows
  const submissions = useMemo(
    () =>
      (submissionsData?.attempts ?? []).map((a) => ({
        attemptId: a.id,
        attemptNumber: a.attemptNumber,
        status: a.status,
        score: a.score,
        isPassed: a.isPassed,
        submittedAt: a.submittedAt ?? null,
        studentName: a.student?.fullName ?? 'طالب',
        studentPhone: a.student?.user?.phone ?? null,
        gradeLevel: a.student?.gradeLevel,
        answersCount: a._count?.answers ?? 0,
      })),
    [submissionsData]
  );

  // Rankings (Phase 7) — top/bottom scorers toggle
  const [rankOrder, setRankOrder] = useState<'top' | 'bottom'>('top');
  const { data: rankingsData, isFetching: isRankingsLoading } = useQuery({
    queryKey: ['exam-rankings', examId, rankOrder],
    queryFn: () => examsApi.getRankings(examId!, rankOrder),
    enabled: !!examId,
  });

  // Selected student — clicking a submission row opens a full info modal
  const [selectedStudent, setSelectedStudent] = useState<(typeof submissions)[number] | null>(null);
  // Compact paper preview for the student modal
  const { data: studentPaper } = useAttemptDetailQuery(
    selectedStudent?.attemptId || undefined,
    !!selectedStudent
  );

  if (isLoading) {
    return (
      <div className="space-y-6 text-right">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const exam = submissionsData?.exam;
  const stats = submissionsData?.stats || {
    totalSubmissions: 0,
    passCount: 0,
    failCount: 0,
    passRate: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
  };

  // Highest & lowest scoring students (from submitted attempts)
  const gradedSubmissions = submissions.filter(
    (s) => s.status !== 'IN_PROGRESS' && s.submittedAt && s.score != null
  );
  const topStudent =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((best, s) => ((s.score ?? 0) > (best.score ?? 0) ? s : best))
      : null;
  const lowStudent =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((worst, s) => ((s.score ?? 0) < (worst.score ?? 0) ? s : worst))
      : null;

  return (
    <div className="space-y-8 text-right">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/exams"
            className="text-xs text-gold-400 hover:underline flex items-center gap-1"
          >
            <span>الامتحانات</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">
          تسليمات وإحصائيات: {exam?.title}
        </h1>
        <p className="text-xs sm:text-sm text-ivory-muted">
          مراجعة نتائج الطلاب، نسب النجاح، والاطلاع على أوراق إجابات الطلاب تفصيلياً.
        </p>
      </div>

      {/* ─── Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-2">
          <span className="text-xs text-ivory-muted">إجمالي التسليمات</span>
          <div className="text-2xl font-bold font-amiri text-gold-300">
            {stats.totalSubmissions} طالب
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-2">
          <span className="text-xs text-ivory-muted">نسبة النجاح العامة</span>
          <div className="text-2xl font-bold font-amiri text-emerald-400">
            {Math.round(stats.passRate)}%
          </div>
          <span className="block text-[10px] text-ivory-muted">
            {stats.passCount} ناجح • {stats.failCount} راسب
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-2">
          <span className="text-xs text-ivory-muted">متوسط درجات الطلاب</span>
          <div className="text-2xl font-bold font-amiri text-blue-400">
            {Math.round(stats.averageScore)} / {exam?.totalMarks || 100}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-2.5">
          <span className="text-xs text-ivory-muted">أعلى وأدنى درجة</span>

          {/* Highest */}
          <div className="flex items-center gap-2.5">
            {topStudent ? (
              <>
                <Trophy className="w-4 h-4 text-gold-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gold-300 truncate">{topStudent.studentName}</p>
                  <p className="text-[10px] text-ivory-muted">
                    أعلى درجة: <strong className="text-gold-300">{topStudent.score}</strong> / {exam?.totalMarks}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-[11px] text-ivory-muted">لا توجد درجات بعد</span>
            )}
          </div>

          <div className="h-px bg-surface-border" />

          {/* Lowest */}
          <div className="flex items-center gap-2.5">
            {lowStudent ? (
              <>
                <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ivory truncate">{lowStudent.studentName}</p>
                  <p className="text-[10px] text-ivory-muted">
                    أدنى درجة: <strong className="text-red-400">{lowStudent.score}</strong> / {exam?.totalMarks}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-[11px] text-ivory-muted">—</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Rankings: Top / Bottom scorers (Phase 7) ───────────────── */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-bold font-display text-gold-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            ترتيب الطلاب
          </h2>
          <div className="flex items-center gap-2">
            {(['top', 'bottom'] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setRankOrder(o)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95 ${
                  rankOrder === o
                    ? 'bg-gold-gradient text-bg font-bold shadow-gold-glow'
                    : 'bg-surface text-ivory-muted hover:text-ivory border border-transparent hover:border-surface-border'
                }`}
              >
                {o === 'top' ? 'الأعلى درجة' : 'الأدنى درجة'}
              </button>
            ))}
          </div>
        </div>

        {isRankingsLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : !rankingsData || rankingsData.rankings.length === 0 ? (
          <p className="text-xs text-ivory-muted text-center py-4">
            لا توجد نتائج مسلّمة بعد لعرض الترتيب.
          </p>
        ) : (
          <ol className="space-y-2" dir="rtl">
            {rankingsData.rankings.map((r, i) => {
              const pct =
                rankingsData.exam.totalMarks > 0
                  ? Math.round((r.score / rankingsData.exam.totalMarks) * 100)
                  : 0;
              return (
                <li
                  key={r.attemptId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-surface-border"
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      i === 0 && rankOrder === 'top'
                        ? 'bg-gold-gradient text-bg'
                        : 'bg-surface text-ivory-muted'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ivory truncate">{r.studentName}</p>
                    <p className="text-[10px] text-ivory-muted/70">
                      {r.score} / {rankingsData.exam.totalMarks} • {formatDate(r.submittedAt ?? '')}
                    </p>
                  </div>
                  <ProgressBar value={pct} size="sm" showLabel={false} className="w-24 shrink-0" />
                </li>
                );
              })}
            </ol>
          )}
        </div>

      {/* ─── Submissions Table ───────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-amiri text-gold-300">قائمة تسليمات الطلاب</h2>

        {submissions.length === 0 ? (
          <div className="p-16 rounded-3xl bg-surface-card border border-surface-border text-center space-y-3">
            <Users className="w-12 h-12 text-gold-400/40 mx-auto" />
            <h3 className="text-base font-bold font-amiri text-ivory">لا توجد تسليمات حتى الآن</h3>
            <p className="text-xs text-ivory-muted">
              سيظهر الطلاب هنا فور بدئهم وتسليمهم للامتحان.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => {
              const isInProgress = sub.status === 'IN_PROGRESS';
              const isGraded = !isInProgress && sub.submittedAt;
              return (
              <div
                key={sub.attemptId}
                onClick={() => setSelectedStudent(sub)}
                className="p-5 rounded-2xl bg-surface-card border border-surface-border hover:border-gold-500/30 hover:cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-ivory">{sub.studentName}</h3>
                    {isInProgress ? (
                      <Badge variant="warning">
                        <Clock className="w-3 h-3 ml-1" />
                        قيد الأداء
                      </Badge>
                    ) : (
                      <Badge variant={sub.isPassed ? 'success' : 'danger'}>
                        {sub.isPassed ? 'ناجح' : 'راسب'}
                      </Badge>
                    )}
                    <span className="text-[10px] text-ivory-muted/70">
                      المحاولة #{sub.attemptNumber}
                    </span>
                  </div>

                  <p className="text-xs text-ivory-muted">
                    {sub.studentPhone && (
                      <>
                        هاتف الطالب: <span dir="ltr">{sub.studentPhone}</span> •{' '}
                      </>
                    )}
                    {isInProgress ? (
                      <>الامتحان جارٍ الآن — لم يُسلّم بعد.</>
                    ) : (
                      <>
                        الدرجة:{' '}
                        <strong className="text-gold-300 font-bold">
                          {sub.score ?? 0} / {exam?.totalMarks}
                        </strong>{' '}
                        • تاريخ التسليم: {formatDate(sub.submittedAt)}
                      </>
                    )}
                  </p>
                </div>

                {isGraded && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingAttemptId(sub.attemptId);
                    }}
                    leftIcon={<Eye className="w-4 h-4" />}
                    className="shrink-0"
                  >
                    عرض ورقة الإجابة
                  </Button>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Selected Student Info Modal ─────────────────────────────── */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={`ملف الطالب: ${selectedStudent?.studentName ?? ''}`}
        maxWidth="md"
      >
        {selectedStudent && (
          <div className="space-y-4 text-right">
            {/* Identity */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg-elevated border border-surface-border">
              <div className="w-14 h-14 rounded-full bg-gold-gradient p-0.5 shrink-0">
                <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-gold-300 font-display font-bold text-xl">
                  {selectedStudent.studentName[0]}
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold text-ivory">{selectedStudent.studentName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ivory-muted">
                  {selectedStudent.studentPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gold-400" />
                      <span dir="ltr">{selectedStudent.studentPhone}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-gold-400" />
                    المحاولة #{selectedStudent.attemptNumber}
                  </span>
                  {selectedStudent.submittedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gold-400" />
                      {formatDate(selectedStudent.submittedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Exam performance in this exam */}
            <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2">
              <p className="text-xs font-bold text-gold-300">الأداء في هذا الامتحان</p>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {selectedStudent.status === 'IN_PROGRESS' ? (
                  <Badge variant="warning">
                    <Clock className="w-3 h-3 ml-1" />
                    قيد الأداء الآن — لم يُسلّم بعد
                  </Badge>
                ) : (
                  <>
                    <Badge variant={selectedStudent.isPassed ? 'success' : 'danger'}>
                      {selectedStudent.isPassed ? 'ناجح' : 'راسب'}
                    </Badge>
                    <span className="text-sm font-bold text-gold-300 tabular-nums">
                      {selectedStudent.score ?? 0} / {exam?.totalMarks}
                    </span>
                  </>
                )}
              </div>
              {!isInProgressStatus(selectedStudent.status) &&
                exam?.passingMarks !== undefined && (
                  <p className="text-[10px] text-ivory-muted">
                    درجة النجاح: {exam.passingMarks}
                  </p>
                )}
            </div>

            {/* Paper summary — what the student actually saw & chose */}
            {studentPaper?.answers && studentPaper.answers.length > 0 && (
              <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  ورقة الامتحان — إجابات الطالب
                </p>
                <ul className="space-y-1.5">
                  {studentPaper.answers.map((ans: any, idx: number) => {
                    const opts = Array.isArray(ans.question?.options)
                      ? (ans.question.options as string[])
                      : [];
                    const chosen =
                      ans.selectedOptionIndex != null ? opts[ans.selectedOptionIndex] : null;
                    return (
                      <li
                        key={ans.id ?? idx}
                        className="flex items-center justify-between gap-2 text-[11px] px-2.5 py-2 rounded-lg bg-bg-elevated border border-surface-border"
                      >
                        <span className="min-w-0 truncate text-ivory">
                          <span className="text-gold-400 font-bold ml-1">{idx + 1}.</span>
                          {ans.question?.text}
                        </span>
                        <span className="shrink-0 flex items-center gap-1.5">
                          {chosen && (
                            <span className="text-ivory-muted truncate max-w-[9rem]">{chosen}</span>
                          )}
                          {ans.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
                  {selectedStudent.submittedAt && !isInProgressStatus(selectedStudent.status) && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Eye className="w-4 h-4" />}
                  onClick={() => {
                    setViewingAttemptId(selectedStudent.attemptId);
                    setSelectedStudent(null);
                  }}
                >
                  عرض ورقة الإجابة
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Student Full Answer Sheet Modal ─────────────────────────── */}
      <Modal
        isOpen={!!viewingAttemptId}
        onClose={() => setViewingAttemptId(null)}
        title="ورقة إجابة الطالب التفصيلية"
        maxWidth="2xl"
      >
        <div className="space-y-6 text-right max-h-[70vh] overflow-y-auto p-1">
          {isLoadingDetail || !attemptDetail ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : (
            <>
              {/* Summary Header */}
              <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-ivory-muted">الدرجة المحققة:</span>
                  <div className="text-xl font-bold font-display text-gold-300">
                    {attemptDetail.score ?? 0} / {attemptDetail.exam.totalMarks}
                  </div>
                </div>

                <Badge variant={attemptDetail.isPassed ? 'success' : 'danger'}>
                  {attemptDetail.isPassed ? 'ناجح' : 'راسب'}
                </Badge>
              </div>

              {/* Answers List */}
              <div className="space-y-4">
                <AnswerSheetReview
                  answers={(attemptDetail.answers ?? []).map((ans) => ({
                    id: ans.id,
                    text: ans.question?.text ?? '',
                    options: ans.question?.options,
                    selectedOptionIndex: ans.selectedOptionIndex,
                    correctOptionIndex: ans.question?.correctOptionIndex,
                    isCorrect: ans.isCorrect,
                    awardedMarks: ans.awardedMarks,
                  }))}
                />
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setViewingAttemptId(null)}>
              إغلاق ورقة الإجابة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
