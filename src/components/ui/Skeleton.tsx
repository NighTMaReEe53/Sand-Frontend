import React from 'react';
import { cn } from '../../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/** Base shimmering block — combine with the shape presets below per page. */
export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'skeleton-sweep animate-pulse rounded-md relative overflow-hidden',
        className
      )}
      style={{
        backgroundColor: 'var(--surface-alt)',
        border: '1px solid var(--line)',
      }}
      {...props}
    />
  );
};

/** A rounded text line — pass w-* / h-* per line */
export const SkeletonText: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <Skeleton className={cn('h-3 rounded-full', className)} {...props} />
);

/** Circular avatar / icon placeholder */
export const SkeletonCircle: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <Skeleton className={cn('rounded-full shrink-0', className)} {...props} />
);

/** Horizontal pill chip (filters, meta badges) */
export const SkeletonPill: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <Skeleton className={cn('h-7 w-20 rounded-full', className)} {...props} />
);

/* ─── Page-shaped presets ─────────────────────────────────────────── */

/** Course-card shape: cover, title lines, chips row, price strip, teacher row */
export const SkeletonCourseCard: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'flex h-full flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-card',
      className
    )}
    {...props}
  >
    {/* cover */}
    <Skeleton className="h-48 w-full rounded-none border-0 border-b border-surface-border sm:h-52" />
    <div className="flex flex-col gap-3 p-4 sm:p-5">
      {/* title */}
      <div className="space-y-2">
        <SkeletonText className="h-4 w-11/12" />
        <SkeletonText className="h-4 w-2/3" />
      </div>
      {/* description */}
      <div className="space-y-1.5">
        <SkeletonText className="w-full" />
        <SkeletonText className="w-5/6" />
      </div>
      {/* meta chips */}
      <div className="flex gap-2">
        <SkeletonPill className="h-8 w-24 rounded-lg" />
        <SkeletonPill className="h-8 w-16 rounded-lg" />
        <SkeletonPill className="h-8 w-20 rounded-lg" />
      </div>
      {/* price strip */}
      <Skeleton className="h-12 w-full rounded-xl" />
      {/* teacher row */}
      <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-bg/60 p-3">
        <SkeletonCircle className="h-10 w-10" />
        <div className="flex-1 space-y-1.5">
          <SkeletonText className="w-1/2" />
          <SkeletonText className="w-1/3 !h-2" />
        </div>
      </div>
      {/* CTA buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  </div>
);

/** Dashboard management-row shape: square thumb + title/badge line + stat pills + actions */
export const SkeletonManageRow: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'p-5 rounded-2xl bg-surface-card border border-surface-border flex flex-col gap-4',
      className
    )}
    {...props}
  >
    <div className="flex items-start gap-4">
      <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex items-center gap-3">
          <SkeletonText className="h-4 w-2/5 !rounded-lg" />
          <SkeletonPill className="h-6 w-24" />
        </div>
        <SkeletonPill className="h-8 w-40 !rounded-xl" />
        <div className="flex flex-wrap gap-2">
          <SkeletonPill className="w-28" />
          <SkeletonPill className="w-16" />
          <SkeletonPill className="w-20" />
          <SkeletonPill className="w-24" />
        </div>
      </div>
    </div>
    {/* action buttons row */}
    <div className="flex flex-wrap gap-2 pt-4 border-t border-surface-border">
      <Skeleton className="h-9 w-44 rounded-xl" />
      <Skeleton className="h-9 w-20 rounded-xl" />
      <Skeleton className="h-9 w-24 rounded-xl" />
      <span className="flex-1" />
      <Skeleton className="h-9 w-20 rounded-xl" />
      <Skeleton className="h-9 w-20 rounded-xl" />
    </div>
  </div>
);

/** Payment/enrollment card shape (my-courses): colored bar + icon + lines + button */
export const SkeletonPaymentCard: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'relative flex items-stretch overflow-hidden rounded-2xl bg-surface-card border border-surface-border',
      className
    )}
    {...props}
  >
    {/* side accent bar */}
    <Skeleton className="h-auto w-1.5 shrink-0 rounded-none border-0" />
    <div className="flex flex-1 items-center gap-4 p-4">
      <SkeletonCircle className="h-14 w-14" />
      <div className="flex-1 space-y-2.5 min-w-0">
        <SkeletonText className="h-4 w-1/2 !rounded-lg" />
        <div className="flex gap-2">
          <SkeletonPill className="h-6 w-24" />
          <SkeletonPill className="h-6 w-20" />
        </div>
        <SkeletonText className="w-2/3 !h-2" />
      </div>
      <Skeleton className="h-10 w-28 shrink-0 rounded-xl" />
    </div>
  </div>
);

