import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  CheckoutDto,
  CheckoutResponse,
  Payment,
  PaymentQuery,
  RejectPaymentDto,
} from '../types/payment.types';

export const paymentsApi = {
  checkout: async (data: CheckoutDto) => {
    const res = await axiosInstance.post<CheckoutResponse>(ENDPOINTS.PAYMENTS.CHECKOUT, data);
    return res.data;
  },

  submitReceipt: async (paymentId: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);

    const res = await axiosInstance.post<Payment>(
      ENDPOINTS.PAYMENTS.SUBMIT_RECEIPT(paymentId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  retry: async (enrollmentId: string) => {
    const res = await axiosInstance.post<CheckoutResponse>(
      ENDPOINTS.PAYMENTS.RETRY(enrollmentId)
    );
    return res.data;
  },

  cancel: async (paymentId: string) => {
    const res = await axiosInstance.post<{ message: string }>(
      ENDPOINTS.PAYMENTS.CANCEL(paymentId)
    );
    return res.data;
  },

  getMyPayments: async () => {
    const res = await axiosInstance.get<Payment[]>(ENDPOINTS.PAYMENTS.MY_PAYMENTS);
    return res.data;
  },

  getTeacherPayments: async (params?: PaymentQuery) => {
    const res = await axiosInstance.get<
      { payments: Payment[]; meta?: { total: number } } | { data: Payment[]; total: number } | Payment[]
    >(ENDPOINTS.PAYMENTS.TEACHER_PAYMENTS, { params });
    const raw = res.data as any;
    if (Array.isArray(raw)) {
      return { data: raw, total: raw.length };
    }
    // Backend returns { payments, meta } — normalize to { data, total }
    const list = Array.isArray(raw?.payments)
      ? raw.payments
      : Array.isArray(raw?.data)
      ? raw.data
      : [];
    return { data: list, total: raw?.meta?.total ?? raw?.total ?? list.length };
  },

  acceptPayment: async (paymentId: string) => {
    const res = await axiosInstance.patch<{ message: string; payment: Payment }>(
      ENDPOINTS.PAYMENTS.ACCEPT(paymentId)
    );
    return res.data;
  },

  rejectPayment: async (paymentId: string, data: RejectPaymentDto) => {
    const res = await axiosInstance.patch<{ message: string; payment: Payment }>(
      ENDPOINTS.PAYMENTS.REJECT(paymentId),
      data
    );
    return res.data;
  },
};
