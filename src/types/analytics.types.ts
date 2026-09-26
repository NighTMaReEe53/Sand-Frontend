export interface StudentPerformanceResponse {
  overview: {
    examsCompleted: number;
    examsPassed: number;
    avgExamScore: number | null;
    bestExamScore: number | null;
    worstExamScore: number | null;
    quizzesCompleted: number;
    quizzesPassed: number;
    avgQuizScore: number | null;
    coursesEnrolled: number;
    coursesCompleted: number;
    lessonsCompleted: number;
    totalLessonsInEnrolledCourses: number;
  };
  weakTopics: TopicPerformance[];
  strongTopics: TopicPerformance[];
  recentActivity: RecentActivityItem[];
}

export interface TopicPerformance {
  lessonId: string | null;
  lessonTitle: string;
  answersCount: number;
  accuracy: number;
}

export interface RecentActivityItem {
  type: 'EXAM' | 'QUIZ';
  title: string;
  score: number;
  isPassed: boolean | null;
  date: string | null;
}
