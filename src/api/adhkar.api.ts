import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';

export type AdhkarCategory = 'morning' | 'evening' | 'dua';

export interface AdhkarItem {
  id: string;
  code: string;
  category: 'MORNING' | 'EVENING';
  arabicText: string;
  repeatCount: number;
  source: string;
  sortOrder: number;
}

export interface DuaItem {
  id: string;
  code: string;
  subCategory: 'EXAM' | 'STUDY' | 'GENERAL' | 'RELIEF' | 'POST_EXAM' | 'POST_LECTURE';
  arabicText: string;
  translationNote: string | null;
  source: string;
  sortOrder: number;
}

export type DuaContext = 'general' | 'exam' | 'post-exam' | 'post-lecture';

export interface DismissalRecord {
  itemId: string;
  dismissedAt: string;
  reappearsAt: string;
}

export const adhkarApi = {
  getContent: async (category?: AdhkarCategory) => {
    const res = await axiosInstance.get<{
      items?: AdhkarItem[];
      duas?: DuaItem[];
    }>(ENDPOINTS.ADHKAR.LIST, { params: category ? { category } : undefined });
    return res.data;
  },

  getRandomDua: async (context: DuaContext, excludeCodes?: string[]) => {
    const res = await axiosInstance.get<{ dua: DuaItem }>(ENDPOINTS.ADHKAR.RANDOM_DUA, {
      params: {
        context,
        ...(excludeCodes && excludeCodes.length > 0
          ? { excludeCodes: excludeCodes.join(',') }
          : {}),
      },
    });
    return res.data.dua;
  },

  getDismissals: async () => {
    const res = await axiosInstance.get<{ dismissals: DismissalRecord[] }>(
      ENDPOINTS.ADHKAR.DISMISSALS
    );
    return res.data.dismissals;
  },

  dismiss: async (itemId: string) => {
    const res = await axiosInstance.post<{ reappearsAt: string }>(ENDPOINTS.ADHKAR.DISMISS, {
      itemId,
    });
    return res.data.reappearsAt;
  },
};
