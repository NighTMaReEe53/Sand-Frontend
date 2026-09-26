import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  CourseProgressResponse,
  UpdateLessonProgressDto,
  UpdateLessonProgressResponse,
} from '../types/progress.types';

export const progressApi = {
  getCourseProgress: async (courseId: string): Promise<CourseProgressResponse> => {
    const res = await axiosInstance.get<CourseProgressResponse>(
      ENDPOINTS.COURSES.PROGRESS(courseId)
    );
    return res.data;
  },

  updateLessonProgress: async (
    lessonId: string,
    data: UpdateLessonProgressDto
  ): Promise<{ message: string; progress: UpdateLessonProgressResponse; coinsEarned?: number }> => {
    const res = await axiosInstance.post(ENDPOINTS.LESSONS.PROGRESS(lessonId), data);
    return res.data;
  },
};
