import React from 'react';
import { Badge } from '../ui/Badge';

/** Normalized single question + student answer for read-only review */
export interface ReviewAnswer {
  id?: string;
  text: string;
  options: unknown;
  selectedOptionIndex?: number | null;
  correctOptionIndex?: number | null;
  isCorrect: boolean;
  awardedMarks?: number | null;
  explanation?: string | null;
}

interface AnswerSheetReviewProps {
  answers: (ReviewAnswer & Record<string, unknown>)[];
  /** label prefix, e.g. "السؤال" */
  questionLabel?: string;
}

/**
 * Read-only answer sheet renderer shared by teacher surfaces
 * (exam submissions, quiz/homework attempt reviews).
 * Shows every question with its options: model answer highlighted,
 * wrong student choice marked in red.
 */
export const AnswerSheetReview: React.FC<AnswerSheetReviewProps> = ({
  answers,
  questionLabel = 'السؤال',
}) => (
  <div className="space-y-4">
    {answers.map((ans, idx) => {
      const options = Array.isArray(ans.options) ? (ans.options as string[]) : [];
      return (
        <div
          key={ans.id ?? idx}
          className={`p-5 rounded-2xl border space-y-3 ${
            ans.isCorrect ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-red-500/5 border-red-500/30'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs font-bold text-gold-400">
              {questionLabel} {idx + 1}
            </span>
            <Badge variant={ans.isCorrect ? 'success' : 'danger'}>
              {ans.isCorrect
                ? ans.awardedMarks != null
                  ? `صحيحة (+${ans.awardedMarks})`
                  : 'صحيحة'
                : 'خاطئة'}
            </Badge>
          </div>

          <h4 className="text-sm font-bold text-ivory font-display">{ans.text}</h4>

          <div className="space-y-1.5 pt-1">
            {options.map((opt, optIdx) => {
              const isStudentChoice = ans.selectedOptionIndex === optIdx;
              const isModelAnswer = ans.correctOptionIndex === optIdx;

              let style = 'bg-surface border-surface-border text-ivory-muted';
              if (isModelAnswer) {
                style = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold';
              } else if (isStudentChoice && !ans.isCorrect) {
                style = 'bg-red-500/15 border-red-500/50 text-red-300';
              }

              return (
                <div
                  key={optIdx}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${style}`}
                >
                  <span>
                    {String.fromCharCode(65 + optIdx)}. {opt}
                  </span>

                  {isModelAnswer && (
                    <span className="text-[10px] text-emerald-400 font-bold shrink-0 mr-2">
                      الإجابة الصحيحة
                    </span>
                  )}
                  {isStudentChoice && !isModelAnswer && (
                    <span className="text-[10px] text-red-400 font-bold shrink-0 mr-2">
                      إجابة الطالب
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {ans.explanation && (
            <p className="text-[11px] leading-relaxed text-ivory-muted border-t border-surface-border pt-2">
              <span className="font-bold text-gold-400">التوضيح: </span>
              {ans.explanation}
            </p>
          )}
        </div>
      );
    })}
  </div>
);
