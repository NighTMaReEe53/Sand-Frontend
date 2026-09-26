import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics.api';
import { useAuthStore } from '../../store/authStore';

export const useStudentPerformanceQuery = () => {
  const role = useAuthStore((state) => state.user?.role);
  return useQuery({
    queryKey: ['student-performance'],
    queryFn: () => analyticsApi.getStudentPerformance(),
    enabled: role === 'STUDENT',
    retry: 1,
  });
};
