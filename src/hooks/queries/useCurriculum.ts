import { useQuery } from '@tanstack/react-query';
import { curriculumApi } from '../../api/curriculum.api';
import { useAuthStore } from '../../store/authStore';

export const useCurriculumQuery = (courseId?: string) => {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['curriculum', courseId, userId ?? 'guest'],
    queryFn: () => curriculumApi.getCurriculum(courseId!),
    enabled: !!courseId,
    // Curriculum mutations already invalidate this key on every real change.
    // A 5-minute fresh window prevents a redundant API call every time the
    // teacher reopens the page without having changed anything.
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
};
