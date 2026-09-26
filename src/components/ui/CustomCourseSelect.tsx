import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, ChevronDown, Search, Sparkles } from 'lucide-react';
import { useCoursesQuery } from '../../hooks/queries/useCourses';
import { Course } from '../../types/course.types';
import { useAuthStore } from '../../store/authStore';

interface CustomCourseSelectProps {
  selectedCourseId?: string | null;
  onSelectCourse: (courseId: string, course: Course) => void;
  className?: string;
  label?: string;
}

export const CustomCourseSelect: React.FC<CustomCourseSelectProps> = ({
  selectedCourseId,
  onSelectCourse,
  className = '',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const user = useAuthStore((state) => state.user);
  const queryParams = React.useMemo(() => {
    // A teacher only ever sees their own courses' Q&A / summaries / materials.
    if (user?.role === 'TEACHER') return { mine: true };
    // A student only sees courses they are actually subscribed to, never the
    // entire catalog — this scopes the QA / Summaries / Leaderboard feeds to
    // "what I'm enrolled in" instead of "everything".
    if (user?.role === 'STUDENT') return { enrolledOnly: true };
    // Admins keep full visibility.
    return {};
  }, [user?.role]);

  const { data, isLoading } = useCoursesQuery(queryParams, true);
  const courses = (data?.courses ?? []) as Course[];

  const activeCourse = courses.find((c) => c.id === selectedCourseId) ?? courses[0] ?? null;

  // Auto-select first course if none selected yet and courses are available
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      onSelectCourse(courses[0].id, courses[0]);
    }
  }, [selectedCourseId, courses, onSelectCourse]);

  // Keep the portal dropdown glued under the trigger (recomputed on open/scroll/resize)
  const computePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.max(rect.width, 280);
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      width,
      zIndex: 1000,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    computePosition();
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, computePosition]);

  // Close on click outside (trigger or dropdown)
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredCourses = courses.filter((c) => {
    const subjectStr = (c as any).subject || (c as any).category?.name || '';
    const q = search.trim().toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      subjectStr.toLowerCase().includes(q)
    );
  });

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="rounded-2xl bg-surface-card border border-surface-border shadow-md p-2 space-y-1.5 max-h-80 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
      style={dropdownStyle}
    >
      {courses.length > 4 && (
        <div className="relative px-1 pb-1.5 border-b border-surface-border/60">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-ivory-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن كورس..."
            className="w-full pr-8 pl-3 py-1.5 text-xs bg-surface border border-surface-border rounded-lg text-ivory placeholder:text-ivory-muted focus:outline-none focus:border-gold-400"
            autoFocus
          />
        </div>
      )}

      <div className="overflow-y-auto space-y-1 max-h-60 custom-scrollbar">
        {filteredCourses.length === 0 ? (
          <div className="py-4 text-center text-xs font-bold text-ivory-muted">لا يوجد كورس مطابق للبحث.</div>
        ) : (
          filteredCourses.map((c) => {
            const isSelected = c.id === (selectedCourseId || activeCourse?.id);
            const itemSubject = (c as any).subject || (c as any).category?.name;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelectCourse(c.id, c);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full flex items-center justify-between gap-3 p-2 rounded-xl text-right transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gold-500/15 border border-gold-500/30 text-gold-300 font-bold'
                    : 'hover:bg-surface text-ivory border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-surface border border-surface-border flex items-center justify-center shrink-0 text-gold-400 overflow-hidden">
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-ivory">{c.title}</p>
                    {itemSubject && <p className="text-[10px] text-ivory-muted font-medium truncate">{itemSubject}</p>}
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-gold-400 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`} dir="rtl">
      {label && (
        <span className="block text-[11px] font-bold text-ivory-muted mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || courses.length === 0}
        className="w-full sm:min-w-[260px] flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-surface border border-surface-border hover:border-gold-500/40 text-right transition-all shadow-sm group focus:outline-none focus:border-gold-400 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 shrink-0 overflow-hidden">
            {activeCourse?.thumbnailUrl ? (
              <img src={activeCourse.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold text-ivory truncate group-hover:text-gold-300 transition-colors">
              {isLoading ? 'جاري التحميل...' : activeCourse ? activeCourse.title : 'لا توجد كورسات'}
            </p>
            {((activeCourse as any)?.subject || (activeCourse as any)?.category?.name) && (
              <p className="text-[10px] text-ivory-muted truncate font-medium">
                {(activeCourse as any).subject || (activeCourse as any).category?.name}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-ivory-muted transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-gold-400' : ''
          }`}
        />
      </button>

      {/* Dropdown rendered in a portal so it always paints above page sections */}
      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
};
