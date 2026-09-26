import { axiosInstance } from './axiosInstance';
import {
  LessonHomeworkInfo,
  StartHomeworkResponse,
  SubmitHomeworkResult,
} from '../types/homework.types';

export interface CreateHomeworkDto {
  title: string;
  description?: string;
  /** موعد فتح الواجب للطلاب — مغلق قبله */
  availableFrom?: string;
  passingPercentage?: number;
  maxAttempts?: number;
  isPublished?: boolean;
  questions?: {
    text: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    marks?: number;
    orderIndex?: number;
    requiresImageAnswer?: boolean;
  }[];
}

export const homeworkApi = {
  // Student
  getLessonHomework: async (lessonId: string): Promise<LessonHomeworkInfo> => {
    const res = await axiosInstance.get(`/lessons/${lessonId}/homework`);
    return res.data;
  },

  getPdfUrl: async (homeworkId: string): Promise<string> => {
    const res = await axiosInstance.get<{ url: string }>(`/homework/${homeworkId}/pdf`);
    return res.data.url;
  },

  startAttempt: async (homeworkId: string): Promise<StartHomeworkResponse> => {
    const res = await axiosInstance.post<StartHomeworkResponse>(`/homework/${homeworkId}/start`);
    return res.data;
  },

  submitAttempt: async (
    attemptId: string,
    answers: { questionId: string; selectedOptionIndex: number }[]
  ): Promise<SubmitHomeworkResult> => {
    const res = await axiosInstance.post<SubmitHomeworkResult>(
      `/homework-attempts/${attemptId}/submit`,
      { answers }
    );
    return res.data;
  },

  // Student
  getStudentResults: async (): Promise<{ results: StudentHomeworkResult[] }> => {
    const res = await axiosInstance.get('/student/homework-results');
    return res.data;
  },

  // Teacher
  createHomework: async (lessonId: string, data: CreateHomeworkDto) => {
    const res = await axiosInstance.post(`/lessons/${lessonId}/homework`, data);
    return res.data;
  },

  updateHomework: async (id: string, data: Partial<CreateHomeworkDto>) => {
    const res = await axiosInstance.patch(`/homework/${id}`, data);
    return res.data;
  },

  deleteHomework: async (id: string) => {
    const res = await axiosInstance.delete(`/homework/${id}`);
    return res.data;
  },

  uploadSheet: async (homeworkId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await axiosInstance.post<{ pdfUrl: string }>(`/homework/${homeworkId}/pdf`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  uploadAnswerImage: async (attemptId: string, questionId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await axiosInstance.post<{ imageUrl: string }>(
      `/homework-attempts/${attemptId}/answers/${questionId}/image`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  addQuestion: async (homeworkId: string, q: NonNullable<CreateHomeworkDto['questions']>[number]) => {
    const res = await axiosInstance.post(`/homework/${homeworkId}/questions`, q);
    return res.data;
  },

  deleteQuestion: async (questionId: string) => {
    const res = await axiosInstance.delete(`/homework-questions/${questionId}`);
    return res.data;
  },

  getTeacherLessonHomeworks: async (lessonId: string) => {
    const res = await axiosInstance.get(`/lessons/${lessonId}/homeworks`);
    return res.data as {
      homeworks: {
        id: string;
        title: string;
        description: string | null;
        pdfUrl: string | null;
        isPublished: boolean;
        maxAttempts: number;
        passingPercentage: number;
        availableFrom?: string | null;
        questions: {
          id: string;
          text: string;
          options: string[];
          correctOptionIndex: number;
          explanation: string | null;
          marks: number;
          orderIndex: number;
          requiresImageAnswer: boolean;
        }[];
        _count?: { attempts: number };
      }[];
    };
  },

  /** TEACHER/STUDENT: full answer sheet of one homework attempt */
  getAttemptDetail: async (attemptId: string, signal?: AbortSignal): Promise<TeacherHomeworkAttemptDetail> => {
    const res = await axiosInstance.get(`homework-attempts/${attemptId}/detail`, { signal });
    return res.data as TeacherHomeworkAttemptDetail;
  },

  getTeacherAttemptDetail: async (attemptId: string): Promise<TeacherHomeworkAttemptDetail> => {
    const res = await axiosInstance.get(`homework-attempts/${attemptId}/detail`);
    return res.data as TeacherHomeworkAttemptDetail;
  },

  /** TEACHER: list all submitted student attempts for a homework (and unsubmitted students) */
  listSubmissions: async (
    homeworkId: string
  ): Promise<{
    submissions: HomeworkSubmissionRow[];
    unsubmittedStudents?: UnsubmittedStudent[];
    stats?: HomeworkSubmissionStats;
  }> => {
    const res = await axiosInstance.get(`/homework/${homeworkId}/submissions`);
    return res.data;
  },

  /** TEACHER: grade a single essay / image answer */
  gradeEssayAnswer: async (
    attemptId: string,
    questionId: string,
    data: { awardedMarks: number; teacherNote?: string }
  ): Promise<{ message: string; allEssayGraded: boolean; score: number; earnedMarks: number; totalMarks: number; isPassed: boolean }> => {
    const res = await axiosInstance.patch(
      `/homework-attempts/${attemptId}/answers/${questionId}/grade`,
      data
    );
    return res.data;
  },
};

export interface UnsubmittedStudent {
  studentId: string;
  fullName: string;
  gradeLevel: string | null;
  phone: string | null;
  email: string | null;
  enrolledAt: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS';
  startedAt: string | null;
  attemptId: string | null;
}

export interface HomeworkSubmissionStats {
  totalEnrolled: number;
  submittedCount: number;
  unsubmittedCount: number;
  pendingGradingCount: number;
  passedCount: number;
  failedCount: number;
}

export interface TeacherHomeworkAttemptAnswer {
  id: string;
  questionId: string;
  selectedOptionIndex: number | null;
  imageUrl: string | null;
  isCorrect: boolean;
  awardedMarks: number;
  teacherGrade: number | null;
  teacherNote: string | null;
  question: {
    text: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string | null;
    marks: number;
    orderIndex: number;
    requiresImageAnswer: boolean;
  };
}

export interface TeacherHomeworkAttemptDetail {
  id: string;
  attemptNumber: number;
  startedAt?: string | null;
  score: number | null;
  earnedMarks: number | null;
  totalMarks: number | null;
  isPassed: boolean | null;
  status: string;
  submittedAt: string | null;
  homework: { id: string; title: string; passingPercentage: number; lesson: { title: string; id: string; courseId: string } };
  student: { fullName: string; gradeLevel: string };
  answers: TeacherHomeworkAttemptAnswer[];
}

export interface HomeworkSubmissionAnswer {
  id: string;
  questionId: string;
  selectedOptionIndex: number | null;
  imageUrl: string | null;
  isCorrect: boolean;
  awardedMarks: number;
  teacherGrade: number | null;
  teacherNote: string | null;
  question: {
    text: string;
    marks: number;
    orderIndex: number;
    requiresImageAnswer: boolean;
  };
}

export interface HomeworkSubmissionRow {
  id: string;
  attemptNumber: number;
  score: number | null;
  earnedMarks: number | null;
  totalMarks: number | null;
  isPassed: boolean | null;
  submittedAt: string | null;
  essayPendingCount: number;
  student: { id?: string; fullName: string; gradeLevel: string | null; phone?: string | null; email?: string | null };
  answers: HomeworkSubmissionAnswer[];
}

export interface StudentHomeworkResult {
  homeworkId: string;
  title: string;
  lessonTitle: string;
  lessonId: string;
  courseId: string;
  courseTitle: string;
  attemptId: string;
  attemptNumber: number;
  startedAt?: string | null;
  status: string;
  score: number | null;
  earnedMarks: number | null;
  totalMarks: number | null;
  isPassed: boolean | null;
  submittedAt: string | null;
  questionsCount: number;
  answeredCount: number;
  correctCount: number;
  essayPendingCount: number;
}

export interface TeacherHomeworkOverviewItem {
  id: string;
  title: string;
  description: string | null;
  pdfUrl: string | null;
  isPublished: boolean;
  passingPercentage: number;
  availableFrom: string | null;
  createdAt: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  questionsCount: number;
  essayQuestionsCount: number;
  totalAttempts: number;
  passedAttempts: number;
  pendingReviewCount: number;
}

// Add method inside homeworkApi:
export const homeworkOverviewApi = {
  getOverview: async (): Promise<{ homeworks: TeacherHomeworkOverviewItem[] }> => {
    const res = await axiosInstance.get('/teacher/homeworks/overview');
    return res.data;
  },
};
