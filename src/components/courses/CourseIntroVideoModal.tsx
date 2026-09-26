import React from 'react';
import { Loader2, Video, AlertTriangle, PlayCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { VideoPlayer } from '../video/VideoPlayer';
import { useCourseVideoQuery } from '../../hooks/queries/useVideos';

/** Extract YouTube video ID from any common URL format */
const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/
  );
  return match ? match[1] : null;
};

/**
 * Plays the teacher's custom course video as a free preview (the
 * "introductory lecture about the course"). Visible to everyone — guests,
 * new students and non-subscribed students alike.
 *
 * - YouTube URLs: rendered via the VideoPlayer (YouTube IFrame API)
 * - Direct/HLS URLs: rendered via VideoPlayer (HTML5 / HLS.js)
 * - On playback error: shows a clean error state (no external link button)
 */
export const CourseIntroVideoModal: React.FC<{
  courseId?: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}> = ({ courseId, isOpen, onClose, title }) => {
  const { data, isLoading, isError } = useCourseVideoQuery(courseId, isOpen);
  const video = data?.video ?? null;
  const [playError, setPlayError] = React.useState(false);

  // Reset the player error whenever we open a different video
  React.useEffect(() => {
    setPlayError(false);
  }, [video?.videoUrl, isOpen]);

  // Detect if the stored URL is a YouTube link
  const ytId = video?.videoUrl ? extractYouTubeId(video.videoUrl) : null;
  const isYouTube = !!ytId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? video?.title ?? 'محاضرة تعريفية عن الكورس'}
      maxWidth="2xl"
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="aspect-video w-full rounded-2xl bg-black/60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-xs text-ivory-muted">جاري تحميل الفيديو...</span>
          </div>
        ) : isError ? (
          <div className="aspect-video w-full rounded-2xl bg-red-500/5 border border-red-500/20 flex flex-col items-center justify-center gap-3 p-6 text-center text-red-400">
            <AlertTriangle className="h-10 w-10" />
            <div>
              <p className="text-sm font-bold">تعذر تحميل الفيديو التعريفي</p>
              <p className="text-[11px] text-ivory-muted mt-1">
                تأكد من تشغيل الخادم بأحدث التحديثات، أو أعد المحاولة لاحقاً.
              </p>
            </div>
          </div>
        ) : video && !playError ? (
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
            {isYouTube ? (
              /* YouTube — use our custom VideoPlayer (handles IFrame API) */
              <VideoPlayer
                key={video.videoUrl}
                sources={[{ url: video.videoUrl, label: 'فيديو تعريفي' }]}
                title={video.title ?? 'محاضرة تعريفية عن الكورس'}
                onError={() => setPlayError(true)}
                className="w-full h-full"
              />
            ) : (
              /* Direct / HLS URL — VideoPlayer HTML5 engine */
              <VideoPlayer
                key={video.videoUrl}
                sources={[{ url: video.videoUrl, label: 'فيديو تعريفي' }]}
                title={video.title ?? 'محاضرة تعريفية عن الكورس'}
                onError={() => setPlayError(true)}
                className="w-full h-full"
              />
            )}
          </div>
        ) : video && playError ? (
          /* Playback failed — clean error state, no external link */
          <div className="aspect-video w-full rounded-2xl bg-surface-card border border-surface-border flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <PlayCircle className="h-8 w-8 text-gold-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-ivory">تعذر تشغيل الفيديو داخل الصفحة</p>
              <p className="text-[11px] text-ivory-muted mt-1 leading-relaxed">
                قد يكون المشغّل لا يدعم هذا النوع من الروابط.
                <br />
                تواصل مع الأستاذ لحل المشكلة.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlayError(false)}
              className="text-xs font-bold text-gold-400 hover:text-gold-300 transition-colors px-4 py-2 rounded-xl border border-gold-500/30 bg-gold-500/5"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          /* No video set */
          <div className="aspect-video w-full rounded-2xl bg-black/40 flex flex-col items-center justify-center gap-3 p-6 text-center text-ivory-muted">
            <Video className="h-10 w-10 opacity-40" />
            <p className="text-sm">لا يوجد فيديو تعريفي لهذا الكورس حالياً.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
