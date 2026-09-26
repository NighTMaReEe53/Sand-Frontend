import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from 'livekit-client';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Hand,
  Loader2,
  LogOut,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  MonitorUp,
  Radio,
  SendHorizontal,
  Sparkles,
  Users,
  Video as VideoIcon,
  VideoOff,
  WifiOff,
  X,
} from 'lucide-react';
import {
  useEndLiveLectureMutation,
  useJoinLiveLectureMutation,
  useLiveLectureQuery,
  useTeacherControlsMutations,
} from '../../hooks/queries/useLiveLectures';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/PageLoader';
import { motion } from 'framer-motion';
import {
  BookStackSvg,
  PencilSvg,
  CurvedArrowSvg,
  DotsPatternSvg,
  CapDoodleSvg,
  ShapesClusterSvg,
  Float,
} from '../../components/ui/Doodles';
import { toast } from 'sonner';
import { liveLecturesApi } from '../../api/liveLectures.api';

type ChatMessage = { id: string; identity?: string; name: string; text: string; ts: number; kind?: 'chat' | 'hand' };

/** livekit protocol TrackSource enum values (numeric on the wire) */
const TRACK_SOURCE = { CAMERA: 1, MICROPHONE: 2, SCREEN_SHARE: 3 } as const;

const uid = () => Math.random().toString(36).slice(2);

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    numberingSystem: 'latn',
  });

