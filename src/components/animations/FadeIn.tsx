import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

/**
 * Simple viewport-entry animation: fade + translateY.
 * Falls back to a pure opacity fade when the user prefers reduced motion.
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  y = 20,
  once = true,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: prefersReducedMotion ? 0.3 : 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};
