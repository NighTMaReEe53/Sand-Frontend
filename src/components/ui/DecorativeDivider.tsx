import React from 'react';

/**
 * Implamtion_plan.md §2 typography: section titles get a short centered
 * gold accent underline under the H2. Decorative only.
 */
export const DecorativeDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`mx-auto block h-[3px] w-12 rounded-full ${className}`}
    style={{ backgroundColor: 'var(--gold)' }}
    aria-hidden="true"
  />
);
