import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '../../api/payments.api';
import { CheckoutDto, RejectPaymentDto } from '../../types/payment.types';

export const useCheckoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckoutDto) => paymentsApi.checkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
  });
};

export const useSubmitReceiptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, file }: { paymentId: string; file: File }) =>
      paymentsApi.submitReceipt(paymentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-payments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
};

export const useRetryPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollmentId: string) => paymentsApi.retry(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
  });
};

export const useCancelPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => paymentsApi.cancel(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
  });
};

export const useAcceptPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => paymentsApi.acceptPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-payments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
};

export const useRejectPaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: RejectPaymentDto }) =>
      paymentsApi.rejectPayment(paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-payments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
    },
  });
};
