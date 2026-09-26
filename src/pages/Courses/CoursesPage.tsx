import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BookOpen,
  Check,
  X,
  SlidersHorizontal,
  Star,
  ChevronDown,
  ChevronLeft,
  Wallet,
  GraduationCap,
  ArrowDown,
  Layers,
  Library,
  LayoutGrid,
  Gift,
  Clock,
  Infinity as InfinityIcon,
  Timer,
  RefreshCw,
} from "lucide-react";
import { useCoursesQuery } from "../../hooks/queries/useCourses";
import { taxonomyApi } from "../../api/taxonomy.api";
import { formatGradeLevel } from "../../lib/utils";
import type {
  EducationSystem,
  EducationalStage,
  Grade,
  Subject,
  Track,
} from "../../types/taxonomy.types";
import { BundlesSection } from "../../components/courses/BundlesSection";
import { AddToCartButton } from "../../components/cart/AddToCartButton";
import { showGuestCartToast } from "../../components/cart/GuestCartToast";
import { useAuthStore } from "../../store/authStore";
import { useEnrollFreeCourseMutation } from "../../hooks/mutations/useCourseMutations";
import { GradeLevel } from "../../types/auth.types";
import { Course } from "../../types/course.types";
import { Button } from "../../components/ui/Button";
import { Skeleton, SkeletonCourseCard } from "../../components/ui/Skeleton";
import { CourseCard } from "../../components/courses/CourseCard";
import { useGsapStaggerReveal } from "../../lib/useGsapReveal";
import { toast } from "sonner";

const QUICK_SUBJECT_COUNT = 5;

const mobileSelectClass =
  "w-full appearance-none bg-bg-soft border border-line text-ink text-xs rounded-xl px-3 py-2.5 outline-none focus:border-primary cursor-pointer disabled:opacity-50";

/** Compact system → stage → grade cascade used inside the mobile filter sheet.
 *  Same taxonomy data as the desktop tree, condensed into three selects. */
const MobileStagePicker: React.FC<{
  systems: EducationSystem[];
  gradeIdParam: string;
  stageIdParam: string;
  selectedGradeName: string;
  onSelectGrade: (
    gradeId: string | null,
    name?: string,
    stageId?: string
  ) => void;
  onSelectStage: (stageId: string | null, name?: string) => void;
  onClearStageFilter: () => void;
}> = ({
  systems,
  gradeIdParam,
  stageIdParam,
  selectedGradeName,
  onSelectGrade,
  onSelectStage,
  onClearStageFilter,
}) => {
  const [systemId, setSystemId] = useState("");

  // Reflect a stage arriving via URL even before the user touches the selects
  const stageFromUrl = systems
    .flatMap((s) => s.stages ?? [])
    .find((st) => st.id === stageIdParam);
  const effectiveSystemId = systemId || stageFromUrl?.educationSystemId || "";
  const stages = systems.find((s) => s.id === effectiveSystemId)?.stages ?? [];

  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ["taxonomy-grades", stageIdParam],
    queryFn: () => taxonomyApi.listGrades(stageIdParam),
    enabled: !!stageIdParam,
    staleTime: 1000 * 60 * 30,
  });

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        value={effectiveSystemId}
        onChange={(e) => {
          setSystemId(e.target.value);
          // single update — sequential updateParams calls read stale params
          if (stageIdParam || gradeIdParam) onClearStageFilter();
        }}
        className={mobileSelectClass}
        disabled={!systems.length}
      >
        <option value="">النظام…</option>
        {systems.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <select
        value={stageIdParam}
        onChange={(e) => {
          const sid = e.target.value;
          const st = stages.find((x) => x.id === sid);
          onSelectStage(sid || null, st?.name);
        }}
        className={mobileSelectClass}
        disabled={!effectiveSystemId}
      >
        <option value="">المرحلة…</option>
        {stages.map((st) => (
          <option key={st.id} value={st.id}>
            {st.name}
          </option>
        ))}
      </select>

      <select
        value={gradeIdParam}
        onChange={(e) => {
          const g = grades.find((x) => x.id === e.target.value);
          onSelectGrade(
            e.target.value || null,
            g?.name,
            stageIdParam || undefined
          );
        }}
        className={mobileSelectClass}
        disabled={!stageIdParam || gradesLoading}
      >
        <option value="">
          {!stageIdParam
            ? "اختر…"
            : gradesLoading
            ? "تحميل…"
            : gradeIdParam && selectedGradeName
            ? selectedGradeName
            : "كل الصفوف"}
        </option>
        {grades.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </div>
  );
};

type PriceType = "all" | "free" | "paid" | "enrolled" | "mine";

const PRICE_TYPE_META: Record<
  PriceType,
  { label: string; icon: React.ReactNode }
> = {
  all: { label: "الكل", icon: <LayoutGrid className="h-4 w-4" /> },
  free: { label: "مجاني", icon: <Gift className="h-4 w-4" /> },
  paid: { label: "مدفوع", icon: <Wallet className="h-4 w-4" /> },
  enrolled: { label: "مشترك بها", icon: <GraduationCap className="h-4 w-4" /> },
  mine: { label: "كورساتي", icon: <Library className="h-4 w-4" /> },
};

/* ═══════════════════════════════════════════════════════════════════
   Filter sub-components — defined at MODULE scope so their identity is
   stable across renders. Inline definitions caused React to unmount and
   remount the whole sidebar on every keystroke/filter change, which
   cancelled open/close animations and made sections feel "stuck".
   ═══════════════════════════════════════════════════════════════════ */

/** Accordion section — controlled open state via props */
const SidebarSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  open: boolean;
  active?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ icon, title, open, active, onToggle, children }) => (
  <div className="border-b border-line last:border-b-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="group w-full cursor-pointer select-none items-center justify-between px-5 py-4 transition-colors duration-300 hover:bg-bg-soft lg:flex"
    >
      <span className="flex items-center gap-2.5 text-xs font-black tracking-wide text-primary">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-300 group-hover:scale-110 ${
            open || active
              ? "bg-primary border-primary text-white"
              : "bg-primary-soft border-primary/20 text-primary"
          }`}
        >
          {icon}
        </span>
        {title}
      </span>
      <span className="flex items-center gap-2">
        {/* pulsing dot while this section has an applied filter */}
        {active && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-navy opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-navy" />
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-ink-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </span>
    </button>
    {/* Smooth height + opacity animation; content slides slightly */}
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div
          className={`px-5 pb-4 pt-1 transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "-translate-y-2"
          }`}
          aria-hidden={!open}
        >
          {children}
        </div>
      </div>
    </div>
  </div>
);

/** Radio-style option row */
const OptionRow: React.FC<{
  active: boolean;
  label: string;
  onClick: () => void;
  suffix?: React.ReactNode;
}> = ({ active, label, onClick, suffix }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group/opt flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-px ${
      active
        ? "border border-primary/40 bg-primary-soft text-primary shadow-[0_2px_8px_rgba(13,33,55,0.12)]"
        : "border border-transparent bg-bg-soft text-ink-muted hover:border-line hover:bg-surface-alt hover:text-ink"
    }`}
  >
    <span className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-md border transition-all duration-200 ${
          active
            ? "scale-110 border-primary bg-primary"
            : "border-line bg-white"
        }`}
      >
        {active && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
      </span>
      {label}
    </span>
    {suffix}
  </button>
);

/** Grades of one stage, fetched lazily */
const StageGrades: React.FC<{
  stageId: string;
  selectedGradeId: string;
  stageOnlyActive?: boolean;
  onSelect: (gradeId: string | null, name?: string) => void;
  onSelectStageOnly: () => void;
}> = ({
  stageId,
  selectedGradeId,
  stageOnlyActive,
  onSelect,
  onSelectStageOnly,
}) => {
  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ["taxonomy-grades", stageId],
    queryFn: () => taxonomyApi.listGrades(stageId),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <div className="space-y-1.5 py-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <OptionRow
        active={!!stageOnlyActive && !selectedGradeId}
        label="كل صفوف المرحلة"
        onClick={onSelectStageOnly}
      />
      {grades.map((g) => (
        <OptionRow
          key={g.id}
          active={selectedGradeId === g.id}
          label={g.name}
          onClick={() =>
            onSelect(selectedGradeId === g.id ? null : g.id, g.name)
          }
          suffix={
            <span className="text-[10px] font-bold text-ink-muted">
              {g.hasTracks ? `${(g.tracks ?? []).length} شُعب` : ""}
            </span>
          }
        />
      ))}
    </div>
  );
};

/** Type selector — 2-col icon cards */
const PriceTypeGrid: React.FC<{
  current: PriceType;
  visibleTypes: PriceType[];
  onChange: (t: PriceType) => void;
}> = ({ current, visibleTypes, onChange }) => (
  <div className="grid grid-cols-2 gap-2">
    {visibleTypes.map((t) => {
      const meta = PRICE_TYPE_META[t];
      const active = current === t;
      return (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-pressed={active}
          className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 ${
            active
              ? "border-primary bg-primary text-white shadow-[0_2px_8px_rgba(13,33,55,0.18)]"
              : "border-line bg-bg-soft text-ink-muted hover:border-primary/40 hover:text-ink"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              active ? "bg-white/20 text-white" : "bg-primary-soft text-primary"
            }`}
          >
            {meta.icon}
          </span>
          {meta.label}
        </button>
      );
    })}
  </div>
);

