export interface Note {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  courseId?: string;
  content: string;
  videoTimestampSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  courseId?: string;
  videoTimestampSeconds: number | null;
  pdfPageNumber: number | null;
  createdAt: string;
}
