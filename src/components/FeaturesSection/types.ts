import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MockupProps {
  color: string;
  /** The card's lucide icon — lets shared mockups (e.g. IconOnlyMockup) reuse it */
  Icon?: LucideIcon;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  color: string;
  Icon: LucideIcon;
  MockupComponent: ComponentType<MockupProps>;
}
