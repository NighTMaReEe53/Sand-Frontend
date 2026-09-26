import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  ChallengeAvailability,
  ChallengeDetail,
  ChallengeListItem,
  ChallengeResult,
  CreateChallengeDto,
  OnlineStudent,
} from '../types/challenge.types';

export const challengesApi = {
  getAvailability: async (): Promise<ChallengeAvailability> => {
    const res = await axiosInstance.get<ChallengeAvailability>(
      ENDPOINTS.CHALLENGES.AVAILABILITY
    );
    return res.data;
  },

  list: async (): Promise<ChallengeListItem[]> => {
    const res = await axiosInstance.get<ChallengeListItem[]>(ENDPOINTS.CHALLENGES.LIST);
    return res.data;
  },

  create: async (data: CreateChallengeDto) => {
    const res = await axiosInstance.post<{ challenge: { id: string }; warnings: string[] }>(
      ENDPOINTS.CHALLENGES.CREATE,
      data
    );
    return res.data;
  },

  getDetail: async (id: string): Promise<ChallengeDetail> => {
    const res = await axiosInstance.get<ChallengeDetail>(ENDPOINTS.CHALLENGES.DETAIL(id));
    return res.data;
  },

  accept: async (id: string) => {
    const res = await axiosInstance.post<{ message: string }>(ENDPOINTS.CHALLENGES.ACCEPT(id));
    return res.data;
  },

  reject: async (id: string) => {
    const res = await axiosInstance.post<{ message: string }>(ENDPOINTS.CHALLENGES.REJECT(id));
    return res.data;
  },

  start: async (id: string) => {
    const res = await axiosInstance.post<{ expiresAt: string }>(ENDPOINTS.CHALLENGES.START(id));
    return res.data;
  },

  submitAnswer: async (id: string, questionId: string, selectedOption: number) => {
    const res = await axiosInstance.post<{ isCorrect: boolean }>(ENDPOINTS.CHALLENGES.ANSWER(id), {
      questionId,
      selectedOption,
    });
    return res.data;
  },

  finish: async (id: string) => {
    const res = await axiosInstance.post<{ message: string }>(ENDPOINTS.CHALLENGES.FINISH(id));
    return res.data;
  },

  getResult: async (id: string): Promise<ChallengeResult> => {
    const res = await axiosInstance.get<ChallengeResult>(ENDPOINTS.CHALLENGES.RESULT(id));
    return res.data;
  },

  getOnlineStudents: async (courseId: string): Promise<OnlineStudent[]> => {
    const res = await axiosInstance.get<{ onlineStudents: OnlineStudent[] }>(
      ENDPOINTS.CHALLENGES.ONLINE_STUDENTS(courseId)
    );
    return res.data.onlineStudents ?? [];
  },

  heartbeat: async () => {
    const res = await axiosInstance.post<{ online: boolean }>(ENDPOINTS.CHALLENGES.HEARTBEAT);
    return res.data;
  },
};
