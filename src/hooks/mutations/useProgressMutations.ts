import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '../../api/progress.api';
import { CourseProgressResponse, UpdateLessonProgressDto } from '../../types/progress.types';
import { toastCoinsEarned } from '../../lib/toastHelpers';

export const useUpdateLessonProgressMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: UpdateLessonProgressDto }) =>
      progressApi.updateLessonProgress(lessonId, data),
    onSuccess: ({ progress, coinsEarned }) => {
      let becameCompleted = false;

      // Optimistically update the local cache to keep the UI responsive.
      // The server response now includes quizCompleted / homeworkCompleted
      // so the sidebar shows accurate lock state between full refetches.
      queryClient.setQueriesData<CourseProgressResponse>(
        { queryKey: ['course-progress', courseId] },
        (current) => {
          if (!current) return current;

          const previous = current.lessons.find((lesson) => lesson.lessonId === progress.lessonId);
          if (!previous) return current;

          becameCompleted = progress.isCompleted && !previous.isCompleted;
          const completedLessons = current.completedLessons + (becameCompleted ? 1 : 0);

          return {
            ...current,
            completedLessons,
            courseProgressPercentage:
              current.totalLessons > 0
                ? Math.round((completedLessons / current.totalLessons) * 100)
                : 0,
            lessons: current.lessons.map((lesson) =>
              lesson.lessonId === progress.lessonId
                ? {
                    ...lesson,
                    watchedPercentage: progress.watchedPercentage,
                    isCompleted: progress.isCompleted,
                    lastPositionSeconds: progress.lastPositionSeconds,
                    status: progress.isCompleted ? 'COMPLETED' : lesson.status,
                    quizCompleted: progress.quizCompleted,
                    homeworkCompleted: progress.homeworkCompleted,
                  }
                : lesson
            ),
          };
        }
      );

      // When a lesson completes, the next lesson may unlock — refetch to
      // get the fresh lockReasonCode / lockMessage from the server.
      if (becameCompleted) {
        void queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
      }

      // 🪙 Show a coins toast and refresh the balance if coins were earned
      if (coinsEarned && coinsEarned > 0) {
        toastCoinsEarned(coinsEarned, 'إكمال الدرس');
        // Invalidate all coins queries so the balance updates immediately everywhere
        void queryClient.invalidateQueries({ queryKey: ['coins-balance'] });
        void queryClient.invalidateQueries({ queryKey: ['coins-me'] });
      }
    },
  });
};
