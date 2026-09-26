import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Star, BadgeCheck, BookOpen, Quote } from 'lucide-react';
import { SectionHeader } from '../ui/SectionHeader';
import { FadeIn } from '../animations/FadeIn';

export interface Testimonial {
  name: string;
  grade: string;
  text: string;
  photoUrl?: string | null;
  /** §12.8 — real-enrollment metadata (optional for legacy static items) */
  courseTitle?: string;
  rating?: number;
}

interface TestimonialsProps {
  items: Testimonial[];
}

/** A consistent social-proof card with a real student photo when available. */
const TestimonialCard: React.FC<{ item: Testimonial }> = ({ item }) => {
  const stars = Math.min(5, Math.max(1, item.rating ?? 5));
  const initial = item.name?.trim()?.[0] ?? '؟';
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [item.photoUrl]);

  return (
    <figure className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-surface-border bg-surface-card p-5 shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_45px_-28px_color-mix(in_srgb,var(--primary)_65%,transparent)] sm:p-7">
      <span aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity duration-300 group-hover:opacity-80" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-1 w-0 bg-gradient-to-l from-gold-400 via-primary to-transparent transition-all duration-500 group-hover:w-full" />

      <figcaption className="relative flex items-center gap-3">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[var(--surface)] bg-gold-gradient font-amiri text-xl font-black text-bg shadow-[0_8px_18px_-10px_rgba(201,161,90,.9)] ring-1 ring-gold-400/35">
          {item.photoUrl && !imageFailed ? (
            <img
              src={item.photoUrl}
              alt={`صورة ${item.name}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            initial
          )}
        </span>
        <span className="min-w-0 flex-1">
          <p className="truncate font-amiri text-base font-bold text-ink">{item.name}</p>
          <p className="truncate text-[11px] text-ink-muted">{item.grade}</p>
          {item.courseTitle && (
            <span className="mt-1 inline-flex max-w-full items-center gap-1 text-[10px] font-semibold text-primary">
              <BookOpen className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.courseTitle}</span>
            </span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary">
            <BadgeCheck className="h-3 w-3" />
            رأي طالب
          </span>
          <span className="flex items-center gap-0.5" aria-label={`تقييم ${stars} من 5 نجوم`} dir="ltr">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < stars ? 'fill-gold-400 text-gold-400' : 'text-surface-border'}`}
              aria-hidden="true"
            />
          ))}
        </span>
        </span>
      </figcaption>

      <blockquote className="relative mt-6 grow text-sm leading-8 text-ink sm:text-base" style={{ lineHeight: 'var(--lh-relaxed)' }}>
        <Quote aria-hidden="true" className="absolute right-0 top-0 h-14 w-14 text-primary/10" strokeWidth={1.25} />
        <p className="relative line-clamp-5 pt-3">{item.text}</p>
      </blockquote>

      <div className="relative mt-5 flex items-center justify-between border-t border-surface-border pt-3 text-[11px] font-semibold text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          من رحلة التعلّم على المنصة
        </span>
        <Quote aria-hidden="true" className="h-4 w-4 text-gold-400/75" strokeWidth={1.8} />
      </div>
    </figure>
  );
};

/**
 * Testimonials carousel (Implementation_plan_EN.md §3.6).
 * Shows 2 cards side-by-side on md+ screens and 1 card on mobile.
 * RTL-aware slide transition via Framer Motion AnimatePresence;
 * arrows are flipped to match reading direction.
 */
export const Testimonials: React.FC<TestimonialsProps> = ({ items }) => {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(1);
  const prefersReducedMotion = useReducedMotion();

  // Responsive cards-per-view: 2 on tablet/desktop, 1 on mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setPerPage(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const pageCount = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, pageCount - 1);

  const visible = useMemo(
    () => items.slice(safePage * perPage, safePage * perPage + perPage),
    [items, safePage, perPage],
  );

  if (items.length === 0) return null;

  const goPrev = () => setPage((p) => (Math.min(p, pageCount - 1) - 1 + pageCount) % pageCount);
  const goNext = () => setPage((p) => (Math.min(p, pageCount - 1) + 1) % pageCount);

  // In RTL the "next" page comes from the left.
  const direction = safePage % 2 === 0 ? 1 : -1;

  return (
    <section id="testimonials" className="relative isolate overflow-hidden py-16 sm:py-20" aria-label="تجارب الطلاب">
      <span aria-hidden="true" className="pointer-events-none absolute right-[-8rem] top-12 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[-6rem] h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="heritage-container relative scroll-mt-24">
        <SectionHeader
          eyebrow="آراء من داخل رحلة التعلّم"
          shape="double"
          fontMix
          title="تجارب طلابنا مع المنصة"
          description="كلمات حقيقية تلخّص تجربة تعلّم منظمة وقريبة من الطالب."
          className="mb-10"
        />

        <FadeIn>
          <div className="relative mx-auto max-w-6xl">
          <div className="relative overflow-hidden" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${safePage}-${perPage}`}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 60 * direction }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -60 * direction }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2"
              >
                {visible.map((item) => (
                  <TestimonialCard key={`${safePage}-${item.name}`} item={item} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation — hidden when every testimonial is already visible. */}
          {pageCount > 1 && <div className="mt-7 flex items-center justify-center gap-3">
            <button
              onClick={goNext}
              aria-label="التقييم التالي"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-surface-card text-primary transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`الانتقال لصفحة التقييمات رقم ${i + 1}`}
                  aria-current={i === safePage}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === safePage ? 'w-7 bg-primary' : 'w-2 bg-surface-border hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goPrev}
              aria-label="التقييم السابق"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-surface-card text-primary transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
