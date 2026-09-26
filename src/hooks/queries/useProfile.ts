import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../../api/profile.api';
import { useAuthStore } from '../../store/authStore';

export const useProfileQuery = (enabled = true) => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: () => profileApi.getProfile(),
    // The navbar already receives the basic profile with the auth session.
    // Fetch the full profile only when a caller actually needs it.
    enabled: isAuthenticated && enabled,
    staleTime: 1000 * 60 * 10,
  });
};

export const useTeacherProfileQuery = (teacherId?: string) => {
  return useQuery({
    queryKey: ['teacher-profile', teacherId],
    queryFn: () => (teacherId ? profileApi.getTeacherProfile(teacherId) : null),
    enabled: !!teacherId,
    staleTime: 1000 * 60 * 5,
  });
};
