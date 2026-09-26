import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { RegisterStudentDto, VerifyOtpDto, ResendOtpDto, LoginDto } from '../../types/auth.types';

export const useRegisterStudentMutation = () => {
  return useMutation({
    mutationFn: (data: RegisterStudentDto) => authApi.registerStudent(data),
  });
};

export const useVerifyOtpMutation = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyOtpDto) => authApi.verifyOtp(data),
    onSuccess: (res) => {
      setAuth(res.user, res.accessToken);
      useCartStore.getState().setOwner(res.user.id);
      queryClient.clear();
    },
  });
};

export const useResendOtpMutation = () => {
  return useMutation({
    mutationFn: (data: ResendOtpDto) => authApi.resendOtp(data),
  });
};

export const useParentRequestOtpMutation = () => {
  return useMutation({
    mutationFn: (data: ResendOtpDto) => authApi.parentRequestOtp(data),
  });
};

export const useParentVerifyOtpMutation = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyOtpDto) => authApi.parentVerifyOtp(data),
    onSuccess: (res) => {
      setAuth(res.user, res.accessToken);
      queryClient.clear();
    },
  });
};

export const useLoginMutation = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: (res) => {
      setAuth(res.user, res.accessToken);
      useCartStore.getState().setOwner(res.user.id);
      queryClient.clear();
    },
  });
};

export const useLogoutMutation = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
    },
  });
};
