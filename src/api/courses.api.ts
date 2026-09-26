import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  Course,
  CourseQuery,
  PaginatedResponse,
  CreateCourseDto,
  UpdateCourseDto,
} from '../types/course.types';

export const coursesApi = {
  getAll: async (params?: CourseQuery) => {
    const res = await axiosInstance.get<any>(
      ENDPOINTS.COURSES.LIST,
      // A catalog must fail visibly rather than leave the visitor waiting for
      // a slow/unavailable service. GETs still receive the shared one-off
      // transient retry from axiosInstance.
      { params, timeout: 8_000 }
    );
    const raw = res.data;
    // Handle raw array
    if (Array.isArray(raw)) {
      return {
        data: raw,
        courses: raw,
        meta: {
          total: raw.length,
          page: 1,
          limit: raw.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    // Handle paginated or wrapped object
    if (raw && typeof raw === 'object') {
      const coursesList = Array.isArray(raw.courses)
        ? raw.courses
        : Array.isArray(raw.data)
        ? raw.data
        : [];
      const m = raw.meta ?? {};
      const totalPages =
        m.totalPages ?? (Math.ceil((m.total ?? coursesList.length) / (m.limit || 1)) || 1);
      const currentPage = m.page ?? 1;      return {
        ...raw,
        data: coursesList,
        courses: coursesList,
        meta: {
          total: m.total ?? coursesList.length,
          page: currentPage,
          limit: m.limit ?? coursesList.length,
          totalPages,
          // Some backends omit these flags — derive them so pagination works
          hasNextPage: m.hasNextPage ?? currentPage < totalPages,
          hasPrevPage: m.hasPrevPage ?? currentPage > 1,
        },
      };
    }
    return {
      data: [],
      courses: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  getById: async (id: string) => {
    const res = await axiosInstance.get<Course>(ENDPOINTS.COURSES.DETAIL(id));
    return res.data;
  },

  create: async (data: CreateCourseDto) => {
    const res = await axiosInstance.post<Course>(ENDPOINTS.COURSES.CREATE, data);
    return res.data;
  },

  update: async (id: string, data: UpdateCourseDto) => {
    const res = await axiosInstance.patch<Course>(ENDPOINTS.COURSES.UPDATE(id), data);
    return res.data;
  },

  uploadThumbnail: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.patch<Course>(ENDPOINTS.COURSES.UPLOAD_THUMBNAIL(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  delete: async (id: string) => {
    const res = await axiosInstance.delete<{ message: string }>(ENDPOINTS.COURSES.DELETE(id));
    return res.data;
  },

  enrollFree: async (courseId: string) => {
    const res = await axiosInstance.post<{ message: string; enrollment: unknown }>(
      ENDPOINTS.COURSES.ENROLL_FREE(courseId)
    );
    return res.data;
  },

  // Smart Universal Search
  globalSearch: async (q: string) => {
    const res = await axiosInstance.get<{
      courses: { id: string; title: string; subject: string; thumbnailUrl: string | null; isFree: boolean; teacherName: string | null; url: string; type: string }[];
      lessons: { id: string; title: string; courseTitle: string; courseId: string; url: string; type: string }[];
      quizzes: { id: string; title: string; lessonTitle: string; courseTitle: string; courseId: string; url: string; type: string }[];
      exams: { id: string; title: string; courseTitle: string; courseId: string; url: string; type: string }[];
      homeworks: { id: string; title: string; lessonTitle: string; courseTitle: string; courseId: string; url: string; type: string }[];
      summaries: { id: string; title: string; courseTitle: string; studentName: string; url: string; type: string }[];
      students: { id: string; fullName: string; gradeLevel: string; photoUrl: string | null; url: string; type: string }[];
    }>('/courses/search/global', { params: { q } });
    return res.data;
  },

  // Teacher Student Management
  getCourseStudents: async (courseId: string, params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const res = await axiosInstance.get<{
      students: {
        enrollmentId: string;
        studentId: string;
        userId: string;
        fullName: string;
        guardianPhone: string | null;
        phone: string | null;
        email: string;
        photoUrl: string | null;
        gradeLevel: string;
        status: string;
        enrolledAt: string;
        activatedAt: string | null;
        stats: {
          watchedLessons: number;
          totalLessons: number;
          watchedPercentage: number;
          passedQuizzes: number;
          totalQuizzes: number;
          quizAverage: number | null;
          passedExams: number;
          totalExams: number;
          examAverage: number | null;
          submittedHomeworks: number;
          totalHomeworks: number;
        };
      }[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/courses/${courseId}/students`, { params });
    return res.data;
  },

  updateCourseStudentStatus: async (courseId: string, studentId: string, status: string) => {
    const res = await axiosInstance.patch<{ message: string; enrollment: unknown }>(
      `/courses/${courseId}/students/${studentId}/status`,
      { status }
    );
    return res.data;
  },

  removeCourseStudent: async (courseId: string, studentId: string) => {
    const res = await axiosInstance.delete<{ message: string }>(
      `/courses/${courseId}/students/${studentId}`
    );
    return res.data;
  },

  // Courses the current student is actually enrolled (subscribed) in — used by
  // the exam-rankings filter so only subscribed courses appear.
  getStudentCourses: async (): Promise<{ id: string; title: string }[]> => {
    const res = await axiosInstance.get<
      | { id: string; title: string }[]
      | { courses?: { id: string; title: string }[]; data?: { id: string; title: string }[] }
    >('/courses/enrolled-courses');
    const d = res.data;
    if (Array.isArray(d)) return d as { id: string; title: string }[];
    return ((d.courses || d.data || []) as { id: string; title: string }[]);
  },

  // Courses owned by the current teacher (for the exam-rankings filter).
  getTeacherCourses: async (): Promise<{ id: string; title: string }[]> => {
    const res = await axiosInstance.get<{ courses?: { id: string; title: string }[]; data?: { id: string; title: string }[] }>(
      '/courses',
      { params: { mine: true, limit: 100 } },
    );
    const d = res.data;
    return ((d?.courses || d?.data || []) as { id: string; title: string }[]);
  },
};
