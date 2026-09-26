import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, UpdateProfilePayload } from '../../api/profile.api';
import { useAuthStore } from '../../store/authStore';

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const { updateUserProfile } = useAuthStore();

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => profileApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Update local auth store if profile changed
      if (updated?.profile) {
        updateUserProfile(updated.profile);
      }
    },
  });
};

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      profileApi.changePassword(data),
  });
};

/** TEACHER/ADMIN: رفع صورة محلية من الجهاز وتعيينها كصورة الملف الشخصي */
export const useUploadProfileImageMutation = () => {
  const queryClient = useQueryClient();
  const { updateUserProfile } = useAuthStore();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadProfileImage(file),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user-profile'], (current: any) =>
        current ? { ...current, photoUrl: updated.photoUrl } : current,
      );
      updateUserProfile({ photoUrl: updated.photoUrl });
      void queryClient.invalidateQueries({ queryKey: ['user-profile'], refetchType: 'active' });
    },
  });
};
