import { axiosInstance } from './axiosInstance';

export interface CourseVideo {
  id: string;
  teacherId: string;
  courseId: string;
  videoUrl: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export const videosApi = {
  upsertVideo: async (courseId: string, data: { videoUrl: string; title?: string }) => {
    const res = await axiosInstance.post<{ message: string; video: CourseVideo }>(
      `/courses/${courseId}/video`,
      data
    );
    return res.data;
  },

  getVideo: async (courseId: string): Promise<{ video: CourseVideo | null }> => {
    const res = await axiosInstance.get(`/courses/${courseId}/video`);
    return res.data;
  },

  deleteVideo: async (courseId: string) => {
    await axiosInstance.delete(`/courses/${courseId}/video`);
  },
};
