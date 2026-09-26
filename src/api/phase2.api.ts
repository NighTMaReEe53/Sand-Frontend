import { axiosInstance } from './axiosInstance';

export interface BankQuestion {
  id: string;
  text: string;
  imageUrl?: string | null;
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string | null;
  tags: string[];
  courseId?: string | null;
  lessonId?: string | null;
  createdAt: string;
}

export interface BankQuestionInput {
  text: string;
  imageUrl?: string | null;
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
  marks?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string | null;
  tags?: string[];
  courseId?: string | null;
}

export const questionBankApi = {
  list: async (params?: Record<string, unknown>) => {
    const res = await axiosInstance.get<{ questions: BankQuestion[]; pagination: { page: number; total: number; totalPages: number } }>(
      '/question-bank',
      { params }
    );
    return res.data;
  },

  create: async (data: BankQuestionInput) => {
    const res = await axiosInstance.post('/question-bank', data);
    return res.data;
  },

  update: async (id: string, data: Partial<BankQuestionInput>) => {
    const res = await axiosInstance.patch(`/question-bank/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await axiosInstance.delete(`/question-bank/${id}`);
    return res.data;
  },

  bulkDelete: async (ids: string[]) => {
    const res = await axiosInstance.post('/question-bank/bulk-delete', { ids });
    return res.data;
  },

  addToExam: async (examId: string, bankQuestionIds: string[]) => {
    const res = await axiosInstance.post(`/exams/${examId}/add-from-bank`, {
      bankQuestionIds,
    });
    return res.data as { message?: string; addedCount?: number };
  },
};

// ─── Gamification ──────────────────────────────────────────────

export interface BadgeDefinition {
  code: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  awardedAt: string | null;
}

export const gamificationApi = {
  getMe: async () => {
    const res = await axiosInstance.get<{
      streak: { currentStreak: number; longestStreak: number; lastActiveDate: string | null };
      badges: BadgeDefinition[];
      earnedCount: number;
      totalCount: number;
    }>('/gamification/me');
    return res.data;
  },
};

// ─── Study Planner ─────────────────────────────────────────────

export interface StudyTask {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  examId?: string | null;
}

export const studyPlannerApi = {
  getPlanner: async (params?: { courseId?: string; daysAhead?: number }) => {
    const res = await axiosInstance.get<{
      today: StudyTask[];
      upcoming: StudyTask[];
      overdue: StudyTask[];
      completed: StudyTask[];
    }>('/study-planner', { params });
    return res.data;
  },

  create: async (data: { title: string; description?: string; dueDate: string; courseId?: string; lessonId?: string; examId?: string }) => {
    const res = await axiosInstance.post('/study-planner/tasks', data);
    return res.data;
  },

  update: async (id: string, data: Record<string, unknown>) => {
    const res = await axiosInstance.patch(`/study-planner/tasks/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await axiosInstance.delete(`/study-planner/tasks/${id}`);
    return res.data;
  },
};
