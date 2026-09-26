import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const maxWClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  // الرسم عبر Portal — يحمي المودال من أسلاف لديهم transform/overflow
  // (مثل حاوية Lenis للتمرير السلس) والتي تكسر position: fixed
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[9999] overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Centering wrapper container */}
          <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 text-center">
            {/* Modal Card Centered */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={cn(
                'relative w-full z-10 flex flex-col bg-surface-card border border-gold-500/30 rounded-3xl shadow-md overflow-hidden text-right',
                maxWClass
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-surface-border/60 bg-surface/70 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-ivory-muted hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex-1 text-right pr-3">
                  {title && (
                    <h3 className="text-lg sm:text-xl font-bold font-amiri text-gold-300">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-xs text-ivory-muted mt-0.5">{description}</p>
                  )}
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-5 sm:p-6 text-right custom-scrollbar">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
      </AnimatePresence>,
      document.body
    );
  };
