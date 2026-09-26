import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MoonStar, Sunrise, Sunset, Check } from 'lucide-react';
import { useAdhkarContentQuery } from '../../hooks/queries/useAdhkar';
import type { AdhkarItem, DuaItem } from '../../api/adhkar.api';
import { useAdhkarDismissals } from './useAdhkarDismissals';

type TabKey = 'morning' | 'evening' | 'dua';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'morning', label: 'أذكار الصباح', icon: Sunrise },
  { key: 'evening', label: 'أذكار المساء', icon: Sunset },
  { key: 'dua', label: 'الدعاء', icon: MoonStar },
];

/* ─────────────────────────── Adhkar card (tap-to-dismiss) ─────────────────────────── */

const AdhkarCardView: React.FC<{
  item: AdhkarItem;
  remaining: number;
  isDone: boolean;
  onTap: () => void;
}> = ({ item, remaining, isDone, onTap }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.95, y: -12, transition: { duration: 0.35, ease: 'easeInOut' } }
      }
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
      aria-label={`ذكر — اضغط ${remaining} مرات لإكماله`}
      className="relative cursor-pointer select-none rounded-2xl border p-5 sm:p-6 text-right transition-shadow duration-300 hover:shadow-gold-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
    >
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-emerald-950/70 backdrop-blur-sm"
          >
            <span className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1.5 text-sm font-bold text-emerald-300">
              <Check className="h-4 w-4" /> تم
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="font-amiri text-lg sm:text-xl leading-[1.9] text-ivory">{item.arabicText}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-ivory-muted">— {item.source}</span>
        <motion.span
          key={remaining}
          initial={reduceMotion ? undefined : { scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
          className="flex h-9 min-w-9 items-center justify-center gap-1 rounded-full border border-gold-500/40 bg-gold-500/10 px-2 text-sm font-black text-gold-300"
          title="التكرار المتبقي"
        >
          {remaining}
        </motion.span>
      </div>
    </motion.article>
  );
};

/* ─────────────────────────── Dua card (always visible) ─────────────────────────── */

const DuaCardView: React.FC<{ dua: DuaItem }> = ({ dua }) => {
  const subLabels: Record<string, string> = {
    EXAM: 'دعاء الامتحان',
    STUDY: 'دعاء الدراسة',
    GENERAL: 'دعاء',
    RELIEF: 'دعاء الفرج',
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-2xl border p-5 sm:p-6 text-right"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--surface)), var(--surface))',
      }}
    >
      <span className="mb-3 inline-block rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 text-[10px] font-black text-gold-300">
        {subLabels[dua.subCategory] ?? 'دعاء'}
      </span>
      <p className="font-amiri text-lg sm:text-xl leading-[1.9] text-ivory">{dua.arabicText}</p>
      {dua.translationNote && (
        <p className="mt-1 text-xs text-ivory-muted">{dua.translationNote}</p>
      )}
      <span className="mt-4 block text-xs text-ivory-muted">— {dua.source}</span>
    </motion.article>
  );
};

/* ─────────────────────────── Page ─────────────────────────── */

export const AdhkarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: TabKey =
    searchParams.get('type') === 'evening' || searchParams.get('type') === 'dua'
      ? (searchParams.get('type') as TabKey)
      : 'morning';

  const { data, isLoading, isError } = useAdhkarContentQuery();
  const { dismissedItemIds, dismissItem } = useAdhkarDismissals();

  // remaining taps per item (session-scoped)
  const [tapsLeft, setTapsLeft] = useState<Record<string, number>>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const items = useMemo(() => data?.items ?? [], [data]);
  const duas = useMemo(() => data?.duas ?? [], [data]);

  const visibleItems = useMemo(() => {
    if (activeTab === 'dua') return [];
    return items.filter(
      (it) => it.category === activeTab.toUpperCase() && !dismissedItemIds.has(it.id)
    );
  }, [items, activeTab, dismissedItemIds]);

  const visibleDuas = useMemo(
    () => (activeTab === 'dua' ? duas : []),
    [duas, activeTab]
  );

  const handleTabChange = useCallback(
    (key: TabKey) => setSearchParams({ type: key }, { replace: true }),
    [setSearchParams]
  );

  const handleTap = useCallback(
    (item: AdhkarItem) => {
      if (completedIds.has(item.id)) return;
      const current = tapsLeft[item.id] ?? item.repeatCount;
      const next = current - 1;
      setTapsLeft((prev) => ({ ...prev, [item.id]: Math.max(0, next) }));
      if (next <= 0) {
        void dismissItem(item.id);
        setCompletedIds((ids) => new Set(ids).add(item.id));
        window.setTimeout(() => {
          setCompletedIds((ids) => {
            const copy = new Set(ids);
            copy.delete(item.id);
            return copy;
          });
        }, 450);
      }
    },
    [completedIds, tapsLeft, dismissItem]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary-soft shadow-sm">
          <MoonStar className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-amira text-3xl font-black text-ink sm:text-4xl">
          أذكار الصباح والمساء والأدعية
        </h1>
        <p className="mt-3 text-sm text-black/80 " style={{fontFamily: "Tajawal"}}>
          {activeTab !== 'dua'
            ? 'اضغط على البطاقة بعد كل تكرار حتى يكتمل الذكر ويختفي لمدة 24 ساعة'
            : 'أدعية مفتوحة دائمًا للطالب قبل الدراسة والامتحانات'}
        </p>
      </header>

      {/* Filter tabs */}
      <div
        className="mx-auto mb-8 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border p-1.5 backdrop-blur-md"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        role="tablist"
        aria-label="تصنيف الأذكار والأدعية"
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => handleTabChange(key)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors duration-200 sm:text-sm ${
              activeTab === key ? 'text-bg' : 'text-ivory-muted hover:text-ivory'
            }`}
          >
            {activeTab === key && (
              <motion.span
                layoutId="adhkar-tab-pill"
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-gradient-to-l from-gold-600 to-black"
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-500/30 border-t-gold-400" />
        </div>
      )}

      {isError && (
        <p className="mt-16 text-center text-sm text-red-300">
          حدث خطأ في تحميل الأذكار، حاول تحديث الصفحة.
        </p>
      )}

      {!isLoading && !isError && (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item) => (
              <motion.div key={item.id} layout>
                <AdhkarCardView
                  item={item}
                  remaining={tapsLeft[item.id] ?? item.repeatCount}
                  isDone={completedIds.has(item.id)}
                  onTap={() => handleTap(item)}
                />
              </motion.div>
            ))}
            {visibleDuas.map((dua) => (
              <DuaCardView key={dua.id} dua={dua} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!isLoading && !isError && visibleItems.length === 0 && visibleDuas.length === 0 && (
        <p className="mt-16 text-center text-sm text-ivory-muted">
          لا يوجد محتوى في هذا التصنيف حاليًا.
        </p>
      )}
    </div>
  );
};