/** System → stage → grade picker with independent, always-responsive toggles.
 *  Each stage keeps its own open flag so opening one never blocks closing it. */
const StagePicker: React.FC<{
  systems: EducationSystem[];
  openSystemId: string | null;
  openStageIds: Record<string, boolean>;
  gradeIdParam: string;
  stageIdParam: string;
  gradeLevelParam: string;
  selectedGradeName: string;
  onToggleSystem: (id: string) => void;
  onToggleStage: (id: string) => void;
  onSelectGrade: (
    gradeId: string | null,
    name?: string,
    stageId?: string
  ) => void;
  onSelectStage: (stageId: string | null, name?: string) => void;
  onClearLegacyGrade: () => void;
}> = ({
  systems,
  openSystemId,
  openStageIds,
  gradeIdParam,
  stageIdParam,
  gradeLevelParam,
  selectedGradeName,
  onToggleSystem,
  onToggleStage,
  onSelectGrade,
  onSelectStage,
  onClearLegacyGrade,
}) => {
  const activeStageName = systems
    .flatMap((s) => s.stages ?? [])
    .find((st) => st.id === stageIdParam)?.name;

  return (
    <div className="space-y-3">
      {/* Current selection — always visible, one-tap clear */}
      {(gradeIdParam || gradeLevelParam || stageIdParam) && (
        <button
          type="button"
          onClick={onClearLegacyGrade}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl bg-primary-soft px-3 py-2.5 text-xs font-bold text-primary ring-1 ring-primary/40 transition-all hover:bg-primary/15"
        >
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            {selectedGradeName ||
              (!gradeIdParam && activeStageName) ||
              formatGradeLevel(gradeLevelParam) ||
              "مرحلة محددة"}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold">
            مسح <X className="h-3 w-3" strokeWidth={3} />
          </span>
        </button>
      )}

      {systems.map((sys: EducationSystem) => {
        const sysOpen = openSystemId === sys.id;
        return (
          <div
            key={sys.id}
            className="overflow-hidden rounded-xl border border-line bg-bg-soft"
          >
            {/* System header — click anywhere toggles */}
            <button
              type="button"
              onClick={() => onToggleSystem(sys.id)}
              aria-expanded={sysOpen}
              className={`flex w-full cursor-pointer select-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold transition-colors ${
                sysOpen
                  ? "bg-primary text-white"
                  : "text-ink hover:bg-surface-alt"
              }`}
            >
              <span className="flex items-center gap-2">
                <GraduationCap
                  className={`h-4 w-4 ${
                    sysOpen ? "text-white" : "text-primary"
                  }`}
                />
                {sys.name}
                <span
                  className={`text-[9px] font-semibold ${
                    sysOpen ? "text-white/70" : "text-ink-muted"
                  }`}
                >
                  {(sys.stages ?? []).length} مرحلة
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  sysOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Stages — AnimatePresence height animation */}
            <AnimatePresence initial={false}>
              {sysOpen && (
                <motion.div
                  key="stages"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 border-t border-line p-2">
                    {(sys.stages ?? []).map((stage) => {
                      const stageOpen = !!openStageIds[stage.id];
                      const stageActive = stageIdParam === stage.id;
                      return (
                        <div key={stage.id}>
                          <div className="flex items-stretch gap-1">
                            {/* Stage name — applies the stage filter AND expands grades */}
                            <button
                              type="button"
                              onClick={() => {
                                const applying = !stageActive;
                                onSelectStage(
                                  applying ? stage.id : null,
                                  stage.name
                                );
                                if (applying && !stageOpen)
                                  onToggleStage(stage.id);
                              }}
                              className={`flex-1 cursor-pointer select-none truncate rounded-lg px-3 py-2 text-start text-xs font-semibold transition-colors ${
                                stageActive
                                  ? "bg-primary text-white"
                                  : stageOpen
                                  ? "bg-primary-soft text-primary"
                                  : "text-ink-muted hover:bg-surface-alt hover:text-ink"
                              }`}
                            >
                              {stage.name}
                            </button>
                            {/* Chevron — expands/collapses the grade list only */}
                            <button
                              type="button"
                              onClick={() => onToggleStage(stage.id)}
                              aria-expanded={stageOpen}
                              aria-label="عرض الصفوف"
                              className={`flex w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                                stageOpen
                                  ? "text-primary hover:bg-surface-alt"
                                  : "text-ink-muted hover:bg-surface-alt hover:text-ink"
                              }`}
                            >
                              <ChevronLeft
                                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                  stageOpen ? "-rotate-90" : ""
                                }`}
                              />
                            </button>
                          </div>
                          <AnimatePresence initial={false}>
                            {stageOpen && (
                              <motion.div
                                key="grades"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="overflow-hidden"
                              >
                                <div className="pt-1">
                                  <StageGrades
                                    stageId={stage.id}
                                    selectedGradeId={gradeIdParam}
                                    stageOnlyActive={stageActive}
                                    onSelect={(gid, gname) =>
                                      onSelectGrade(gid, gname, stage.id)
                                    }
                                    onSelectStageOnly={() =>
                                      onSelectStage(stage.id, stage.name)
                                    }
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

/** Always-visible study-stage picker — every DB stage in one dropdown.
 *  Selecting a stage filters immediately; grades narrow further. */
const StageLevelPicker: React.FC<{
  stages: EducationalStage[];
  stageIdParam: string;
  onSelect: (stageId: string | null, name?: string) => void;
}> = ({ stages, stageIdParam, onSelect }) => (
  <div className="relative">
    <Layers className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/50" />
    <select
      value={stageIdParam}
      disabled={stages.length === 0}
      onChange={(e) => {
        const sid = e.target.value;
        const st = stages.find((x) => x.id === sid);
        onSelect(sid || null, st?.name);
      }}
      aria-label="اختر المرحلة الدراسية"
      className="w-full cursor-pointer  appearance-none rounded-xl border border-dashed border-line bg-transparent py-2 pe-3 ps-9 text-xs font-medium text-ink-muted outline-none transition-all duration-200 hover:border-primary/40 focus:border-primary focus:text-ink focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
    >
      <option value="">اختر المرحلة الدراسية…</option>
      {stages.map((st) => (
        <option key={st.id} value={st.id}>
          {st.name}
        </option>
      ))}
    </select>
  </div>
);

/** Track (شعبة) picker — علمي علوم / علمي رياضة / أدبي options of the
 *  currently selected grade. Disabled until a grade is chosen. */
const TrackPicker: React.FC<{
  tracks: Track[];
  gradeSelected: boolean;
  trackIdParam: string;
  onSelect: (trackId: string | null) => void;
}> = ({ tracks, gradeSelected, trackIdParam, onSelect }) => (
  <div className="relative">
    <Layers className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/50" />
    <select
      value={trackIdParam}
      disabled={!gradeSelected}
      onChange={(e) => onSelect(e.target.value || null)}
      aria-label="اختر الشعبة"
      className="w-full cursor-pointer appearance-none rounded-xl border border-dashed border-line bg-transparent py-2 pe-3 ps-9 text-xs font-medium text-ink-muted outline-none transition-all duration-200 hover:border-primary/40 focus:border-primary focus:text-ink focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
    >
      <option value="">
        {gradeSelected ? "كل الشُعب" : "اختر الصف أولاً…"}
      </option>
      {tracks.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  </div>
);

/* ═══════════════════ PAGE ═══════════════════ */

export const CoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFiltersOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileFiltersOpen]);

  const gradeLevel = (searchParams.get("gradeLevel") as GradeLevel) || "";
  const stageIdParam = searchParams.get("stageId") || "";
  const gradeIdParam = searchParams.get("gradeId") || "";
  const trackIdParam = searchParams.get("trackId") || "";
  const subjectParam = searchParams.get("subject") || "";
  const subjectIdParam = searchParams.get("subjectId") || "";
  const isFreeParam = searchParams.get("isFree");
  const enrolledOnlyParam = searchParams.get("enrolledOnly");
  const mineParam = searchParams.get("mine");
  const accessTypeParam = searchParams.get("accessType");
  const sort = (searchParams.get("sort") as any) || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const isFree =
    isFreeParam === "true" ? true : isFreeParam === "false" ? false : undefined;
  const enrolledOnly = enrolledOnlyParam === "true";
  const mine = mineParam === "true";
  const minRatingParam = searchParams.get("minRating");

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;
  const isStudent = user?.role === "STUDENT";
  const isTeacher = user?.role === "TEACHER";

  // ─── URL helpers ─────────────────────────────────────────────────
  const updateParams = (
    mutate: (params: URLSearchParams) => void,
    resetPage = true
  ) => {
    const params = new URLSearchParams(searchParams);
    mutate(params);
    if (resetPage) params.set("page", "1");
    setSearchParams(params);
  };

  // Debounce search input by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      updateParams((p) => {
        if (searchTerm) p.set("search", searchTerm);
        else p.delete("search");
      });
    }, 400);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const { data: coursesData, isLoading, isError, isFetching, refetch } = useCoursesQuery({
    search: debouncedSearch,
    gradeLevel: gradeLevel || undefined,
    isFree,
    sort,
    page,
    limit: 9,
    status: "PUBLISHED",
    ...(subjectParam && { subject: subjectParam }),
    ...(subjectIdParam && { subjectId: subjectIdParam }),
    ...(enrolledOnly && isStudent && { enrolledOnly: true }),
    ...(mineParam && isTeacher && { mine: true }),
    ...(accessTypeParam === "LIFETIME" || accessTypeParam === "LIMITED"
      ? { accessType: accessTypeParam as "LIFETIME" | "LIMITED" }
      : {}),
    ...(minRatingParam && { minRating: Number(minRatingParam) }),
    ...(gradeIdParam && { gradeId: gradeIdParam }),
    ...(stageIdParam && { stageId: stageIdParam }),
    ...(trackIdParam && { trackId: trackIdParam }),
  });

  // ─── Taxonomy ──────────────────────────────────────────────────────
  const { data: systems = [] } = useQuery({
    queryKey: ["taxonomy-systems"],
    queryFn: taxonomyApi.listSystems,
    staleTime: 1000 * 60 * 30,
  });

  /** Flat list of every stage across all systems — feeds the grade-level dropdown */
  const allStages: EducationalStage[] = React.useMemo(
    () => systems.flatMap((s) => s.stages ?? []),
    [systems]
  );

  // Subjects — ALWAYS show the full catalog from the DB. When a grade is
  // selected, its SubjectAssignment subjects are merged in first (ordered),
  // but every other DB subject stays visible so nothing is missing from the filter.
  const { data: allSubjects = [] } = useQuery({
    queryKey: ["taxonomy-subjects"],
    queryFn: taxonomyApi.listSubjects,
    staleTime: 1000 * 60 * 30,
  });
  const { data: gradeScopedSubjects = [], isLoading: gradeSubjectsLoading } =
    useQuery({
      queryKey: ["taxonomy-grade-subjects", gradeIdParam],
      queryFn: () => taxonomyApi.listGradeSubjects(gradeIdParam),
      enabled: !!gradeIdParam,
      staleTime: 1000 * 60 * 30,
    });
  const activeSubjects = React.useMemo<Subject[]>(() => {
    if (!gradeIdParam) return allSubjects;
    const seen = new Set<string>();
    const merged: Subject[] = [];
    for (const s of [...gradeScopedSubjects, ...allSubjects]) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      merged.push(s);
    }
    return merged;
  }, [gradeIdParam, gradeScopedSubjects, allSubjects]);

  /** Display name for the currently applied subject filter (id- or legacy-text-based) */
  const activeSubjectLabel =
    (subjectIdParam &&
      allSubjects.find((s) => s.id === subjectIdParam)?.name) ||
    subjectParam ||
    "";

  const [selectedGradeName, setSelectedGradeName] = useState("");
  const [selectedStageName, setSelectedStageName] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    type: true,
  });
  // One system open at a time; stages tracked independently per id so any
  // stage can be opened/closed freely without affecting the others.
  const [openSystemId, setOpenSystemId] = useState<string | null>(null);
  const [openStageIds, setOpenStageIds] = useState<Record<string, boolean>>({});

  // Auto-open the first system once taxonomy loads
  useEffect(() => {
    if (systems.length > 0 && !openSystemId) setOpenSystemId(systems[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systems]);

  // Auto-expand the filtered stage's grade list AND its parent system so
  // grades are always visible after picking a stage from the dropdown.
  useEffect(() => {
    if (!stageIdParam) return;
    setOpenStageIds((p) =>
      p[stageIdParam] ? p : { ...p, [stageIdParam]: true }
    );
    const parent = systems.find((s) =>
      (s.stages ?? []).some((st) => st.id === stageIdParam)
    );
    if (parent) setOpenSystemId(parent.id);
  }, [stageIdParam, systems]);

  /** Tracks (شُعب) of the currently selected grade — علمي/أدبي etc. */
  const { data: gradeTracks = [] } = useQuery<Track[]>({
    queryKey: ["taxonomy-tracks", gradeIdParam],
    queryFn: () => taxonomyApi.listTracks(gradeIdParam),
    enabled: !!gradeIdParam,
    staleTime: 1000 * 60 * 30,
  });

  const courses: Course[] = Array.isArray(coursesData?.data)
    ? coursesData.data
    : Array.isArray(coursesData?.courses)
    ? coursesData.courses
    : Array.isArray(coursesData)
    ? (coursesData as Course[])
    : [];
  const meta = coursesData?.meta || {
    totalPages: 1,
    total: courses.length,
    page: 1,
    limit: 9,
  };

  const navigate = useNavigate();
  const { mutate: enrollFree, isPending: isEnrollingFree } =
    useEnrollFreeCourseMutation();

  const requireAuth = () => {
    toast.warning("يجب تسجيل الدخول أولاً", {
      description: "سجّل دخولك عشان تقدر تضيف الكورس أو تشترك فيه يا بطل!",
      action: {
        label: "تسجيل الدخول",
        onClick: () => navigate("/auth/login"),
      },
      duration: 5000,
    });
  };

  // ─── Filter handlers ─────────────────────────────────────────────
  /** Selecting a STAGE filters immediately (stageId); grades narrow it further */
  const handleStageSelect = (sid: string | null, name?: string) =>
    updateParams((p) => {
      if (sid) {
        p.set("stageId", sid);
        // a grade/track from a previously selected stage is no longer valid
        p.delete("gradeId");
        p.delete("trackId");
        setSelectedGradeName("");
        setSelectedStageName(name ?? "");
      } else {
        p.delete("stageId");
        p.delete("trackId");
        setSelectedStageName("");
      }
    });

  const handleTrackChange = (tid: string | null) =>
    updateParams((p) => {
      if (tid) p.set("trackId", tid);
      else p.delete("trackId");
    });

  const handleTaxonomyGradeSelect = (
    gradeId: string | null,
    name?: string,
    sid?: string
  ) =>
    updateParams((p) => {
      if (gradeId) {
        p.set("gradeId", gradeId);
        p.delete("gradeLevel");
        // a track from a previously selected grade is no longer valid
        p.delete("trackId");
        if (sid) p.set("stageId", sid);
        setSelectedGradeName(name ?? "");
      } else {
        p.delete("gradeId");
        p.delete("trackId");
        setSelectedGradeName("");
      }
    });

  const handleGradeChange = (newGrade: string) =>
    updateParams((p) => {
      if (newGrade) p.set("gradeLevel", newGrade);
      else p.delete("gradeLevel");
    });

  /** Clears BOTH grade filter keys in ONE update — two sequential
   *  updateParams calls would each read the same stale searchParams,
   *  so the second setSearchParams silently overwrote the first and
   *  the gradeId key survived (chip could never be dismissed). */
  const handleClearStageFilter = () =>
    updateParams((p) => {
      p.delete("gradeId");
      p.delete("gradeLevel");
      p.delete("stageId");
      p.delete("trackId");
      setSelectedStageName("");
    });

  const scrollToCatalog = () =>
    document
      .getElementById("catalog")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  /** Pick a quick-subject chip in the hero → filter + glide to the catalog */
  const handleQuickSubject = (subjectId: string) => {
    const next = subjectId === subjectIdParam ? "" : subjectId;
    updateParams((p) => {
      if (next) {
        p.set("subjectId", next);
        p.delete("subject");
      } else {
        p.delete("subjectId");
      }
    });
    if (next) setTimeout(scrollToCatalog, 120);
  };

  /** DB-driven subject filter — stores the Subject UUID, never a name */
  const handleSubjectChange = (newSubjectId: string) =>
    updateParams((p) => {
      if (newSubjectId && newSubjectId !== subjectIdParam) {
        p.set("subjectId", newSubjectId);
        p.delete("subject");
      } else {
        p.delete("subjectId");
        p.delete("subject");
      }
    });

  const handleTypeChange = (type: PriceType) => {
    updateParams((p) => {
      if (type === "free") p.set("isFree", "true");
      else if (type === "paid") p.set("isFree", "false");
      else p.delete("isFree");

      if (type === "enrolled") p.set("enrolledOnly", "true");
      else p.delete("enrolledOnly");
      if (type === "enrolled") p.delete("isFree");

      if (type === "mine") p.set("mine", "true");
      else p.delete("mine");
    });
  };

  const currentPriceType: PriceType = mine
    ? "mine"
    : enrolledOnly
    ? "enrolled"
    : isFree === true
    ? "free"
    : isFree === false
    ? "paid"
    : "all";

  const visiblePriceTypes: PriceType[] = [
    "all",
    ...(enrolledOnly ? [] : (["free", "paid"] as PriceType[])),
    ...(isStudent ? (["enrolled"] as PriceType[]) : []),
    ...(isTeacher ? (["mine"] as PriceType[]) : []),
  ];

  const handleAccessTypeChange = (value: "" | "LIFETIME" | "LIMITED") =>
    updateParams((p) => {
      if (value) p.set("accessType", value);
      else p.delete("accessType");
    });

  const handleSortChange = (newSort: string) =>
    updateParams((p) => {
      if (newSort && newSort !== "newest") p.set("sort", newSort);
      else p.delete("sort");
    });

  const handleMinRatingChange = (value: string) =>
    updateParams((p) => {
      if (value) p.set("minRating", value);
      else p.delete("minRating");
    });

  const clearAllFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedGradeName("");
    const params = new URLSearchParams();
    if (sort !== "newest") params.set("sort", sort);
    params.set("page", "1");
    setSearchParams(params);
  };

  // ─── Active filter tags ────────────────────────────────────────────
  const activeTags: { key: string; label: string; remove: () => void }[] = [];
  if (debouncedSearch)
    activeTags.push({
      key: "search",
      label: `بحث: ${debouncedSearch}`,
      remove: () => setSearchTerm(""),
    });
  if (stageIdParam && !gradeIdParam) {
    const stageLabel =
      selectedStageName ||
      systems
        .flatMap((s) => s.stages ?? [])
        .find((st) => st.id === stageIdParam)?.name ||
      "مرحلة دراسية";
    activeTags.push({
      key: "stageId",
      label: stageLabel,
      remove: () => handleStageSelect(null),
    });
  }
  if (trackIdParam)
    activeTags.push({
      key: "trackId",
      label: gradeTracks.find((t) => t.id === trackIdParam)?.name ?? "شعبة",
      remove: () => handleTrackChange(""),
    });
  if (gradeLevel)
    activeTags.push({
      key: "gradeLevel",
      label: formatGradeLevel(gradeLevel),
      remove: () => handleGradeChange(""),
    });
  if ((subjectIdParam || subjectParam) && activeSubjectLabel)
    activeTags.push({
      key: "subject",
      label: activeSubjectLabel,
      remove: () => handleSubjectChange(""),
    });
  if (isFree === true)
    activeTags.push({
      key: "isFree",
      label: "مجاني",
      remove: () => handleTypeChange("all"),
    });
  if (isFree === false)
    activeTags.push({
      key: "isFree",
      label: "مدفوع",
      remove: () => handleTypeChange("all"),
    });
  if (enrolledOnly)
    activeTags.push({
      key: "enrolledOnly",
      label: "مشترك بها",
      remove: () => handleTypeChange("all"),
    });
  if (mine)
    activeTags.push({
      key: "mine",
      label: "كورساتي",
      remove: () => handleTypeChange("all"),
    });
  if (accessTypeParam === "LIFETIME")
    activeTags.push({
      key: "accessType",
      label: "دروس للأبد",
      remove: () => handleAccessTypeChange(""),
    });
  if (accessTypeParam === "LIMITED")
    activeTags.push({
      key: "accessType",
      label: "باقة محددة",
      remove: () => handleAccessTypeChange(""),
    });
  if (minRatingParam)
    activeTags.push({
      key: "minRating",
      label: `من ${minRatingParam} نجوم فأكثر`,
      remove: () => handleMinRatingChange(""),
    });

  const activeFilterCount = activeTags.length;

  const coursesKey = courses.map((c) => c.id).join(",");
  const gridRef = useGsapStaggerReveal<HTMLDivElement>([coursesKey], {
    y: 14,
    duration: 0.4,
    stagger: 0.05,
  });

  // ─── Shared pill styles ────────────────────────────────────────────
  const pillBase =
    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer";
  const pillActive =
    "bg-primary text-white font-bold shadow-[0_2px_8px_rgba(13,33,55,0.18)] -translate-y-0.5";
  const pillInactive =
    "bg-surface-alt text-ink-muted hover:text-ink border border-line hover:border-primary/30 hover:-translate-y-0.5";

  const SORT_OPTIONS = [
    { v: "newest", l: "الأحدث أولاً" },
    { v: "popular", l: "الأكثر طلباً" },
    { v: "price_asc", l: "السعر: الأقل أولاً" },
    { v: "price_desc", l: "السعر: الأعلى أولاً" },
    { v: "rating", l: "الأعلى تقييماً" },
  ];

  /** All finer filters — reused inside the mobile bottom sheet */
  const renderFilterControls = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
          <Wallet className="w-3.5 h-3.5" /> النوع
        </p>
        <PriceTypeGrid
          current={currentPriceType}
          visibleTypes={visiblePriceTypes}
          onChange={handleTypeChange}
        />
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
          <Timer className="w-3.5 h-3.5" /> نوع الوصول
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              {
                v: "",
                label: "الكل",
                icon: <LayoutGrid className="h-3.5 w-3.5" />,
              },
              {
                v: "LIFETIME",
                label: "للأبد",
                icon: <InfinityIcon className="h-3.5 w-3.5" />,
              },
              {
                v: "LIMITED",
                label: "باقة",
                icon: <Timer className="h-3.5 w-3.5" />,
              },
            ] as const
          ).map(({ v, label, icon }) => {
            const active = (accessTypeParam || "") === v;
            return (
              <button
                key={v || "all"}
                onClick={() =>
                  handleAccessTypeChange(
                    active ? "" : (v as "" | "LIFETIME" | "LIMITED")
                  )
                }
                className={`${pillBase} ${active ? pillActive : pillInactive}`}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-gold-400">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> التقييم
        </p>
        <div className="flex flex-wrap gap-2">
          {[5, 4, 3].map((n) => {
            const active = Number(minRatingParam) === n;
            return (
              <button
                key={n}
                onClick={() => handleMinRatingChange(active ? "" : String(n))}
                className={`${pillBase} ${active ? pillActive : pillInactive}`}
              >
                <span className="flex items-center gap-1 text-amber-300">
                  {n}
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  فأكثر
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold text-primary">الترتيب</p>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.v}
              onClick={() => handleSortChange(o.v)}
              className={`${pillBase} ${
                sort === o.v ? pillActive : pillInactive
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary font-amira">
          <Layers className="w-3.5 h-3.5" /> المرحلة الدراسية
        </p>
        <StageLevelPicker
          stages={allStages}
          stageIdParam={stageIdParam}
          onSelect={handleStageSelect}
        />
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary font-amira">
          <Layers className="w-3.5 h-3.5" />الشعبة
        </p>
        <TrackPicker
          tracks={gradeTracks}
          gradeSelected={!!gradeIdParam}
          trackIdParam={trackIdParam}
          onSelect={handleTrackChange}
        />
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-primary font-amira">
          <GraduationCap className="w-3.5 h-3.5" /> المرحلة والمادة
        </p>
        <MobileStagePicker
          systems={systems}
          gradeIdParam={gradeIdParam}
          stageIdParam={stageIdParam}
          selectedGradeName={selectedGradeName}
          onSelectGrade={(gid, name) => {
            handleTaxonomyGradeSelect(gid, name);
            if (!gid) setSelectedGradeName("");
            else if (name) setSelectedGradeName(name);
          }}
          onSelectStage={handleStageSelect}
          onClearStageFilter={handleClearStageFilter}
        />
        <select
          value={subjectIdParam}
          onChange={(e) => handleSubjectChange(e.target.value)}
          disabled={gradeSubjectsLoading}
          className={`${mobileSelectClass} mt-2`}
        >
          <option value="">
            {gradeSubjectsLoading ? "جاري تحميل المواد…" : "كل المواد"}
          </option>
          {activeSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const heroVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };
  const heroItem = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <div>
      {/* ═══════════ HERO — transparent, body grid shows through ═══════════ */}
      <section className="relative overflow-hidden">
        {/* concentric dashed circles (top-left) */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 text-primary/15"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle
            cx="100"
            cy="100"
            r="92"
            stroke="currentColor"
            strokeDasharray="6 10"
          />
          <circle
            cx="100"
            cy="100"
            r="62"
            stroke="currentColor"
            strokeDasharray="4 8"
          />
          <circle cx="100" cy="100" r="32" stroke="currentColor" />
          <circle cx="100" cy="8" r="4" fill="var(--secondary)" opacity="0.5" />
        </svg>

        {/* floating plus-signs (top-right) */}
        <motion.svg
          aria-hidden
          className="pointer-events-none absolute top-16 right-[10%] hidden h-24 w-24 text-secondary/30 lg:block"
          viewBox="0 0 96 96"
          fill="none"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          {[
            [16, 16],
            [64, 28],
            [40, 64],
          ].map(([x, y]) => (
            <path
              key={`${x}-${y}`}
              d={`M${x} ${y + 7} v-14 M${x - 7} ${y} h14`}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
        </motion.svg>

        {/* wavy line (bottom-right) */}
        <svg
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-[6%] hidden h-10 w-64 text-primary/20 lg:block"
          viewBox="0 0 260 24"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M2 14 Q 22 2, 42 14 T 82 14 T 122 14 T 162 14 T 202 14 T 242 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="252" cy="14" r="3.5" fill="currentColor" />
        </svg>

        {/* dotted triangle + accent (bottom-left) */}
        <motion.svg
          aria-hidden
          className="pointer-events-none absolute bottom-16 left-[8%] hidden h-28 w-28 text-primary/15 lg:block"
          viewBox="0 0 112 112"
          fill="none"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) =>
              col <= row ? (
                <circle
                  key={`${row}-${col}`}
                  cx={26 + col * 30 - row * 15}
                  cy={22 + row * 26}
                  r="3"
                  fill="currentColor"
                />
              ) : null
            )
          )}
          <path
            d="M78 84 l14-10 v20 z"
            fill="var(--secondary)"
            opacity="0.45"
          />
        </motion.svg>

        {/* open book (right edge) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-[4%] top-[38%] hidden lg:block"
          animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="64"
            height="52"
            viewBox="0 0 64 52"
            fill="none"
            className="text-primary opacity-25"
          >
            <path
              d="M32 10 C26 4, 14 4, 6 8 V42 C14 38, 26 38, 32 44 C38 38, 50 38, 58 42 V8 C50 4, 38 4, 32 10 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M32 10 V44"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M12 16 H24 M12 24 H22 M40 16 H52 M42 24 H52"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        </motion.div>

        {/* pencil (left edge, tilted) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[5%] top-[30%] hidden lg:block"
          animate={{ y: [0, -10, 0], rotate: [0, -6, 0] }}
          transition={{
            duration: 9,
            delay: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            className="-rotate-12 text-[var(--color-navy-900)] opacity-20"
          >
            <rect
              x="22"
              y="6"
              width="12"
              height="32"
              rx="2"
              transform="rotate(45 28 22)"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M13.5 42.5 L11 45 L14.8 46.8 Z"
              fill="var(--secondary)"
              opacity="0.55"
            />
            <path
              d="M36 14 l6 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* fountain pen (bottom-center-left) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-[18%] left-[26%] hidden lg:block"
          animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
          transition={{
            duration: 7.5,
            delay: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            className="rotate-45 text-primary opacity-20"
          >
            <path
              d="M30 6 L38 22 L34 40 H26 L22 22 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle
              cx="30"
              cy="30"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M27 40 L30 54 L33 40"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        {/* magnifier / search (top-center-left) */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[30%] top-[14%] hidden lg:block"
          animate={{ y: [0, -9, 0], rotate: [0, 8, 0] }}
          transition={{
            duration: 6.5,
            delay: 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            className="text-[var(--color-navy-900)] opacity-20"
          >
            <circle
              cx="20"
              cy="20"
              r="12"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              d="M29 29 L40 40"
              stroke="var(--secondary)"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M15 17 a6 6 0 0 1 5 -3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        </motion.div>

        {/* curved doodle arrow pointing to the search bar */}
        <motion.svg
          aria-hidden
          className="pointer-events-none absolute right-[31%] top-[21%] hidden h-16 w-20 text-primary opacity-30 lg:block"
          viewBox="0 0 80 60"
          fill="none"
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 5.5,
            delay: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path
            d="M70 8 C 48 14, 30 26, 18 46"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 7"
          />
          <path
            d="M26 38 L17 49 L12 36"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>

        {/* straight doodle arrow (bottom-right area) */}
        <motion.svg
          aria-hidden
          className="pointer-events-none absolute bottom-[24%] right-[20%] hidden h-12 w-24 text-secondary opacity-30 lg:block"
          viewBox="0 0 96 40"
          fill="none"
          animate={{ x: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M92 20 H10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="4 6"
          />
          <path
            d="M20 10 L8 20 L20 30"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>

        {/* Content — split hero: text (right) + image composition (left) */}
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* ─── Text column ─── */}
            <div className="space-y-7 text-center lg:text-right">
              <motion.div
                variants={heroItem}
                className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft px-4 py-2 text-xs font-bold text-primary font-sst"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-navy opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-navy" />
                </span>
                ابحث عن كورساتك التي تريدها - ثم انطلق وحقق هدفك
              </motion.div>

              <motion.h1
                variants={heroItem}
                className="font-amira text-5xl font-black leading-[1.7] text-ink tracking-tight"
              >
                اكتشف الكورس
                <span className="block font-amira text-primary font-black mt-1">
                  اللي يحقق هدفك
                </span>
              </motion.h1>

              <motion.p
                variants={heroItem}
                className="mx-auto max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base lg:mx-0 font-sst"
              >
                شروحات مفصلة، امتحانات تفاعلية، وملفات قابلة للمراجعة في أي وقت
                — فلتر بالمرحلة والمادة وابدأ من أول درس النهاردة.
              </motion.p>

              {/* Giant search bar */}
              <motion.div variants={heroItem} className="w-full">
                <div className="group relative max-w-xl mx-auto lg:mx-0">
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/50 transition-colors group-focus-within:text-primary">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث عن كورس… مثال: رياضيات، فيزياء، الصف الثالث الثانوي"
                    className="w-full rounded-2xl border border-line bg-white py-4 pe-14 ps-14 text-sm font-medium text-ink shadow-[0_2px_10px_rgba(13,33,55,0.06)] outline-none transition-all duration-300 placeholder:font-normal placeholder:text-ink-muted focus:border-primary focus:bg-white focus:shadow-[0_0_0_5px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      aria-label="مسح البحث"
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-bg-soft p-1.5 text-ink-muted transition-all hover:rotate-90 hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Quick subject chips — top subjects from the DB */}
              <motion.div
                variants={heroItem}
                className="flex flex-wrap items-center justify-center gap-2 lg:justify-start"
              >
                <span className="text-[11px] font-bold text-ink-muted">
                  الأكثر بحثاً:
                </span>
                {allSubjects.slice(0, QUICK_SUBJECT_COUNT).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleQuickSubject(s.id)}
                    className={`${pillBase} ${
                      subjectIdParam === s.id ? pillActive : pillInactive
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </motion.div>

              {/* Live stats strip */}
              <motion.div
                variants={heroItem}
                className="grid grid-cols-3 divide-x divide-x-reverse divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_10px_rgba(13,33,55,0.06)]"
              >
                {[
                  {
                    icon: Library,
                    value: meta.total ?? courses.length,
                    label: "كورس متاح",
                  },
                  {
                    icon: BookOpen,
                    value: allSubjects.length || "—",
                    label: "مادة دراسية",
                  },
                  {
                    icon: Layers,
                    value:
                      systems.reduce(
                        (a: number, s: EducationSystem) =>
                          a + (s.stages ?? []).length,
                        0
                      ) || "—",
                    label: "مرحلة وصف",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-1 px-4 py-4 sm:px-8"
                  >
                    <stat.icon className="mb-1 h-4 w-4 text-secondary" />
                    <span className="font-display text-xl font-black text-ink sm:text-2xl">
                      {isLoading ? "…" : stat.value}
                    </span>
                    <span className="whitespace-nowrap text-[10px] font-bold text-ink-muted">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ─── Image composition (course-page.png) ─── */}
            <motion.div
              variants={heroItem}
              className="relative mx-auto w-full max-w-md lg:max-w-none"
            >
              {/* static soft radial glow behind the frame (no filter blur) */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-10 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, color-mix(in srgb, var(--primary) 16%, transparent), transparent)",
                }}
              />
              {/* dashed ring peeking from the top-left corner */}
              <svg
                aria-hidden
                viewBox="0 0 120 120"
                fill="none"
                className="absolute -top-7 -left-7 h-28 w-28 text-primary/25"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="6 9"
                />
              </svg>
              {/* secondary accent dot bottom-right */}
              <svg
                aria-hidden
                viewBox="0 0 60 60"
                fill="none"
                className="absolute -bottom-6 -right-6 h-20 w-20 text-secondary/40"
              >
                <circle
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 8"
                />
                <circle cx="30" cy="6" r="4" fill="currentColor" />
              </svg>

              {/* framed image */}
              <div className="relative overflow-hidden">
                {/* object-position kept toward the top so the cropped
                    bottom of the artwork stays out of frame */}
                <img
                  src="/image/course-page.png"
                  alt="منصة الكورسات التعليمية"
                  width={1024}
                  height={1024}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="aspect-square w-full object-cover object-top"
                />
                {/* Blend the artwork into the active theme surface. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
                  style={{
                    background:
                      "linear-gradient(to top, var(--surface), color-mix(in srgb, var(--surface) 85%, transparent), transparent)",
                  }}
                />
                {/* hairline inner highlight */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[color-mix(in_srgb,var(--ink)_18%,transparent)]"
                />
              </div>

              {/* floating chip — courses count (top-left of frame) */}
              <motion.div
                aria-hidden
                className="absolute -top-5 -left-3 sm:-left-6"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="flex items-center gap-2 rounded-2xl border border-line bg-[var(--surface)] px-3.5 py-2.5 shadow-[0_6px_20px_-10px_rgba(13,33,55,0.35)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-[var(--on-primary)]">
                    <Library className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-black leading-none text-ink">
                      +{meta.total ?? courses.length}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-ink-muted">
                      كورس متاح
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* floating chip — rating (bottom-right of frame) */}
              <motion.div
                aria-hidden
                className="absolute -bottom-6 right-6"
                animate={{ y: [0, 9, 0] }}
                transition={{
                  duration: 7.5,
                  delay: 0.9,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="flex items-center gap-2 rounded-2xl border border-line bg-[var(--surface)] px-3.5 py-2.5 shadow-[0_6px_20px_-10px_rgba(13,33,55,0.35)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-black leading-none text-ink">
                      تعلّم باحتراف
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-ink-muted">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{" "}
                      منصة المنهج المصري
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll cue — centered under both columns */}
          <motion.button
            variants={heroItem}
            onClick={scrollToCatalog}
            aria-label="انتقل إلى الكورسات"
            className="mx-auto mt-14 flex h-11 w-11 animate-bounce cursor-pointer items-center justify-center rounded-full border border-primary/25 bg-[var(--surface)] text-primary transition-colors hover:bg-primary-soft"
          >
            <ArrowDown className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </section>

      {/* ═══════════ CATALOG ═══════════ */}
      <div
        id="catalog"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 pt-4 sm:px-6 lg:px-8"
      >
        <BundlesSection />

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* ═══ SIDEBAR ════════════════════════════════════════════ */}
          <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
            <div className="overflow-hidden rounded-2xl border border-line bg-[var(--surface)] shadow-sm">
              {/* Sidebar head */}
              <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                    <SlidersHorizontal className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-black text-ink">
                      خصّص نتائجك
                    </h3>
                    <p className="text-[10px] font-semibold text-ink-muted">
                      {activeFilterCount > 0
                        ? `${activeFilterCount} فلتر مطبق`
                        : "خصّص نتائجك"}
                    </p>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-rose-500 text-white px-2.5 py-1.5 text-[10px] font-black transition-all hover:scale-105 hover:bg-primary/15"
                  >
                    مسح الكل
                    <X className="h-3 w-3" strokeWidth={3} />
                  </button>
                )}
              </div>

              <SidebarSection
                icon={<Layers className="h-3.5 w-3.5" strokeWidth={2.2} />}
                title="المرحلة الدراسية"
                open={openSections.category ?? false}
                active={!!(stageIdParam || gradeIdParam || gradeLevel)}
                onToggle={() =>
                  setOpenSections((p) => ({
                    ...p,
                    category: !(p.category ?? false),
                  }))
                }
              >
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-ink-muted">
                    حدّد مرحلتك الدراسية لتظهر الكورسات المناسبة لك
                  </p>
                  <StagePicker
                    systems={systems}
                    openSystemId={openSystemId}
                    openStageIds={openStageIds}
                    gradeIdParam={gradeIdParam}
                    stageIdParam={stageIdParam}
                    gradeLevelParam={gradeLevel}
                    selectedGradeName={selectedGradeName}
                    onToggleSystem={(id) =>
                      setOpenSystemId((cur) => (cur === id ? null : id))
                    }
                    onToggleStage={(id) =>
                      setOpenStageIds((p) => ({ ...p, [id]: !p[id] }))
                    }
                    onSelectGrade={handleTaxonomyGradeSelect}
                    onSelectStage={handleStageSelect}
                    onClearLegacyGrade={handleClearStageFilter}
                  />
                </div>
              </SidebarSection>

              <SidebarSection
                icon={<Layers className="h-3.5 w-3.5" strokeWidth={2.2} />}
                title="الشعبة"
                open={openSections.track ?? true}
                active={!!trackIdParam}
                onToggle={() =>
                  setOpenSections((p) => ({ ...p, track: !(p.track ?? true) }))
                }
              >
                <div className="space-y-1.5">
                  <TrackPicker
                    tracks={gradeTracks}
                    gradeSelected={!!gradeIdParam}
                    trackIdParam={trackIdParam}
                    onSelect={handleTrackChange}
                  />
                  {!gradeIdParam && (
                    <p className="text-[10px] font-bold text-ink-muted">
                      اختر الصف من قسم المرحلة الدراسية لعرض الشُعب
                    </p>
                  )}
                </div>
              </SidebarSection>

              <SidebarSection
                icon={<BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />}
                title="المادة الدراسية"
                open={openSections.subject ?? false}
                active={!!(subjectIdParam || subjectParam)}
                onToggle={() =>
                  setOpenSections((p) => ({
                    ...p,
                    subject: !(p.subject ?? false),
                  }))
                }
              >
                <div className="space-y-1.5">
                  {gradeIdParam && (
                    <p className="pb-1 text-[10px] font-bold text-ink-muted">
                      مواد الصف المحدد أولاً — ثم باقي المواد
                    </p>
                  )}
                  {activeSubjects.slice(0, 8).map((s) => (
                    <OptionRow
                      key={s.id}
                      active={subjectIdParam === s.id}
                      label={s.name}
                      onClick={() =>
                        handleSubjectChange(subjectIdParam === s.id ? "" : s.id)
                      }
                    />
                  ))}
                  {!gradeSubjectsLoading && activeSubjects.length === 0 && (
                    <p className="py-2 text-[11px] text-ink-muted">
                      جاري تحميل المواد…
                    </p>
                  )}
                  <div className="relative pt-1">
                    <BookOpen className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/50" />
                    <select
                      value={
                        subjectIdParam &&
                        !activeSubjects
                          .slice(0, 8)
                          .some((s) => s.id === subjectIdParam)
                          ? subjectIdParam
                          : ""
                      }
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      aria-label="فلترة بالمادة"
                      className="w-full cursor-pointer appearance-none rounded-xl border border-dashed border-line bg-transparent py-2 pe-3 ps-9 text-xs font-medium text-ink-muted outline-none transition-all duration-200 hover:border-primary/40 focus:border-primary focus:text-ink focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
                    >
                      <option value="">مواد أخرى…</option>
                      {activeSubjects.slice(8).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      {subjectIdParam &&
                        !activeSubjects
                          .slice(0, 8)
                          .some((s) => s.id === subjectIdParam) && (
                          <option value={subjectIdParam}>
                            {allSubjects.find((s) => s.id === subjectIdParam)
                              ?.name ?? "مادة محددة"}
                          </option>
                        )}
                    </select>
                  </div>
                </div>
              </SidebarSection>

              <SidebarSection
                icon={<Wallet className="h-3.5 w-3.5" strokeWidth={2.2} />}
                title="نوع الاشتراك"
                open={openSections.type ?? false}
                active={currentPriceType !== "all"}
                onToggle={() =>
                  setOpenSections((p) => ({ ...p, type: !(p.type ?? false) }))
                }
              >
                <PriceTypeGrid
                  current={currentPriceType}
                  visibleTypes={visiblePriceTypes}
                  onChange={handleTypeChange}
                />
              </SidebarSection>

              <SidebarSection
                icon={
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                }
                title="التقييم"
                open={openSections.rating ?? false}
                active={!!minRatingParam}
                onToggle={() =>
                  setOpenSections((p) => ({
                    ...p,
                    rating: !(p.rating ?? false),
                  }))
                }
              >
                <div className="flex flex-wrap gap-2">
                  {[5, 4, 3].map((n) => {
                    const active = Number(minRatingParam) === n;
                    return (
                      <button
                        key={n}
                        onClick={() =>
                          handleMinRatingChange(active ? "" : String(n))
                        }
                        className={`${pillBase} ${
                          active ? pillActive : pillInactive
                        }`}
                      >
                        <span className="flex items-center gap-1 text-amber-300">
                          {n}
                          <Star
                            className={`h-3 w-3 fill-amber-400 text-amber-400`}
                          />
                          فأكثر
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SidebarSection>

              {/* Results footer */}
              <div className="flex items-center justify-between bg-bg-soft px-5 py-3.5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-muted">
                  <Library className="h-3.5 w-3.5 text-primary/70" />
                  {isLoading ? "جاري العد…" : `${meta.total} كورس متاح`}
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="cursor-pointer text-[11px] font-bold text-error transition-colors hover:opacity-75"
                  >
                    إعادة تعيين
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* ═══ MAIN ═══════════════════════════════════════════════ */}
          <main className="min-w-0 space-y-5">
            {/* Results toolbar */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-[0_2px_10px_rgba(13,33,55,0.06)]">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-xs font-medium text-ink-muted transition-all hover:-translate-y-px hover:text-ink lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                الفلاتر
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <p className="hidden items-center gap-2 font-display text-xs font-bold text-ink sm:flex">
                <span className="text-lg font-black text-primary">
                  {meta.total}
                </span>
                نتيجة
              </p>

              <span className="flex-1" />

              <div className="group relative">
                <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/50 transition-colors group-focus-within:text-primary" />
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  aria-label="ترتيب النتائج"
                  className="cursor-pointer appearance-none rounded-xl border border-line bg-bg-soft py-2.5 pe-8 ps-9 text-xs font-medium text-ink outline-none transition-all duration-200 hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.l}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              </div>
            </div>

            {/* Desktop quick filters: common choices stay one click away, while
                the sidebar retains the detailed taxonomy and rating controls. */}
            <div className="hidden items-center gap-3 rounded-2xl border border-line bg-[var(--surface)] p-3 shadow-[0_2px_10px_rgba(13,33,55,0.05)] lg:flex">
              <div className="flex shrink-0 items-center gap-2 border-l border-line pl-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-black text-ink">تصفية سريعة</p>
                  <p className="text-[10px] font-medium text-ink-muted">نتائج أدق بخطوة</p>
                </div>
              </div>

              <select
                value={stageIdParam}
                onChange={(e) => {
                  const stage = allStages.find((item) => item.id === e.target.value);
                  handleStageSelect(e.target.value || null, stage?.name);
                }}
                aria-label="اختر المرحلة الدراسية"
                className="min-w-36 cursor-pointer appearance-none rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-xs font-semibold text-ink outline-none transition-all hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)]"
              >
                <option value="">كل المراحل</option>
                {allStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
              </select>

              <select
                value={subjectIdParam}
                onChange={(e) => handleSubjectChange(e.target.value)}
                disabled={gradeSubjectsLoading}
                aria-label="اختر المادة الدراسية"
                className="min-w-36 cursor-pointer appearance-none rounded-xl border border-line bg-bg-soft px-3 py-2.5 text-xs font-semibold text-ink outline-none transition-all hover:border-primary/40 focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)] disabled:cursor-wait disabled:opacity-60"
              >
                <option value="">{gradeSubjectsLoading ? 'جاري تحميل المواد…' : 'كل المواد'}</option>
                {activeSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>

              <div className="flex items-center gap-1 rounded-xl bg-bg-soft p-1" aria-label="نوع الاشتراك">
                {(['all', 'free', 'paid'] as PriceType[]).map((type) => {
                  const labels: Record<string, string> = { all: 'الكل', free: 'مجاني', paid: 'مدفوع' };
                  const active = currentPriceType === type;
                  return <button key={type} onClick={() => handleTypeChange(type)} className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${active ? 'bg-white text-primary shadow-sm' : 'text-ink-muted hover:text-ink'}`}>{labels[type]}</button>;
                })}
              </div>

              {activeFilterCount > 0 && <button onClick={clearAllFilters} className="mr-auto cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-black text-error transition-colors hover:bg-rose-500/10">إعادة تعيين</button>}
            </div>

            {/* Active filter tags strip */}
            {activeFilterCount > 0 && (
              <div
                className="flex flex-wrap items-center gap-2"
                style={{ animation: "fadeScaleIn .3s ease-out both" }}
              >
                {activeTags.map((tag) => (
                  <span
                    key={tag.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft py-1 pl-3 pr-2 text-xs font-semibold text-primary transition-transform hover:-translate-y-px"
                  >
                    {tag.label}
                    <button
                      onClick={tag.remove}
                      aria-label={`إزالة فلتر ${tag.label}`}
                      className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-primary/15"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="mr-1 cursor-pointer text-[11px] font-bold bg-rose-500 rounded-full px-2.5 py-1.5 text-white underline-offset-4 transition-colors hover:text-error hover:underline"
                >
                  مسح الكل
                </button>
              </div>
            )}

            {/* Courses grid */}
            <div className="min-h-[38rem]">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonCourseCard key={i} />
                  ))}
                </div>
              ) : isError ? (
                <div className="space-y-4 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center shadow-[0_2px_10px_rgba(13,33,55,0.06)] sm:p-16">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                    <Library className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink">تعذّر تحميل الكورسات الآن</h3>
                  <p className="mx-auto max-w-md text-xs leading-6 text-ink-muted">
                    تحقق من اتصالك ثم أعد المحاولة. لا تحتاج لتحديث الصفحة بالكامل.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isFetching}
                    onClick={() => void refetch()}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              ) : courses.length === 0 ? (
                <div
                  key={coursesKey}
                  style={{ animation: "fadeScaleIn .35s ease-out both" }}
                  className="space-y-4 rounded-3xl border border-line bg-[var(--surface)] p-16 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <BookOpen className="h-8 w-8 opacity-60" />
                  </div>
                  <h3 className="flex items-center justify-center gap-2 font-display text-lg font-bold text-ink">
                    <Search className="h-5 w-5 text-primary/70" />
                    لا توجد كورسات مطابقة لبحثك
                  </h3>
                  <span
                    aria-hidden
                    className="mx-auto block h-1 w-20 rounded-full bg-gradient-to-l from-secondary to-primary"
                  />
                  <p className="mx-auto max-w-sm text-xs text-ink-muted">
                    جرب تغيير معايير البحث أو الفلترة لعرض نتائج أخرى.
                  </p>
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    إعادة تعيين الفلاتر
                  </Button>
                </div>
              ) : (
                <div
                  ref={gridRef}
                  className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 2xl:grid-cols-3"
                >
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course}>
                      {/* Action button — filled / prominent */}
                      {course.isOwner ? (
                        <Link to="/dashboard/courses" className="contents">
                          <Button
                            size="md"
                            variant="accent"
                            className="w-full !rounded-xl !py-2.5 !text-xs"
                            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                          >
                            إدارة الكورس
                          </Button>
                        </Link>
                      ) : course.enrollmentStatus === "PENDING" ? (
                        <Button
                          size="md"
                          variant="outline"
                          disabled
                          className="w-full !rounded-xl !py-2.5 !text-xs cursor-not-allowed opacity-80"
                          leftIcon={<Clock className="h-4 w-4" />}
                        >
                          بانتظار المراجعة
                        </Button>
                      ) : course.isEnrolled ||
                        course.enrollmentStatus === "ACTIVE" ? (
                        <Link to={`/courses/${course.id}`} className="contents">
                          <Button
                            size="md"
                            variant="primary"
                            className="w-full !rounded-xl !py-2.5 !text-xs !bg-emerald-600 !border-emerald-600 !text-white hover:!bg-emerald-700"
                            leftIcon={<GraduationCap className="h-4 w-4" />}
                          >
                            استكمل التعلم
                          </Button>
                        </Link>
                      ) : course.isFree ? (
                        <Button
                          size="md"
                          variant="primary"
                          isLoading={isEnrollingFree}
                          onClick={() => {
                            if (!isAuthenticated) {
                              showGuestCartToast({
                                title: course.title,
                                thumbnailUrl: course.thumbnailUrl,
                              });
                              return;
                            }
                            enrollFree(course.id);
                          }}
                          className="w-full !rounded-xl !py-2.5 !text-xs"
                        >
                          ابدأ التعلم مجاناً
                        </Button>
                      ) : (
                        <AddToCartButton course={course} fullWidth />
                      )}

                      {/* Details link — #FFF1 glass/outline always */}
                      <Link to={`/courses/${course.id}`} className="contents">
                        <Button
                          variant="outline"
                          size="md"
                          className="w-full !rounded-xl !py-2.5 !text-xs"
                          leftIcon={<BookOpen className="h-4 w-4" />}
                        >
                          عرض التفاصيل
                        </Button>
                      </Link>
                    </CourseCard>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrevPage}
                  onClick={() =>
                    updateParams((p) => p.set("page", String(page - 1)), false)
                  }
                >
                  السابق
                </Button>

                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => {
                        updateParams((pr) => pr.set("page", String(p)), false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`h-9 w-9 cursor-pointer rounded-lg text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                        page === p
                          ? "bg-primary text-white shadow-[0_2px_8px_rgba(13,33,55,0.18)]"
                          : "border border-line bg-white text-ink-muted hover:bg-bg-soft hover:text-ink"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() =>
                    updateParams((p) => p.set("page", String(page + 1)), false)
                  }
                >
                  التالي
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* A portal prevents the sheet from sitting behind the sticky app chrome. */}
      {mobileFiltersOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-filters-title"
          >
            <button
              type="button"
              aria-label="إغلاق الفلاتر"
              className="absolute inset-0 cursor-default bg-black/55"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div
              className="absolute bottom-0 left-0 right-0 flex max-h-[min(82dvh,46rem)] flex-col overflow-hidden rounded-t-3xl border-x border-t border-line bg-[var(--surface)] shadow-[0_-18px_50px_rgba(0,0,0,0.28)]"
              style={{ animation: "slide-up-sheet .25s ease-out both" }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h3
                    id="mobile-filters-title"
                    className="flex items-center gap-1.5 font-display text-lg font-bold text-primary"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    الفلاتر
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium text-ink-muted">
                    {activeFilterCount > 0 ? `${activeFilterCount} فلتر مطبّق` : 'اختر ما يناسبك ثم اعرض النتائج'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="إغلاق الفلاتر"
                  className="cursor-pointer rounded-full bg-bg-soft p-2 text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
                {renderFilterControls()}
              </div>

              <div className="flex gap-2 border-t border-line bg-[var(--surface)] px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    className="shrink-0"
                    onClick={clearAllFilters}
                  >
                    إعادة تعيين
                  </Button>
                )}
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  عرض {meta.total} نتيجة
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
