import React from 'react';

export const IconCircle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span
    className={`inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] ${className}`}
    style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}
  >
    {children}
  </span>
);
