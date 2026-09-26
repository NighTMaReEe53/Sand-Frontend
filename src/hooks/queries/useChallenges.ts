import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '../../api/challenges.api';
import { CreateChallengeDto } from '../../types/challenge.types';
import { useAuthStore } from '../../store/authStore';
import { usePageVisible } from '../usePageVisible';
import { ChallengeDetail } from '../../types/challenge.types';

export const useMyChallengesQuery = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['challenges', userId ?? 'guest'],
    queryFn: () => challengesApi.list(),
    enabled: !!userId,
    // من 15 ثانية → 30 ثانية، ومتوقفة لما التبويب مش مرئي
    refetchInterval: visible ? 30_000 : false,
    staleTime: 5_000,
  });
};

/** Navbar gate — Challenges link shows only when the student's collected
 * question pool (bank + exams across enrolled courses) exceeds the minimum.
 * @param enabled - set false to skip the request (e.g. no active enrollment yet)
 */
export const useChallengeAvailabilityQuery = (enabled = true) => {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['challenge-availability', userId ?? 'guest'],
    queryFn: () => challengesApi.getAvailability(),
    enabled: !!userId && enabled,
    staleTime: 10 * 60_000, // 10 دقائق — nav gate مش بيتغير كتير
    gcTime: 15 * 60_000,
    retry: false,
  });
};

export const useChallengeDetailQuery = (id?: string) => {
  const userId = useAuthStore((state) => state.user?.id);
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['challenge', id, userId ?? 'guest'],
    queryFn: () => challengesApi.getDetail(id!),
    enabled: !!id && !!userId,
    // من 5 ثوانٍ → 10، متوقفة لما التبويب hidden
    refetchInterval: visible ? 10_000 : false,
    staleTime: 5_000,
  });
};

export const useChallengeResultQuery = (id?: string) => {
  const userId = useAuthStore((state) => state.user?.id);
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['challenge-result', id, userId ?? 'guest'],
    queryFn: () => challengesApi.getResult(id!),
    enabled: !!id && !!userId,
    // من 10 ثوانٍ → 20، متوقفة لما التبويب hidden
    refetchInterval: visible ? 20_000 : false,
    staleTime: 15_000,
  });
};

export const useOnlineStudentsQuery = (courseId?: string) => {
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['challenge-online-students', courseId],
    queryFn: () => challengesApi.getOnlineStudents(courseId!),
    enabled: !!courseId,
    // من 30 ثانية → 60 ثانية، متوقفة لما التبويب hidden
    refetchInterval: visible ? 60_000 : false,
    staleTime: 30_000,
  });
};

const useInvalidateChallenges = () => {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['challenges'], refetchType: 'active' }),
      qc.invalidateQueries({ queryKey: ['challenge'], refetchType: 'active' }),
      qc.invalidateQueries({ queryKey: ['challenge-result'], refetchType: 'active' }),
    ]);
  };
};

export const useCreateChallengeMutation = () => {
  const invalidate = useInvalidateChallenges();
  return useMutation({
    mutationFn: (data: CreateChallengeDto) => challengesApi.create(data),
    onSuccess: invalidate,
  });
};

export const useAcceptChallengeMutation = () => {
  const invalidate = useInvalidateChallenges();
  return useMutation({
    mutationFn: (id: string) => challengesApi.accept(id),
    onSuccess: invalidate,
  });
};

export const useRejectChallengeMutation = () => {
  const invalidate = useInvalidateChallenges();
  return useMutation({
    mutationFn: (id: string) => challengesApi.reject(id),
    onSuccess: invalidate,
  });
};

export const useStartChallengeMutation = () => {
  const invalidate = useInvalidateChallenges();
  return useMutation({
    mutationFn: (id: string) => challengesApi.start(id),
    onSuccess: invalidate,
  });
};

export const useSubmitChallengeAnswerMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateChallenges();
  return useMutation({
    mutationFn: ({ id, questionId, selectedOption }: { id: string; questionId: string; selectedOption: number }) =>
      challengesApi.submitAnswer(id, questionId, selectedOption),
    onSuccess: async (result, variables) => {
      queryClient.setQueriesData<ChallengeDetail>({ queryKey: ['challenge', variables.id] }, (detail) => {
        if (!detail) return detail;
        return {
          ...detail,
          questions: detail.questions.map((question) =>
            question.questionId === variables.questionId
              ? { ...question, alreadyAnswered: true, wasCorrect: result.isCorrect }
              : question,
          ),
        };
      });
      await invalidate();
    },
  });
};

export const useFinishChallengeMutation = () => {
  const invalidate = useInvalidateChallenges();
  return useMutation({
    mutationFn: (id: string) => challengesApi.finish(id),
    onSuccess: invalidate,
  });
};
