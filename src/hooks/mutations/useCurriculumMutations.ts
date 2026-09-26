import { useMutation, useQueryClient } from '@tanstack/react-query';
import { curriculumApi } from '../../api/curriculum.api';
import { CreateSectionDto, UpdateSectionDto, ReorderSectionsDto } from '../../types/course.types';
import { refreshCourseViews } from '../../lib/courseCache';

export const useCreateSectionMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionDto) => curriculumApi.createSection(courseId, data),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useUpdateSectionMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: UpdateSectionDto }) =>
      curriculumApi.updateSection(sectionId, data),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useDeleteSectionMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sectionId: string) => curriculumApi.deleteSection(sectionId),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};

export const useReorderSectionsMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderSectionsDto) => curriculumApi.reorderSections(courseId, data),
    onSuccess: async () => {
      await refreshCourseViews(queryClient, courseId);
    },
  });
};
