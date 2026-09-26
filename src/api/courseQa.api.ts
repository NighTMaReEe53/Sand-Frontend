import { axiosInstance } from './axiosInstance';

export interface CourseQuestion {
  id: string;
  content: string;
  imageUrl?: string | null;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  studentName: string;
  studentPhoto?: string | null;
  isOwn: boolean;
  repliesCount: number;
  createdAt: string;
}

export interface QAReply {
  id: string;
  content: string;
  imageUrl?: string | null;
  authorName: string;
  authorPhoto?: string | null;
  isTeacher: boolean;
  createdAt: string;
  children: QAReply[];
}

export interface CourseQuestionDetail {
  id: string;
  content: string;
  imageUrl?: string | null;
  status: string;
  studentName: string;
  studentPhoto?: string | null;
  courseTitle: string;
  createdAt: string;
}

export const courseQaApi = {
  listQuestions: async (
    courseId: string,
    params?: { page?: number; limit?: number; status?: string; mine?: boolean },
    signal?: AbortSignal
  ): Promise<{ questions: CourseQuestion[]; pagination: { page: number; total: number; totalPages: number } }> => {
    const res = await axiosInstance.get('/course-qa/questions', { params: { courseId, ...params }, signal });
    return res.data;
  },

  createQuestion: async (data: { courseId: string; content: string; imageUrl?: string }) => {
    const res = await axiosInstance.post('/course-qa/questions', data);
    return res.data;
  },

  getQuestion: async (questionId: string): Promise<{ question: CourseQuestionDetail; replies: QAReply[] }> => {
    const res = await axiosInstance.get(`/course-qa/questions/${questionId}`);
    return res.data;
  },

  addReply: async (questionId: string, data: { content: string; imageUrl?: string; parentId?: string }) => {
    const res = await axiosInstance.post(`/course-qa/questions/${questionId}/replies`, data);
    return res.data;
  },

  updateStatus: async (questionId: string, status: string) => {
    const res = await axiosInstance.patch(`/course-qa/questions/${questionId}/status`, { status });
    return res.data;
  },

  getTeacherInbox: async (params?: { courseId?: string; page?: number; limit?: number }): Promise<{
    questions: (CourseQuestion & { courseName: string; courseId: string })[];
    pagination: { page: number; total: number; totalPages: number };
  }> => {
    const res = await axiosInstance.get('/teacher/course-qa/inbox', { params });
    return res.data;
  },
};
