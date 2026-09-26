import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  StudentDashboardResponse,
  TeacherDashboardResponse,
} from '../types/dashboard.types';

export interface DashboardActionTask {
  id: string;
  title: string;
  description: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  href: string;
  icon: 'clipboard' | 'messages' | 'wallet' | 'file-check' | 'book';
}

export interface DashboardActionCenterResponse {
  role: 'TEACHER' | 'ADMIN';
  generatedAt: string;
  totalOpenItems: number;
  tasks: DashboardActionTask[];
}

export const dashboardApi = {
  getStudentDashboard: async () => {
    const res = await axiosInstance.get<StudentDashboardResponse>(ENDPOINTS.DASHBOARD.STUDENT);
    return res.data;
  },

  getTeacherDashboard: async () => {
    const res = await axiosInstance.get<TeacherDashboardResponse>(ENDPOINTS.DASHBOARD.TEACHER);
    return res.data;
  },

  getAdminDashboard: async () => {
    const res = await axiosInstance.get<any>(ENDPOINTS.DASHBOARD.ADMIN);
    return res.data;
  },

  getActionCenter: async () => {
    const res = await axiosInstance.get<DashboardActionCenterResponse>(ENDPOINTS.DASHBOARD.TASKS);
    return res.data;
  },
};
