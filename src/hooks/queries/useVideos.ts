import { useQuery } from '@tanstack/react-query';
import { videosApi } from '../../api/videos.api';

export const useCourseVideoQuery = (courseId?: string, enabled = true) => {
  return useQuery({
    queryKey: ['course-video', courseId],
    queryFn: () => videosApi.getVideo(courseId!),
    enabled: !!courseId && enabled,
    staleTime: 1000 * 60,
  });
};
