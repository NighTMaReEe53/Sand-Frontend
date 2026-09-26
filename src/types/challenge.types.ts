export type ChallengeStatus =
  | 'PENDING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'EXPIRED';

export interface ChallengeListItem {
  id: string;
  courseTitle: string;
  status: ChallengeStatus;
  questionCount: number;
  createdAt: string;
  challenger: string;
  challengerPhotoUrl?: string | null;
  opponent: string;
  opponentPhotoUrl?: string | null;
  iAmChallenger: boolean;
  myScore: number | null;
  opponentScore?: number | null;
  timeTakenSeconds?: number | null;
  outcome?: 'WON' | 'LOST' | 'DRAW' | null;
  vsBot?: boolean;
}

export interface ChallengeAvailability {
  enrolled: boolean;
  questionPool: number;
  minimumQuestions: number;
  eligible: boolean;
  /** Courses that individually have enough questions for a challenge */
  eligibleCourseIds: string[];
}


export interface OnlineStudent {
  studentId: string;
  userId?: string;
  fullName: string;
  photoUrl?: string | null;
}

export interface ChallengeQuestion {
  questionId: string;
  order: number;
  text: string | null;
  imageUrl: string | null;
  options: string[];
  marks: number;
  alreadyAnswered: boolean;
  wasCorrect: boolean | null;
}

export interface ChallengeQuestionReview {
  questionId: string;
  order: number;
  text: string;
  imageUrl: string | null;
  options: string[];
  selectedOption: number | null;
  correctOptionIndex: number | null;
  isCorrect: boolean;
  explanation: string | null;
  sourceType?: 'BANK' | 'EXAM' | 'MISTAKE';
}

export interface ChallengeDetail {
  status: ChallengeStatus;
  expiresAt: string | null;
  remainingSeconds: number;
  questions: ChallengeQuestion[];
}

export interface ChallengeResultPlayer {
  studentId: string;
  fullName: string;
  photoUrl?: string | null;
  score: number;
  correct: number;
  wrong: number;
  unanswered: number;
  timeTakenSeconds: number | null;
  finished: boolean;
}

export interface ChallengeResult {
  status: ChallengeStatus;
  revealed: boolean;
  outcome?: 'WON' | 'LOST' | 'DRAW';
  players?: ChallengeResultPlayer[];
  message?: string;
  remainingSeconds?: number;
  review?: ChallengeQuestionReview[];
}

export interface CreateChallengeDto {
  courseId: string;
  /** مطلوب في اللعب ضد زميل بشري فقط */
  opponentUserId?: string;
  /** اللعب ضد البوت */
  vsBot?: boolean;
  questionCount: number;
  durationSeconds: number;
}
