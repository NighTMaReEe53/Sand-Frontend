import { axiosInstance } from './axiosInstance';
import { MaterialType } from '../types/course.types';

/** نوع الملف التعليمي: مادة/ملخص أو واجب */
export type MaterialKind = 'MATERIAL' | 'HOMEWORK';

export interface MaterialLibraryItem {
  id: string;
  courseId: string;
  sectionId?: string | null;
  title: string;
  description?: string | null;
  fileType: MaterialType;
  kind: MaterialKind;
  fileSizeBytes: number;
  createdAt: string;
  section?: { id: string; title: string; order: number } | null;
  /** موجود فقط في /materials/my */
  course?: {
    id: string;
    title: string;
    thumbnailUrl?: string | null;
  } | null;
}

export interface DownloadInfo {
  downloadUrl: string;
  expiresInSeconds: number;
  fileName: string;
}

export const materialsApi = {
  /** مكتبة الطالب: كل ملفات كل الكورسات المشترك بها (اشتراك ACTIVE) */
  getMine: async (): Promise<MaterialLibraryItem[]> => {
    const res = await axiosInstance.get<MaterialLibraryItem[]>('/materials/my');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** ملفات كورس واحد (للمعلم المالك أو الطالب المشترك) */
  getByCourse: async (courseId: string): Promise<MaterialLibraryItem[]> => {
    const res = await axiosInstance.get<MaterialLibraryItem[]>(
      `/courses/${courseId}/materials`
    );
    return Array.isArray(res.data) ? res.data : [];
  },

  /** رابط تنزيل/معاينة موقّع مؤقت (صالح 5 دقائق) */
  getDownloadInfo: async (materialId: string): Promise<DownloadInfo> => {
    const res = await axiosInstance.get<DownloadInfo>(
      `/materials/${materialId}/download`
    );
    return res.data;
  },
};
