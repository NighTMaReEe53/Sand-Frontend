import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePageVisible } from '../usePageVisible';
import { liveLecturesApi } from '../../api/liveLectures.api';
import {
  CreateLiveLecturePayload,
  JoinLiveLectureResponse,
  LiveLecture,
} from '../../types/liveLecture.types';

/** Detail — polls while SCHEDULED/LIVE so students see state flips without refresh. */
export const useLiveLectureQuery = (id?: string) => {
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['live-lecture', id],
    queryFn: () => liveLecturesApi.getById(id!),
    enabled: !!id,
    // من 8 ثوانٍ → 12، ومتوقف لما التبويب مش مرئي
    refetchInterval: (query) => {
      if (!visible) return false;
      const status = query.state.data?.status;
      return status === 'SCHEDULED' || status === 'LIVE' ? 12_000 : false;
    },
  });
};

export const useStudentUpcomingLecturesQuery = () => {
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['live-lectures', 'student', 'upcoming'],
    queryFn: () => liveLecturesApi.getStudentUpcoming(),
    // من 30 ثانية → 60، ومتوقف لما التبويب hidden
    refetchInterval: visible ? 60_000 : false,
    staleTime: 30_000,
  });
};

export const useTeacherUpcomingLecturesQuery = () => {
  const visible = usePageVisible();
  return useQuery({
    queryKey: ['live-lectures', 'teacher', 'upcoming'],
    queryFn: () => liveLecturesApi.getTeacherUpcoming(),
    // من 20 ثانية → 40، ومتوقف لما التبويب hidden
    refetchInterval: visible ? 40_000 : false,
    staleTime: 20_000,
  });
};

export const useTeacherHistoryLecturesQuery = () =>
  useQuery({
    queryKey: ['live-lectures', 'teacher', 'history'],
    queryFn: () => liveLecturesApi.getTeacherHistory(),
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>, id?: string) => {
  void qc.invalidateQueries({ queryKey: ['live-lecture', id] });
  void qc.invalidateQueries({ queryKey: ['live-lectures'] });
};

export const useCreateLiveLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLiveLecturePayload) => liveLecturesApi.create(payload),
    onSuccess: () => invalidate(qc),
  });
};

export const useUpdateLiveLectureMutation = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title?: string; description?: string; scheduledAt?: string }) =>
      liveLecturesApi.update(id, payload),
    onSuccess: () => invalidate(qc, id),
  });
};

export const useDeleteLiveLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveLecturesApi.remove(id),
    onSuccess: () => invalidate(qc),
  });
};

export const useStartLiveLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveLecturesApi.start(id),
    onSuccess: (_data, id) => invalidate(qc, id),
  });
};

export const useEndLiveLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveLecturesApi.end(id),
    onSuccess: (_data, id) => invalidate(qc, id),
  });
};

export const useCancelLiveLectureMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liveLecturesApi.cancel(id),
    onSuccess: (_data, id) => invalidate(qc, id),
  });
};

export const useJoinLiveLectureMutation = () =>
  useMutation({
    mutationFn: (id: string): Promise<JoinLiveLectureResponse> => liveLecturesApi.join(id),
  });

export const useAttendanceQuery = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: ['live-lecture-attendance', id],
    queryFn: () => liveLecturesApi.getAttendance(id),
    enabled,
  });

export const useTeacherControlsMutations = (lectureId: string) => {
  const qc = useQueryClient();
  return {
    muteParticipant: useMutation({
      mutationFn: (participantId: string) => liveLecturesApi.muteParticipant(lectureId, participantId),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['live-lecture-attendance', lectureId] }),
    }),
    removeParticipant: useMutation({
      mutationFn: (participantId: string) =>
        liveLecturesApi.removeParticipant(lectureId, participantId),
      onSuccess: () => void qc.invalidateQueries({ queryKey: ['live-lecture-attendance', lectureId] }),
    }),
    allowSpeaking: useMutation({
      mutationFn: (participantId: string) => liveLecturesApi.allowSpeaking(lectureId, participantId),
    }),
    publishPermission: useMutation({
      mutationFn: ({
        participantId,
        source,
        granted,
      }: {
        participantId: string;
        source: 'microphone' | 'camera' | 'screen';
        granted: boolean;
      }) => liveLecturesApi.publishPermission(lectureId, participantId, source, granted),
    }),
    muteAll: useMutation({
      mutationFn: () => liveLecturesApi.muteAll(lectureId),
    }),
  };
};
