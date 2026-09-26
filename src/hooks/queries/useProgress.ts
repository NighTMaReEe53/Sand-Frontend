import { useQuery } from '@tanstack/react-query';
import { progressApi } from '../../api/progress.api';
import { useAuthStore } from '../../store/authStore';

export const useCourseProgressQuery = (courseId: string, enabled = true) => {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['course-progress', courseId, userId ?? 'guest'],
    queryFn: () => progressApi.getCourseProgress(courseId),
    enabled: !!courseId && enabled,
    retry: 1,
  });
};
