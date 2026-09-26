import { axiosInstance } from './axiosInstance';

export interface QaAnswer {
  id: string;
  content: string;
  videoUrl?: string | null;
  isTeacherReply: boolean;
  isOwnAnswer: boolean;
  createdAt: string;
}

export interface QaQuestion {
  id: string;
  content: string;
  studentName: string;
  isOwn: boolean;
  isPinned: boolean;
  isAnswered: boolean;
  createdAt: string;
  answers: QaAnswer[];
}

export const qaApi = {
  listQuestions: async (
    lessonId: string,
    params?: { page?: number; onlyUnanswered?: boolean }
  ): Promise<{ questions: QaQuestion[]; pagination: { page: number; total: number; totalPages: number } }> => {
    const res = await axiosInstance.get(`/lessons/${lessonId}/questions`, { params });
    return res.data;
  },

  createQuestion: async (lessonId: string, content: string): Promise<QaQuestion> => {
    const res = await axiosInstance.post<{ question: QaQuestion }>(
      `/lessons/${lessonId}/questions`,
      { content }
    );
    return res.data.question;
  },

  deleteQuestion: async (questionId: string) => {
    await axiosInstance.delete(`/questions/${questionId}`);
  },

  addAnswer: async (questionId: string, content: string, videoUrl?: string) => {
    await axiosInstance.post(`/questions/${questionId}/answers`, { content, ...(videoUrl && { videoUrl }) });
  },

  deleteAnswer: async (answerId: string) => {
    await axiosInstance.delete(`/answers/${answerId}`);
  },

  togglePin: async (questionId: string) => {
    await axiosInstance.post(`/questions/${questionId}/pin`);
  },
};
