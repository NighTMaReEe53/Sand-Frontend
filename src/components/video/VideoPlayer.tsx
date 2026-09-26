import React, { useCallback, useEffect, useRef, useState } from 'react';
import type HlsType from 'hls.js';
import type { Level } from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  AlertTriangle,
  Gauge,
  MonitorPlay,
} from 'lucide-react';

export interface VideoSource {
  url: string;
  label?: string;
}

/** Imperative engine handle — identical API for both HTML5 and YouTube sources */
export interface VideoPlayerHandle {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  getCurrentTime(): number;
}

interface VideoPlayerProps {
  /** Single source, or multiple renditions to enable quality switching (uploads only) */
  sources: VideoSource[];
  title?: string;
  poster?: string;
  className?: string;
  /** Start position in seconds */
  startTime?: number;
  /** Progress reporting — fires on both engines (HTML5 timeupdate / YT poll) */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onPause?: () => void;
  onError?: () => void;
  /** Imperative handle so parents can seek/read time without knowing the engine */
  playerRef?: React.MutableRefObject<VideoPlayerHandle | null>;
}

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2];
const YT_POLL_INTERVAL_MS = 250;
const VOLUME_STORAGE_KEY = 'lms-player-volume';

/** YouTube "Preferred Quality" options — applied by reloading the player with
 *  a suggestedQuality (the old setPlaybackQuality() API was deprecated by YT
 *  and is a silent no-op). YT may still adapt downward on slow connections. */
const YT_QUALITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'auto', label: 'تلقائي' },
  { value: 'highres', label: '1080p+' },
  { value: 'hd1080', label: '1080p' },
  { value: 'hd720', label: '720p' },
  { value: 'large', label: '480p' },
  { value: 'medium', label: '360p' },
  { value: 'small', label: '240p' },
];

interface HlsLevelInfo {
  index: number; // -1 = auto
  height: number;
  bitrate: number;
}

const readPersistedVolume = (): { volume: number; muted: boolean } => {
  try {
    const raw = sessionStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 1,
        muted: !!parsed.muted,
      };
    }
  } catch {
    /* corrupted storage — fall back to defaults */
  }
  return { volume: 1, muted: false };
};

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

/** Extract the YouTube video ID from any common link format */
const extractYouTubeId = (url: string): string | null => {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/
  );
  return ytMatch ? ytMatch[1] : null;
};

/** Detect HLS master/media playlist URLs */
const isHlsUrl = (url?: string): boolean => !!url && /\.m3u8([?#]|$)/i.test(url);

// ─── YouTube IFrame API loader (singleton script + shared promise) ──────────

let ytApiPromise: Promise<any> | null = null;

const loadYouTubeIframeApi = (): Promise<any> => {
  const w = window as any;
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const prevReady = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        resolve(w.YT);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    });
  }
  return ytApiPromise;
};

