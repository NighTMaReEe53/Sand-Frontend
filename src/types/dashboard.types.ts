import { Course } from './course.types';
import { Payment } from './payment.types';

export interface StudentDashboardResponse {
  stats: {
    enrolledCoursesCount: number;
    completedLessonsCount: number;
    passedExamsCount: number;
    averageScore: number;
  };
  enrolledCourses: Array<{
    course: Course;
    enrolledAt: string;
    progressPercentage: number;
    completedLessons: number;
    totalLessons: number;
    lastWatchedLesson?: {
      id: string;
      title: string;
    } | null;
  }>;
  recentExamAttempts: Array<{
    attemptId: string;
    examTitle: string;
    courseTitle: string;
    score: number;
    totalMarks: number;
    isPassed: boolean;
    submittedAt: string;
  }>;
  pendingPayments: Payment[];
}

export interface TeacherDashboardResponse {
  // الباك بيرجع هذه الحقول مباشرة في data (بدون wrapper stats)
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalUniqueStudents: number;
  totalGrossRevenue: number;
  successfulPaymentsCount: number;
  pendingReceiptsCount: number;

  coursesSummary: Array<{
    courseId: string;
    title: string;
    gradeLevel: string;
    price: number;
    isFree: boolean;
    status: string;
    totalEnrollments: number;
    activeEnrollments: number;
    pendingPaymentsCount: number;
    lessonsCount: number;
  }>;
  recentPayments: Payment[];
  recentActivity: Array<{
    id: string;
    type: 'ENROLLMENT' | 'PAYMENT' | 'EXAM_SUBMISSION';
    message: string;
    timestamp: string;
  }>;
}

