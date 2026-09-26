import { axiosInstance } from './axiosInstance';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface LearningReminder {
  id: string;
  kind: 'LESSON' | 'QUIZ' | 'HOMEWORK' | 'EXAM' | 'LECTURE';
  title: string;
  body: string;
  linkUrl: string;
}

export const notificationsApi = {
  list: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const res = await axiosInstance.get<{
      notifications: Notification[];
      unreadCount: number;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>('/notifications', { params });
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await axiosInstance.get<{ unreadCount: number }>('/notifications/unread-count');
    return res.data.unreadCount;
  },

  getLearningReminders: async (): Promise<{ reminders: LearningReminder[] }> => {
    const res = await axiosInstance.get<{ reminders: LearningReminder[] }>('/notifications/reminders');
    return res.data;
  },

  markAsRead: async (id: string) => {
    await axiosInstance.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await axiosInstance.post('/notifications/read-all');
  },
};
