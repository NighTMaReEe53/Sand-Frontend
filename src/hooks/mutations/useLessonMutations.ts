import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonsApi } from '../../api/lessons.api';
import {
  CreateLessonDto,
  UpdateLessonDto,
  MaterialType,
} from '../../types/course.types';
import { refreshCourseViews } from '../../lib/courseCache';

export const useCreateLessonMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLessonDto) => lessonsApi.create(courseId, data),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useUpdateLessonMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: UpdateLessonDto }) =>
      lessonsApi.update(lessonId, data),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useDeleteLessonMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => lessonsApi.delete(lessonId),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useReorderLessonsMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orders: { lessonId: string; newOrderIndex: number }[]) =>
      lessonsApi.reorder(courseId, orders),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useConfirmVideoUploadMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      data,
    }: {
      lessonId: string;
      data: { videoUrl: string; durationSeconds?: number };
    }) => lessonsApi.confirmVideoUpload(lessonId, data),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useCreateMaterialMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      lessonId?: string;
      title: string;
      fileUrl: string;
      fileType?: MaterialType;
    }) => lessonsApi.createMaterial(courseId, data),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useDeleteMaterialMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (materialId: string) => lessonsApi.deleteMaterial(materialId),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};
