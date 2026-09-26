import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard.api';
import { useAuthStore } from '../../store/authStore';

export const useStudentDashboardQuery = () => {
  const role = useAuthStore((state) => state.role);
  return useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => dashboardApi.getStudentDashboard(),
    enabled: role === 'STUDENT',
    staleTime: 1000 * 60 * 2,
  });
};

export const useTeacherDashboardQuery = () => {
  const role = useAuthStore((state) => state.role);
  return useQuery({
    queryKey: ['teacher-dashboard'],
    queryFn: () => dashboardApi.getTeacherDashboard(),
    enabled: role === 'TEACHER',
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminDashboardQuery = () => {
  const role = useAuthStore((state) => state.role);
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => dashboardApi.getAdminDashboard(),
    enabled: role === 'ADMIN',
    staleTime: 1000 * 60 * 2,
  });
};
