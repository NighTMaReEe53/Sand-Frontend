import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export type ParentResultTypeFilter = 'ALL' | 'EXAM' | 'QUIZ' | 'HOMEWORK';
export type ParentResultStatusFilter = 'ALL' | 'PASSED' | 'FAILED';

export interface ParentChild {
  id: string;
  fullName: string;
  photoUrl: string | null;
  gradeLevel: string;
  lastSeenAt: string | null;
}

export interface ParentMeResponse {
  parent: { id: string; phone: string };
  children: ParentChild[];
}

export interface ParentCourseBrief {
  id: string;
  title: string;
  subject: string | null;
  thumbnailUrl: string | null;
}

export interface ParentStudentProfileResponse {
  profile: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    gradeLevel: string;
    lastSeenAt: string | null;
  };
  stats: {
    coursesCount: number;
    lessonsTotal: number;
    lessonsCompleted: number;
    examsCount: number;
    examsPassed: number;
    examsAvgPercent: number | null;
    quizzesCount: number;
    quizzesPassed: number;
    quizzesAvgPercent: number | null;
    homeworkCount: number;
    homeworkPassed: number;
    homeworkAvgPercent: number | null;
  };
  courses: ParentCourseBrief[];
}

export interface ParentAttemptResult {
  attemptId: string;
  attemptNumber: number;
  kind: 'EXAM' | 'QUIZ' | 'HOMEWORK';
  title: string;
  lessonTitle?: string;
  courseTitle: string;
  courseId: string;
  score: number;
  totalMarks: number;
  passingMarks?: number;
  percent: number;
  isPassed: boolean | null;
  submittedAt: string | null;
  paperPdfUrl?: string;
  sheetPdfUrl?: string | null;
}

export interface ParentStudentResultsResponse {
  examAttempts: ParentAttemptResult[];
  quizAttempts: ParentAttemptResult[];
  homeworkAttempts: ParentAttemptResult[];
}

export interface ParentLessonItem {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  durationSeconds: number;
  dueDate: string | null;
  isTaken: boolean;
  watchedPercentage: number;
  lastWatchedAt: string | null;
}

export interface ParentStudentLessonsResponse {
  courses: Array<{
    id: string;
    title: string;
    subject: string | null;
    thumbnailUrl: string | null;
    lessonsTotal: number;
    lessonsTaken: number;
    lessons: ParentLessonItem[];
  }>;
}

export const parentApi = {
  getMe: async (): Promise<ParentMeResponse> => {
    const res = await axiosInstance.get<ParentMeResponse>(ENDPOINTS.PARENT.ME);
    return res.data;
  },

  getStudentProfile: async (studentId: string): Promise<ParentStudentProfileResponse> => {
    const res = await axiosInstance.get<ParentStudentProfileResponse>(
      ENDPOINTS.PARENT.STUDENT_PROFILE(studentId)
    );
    return res.data;
  },

  getStudentResults: async (
    studentId: string,
    params?: { courseId?: string; type?: ParentResultTypeFilter; status?: ParentResultStatusFilter }
  ): Promise<ParentStudentResultsResponse> => {
    const res = await axiosInstance.get<ParentStudentResultsResponse>(
      ENDPOINTS.PARENT.STUDENT_RESULTS(studentId),
      { params }
    );
    return res.data;
  },

  getStudentLessons: async (
    studentId: string,
    courseId?: string
  ): Promise<ParentStudentLessonsResponse> => {
    const res = await axiosInstance.get<ParentStudentLessonsResponse>(
      ENDPOINTS.PARENT.STUDENT_LESSONS(studentId),
      { params: courseId ? { courseId } : undefined }
    );
    return res.data;
  },

  /** تحميل ورقة نتيجة PDF (امتحان/كويز) أو ورقة الواجب */
  downloadPdf: async (url: string, fileName: string): Promise<void> => {
    const res = await axiosInstance.get(url, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};