export const LiveRoomPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userRole = useAuthStore((s) => s.user?.role);
  const isTeacher = userRole === 'TEACHER' || userRole === 'ADMIN';

  // ─── Server/DB state (React Query) ─────────────────────────────
  const { data: lecture } = useLiveLectureQuery(id);
  const endMutation = useEndLiveLectureMutation();
  const controls = useTeacherControlsMutations(id);

  // ─── LiveKit state ──────────────────────────────────────────────
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  >('idle');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  /** microphone publish permission (granted by teacher for students) */
  const [canSpeak, setCanSpeak] = useState(isTeacher);
  const [camAllowed, setCamAllowed] = useState(isTeacher);
  const [shareAllowed, setShareAllowed] = useState(isTeacher);
  const [activeSpeakerIdentity, setActiveSpeakerIdentity] = useState<string | null>(null);
  /** teacher-only queue of raised hands: identity → student name */
  const [raisedHands, setRaisedHands] = useState<Map<string, string>>(new Map());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'people'>('chat');
  const [nowTick, setNowTick] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsChatOpen, setFsChatOpen] = useState(true);
  /** set when the lecture is ended/cancelled server-side → stylish goodbye screen */
  const [forceEnded, setForceEnded] = useState(false);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const fsChatInputRef = useRef<HTMLInputElement>(null);
  const fsChatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  /** remote camera PiP shown while a screen share occupies the stage */
  const remoteCamPipRef = useRef<HTMLVideoElement>(null);
  const sharingRef = useRef(false);
  /** lets toggleShare re-run stage selection outside the media effect */
  const stageUpdaterRef = useRef<(() => void) | null>(null);

  const myName =
    useAuthStore.getState().user?.teacherProfile?.fullName ||
    useAuthStore.getState().user?.studentProfile?.fullName ||
    'مستخدم';

  /** live mirror of lecture status so event handlers don't capture stale state */
  const lectureStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    lectureStatusRef.current = lecture?.status;
  }, [lecture?.status]);

  // Teacher ended/cancelled the lecture → leave gracefully and show the goodbye screen
  useEffect(() => {
    if (
      (lecture?.status === 'ENDED' || lecture?.status === 'CANCELLED') &&
      connectionState === 'connected'
    ) {
      setForceEnded(true);
      roomRef.current?.disconnect();
    }
  }, [lecture?.status, connectionState]);

  useEffect(() => {
    let room: Room | null = null;
    let cancelled = false;

    const connect = async () => {
      try {
        setConnectionState('connecting');
        const res = await liveLecturesApi.join(id);
        if (res.lobby || !res.token || !res.serverUrl) {
          navigate(`/live-lectures/${id}`, { replace: true });
          return;
        }
        if (cancelled) return;

        setCanSpeak(res.role === 'HOST');
        room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.Connected, () => {
          setConnectionState('connected');
          setParticipants(Array.from(room!.remoteParticipants.values()));
          if (!isTeacher) void liveLecturesApi.attendanceJoin(id).catch(() => undefined);
        });
        room.on(RoomEvent.Reconnecting, () => setConnectionState('reconnecting'));
        room.on(RoomEvent.Reconnected, () => setConnectionState('connected'));
        room.on(RoomEvent.Disconnected, () => {
          setConnectionState('disconnected');
          const st = lectureStatusRef.current;
          if (st === 'ENDED' || st === 'CANCELLED') setForceEnded(true);
          if (!isTeacher) void liveLecturesApi.attendanceLeave(id).catch(() => undefined);
        });
        room.on(RoomEvent.ParticipantConnected, () =>
          setParticipants(Array.from(room!.remoteParticipants.values())),
        );
        room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
          setParticipants(Array.from(room!.remoteParticipants.values()));
          setRaisedHands((prev) => {
            if (!prev.has(p.identity)) return prev;
            const next = new Map(prev);
            next.delete(p.identity);
            return next;
          });
        });
        room.on(RoomEvent.TrackMuted, () =>
          setParticipants(Array.from(room!.remoteParticipants.values())),
        );
        room.on(RoomEvent.TrackUnmuted, () =>
          setParticipants(Array.from(room!.remoteParticipants.values())),
        );
        room.on(
          RoomEvent.ParticipantPermissionsChanged,
          (_prev: unknown, p: Participant) => {
            if (p === room!.localParticipant) {
              const perms = p.permissions;
              // Empty/missing canPublishSources = ALL sources allowed (host token)
              const src = perms?.canPublishSources;
              const allAllowed = !src || src.length === 0;
              const hasSource = (s: number) => allAllowed || src!.includes(s as never);
              const canPub = Boolean(perms?.canPublish);
              // Each source is evaluated independently — granting the camera
              // must never affect the microphone and vice-versa.
              const micNow = canPub && hasSource(TRACK_SOURCE.MICROPHONE);
              const camNow = isTeacher ? true : canPub && hasSource(TRACK_SOURCE.CAMERA);
              const shareNow = isTeacher ? true : canPub && hasSource(TRACK_SOURCE.SCREEN_SHARE);

              setCanSpeak((prevMic) => {
                if (!isTeacher && micNow && !prevMic) toast.success('المعلم سمح لك بالتكلم');
                return micNow;
              });
              setCamAllowed((prevCam) => {
                if (!isTeacher && camNow && !prevCam) toast.success('المعلم سمح لك بالكاميرا');
                return camNow;
              });
              setShareAllowed((prevShare) => {
                if (!isTeacher && shareNow && !prevShare) toast.success('المعلم سمح لك بمشاركة شاشتك');
                return shareNow;
              });

              if (isTeacher) {
                setParticipants(Array.from(room!.remoteParticipants.values()));
                return;
              }

              const lp = room!.localParticipant;
              // Revoke ONLY the source that was taken away — never touch the others
              if (!micNow && lp.isMicrophoneEnabled) {
                setMicOn(false);
                void lp.setMicrophoneEnabled(false).catch(() => undefined);
                toast.info('المعلم أوقف الميكروفون');
              }
              if (!camNow && lp.isCameraEnabled) {
                setCamOn(false);
                void lp.setCameraEnabled(false).catch(() => undefined);
                toast.info('المعلم أوقف الكاميرا');
              }
              if (!shareNow && sharingRef.current) {
                sharingRef.current = false;
                setSharing(false);
                void lp.setScreenShareEnabled(false).catch(() => undefined);
                toast.info('المعلم أوقف مشاركة الشاشة');
              }
            }
            setParticipants(Array.from(room!.remoteParticipants.values()));
          },
        );
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
          setActiveSpeakerIdentity(speakers.length ? speakers[0].identity : null);
        });
        room.on(RoomEvent.DataReceived, (_payload: Uint8Array, participant?: RemoteParticipant) => {
          try {
            const text = new TextDecoder().decode(_payload);
            const msg = JSON.parse(text) as ChatMessage & { type?: string };
            if (msg.type === 'chat') {
              setMessages((prev) => [...prev.slice(-199), { ...msg, id: msg.id ?? uid() }]);
              if (activeTab !== 'chat') setUnreadCount((c) => c + 1);
            } else if (msg.type === 'hand' && isTeacher && participant) {
              setRaisedHands((prev) => {
                const next = new Map(prev);
                next.set(participant.identity, msg.name || 'طالب');
                return next;
              });
              toast(`${msg.name || 'طالب'} رفع يده`);
            }
          } catch {
            /* ignore malformed */
          }
        });

        await room.connect(res.serverUrl, res.token);
      } catch (err: any) {
        if (cancelled) return;
        setConnectError(err?.response?.data?.message || 'تعذر الاتصال بغرفة البث.');
        setConnectionState('error');
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (roomRef.current) {
        if (!isTeacher) void liveLecturesApi.attendanceLeave(id).catch(() => undefined);
        void roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Attach remote tracks: audio → hidden <audio> elements, video → stage (screen share wins) + camera PiP
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;

    /** Some browsers block autoplay — retry play() on the first user gesture. */
    const tryPlay = (el: HTMLMediaElement) => {
      el.play().catch(() => {
        const resume = () => {
          el.play().catch(() => undefined);
          document.removeEventListener('click', resume);
          document.removeEventListener('keydown', resume);
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('keydown', resume, { once: true });
      });
    };

    /** One element PER TRACK so mic and screen-share audio never overwrite each other. */
    const ensureAudioEl = (key: string): HTMLAudioElement => {
      let el = audioElsRef.current.get(key);
      if (!el) {
        el = document.createElement('audio');
        el.autoplay = true;
        el.dataset.identity = key;
        document.body.appendChild(el);
        audioElsRef.current.set(key, el);
      }
      return el;
    };

    const updateStage = () => {
      let sharePub: RemoteTrackPublication | null = null;
      let camPub: RemoteTrackPublication | null = null;
      for (const p of Array.from(room.remoteParticipants.values())) {
        for (const pub of p.trackPublications.values()) {
          if (!pub.isSubscribed || !pub.videoTrack) continue;
          if (pub.source === Track.Source.ScreenShare) {
            sharePub = pub;
          } else if (!camPub) {
            camPub = pub;
          }
        }
      }

      const stage = remoteVideoRef.current;
      // Priority 1: teacher's own live local screen share preview
      const localShare =
        sharingRef.current
          ? roomRef.current?.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.videoTrack
          : undefined;
      if (stage) {
        if (localShare) {
          localShare.attach(stage);
        } else {
          const mainTrack = sharePub?.videoTrack ?? camPub?.videoTrack;
          if (mainTrack) mainTrack.attach(stage);
        }
      }
      // Remote camera PiP while a remote share occupies the stage
      const pip = remoteCamPipRef.current;
      if (pip && !localShare) {
        const pipTrack = sharePub ? camPub?.videoTrack : null;
        if (pipTrack) {
          pipTrack.attach(pip);
          pip.style.display = '';
        } else {
          pip.style.display = 'none';
        }
      }
    };
    stageUpdaterRef.current = updateStage;

    const syncTracks = () => {
      if (!roomRef.current) return;
      const activeKeys = new Set<string>();

      for (const p of Array.from(room.remoteParticipants.values())) {
        for (const pub of p.trackPublications.values()) {
          if (!pub.isSubscribed) continue;
          if (pub.audioTrack) {
            const key = `${p.identity}:${pub.trackSid}`;
            const el = ensureAudioEl(key);
            try {
              pub.audioTrack.attach(el);
              activeKeys.add(key);
              tryPlay(el);
            } catch {
              /* ignore */
            }
          }
        }
      }

      for (const [key, el] of audioElsRef.current) {
        if (!activeKeys.has(key)) {
          el.remove();
          audioElsRef.current.delete(key);
        }
      }

      updateStage();
    };

    syncTracks();
    room.on(RoomEvent.TrackSubscribed, syncTracks);
    room.on(RoomEvent.TrackUnsubscribed, syncTracks);
    room.on(RoomEvent.ParticipantDisconnected, syncTracks);
    room.on(RoomEvent.TrackMuted, syncTracks);
    room.on(RoomEvent.TrackUnmuted, syncTracks);
    return () => {
      room.off(RoomEvent.TrackSubscribed, syncTracks);
      room.off(RoomEvent.TrackUnsubscribed, syncTracks);
      room.off(RoomEvent.ParticipantDisconnected, syncTracks);
      room.off(RoomEvent.TrackMuted, syncTracks);
      room.off(RoomEvent.TrackUnmuted, syncTracks);
      for (const [, el] of audioElsRef.current) el.remove();
      audioElsRef.current.clear();
      stageUpdaterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants]);

  // Auto-scroll chat (sidebar + fullscreen overlay) to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    fsChatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Fullscreen state sync
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Live duration ticker
  useEffect(() => {
    if (connectionState !== 'connected') return;
    const t = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, [connectionState]);

  // ─── Local controls ─────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !canSpeak) return;
    const enabled = !room.localParticipant.isMicrophoneEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(enabled);
    } catch {
      toast.error('تعذر تشغيل الميكروفون — تأكد من صلاحيات المتصفح');
    } finally {
      setMicOn(room.localParticipant.isMicrophoneEnabled);
    }
  }, [canSpeak]);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    // Students need explicit camera permission from the teacher
    if (!room || (!isTeacher && !camAllowed)) return;
    const enabled = !camOn;
    try {
      await room.localParticipant.setCameraEnabled(enabled);
    } catch {
      toast.error('تعذر تشغيل الكاميرا — تأكد من صلاحيات المتصفح');
    } finally {
      setCamOn(room.localParticipant.isCameraEnabled);
      setTimeout(() => {
        const track = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
        if (track && localVideoRef.current) track.attach(localVideoRef.current);
      }, 300);
    }
  }, [isTeacher, camAllowed, canSpeak, camOn]);

  const toggleShare = useCallback(async () => {
    const room = roomRef.current;
    // Students need explicit screen-share permission from the teacher
    if (!room || (!isTeacher && !shareAllowed)) return;
    const next = !sharing;
    setSharing(next);
    sharingRef.current = next;
    try {
      // audio: true → capture tab/system sound along with the video
      await room.localParticipant.setScreenShareEnabled(next, { audio: true });
    } catch {
      toast.error('تعذر مشاركة الشاشة');
      setSharing(!next);
      sharingRef.current = !next;
    } finally {
      // Re-select what shows on the stage (share vs camera)
      setTimeout(() => stageUpdaterRef.current?.(), 300);
    }
  }, [isTeacher, shareAllowed, sharing]);

  const raiseHand = useCallback(() => {
    const room = roomRef.current;
    if (!room || handRaised) return;
    setHandRaised(true);
    const payload: ChatMessage & { type: string } = {
      type: 'hand',
      id: uid(),
      identity: useAuthStore.getState().user?.id,
      name: useAuthStore.getState().user?.studentProfile?.fullName || 'طالب',
      text: '',
      ts: Date.now(),
    };
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), {
      reliable: true,
    });
    setTimeout(() => setHandRaised(false), 15000);
  }, [handRaised]);

  const allowSpeaking = useCallback(
    (identity: string) => {
      controls.allowSpeaking.mutate(identity, {
        onSuccess: () => {
          setRaisedHands((prev) => {
            if (!prev.has(identity)) return prev;
            const next = new Map(prev);
            next.delete(identity);
            return next;
          });
          toast.success('تم السماح للطالب بالتكلم');
        },
        onError: () => toast.error('تعذر تنفيذ الطلب'),
      });
    },
    [controls.allowSpeaking],
  );

  /** Grant/revoke a single publish source for a participant (teacher control). */
  const togglePublish = useCallback(
    (identity: string, source: 'microphone' | 'camera' | 'screen', granted: boolean) => {
      controls.publishPermission.mutate(
        { participantId: identity, source, granted },
        {
          onSuccess: () => toast.success(granted ? 'تم منح الإذن ✅' : 'تم سحب الإذن'),
          onError: () => toast.error('تعذر تنفيذ الطلب'),
        },
      );
    },
    [controls.publishPermission],
  );

  const sendChatFrom = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    const room = roomRef.current;
    const input = inputRef.current;
    if (!room || !input?.value.trim()) return;
    const payload: ChatMessage & { type: string } = {
      type: 'chat',
      id: uid(),
      identity: useAuthStore.getState().user?.id,
      name: myName,
      text: input.value.trim(),
      ts: Date.now(),
    };
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), {
      reliable: true,
    });
    setMessages((prev) => [...prev.slice(-199), payload]);
    input.value = '';
  };

  const leave = useCallback(async () => {
    if (!isTeacher && connectionState === 'connected') {
      await liveLecturesApi.attendanceLeave(id).catch(() => undefined);
    }
    roomRef.current?.disconnect();
    navigate(isTeacher ? '/dashboard/live-lectures' : `/live-lectures/${id}`);
  }, [connectionState, id, isTeacher, navigate]);

  const durationLabel = useMemo(() => {
    if (!lecture?.startedAt) return '';
    const start = new Date(lecture.startedAt).getTime();
    // Prefer the server's endedAt; fall back to the live ticker while streaming
    const end = lecture.endedAt
      ? new Date(lecture.endedAt).getTime()
      : connectionState === 'connected'
        ? nowTick
        : null;
    if (!end) return '';
    const mins = Math.max(0, Math.floor((end - start) / 60000));
    if (mins < 1) return 'أقل من دقيقة';
    return mins >= 60 ? `${Math.floor(mins / 60)} س ${mins % 60} د` : `${mins} دقيقة`;
  }, [connectionState, lecture?.startedAt, lecture?.endedAt, nowTick]);

  const stageSpeaking = activeSpeakerIdentity && participants.some((p) => p.identity === activeSpeakerIdentity);
  const meSpeaking = Boolean(micOn && roomRef.current && activeSpeakerIdentity === roomRef.current.localParticipant.identity);

  const toggleFullscreen = useCallback(() => {
    const el = stageShellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      setFsChatOpen(true);
    } else {
      void el.requestFullscreen?.().then(() => setFsChatOpen(true)).catch(() => toast.error('المتصفح لا يدعم ملء الشاشة'));
    }
  }, []);

  /**
   * Circular control with a fixed color identity per function:
   * emerald = mic · sky = camera · violet = screen share · slate = misc.
   * Solid vivid fill when ON; tinted glass when OFF.
   * Dark skin in normal view, light skin while fullscreen (over bright content).
   */
  const ctl = (tone: 'emerald' | 'sky' | 'violet' | 'slate', active: boolean, disabled = false) => {
    const tones = {
      emerald: {
        on: 'bg-emerald-500 border-emerald-300 text-white shadow-[0_0_24px_-2px_rgba(52,211,153,0.85)] hover:bg-emerald-400',
        offDark: 'bg-black/70 border-emerald-400/50 text-white hover:bg-black',
        offLight: 'bg-white/85 border-emerald-500/60 text-black hover:bg-white',
      },
      sky: {
        on: 'bg-sky-500 border-sky-300 text-white shadow-[0_0_24px_-2px_rgba(56,189,248,0.85)] hover:bg-sky-400',
        offDark: 'bg-black/70 border-sky-400/50 text-white hover:bg-black',
        offLight: 'bg-white/85 border-sky-500/60 text-black hover:bg-white',
      },
      violet: {
        on: 'bg-violet-500 border-violet-300 text-white shadow-[0_0_24px_-2px_rgba(167,139,250,0.85)] hover:bg-violet-400',
        offDark: 'bg-black/70 border-violet-400/50 text-white hover:bg-black',
        offLight: 'bg-white/85 border-violet-500/60 text-black hover:bg-white',
      },
      slate: {
        on: 'bg-slate-600 border-slate-300 text-white hover:bg-slate-500',
        offDark: 'bg-black/70 border-white/30 text-white hover:bg-black',
        offLight: 'bg-white/85 border-white text-black hover:bg-white',
      },
    } as const;
    const t = tones[tone];
    return `relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 active:scale-95 ${
      disabled ? 'opacity-40 cursor-not-allowed saturate-50' : ''
    } ${active ? t.on : isFullscreen ? t.offLight : t.offDark} ${
      active && !disabled ? 'ring-2 ' + (isFullscreen ? 'ring-black/30' : 'ring-white/60') : ''
    }`;
  };

  /** Shared chat body — used by the normal sidebar and the fullscreen overlay. */
  const renderChat = (
    inputRef: React.RefObject<HTMLInputElement | null>,
    bottomRef: React.RefObject<HTMLDivElement | null>,
    compact = false,
  ) => {
    const myId = useAuthStore.getState().user?.id;
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <div className="pt-12 pb-6 text-center space-y-3">
              <div className="mx-auto flex w-14 h-14 items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/25">
                <MessageSquare className="w-6 h-6 text-gold-400" />
              </div>
              <p className="text-xs font-bold text-ivory">لا توجد رسائل بعد</p>
              <p className="text-[11px] text-ivory-muted">كن أول من يشارك في المحادثة</p>
            </div>
          )}
          {messages.map((m, i) => {
            const mine = m.identity ? m.identity === myId : m.name === myName;
            const prev = messages[i - 1];
            const prevMine = prev ? (prev.identity ? prev.identity === myId : prev.name === myName) : null;
            const grouped = Boolean(prev && prevMine === mine && m.ts - prev.ts < 120000);
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <span
                  className={`flex w-7 h-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border ${
                    grouped ? 'invisible' : ''
                  } ${
                    mine
                      ? 'bg-gold-500/20 border-gold-500/40 text-gold-300'
                      : 'bg-surface-cardHover border-surface-borderLight text-ivory-muted'
                  }`}
                >
                  {(mine ? myName : m.name).slice(0, 1)}
                </span>

                <div className={`flex flex-col max-w-[78%] ${mine ? 'items-start' : 'items-end'}`}>
                  {!grouped && (
                    <div className={`flex items-center gap-2 px-1 pb-0.5 ${mine ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-[10px] font-bold ${mine ? 'text-gold-300' : 'text-ivory-muted'}`}>
                        {mine ? 'أنت' : m.name}
                      </span>
                      <span className="text-[9px] text-ivory-dark">{formatTime(m.ts)}</span>
                    </div>
                  )}
                  <p
                    className={`text-xs leading-relaxed break-words px-3.5 py-2 shadow-card-dark ${
                      mine
                        ? 'bg-gradient-to-br from-gold-600/40 to-gold-800/30 border border-gold-500/35 text-white rounded-2xl rounded-tl-md'
                        : compact
                          ? 'bg-white/10 border border-white/15 text-white rounded-2xl rounded-tr-md'
                          : 'bg-surface-cardHover border border-surface-border text-ivory rounded-2xl rounded-tr-md'
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form
          className={compact ? 'p-2.5 border-t border-white/10 flex gap-2' : 'p-2.5 border-t border-surface-border flex gap-2'}
          onSubmit={(e) => {
            e.preventDefault();
            sendChatFrom(inputRef);
          }}
        >
          <input
            ref={inputRef}
            placeholder="اكتب رسالة…"
            className={`flex-1 h-10 rounded-full px-4 text-xs outline-none transition-all placeholder:text-ivory-dark text-white ${
              compact
                ? 'bg-white/10 border border-white/15 focus:border-gold-500/60 focus:bg-white/15'
                : 'bg-bg-elevated border border-surface-border focus:border-gold-500/60 focus:bg-bg'
            }`}
          />
          <button
            type="submit"
            title="إرسال"
            className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:brightness-110 hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <SendHorizontal className="w-5 h-5 -scale-x-100" />
          </button>
        </form>
      </div>
    );
  };

  // ─── Full-screen states ─────────────────────────────────────────

  if (connectionState === 'connecting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-gradient">
        <PageLoader label="جاري الاتصال بغرفة المحاضرة…" />
        {lecture?.title && (
          <p className="-mt-8 text-xs text-ivory-muted">{lecture.title}</p>
        )}
      </div>
    );
  }

  if (connectionState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-dark-gradient">
        <div className="max-w-md w-full text-center space-y-4 rounded-3xl border border-red-500/20 bg-surface-card p-8 shadow-card-dark-lg">
          <span className="mx-auto flex w-16 h-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/25">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </span>
          <h2 className="font-bold text-ivory font-display">تعذر الدخول للغرفة</h2>
          <p className="text-xs text-ivory-muted leading-relaxed">{connectError}</p>
          <Link to={`/live-lectures/${id}`} className="block pt-2">
            <Button variant="outline" className="w-full">رجوع لصفحة المحاضرة</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (connectionState === 'disconnected') {
    const cancelled = forceEnded && lecture?.status === 'CANCELLED';
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden bg-dark-gradient" dir="rtl">
        {/* ─── Ambient background: gradient blobs ─── */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold-500/12 blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-violet-500/8 blur-3xl" />
        </div>

        {/* ─── Floating study doodles (books, pens, arrows) ─── */}
        <Float className="top-8 right-[6%] w-32 sm:w-44 opacity-70 hidden sm:block" duration={6.5}>
          <BookStackSvg />
        </Float>
        <Float className="top-10 left-[7%] w-20 sm:w-28 opacity-60 hidden sm:block" delay={0.6} duration={5.5}>
          <PencilSvg />
        </Float>
        <Float className="bottom-16 left-[10%] w-28 opacity-60 hidden md:block" delay={1.2} duration={6}>
          <CurvedArrowSvg />
        </Float>
        <Float className="bottom-24 right-[12%] w-20 opacity-55 hidden md:block" delay={1.8} duration={5}>
          <CapDoodleSvg />
        </Float>
        <DotsPatternSvg className="pointer-events-none absolute top-6 left-[38%] w-24 opacity-30 hidden lg:block" />
        <ShapesClusterSvg className="pointer-events-none absolute bottom-8 right-[38%] w-24 opacity-35 hidden lg:block" />

        {/* hand-drawn swoosh lines */}
        <svg className="pointer-events-none absolute top-1/4 -left-10 w-72 h-72 text-gold-500/15 hidden xl:block" viewBox="0 0 200 200" fill="none" aria-hidden>
          <path d="M0 160 Q 60 80 130 110 T 220 60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M0 190 Q 70 115 140 145 T 230 95" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>

        {/* ─── Goodbye card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative z-10 max-w-lg w-full text-center space-y-6 rounded-[2rem] border border-white/10 bg-surface-card/80 backdrop-blur-xl p-9 sm:p-11 shadow-card-dark-lg"
        >
          {/* Cap medallion with animated rings */}
          <div className="relative mx-auto w-28 h-28">
            <span className="absolute inset-0 rounded-full bg-gold-500/15 animate-ping opacity-30" style={{ animationDuration: '2.4s' }} />
            <span className="absolute -inset-3 rounded-full border-2 border-dashed border-gold-500/30 rotate-45" />
            <motion.span
              initial={{ rotate: -18, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.45, delay: 0.25 }}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 shadow-gold-glow-lg"
            >
              <GraduationCap className="w-14 h-14 text-black" strokeWidth={1.6} />
            </motion.span>
            {/* Confetti sparks */}
            <Sparkles className="absolute -top-2 -right-3 w-6 h-6 text-gold-300 animate-pulse" />
            <span className="absolute top-6 -left-4 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="absolute -bottom-1 right-10 w-2 h-2 rounded-full bg-sky-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-l from-gold-300 via-gold-400 to-gold-600">
              {cancelled ? 'تم إلغاء المحاضرة' : 'انتهت المحاضرة'}
            </h1>
            <p className="text-sm text-ivory font-medium">شكراً لحضورك ومشاركتك</p>
            <p className="text-xs text-ivory-muted leading-relaxed max-w-xs mx-auto">
              {lecture?.title
                ? `«${lecture.title}»`
                : 'نتمنى لك توفيقاً في دراستك — نراك في المحاضرة القادمة'}
            </p>
          </div>

          {/* Stats chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {durationLabel && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-ivory-muted bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                <Radio className="w-3 h-3 text-red-400" />
                مدة البث: {durationLabel}
              </span>
            )}
            {!cancelled && (
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1.5">
                <CheckCircle2 className="w-3 h-3" />
                تم تسجيل حضورك تلقائياً
              </span>
            )}
          </div>

          {/* Action buttons — solid backgrounds */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
            <Link to={isTeacher ? '/dashboard/live-lectures' : `/live-lectures/${id}`} className="flex-1">
              <Button className="w-full rounded-2xl bg-gradient-to-l from-primary via-primary-strong to-secondary text-white font-bold shadow-md hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                {isTeacher ? 'العودة للوحة المحاضرات' : 'صفحة المحاضرة'}
              </Button>
            </Link>
            {isTeacher ? (
              <Link to="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full rounded-2xl bg-white/5 border border-white/15 text-ivory hover:bg-white/10 hover:border-gold-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  لوحة التحكم
                </Button>
              </Link>
            ) : (
              <Link to="/my-courses" className="flex-1">
                <Button variant="outline" className="w-full rounded-2xl bg-white/5 border border-white/15 text-ivory hover:bg-white/10 hover:border-gold-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  كورساتي
                </Button>
              </Link>
            )}
          </div>

          {/* mini arrow pointing at CTA */}
          <div className="flex items-center justify-center gap-1.5 text-gold-500/50 pt-0.5">
            <CurvedArrowSvg className="w-14 opacity-70 scale-x-[-1]" />
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main room UI ───────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-bg-subtle text-ivory" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 bg-surface/90 border-b border-surface-border shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {lecture?.status === 'LIVE' ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-1 shrink-0">
              <Radio className="w-3 h-3 animate-pulse" />
              مباشر{durationLabel && ` • ${durationLabel}`}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1 shrink-0">
              {lecture?.status === 'ENDED' ? 'انتهت المحاضرة' : 'لم تبدأ بعد'}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate font-display leading-tight">{lecture?.title ?? 'غرفة المحاضرة'}</h1>
            <p className="text-[11px] text-ivory-muted truncate">{lecture?.course.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isTeacher ? (
            <>
              <button
                type="button"
                onClick={() => controls.muteAll.mutate()}
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-ivory-muted hover:text-ivory hover:bg-white/10 transition-colors"
              >
                <MicOff className="w-3.5 h-3.5" />
                كتم الجميع
              </button>
              <button
                type="button"
                onClick={() => endMutation.mutate(id, { onSuccess: () => leave() })}
                disabled={endMutation.isPending}
                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/35 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-40"
              >
                {endMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                إنهاء المحاضرة
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void leave()}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-ivory-muted hover:text-red-400 hover:border-red-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              خروج
            </button>
          )}
        </div>
      </header>

      {/* Reconnecting strip */}
      {connectionState === 'reconnecting' && (
        <div className="flex items-center justify-center gap-2 bg-amber-500/15 text-amber-400 text-xs py-1.5 px-4 shrink-0">
          <WifiOff className="w-3.5 h-3.5" />
          الاتصال ضعيف — جاري إعادة الاتصال تلقائياً…
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex min-h-0 flex-col lg:flex-row-reverse">
        {/* Stage */}
        <main className="flex-1 min-h-0 p-2 sm:p-3 flex items-stretch">
          <div
            ref={stageShellRef}
            className={`relative w-full h-full rounded-2xl overflow-hidden bg-black border transition-all duration-300 ${
              stageSpeaking ? 'border-gold-500/60 shadow-gold-glow-lg' : 'border-surface-border'
            } ${isFullscreen ? '!rounded-none' : ''}`}
          >
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />

            {/* Remote camera thumbnail while their screen share fills the stage */}
            <video
              ref={remoteCamPipRef}
              autoPlay
              playsInline
              style={{ display: 'none' }}
              className="absolute bottom-4 right-4 w-36 sm:w-44 aspect-video object-cover rounded-xl border-2 border-gold-500/40 shadow-card-dark-lg bg-black"
            />

            {/* Elegant empty state */}
            {participants.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
                <div className="relative flex w-24 h-24 items-center justify-center rounded-full bg-surface-card border border-gold-500/20 shadow-gold-glow">
                  <VideoIcon className="w-10 h-10 text-gold-500/70" />
                  <span className="absolute inset-0 rounded-full border-2 border-gold-500/30 animate-ping opacity-40" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-ivory">{lecture?.teacher.fullName || 'المعلم'} لم يشارك الكاميرا بعد</p>
                  <p className="text-xs text-ivory-muted">ستظهر الصورة هنا فور بدء البث — يمكنك الاستماع والمشاركة في المحادثة</p>
                </div>
              </div>
            )}

            {/* Teacher name badge + fullscreen toggle */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {participants.length > 0 && (
                <span className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 border border-white/10">
                  <span className={`w-2 h-2 rounded-full ${stageSpeaking ? 'bg-gold-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <span className="text-[11px] font-bold text-white">{lecture?.teacher.fullName || 'المعلم'}</span>
                  <Mic className="w-3 h-3 text-white" />
                </span>
              )}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
                className="flex w-9 h-9 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 hover:border-white/30 transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Student self-view PiP */}
            {camOn && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 left-4 w-36 sm:w-44 aspect-video object-cover rounded-xl border-2 border-gold-500/40 shadow-card-dark-lg bg-black"
              />
            )}

            {/* Listen-only chip */}
            {!isTeacher && (
              <div
                className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-[10px] font-bold transition-colors ${
                  canSpeak
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                    : 'bg-black/60 border-white/10 text-ivory-muted'
                }`}
              >
                {canSpeak ? (
                  <>
                    <Mic className="w-3 h-3" />
                    يسمح لك بالتكلم
                  </>
                ) : (
                  'وضع الاستماع فقط'
                )}
              </div>
            )}

            {/* ─── Fullscreen overlay UI ─────────────────────────── */}
            {isFullscreen && (
              <>
                {/* Translucent chat sidebar floating over the video */}
                <div
                  className={`absolute inset-y-0 right-0 w-72 sm:w-80 flex flex-col bg-black/45 border-l border-white/10 transition-transform duration-300 ${
                    fsChatOpen ? 'translate-x-0' : 'translate-x-full'
                  }`}
                >
                  <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/10">
                    <span className="flex items-center gap-2 text-xs font-bold text-white">
                      <MessageSquare className="w-4 h-4 text-gold-300" />
                      المحادثة المباشرة
                    </span>
                    <button
                      type="button"
                      onClick={() => setFsChatOpen(false)}
                      title="إخفاء المحادثة"
                      className="flex w-7 h-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {renderChat(fsChatInputRef, fsChatBottomRef, true)}
                </div>

                {/* Floating mini control pill */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/55 border border-white/15 px-3 py-2 shadow-card-dark-lg">
                  <button type="button" onClick={() => void toggleMic()} disabled={!canSpeak} title="الميكروفون" className={ctl('emerald', micOn, !canSpeak)}>
                    {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleCam()}
                    disabled={!isTeacher && !camAllowed}
                    title={isTeacher || camAllowed ? 'الكاميرا' : 'بانتظار إذن المعلم للكاميرا'}
                    className={ctl('sky', camOn, !isTeacher && !camAllowed)}
                  >
                    {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                  {!isTeacher && !canSpeak ? (
                    <button
                      type="button"
                      onClick={raiseHand}
                      disabled={handRaised}
                      title="ارفع يدك"
                      className={`flex items-center gap-2 h-12 px-4 rounded-full border-2 transition-all duration-200 active:scale-95 ${
                        handRaised
                          ? 'bg-emerald-500 border-emerald-300 text-white shadow-[0_0_26px_-2px_rgba(52,211,153,0.9)] cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 border-amber-200 text-white font-bold shadow-[0_0_22px_-4px_rgba(245,158,11,0.9)]'
                      }`}
                    >
                      <Hand className="w-5 h-5" />
                      <span className="text-[10px]">{handRaised ? 'تم ✓' : 'ارفع يدك'}</span>
                    </button>
                  ) : (isTeacher || shareAllowed) && (
                    <button
                      type="button"
                      onClick={() => void toggleShare()}
                      disabled={!isTeacher && !shareAllowed}
                      title="مشاركة الشاشة"
                      className={ctl('violet', sharing, !isTeacher && !shareAllowed)}
                    >
                      <MonitorUp className="w-5 h-5" />
                    </button>
                  )}
                  {!fsChatOpen && (
                    <button type="button" onClick={() => setFsChatOpen(true)} title="المحادثة" className={ctl('slate', false)}>
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Hidden-chat hint arrow */}
                {!fsChatOpen && (
                  <button
                    type="button"
                    onClick={() => setFsChatOpen(true)}
                    className="absolute top-1/2 right-0 -translate-y-1/2 flex w-8 items-center justify-center rounded-l-xl bg-black/45 border border-r-0 border-white/10 py-6 text-white hover:bg-black/65 transition-colors"
                    title="إظهار المحادثة"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="lg:w-80 w-full lg:h-auto h-72 flex flex-col bg-surface border-t lg:border-t-0 lg:border-r border-surface-border shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-surface-border">
            <button
              type="button"
              onClick={() => {
                setActiveTab('chat');
                setUnreadCount(0);
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'chat'
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30'
                  : 'text-ivory-muted hover:text-ivory border border-transparent'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              المحادثة
              {unreadCount > 0 && activeTab !== 'chat' && (
                <span className="bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('people')}
              className={`relative flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'people'
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/30'
                  : 'text-ivory-muted hover:text-ivory border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              الحاضرون ({participants.length + 1})
              {isTeacher && raisedHands.size > 0 && (
                <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[10px] font-bold rounded-full min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 animate-bounce">
                  {raisedHands.size}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'chat' ? (
            renderChat(chatInputRef, chatBottomRef)
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Raised hands — teacher action queue */}
              {isTeacher && raisedHands.size > 0 && (
                <section className="space-y-1.5">
                  <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                    <Hand className="w-3 h-3" />
                    أيادٍ مرفوعة
                  </h3>
                  {Array.from(raisedHands.entries()).map(([identity, name]) => (
                    <div
                      key={identity}
                      className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-pulse"
                    >
                      <span className="font-bold text-amber-300 truncate">{name}</span>
                      <button
                        type="button"
                        onClick={() => allowSpeaking(identity)}
                        className="shrink-0 flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg px-2.5 py-1.5 hover:bg-emerald-500/30 transition-colors"
                      >
                        <Mic className="w-3 h-3" />
                        اسمح بالتكلم
                      </button>
                    </div>
                  ))}
                </section>
              )}

              <section className="space-y-1.5">
                <h3 className="text-[10px] font-bold text-ivory-dark uppercase tracking-wide">في الغرفة</h3>

                {/* Teacher row */}
                <div className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex w-7 h-7 items-center justify-center rounded-full bg-amber-400 text-black text-[10px] font-bold shrink-0">
                      {(lecture?.teacher.fullName || 'م').slice(0, 1)}
                    </span>
                    <span className="font-bold text-gold-300 truncate">
                      {lecture?.teacher.fullName || 'المعلم'} <span className="text-[10px] text-ivory-dark">(المعلم)</span>
                    </span>
                  </div>
                  {sharing && <MonitorUp className="w-3.5 h-3.5 text-gold-400 shrink-0" />}
                </div>

                {/* Students */}
                {participants.map((p) => {
                  const handName = raisedHands.get(p.identity);
                  const src = p.permissions?.canPublishSources;
                  const allAllowed = !src || src.length === 0;
                  const canPub = (s: number) =>
                    Boolean(p.permissions?.canPublish) && (allAllowed || src!.includes(s as never));
                  const micGranted = canPub(TRACK_SOURCE.MICROPHONE);
                  const camGranted = canPub(TRACK_SOURCE.CAMERA);
                  const shareGranted = canPub(TRACK_SOURCE.SCREEN_SHARE);
                  return (
                    <div
                      key={p.identity}
                      className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-xl bg-surface-card border border-surface-border"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex w-7 h-7 items-center justify-center rounded-full bg-bg-elevated border border-surface-border text-[10px] font-bold text-ivory-muted shrink-0">
                          {(p.name || '?').slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate">{p.name || p.identity.slice(0, 8)}</p>
                          <p className={`text-[9px] font-bold ${micGranted ? 'text-emerald-400' : 'text-ivory-dark'}`}>
                            {handName ? '✋ رفع يده' : micGranted ? 'مسموح له بالتكلم' : p.isMicrophoneEnabled ? 'يتكلم الآن' : 'مكتوم'}
                          </p>
                        </div>
                        {p.isMicrophoneEnabled && <Mic className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />}
                      </div>
                      {isTeacher && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title={micGranted ? 'سحب إذن الميكروفون' : 'السماح بالميكروفون'}
                            onClick={() => togglePublish(p.identity, 'microphone', !micGranted)}
                            className={`flex w-8 h-8 items-center justify-center rounded-full border transition-colors ${
                              micGranted
                                ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-300'
                                : 'bg-white/5 border-white/10 text-ivory-muted hover:text-white'
                            }`}
                          >
                            {micGranted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            title={camGranted ? 'سحب إذن الكاميرا' : 'السماح بالكاميرا'}
                            onClick={() => togglePublish(p.identity, 'camera', !camGranted)}
                            className={`flex w-8 h-8 items-center justify-center rounded-full border transition-colors ${
                              camGranted
                                ? 'bg-sky-500/25 border-sky-400/60 text-sky-300'
                                : 'bg-white/5 border-white/10 text-ivory-muted hover:text-white'
                            }`}
                          >
                            {camGranted ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            title={shareGranted ? 'سحب إذن مشاركة الشاشة' : 'السماح بمشاركة الشاشة'}
                            onClick={() => togglePublish(p.identity, 'screen', !shareGranted)}
                            className={`flex w-8 h-8 items-center justify-center rounded-full border transition-colors ${
                              shareGranted
                                ? 'bg-violet-500/25 border-violet-400/60 text-violet-300'
                                : 'bg-white/5 border-white/10 text-ivory-muted hover:text-white'
                            }`}
                          >
                            <MonitorUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="إخراج"
                            onClick={() => controls.removeParticipant.mutate(p.identity)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {participants.length === 0 && (
                  <p className="text-[11px] text-ivory-muted text-center pt-6">لا يوجد طلاب متصلون بعد</p>
                )}
              </section>
            </div>
          )}
        </aside>
      </div>

      {/* Footer control bar */}
      <footer className="shrink-0 pb-3 pt-1 bg-gradient-to-t from-bg-subtle via-bg-subtle to-transparent z-20">
        <div className="mx-auto flex items-end justify-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3 bg-surface-card/80 border border-surface-border rounded-[2rem] px-5 py-2.5 shadow-card-dark-lg">
            {/* Waiting-for-permission hint */}
            {!isTeacher && !canSpeak && (
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-amber-200 bg-amber-400/15 border border-amber-300/40 rounded-full px-3 py-2 whitespace-nowrap">
                <MicOff className="w-3.5 h-3.5" />
                بانتظار إذن المعلم
              </span>
            )}

            {/* Microphone — emerald identity */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => void toggleMic()}
                disabled={!canSpeak}
                title={!canSpeak ? 'بانتظار إذن المعلم للتكلم' : micOn ? 'إيقاف الميكروفون' : 'تشغيل الميكروفون'}
                className={ctl('emerald', micOn, !canSpeak)}
              >
                {meSpeaking && (
                  <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-50" />
                )}
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <span className="text-[9px] font-bold text-ivory-muted">{micOn ? 'ميكروفون' : 'مكتوم'}</span>
            </div>

            {/* Camera — sky identity (needs teacher permission for students) */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => void toggleCam()}
                disabled={!isTeacher && !camAllowed}
                title={
                  isTeacher || camAllowed
                    ? camOn
                      ? 'إيقاف الكاميرا'
                      : 'تشغيل الكاميرا'
                    : 'بانتظار إذن المعلم للكاميرا'
                }
                className={ctl('sky', camOn, !isTeacher && !camAllowed)}
              >
                {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <span className="text-[9px] font-bold text-ivory-muted">الكاميرا</span>
            </div>

            {/* Screen share — violet identity (teacher always / student with permission) */}
            {(isTeacher || shareAllowed) && (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => void toggleShare()}
                  disabled={!isTeacher && !shareAllowed}
                  title={isTeacher || shareAllowed ? 'مشاركة الشاشة' : 'بانتظار إذن المعلم لمشاركة الشاشة'}
                  className={ctl('violet', sharing, !isTeacher && !shareAllowed)}
                >
                  <MonitorUp className="w-5 h-5" />
                </button>
                <span className="text-[9px] font-bold text-ivory-muted">{sharing ? 'إيقاف' : 'مشاركة'}</span>
              </div>
            )}

            {/* Raise hand — gold identity (student, only while NOT allowed to speak) */}
            {!isTeacher && !canSpeak && (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={raiseHand}
                  disabled={handRaised}
                  title="ارفع يدك ليعطيك المعلم الإذن بالتكلم"
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 active:scale-95 ${
                    handRaised
                      ? 'bg-emerald-500 border-emerald-300 text-white shadow-[0_0_26px_-2px_rgba(52,211,153,0.9)] cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 border-amber-200 text-white shadow-[0_0_22px_-4px_rgba(245,158,11,0.9)]'
                  }`}
                >
                  {handRaised && <span className="absolute -inset-1 rounded-full border-2 border-amber-300 animate-ping opacity-50" />}
                  <Hand className="w-5 h-5" />
                </button>
                <span className="text-[9px] font-bold text-ivory-muted">{handRaised ? 'تم ✓' : 'ارفع يدك'}</span>
              </div>
            )}
          </div>

          {/* Mobile tab switcher */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'chat' ? 'people' : 'chat')}
            className="lg:hidden flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl border border-white/10 bg-white/5 text-ivory-muted hover:text-ivory transition-colors relative"
          >
            {activeTab === 'chat' ? <Users className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            <span className="text-[9px] font-bold">تبويبات</span>
            {isTeacher && raisedHands.size > 0 && (
              <span className="absolute -top-1 -left-1 bg-amber-500 text-black text-[10px] font-bold rounded-full w-[18px] h-[18px] inline-flex items-center justify-center">
                {raisedHands.size}
              </span>
            )}
            {unreadCount > 0 && activeTab !== 'chat' && (
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] inline-flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

