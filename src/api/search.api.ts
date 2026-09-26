import { axiosInstance } from './axiosInstance';

export interface SearchCourseResult {
  id: string;
  title: string;
  subject: string | null;
  thumbnailUrl: string | null;
  isFree: boolean;
  teacherName: string | null;
  url: string;
  type: 'course';
}

export interface SearchLessonResult {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  url: string;
  type: 'lesson';
}

export interface SearchQuizResult {
  id: string;
  title: string;
  lessonTitle: string;
  courseTitle: string;
  courseId: string;
  url: string;
  type: 'quiz';
}

export interface SearchExamResult {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  url: string;
  type: 'exam';
}

export interface SearchHomeworkResult {
  id: string;
  title: string;
  lessonTitle: string;
  courseTitle: string;
  courseId: string;
  url: string;
  type: 'homework';
}

export interface SearchSummaryResult {
  id: string;
  title: string;
  courseTitle: string;
  studentName: string;
  url: string;
  type: 'summary';
}

export interface SearchStudentResult {
  id: string;
  fullName: string;
  gradeLevel: string;
  photoUrl: string | null;
  url: string;
  type: 'student';
}

export type SearchResultItem =
  | SearchCourseResult
  | SearchLessonResult
  | SearchQuizResult
  | SearchExamResult
  | SearchHomeworkResult
  | SearchSummaryResult
  | SearchStudentResult;

export interface GlobalSearchResults {
  courses: SearchCourseResult[];
  lessons: SearchLessonResult[];
  quizzes?: SearchQuizResult[];
  exams: SearchExamResult[];
  homeworks?: SearchHomeworkResult[];
  summaries?: SearchSummaryResult[];
  students?: SearchStudentResult[];
}

export const searchApi = {
  global: async (q: string): Promise<GlobalSearchResults> => {
    const res = await axiosInstance.get('/courses/search/global', { params: { q } });
    return res.data;
  },
};
