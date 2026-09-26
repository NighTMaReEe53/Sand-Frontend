import { axiosInstance } from './axiosInstance';
import type {
  EducationSystem,
  EducationalStage,
  Grade,
  Subject,
  TargetInput,
  Track,
} from '../types/taxonomy.types';

export const taxonomyApi = {
  listSystems: async (): Promise<EducationSystem[]> => {
    const res = await axiosInstance.get('/education-systems');
    return res.data?.data ?? res.data ?? [];
  },

  listStages: async (systemId: string): Promise<EducationalStage[]> => {
    const res = await axiosInstance.get(`/education-systems/${systemId}/stages`);
    return res.data?.data ?? res.data ?? [];
  },

  listGrades: async (stageId: string): Promise<Grade[]> => {
    const res = await axiosInstance.get(`/stages/${stageId}/grades`);
    return res.data?.data ?? res.data ?? [];
  },

  listTracks: async (gradeId: string): Promise<Track[]> => {
    const res = await axiosInstance.get(`/grades/${gradeId}/tracks`);
    return res.data?.data ?? res.data ?? [];
  },

  listSubjects: async (): Promise<Subject[]> => {
    const res = await axiosInstance.get('/subjects');
    return res.data?.data ?? res.data ?? [];
  },

  listGradeSubjects: async (gradeId: string, trackId?: string | null): Promise<Subject[]> => {
    const res = await axiosInstance.get(`/grades/${gradeId}/subjects`, {
      params: trackId ? { trackId } : undefined,
    });
    return res.data?.data ?? res.data ?? [];
  },

  getCourseTargets: async (courseId: string) => {
    const res = await axiosInstance.get(`/courses/${courseId}/targets`);
    return res.data?.data ?? res.data ?? [];
  },

  /** Replace-all semantics — backend re-validates everything server-side */
  setCourseTargets: async (courseId: string, targets: TargetInput[]) => {
    const res = await axiosInstance.post(`/courses/${courseId}/targets`, { targets });
    return res.data?.data ?? res.data;
  },

  addCourseTarget: async (courseId: string, input: TargetInput) => {
    const res = await axiosInstance.post(`/courses/${courseId}/targets/add`, input);
    return res.data?.data ?? res.data;
  },

  updateCourseTarget: async (
    courseId: string,
    targetId: string,
    input: { gradeId?: string; trackId?: string | null },
  ) => {
    const res = await axiosInstance.patch(`/courses/${courseId}/targets/${targetId}`, input);
    return res.data?.data ?? res.data;
  },

  removeCourseTarget: async (courseId: string, targetId: string) => {
    const res = await axiosInstance.delete(`/courses/${courseId}/targets/${targetId}`);
    return res.data?.data ?? res.data;
  },

  myCourses: async () => {
    const res = await axiosInstance.get('/student/courses');
    return res.data?.data ?? res.data;
  },

  getMyEducationProfile: async () => {
    const res = await axiosInstance.get('/student/education-profile');
    return res.data?.data ?? res.data;
  },

  setMyEducationProfile: async (input: {
    educationSystemId: string;
    stageId: string;
    gradeId: string;
    trackId?: string | null;
  }) => {
    const res = await axiosInstance.patch('/student/education-profile', input);
    return res.data?.data ?? res.data;
  },
};
