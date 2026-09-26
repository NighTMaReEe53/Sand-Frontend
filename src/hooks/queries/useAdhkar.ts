import { useQuery } from '@tanstack/react-query';
import { adhkarApi } from '../../api/adhkar.api';
import { useAuthStore } from '../../store/authStore';

export const useAdhkarContentQuery = () =>
  useQuery({
    queryKey: ['adhkar-content'],
    queryFn: () => adhkarApi.getContent(),
    staleTime: 1000 * 60 * 30,
  });

export const useAdhkarDismissalsQuery = () => {
  const { isAuthenticated, user } = useAuthStore();
  return useQuery({
    queryKey: ['adhkar-dismissals', user?.id ?? 'guest'],
    queryFn: () => adhkarApi.getDismissals(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });
};

export const useRandomDuaQuery = (context: 'general' | 'exam' | 'post-exam' | 'post-lecture', enabled: boolean) =>
  useQuery({
    queryKey: ['dua-random', context],
    queryFn: () => adhkarApi.getRandomDua(context),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
