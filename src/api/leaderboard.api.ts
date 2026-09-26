import { axiosInstance } from './axiosInstance';

export interface LeaderboardRow {
  rank: number;
  medal: 'GOLD' | 'SILVER' | 'BRONZE' | null;
  studentId: string;
  studentName: string;
  photoUrl: string | null;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
  correctCount?: number;
  totalQuestions?: number;
  wrongCount?: number;
  unansweredCount?: number;
  exitCount?: number;
}

export interface ExamLeaderboardResponse {
  exam: { id: string; title: string; totalMarks: number };
  leaderboard: LeaderboardRow[];
  viewer: {
    rank: number | null;
    medal: string | null;
    score: number;
    percentage: number;
    correctCount?: number;
    totalQuestions?: number;
    wrongCount?: number;
    unansweredCount?: number;
    exitCount?: number;
    isEligible?: boolean;
    disqualifiedReason?: string | null;
  } | null;
}

export interface MyAchievementsResponse {
  totals: { gold: number; silver: number; bronze: number; topTenCount: number };
  achievements: {
    examId: string;
    examTitle: string;
    courseTitle: string;
    rank: number;
    medal: 'GOLD' | 'SILVER' | 'BRONZE' | null;
    score: number;
    percentage: number;
    timeTakenSeconds: number;
    submittedAt: string;
  }[];
}

export const leaderboardApi = {
  getExamLeaderboard: async (examId: string): Promise<ExamLeaderboardResponse> => {
    const res = await axiosInstance.get<ExamLeaderboardResponse>(
      `/exams/${examId}/leaderboard`
    );
    return res.data;
  },

  getMyAchievements: async (): Promise<MyAchievementsResponse> => {
    const res = await axiosInstance.get<MyAchievementsResponse>(
      '/students/me/achievements'
    );
    return res.data;
  },
};
