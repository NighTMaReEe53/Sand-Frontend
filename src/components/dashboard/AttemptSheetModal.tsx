import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../../api/exams.api';
import { quizzesApi } from '../../api/quizzes.api';
import { homeworkApi } from '../../api/homework.api';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AnswerSheetReview } from './AnswerSheetReview';

/** Which paper to open: an exam, a quiz or a homework attempt */
export type SheetTarget = {
  type: 'EXAM' | 'QUIZ' | 'HOMEWORK';
  attemptId: string;
  title: string;
} | null;

/**
 * Teacher answer-sheet modal: full questions with options, the model
 * answer and the student's choice — for exams, quizzes and homeworks.
 */
export const AttemptSheetModal: React.FC<{ target: SheetTarget; onClose: () => void }> = ({
  target,
  onClose,
}) => {
  const isExam = target?.type === 'EXAM';
  const isHomework = target?.type === 'HOMEWORK';

  // Exam / quiz / homework detail payloads differ slightly — read loosely
  const { data, isLoading } = useQuery<any>({
    queryKey: ['attempt-sheet', target?.type, target?.attemptId],
    queryFn: () => {
      if (!target) return Promise.resolve(null);
      if (target.type === 'EXAM') return examsApi.getAttemptDetail(target.attemptId);
      if (target.type === 'QUIZ') return quizzesApi.getTeacherAttemptDetail(target.attemptId);
      return homeworkApi.getTeacherAttemptDetail(target.attemptId);
    },
    enabled: !!target?.attemptId,
    retry: 1,
  });

  const answers = (data?.answers ?? []).map((a: any) => ({
    id: a.id,
    text: a.question?.text ?? '',
    options: a.question?.options,
    selectedOptionIndex: a.selectedOptionIndex,
    correctOptionIndex: a.question?.correctOptionIndex,
    isCorrect: a.isCorrect,
    awardedMarks: a.awardedMarks,
  }));

  const earned =
    data == null ? null : isExam ? data.score : data.earnedMarks ?? data.score;
  const total = data == null ? null : isExam ? data.exam?.totalMarks : data.totalMarks;

  return (
    <Modal
      isOpen={!!target}
      onClose={onClose}
      title={`ورقة الإجابة — ${target?.title ?? ''}`}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-right max-h-[70vh] overflow-y-auto p-1">
        {isLoading || !data ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-center justify-between">
              <div>
                <span className="text-xs text-ivory-muted">النتيجة:</span>
                <div className="text-xl font-bold font-display text-gold-300">
                  {earned ?? 0} {total != null && `/ ${total}`}
                  {!isExam && total == null && '%'}
                </div>
              </div>
              <Badge variant={data.isPassed ? 'success' : 'danger'}>
                {data.isPassed ? 'ناجح' : 'لم ينجح'}
              </Badge>
            </div>

            {answers.length === 0 ? (
              <p className="p-6 rounded-xl bg-surface border border-surface-border text-center text-xs text-ivory-muted">
                لا توجد إجابات مسجلة على هذه الورقة.
              </p>
            ) : (
              <AnswerSheetReview answers={answers} />
            )}
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            إغلاق ورقة الإجابة
          </Button>
        </div>
      </div>
    </Modal>
  );
};
