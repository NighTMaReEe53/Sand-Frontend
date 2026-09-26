import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  ExamBase,
  CreateExamDto,
  UpdateExamDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  StartExamResponse,
  SubmitExamDto,
  ExamResultResponse,
  ExamAttempt,
  ExamSubmissionsResponse,
  ExamQuestionFull,
  ExamQuestionsResponse,
  ExamExitType,
  RecordExamExitResponse,
} from '../types/exam.types';

export interface MyResultItem {
  id: string;
  attemptNumber: number;
  score: number;
  totalMarks: number;
  isPassed: boolean | null;
  status: string;
  submittedAt: string | null;
  title: string;
  courseTitle: string;
}

export interface MyResultsResponse {
  examAttempts: (MyResultItem & { examId: string; passingMarks: number })[];
  quizAttempts: (MyResultItem & { quizId: string })[];
  homeworkAttempts: (MyResultItem & { homeworkId: string; lessonId: string; courseId: string; hasPendingEssay?: boolean })[];
}

/** One wrongly-answered question with full review data */
export interface MistakeQuestion {
  questionId: string;
  text: string;
  imageUrl: string | null;
  options: string[];
  yourAnswerIndex: number | null;
  correctAnswerIndex: number;
  explanation: string | null;
  attemptNumber: number;
  answeredAt: string | null;
}

/** Wrong answers grouped by section → exam/quiz/homework → date */
export interface MistakeGroup {
  id: string;
  type: 'EXAM' | 'QUIZ' | 'HOMEWORK';
  sourceId: string;
  courseId?: string;
  title: string;
  courseTitle: string;
  sectionName: string | null;
  lessonTitle: string | null;
  lastDate: string | null;
  questions: MistakeQuestion[];
}

export interface MyMistakesResponse {
  hasMistakes: boolean;
  summary: { totalWrong: number; examWrong: number; quizWrong: number; homeworkWrong?: number };
  groups: MistakeGroup[];
}

export interface PracticeQuestionItem {
  id: string;
  orderIndex: number;
  text: string;
  imageUrl: string | null;
  options: string[];
  marks: number;
}

export interface MistakePracticeExamResponse {
  practiceId: string;
  title: string;
  courseTitle: string;
  courseId: string | null;
  sourceType: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  questions: PracticeQuestionItem[];
}

export interface SubmitPracticeExamPayload {
  practiceId?: string;
  timeSpentSeconds: number;
  answers: { questionId: string; selectedOptionIndex: number | null }[];
}

export interface PracticeExamResultResponse {
  practiceId?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  submittedAt: string;
  detailedResults: {
    questionId: string;
    orderIndex: number;
    text: string;
    imageUrl: string | null;
    options: string[];
    selectedOptionIndex: number | null;
    correctOptionIndex: number;
    isCorrect: boolean;
    explanation: string | null;
  }[];
}

// One-browser lock: the backend issues a session key when an attempt starts.
// It is persisted in localStorage so only this browser can continue the exam;
// any other browser gets rejected with 403.
const sessionHeader = (attemptId?: string, examId?: string) => {
  const key =
    (attemptId && localStorage.getItem(`exam_session_${attemptId}`)) ??
    (examId && localStorage.getItem(`exam_session_exam_${examId}`)) ??
    '';
  return key ? { 'x-exam-session': key } : {};
};

const saveSessionKey = (examId: string, attemptId: string, key?: string | null) => {
  if (!key) return;
  localStorage.setItem(`exam_session_exam_${examId}`, key);
  localStorage.setItem(`exam_session_${attemptId}`, key);
};

