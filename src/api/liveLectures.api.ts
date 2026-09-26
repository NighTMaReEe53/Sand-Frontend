import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from './endpoints';
import {
  AttendanceResponse,
  CreateLiveLecturePayload,
  JoinLiveLectureResponse,
  LiveLecture,
  UpdateLiveLecturePayload,
} from '../types/liveLecture.types';

export const liveLecturesApi = {
  create: async (payload: CreateLiveLecturePayload) => {
    const res = await axiosInstance.post<LiveLecture>(ENDPOINTS.LIVE_LECTURES.CREATE, payload);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await axiosInstance.get<LiveLecture>(ENDPOINTS.LIVE_LECTURES.DETAIL(id));
    return res.data;
  },

  update: async (id: string, payload: UpdateLiveLecturePayload) => {
    const res = await axiosInstance.patch<LiveLecture>(ENDPOINTS.LIVE_LECTURES.UPDATE(id), payload);
    return res.data;
  },

  remove: async (id: string) => {
    const res = await axiosInstance.delete<{ message: string }>(ENDPOINTS.LIVE_LECTURES.DELETE(id));
    return res.data;
  },

  start: async (id: string) => {
    const res = await axiosInstance.post<LiveLecture>(ENDPOINTS.LIVE_LECTURES.START(id));
    return res.data;
  },

  end: async (id: string) => {
    const res = await axiosInstance.post<LiveLecture>(ENDPOINTS.LIVE_LECTURES.END(id));
    return res.data;
  },

  cancel: async (id: string) => {
    const res = await axiosInstance.post<LiveLecture>(ENDPOINTS.LIVE_LECTURES.CANCEL(id));
    return res.data;
  },

  join: async (id: string) => {
    const res = await axiosInstance.post<JoinLiveLectureResponse>(ENDPOINTS.LIVE_LECTURES.JOIN(id));
    return res.data;
  },

  getStudentUpcoming: async () => {
    const res = await axiosInstance.get<LiveLecture[]>(ENDPOINTS.LIVE_LECTURES.STUDENT_UPCOMING);
    return res.data;
  },

  getTeacherUpcoming: async () => {
    const res = await axiosInstance.get<LiveLecture[]>(ENDPOINTS.LIVE_LECTURES.TEACHER_UPCOMING);
    return res.data;
  },

  getTeacherHistory: async () => {
    const res = await axiosInstance.get<LiveLecture[]>(ENDPOINTS.LIVE_LECTURES.TEACHER_HISTORY);
    return res.data;
  },

  getAttendance: async (id: string) => {
    const res = await axiosInstance.get<AttendanceResponse>(ENDPOINTS.LIVE_LECTURES.ATTENDANCE(id));
    return res.data;
  },

  attendanceJoin: async (id: string) => {
    const res = await axiosInstance.post(ENDPOINTS.LIVE_LECTURES.ATTENDANCE_JOIN(id));
    return res.data;
  },

  attendanceLeave: async (id: string) => {
    const res = await axiosInstance.post(ENDPOINTS.LIVE_LECTURES.ATTENDANCE_LEAVE(id));
    return res.data;
  },

  muteParticipant: async (id: string, participantId: string) => {
    const res = await axiosInstance.post(ENDPOINTS.LIVE_LECTURES.MUTE_PARTICIPANT(id, participantId));
    return res.data;
  },

  removeParticipant: async (id: string, participantId: string) => {
    const res = await axiosInstance.post(ENDPOINTS.LIVE_LECTURES.REMOVE_PARTICIPANT(id, participantId));
    return res.data;
  },

  allowSpeaking: async (id: string, participantId: string) => {
    const res = await axiosInstance.post(ENDPOINTS.LIVE_LECTURES.ALLOW_SPEAKING(id, participantId));
    return res.data;
  },

  publishPermission: async (
    id: string,
    participantId: string,
    source: 'microphone' | 'camera' | 'screen',
    granted: boolean,
  ) => {
    const res = await axiosInstance.post(ENDPOINTS.LIVE_LECTURES.PUBLISH_PERMISSION(id, participantId), {
      source,
      granted,
    });
    return res.data;
  },

  muteAll: async (id: string) => {
    const res = await axiosInstance.post(ENDPOINTS.LIVE_LECTURES.MUTE_ALL(id));
    return res.data;
  },
};
