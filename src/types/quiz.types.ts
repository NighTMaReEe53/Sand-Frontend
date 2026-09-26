export interface QuizQuestionForAttempt {
  id: string;
  text: string;
  options: string[];
  marks: number;
}

export interface StartQuizResponse {
  action: 'start' | 'resume' | 'view_result' | 'cooldown_wait' | 'locked_exhausted';
  message: string;
  attemptId?: string; // only when action === 'view_result'
  attempt?: {
    id: string;
    attemptNumber: number;
    startedAt: string;
    expiresAt: string | null;
    timeRemainingSeconds: number | null;
  };
  quizTitle?: string;
  questions?: QuizQuestionForAttempt[];
  serverTime?: string;
}

export interface LessonQuizInfo {
  hasQuiz: boolean;
  action: 'start' | 'resume' | 'view_result' | 'cooldown_wait' | 'locked_exhausted';
  cooldownRemainingSeconds?: number;
  canRetryAt?: string | null;
  message?: string | null;
  maxAttempts?: number;
  attemptNumber?: number;
  isPassed?: boolean;
  quiz?: {
    id: string;
    title: string;
    questionCount: number;
    timeLimitMinutes: number | null;
    passingPercentage?: number;
  };
  attempt?: {
    id: string;
    attemptNumber: number;
    score: number | null;
    earnedMarks: number | null;
    totalMarks: number | null;
    isPassed: boolean | null;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
    submittedAt: string | null;
  } | null;
}

export interface SubmitQuizResult {
  attemptId?: string;
  message: string;
  score: number;
  earnedMarks: number;
  totalMarks: number;
  passingPercentage: number;
  isPassed: boolean;
  startedAt?: string;
  submittedAt: string;
  modelAnswers: {
    questionId: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string | null;
    yourAnswer: number | null;
    isCorrect: boolean;
  }[];
}
