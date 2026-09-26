import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  BookOpen,
  FileText,
  Play,
  X,
  Loader2,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Flame,
  CornerDownLeft,
} from 'lucide-react';
import { searchApi, GlobalSearchResults } from '../../api/search.api';
import { formatGradeLevel } from '../../lib/utils';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface GlobalSearchBarProps {
  className?: string;
  /** Enable once in the navbar; a separate mobile trigger must not duplicate Ctrl+K. */
  shortcutEnabled?: boolean;
}

const quickSuggestions = [
  'رياضيات',
  'فيزياء',
  'كيمياء',
  'أحياء',
  'لغة عربية',
  'لغة إنجليزية',
  'امتحانات',
];

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  className = '',
  shortcutEnabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollYRef = useRef(0);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 250);

  const { data, isFetching, isError } = useQuery<GlobalSearchResults>({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => searchApi.global(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 1000 * 30,
  });
  const students = data?.students ?? [];

  const hasResults =
    (data?.courses.length ?? 0) > 0 ||
    (data?.lessons.length ?? 0) > 0 ||
    (data?.quizzes?.length ?? 0) > 0 ||
    (data?.exams.length ?? 0) > 0 ||
    (data?.homeworks?.length ?? 0) > 0 ||
    (data?.summaries?.length ?? 0) > 0 ||
    students.length > 0;

  const totalResults =
    (data?.courses.length ?? 0) +
    (data?.lessons.length ?? 0) +
    (data?.quizzes?.length ?? 0) +
    (data?.exams.length ?? 0) +
    (data?.homeworks?.length ?? 0) +
    (data?.summaries?.length ?? 0) +
    students.length;

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shortcutEnabled && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isModalOpen) {
        e.preventDefault();
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, shortcutEnabled]);

  // Lock scroll without causing layout shift — save & restore scroll position
  useEffect(() => {
    if (isModalOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      setTimeout(() => { inputRef.current?.focus(); }, 50);
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo({ top: scrollYRef.current, behavior: 'instant' as ScrollBehavior });
      setQuery('');
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);


  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    setQuery('');
  }, []);

  const handleResultClick = useCallback((url: string) => {
    navigate(url);
    handleClose();
  }, [navigate, handleClose]);

  function highlight(text: string, q: string) {
    const normalizedQuery = q.trim();
    if (!normalizedQuery) return text;
    const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(re);
    return parts.map((part, i) =>
      part.toLocaleLowerCase().includes(normalizedQuery.toLocaleLowerCase()) ? (
        <mark key={i} className="bg-gold-400/25 text-gold-200 rounded px-1 not-italic font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <>
      {/* ── Trigger Icon Button in Navbar ───────────────────────── */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`relative p-2.5 rounded-full border transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--gold-bright)] hover:shadow-gold-glow group ${className}`}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--line)',
          color: 'var(--primary)',
        }}
        title="بحث ذكي في المنصة (Ctrl+K)"
        aria-label="فتح البحث الذكي"
      >
        <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
      </button>

      {/* ── Modal & Backdrop ────────────────────────────────────── */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-12" dir="rtl">
            {/* Backdrop */}
            <div
              onClick={handleClose}
              className="animate-search-backdrop fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Dialog — will-change prevents repaint lag on open */}
            <div
              className="animate-search-modal relative w-full max-w-2xl bg-surface-card border border-surface-border rounded-3xl shadow-md overflow-hidden z-10"
              style={{ willChange: 'transform, opacity', maxHeight: '85vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="البحث الذكي"
            >
              {/* Header / Input Box */}
              <div className="p-4 sm:p-5 border-b border-surface-border/80 bg-surface-card/90 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center shrink-0">
                  {isFetching && query.trim().length >= 2 ? (
                    <Loader2 className="w-5 h-5 text-gold-400 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-gold-400" />
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن أي كورس، درس، أو امتحان..."
                  className="flex-1 bg-transparent text-base sm:text-lg font-medium text-ivory placeholder:text-ivory-muted outline-none min-w-0"
                  autoComplete="off"
                  spellCheck={false}
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-2 rounded-xl text-ivory-muted hover:text-ivory hover:bg-white/5 transition-colors shrink-0"
                    title="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-2.5 py-2 text-xs font-medium text-white hover:text-ivory bg-rose-500 border border-surface-border rounded-xl transition-colors shrink-0"
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Suggestions when query is empty */}
              {query.trim().length < 2 && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs text-ivory-muted font-bold">
                    <Flame className="w-4 h-4 text-gold-400" />
                    <span>عمليات بحث شائعة</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          inputRef.current?.focus();
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface hover:border-gold-400/50 hover:bg-gold-400/5 text-xs text-ivory-muted hover:text-ivory transition-all"
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-surface-border/50 text-xs text-ivory-muted/70 flex items-center justify-between">
                    <span>💡 نصيحة: يمكنك البحث باسم المادة، المدرس، أو عنوان الدرس</span>
                    <span className="flex items-center gap-1 font-mono">
                      <CornerDownLeft className="w-3.5 h-3.5" /> للاختيار
                    </span>
                  </div>
                </div>
              )}

              {/* Results Container */}
              {query.trim().length >= 2 && (
                <div className="max-h-[60vh] overflow-y-auto divide-y divide-surface-border/50 scrollbar-thin">
                  {/* Empty State */}
                  {isError && (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-400/20 flex items-center justify-center">
                        <Search className="w-7 h-7 text-rose-300" />
                      </div>
                      <p className="text-base font-bold text-ivory">تعذر إتمام البحث</p>
                      <p className="text-xs text-ivory-muted max-w-sm">تحقق من الاتصال ثم حاول مرة أخرى.</p>
                    </div>
                  )}

                  {!isError && !isFetching && !hasResults && (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center">
                        <Search className="w-7 h-7 text-ivory-muted/40" />
                      </div>
                      <p className="text-base font-bold text-ivory">لم يتم العثور على نتائج</p>
                      <p className="text-xs text-ivory-muted max-w-sm">
                        لم نجد كورسات أو دروس أو امتحانات تطابق <span className="text-gold-300">"{query}"</span>. جرب البحث بكلمات أخرى.
                      </p>
                    </div>
                  )}

                  {/* 1. Courses Section */}
                  {(data?.courses.length ?? 0) > 0 && (
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="px-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          الكورسات ({data!.courses.length})
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        {data!.courses.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleResultClick(c.url)}
                            className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-gold-400/8 border border-transparent hover:border-gold-400/20 transition-all text-right group cursor-pointer"
                          >
                            {c.thumbnailUrl ? (
                              <img
                                src={c.thumbnailUrl}
                                alt={c.title}
                                className="w-12 h-12 rounded-xl object-cover border border-surface-border shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center shrink-0">
                                <BookOpen className="w-6 h-6 text-gold-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-ivory group-hover:text-gold-300 transition-colors truncate">
                                {highlight(c.title, debouncedQuery)}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-ivory-muted mt-0.5">
                                {c.subject && <span className="truncate">{c.subject}</span>}
                                {c.teacherName && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{c.teacherName}</span>
                                  </>
                                )}
                                {c.isFree && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                    مجاني
                                  </span>
                                )}
                              </div>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-ivory-muted group-hover:text-gold-300 group-hover:-translate-x-1 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Lessons Section */}
                  {(data?.lessons.length ?? 0) > 0 && (
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="px-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5" />
                          الدروس والمحاضرات ({data!.lessons.length})
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        {data!.lessons.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleResultClick(l.url)}
                            className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-sky-400/8 border border-transparent hover:border-sky-400/20 transition-all text-right group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center shrink-0">
                              <Play className="w-5 h-5 text-sky-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-ivory group-hover:text-sky-300 transition-colors truncate">
                                {highlight(l.title, debouncedQuery)}
                              </p>
                              <p className="text-xs text-ivory-muted truncate mt-0.5">
                                في كورس: {l.courseTitle}
                              </p>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-ivory-muted group-hover:text-sky-300 group-hover:-translate-x-1 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Quizzes Section */}
                  {(data?.quizzes?.length ?? 0) > 0 && (
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="px-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          الكويزات القصيرة ({data!.quizzes!.length})
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        {data!.quizzes!.map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => handleResultClick(q.url)}
                            className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-amber-400/8 border border-transparent hover:border-amber-400/20 transition-all text-right group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                              <Sparkles className="w-5 h-5 text-amber-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-ivory group-hover:text-amber-300 transition-colors truncate">
                                {highlight(q.title, debouncedQuery)}
                              </p>
                              <p className="text-xs text-ivory-muted truncate mt-0.5">
                                في درس: {q.lessonTitle} • {q.courseTitle}
                              </p>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-ivory-muted group-hover:text-amber-300 group-hover:-translate-x-1 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Exams Section */}
                  {(data?.exams.length ?? 0) > 0 && (
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="px-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          الامتحانات والتقييمات ({data!.exams.length})
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        {data!.exams.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => handleResultClick(e.url)}
                            className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-violet-400/8 border border-transparent hover:border-violet-400/20 transition-all text-right group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-violet-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-ivory group-hover:text-violet-300 transition-colors truncate">
                                {highlight(e.title, debouncedQuery)}
                              </p>
                              <p className="text-xs text-ivory-muted truncate mt-0.5">
                                في كورس: {e.courseTitle}
                              </p>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-ivory-muted group-hover:text-violet-300 group-hover:-translate-x-1 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Homeworks Section */}
                  {(data?.homeworks?.length ?? 0) > 0 && (
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="px-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          الواجبات والتطبيقات ({data!.homeworks!.length})
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        {data!.homeworks!.map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => handleResultClick(h.url)}
                            className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-cyan-400/8 border border-transparent hover:border-cyan-400/20 transition-all text-right group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-cyan-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-ivory group-hover:text-cyan-300 transition-colors truncate">
                                {highlight(h.title, debouncedQuery)}
                              </p>
                              <p className="text-xs text-ivory-muted truncate mt-0.5">
                                في درس: {h.lessonTitle} • {h.courseTitle}
                              </p>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-ivory-muted group-hover:text-cyan-300 group-hover:-translate-x-1 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. Summaries Section */}
                  {(data?.summaries?.length ?? 0) > 0 && (
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="px-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          الملخصات المعتمدة ({data!.summaries!.length})
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        {data!.summaries!.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleResultClick(s.url)}
                            className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-emerald-400/8 border border-transparent hover:border-emerald-400/20 transition-all text-right group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5 text-emerald-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-ivory group-hover:text-emerald-300 transition-colors truncate">
                                {highlight(s.title, debouncedQuery)}
                              </p>
                              <p className="text-xs text-ivory-muted truncate mt-0.5">
                                بواسطة الطالب: {s.studentName} • {s.courseTitle}
                              </p>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-ivory-muted group-hover:text-emerald-300 group-hover:-translate-x-1 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Students — returned only for teachers and admins */}
                  {students.length > 0 && (
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="px-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5" />
                          الطلاب ({students.length})
                        </span>
                      </div>
                      <div className="grid gap-1.5">
                        {students.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => handleResultClick(student.url)}
                            className="w-full flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-rose-400/8 border border-transparent hover:border-rose-400/20 transition-all text-right group cursor-pointer"
                          >
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-surface-border shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-5 h-5 text-rose-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-ivory group-hover:text-rose-300 transition-colors truncate">
                                {highlight(student.fullName, debouncedQuery)}
                              </p>
                              <p className="text-xs text-ivory-muted truncate mt-0.5">
                                {formatGradeLevel(student.gradeLevel)}
                              </p>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-ivory-muted group-hover:text-rose-300 group-hover:-translate-x-1 transition-all shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer with summary link */}
                  {hasResults && (data?.courses.length ?? 0) > 0 && (
                    <div className="p-3 sm:p-4 bg-surface/60 flex items-center justify-between text-xs">
                      <span className="text-ivory-muted flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                        تم العثور على {totalResults} نتيجة
                      </span>
                      <Link
                        to={`/courses?search=${encodeURIComponent(debouncedQuery)}`}
                        onClick={handleClose}
                        className="text-gold-300 hover:text-gold-200 font-bold transition-colors flex items-center gap-1"
                      >
                        عرض كل الكورسات المطابقة
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
};
