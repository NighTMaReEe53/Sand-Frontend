import { axiosInstance } from './axiosInstance';

export interface TeacherCourseAnalytics {
  courseId: string;
  title: string;
  totalLessons: number;
  studentCount: number;
  activeStudents: number;
  activeEnrollments: number;
  completionRate: number;
  averageWatchPercentage: number;
  averageExamScore: number | null;
  examPassRate: number | null;
  revenue: number;
  pendingPayments: number;
}

export interface TeacherAnalyticsResponse {
  courses: TeacherCourseAnalytics[];
  totals: {
    totalCourses: number;
    totalStudents: number;
    totalRevenue: number;
    pendingPayments: number;
  };
}

export interface CourseDetailAnalytics {
  lessons: {
    lessonId: string;
    title: string;
    orderIndex: number;
    watchers: number;
    completions: number;
    completionRate: number;
    averageWatchPercentage: number;
    dropOffRate: number;
  }[];
  mostWatchedLesson: { lessonId: string; title: string } | null;
  leastWatchedLesson: { lessonId: string; title: string } | null;
  biggestDropOff: { lessonId: string; title: string; dropOffRate: number } | null;
  exams: {
    examId: string;
    title: string;
    attemptCount: number;
    averageScore: number | null;
    passRate: number | null;
    failRate: number | null;
  }[];
}

export interface CourseReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  studentName: string;
  createdAt: string;
}

export interface TestimonialItem {
  id: string;
  studentName: string;
  gradeLevel: string;
  photoUrl: string | null;
  rating: number;
  comment: string | null;
  courseId: string;
  courseTitle: string;
  createdAt: string;
}

export interface QuestionStatItem {
  questionId: string;
  sourceType: 'EXAM' | 'QUIZ' | 'HOMEWORK';
  sourceTitle: string;
  text: string;
  options: unknown;
  correctOptionIndex: number;
  wrongCount: number;
  totalAnswers: number;
  wrongRate: number;
}

export interface QuestionStatsResponse {
  questions: QuestionStatItem[];
}

export const teacherAnalyticsApi = {
  /** TEACHER: own analytics. ADMIN: pass teacherId (User id) to scope to one teacher, omit for platform-wide. */
  getOverview: async (teacherId?: string): Promise<TeacherAnalyticsResponse> => {
    const res = await axiosInstance.get('/analytics/teacher', {
      params: { ...(teacherId ? { teacherId } : {}) },
    });
    return res.data;
  },

  getCourseAnalytics: async (courseId: string): Promise<CourseDetailAnalytics> => {
    const res = await axiosInstance.get(`/analytics/teacher/courses/${courseId}`);
    return res.data;
  },

  /** TEACHER: which questions students answer wrong the most (exams + quizzes + homeworks) */
  getQuestionStats: async (
    courseId?: string,
    limit = 10,
    teacherId?: string
  ): Promise<QuestionStatsResponse> => {
    const res = await axiosInstance.get('/analytics/teacher/question-stats', {
      params: {
        ...(courseId ? { courseId } : {}),
        ...(teacherId ? { teacherId } : {}),
        limit,
      },
    });
    return res.data;
  },
};

export const reviewsApi = {
  getCourseReviews: async (courseId: string, page = 1) => {
    const res = await axiosInstance.get<{
      reviews: CourseReviewItem[];
      averageRating: number | null;
      totalReviews: number;
      pagination: { page: number; totalPages: number; total: number };
    }>(`/courses/${courseId}/reviews`, { params: { page } });
    return res.data;
  },

  upsertReview: async (courseId: string, data: { rating: number; comment?: string }) => {
    const res = await axiosInstance.post(`/courses/${courseId}/review`, data);
    return res.data;
  },

  deleteReview: async (courseId: string) => {
    const res = await axiosInstance.delete(`/courses/${courseId}/review`);
    return res.data;
  },

  getMyReviews: async () => {
    const res = await axiosInstance.get<{
      reviews: {
        id: string;
        courseId: string;
        courseTitle: string;
        rating: number;
        comment: string | null;
        isHidden: boolean;
        createdAt: string;
      }[];
    }>('/reviews/my-reviews');
    return res.data;
  },


  moderate: async (reviewId: string, hide: boolean) => {
    const res = await axiosInstance.post(`/reviews/${reviewId}/moderate`, { hide });
    return res.data;
  },

  getTestimonials: async (limit = 6) => {
    const res = await axiosInstance.get<{
      testimonials: TestimonialItem[];
    }>('/testimonials', { params: { limit } });
    return res.data.testimonials;
  },
};