export const examsApi = {
  // TEACHER: Create exam for course/lesson
  createExam: async (courseId: string, data: CreateExamDto) => {
    const res = await axiosInstance.post<ExamBase>(ENDPOINTS.EXAMS.CREATE(courseId), data);
    return res.data;
  },

  // TEACHER: Update exam
  updateExam: async (id: string, data: UpdateExamDto) => {
    const res = await axiosInstance.patch<ExamBase>(ENDPOINTS.EXAMS.UPDATE(id), data);
    return res.data;
  },

  // TEACHER: Delete exam (soft delete)
  deleteExam: async (id: string) => {
    const res = await axiosInstance.delete<{ message: string }>(ENDPOINTS.EXAMS.DELETE(id));
    return res.data;
  },

  // TEACHER: Get all questions of exam
  getExamQuestions: async (examId: string) => {
    const res = await axiosInstance.get<ExamQuestionsResponse>(
      ENDPOINTS.EXAMS.GET_QUESTIONS(examId)
    );
    return res.data;
  },

  // TEACHER: Upload question image
  uploadQuestionImage: async (examId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await axiosInstance.post<{ message: string; imageUrl: string }>(
      ENDPOINTS.EXAMS.UPLOAD_QUESTION_IMAGE(examId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  // TEACHER: Add question to exam
  addQuestion: async (examId: string, data: CreateQuestionDto) => {
    const res = await axiosInstance.post<ExamQuestionFull>(
      ENDPOINTS.EXAMS.ADD_QUESTION(examId),
      data
    );
    return res.data;
  },

  // TEACHER: Update question
  updateQuestion: async (questionId: string, data: UpdateQuestionDto) => {
    const res = await axiosInstance.patch<ExamQuestionFull>(
      ENDPOINTS.EXAMS.UPDATE_QUESTION(questionId),
      data
    );
    return res.data;
  },

  // TEACHER: Delete question
  deleteQuestion: async (questionId: string) => {
    const res = await axiosInstance.delete<{ message: string }>(
      ENDPOINTS.EXAMS.DELETE_QUESTION(questionId)
    );
    return res.data;
  },

  // TEACHER: Get submissions and stats
  getSubmissions: async (examId: string) => {
    const res = await axiosInstance.get<ExamSubmissionsResponse>(
      ENDPOINTS.EXAMS.SUBMISSIONS(examId)
    );
    return res.data;
  },

  getRankings: async (
    examId: string,
    order: 'top' | 'bottom'
  ): Promise<{
    exam: { title: string; totalMarks: number };
    order: 'top' | 'bottom';
    rankings: {
      attemptId: string;
      attemptNumber: number;
      studentName: string;
      gradeLevel?: string;
      score: number;
      isPassed: boolean;
      submittedAt?: string | null;
    }[];
  }> => {
    const res = await axiosInstance.get(`/exams/${examId}/rankings`, {
      params: { order },
    });
    return res.data;
  },

  // TEACHER: Get detailed student attempt
  getAttemptDetail: async (attemptId: string) => {
    const res = await axiosInstance.get<import('../types/exam.types').AttemptDetailResponse>(
      ENDPOINTS.EXAMS.ATTEMPT_DETAIL(attemptId)
    );
    return res.data;
  },

  // STUDENT: List exams in course
  getCourseExams: async (courseId: string) => {
    const res = await axiosInstance.get<ExamBase[]>(ENDPOINTS.COURSES.EXAMS(courseId));
    return res.data;
  },

  // STUDENT: Start exam attempt (Strict Anti-Cheat: NO correct answers returned)
  startExam: async (examId: string) => {
    const res = await axiosInstance.post<StartExamResponse>(
      ENDPOINTS.EXAMS.START(examId),
      undefined,
      { headers: sessionHeader(undefined, examId) }
    );
    saveSessionKey(examId, res.data.attempt.id, res.data.attempt.sessionKey);
    return res.data;
  },

  // STUDENT: List my attempts for exam
  getMyAttempts: async (examId: string) => {
    const res = await axiosInstance.get<
      import('../types/exam.types').MyAttemptsResponse
    >(ENDPOINTS.EXAMS.MY_ATTEMPTS(examId));
    return res.data;
  },

  // STUDENT: Submit answers atomically
  submitExam: async (attemptId: string, data: SubmitExamDto) => {
    const res = await axiosInstance.post<ExamResultResponse>(
      ENDPOINTS.EXAMS.SUBMIT_ATTEMPT(attemptId),
      data,
      { headers: sessionHeader(attemptId) }
    );
    return res.data;
  },

  // STUDENT: Get result
  getAttemptResult: async (attemptId: string) => {
    const res = await axiosInstance.get<ExamResultResponse>(
      ENDPOINTS.EXAMS.ATTEMPT_RESULT(attemptId)
    );
    return res.data;
  },

  // STUDENT: Get question by index in persistent shuffle order
  getQuestion: async (attemptId: string, index: number) => {
    const res = await axiosInstance.get<import('../types/exam.types').GetAttemptQuestionResponse>(
      ENDPOINTS.EXAMS.GET_QUESTION(attemptId, index),
      { headers: sessionHeader(attemptId) }
    );
    return res.data;
  },

  // STUDENT: Submit single answer and get next question / result
  answerQuestion: async (
    attemptId: string,
    data: { questionId: string; selectedOptionIndex: number; finish?: boolean }
  ) => {
    const res = await axiosInstance.post<import('../types/exam.types').AnswerQuestionResponse>(
      ENDPOINTS.EXAMS.ANSWER_QUESTION(attemptId),
      data,
      { headers: sessionHeader(attemptId) }
    );
    return res.data;
  },

  // Student: record a debounced exam exit; the server owns the counter.
  recordAttemptExit: async (attemptId: string, data: { eventId: string; exitType: ExamExitType }) => {
    const res = await axiosInstance.post<RecordExamExitResponse>(
      ENDPOINTS.EXAMS.RECORD_EXIT(attemptId),
      data,
      { headers: sessionHeader(attemptId) },
    );
    return res.data;
  },

  // STUDENT/TEACHER: Download PDF result review
  downloadResultPdf: async (attemptId: string) => {
    const res = await axiosInstance.get(ENDPOINTS.EXAMS.RESULT_PDF(attemptId), {
      responseType: 'blob',
    });
    triggerPdfDownload(res, attemptId, 'نتيجة-الامتحان');
  },

  // STUDENT: All graded attempts across every course (exams + quizzes)
  getMyResults: async (): Promise<MyResultsResponse> => {
    const res = await axiosInstance.get<MyResultsResponse>('/students/me/results');
    return res.data;
  },

  // STUDENT: Every wrong answer across submitted exams & quizzes
  getMyMistakes: async (): Promise<MyMistakesResponse> => {
    const res = await axiosInstance.get<MyMistakesResponse>('/students/me/mistakes');
    return res.data;
  },

  // STUDENT: Generate a timed practice exam from mistakes
  generateMistakePracticeExam: async (params: { courseId?: string; groupId?: string; count?: number }) => {
    const res = await axiosInstance.post<MistakePracticeExamResponse>(
      ENDPOINTS.EXAMS.MISTAKE_PRACTICE,
      params,
    );
    return res.data;
  },

  // STUDENT: Submit and grade mistake practice exam
  submitMistakePracticeExam: async (payload: SubmitPracticeExamPayload) => {
    const res = await axiosInstance.post<PracticeExamResultResponse>(
      ENDPOINTS.EXAMS.SUBMIT_MISTAKE_PRACTICE,
      payload,
    );
    return res.data;
  },

  // STUDENT/TEACHER: Download quiz attempt result review as PDF
  downloadQuizResultPdf: async (attemptId: string) => {
    const res = await axiosInstance.get(`/quiz-attempts/${attemptId}/result/pdf`, {
      responseType: 'blob',
    });
    triggerPdfDownload(res, attemptId, 'نتيجة-الكويز');
  },

  // TEACHER: Reactivate student exam attempts / reset lock
  reactivateStudentExam: async (examId: string, studentId: string): Promise<{ message: string }> => {
    const res = await axiosInstance.post(`/exams/${examId}/students/${studentId}/reactivate`);
    return res.data;
  },
};

const triggerPdfDownload = (
  res: { data: BlobPart; headers?: Record<string, unknown> },
  attemptId: string,
  prefix: string,
) => {
  const blob = new Blob([res.data], { type: 'application/pdf' });

  // Prefer the server-provided filename (supports Arabic via RFC 5987)
  let fileName = `${prefix}-${attemptId.slice(0, 8)}.pdf`;
  const disposition: string = String(res.headers?.['content-disposition'] ?? '');
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  try {
    if (utf8Match) {
      fileName = decodeURIComponent(utf8Match[1]);
    } else if (asciiMatch && asciiMatch[1]) {
      fileName = asciiMatch[1];
    }
  } catch {
    // keep fallback name
  }

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
