import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ImagePlus,
  Upload,
  Link as LinkIcon,
  RefreshCw,
  Trash2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type ThumbnailMode = 'upload' | 'url';

export interface CourseImagePickerProps {
  mode: ThumbnailMode;
  onModeChange: (mode: ThumbnailMode) => void;
  /** Current preview shown in the frame (blob for uploads / url value) */
  preview: string | null;
  /** True when the preview is a freshly picked local file */
  isNewUpload: boolean;
  /** Name of the picked file, if any */
  fileName?: string | null;
  url: string;
  onUrlChange: (url: string) => void;
  onPickFile: (file: File | null) => void;
  onClear: () => void;
}

const ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPT_ATTR = ACCEPTED_MIMES.join(',');

/** Creative cover-image picker: segmented mode switch, drag & drop,
 *  live preview with hover "change image" overlay and state badges. */
export const CourseImagePicker: React.FC<CourseImagePickerProps> = ({
  mode,
  onModeChange,
  preview,
  isNewUpload,
  fileName,
  url,
  onUrlChange,
  onPickFile,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openFileBrowser = () => inputRef.current?.click();

  const pickFromEvent = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset value first so re-picking the SAME file re-triggers onChange
    const file = e.target.files?.[0] || null;
    if (inputRef.current) inputRef.current.value = '';
    onPickFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (mode !== 'upload') return;
    const file = e.dataTransfer.files?.[0] || null;
    if (file && ACCEPTED_MIMES.includes(file.type)) {
      onPickFile(file);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface/40 p-4 space-y-4">
      {/* decorative corner vector */}
      <svg aria-hidden className="pointer-events-none absolute -top-6 -left-6 w-24 h-24 text-gold-500/10" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7" />
      </svg>

      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gold-300">
          <span className="flex w-8 h-8 items-center justify-center rounded-xl bg-gold-500/15 border border-gold-500/30">
            <ImagePlus className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold font-display">صورة غلاف الكورس</h4>
            <p className="text-[11px] text-ivory-muted">ارفع صورة من جهازك أو استخدم رابطاً خارجياً.</p>
          </div>
        </div>

        {/* State badge — always visible so the teacher knows what will be saved */}
        {preview &&
          (isNewUpload ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
              <Sparkles className="w-3 h-3" /> صورة جديدة جاهزة للرفع
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 text-[10px] font-bold text-sky-300">
              <ImageIcon className="w-3 h-3" /> الصورة الحالية
            </span>
          ))}
      </div>

      {/* ─── Segmented mode switch with sliding indicator ─────────── */}
      <div className="relative grid grid-cols-2 gap-0 rounded-xl bg-surface p-1 border border-surface-border">
        {(['upload', 'url'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={cn(
              'relative z-10 rounded-lg px-3 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5',
              mode === m ? 'text-bg' : 'text-ivory-muted hover:text-ivory'
            )}
          >
            {mode === m && (
              <motion.span
                layoutId="thumbnail-mode-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 -z-10 rounded-lg bg-gold-gradient shadow-gold-glow"
              />
            )}
            {m === 'upload' ? (
              <>
                <Upload className="w-3.5 h-3.5" /> رفع من الجهاز
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5" /> رابط صورة
              </>
            )}
          </button>
        ))}
      </div>

      {/* ─── Upload mode ────────────────────────────────────────── */}
      {mode === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragging) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="sr-only"
            onChange={pickFromEvent}
          />

          {preview ? (
            /* ── Live preview with hover change-overlay ── */
            <div className="group relative overflow-hidden rounded-xl border border-gold-500/30 shadow-card-dark">
              <img
                src={preview}
                alt="معاينة صورة غلاف الكورس"
                className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {/* hover overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-bg/75 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={openFileBrowser}
                  className="flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-bold text-bg shadow-gold-glow transition-transform hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" /> تغيير الصورة
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" /> إزالة المعاينة
                </button>
              </div>
              {fileName && (
                <span className="absolute bottom-2 right-2 max-w-[70%] truncate rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white/90">
                  {fileName}
                </span>
              )}
            </div>
          ) : (
            /* ── Empty drop-zone state ── */
            <button
              type="button"
              onClick={openFileBrowser}
              className={cn(
                'block w-full cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300',
                dragging
                  ? 'border-gold-400 bg-gold-500/15 scale-[1.01]'
                  : 'border-gold-500/40 bg-gold-500/5 hover:bg-gold-500/10'
              )}
            >
              <motion.span
                animate={dragging ? { scale: 1.15, rotate: -6 } : { scale: 1, rotate: 0 }}
                className="mx-auto mb-3 flex w-12 h-12 items-center justify-center rounded-2xl bg-gold-500/15 border border-gold-500/30"
              >
                <Upload className="w-5 h-5 text-gold-400" />
              </motion.span>
              <p className="text-xs font-bold text-ivory">
                {dragging ? 'أفلت الصورة هنا' : 'اختر صورة الغلاف أو اسحبها وأفلتها هنا'}
              </p>
              <p className="mt-1 text-[10px] text-ivory-muted">JPG أو PNG أو WEBP — حتى 5MB</p>
            </button>
          )}
        </div>
      )}

      {/* ─── URL mode ───────────────────────────────────────────── */}
      {mode === 'url' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ivory/90 font-body">رابط صورة الغلاف</label>
            <div className="group relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400/50 group-focus-within:text-gold-400 transition-colors pointer-events-none">
                <LinkIcon className="w-4 h-4" />
              </span>
              <input
                type="url"
                dir="ltr"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface ps-10 pe-3 py-3 text-xs text-ivory outline-none transition-all duration-300 focus:border-gold-400 focus:bg-bg-elevated focus:shadow-[0_0_0_4px_rgba(201,161,90,0.12)]"
              />
            </div>
          </div>

          {preview && (
            <div className="relative overflow-hidden rounded-xl border border-surface-border">
              <img
                src={preview}
                alt="معاينة الرابط"
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
