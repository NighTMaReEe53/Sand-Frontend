import { axiosInstance } from './axiosInstance';

export const reactionsApi = {
  react: async (data: { targetType: string; targetId: string; type: string }) => {
    const res = await axiosInstance.post('/reactions', data);
    return res.data;
  },

  unreact: async (targetType: string, targetId: string) => {
    const res = await axiosInstance.delete(`/reactions/${targetType}/${targetId}`);
    return res.data;
  },

  getReactionSummary: async (
    targetType: string,
    targetId: string
  ): Promise<{
    summary: Record<string, number>;
    currentUserReaction: string | null;
    reactors?: { userId: string; name: string; photo?: string | null; type: string }[];
  }> => {
    const res = await axiosInstance.get(`/reactions/summary/${targetType}/${targetId}`);
    return res.data;
  },
};