/** Simple list-row shape (notifications, search results) */
export const SkeletonListRow: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('flex items-center gap-3 p-4', className)} {...props}>
    <SkeletonCircle className="h-10 w-10" />
    <div className="flex-1 space-y-2">
      <SkeletonText className="w-2/5" />
      <SkeletonText className="w-4/5 !h-2" />
    </div>
    <SkeletonText className="w-12 !h-2" />
  </div>
);

/** Full profile-page shape skeleton — mirrors the ProfilePage layout */
export const SkeletonProfilePage: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8', className)} {...props}>
    {/* Hero Card */}
    <div className="rounded-3xl border border-gold-500/10 bg-surface-card p-5 sm:p-8 space-y-6 overflow-hidden relative">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <SkeletonCircle className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shrink-0" />
        {/* Name + meta */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonText className="h-5 w-40 sm:w-56 !rounded-lg" />
            <SkeletonPill className="h-6 w-20" />
          </div>
          <SkeletonText className="h-3 w-32" />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <SkeletonText className="h-3 w-28" />
            <SkeletonText className="h-3 w-40" />
            <SkeletonText className="h-3 w-32" />
          </div>
        </div>
        {/* Action button */}
        <Skeleton className="h-9 w-32 rounded-xl shrink-0 hidden md:block" />
      </div>
    </div>

    {/* Stats Row — 3 cards */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-gold-500/10 bg-surface-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5 flex-1">
              <SkeletonText className="h-6 w-14 !rounded-lg" />
              <SkeletonText className="h-2.5 w-full" />
            </div>
            <Skeleton className="w-10 h-10 rounded-xl shrink-0 mr-2" />
          </div>
        </div>
      ))}
    </div>

    {/* Weekly Report Card (collapsible shape) */}
    <div className="rounded-3xl border border-gold-500/10 bg-surface-card overflow-hidden">
      <div className="flex items-center justify-between p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <SkeletonText className="h-4 w-44 !rounded-lg" />
            <SkeletonText className="h-2.5 w-64" />
          </div>
        </div>
        <Skeleton className="w-5 h-5 rounded-full" />
      </div>
      <div className="px-5 sm:px-6 pb-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>

    {/* Tab Strip */}
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className={`h-10 rounded-xl shrink-0 ${i === 1 ? 'w-24' : i === 2 ? 'w-36' : i === 3 ? 'w-24' : i === 4 ? 'w-28' : 'w-32'}`} />
      ))}
    </div>

    {/* Tab Content: 3 result rows */}
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border border-gold-500/10 bg-surface-card p-4 sm:p-5">
          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2.5 min-w-0">
            <div className="flex gap-2">
              <SkeletonPill className="h-5 w-16" />
              <SkeletonPill className="h-5 w-14" />
            </div>
            <SkeletonText className="h-4 w-2/3 !rounded-lg" />
            <SkeletonText className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="w-16 h-9 rounded-xl shrink-0 hidden sm:block" />
        </div>
      ))}
    </div>
  </div>
);

/** Student Public Profile skeleton — mirrors StudentPublicProfilePage */
export const SkeletonStudentPublicProfile: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('min-h-screen py-10 px-4 max-w-3xl mx-auto space-y-6', className)} {...props}>
    {/* Hero Card */}
    <div className="relative overflow-hidden rounded-3xl border border-gold-500/10 bg-surface-card p-6 sm:p-8 space-y-4">
      <div className="flex items-center gap-6 flex-wrap">
        <SkeletonCircle className="w-24 h-24 rounded-2xl shrink-0" />
        <div className="flex-1 min-w-0 space-y-2.5">
          <SkeletonText className="h-6 w-48 !rounded-lg" />
          <div className="flex items-center gap-3">
            <SkeletonText className="h-3 w-28" />
            <SkeletonText className="h-3 w-24" />
          </div>
          <div className="flex gap-2 pt-1">
            <SkeletonPill className="h-6 w-20" />
            <SkeletonPill className="h-6 w-24" />
          </div>
        </div>
      </div>
    </div>

    {/* 6 Stats Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl border border-gold-500/10 bg-surface-card p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between">
            <SkeletonText className="h-3 w-16" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
          <SkeletonText className="h-7 w-20 !rounded-lg" />
        </div>
      ))}
    </div>

    {/* Recent exams / activity */}
    <div className="rounded-3xl border border-gold-500/10 bg-surface-card p-6 space-y-4">
      <SkeletonText className="h-5 w-36 !rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-surface-border">
            <div className="space-y-1.5">
              <SkeletonText className="h-4 w-40" />
              <SkeletonText className="h-2.5 w-24" />
            </div>
            <SkeletonPill className="h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Performance Page skeleton — mirrors MyPerformancePage */
