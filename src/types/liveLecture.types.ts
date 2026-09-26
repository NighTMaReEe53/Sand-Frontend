export type LiveLectureStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface LiveLectureTeacher {
  id: string;
  fullName: string;
  photoUrl?: string | null;
  specialization?: string | null;
}

export interface LiveLectureCourse {
  id: string;
  title: string;
  subject?: string | null;
  thumbnailUrl?: string | null;
}

export interface LiveLecture {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  status: LiveLectureStatus;
  createdAt: string;
  course: LiveLectureCourse;
  teacher: LiveLectureTeacher;
  _count?: { attendances: number };
}

export interface JoinLiveLectureResponse {
  lobby: boolean;
  status: LiveLectureStatus;
  serverUrl?: string;
  roomName?: string;
  token?: string;
  identity?: string;
  role?: 'HOST' | 'AUDIENCE';
}

export interface AttendanceRow {
  id: string;
  studentUserId: string;
  studentName: string;
  photoUrl?: string | null;
  joinedAt: string;
  leftAt?: string | null;
  durationSeconds: number;
  isOnline: boolean;
}

export interface AttendanceResponse {
  totalStudents: number;
  attendances: AttendanceRow[];
}

export interface CreateLiveLecturePayload {
  courseId: string;
  title: string;
  description?: string;
  scheduledAt: string;
}

export interface UpdateLiveLecturePayload {
  title?: string;
  description?: string;
  scheduledAt?: string;
}
