import { axiosInstance } from './axiosInstance';

export interface Summary {
  id: string;
  title: string;
  description: string;
  videoUrl?: string | null;
  images: string[];
  status?: string;
  rejectionReason?: string | null;
  studentName: string;
  studentPhoto?: string | null;
  studentGradeLevel?: string | null;
  isOwn?: boolean;
  courseTitle?: string;
  commentsCount?: number;
  createdAt: string;
  approvedAt?: string | null;
}

export interface SummaryComment {
  id: string;
  content: string;
  authorName: string;
  authorPhoto?: string | null;
  isTeacher: boolean;
  createdAt: string;
  reactions?: Record<string, number>;
  currentUserReaction?: string | null;
  reactionCount?: number;
  children: SummaryComment[];
}

export const summariesApi = {
  uploadCommunityMedia: async (file: File): Promise<{ url: string; type: 'image' | 'video' }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await axiosInstance.post('/community/media', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 });
    return res.data;
  },
  listSummaries: async (
    courseId: string,
    params?: { page?: number; limit?: number; sort?: string },
    signal?: AbortSignal
  ): Promise<{ summaries: Summary[]; pagination: { page: number; total: number; totalPages: number } }> => {
    const res = await axiosInstance.get('/summaries', { params: { courseId, ...params }, signal });
    return res.data;
  },

  createSummary: async (data: {
    courseId: string;
    title: string;
    description: string;
    videoUrl?: string;
    images?: string[];
  }) => {
    const res = await axiosInstance.post('/summaries', data);
    return res.data;
  },

  getSummaryDetail: async (summaryId: string): Promise<{ summary: Summary; comments: SummaryComment[] }> => {
    const res = await axiosInstance.get(`/summaries/${summaryId}`);
    return res.data;
  },

  getMySummaries: async (params?: { page?: number; limit?: number }) => {
    const res = await axiosInstance.get('/my-summaries', { params });
    return res.data;
  },

  getModerationQueue: async (params?: { courseId?: string; page?: number; limit?: number }) => {
    const res = await axiosInstance.get('/teacher/summaries/moderation', { params });
    return res.data;
  },

  moderateSummary: async (summaryId: string, data: { approve: boolean; rejectionReason?: string }) => {
    const res = await axiosInstance.patch(`/teacher/summaries/${summaryId}/moderate`, data);
    return res.data;
  },

  updateSummary: async (summaryId: string, data: Partial<Pick<Summary, 'title' | 'description' | 'videoUrl' | 'images'>>) => {
    const res = await axiosInstance.patch(`/teacher/summaries/${summaryId}`, data);
    return res.data;
  },

  deleteSummary: async (summaryId: string) => {
    const res = await axiosInstance.delete(`/teacher/summaries/${summaryId}`);
    return res.data;
  },

  addComment: async (summaryId: string, data: { content: string; parentId?: string }) => {
    const res = await axiosInstance.post(`/summaries/${summaryId}/comments`, data);
    return res.data;
  },

  getLeaderboard: async (courseId: string) => {
    const res = await axiosInstance.get(`/summaries/leaderboard/${courseId}`);
    return res.data;
  },
};
