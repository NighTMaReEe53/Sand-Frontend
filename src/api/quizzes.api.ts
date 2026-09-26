import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  LessonQuizInfo,
  StartQuizResponse,
  SubmitQuizResult,
} from '../types/quiz.types';

export interface CreateQuizDto {
  title: string;
  passingPercentage?: number;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  isPublished?: boolean;
  questions?: {
    text: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    marks?: number;
    orderIndex?: number;
  }[];
}

export const quizzesApi = {
  // Student
  getLessonQuiz: async (lessonId: string): Promise<LessonQuizInfo> => {
    const res = await axiosInstance.get<LessonQuizInfo>(ENDPOINTS.QUIZZES.LESSON_QUIZ(lessonId));
    return res.data;
  },

  startAttempt: async (quizId: string): Promise<StartQuizResponse> => {
    const res = await axiosInstance.post<StartQuizResponse>(ENDPOINTS.QUIZZES.START(quizId));
    return res.data;
  },

  submitAttempt: async (
    attemptId: string,
    answers: { questionId: string; selectedOptionIndex: number }[]
  ): Promise<SubmitQuizResult> => {
    const res = await axiosInstance.post<SubmitQuizResult>(
      ENDPOINTS.QUIZZES.SUBMIT(attemptId),
      { answers }
    );
    return res.data;
  },

  getResult: async (attemptId: string, signal?: AbortSignal): Promise<SubmitQuizResult> => {
    const res = await axiosInstance.get<SubmitQuizResult>(ENDPOINTS.QUIZZES.RESULT(attemptId), { signal });
    return res.data;
  },

  // Teacher
  createQuiz: async (lessonId: string, data: CreateQuizDto) => {
    const res = await axiosInstance.post(ENDPOINTS.QUIZZES.CREATE(lessonId), data);
    return res.data;
  },

  deleteQuiz: async (quizId: string) => {
    const res = await axiosInstance.delete(ENDPOINTS.QUIZZES.DELETE(quizId));
    return res.data;
  },

  getTeacherLessonQuizzes: async (lessonId: string) => {
    const res = await axiosInstance.get(
      ENDPOINTS.QUIZZES.TEACHER_LESSON_QUIZZES(lessonId)
    );
    return res.data as {
      quizzes: {
        id: string;
        title: string;
        isPublished: boolean;
        maxAttempts: number;
        timeLimitMinutes: number | null;
        questions: { id: string }[];
      }[];
    };
  },

  /** TEACHER: full answer sheet of one quiz attempt (questions + student answers) */
  getTeacherAttemptDetail: async (attemptId: string): Promise<TeacherQuizAttemptDetail> => {
    const res = await axiosInstance.get(`quiz-attempts/${attemptId}/detail`);
    return res.data as TeacherQuizAttemptDetail;
  },

  /** TEACHER: Reactivate student quiz attempt / reset lock */
  reactivateStudentQuiz: async (quizId: string, studentId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.post(`quizzes/${quizId}/students/${studentId}/reactivate`);
    return res.data;
  },
};

export interface TeacherQuizAttemptAnswer {
  id: string;
  questionId: string;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
  awardedMarks: number;
  question: {
    text: string;
    options: unknown;
    correctOptionIndex: number;
    explanation: string | null;
    marks: number;
    orderIndex: number;
  };
}

export interface TeacherQuizAttemptDetail {
  id: string;
  attemptNumber: number;
  score: number | null;
  earnedMarks: number | null;
  totalMarks: number | null;
  isPassed: boolean | null;
  status: string;
  submittedAt: string | null;
  quiz: { id: string; title: string; passingPercentage: number; lesson: { title: string } };
  student: { fullName: string; gradeLevel: string };
  answers: TeacherQuizAttemptAnswer[];
}
