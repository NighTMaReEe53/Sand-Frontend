import { Course } from './course.types';
import { GradeLevel } from './auth.types';

export type PaymentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface Payment {
  id: string;
  enrollmentId: string;
  courseId: string;
  amount: number | string;
  orderReference: string;
  receiptImageUrl?: string | null;
  status: PaymentStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  course: Course;
  enrollment?: {
    id: string;
    studentId: string;
    courseId: string;
    status: string;
    student?: {
      id: string;
      fullName: string;
      guardianPhone: string;
      gradeLevel: GradeLevel;
      user?: {
        phone: string;
        email: string;
      };
    };
  };
}

export interface CheckoutDto {
  courseId?: string;
  bundleId?: string;
  couponCode?: string;
}

export interface CheckoutResponse {
  paymentId: string;
  enrollmentId: string;
  orderReference: string;
  amount: number;
  vodafoneCashNumber: string;
  expiresAt: string;
  instructions: string;
}

export interface RejectPaymentDto {
  rejectionReason: string;
}

export interface PaymentQuery {
  status?: PaymentStatus;
  courseId?: string;
  page?: number;
  limit?: number;
}
