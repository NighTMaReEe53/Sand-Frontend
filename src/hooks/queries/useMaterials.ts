import { useQuery } from '@tanstack/react-query';
import { materialsApi } from '../../api/materials.api';

/** مكتبة ملفات الطالب عبر كل كورساته — تُحدَّث كل دقيقتين كحد أقصى */
export const useMyMaterialsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['my-materials'],
    queryFn: () => materialsApi.getMine(),
    enabled,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });
};

/** ملفات كورس واحد (معلم/طالب مشترك) */
export const useCourseMaterialsQuery = (courseId?: string, enabled = true) => {
  return useQuery({
    queryKey: ['course-materials', courseId],
    queryFn: () => materialsApi.getByCourse(courseId!),
    enabled: !!courseId && enabled,
    staleTime: 1000 * 60 * 2,
  });
};
