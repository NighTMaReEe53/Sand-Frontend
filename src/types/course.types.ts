import { GradeLevel } from './auth.types';

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/** نوع وصول الكورس: دائم (دروس للأبد) أو باقة محددة بوقت */
export type AccessType = 'LIFETIME' | 'LIMITED';

export type MaterialType = 'PDF' | 'DOC' | 'PPTX' | 'IMAGE' | 'OTHER';

export interface Material {
  id: string;
  courseId?: string | null;
  lessonId?: string | null;
  title: string;
  fileUrl: string;
  fileType: MaterialType;
  createdAt: string;
}

export interface LessonQuizSummary {
  id: string;
  title: string;
  passingPercentage?: number;
  timeLimitMinutes?: number | null;
  maxAttempts?: number;
  isPublished: boolean;
  questionCount?: number;
}

export interface LessonHomeworkSummary {
  id: string;
  title: string;
  isPublished: boolean;
  pdfUrl?: string | null;
  questionCount?: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  sectionId?: string | null;
  title: string;
  description?: string | null;
  orderIndex: number;
  videoUrl?: string;
  durationSeconds: number;
  isPreview: boolean;
  isCompleted?: boolean;
  watchedPercentage?: number;
  materials?: Material[];
  /** Quizzes attached to this lesson (returned by the curriculum endpoint) */
  quizzes?: LessonQuizSummary[];
  /** Homework attached to this lesson (returned by the curriculum endpoint) */
  homeworks?: LessonHomeworkSummary[];
  createdAt: string;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lessons: Lesson[];
  materials: Material[];
}

export interface CurriculumResponse {
  courseId: string;
  totalSections: number;
  totalLessons: number;
  totalMaterials: number;
  /** Sum of per-lesson durations (measured from real video playback when available) */
  totalDurationSeconds?: number;
  totalQuizzes?: number;
  sections: Section[];
}

export interface CreateSectionDto {
  title: string;
  order?: number;
}

export interface UpdateSectionDto {
  title?: string;
  order?: number;
}

export interface ReorderSectionsDto {
  sectionIds: string[];
}

export interface Course {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  learningOutcomes?: string[];
  thumbnailUrl?: string | null;
  price: number | string;
  isFree: boolean;
  /** Offer/coupon set by the teacher — active only while discountEndsAt is in the future */
  discountPercent?: number | null;
  discountEndsAt?: string | null;
  gradeLevel: GradeLevel;
  gradeLevels: GradeLevel[];
  status: CourseStatus;
  /** LIFETIME = دروس للأبد، LIMITED = باقة بمؤقت (durationMonths) */
  accessType?: AccessType;
  durationMonths?: number | null;
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: string;
    fullName: string;
    specialization?: string;
    photoUrl?: string | null;
    bio?: string | null;
  };
  sections?: Section[];
  lessons?: Lesson[];
  _count?: {
    lessons: number;
    enrollments: number;
    exams?: number;
  };
  isEnrolled?: boolean;
  isOwner?: boolean;
  enrollmentStatus?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | null;
  /** Normalized taxonomy (additive — legacy gradeLevels kept for compatibility) */
  subjectRef?: { id: string; code: string; name: string } | null;
  targets?: import('./taxonomy.types').CourseTargetRef[];
}

export interface CourseQuery {
  page?: number;
  limit?: number;
  search?: string;
  gradeLevel?: GradeLevel | '';
  isFree?: boolean;
  status?: CourseStatus;
  accessType?: AccessType;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  subject?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  mine?: boolean;
  enrolledOnly?: boolean;
  /** ADMIN: filter courses by a teacher's profile id */
  teacherId?: string;
  /** Taxonomy filters */
  gradeId?: string;
  stageId?: string;
  trackId?: string;
  subjectId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateCourseDto {
  title: string;
  description: string;
  learningOutcomes?: string[];
  thumbnailUrl?: string;
  price?: number;
  isFree: boolean;
  discountPercent?: number | null;
  discountEndsAt?: string | null;
  gradeLevel?: GradeLevel;
  gradeLevels: GradeLevel[];
  status?: CourseStatus;
  accessType?: AccessType;
  durationMonths?: number | null;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {}

export interface CreateLessonDto {
  title: string;
  description?: string;
  videoUrl?: string;
  durationSeconds?: number;
  isPreview?: boolean;
  orderIndex?: number;
  sectionId?: string;
}

export interface UpdateLessonDto extends Partial<CreateLessonDto> {}

export interface ReorderLessonsDto {
  courseId: string;
  orders: { lessonId: string; newOrderIndex: number }[];
}
