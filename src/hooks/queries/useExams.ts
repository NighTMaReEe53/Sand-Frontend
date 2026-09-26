import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../../api/exams.api';
import { usePageVisible } from '../usePageVisible';

export const useCourseExamsQuery = (courseId?: string, enabled = true) => {
  return useQuery({
    queryKey: ['course-exams', courseId],
    queryFn: () => examsApi.getCourseExams(courseId!),
    enabled: !!courseId && enabled,
    // The sidebar only needs the published exam list. Keeping it fresh for
    // five minutes avoids polling while a student watches a video.
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchInterval: false,
  });
};

export const useMyResultsQuery = (enabled = true) => {
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['my-results'],
    queryFn: () => examsApi.getMyResults(),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 دقيقة — النتائج مش بتتغير دلوقتي
    // من 60 ثانية → 120، ومتوقف لما التبويب hidden
    refetchInterval: visible ? 120_000 : false,
  });
};

export const useMyMistakesQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['my-mistakes'],
    queryFn: () => examsApi.getMyMistakes(),
    enabled,
    // Nav gate only — 5 min staleTime avoids refetching on every mount/focus.
    // Pages that need live mistake data should pass their own staleTime locally.
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useMyAttemptsQuery = (examId?: string, enabled = true) => {
  return useQuery({
    queryKey: ['my-attempts', examId],
    queryFn: () => examsApi.getMyAttempts(examId!),
    enabled: !!examId && enabled,
    staleTime: 1000 * 30,
  });
};

export const useAttemptResultQuery = (attemptId?: string, enabled = true) => {
  return useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: () => examsApi.getAttemptResult(attemptId!),
    enabled: !!attemptId && enabled,
    staleTime: 1000 * 60 * 10,
  });
};

export const useExamSubmissionsQuery = (examId?: string, enabled = true) => {
  return useQuery({
    queryKey: ['exam-submissions', examId],
    queryFn: () => examsApi.getSubmissions(examId!),
    enabled: !!examId && enabled,
    staleTime: 1000 * 30,
  });
};

export const useExamQuestionsQuery = (examId?: string, enabled = true) => {
  return useQuery({
    queryKey: ['exam-questions', examId],
    queryFn: () => examsApi.getExamQuestions(examId!),
    enabled: !!examId && enabled,
    staleTime: 1000 * 30,
  });
};

export const useAttemptDetailQuery = (attemptId?: string, enabled = true) => {
  return useQuery({
    queryKey: ['attempt-detail', attemptId],
    queryFn: () => examsApi.getAttemptDetail(attemptId!),
    enabled: !!attemptId && enabled,
    staleTime: 1000 * 60 * 10,
  });
};
