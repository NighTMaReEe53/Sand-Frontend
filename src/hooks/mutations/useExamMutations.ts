import { useMutation, useQueryClient } from '@tanstack/react-query';
import { examsApi } from '../../api/exams.api';
import {
  CreateExamDto,
  UpdateExamDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  SubmitExamDto,
} from '../../types/exam.types';

export const useCreateExamMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExamDto) => examsApi.createExam(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-exams', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};

export const useUpdateExamMutation = (examId: string, courseId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateExamDto) => examsApi.updateExam(examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-exams', courseId] });
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
    },
  });
};

export const useDeleteExamMutation = (courseId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (examId: string) => examsApi.deleteExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-exams', courseId] });
    },
  });
};

export const useAddQuestionMutation = (examId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionDto) => examsApi.addQuestion(examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-questions', examId] });
      queryClient.invalidateQueries({ queryKey: ['exam-submissions', examId] });
      queryClient.invalidateQueries({ queryKey: ['course-exams'] });
    },
  });
};

export const useUpdateQuestionMutation = (examId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: UpdateQuestionDto }) =>
      examsApi.updateQuestion(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-questions'] });
      if (examId) {
        queryClient.invalidateQueries({ queryKey: ['exam-questions', examId] });
      }
      queryClient.invalidateQueries({ queryKey: ['exam-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['course-exams'] });
    },
  });
};

export const useDeleteQuestionMutation = (examId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => examsApi.deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-questions'] });
      if (examId) {
        queryClient.invalidateQueries({ queryKey: ['exam-questions', examId] });
      }
      queryClient.invalidateQueries({ queryKey: ['exam-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['course-exams'] });
    },
  });
};

export const useStartExamMutation = () => {
  return useMutation({
    mutationFn: (examId: string) => examsApi.startExam(examId),
  });
};

export const useSubmitExamMutation = (attemptId: string, examId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitExamDto) => examsApi.submitExam(attemptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempt-result', attemptId] });
      queryClient.invalidateQueries({ queryKey: ['my-attempts', examId] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
      // Refresh the navbar «أخطائي» link immediately after grading
      queryClient.invalidateQueries({ queryKey: ['my-mistakes'] });
      queryClient.invalidateQueries({ queryKey: ['my-results'] });
      // Pull the EXAM_RESULT notification instantly instead of waiting
      // for the bell's next poll cycle
      queryClient.invalidateQueries({ queryKey: ['notifications-feed-live'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
};