export const SkeletonPerformancePage: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8', className)} {...props}>
    {/* Header */}
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-2">
        <SkeletonPill className="h-6 w-24" />
        <SkeletonText className="h-8 w-56 !rounded-xl" />
        <SkeletonText className="h-3.5 w-80" />
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
    </div>

    {/* 4 Stats Cards */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-gold-500/10 bg-surface-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonText className="h-3 w-20" />
            <SkeletonCircle className="w-10 h-10" />
          </div>
          <SkeletonText className="h-7 w-28 !rounded-lg" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>

    {/* Streaks & Badges */}
    <div className="grid md:grid-cols-3 gap-4">
      <div className="p-5 rounded-2xl border border-gold-500/15 bg-surface-card space-y-3">
        <SkeletonText className="h-3 w-28" />
        <SkeletonText className="h-10 w-24 !rounded-xl" />
        <SkeletonText className="h-2.5 w-36" />
      </div>
      <div className="md:col-span-2 p-5 rounded-2xl border border-gold-500/10 bg-surface-card space-y-3">
        <div className="flex justify-between">
          <SkeletonText className="h-3.5 w-24" />
          <SkeletonText className="h-3 w-12" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>

    {/* Periodic Report */}
    <div className="rounded-3xl border border-gold-500/10 bg-surface-card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <SkeletonText className="h-5 w-48 !rounded-lg" />
        <div className="flex gap-2">
          <SkeletonPill className="h-8 w-20" />
          <SkeletonPill className="h-8 w-20" />
        </div>
      </div>
      <Skeleton className="h-52 w-full rounded-2xl" />
    </div>
  </div>
);

/** Summary feed card skeleton */
export const SkeletonSummaryCard: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('rounded-3xl border border-surface-border bg-surface-card p-5 sm:p-6 space-y-4 shadow-sm', className)} {...props}>
    {/* Author row */}
    <div className="flex items-center gap-3">
      <SkeletonCircle className="w-11 h-11" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <SkeletonText className="h-3.5 w-32 !rounded-md" />
          <SkeletonPill className="h-5 w-16" />
        </div>
        <SkeletonText className="h-2.5 w-20" />
      </div>
      <SkeletonPill className="h-6 w-20" />
    </div>

    {/* Content lines */}
    <div className="space-y-2">
      <SkeletonText className="h-5 w-4/5 !rounded-lg" />
      <SkeletonText className="h-3 w-full" />
      <SkeletonText className="h-3 w-3/4" />
    </div>

    {/* Action buttons row */}
    <div className="flex items-center justify-between pt-3 border-t border-surface-border">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-24 rounded-xl" />
    </div>
  </div>
);

/** Leaderboard skeleton — mirrors podium + rank table */
export const SkeletonLeaderboard: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('space-y-8', className)} {...props}>
    {/* Top 3 Podium Diagram */}
    <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonText className="h-5 w-44 !rounded-lg" />
        <SkeletonPill className="h-7 w-28" />
      </div>
      <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-6">
        {/* 2nd place */}
        <div className="flex flex-col items-center gap-2">
          <SkeletonCircle className="w-14 h-14 sm:w-16 sm:h-16" />
          <SkeletonText className="h-3.5 w-20 !rounded-md" />
          <SkeletonText className="h-3 w-14" />
          <Skeleton className="w-full h-28 sm:h-36 rounded-t-2xl" />
        </div>
        {/* 1st place */}
        <div className="flex flex-col items-center gap-2">
          <SkeletonCircle className="w-18 h-18 sm:w-20 sm:h-20" />
          <SkeletonText className="h-4 w-24 !rounded-md" />
          <SkeletonText className="h-3.5 w-16" />
          <Skeleton className="w-full h-36 sm:h-48 rounded-t-2xl" />
        </div>
        {/* 3rd place */}
        <div className="flex flex-col items-center gap-2">
          <SkeletonCircle className="w-12 h-12 sm:w-14 sm:h-14" />
          <SkeletonText className="h-3.5 w-18 !rounded-md" />
          <SkeletonText className="h-3 w-12" />
          <Skeleton className="w-full h-20 sm:h-24 rounded-t-2xl" />
        </div>
      </div>
    </div>
    {/* Rankings Table */}
    <div className="rounded-2xl border border-surface-border bg-surface-card p-5 space-y-3">
      <SkeletonText className="h-4 w-36 mb-2 !rounded-md" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl border border-surface-border/50">
          <Skeleton className="w-7 h-7 rounded-md shrink-0" />
          <SkeletonCircle className="w-10 h-10 shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <SkeletonText className="h-3.5 w-36 !rounded-md" />
            <SkeletonText className="h-2.5 w-24" />
          </div>
          <SkeletonPill className="h-7 w-20 !rounded-md shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

