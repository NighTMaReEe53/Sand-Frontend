export type ExamAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'TIMED_OUT';

export interface ExamBase {
  id: string;
  courseId: string;
  lessonId?: string | null;
  title: string;
  description?: string | null;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  startAt?: string | null;
  endAt?: string | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showCorrectAnswersAfterSubmission: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    questions: number;
    attempts: number;
  };
}

/**
 * Question version seen by STUDENT during an active attempt.
 * STRICTLY does NOT contain `correctOptionIndex` or `explanation` to prevent client-side leakage.
 */
export interface ExamQuestionForAttempt {
  id: string;
  examId: string;
  text: string;
  imageUrl?: string | null;
  options: string[]; // Options array, e.g. ["A", "B", "C", "D"]
  orderIndex: number;
  marks: number;
}

/**
 * Full Question version accessible ONLY by TEACHER or after exam grading with model answers enabled.
 */
export interface ExamQuestionFull extends ExamQuestionForAttempt {
  correctOptionIndex: number;
  explanation?: string | null;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  score?: number | null;
  isPassed?: boolean | null;
  exitCount?: number;
  isEligibleForLeaderboard?: boolean;
  status: ExamAttemptStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SingleQuestionAttempt {
  id: string;
  text: string;
  imageUrl?: string | null;
  options: string[];
  marks: number;
  selectedOptionIndex?: number | null;
}

export interface StartExamResponse {
  message?: string;
  attempt: {
    id: string;
    attemptNumber: number;
    startedAt: string;
    expiresAt: string;
    durationMinutes: number;
    currentIndex?: number;
    totalQuestions?: number;
    timeRemainingSeconds?: number;
    sessionKey?: string;
    exitCount?: number;
    isEligibleForLeaderboard?: boolean;
    answeredQuestionIndexes?: number[];
  };
  currentQuestion?: SingleQuestionAttempt | null;
  questions?: ExamQuestionForAttempt[];
}

export interface GetAttemptQuestionResponse {
  attemptId: string;
  currentIndex: number;
  totalQuestions: number;
  timeRemainingSeconds: number;
  durationMinutes: number;
  question: SingleQuestionAttempt;
}

export interface AnswerQuestionResponse {
  message: string;
  isFinished: boolean;
  nextIndex?: number;
  totalQuestions?: number;
  score?: number;
  totalMarks?: number;
  passingMarks?: number;
  isPassed?: boolean;
}

export interface SubmitAnswerItem {
  questionId: string;
  selectedOptionIndex: number | null;
}

export interface SubmitExamDto {
  answers: SubmitAnswerItem[];
}

export interface AttemptAnswerResult {
  id: string;
  questionId: string;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
  awardedMarks: number;
  question?: ExamQuestionFull;
}

/** Flat shape returned by GET /exams/attempts/:attemptId/result */
export interface ExamResultResponse {
  attemptId: string;
  examId?: string;
  courseId?: string;
  examTitle: string;
  questionCount?: number;
  score: number | null;
  totalMarks: number;
  passingMarks: number;
  isPassed: boolean;
  status: ExamAttemptStatus;
  startedAt?: string;
  submittedAt?: string;
  actualPerformanceRank?: number | null;
  leaderboardEligibility?: {
    eligible: boolean;
    exitCount: number;
    maxAllowedExits: number;
  };
  answers?: {
    questionId: string;
    text: string;
    options: string[];
    yourAnswer: number | null;
    correctAnswer: number;
    explanation: string | null;
    isCorrect: boolean;
    awardedMarks: number;
    totalMarks: number;
  }[];
}

export type ExamExitType = 'TAB_HIDDEN' | 'PAGE_EXIT' | 'ROUTE_CHANGE' | 'PAGE_UNLOAD';

export interface RecordExamExitResponse {
  success: true;
  exitCount: number;
  maxAllowedExits: number;
  isEligibleForLeaderboard: boolean;
}

/** Shape returned by GET /exams/:examId/my-attempts */
export interface MyAttemptsResponse {
  exam: { id: string; title: string; totalMarks: number; passingMarks: number };
  attempts: ExamAttempt[];
}

/** Nested Prisma shape returned by GET /exams/attempts/:attemptId/detail (teacher view) */
export interface AttemptDetailAnswer extends AttemptAnswerResult {
  id: string;
  question?: ExamQuestionFull;
}

export interface AttemptDetailResponse {
  id: string;
  examId: string;
  attemptNumber: number;
  status: ExamAttemptStatus;
  score: number | null;
  isPassed: boolean;
  submittedAt?: string | null;
  expiresAt?: string | null;
  exam: ExamBase;
  answers: AttemptDetailAnswer[];
  [key: string]: unknown;
}

export interface ExamSubmissionsResponse {
  exam: { id: string; title: string; totalMarks: number; passingMarks: number };
  stats: {
    totalSubmissions: number;
    passCount: number;
    failCount: number;
    passRate: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  };
  /** Raw attempt rows as returned by the backend (student info included) */
  attempts: {
    id: string;
    attemptNumber: number;
    status: ExamAttemptStatus;
    score: number | null;
    isPassed: boolean;
    startedAt?: string;
    submittedAt?: string | null;
    expiresAt?: string;
    student?: { fullName: string; userId: string; gradeLevel?: string; user?: { phone?: string | null } };
    _count?: { answers: number };
  }[];
}

export interface CreateExamDto {
  title: string;
  description?: string;
  lessonId?: string;
  durationMinutes: number;
  totalMarks?: number;
  passingMarks?: number;
  startAt?: string;
  endAt?: string;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  showCorrectAnswersAfterSubmission?: boolean;
  isPublished?: boolean;
}

export interface UpdateExamDto extends Partial<CreateExamDto> {}

export interface ExamQuestionsResponse {
  exam: {
    id: string;
    title: string;
    description?: string | null;
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    isPublished: boolean;
  };
  questions: ExamQuestionFull[];
}

export interface CreateQuestionDto {
  text: string;
  imageUrl?: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  orderIndex?: number;
  marks?: number;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {}
