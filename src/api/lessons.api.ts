import axios from 'axios';
import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  Lesson,
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonsDto,
  Material,
  MaterialType,
} from '../types/course.types';

export interface PresignedUploadResponse {
  lessonId: string;
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresInSeconds: number;
}

export const lessonsApi = {
  create: async (courseId: string, data: CreateLessonDto) => {
    const res = await axiosInstance.post<Lesson>(ENDPOINTS.LESSONS.CREATE(courseId), data);
    return res.data;
  },

  update: async (lessonId: string, data: UpdateLessonDto) => {
    const res = await axiosInstance.patch<Lesson>(ENDPOINTS.LESSONS.UPDATE(lessonId), data);
    return res.data;
  },

  delete: async (lessonId: string) => {
    const res = await axiosInstance.delete<{ message: string }>(ENDPOINTS.LESSONS.DELETE(lessonId));
    return res.data;
  },

  reorder: async (courseId: string, orders: { lessonId: string; newOrderIndex: number }[]) => {
    const res = await axiosInstance.post<Lesson[]>(ENDPOINTS.LESSONS.REORDER, {
      courseId,
      orders,
    });
    return res.data;
  },

  getVideoUploadUrl: async (lessonId: string, fileName?: string, contentType?: string) => {
    const res = await axiosInstance.post<PresignedUploadResponse>(
      ENDPOINTS.LESSONS.VIDEO_UPLOAD_URL(lessonId),
      null,
      {
        params: {
          fileName,
          contentType,
        },
      }
    );
    return res.data;
  },

  uploadFileDirect: async (
    uploadUrl: string,
    file: File,
    onProgress?: (percentage: number) => void
  ) => {
    // The backend may return an absolute URL hardcoded to its own host/port
    // (e.g. http://localhost:3000/api/v1/storage/direct-upload). When the
    // app is served from another origin this URL is unreachable / CORS-
    // blocked, so retarget it to the configured API base. S3 presigned
    // URLs (non-localhost hosts) are left untouched.
    let targetUrl = uploadUrl;
    const apiBase = axiosInstance.defaults.baseURL ?? '';
    try {
      if (targetUrl.startsWith('/')) {
        targetUrl = `${apiBase}${targetUrl}`;
      } else {
        const parsed = new URL(targetUrl);
        const api = new URL(apiBase, window.location.origin);
        const isLocalhost = /^(localhost|127\.0\.0\.1)$/.test(parsed.hostname);
        const apiIsRemote = !/^(localhost|127\.0\.0\.1)$/.test(api.hostname);
        if (isLocalhost && apiIsRemote && apiBase) {
          parsed.protocol = api.protocol;
          parsed.host = api.host;
          targetUrl = parsed.toString();
        }
      }
    } catch {
      // keep original URL if parsing fails
    }

    // Direct upload bypasses authorization header.
    // responseType 'text' prevents axios from JSON-parsing non-JSON bodies,
    // which used to surface cryptic "Unexpected token ... is not valid JSON" errors.
    const response = await axios.put(targetUrl, file, {
      responseType: 'text',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    const status = response.status;
    if (status < 200 || status >= 300) {
      throw new Error(`فشل رفع الملف إلى التخزين (رمز الحالة ${status}).`);
    }
  },

  /**
   * Uploads a lesson video directly to the configured object storage, then
   * records its verified URL. This keeps large video bytes out of the API
   * process and works with both local development and R2/S3 in production.
   */
  uploadVideoDirect: async (
    lessonId: string,
    file: File,
    durationSeconds?: number,
    onProgress?: (percentage: number) => void
  ) => {
    const upload = await lessonsApi.getVideoUploadUrl(
      lessonId,
      file.name,
      file.type || 'video/mp4'
    );
    await lessonsApi.uploadFileDirect(upload.uploadUrl, file, onProgress);
    return lessonsApi.confirmVideoUpload(lessonId, {
      videoUrl: upload.fileUrl,
      durationSeconds,
    });
  },

  uploadVideoFile: async (
    lessonId: string,
    file: File,
    durationSeconds?: number,
    onProgress?: (percentage: number) => void
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    if (durationSeconds !== undefined) {
      formData.append('durationSeconds', String(durationSeconds));
    }
    const res = await axiosInstance.post<Lesson>(
      ENDPOINTS.LESSONS.VIDEO_UPLOAD_FILE(lessonId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
    return res.data;
  },

  confirmVideoUpload: async (
    lessonId: string,
    data: { videoUrl: string; durationSeconds?: number }
  ) => {
    const res = await axiosInstance.patch<Lesson>(
      ENDPOINTS.LESSONS.CONFIRM_VIDEO(lessonId),
      data
    );
    return res.data;
  },

  getStreamUrl: async (lessonId: string) => {
    const res = await axiosInstance.get<{ streamUrl?: string; url?: string } | string>(
      ENDPOINTS.LESSONS.STREAM_URL(lessonId)
    );
    if (typeof res.data === 'string') return res.data;
    return res.data.streamUrl || res.data.url || '';
  },

  createMaterial: async (
    courseId: string,
    data: { lessonId?: string; sectionId?: string; title: string; fileUrl: string; fileType?: MaterialType }
  ) => {
    const res = await axiosInstance.post<Material>(
      ENDPOINTS.LESSONS.MATERIALS_CREATE(courseId),
      data
    );
    return res.data;
  },

  uploadMaterialFile: async (
    courseId: string,
    data: { title: string; description?: string; sectionId?: string; kind?: 'MATERIAL' | 'HOMEWORK'; file: File }
  ) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.sectionId) formData.append('sectionId', data.sectionId);
    if (data.kind) formData.append('kind', data.kind);
    formData.append('file', data.file);

    const res = await axiosInstance.post<Material>(
      ENDPOINTS.LESSONS.MATERIALS_CREATE(courseId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  getMaterialDownloadUrl: async (materialId: string) => {
    const res = await axiosInstance.get<{ downloadUrl: string; fileName: string; expiresInSeconds: number }>(
      `/materials/${materialId}/download`
    );
    return res.data;
  },

  deleteMaterial: async (materialId: string) => {
    const res = await axiosInstance.delete<{ message: string }>(
      ENDPOINTS.LESSONS.MATERIALS_DELETE(materialId)
    );
    return res.data;
  },
};
