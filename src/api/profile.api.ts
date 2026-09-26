import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import { GradeLevel } from '../types/auth.types';

export interface UpdateProfilePayload {
  fullName?: string;
  guardianPhone?: string;
  gradeLevel?: GradeLevel;
  specialization?: string;
  photoUrl?: string;
  bio?: string;
  address?: string;
  extraInfo?: string;
  workPlaces?: string[];
}

export const profileApi = {
  getProfile: async () => {
    const res = await axiosInstance.get<any>(ENDPOINTS.PROFILE.GET);
    return res.data;
  },

  updateProfile: async (data: UpdateProfilePayload) => {
    const res = await axiosInstance.patch<any>(ENDPOINTS.PROFILE.UPDATE, data);
    return res.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await axiosInstance.patch<{ message: string }>(
      ENDPOINTS.PROFILE.CHANGE_PASSWORD,
      data
    );
    return res.data;
  },

  /** TEACHER/ADMIN: رفع صورة من الجهاز وتعيينها كصورة الملف الشخصي */
  uploadProfileImage: async (file: File): Promise<{ message: string; photoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post('/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getTeacherProfile: async (teacherId: string) => {
    const res = await axiosInstance.get<any>(ENDPOINTS.PROFILE.TEACHER(teacherId));
    return res.data;
  },
};
