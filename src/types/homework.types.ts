export interface HomeworkQuestion {
  id: string;
  text: string;
  options: string[];
  marks: number;
  orderIndex: number;
  /** يُرسَل من السيرفر أثناء الحل — يُستخدم لإظهار السؤال بالأحمر عند الإجابة الخاطئة */
  correctOptionIndex?: number;
  /** الطالب يرفع صورة الحل بدلاً من اختيار خيار */
  requiresImageAnswer?: boolean;
}

export interface LessonHomeworkInfo {
  hasHomework: boolean;
  homework?: {
    id: string;
    title: string;
    description: string | null;
    hasPdf: boolean;
    questionCount: number;
    availableFrom: string | null;
    /** هل فُتح الواجب للطلاب؟ */
    isOpen: boolean;
    opensInSeconds?: number | null;
    passingPercentage: number;
    maxAttempts: number;
    remainingAttempts: number;
    hasActiveAttempt: boolean;
    activeAttemptId: string | null;
    hasSubmittedAttempt?: boolean;
    submittedAttemptId?: string | null;
  };
  attempts: {
    id: string;
    attemptNumber: number;
    score: number | null;
    earnedMarks: number | null;
    totalMarks: number | null;
    isPassed: boolean | null;
    status: 'IN_PROGRESS' | 'SUBMITTED';
    submittedAt: string | null;
  }[];
}

export interface StartHomeworkResponse {
  message: string;
  attempt: { id: string; attemptNumber: number; startedAt: string };
  quizTitle: string;
  questions: HomeworkQuestion[];
}

export interface SubmitHomeworkResult {
  message: string;
  score: number;
  earnedMarks: number;
  totalMarks: number;
  passingPercentage: number;
  isPassed: boolean;
  submittedAt: string;
  attemptId?: string;
  hasEssayQuestions?: boolean;
  modelAnswers: {
    questionId: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string | null;
    requiresImageAnswer?: boolean;
    yourAnswer: number | null;
    isCorrect: boolean;
  }[];
}
