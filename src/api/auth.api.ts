import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  RegisterStudentDto,
  VerifyOtpDto,
  ResendOtpDto,
  LoginDto,
  AuthResponse,
} from '../types/auth.types';

export const authApi = {
  registerStudent: async (data: RegisterStudentDto) => {
    const res = await axiosInstance.post<{ message: string; phone: string }>(
      ENDPOINTS.AUTH.REGISTER_STUDENT,
      data
    );
    return res.data;
  },

  verifyOtp: async (data: VerifyOtpDto) => {
    const res = await axiosInstance.post<AuthResponse>(ENDPOINTS.AUTH.VERIFY_OTP, data);
    return res.data;
  },

  resendOtp: async (data: ResendOtpDto) => {
    const res = await axiosInstance.post<{ message: string }>(ENDPOINTS.AUTH.RESEND_OTP, data);
    return res.data;
  },

  parentRequestOtp: async (data: ResendOtpDto) => {
    const res = await axiosInstance.post<{ message: string }>(
      ENDPOINTS.AUTH.PARENT_REQUEST_OTP,
      data
    );
    return res.data;
  },

  parentVerifyOtp: async (data: VerifyOtpDto) => {
    const res = await axiosInstance.post<AuthResponse>(ENDPOINTS.AUTH.PARENT_VERIFY_OTP, data);
    return res.data;
  },

  login: async (data: LoginDto) => {
    const res = await axiosInstance.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, data);
    return res.data;
  },

  logout: async () => {
    const res = await axiosInstance.post<{ message: string }>(ENDPOINTS.AUTH.LOGOUT);
    return res.data;
  },
};
