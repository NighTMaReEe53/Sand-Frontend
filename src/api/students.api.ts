import { axiosInstance } from './axiosInstance';

export interface StudentSearchResult {
  userId: string;
  studentProfileId?: string | null;
  email: string;
  phone: string | null;
  isActive?: boolean;
  memberSince: string;
  fullName: string;
  gradeLevel: string | null;
  guardianPhone: string | null;
  courses: {
    id: string;
    title: string;
    subject?: string | null;
    enrolledAt?: string;
    enrollmentStatus?: string;
  }[];
  examAttempts: {
    attemptId: string;
    attemptNumber: number;
    examId: string;
    examTitle: string;
    courseTitle: string;
    score: number | null;
    isPassed: boolean;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'TIMED_OUT';
    submittedAt?: string | null;
  }[];
  quizAttempts: {
    attemptId: string;
    attemptNumber: number;
    quizId: string;
    quizTitle: string;
    lessonTitle: string;
    score: number | null;
    isPassed: boolean;
    status: string;
    submittedAt?: string | null;
  }[];
  homeworkAttempts?: {
    attemptId: string;
    attemptNumber: number;
    homeworkId: string;
    homeworkTitle: string;
    lessonTitle: string;
    score: number | null;
    isPassed: boolean;
    status: string;
    submittedAt?: string | null;
  }[];
}

export const studentsApi = {
  search: async (q: string, limit = 10): Promise<{ results: StudentSearchResult[] }> => {
    const res = await axiosInstance.get('/students/search', { params: { q, limit } });
    return res.data;
  },

  createStudent: async (data: {
    fullName: string;
    email: string;
    studentPhone: string;
    guardianPhone: string;
    gradeLevel: string;
    password?: string;
    courseId?: string;
  }): Promise<{
    id: string;
    email: string;
    isActive: boolean;
    enrolledIntoCourseId: string | null;
    generatedPassword?: string;
  }> => {
    const res = await axiosInstance.post('/students', data);
    return res.data;
  },

  setAccountStatus: async (userId: string, isActive: boolean) => {
    const res = await axiosInstance.patch(`/students/${userId}/status`, { isActive });
    return res.data;
  },

  /** ADMIN — update a student account (name, contacts, grade, active state). */
  updateStudent: async (
    userId: string,
    data: {
      fullName?: string;
      email?: string;
      studentPhone?: string;
      guardianPhone?: string;
      gradeLevel?: string;
      isActive?: boolean;
    }
  ): Promise<{ message: string }> => {
    const res = await axiosInstance.patch(`/admin/students/${userId}`, data);
    return res.data;
  },

  /** ADMIN — permanently delete a student account and their data. */
  deleteStudent: async (userId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(`/admin/students/${userId}`);
    return res.data;
  },

  /** ADMIN only — create a verified teacher account (password is required). */
  createTeacher: async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    specialization: string;
    photoUrl?: string;
    address?: string;
    bio?: string;
  }): Promise<{ id: string; email: string; role: string }> => {
    const res = await axiosInstance.post('/admin/teachers', data);
    return res.data;
  },

  /** ADMIN only — upload a teacher photo file and get its URL. */
  uploadTeacherImage: async (file: File): Promise<{ url: string }> => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await axiosInstance.post('/admin/teachers/upload-image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /** ADMIN — paginated teachers list with search */
  listTeachers: async (
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<{
    teachers: AdminTeacherRow[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> => {
    const res = await axiosInstance.get('/admin/teachers', { params });
    return res.data;
  },

  /** ADMIN — one teacher's profile + their courses with stats */
  getTeacherDetail: async (
    userId: string
  ): Promise<AdminTeacherDetailResponse> => {
    const res = await axiosInstance.get(`/admin/teachers/${userId}`);
    return res.data;
  },

  /** ADMIN — update a teacher account. */
  updateTeacher: async (
    userId: string,
    data: {
      fullName?: string;
      email?: string;
      phone?: string;
      specialization?: string;
      bio?: string;
      address?: string;
      photoUrl?: string;
      isActive?: boolean;
    }
  ): Promise<{ message: string }> => {
    const res = await axiosInstance.patch(`/admin/teachers/${userId}`, data);
    return res.data;
  },

  /** ADMIN — permanently delete a teacher and soft-delete their courses. */
  deleteTeacher: async (userId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete(`/admin/teachers/${userId}`);
    return res.data;
  },
};

export interface AdminTeacherRow {
  id: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  teacherProfile: {
    id: string;
    fullName: string;
    specialization: string;
    photoUrl: string | null;
  } | null;
}

export interface AdminTeacherDetailResponse {
  teacher: AdminTeacherRow & {
    teacherProfile: {
      id: string;
      fullName: string;
      specialization: string;
      photoUrl: string | null;
      bio: string | null;
      address: string | null;
      extraInfo: string | null;
      workPlaces: string[];
      updatedAt: string;
    } | null;
    totals: {
      coursesCount: number;
      studentsCount: number;
      lessonsCount: number;
      examsCount: number;
    };
  };
  analytics: {
    totalRevenue: number;
    acceptedPaymentsCount: number;
    pendingPaymentsCount: number;
    averageRating: number | null;
    reviewsCount: number;
    activeStudentsLast30Days: number;
    completedLessonRecords: number;
    lessonSlots: number;
    completionRate: number | null;
    openQuestionsCount: number;
    actionsLast30Days: number;
    lastActivityAt: string;
    lastActivityAction: string | null;
    lastActivitySource: string;
  };
  courses: {
    id: string;
    title: string;
    subject: string | null;
    thumbnailUrl: string | null;
    price: unknown;
    isFree: boolean;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    updatedAt: string;
    _count: { enrollments: number; lessons: number; exams: number };
    completedLessons: number;
    lessonSlots: number;
    totalRevenue: number;
    averageRating: number | null;
    reviewsCount: number;
  }[];
  recentReviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    student: { fullName: string; gradeLevel: string };
    course: { id: string; title: string };
  }[];
}

export interface StudentPublicProfile {
  id: string;
  fullName: string;
  gradeLevel: string | null;
  photoUrl: string | null;
  memberSince: string;
  stats: {
    enrolledCourses: number;
    totalExamAttempts: number;
    passedExams: number;
    avgScore: number;
    totalQuizAttempts: number;
    passedQuizzes: number;
  };
  achievements: string[];
  enrolledCourses: {
    courseId: string;
    title: string;
    subject: string | null;
    thumbnailUrl: string | null;
    enrolledAt: string;
    teacher: { id: string; fullName: string; photoUrl: string | null } | null;
  }[];
}

export const studentPublicApi = {
  getPublicProfile: async (profileId: string): Promise<StudentPublicProfile> => {
    const res = await axiosInstance.get(`/students/${profileId}/public-profile`);
    return res.data;
  },
};
