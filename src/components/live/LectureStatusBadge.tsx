import { Badge } from '../ui/Badge';
import type { LiveLectureStatus } from '../../types/liveLecture.types';

const STATUS_CONFIG: Record<
  LiveLectureStatus,
  { label: string; variant: 'gold' | 'success' | 'neutral' | 'danger' | 'outline'; dot?: string }
> = {
  LIVE: { label: 'مباشر الآن', variant: 'danger', dot: 'bg-red-400 animate-pulse' },
  SCHEDULED: { label: 'مجدولة', variant: 'outline' },
  ENDED: { label: 'انتهت', variant: 'neutral' },
  CANCELLED: { label: 'ملغاة', variant: 'neutral' },
};

export const LectureStatusBadge: React.FC<{ status: LiveLectureStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SCHEDULED;
  return (
    <Badge variant={cfg.variant}>
      {cfg.dot && <span className={`inline-block w-1.5 h-1.5 rounded-full me-1 ${cfg.dot}`} />}
      {cfg.label}
    </Badge>
  );
};