// ─── §12.9 Teacher-facing student progress ────────────────────────

export interface TeacherCourseStudentRow {
  studentId: string;
  fullName: string;
  photoUrl: string | null;
  enrolledAt: string;
  completedLessons: number;
  completionPercentage: number;
  lastLessonTitle: string | null;
  lastActivityAt: string | null;
  latestQuizScore: number | null;
  latestQuizTitle: string | null;
}

export interface TeacherCourseStudentsResponse {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  averageCompletion: number;
  inactiveTwoWeeksCount: number;
  students: TeacherCourseStudentRow[];
}

export interface TeacherStudentDetailResponse {
  courseId: string;
  courseTitle: string;
  student: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    gradeLevel: string;
    guardianPhone?: string | null;
    user?: { phone?: string | null } | null;
  };
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  sections: { id: string; title: string; order: number }[];
  lessons: {
    lessonId: string;
    title: string;
    sectionId: string | null;
    orderIndex: number;
    durationSeconds: number;
    watchedPercentage: number;
    isCompleted: boolean;
    lastWatchedAt: string | null;
  }[];
  quizScores: {
    quizId: string;
    quizTitle: string;
    lessonId: string | null;
    attemptNumber: number;
    score: number | null;
    percentage: number | null;
    isPassed: boolean | null;
    submittedAt: string | null;
  }[];
  assessments: {
    assessmentId: string;
    type: 'QUIZ' | 'EXAM' | 'HOMEWORK';
    title: string;
    lessonId: string | null;
    attemptNumber: number;
    percentage: number | null;
    isPassed: boolean | null;
    submittedAt: string | null;
  }[];
  pendingRequirements: {
    requirementId: string;
    type: 'QUIZ' | 'EXAM' | 'HOMEWORK';
    title: string;
    lessonTitle: string | null;
    availableFrom: string | null;
    dueAt: string | null;
    isOverdue: boolean;
    statusLabel: string;
  }[];
}

export const teacherStudentsApi = {
  getCourseStudents: async (
    courseId: string,
    sort?: 'most_active' | 'least_active' | 'not_started' | 'completion_desc' | 'completion_asc'
  ): Promise<TeacherCourseStudentsResponse> => {
    const res = await axiosInstance.get(`/teacher/courses/${courseId}/students`, {
      params: sort ? { sort } : undefined,
    });
    return res.data;
  },

  getStudentDetail: async (
    courseId: string,
    studentId: string
  ): Promise<TeacherStudentDetailResponse> => {
    const res = await axiosInstance.get(
      `/teacher/courses/${courseId}/students/${studentId}`
    );
    return res.data;
  },

  /** TEACHER/ADMIN: verified PDF created by Chromium on the server, not a screenshot of the page. */
  downloadGuardianReport: async (
    courseId: string,
    studentId: string,
    note?: string,
  ): Promise<{ blob: Blob; fileName: string }> => {
    const res = await axiosInstance.get(
      `/analytics/teacher/students/${studentId}/report-pdf`,
      {
        params: { courseId, ...(note?.trim() ? { note: note.trim() } : {}) },
        responseType: 'blob',
      },
    );
    const disposition = String(res.headers?.['content-disposition'] ?? '');
    const utf8Name = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    let fileName = `guardian-performance-${studentId.slice(0, 8)}.pdf`;
    if (utf8Name?.[1]) {
      try {
        fileName = decodeURIComponent(utf8Name[1]);
      } catch {
        // Keep a safe fallback filename if a proxy has altered the header.
      }
    }
    return {
      blob: new Blob([res.data], { type: 'application/pdf' }),
      fileName,
    };
  },

  /** TEACHER/ADMIN: remove a student from a course (cancel enrollment). */
  removeStudentFromCourse: async (
    courseId: string,
    studentId: string
  ): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(
      `/teacher/courses/${courseId}/students/${studentId}`
    );
    return res.data;
  },
};
