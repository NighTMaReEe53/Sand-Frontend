export interface BacklogItem {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  orderIndex: number;
  type: 'VIDEO' | 'QUIZ' | 'HOMEWORK' | 'EXAM';
  watchedPercentage: number;
  durationSeconds: number;
  dueDate: string | null;
  overdue: boolean;
}

export interface BacklogCourse {
  courseId: string;
  courseTitle: string;
  itemCount: number;
  items: BacklogItem[];
}

export interface BacklogResponse {
  totalItems: number;
  courses: BacklogCourse[];
}
