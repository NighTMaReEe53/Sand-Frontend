import { axiosInstance } from './axiosInstance';

export interface Avatar {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  sortOrder?: number;
  isPublished?: boolean;
  createdAt?: string;
}

export interface OwnedAvatar extends Avatar {
  isOwned: boolean;
  isActive: boolean;
  purchasedAt: string;
}

export interface CreateAvatarDto {
  name: string;
  imageUrl?: string;
  price: number;
  sortOrder?: number;
}

export interface UpdateAvatarDto {
  name?: string;
  imageUrl?: string;
  price?: number;
  isPublished?: boolean;
  sortOrder?: number;
}

export const avatarsApi = {
  // Student endpoints
  getShop: async () => {
    const res = await axiosInstance.get<Avatar[]>('/avatars/shop');
    return res.data;
  },

  buyAvatar: async (avatarId: string) => {
    const res = await axiosInstance.post<{ message: string; avatar: Avatar }>('/avatars/buy', {
      avatarId,
    });
    return res.data;
  },

  getOwned: async () => {
    const res = await axiosInstance.get<OwnedAvatar[]>('/avatars/me');
    return res.data;
  },

  setActive: async (avatarId: string) => {
    const res = await axiosInstance.put<{ message: string; photoUrl?: string | null; avatarId?: string }>('/avatars/active', {
      avatarId,
    });
    return res.data;
  },

  removeActive: async () => {
    const res = await axiosInstance.delete<{ message: string; photoUrl?: string | null }>('/avatars/active');
    return res.data;
  },

  // Admin endpoints
  adminGetAll: async () => {
    const res = await axiosInstance.get<Avatar[]>('/admin/avatars');
    return res.data;
  },

  adminCreate: async (dto: CreateAvatarDto) => {
    const res = await axiosInstance.post<Avatar>('/admin/avatars', dto);
    return res.data;
  },

  adminUpdate: async (id: string, dto: UpdateAvatarDto) => {
    const res = await axiosInstance.put<Avatar>(`/admin/avatars/${id}`, dto);
    return res.data;
  },

  adminDelete: async (id: string) => {
    const res = await axiosInstance.delete<{ message: string }>(`/admin/avatars/${id}`);
    return res.data;
  },
};
