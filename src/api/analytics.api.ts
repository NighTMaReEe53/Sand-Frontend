import { axiosInstance } from './axiosInstance';
import { StudentPerformanceResponse } from '../types/analytics.types';

export interface PeriodicReportData {
  student: {
    id: string;
    fullName: string;
    gradeLevel: string;
    photoUrl: string | null;
    email?: string;
    phone?: string;
  };
  period: 'week' | 'month' | 'all';
  summary: {
    /** null means there is no completed activity to score in this period. */
    overallScore: number | null;
    attendanceRate: number;
    attendedLessonsCount: number;
    unattendedLessonsCount?: number;
    totalAssignedLessons: number;
    quizzesTakenCount: number;
    passedQuizzesCount: number;
    quizAverage: number | null;
    highestQuiz?: { title: string; score: number } | null;
    lowestQuiz?: { title: string; score: number } | null;
    examsTakenCount: number;
    passedExamsCount: number;
    examAverage: number | null;
    highestExam?: { title: string; score: number } | null;
    lowestExam?: { title: string; score: number } | null;
    submittedHomeworksCount: number;
    unsubmittedHomeworksCount?: number;
    totalAssignedHomeworks: number;
    homeworkCompletionRate: number;
    /** Average of graded homework submissions; null while no homework is graded. */
    homeworkAverage: number | null;
    /** The real data dimensions included in the weighted score. */
    evaluatedComponents: string[];
    /** Sum of the original weights represented by the available evidence. */
    scoreCoverage: number;
    /** Specific, data-backed next actions for the student. */
    insights: string[];
  };
  lessons: {
    lessonId: string;
    lessonTitle: string;
    watchedPercentage: number;
    isCompleted: boolean;
    lastWatchedAt: string;
    durationSeconds: number;
  }[];
  quizzes: {
    quizId: string;
    quizTitle: string;
    lessonTitle: string;
    courseTitle: string;
    score: number;
    isPassed: boolean;
    attemptNumber: number;
    submittedAt: string;
  }[];
  exams: {
    examId: string;
    examTitle: string;
    courseTitle: string;
    score: number;
    isPassed: boolean;
    attemptNumber: number;
    submittedAt: string;
  }[];
  homeworks: {
    homeworkId: string;
    homeworkTitle: string;
    lessonTitle: string;
    courseTitle: string;
    score: number | null;
    isPassed: boolean | null;
    submittedAt: string;
  }[];
}

export interface WeeklyReportResponse {
  report: PeriodicReportData;
  week: {
    weekStartDate: string;
    weekEndDate: string;
    generatedAt: string;
    isLive: boolean;
  };
  weeks: string[];
  courses: { id: string; title: string; subject?: string | null }[];
}

export const analyticsApi = {
  getStudentPerformance: async (): Promise<StudentPerformanceResponse> => {
    const res = await axiosInstance.get<StudentPerformanceResponse>('/analytics/student');
    return res.data;
  },

  getPeriodicReport: async (period?: 'week' | 'month' | 'all', courseId?: string): Promise<PeriodicReportData> => {
    const res = await axiosInstance.get<PeriodicReportData>('/analytics/student/periodic-report', {
      params: { period, courseId },
    });
    return res.data;
  },

  getMyWeeklyReport: async (courseId?: string, weekStart?: string): Promise<WeeklyReportResponse> => {
    const res = await axiosInstance.get<WeeklyReportResponse>('/analytics/student/weekly-report', {
      params: { courseId, weekStart },
    });
    return res.data;
  },

  getParentChildWeeklyReport: async (
    studentId: string,
    courseId?: string,
    weekStart?: string,
  ): Promise<WeeklyReportResponse> => {
    const res = await axiosInstance.get<WeeklyReportResponse>(
      `/parent/students/${studentId}/weekly-report`,
      { params: { courseId, weekStart } },
    );
    return res.data;
  },

  getTeacherStudentPeriodicReport: async (
    studentId: string,
    period?: 'week' | 'month' | 'all',
    courseId?: string,
  ): Promise<PeriodicReportData> => {
    const res = await axiosInstance.get<PeriodicReportData>(
      `/analytics/students/${studentId}/periodic-report`,
      { params: { period, courseId } },
    );
    return res.data;
  },

  getPerformancePdf: async (): Promise<Blob> => {
    const res = await axiosInstance.get('/analytics/student/report-pdf', {
      responseType: 'blob',
    });
    // Attach server filename for the caller (Arabic via RFC 5987)
    const disposition: string = res.headers?.['content-disposition'] ?? '';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
      try {
        (res.data as Blob & { fileName?: string }).fileName = decodeURIComponent(
          utf8Match[1],
        );
      } catch {
        /* keep default */
      }
    }
    return res.data as Blob;
  },
};