// ─── Component ──────────────────────────────────────────────────────────────

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  sources,
  title,
  poster,
  className = '',
  startTime = 0,
  onTimeUpdate,
  onEnded,
  onPause,
  onError,
  playerRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const hlsRef = useRef<HlsType | null>(null);
  // Position/play-state to restore after a quality-driven source swap
  const pendingResumeRef = useRef<number | null>(null);
  const pendingResumePlayRef = useRef(false);

  const [sourceIndex, setSourceIndex] = useState(0);
  const persistedAudio = readPersistedVolume();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Ref to track the last known good duration — used by syncFromHtml5 so
  // that if the <video> element momentarily reports NaN/0 we still pass
  // a valid duration to the parent's onTimeUpdate callback.
  const lastGoodDurationRef = useRef(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(persistedAudio.volume);
  const [isMuted, setIsMuted] = useState(persistedAudio.muted);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [preferredQuality, setPreferredQuality] = useState('auto');
  const [actualQuality, setActualQuality] = useState<string | null>(null);
  // HLS (hls.js) quality levels + currently served level height
  const [hlsLevels, setHlsLevels] = useState<HlsLevelInfo[]>([]);
  const [hlsAuto, setHlsAuto] = useState(true);
  const [hlsSelectedLevel, setHlsSelectedLevel] = useState(-1);
  const [hlsActiveHeight, setHlsActiveHeight] = useState<number | null>(null);

  // ─── Modern UI: auto-hiding controls + center-button feedback ───
  const [controlsVisible, setControlsVisible] = useState(true);
  const [centerPulse, setCenterPulse] = useState(0);
  const [skipFlash, setSkipFlash] = useState<'back' | 'fwd' | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiStateRef = useRef({ isPlaying: false, menuOpen: false });
  uiStateRef.current = { isPlaying, menuOpen: showSpeedMenu || showQualityMenu };

  const activeSource = sources[sourceIndex] ?? sources[0];
  const youtubeId = activeSource ? extractYouTubeId(activeSource.url) : null;
  const isYouTube = !!youtubeId;
  const isHls = !isYouTube && isHlsUrl(activeSource?.url);

  // Keep latest callbacks in refs so engine events/polls never go stale
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onPauseRef = useRef(onPause);
  onPauseRef.current = onPause;

  // ─── Shared time/state sync ─────────────────────────────────────

  const syncFromHtml5 = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
      lastGoodDurationRef.current = video.duration;
    }
    // Use the last known good duration if the element reports NaN/0/Infinity
    const d = lastGoodDurationRef.current;
    onTimeUpdateRef.current?.(video.currentTime, d);
  }, []);

  // ─── YouTube engine lifecycle ───────────────────────────────────

  useEffect(() => {
    if (!isYouTube || !ytHostRef.current || !youtubeId) return;
    const hostWrapper = ytHostRef.current;

    let destroyed = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    setYtReady(false);
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);

    loadYouTubeIframeApi()
      .then((YT) => {
        if (destroyed || !ytHostRef.current) return;
        // YT.Player REPLACES the element it is given — hand it a plain <div>
        // that React does not own, otherwise unmounting conflicts with React's DOM
        const host = document.createElement('div');
        host.className = 'w-full h-full';
        hostWrapper.appendChild(host);
        ytPlayerRef.current = new YT.Player(host, {
          videoId: youtubeId,
          host: 'https://www.youtube.com',
          playerVars: {
            controls: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            disablekb: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (destroyed) return;
              setYtReady(true);
              setIsBuffering(false);
              const d = e.target.getDuration?.() ?? 0;
              if (d > 0) setDuration(d);
              try {
                e.target.setVolume(Math.round(volume * 100));
                // Apply the persisted mute state — otherwise the UI shows muted
                // while the engine plays audio after a reload
                if (isMuted) e.target.mute();
                e.target.setPlaybackRate(playbackRate);
              } catch {
                /* pre-play restrictions are fine */
              }
              if (startTime > 0 && (!d || startTime < d)) {
                e.target.seekTo(startTime, true);
              }
            },
            onStateChange: (e: any) => {
              // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
              if (e.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
              } else if (e.data === 2) {
                setIsPlaying(false);
                onPauseRef.current?.();
              } else if (e.data === 0) {
                setIsPlaying(false);
                onEndedRef.current?.();
              } else if (e.data === 3) {
                setIsBuffering(true);
              }
            },
            onError: () => {
              setHasError(true);
              setIsBuffering(false);
              onError?.();
            },
          },
        });

        // The IFrame API has no timeupdate event — poll instead
        pollTimer = setInterval(() => {
          const p = ytPlayerRef.current;
          if (!p || typeof p.getCurrentTime !== 'function') return;
          const t = p.getCurrentTime() ?? 0;
          const d = p.getDuration?.() ?? 0;
          setCurrentTime(t);
          if (d > 0) setDuration(d);
          // Surface the quality YouTube is actually serving (it may ignore
          // manual requests and auto-select based on the connection)
          const q = p.getPlaybackQuality?.();
          if (q) setActualQuality(q);
          onTimeUpdateRef.current?.(t, d);
        }, YT_POLL_INTERVAL_MS);
      })
      .catch(() => {
        if (!destroyed) {
          setHasError(true);
          setIsBuffering(false);
        }
      });

    return () => {
      destroyed = true;
      if (pollTimer) clearInterval(pollTimer);
      try {
        ytPlayerRef.current?.destroy?.();
      } catch {
        /* already gone */
      }
      ytPlayerRef.current = null;
      if (hostWrapper) hostWrapper.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYouTube, youtubeId]);

  // ─── HLS engine (hls.js) — real quality levels from the manifest ──

  useEffect(() => {
    if (!isHls || !videoRef.current || !activeSource?.url) return;
    const video = videoRef.current;
    let destroyed = false;
    let hls: HlsType | null = null;

    setHlsLevels([]);
    setHlsSelectedLevel(-1);
    setHlsAuto(true);
    setHlsActiveHeight(null);

    // Lazy-load hls.js only when an HLS video is actually played
    (async () => {
      let Hls: typeof HlsType | null = null;
      try {
        ({ default: Hls } = await import('hls.js'));
      } catch {
        Hls = null;
      }
      if (destroyed) return;

      if (Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          capLevelToPlayerSize: false,
        });
        hlsRef.current = hls;

        hls.loadSource(activeSource.url!);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
          if (destroyed) return;
          const levels: HlsLevelInfo[] = (data.levels as Level[]).map((l, i) => ({
            index: i,
            height: l.height || 0,
            bitrate: l.bitrate || 0,
          }));
          setHlsLevels(levels);
          // Apply a pending position restore from a quality switch
          const resume = pendingResumeRef.current;
          if (resume !== null && Number.isFinite(video.duration)) {
            video.currentTime = resume;
            pendingResumeRef.current = null;
            if (pendingResumePlayRef.current) {
              pendingResumePlayRef.current = false;
              video.play().catch(() => undefined);
            }
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
          if (destroyed || !hls) return;
          const lvl = hls.levels[data.level];
          setHlsActiveHeight(lvl?.height ?? null);
          setHlsAuto(hls.autoLevelEnabled);
          if (!hls.autoLevelEnabled) setHlsSelectedLevel(hls.currentLevel);
        });

        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (!destroyed && data.fatal) {
            setHasError(true);
            setIsBuffering(false);
            onError?.();
          }
        });
      } else if (!destroyed && video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari — native HLS; no manual level control, browser decides.
        video.src = activeSource.url!;
      } else if (!destroyed) {
        setHasError(true);
      }
    })();

    return () => {
      destroyed = true;
      try {
        hlsRef.current?.destroy();
      } catch {
        /* already gone */
      }
      hlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHls, activeSource?.url]);

  // ─── Engine-agnostic control handlers ───────────────────────────

  const enginePlay = useCallback(() => {
    if (hasError) return;
    if (isYouTube) {
      ytPlayerRef.current?.playVideo?.();
    } else {
      videoRef.current?.play().catch(() => setHasError(true));
    }
  }, [hasError, isYouTube]);

  const enginePause = useCallback(() => {
    if (isYouTube) {
      ytPlayerRef.current?.pauseVideo?.();
    } else {
      videoRef.current?.pause();
    }
  }, [isYouTube]);

  const engineSeekTo = useCallback(
    (seconds: number) => {
      if (isYouTube) {
        ytPlayerRef.current?.seekTo?.(Math.max(0, seconds), true);
      } else if (videoRef.current) {
        videoRef.current.currentTime = Math.max(
          0,
          Math.min(seconds, videoRef.current.duration || Infinity)
        );
        syncFromHtml5();
      }
    },
    [isYouTube, syncFromHtml5]
  );

  const engineGetTime = useCallback((): number => {
    if (isYouTube) return ytPlayerRef.current?.getCurrentTime?.() ?? currentTime;
    return videoRef.current?.currentTime ?? currentTime;
  }, [isYouTube, currentTime]);

  // Expose the imperative handle to the parent (same shape for both engines)
  useEffect(() => {
    if (!playerRef) return;
    playerRef.current = {
      play: enginePlay,
      pause: enginePause,
      seekTo: engineSeekTo,
      getCurrentTime: engineGetTime,
    };
  });

  const togglePlay = useCallback(() => {
    if (isPlaying) enginePause();
    else enginePlay();
  }, [isPlaying, enginePlay, enginePause]);

  const skip = useCallback(
    (seconds: number) => {
      engineSeekTo(engineGetTime() + seconds);
    },
    [engineSeekTo, engineGetTime]
  );

  // ─── Auto-hiding controls & interaction feedback ────────────────
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (uiStateRef.current.isPlaying && !uiStateRef.current.menuOpen) {
        setControlsVisible(false);
      }
    }, 2600);
  }, []);

  // Paused / menus open / errors — controls must stay visible
  useEffect(() => {
    if (!isPlaying || showSpeedMenu || showQualityMenu || hasError || isBuffering) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [isPlaying, showSpeedMenu, showQualityMenu, hasError, isBuffering]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    []
  );

  const handleTogglePlay = useCallback(() => {
    togglePlay();
    setCenterPulse((n) => n + 1);
    revealControls();
  }, [togglePlay, revealControls]);

  // First tap on a hidden-controls surface reveals them; second tap toggles
  const handleSurfaceClick = useCallback(() => {
    if (!controlsVisible) revealControls();
    else handleTogglePlay();
  }, [controlsVisible, revealControls, handleTogglePlay]);

  const doSkip = useCallback(
    (seconds: number) => {
      skip(seconds);
      setSkipFlash(seconds > 0 ? 'fwd' : 'back');
      revealControls();
    },
    [skip, revealControls]
  );

  useEffect(() => {
    if (!skipFlash) return;
    const t = setTimeout(() => setSkipFlash(null), 700);
    return () => clearTimeout(t);
  }, [skipFlash]);

  const toggleMute = useCallback(() => {
    if (isYouTube) {
      const p = ytPlayerRef.current;
      if (!p) return;
      if (p.isMuted?.()) {
        p.unMute();
        setIsMuted(false);
      } else {
        p.mute();
        setIsMuted(true);
      }
    } else {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  }, [isYouTube]);

  const handleVolumeChange = (value: number) => {
    if (isYouTube) {
      ytPlayerRef.current?.setVolume?.(Math.round(value * 100));
      if (value > 0 && ytPlayerRef.current?.isMuted?.()) {
        ytPlayerRef.current.unMute();
        setIsMuted(false);
      }
    } else if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
    }
    setVolume(value);
    setIsMuted(value === 0);
  };

  // Persist the last-used volume across lessons for the whole session
  useEffect(() => {
    try {
      sessionStorage.setItem(
        VOLUME_STORAGE_KEY,
        JSON.stringify({ volume, muted: isMuted })
      );
    } catch {
      /* storage unavailable */
    }
  }, [volume, isMuted]);

  // Apply the persisted volume once per engine load
  useEffect(() => {
    if (isYouTube) return;
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
  }, [isYouTube]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    const fullscreenDocument = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const fullscreenContainer = container as HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    const nativeVideo = videoRef.current as (HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    }) | null;
    try {
      if (document.fullscreenElement || fullscreenDocument.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await fullscreenDocument.webkitExitFullscreen?.();
      } else if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (fullscreenContainer.webkitRequestFullscreen) {
        await fullscreenContainer.webkitRequestFullscreen();
      } else if (nativeVideo?.webkitEnterFullscreen) {
        // iPhone Safari exposes fullscreen on the native <video> only.
        nativeVideo.webkitEnterFullscreen();
      }
    } catch {
      // Fullscreen can be rejected by browser policy; playback remains usable.
    }
  }, []);

  const changeSpeed = (rate: number) => {
    if (isYouTube) {
      try {
        ytPlayerRef.current?.setPlaybackRate?.(rate);
      } catch {
        /* rate unsupported by source */
      }
    } else if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  // ─── YouTube: apply quality by re-cueing with suggestedQuality.
  // setPlaybackQuality() was deprecated by YouTube (silent no-op), but
  // cueVideoById({ suggestedQuality }) still biases the served rendition.
  const changePreferredQuality = (value: string) => {
    setPreferredQuality(value);
    setShowQualityMenu(false);
    if (!isYouTube || value === 'auto') return;
    const p = ytPlayerRef.current;
    if (!p || typeof p.cueVideoById !== 'function') return;
    try {
      const t = p.getCurrentTime?.() ?? 0;
      const wasPlaying = p.getPlayerState?.() === 1;
      p.cueVideoById({
        videoId: youtubeId,
        startSeconds: Math.floor(t),
        suggestedQuality: value,
      });
      setIsBuffering(true);
      if (wasPlaying) p.playVideo();
    } catch {
      /* YT may ignore the suggestion on slow connections */
    }
  };

  // ─── HLS: switch between real manifest levels instantly (no reload) ──
  const changeHlsLevel = (levelIndex: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    setShowQualityMenu(false);
    try {
      hls.currentLevel = levelIndex; // -1 = auto
      setHlsSelectedLevel(levelIndex);
      setHlsAuto(levelIndex === -1);
    } catch {
      /* level not available */
    }
  };

  // Quality switching between uploaded multi-rendition MP4 sources.
  // The <video> remounts (key = url); we stash the position and restore it
  // in onLoadedMetadata so switching doesn't reset progress.
  const changeQuality = (index: number) => {
    if (isYouTube) return;
    pendingResumeRef.current = videoRef.current?.currentTime ?? engineGetTime();
    pendingResumePlayRef.current = videoRef.current
      ? !videoRef.current.paused
      : false;
    setSourceIndex(index);
    setShowQualityMenu(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
    engineSeekTo(ratio * duration);
  };

  // ─── Effects ───────────────────────────────────────────────────

  useEffect(() => {
    const fullscreenDocument = document as Document & { webkitFullscreenElement?: Element };
    const onFullscreenChange = () =>
      setIsFullscreen(!!(document.fullscreenElement || fullscreenDocument.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () =>
      {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;
      // Only react when focus is inside the player or hovering it
      if (!container.contains(document.activeElement) && document.activeElement !== document.body)
        return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        doSkip(10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        doSkip(-10);
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [doSkip, handleTogglePlay]);

  const bufferedPercent =
    duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;
  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const showQualityMenuEnabled =
    (sources.length > 1 && !isYouTube) ||
    isYouTube ||
    (isHls && hlsLevels.length > 1);

  // Sorted best → worst for the HLS level picker
  const hlsLevelsSorted = [...hlsLevels].sort(
    (a, b) => (b.height || b.bitrate) - (a.height || a.bitrate)
  );
  const hlsSelectedLabel = hlsAuto
    ? hlsActiveHeight
      ? `تلقائي (${hlsActiveHeight}p)`
      : 'تلقائي'
    : `${hlsLevels.find((l) => l.index === hlsSelectedLevel)?.height ?? '?'}p`;

  return (
    <div
      ref={containerRef}
      dir="ltr"
      tabIndex={0}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      className={`group relative overflow-hidden bg-black outline-none select-none ${
        isFullscreen ? 'h-[100dvh] w-[100dvw] rounded-none' : 'rounded-2xl'
      } ${!controlsVisible && isPlaying ? 'cursor-none' : ''} ${className}`}
    >
      {/* ─── Media target ─────────────────────────────────────────── */}
      {isYouTube ? (
        <div
          className="relative w-full h-full pointer-events-none [&_iframe]:w-full [&_iframe]:h-full"
        >
          <div ref={ytHostRef} className="absolute inset-0" />
        </div>
      ) : (
        <video
          ref={videoRef}
          key={activeSource?.url}
          src={isHls ? undefined : activeSource?.url}
          poster={poster}
          playsInline
          preload="metadata"
          className={`w-full object-contain ${isFullscreen ? 'h-full max-h-[100dvh]' : 'h-full'}`}
          onClick={handleSurfaceClick}
          onPlay={() => setIsPlaying(true)}
          onPause={() => { setIsPlaying(false); onPauseRef.current?.(); }}
          onEnded={() => { setIsPlaying(false); onEndedRef.current?.(); }}
          onTimeUpdate={syncFromHtml5}
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            if (Number.isFinite(el.duration) && el.duration > 0) {
              setDuration(el.duration);
              lastGoodDurationRef.current = el.duration;
            }
            el.playbackRate = playbackRate;
            // Restore position after a quality switch, else apply resume point
            const resume = pendingResumeRef.current;
            if (resume !== null && Number.isFinite(el.duration)) {
              el.currentTime = Math.min(resume, Math.max(0, el.duration - 1));
              pendingResumeRef.current = null;
              if (pendingResumePlayRef.current) {
                pendingResumePlayRef.current = false;
                el.play().catch(() => undefined);
              }
            } else if (startTime > 0 && startTime < el.duration) {
              el.currentTime = startTime;
            }
          }}
          onProgress={(e) => {
            const v = e.currentTarget;
            if (v.buffered.length > 0) {
              setBuffered(v.buffered.end(v.buffered.length - 1));
            }
          }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onError={() => {
            setHasError(true);
            setIsBuffering(false);
            onError?.();
          }}
        />
      )}

      {/* Click surface over YouTube media (iframe is pointer-events:none) */}
      {isYouTube && (
        <div
          className="absolute inset-0 z-[1]"
          style={{ bottom: '4.5rem' }}
          onClick={handleSurfaceClick}
        />
      )}

      {/* Loading spinner — YT shows until its API player is ready;
          HTML5 shows only while buffering */}
      {!hasError && (isYouTube ? !ytReady || isBuffering : isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
          <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-gold-400 animate-spin shadow-[0_0_25px_rgba(234,179,8,0.3)]" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 z-[2]">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="text-xs text-ivory-muted">تعذر تحميل الفيديو</p>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              if (isYouTube) {
                try {
                  ytPlayerRef.current?.loadVideoById?.(youtubeId);
                } catch {
                  /* remount needed */
                }
              } else {
                videoRef.current?.load();
              }
            }}
            className="text-xs font-bold text-gold-400 hover:text-gold-300 border border-gold-500/40 rounded-lg px-3 py-1"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Custom keyframes for the player UI */}
      <style>{`
        @keyframes vp-flash {
          0% { opacity: 0; transform: scale(0.75); }
          18% { opacity: 1; transform: scale(1); }
          65% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.08); }
        }
        .vp-flash { animation: vp-flash 0.7s ease-out forwards; }
        @keyframes vp-pop {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .vp-pop {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: vp-pop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* Center play/pause control — glowing gold orb when paused,
          frosted-glass disc while playing */}
      {!hasError && (
        <div
          className={`absolute inset-0 z-[2] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className={`pointer-events-auto relative flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 active:scale-90 ${
              isPlaying
                ? 'w-14 h-14 bg-black/40 border border-white/25 backdrop-blur-md text-white/90 hover:text-gold-300 hover:bg-black/60 shadow-lg hover:scale-105'
                : 'w-20 h-20 bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-surface-dark border border-white/30 shadow-[0_10px_40px_rgba(234,179,8,0.5)] hover:scale-105'
            }`}
          >
            {/* Radiating rings — only while paused, inviting the first click */}
            {!isPlaying && (
              <>
                <span className="absolute inset-0 rounded-full bg-gold-400/30 animate-ping pointer-events-none" />
                <span className="absolute inset-0 rounded-full bg-gold-400/15 animate-ping [animation-delay:400ms] pointer-events-none" />
              </>
            )}
            <span key={centerPulse} className="vp-pop">
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-9 h-9 ml-1" fill="currentColor" />
              )}
            </span>
          </button>
        </div>
      )}

      {/* Skip feedback bubbles */}
      {skipFlash && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-[3] pointer-events-none ${
            skipFlash === 'fwd' ? 'right-6' : 'left-6'
          }`}
        >
          <div className="vp-flash flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-gold-300 text-xs font-bold shadow-lg">
            <RotateCcw className={`w-3.5 h-3.5 ${skipFlash === 'fwd' ? 'rotate-180' : ''}`} />
            {skipFlash === 'fwd' ? '+10' : '-10'}
          </div>
        </div>
      )}

      {/* Controls bar — identical UI drives both engines */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-300 z-[2] ${
          controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Seek bar — grows + glowing thumb on hover */}
        <div
          className="relative h-7 sm:h-5 flex items-center cursor-pointer group/seek touch-none"
          onClick={(e) => {
            handleSeek(e);
            revealControls();
          }}
        >
          <div className="relative w-full h-1 group-hover/seek:h-1.5 rounded-full bg-white/15 transition-all duration-200">
            {/* Buffered */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/25"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Progress */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-600 via-gold-500 to-gold-300 shadow-[0_0_12px_rgba(234,179,8,0.5)]"
              style={{ width: `${playedPercent}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-gold-300 ring-4 ring-gold-400/30 shadow-md scale-100 sm:scale-0 sm:group-hover/seek:scale-100 transition-transform duration-150"
              style={{ left: `${playedPercent}%` }}
            />
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center gap-x-0.5 gap-y-1.5 mt-1.5">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="shrink-0 p-2 rounded-lg text-white hover:text-gold-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
          </button>

          <button
            type="button"
            onClick={() => doSkip(-10)}
            aria-label="Rewind 10 seconds"
            className="shrink-0 p-2 rounded-lg text-white/90 hover:text-gold-300 hover:bg-white/10 transition-colors cursor-pointer relative"
          >
            <RotateCcw className="w-4.5 h-4.5" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-[1px]">
              10
            </span>
          </button>

          <button
            type="button"
            onClick={() => doSkip(10)}
            aria-label="Forward 10 seconds"
            className="shrink-0 p-2 rounded-lg text-white/90 hover:text-gold-300 hover:bg-white/10 transition-colors cursor-pointer relative"
          >
            <RotateCw className="w-4.5 h-4.5" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-[1px]">
              10
            </span>
          </button>

          {/* Volume */}
          <div className="shrink-0 flex items-center gap-1 sm:gap-1.5 group/vol">
            <button
              type="button"
              onClick={toggleMute}
              aria-label="Mute toggle"
              className="shrink-0 p-1.5 text-white/90 hover:text-gold-400 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              aria-label="Volume"
              className="w-10 sm:w-20 accent-gold-500 cursor-pointer"
            />
          </div>

          {/* Time display */}
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-white/10 text-[10px] sm:text-[11px] font-mono text-white/85 tabular-nums whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1 min-w-[4px] basis-0" />

          {/* Speed menu */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowSpeedMenu((v) => !v);
                setShowQualityMenu(false);
              }}
              aria-label="Playback speed"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-bold text-white/90 hover:text-gold-400 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Gauge className="w-4 h-4" />
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 rounded-xl bg-surface-dark/95 backdrop-blur-xl border border-white/10 py-1.5 min-w-[76px] shadow-2xl z-10">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changeSpeed(rate)}
                    className={`block w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      playbackRate === rate
                        ? 'text-gold-400 font-bold'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quality menu — renditions for uploads, "Preferred Quality" for
              YouTube (YT auto-overrides based on connection) */}
          {showQualityMenuEnabled && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowQualityMenu((v) => !v);
                  setShowSpeedMenu(false);
                }}
                aria-label="Video quality"
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-bold text-white/90 hover:text-gold-400 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                <MonitorPlay className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">
                  {isYouTube ? (
                    <>
                      {YT_QUALITY_OPTIONS.find((q) => q.value === preferredQuality)?.label ??
                        preferredQuality}
                      {actualQuality && actualQuality !== 'unknown' && actualQuality !== 'auto' && (
                        <span className="text-white/50 font-normal">
                          {' '}({actualQuality})
                        </span>
                      )}
                    </>
                  ) : isHls ? (
                    hlsSelectedLabel
                  ) : (
                    sources[sourceIndex]?.label ?? 'Auto'
                  )}
                </span>
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full mb-2 right-0 rounded-xl bg-surface-dark/95 backdrop-blur-xl border border-white/10 py-1.5 min-w-[88px] shadow-2xl z-10 max-h-56 overflow-y-auto">
                  {isYouTube
                    ? YT_QUALITY_OPTIONS.map((q) => (
                        <button
                          key={q.value}
                          type="button"
                          onClick={() => changePreferredQuality(q.value)}
                          title={q.value === 'auto' ? undefined : 'طلب تفضيلي — يوتيوب قد يتجاهله حسب سرعة الاتصال'}
                          className={`block w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                            preferredQuality === q.value
                              ? 'text-gold-400 font-bold'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {q.label}
                        </button>
                      ))
                    : isHls
                      ? hlsLevels.length > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => changeHlsLevel(-1)}
                              className={`block w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                hlsAuto
                                  ? 'text-gold-400 font-bold'
                                  : 'text-white/80 hover:bg-white/10'
                              }`}
                            >
                              تلقائي{hlsActiveHeight ? ` (${hlsActiveHeight}p)` : ''}
                            </button>
                            {hlsLevelsSorted.map((l) => (
                              <button
                                key={l.index}
                                type="button"
                                onClick={() => changeHlsLevel(l.index)}
                                className={`block w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                                  !hlsAuto && hlsSelectedLevel === l.index
                                    ? 'text-gold-400 font-bold'
                                    : 'text-white/80 hover:bg-white/10'
                                }`}
                              >
                                {l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)} kbps`}
                              </button>
                            ))}
                          </>
                        )
                      : sources.map((src, idx) => (
                        <button
                          key={src.url + idx}
                          type="button"
                          onClick={() => changeQuality(idx)}
                          className={`block w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                            sourceIndex === idx
                              ? 'text-gold-400 font-bold'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {src.label ?? `Source ${idx + 1}`}
                        </button>
                      ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen — larger touch target on mobile so it's always reachable */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="shrink-0 p-2.5 sm:p-1.5 -m-1 sm:m-0 text-white/90 hover:text-gold-400 transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Title overlay */}
      {title && (
        <div
          className={`absolute top-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-[2] transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-xs font-bold text-white/90 truncate drop-shadow">{title}</p>
        </div>
      )}
    </div>
  );
};