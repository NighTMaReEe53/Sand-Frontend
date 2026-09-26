import { axiosInstance } from './axiosInstance';

export interface Frame {
  id: string;
  name: string;
  imageUrl: string | null;
  cssStyle: string | null;
  price: number;
  sortOrder?: number;
  isPublished?: boolean;
  createdAt?: string;
}

export interface OwnedFrame extends Frame {
  isOwned: boolean;
  isActive: boolean;
  purchasedAt: string;
}

export interface CreateFrameDto {
  name: string;
  imageUrl?: string;
  cssStyle?: string;
  price: number;
  sortOrder?: number;
}

export interface UpdateFrameDto {
  name?: string;
  imageUrl?: string;
  cssStyle?: string;
  price?: number;
  isPublished?: boolean;
  sortOrder?: number;
}

export const framesApi = {
  // Student endpoints
  getShop: async () => {
    const res = await axiosInstance.get<Frame[]>('/frames/shop');
    return res.data;
  },

  buyFrame: async (frameId: string) => {
    const res = await axiosInstance.post<{ message: string; frame: Frame }>('/frames/buy', {
      frameId,
    });
    return res.data;
  },

  getOwned: async () => {
    const res = await axiosInstance.get<OwnedFrame[]>('/frames/me');
    return res.data;
  },

  setActive: async (frameId: string) => {
    const res = await axiosInstance.put<{ message: string }>('/frames/active', {
      frameId,
    });
    return res.data;
  },

  removeActive: async () => {
    const res = await axiosInstance.delete<{ message: string }>('/frames/active');
    return res.data;
  },

  // Admin endpoints
  adminGetAll: async () => {
    const res = await axiosInstance.get<Frame[]>('/admin/frames');
    return res.data;
  },

  adminCreate: async (dto: CreateFrameDto) => {
    const res = await axiosInstance.post<Frame>('/admin/frames', dto);
    return res.data;
  },

  adminUpdate: async (id: string, dto: UpdateFrameDto) => {
    const res = await axiosInstance.put<Frame>(`/admin/frames/${id}`, dto);
    return res.data;
  },

  adminDelete: async (id: string) => {
    const res = await axiosInstance.delete<{ message: string }>(`/admin/frames/${id}`);
    return res.data;
  },
};
