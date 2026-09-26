import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../api/courses.api';
import { CreateCourseDto, UpdateCourseDto } from '../../types/course.types';
import { refreshCourseViews, writeCourseToCache } from '../../lib/courseCache';

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCourseDto) => coursesApi.create(data),
    onSuccess: async (course) => {
      writeCourseToCache(queryClient, course);
      await refreshCourseViews(queryClient, course.id);
    },
  });
};

export const useUpdateCourseMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCourseDto) => coursesApi.update(courseId, data),
    onSuccess: async (updated) => {
      writeCourseToCache(queryClient, updated);
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: async (_, courseId) => {
      queryClient.removeQueries({ queryKey: ['course', courseId] });
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useEnrollFreeCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => coursesApi.enrollFree(courseId),
    onSuccess: async (_, courseId) => {
      await Promise.all([
        refreshCourseViews(queryClient, courseId),
        queryClient.invalidateQueries({ queryKey: ['my-payments'] }),
      ]);
    },
  });
};
