import React, { useEffect } from 'react';

/**
 * Global smooth scrolling provider.
 *
 * Utilizes native browser scrolling with hardware acceleration for
 * instant, butter-smooth 60fps/120fps responsiveness without hijacking
 * scroll events or running continuous background JS tickers.
 */
export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Enable native smooth scrolling behavior safely
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return <>{children}</>;
};
