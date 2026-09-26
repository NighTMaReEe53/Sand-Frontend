import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface AccordionSectionProps {
  id?: string;
  className?: string;
  icon: React.ReactNode;
  title: string;
  /** Optional badge count rendered next to the title */
  count?: number | null;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Shared accordion panel used for lesson-page sections (quiz, notes &
 * bookmarks, Q&A). Multiple panels may stay open independently; animation
 * uses the site-wide transition tokens (250–350ms ease-out).
 */
export const AccordionSection: React.FC<AccordionSectionProps> = ({
  id,
  className = '',
  icon,
  title,
  count,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div id={id} className={`rounded-2xl bg-surface-card border border-surface-border overflow-hidden scroll-mt-24 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 bg-surface hover:bg-surface-subtle/5 transition-colors text-right"
      >
        <span className="text-gold-400 shrink-0">{icon}</span>
        <span className="flex-1 text-sm font-bold text-ivory">{title}</span>
        {count !== undefined && count !== null && (
          <span className="text-[10px] font-bold text-gold-300 bg-gold-500/10 border border-gold-500/30 rounded-full min-w-[22px] h-[22px] px-2 flex items-center justify-center">
            {count}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-ivory-muted transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="p-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
