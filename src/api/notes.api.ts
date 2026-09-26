import { axiosInstance } from './axiosInstance';
import { Note, Bookmark } from '../types/notes.types';

export const notesApi = {
  createNote: async (data: { lessonId: string; content: string; videoTimestampSeconds?: number }) => {
    const res = await axiosInstance.post<{ message: string; note: Note }>('/notes', data);
    return res.data.note;
  },

  updateNote: async (noteId: string, data: { content?: string }) => {
    const res = await axiosInstance.patch<{ message: string; note: Note }>(
      `/notes/${noteId}`,
      data
    );
    return res.data.note;
  },

  deleteNote: async (noteId: string) => {
    const res = await axiosInstance.delete<{ message: string }>(`/notes/${noteId}`);
    return res.data;
  },

  listNotes: async (params: { courseId?: string; lessonId?: string; search?: string; page?: number; limit?: number }) => {
    const res = await axiosInstance.get<{
      notes: Note[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/notes', { params });
    return res.data;
  },

  createBookmark: async (data: { lessonId: string; videoTimestampSeconds?: number; pdfPageNumber?: number }) => {
    const res = await axiosInstance.post<{ message: string; bookmark: Bookmark }>('/bookmarks', data);
    return res.data.bookmark;
  },

  deleteBookmark: async (bookmarkId: string) => {
    const res = await axiosInstance.delete<{ message: string }>(`/bookmarks/${bookmarkId}`);
    return res.data;
  },

  listBookmarks: async (params: { courseId?: string; lessonId?: string }) => {
    const res = await axiosInstance.get<{ bookmarks: Bookmark[] }>('/bookmarks', { params });
    return res.data.bookmarks;
  },
};