/** Challenge Result Page Skeleton */
export const SkeletonChallengeResult: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8', className)} {...props}>
    {/* Duel Hero Arena */}
    <div className="rounded-[2rem] border border-surface-border bg-surface-card p-6 sm:p-10 space-y-6 text-center">
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <SkeletonCircle className="w-16 h-16 sm:w-20 sm:h-20" />
          <SkeletonText className="h-3.5 w-20 !rounded-md" />
        </div>
        <SkeletonCircle className="w-24 h-24 sm:w-32 sm:h-32" />
        <div className="flex flex-col items-center gap-2">
          <SkeletonCircle className="w-16 h-16 sm:w-20 sm:h-20" />
          <SkeletonText className="h-3.5 w-20 !rounded-md" />
        </div>
      </div>
      <SkeletonText className="h-7 w-56 mx-auto !rounded-xl" />
      <SkeletonText className="h-3.5 w-80 mx-auto" />
      <Skeleton className="h-10 w-72 rounded-2xl mx-auto" />
    </div>

    {/* Head to Head Comparison */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
        <div key={i} className="p-6 rounded-2xl border border-surface-border bg-surface-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <SkeletonText className="h-3.5 w-24 !rounded-md" />
                <SkeletonText className="h-2.5 w-12" />
              </div>
            </div>
            <Skeleton className="h-8 w-14 rounded-lg" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-border">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>

    {/* Questions Review list */}
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <SkeletonText className="h-5 w-48 !rounded-md" />
        <SkeletonPill className="h-8 w-36 !rounded-xl" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-surface-border bg-surface-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonPill className="h-5 w-24" />
                <SkeletonText className="h-4 w-3/4 !rounded-md" />
              </div>
            </div>
            <Skeleton className="w-12 h-6 rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Exam Result Page Skeleton */
export const SkeletonExamResult: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8', className)} {...props}>
    {/* Score summary card */}
    <div className="p-6 sm:p-10 rounded-3xl border border-surface-border bg-surface-card text-center space-y-6">
      <SkeletonCircle className="w-20 h-20 mx-auto" />
      <div className="space-y-2 max-w-sm mx-auto">
        <SkeletonPill className="h-6 w-28 mx-auto" />
        <SkeletonText className="h-7 w-64 mx-auto !rounded-xl" />
        <SkeletonText className="h-3 w-48 mx-auto" />
      </div>
      {/* Circle gauge */}
      <SkeletonCircle className="w-36 h-36 mx-auto" />
      {/* 6 stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-3 rounded-2xl border border-surface-border bg-surface space-y-2">
            <Skeleton className="w-5 h-5 mx-auto rounded" />
            <SkeletonText className="h-4 w-10 mx-auto !rounded" />
            <SkeletonText className="h-2.5 w-14 mx-auto" />
          </div>
        ))}
      </div>
    </div>
    {/* Podium preview skeleton */}
    <div className="rounded-2xl border border-surface-border bg-surface-card p-6 space-y-4">
      <SkeletonText className="h-5 w-48 !rounded-lg" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

/** Exam Rankings Page Skeleton */
export const SkeletonExamRankings: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6 sm:space-y-8', className)} {...props}>
    {/* Header */}
    <div className="rounded-3xl border border-surface-border bg-surface-card p-6 sm:p-8 space-y-3">
      <SkeletonPill className="h-6 w-32" />
      <SkeletonText className="h-8 w-60 !rounded-xl" />
      <SkeletonText className="h-3.5 w-96" />
    </div>
    {/* Filter */}
    <div className="rounded-3xl border border-surface-border bg-surface-card p-5 sm:p-6 space-y-4">
      <SkeletonText className="h-4 w-44 !rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
    {/* Leaderboard content */}
    <SkeletonLeaderboard />
  </div>
);

