import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GradeLevel } from '../types/auth.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function smoothScrollToTop(duration = 0.8) {
  if (typeof window === 'undefined') return;
  const lenis = (window as unknown as { __lenis?: any }).__lenis;
  if (lenis) {
    lenis.scrollTo(0, { immediate: false, duration });
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }
}

export function formatPrice(price: number | string | undefined | null): string {
  if (price === undefined || price === null) return '0 ج.م';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return 'مجاناً';
  return `${num.toLocaleString('ar-EG')} ج.م`;
}

export function formatGradeLevel(grade?: GradeLevel | string | null): string {
  if (!grade) return 'غير محدد';
  const raw = String(grade).trim();
  const normalized = raw.toUpperCase().replace(/[\s-]+/g, '_');

  const map: Record<string, string> = {
    PREP_1: 'الصف الأول الإعدادي',
    '1ST_PREP': 'الصف الأول الإعدادي',
    FIRST_PREP: 'الصف الأول الإعدادي',
    GRADE_7: 'الصف الأول الإعدادي',
    PREP_2: 'الصف الثاني الإعدادي',
    '2ND_PREP': 'الصف الثاني الإعدادي',
    SECOND_PREP: 'الصف الثاني الإعدادي',
    GRADE_8: 'الصف الثاني الإعدادي',
    PREP_3: 'الصف الثالث الإعدادي',
    '3RD_PREP': 'الصف الثالث الإعدادي',
    THIRD_PREP: 'الصف الثالث الإعدادي',
    GRADE_9: 'الصف الثالث الإعدادي',
    SEC_1: 'الصف الأول الثانوي',
    '1ST_SEC': 'الصف الأول الثانوي',
    FIRST_SEC: 'الصف الأول الثانوي',
    GRADE_10: 'الصف الأول الثانوي',
    SEC_2: 'الصف الثاني الثانوي',
    '2ND_SEC': 'الصف الثاني الثانوي',
    SECOND_SEC: 'الصف الثاني الثانوي',
    GRADE_11: 'الصف الثاني الثانوي',
    SEC_3: 'الصف الثالث الثانوي',
    '3RD_SEC': 'الصف الثالث الثانوي',
    THIRD_SEC: 'الصف الثالث الثانوي',
    GRADE_12: 'الصف الثالث الثانوي',
    SEC_3_SCIENTIFIC: 'الثانوية العامة (علمي)',
    SEC_3_LITERARY: 'الثانوية العامة (أدبي)',
    AZHAR_PREP: 'الأزهر الشريف (إعدادي)',
    AZHAR_SEC: 'الأزهر الشريف (ثانوي)',
    BAC: 'البكالوريا الدولية',
  };

  if (map[normalized]) return map[normalized];

  // Regex & keyword fallbacks
  if (normalized.includes('10') || normalized.includes('FIRST_SEC') || normalized.includes('1ST_SEC') || raw.includes('أول ثانوي') || raw.includes('الأول الثانوي')) {
    return 'الصف الأول الثانوي';
  }
  if (normalized.includes('11') || normalized.includes('SECOND_SEC') || normalized.includes('2ND_SEC') || raw.includes('ثاني ثانوي') || raw.includes('الثاني الثانوي')) {
    return 'الصف الثاني الثانوي';
  }
  if (normalized.includes('12') || normalized.includes('THIRD_SEC') || normalized.includes('3RD_SEC') || raw.includes('ثالث ثانوي') || raw.includes('الثالث الثانوي')) {
    if (normalized.includes('SCI') || raw.includes('علمي')) return 'الثانوية العامة (علمي)';
    if (normalized.includes('LIT') || raw.includes('أدبي')) return 'الثانوية العامة (أدبي)';
    return 'الصف الثالث الثانوي';
  }
  if (normalized.includes('7') || normalized.includes('FIRST_PREP') || normalized.includes('1ST_PREP') || raw.includes('أول إعدادي') || raw.includes('الأول الإعدادي')) {
    return 'الصف الأول الإعدادي';
  }
  if (normalized.includes('8') || normalized.includes('SECOND_PREP') || normalized.includes('2ND_PREP') || raw.includes('ثاني إعدادي') || raw.includes('الثاني الإعدادي')) {
    return 'الصف الثاني الإعدادي';
  }
  if (normalized.includes('9') || normalized.includes('THIRD_PREP') || normalized.includes('3RD_PREP') || raw.includes('ثالث إعدادي') || raw.includes('الثالث الإعدادي')) {
    return 'الصف الثالث الإعدادي';
  }

  return raw;
}

export function formatGradeLevels(grades?: (GradeLevel | string)[] | null): string {
  if (!grades?.length) return 'غير محدد';
  return grades.map((grade) => formatGradeLevel(grade)).join(' • ');
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} ساعة و ${remainingMinutes} دقيقة` : `${hours} ساعة`;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Resolve a media URL that might be:
 * - already absolute (http/https) → return as-is
 * - a relative path like "uploads/..." or "/uploads/..." → prepend API host
 * - a storage key or blob
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  // Normalize windows backslashes
  const normalized = trimmed.replace(/\\/g, '/');
  // Relative path: resolve against the API host
  const apiHost = API_BASE.replace(/\/api\/v1\/?$/, '');
  const cleanPath = normalized.replace(/^\/+/, '');
  if (cleanPath.startsWith('api/')) {
    return `${apiHost}/${cleanPath}`;
  }
  const finalPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  return `${apiHost}/${finalPath}`;
}

/**
 * Safely parse images that may arrive as:
 * - proper string[]
 * - JSON-encoded string '["url1","url2"]'
 * - PostgreSQL array literal '{url1,url2}'
 * - comma-separated strings
 * - single string URL
 */
export function parseImages(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
      } catch {
        // Fallback to text parsing below
      }
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      // PostgreSQL {a,b,c} or {"a","b"} format
      const cleaned = trimmed.slice(1, -1);
      if (cleaned) {
        return cleaned
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      }
    }
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    return [trimmed];
  }
  return [];
}

/** Detect if a media URL points to a video */
export function isVideoMedia(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    lower.includes('/videos/') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.endsWith('.m3u8')
  );
}

