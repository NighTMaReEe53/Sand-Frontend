import { useQuery } from '@tanstack/react-query';
import { backlogApi } from '../../api/backlog.api';
import { useAuthStore } from '../../store/authStore';

export const useMyBacklogQuery = (enabled = true) => {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['my-backlog', userId ?? 'guest'],
    queryFn: () => backlogApi.getMyBacklog(),
    enabled: enabled && !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });
};
