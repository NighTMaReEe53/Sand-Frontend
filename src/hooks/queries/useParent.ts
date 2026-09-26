import { useQuery } from '@tanstack/react-query';
import { parentApi } from '../../api/parent.api';
import type {
  ParentResultStatusFilter,
  ParentResultTypeFilter,
} from '../../api/parent.api';

const STALE_30S = 30 * 1000;

export const useParentChildrenQuery = (enabled = true) =>
  useQuery({
    queryKey: ['parent', 'children'],
    queryFn: () => parentApi.getMe(),
    enabled,
    staleTime: STALE_30S,
  });

export const useParentStudentProfileQuery = (
  studentId: string | undefined,
  enabled = true
) =>
  useQuery({
    queryKey: ['parent', 'student-profile', studentId],
    queryFn: () => parentApi.getStudentProfile(studentId!),
    enabled: enabled && !!studentId,
    staleTime: STALE_30S,
  });

export const useParentStudentResultsQuery = (
  studentId: string | undefined,
  filters: {
    courseId?: string;
    type?: ParentResultTypeFilter;
    status?: ParentResultStatusFilter;
  },
  enabled = true
) =>
  useQuery({
    queryKey: ['parent', 'student-results', studentId, filters],
    queryFn: () => parentApi.getStudentResults(studentId!, filters),
    enabled: enabled && !!studentId,
    staleTime: STALE_30S,
  });

export const useParentStudentLessonsQuery = (
  studentId: string | undefined,
  courseId?: string,
  enabled = true
) =>
  useQuery({
    queryKey: ['parent', 'student-lessons', studentId, courseId ?? 'ALL'],
    queryFn: () => parentApi.getStudentLessons(studentId!, courseId),
    enabled: enabled && !!studentId,
    staleTime: STALE_30S,
  });
