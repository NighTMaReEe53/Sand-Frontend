import React from 'react';

/**
 * Page entry animation — pure CSS, zero JS overhead on every navigation.
 * Framer-motion had to bootstrap a motion.div + RAF loop on each route
 * change; this approach is handled entirely by the compositor thread.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="page-transition-enter w-full flex-1 flex flex-col">
      {children}
    </div>
  );
};
