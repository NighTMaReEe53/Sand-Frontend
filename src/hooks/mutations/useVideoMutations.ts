import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi, CourseVideo } from '../../api/videos.api';

export const useUpsertCourseVideoMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { videoUrl: string; title?: string }) =>
      videosApi.upsertVideo(courseId, data),
    onSuccess: (res) => {
      queryClient.setQueryData<{ video: CourseVideo | null }>(
        ['course-video', courseId],
        { video: res.video }
      );
    },
  });
};

export const useDeleteCourseVideoMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => videosApi.deleteVideo(courseId),
    onSuccess: () => {
      queryClient.setQueryData<{ video: CourseVideo | null }>(
        ['course-video', courseId],
        { video: null }
      );
    },
  });
};
