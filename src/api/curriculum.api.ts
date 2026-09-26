import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  CurriculumResponse,
  Section,
  CreateSectionDto,
  UpdateSectionDto,
  ReorderSectionsDto,
} from '../types/course.types';

export const curriculumApi = {
  getCurriculum: async (courseId: string): Promise<CurriculumResponse> => {
    const res = await axiosInstance.get<CurriculumResponse>(ENDPOINTS.COURSES.CURRICULUM(courseId));
    return res.data;
  },

  createSection: async (courseId: string, data: CreateSectionDto): Promise<Section> => {
    const res = await axiosInstance.post<Section>(ENDPOINTS.SECTIONS.CREATE(courseId), data);
    return res.data;
  },

  updateSection: async (sectionId: string, data: UpdateSectionDto): Promise<Section> => {
    const res = await axiosInstance.patch<Section>(ENDPOINTS.SECTIONS.UPDATE(sectionId), data);
    return res.data;
  },

  deleteSection: async (sectionId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.delete<{ message: string }>(ENDPOINTS.SECTIONS.DELETE(sectionId));
    return res.data;
  },

  reorderSections: async (courseId: string, data: ReorderSectionsDto): Promise<{ message: string }> => {
    const res = await axiosInstance.post<{ message: string }>(ENDPOINTS.SECTIONS.REORDER(courseId), data);
    return res.data;
  },
};
