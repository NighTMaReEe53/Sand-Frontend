export type LessonStatus = 'COMPLETED' | 'IN_PROGRESS' | 'AVAILABLE' | 'LOCKED';

export interface LessonProgress {
  lessonId: string;
  title?: string;
  sectionId?: string | null;
  orderIndex?: number;
  durationSeconds?: number;
  watchedPercentage: number;
  isCompleted: boolean;
  lastPositionSeconds: number;
  lastWatchedAt: string | null;
  /** Phase 1 — sequential unlocking state (backend is the source of truth) */
  status?: LessonStatus;
  quizCompleted?: boolean;
  homeworkCompleted?: boolean;
  lockReasonCode?: string | null;
  lockMessage?: string | null;
}

export interface SectionProgress {
  sectionId: string;
  title: string;
  order: number;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
}

export interface CourseProgressResponse {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  courseProgressPercentage: number;
  isCourseCompleted: boolean;
  sections: SectionProgress[];
  resume: {
    lessonId: string;
    title: string;
    positionSeconds: number;
  } | null;
  lessons: LessonProgress[];
}

export interface UpdateLessonProgressDto {
  watchedPercentage: number;
  positionSeconds?: number;
  durationSeconds?: number;
}

export interface UpdateLessonProgressResponse {
  lessonId: string;
  watchedPercentage: number;
  isCompleted: boolean;
  lastPositionSeconds: number;
  lastWatchedAt: string;
  quizCompleted: boolean;
  homeworkCompleted: boolean;
}
