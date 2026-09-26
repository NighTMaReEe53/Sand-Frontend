import { axiosInstance } from './axiosInstance';
import { BacklogResponse } from '../types/backlog.types';

export const backlogApi = {
  getMyBacklog: async (): Promise<BacklogResponse> => {
    const res = await axiosInstance.get<BacklogResponse>('/students/me/backlog');
    return res.data;
  },
};
