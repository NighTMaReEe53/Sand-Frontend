import { QueryClient } from '@tanstack/react-query';
import { Course } from '../types/course.types';

/** Update visible course cards/details immediately, then allow the server fetch to reconcile them. */
export const writeCourseToCache = (queryClient: QueryClient, course: Course) => {
  queryClient.setQueriesData({ queryKey: ['course', course.id] }, (old: unknown) =>
    old && typeof old === 'object' ? { ...(old as object), ...course } : old,
  );

  queryClient.setQueriesData({ queryKey: ['courses'] }, (old: unknown) => {
    if (Array.isArray(old)) {
      return old.map((item) => (item?.id === course.id ? { ...item, ...course } : item));
    }
    if (!old || typeof old !== 'object') return old;

    const cached = old as { data?: Course[]; courses?: Course[] };
    const replace = (items?: Course[]) =>
      items?.map((item) => (item.id === course.id ? { ...item, ...course } : item));

    return {
      ...cached,
      ...(cached.data && { data: replace(cached.data) }),
      ...(cached.courses && { courses: replace(cached.courses) }),
    };
  });
};

export const refreshCourseViews = async (queryClient: QueryClient, courseId?: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['courses'] }),
    queryClient.invalidateQueries({ queryKey: ['curriculum', courseId] }),
    ...(courseId ? [queryClient.invalidateQueries({ queryKey: ['course', courseId] })] : []),
    queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['student-dashboard'] }),
  ]);
};
