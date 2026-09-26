import React from 'react';
import { BookOpen, GraduationCap, UserRound, Star, Layers, Flame, Infinity as InfinityIcon, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../../types/course.types';
import { usePrefetchCourseDetail } from '../../hooks/queries/useCourses';
import { formatGradeLevels } from '../../lib/utils';
import { formatTargets } from '../../lib/formatTargets';
import { CoursePrice } from '../ui/CoursePrice';

interface CourseCardProps {
  course: Course;
  children: React.ReactNode;
}

/**
 * «جديد» badge — a compact label that does not compete with the course title.
 */
const NewBadge: React.FC = () => (
  <span className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-950/80 px-3 py-1 text-[10px] font-black text-emerald-100 backdrop-blur-sm">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
    جديد
  </span>
);

/** A stable date remains truthful without running a timer for each card. */
const OfferDeadline: React.FC<{ endIso: string }> = ({ endIso }) => {
  const date = new Date(endIso);
  if (Number.isNaN(date.getTime())) return null;

  return (
    <span className="text-[10px] font-black tabular-nums">
      حتى {new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short' }).format(date)}
    </span>
  );
};

/** Shared public card so the home and courses pages always present a course consistently. */
const CourseCardBase: React.FC<CourseCardProps> = ({ course, children }) => {
  const prefetchCourse = usePrefetchCourseDetail();
  const targetGrades = course.gradeLevels?.length ? course.gradeLevels : [course.gradeLevel];
  const subjectRef = (course as { subjectRef?: { id: string; name: string } | null }).subjectRef;
  const legacySubject = (course as { subject?: string | null }).subject;
  const audience = course.targets?.length
    ? formatTargets(course.targets)
    : formatGradeLevels(targetGrades);
  const averageRating = (course as { averageRating?: number | null }).averageRating;
  const reviewCount = (course as { reviewCount?: number }).reviewCount ?? 0;

  /* ─── Offer / New state ──────────────────────────────────────── */
  const now = Date.now();
  const rawPercent = Number(course.discountPercent ?? 0);
  const endsAtMs = course.discountEndsAt ? new Date(course.discountEndsAt).getTime() : null;
  const hasOffer =
    !course.isFree &&
    rawPercent >= 1 &&
    rawPercent <= 90 &&
    endsAtMs !== null &&
    endsAtMs > now;

  const listPrice = Number(course.price) || 0;
  const offeredPrice = hasOffer
    ? Math.round(listPrice * (1 - rawPercent / 100) * 100) / 100
    : course.price;

  // «جديد» badge — only for fresh courses without an active offer (never both)
  const isNew =
    !hasOffer &&
    now - new Date(course.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 ${
        hasOffer
          ? 'border-rose-400/40 shadow-sm hover:border-rose-400/60'
          : 'border-[var(--line)] shadow-sm hover:border-[var(--primary)]/40'
      }`}
    >
      {/* animated offer shimmer along the card top edge */}
      {hasOffer && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] overflow-hidden">
          <div className="h-full w-full bg-gradient-to-l from-transparent via-rose-400/80 to-transparent bg-[length:200%_100%] animate-shimmer" />
        </div>
      )}

      {/* ─── Cover ─────────────────────────────────────────────────── */}
      <Link
        to={`/courses/${course.id}`}
        className="block"
        aria-label={course.title}
        onMouseEnter={() => prefetchCourse(course.id)}
        onFocus={() => prefetchCourse(course.id)}
      >
        <div className="relative h-44 overflow-hidden bg-[var(--surface-alt)] sm:h-48">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary-soft)] to-[var(--primary)]/10">
              <BookOpen className="h-16 w-16 text-[var(--primary)]/40 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

          {/* Subtle shine flourish on hover */}
          <span aria-hidden="true" className="course-glint absolute inset-0 pointer-events-none" />

          {/* Subject badge — top corner */}
          {(subjectRef || legacySubject) && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-bold text-sky-300 border border-sky-500/30 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-sky-500/20">
              <BookOpen className="h-3 w-3" />
              {subjectRef?.name ?? legacySubject}
            </span>
          )}

          {/* Rating badge — opposite corner */}
          {averageRating != null && (
            <span
              dir="ltr"
              className={`absolute inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-black/60 px-2.5 py-1.5 text-[10px] font-black text-gold-300 backdrop-blur-sm ${
                isNew || hasOffer ? 'top-12 left-3' : 'top-3 left-3'
              }`}
            >
              <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
              <span className="text-white/90">{averageRating}</span>
              <span className="font-medium text-white/60">({reviewCount})</span>
            </span>
          )}

          {/* NEW — iridescent glass pill */}
          {isNew && <NewBadge />}

          {/* OFFER ribbon — slanted corner flag with percentage */}
          {hasOffer && (
            <>
              {/* diagonal ribbon */}
              <div className="absolute -left-12 top-4 z-10 w-36 -rotate-45 bg-gradient-to-l from-rose-600 to-red-500 py-1 text-center shadow-lg shadow-red-900/40">
                <span className="text-[11px] font-black tracking-wide text-white">
                  خصم {rawPercent}%
                </span>
              </div>
              {/* expiry chip pinned to the cover bottom */}
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-bold text-rose-200 border border-rose-400/30 backdrop-blur-sm">
                <Flame className="h-3 w-3 text-rose-400" />
                <OfferDeadline endIso={course.discountEndsAt!} />
              </span>
            </>
          )}
        </div>
      </Link>

      {/* ─── Body ──────────────────────────────────────────────────── */}
      <div className="flex grow flex-col p-4 text-right sm:p-5">
        {/* Title under the image — primary color */}
        <Link
          to={`/courses/${course.id}`}
          className="block"
          onMouseEnter={() => prefetchCourse(course.id)}
          onFocus={() => prefetchCourse(course.id)}
        >
          <h2 className="line-clamp-2 min-h-[2.75rem] text-base font-black leading-snug text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--primary)] sm:text-lg">
            {course.title}
          </h2>
        </Link>

        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-relaxed text-[var(--ink-muted)]">{course.description}</p>

        <div className="mt-3 flex min-h-8 flex-wrap items-center gap-1.5">
          {/* نوع الوصول: باقة محددة بوقت أو دروس للأبد */}
          {course.accessType === 'LIMITED' ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-bold text-violet-400 transition-colors hover:bg-violet-500/20"
              title="باقة محددة بوقت — ينتهي الاشتراك بعد المدة المحددة"
            >
              <Timer className="h-3.5 w-3.5 shrink-0" />
              باقة {course.durationMonths ?? '—'} شهر
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
              title="وصول دائم للكورس"
            >
              <InfinityIcon className="h-3.5 w-3.5 shrink-0" />
              للأبد
            </span>
          )}
          <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-alt)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--ink-muted)]" title="الفئة المستهدفة">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]/60" />
            <span className="truncate">{audience}</span>
          </span>
          {typeof course._count?.lessons === 'number' && course._count.lessons > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-alt)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--ink-muted)]">
              <Layers className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]/50" />
              {course._count.lessons} درس
            </span>
          )}
        </div>

        {/* Price strip — shows old price struck-through + saved chip when on offer */}
        <div
          className={`mt-3 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 ${
            hasOffer
              ? 'border-rose-400/30 bg-gradient-to-l from-rose-500/10 via-[var(--surface-alt)] to-transparent hover:border-rose-400/50'
              : 'border-[var(--primary)]/20 bg-[var(--primary)]/5'
          }`}
        >
          {hasOffer ? (
            <span className="inline-flex flex-col items-start gap-0.5">
              <span className="text-[10px] font-bold text-rose-400">عرض لفترة محدودة</span>
              <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-black text-rose-300 border border-rose-400/20">
                وفّر {Math.round(rawPercent)}%
              </span>
            </span>
          ) : (
            <span className="text-sm font-medium text-[var(--ink-muted)]">سعر الكورس</span>
          )}
          <CoursePrice
            price={offeredPrice}
            originalPrice={hasOffer ? listPrice : null}
            isFree={course.isFree}
            size="md"
          />
        </div>

        {/* Teacher */}
        <Link to={`/courses/${course.id}`} className="mt-3 block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">
              {course.teacher?.photoUrl ? (
                <img src={course.teacher.photoUrl} alt={course.teacher.fullName} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                course.teacher?.fullName?.[0] || <UserRound className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold" style={{ color: 'var(--ink)' }}>{course.teacher?.fullName || 'فريق المنصة'}</p>
              <p className="truncate text-[10px]" style={{ color: 'var(--ink-muted)' }}>{course.teacher?.specialization || 'مدرس الكورس'}</p>
            </div>
          </div>
        </Link>

        {/* ─── CTA footer — buttons under image & info, always visible ── */}
        <div className="mt-auto border-t border-[var(--line)] pt-3">
          <div className="grid grid-cols-2 gap-2.5">{children}</div>
        </div>
      </div>
    </article>
  );
};

/**
 * Memoized: a grid/slider re-renders only the cards whose `course`
 * object actually changed, instead of every card on any parent state tick.
 */
export const CourseCard = React.memo(CourseCardBase);
