import type { CourseTargetRef } from '../types/taxonomy.types';

/**
 * §9.2.1 — One implementation reused everywhere a course is shown.
 * Lists EVERY target distinctly so nothing is hidden:
 * - "{stage} · {grade} · {track}" for each targeted track
 * - "{stage} · {grade}" when a grade has no track (never leaks "null")
 * Distinct grade/track combos are preserved (no collapsing into groups),
 * so the page reflects all selected stages/grades/branches.
 */
export function formatTargets(targets?: CourseTargetRef[] | null): string {
  if (!targets?.length) return '';

  const parts = targets.map((t) => {
    const stageName = t.grade?.stage?.name ?? '';
    const gradeName = t.grade?.name ?? '';
    const base = stageName ? `${stageName} · ${gradeName}` : gradeName;
    return t.track ? `${base} · ${t.track.name}` : base;
  });

  // Dedupe identical combos while preserving order, then join.
  return Array.from(new Set(parts)).join(' ، ');
}
