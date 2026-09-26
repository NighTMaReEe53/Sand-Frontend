import React from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '../../api/courses.api';
import { CourseQuery } from '../../types/course.types';
import { useAuthStore } from '../../store/authStore';

export const useCoursesQuery = (params?: CourseQuery, enabled = true) => {
  // Scope cached access/enrollment state to the actual account, not merely
  // "has a token". This prevents stale data after switching accounts.
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['courses', params, userId ?? 'guest'],
    queryFn: () => coursesApi.getAll(params),
    enabled,
    // Course lists are shared by the home page, catalog and navbar-adjacent
    // routes; five minutes keeps navigation snappy. Course mutations already
    // invalidate this key when the list actually changes.
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    // The Axios client already retries a transient GET once. Avoid stacking
    // React Query retries on top of that, so a disconnected catalog reaches
    // the retry UI quickly instead of looking like a permanent loader.
    retry: false,
    // Perf/UX: while new filters load, keep showing the previous results
    // instead of collapsing the grid into skeletons (no page resize).
    placeholderData: keepPreviousData,
  });
};

export const useCourseDetailQuery = (id?: string) => {
  // isOwner/isEnrolled changes per account, so the account id is part of the key.
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['course', id, userId ?? 'guest'],
    queryFn: () => coursesApi.getById(id!),
    enabled: !!id,
    // Access state changes only after explicit enrollment/ownership actions;
    // those mutations already invalidate this key. A short fresh window keeps
    // back-navigation from showing a blocking loader for the same course.
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};

/**
 * Perf: prefetch course details when the user hovers/focuses a course card,
 * so navigating to the details page renders instantly from cache.
 */
export const usePrefetchCourseDetail = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return React.useCallback(
    (id?: string) => {
      if (!id) return;
      void queryClient.prefetchQuery({
        queryKey: ['course', id, userId ?? 'guest'],
        queryFn: () => coursesApi.getById(id),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
      });
    },
    [queryClient, userId]
  );
};
