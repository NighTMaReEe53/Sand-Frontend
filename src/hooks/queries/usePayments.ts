import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments.api';
import { PaymentQuery } from '../../types/payment.types';

export const useMyPaymentsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['my-payments'],
    queryFn: () => paymentsApi.getMyPayments(),
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useTeacherPaymentsQuery = (params?: PaymentQuery, enabled = true) => {
  return useQuery({
    queryKey: ['teacher-payments', params],
    queryFn: () => paymentsApi.getTeacherPayments(params),
    enabled,
    staleTime: 1000 * 30,
  });
};
