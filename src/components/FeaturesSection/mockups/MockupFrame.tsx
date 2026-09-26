import React, { type CSSProperties } from 'react';

interface MockupFrameProps {
  /** Arabic title shown in the frame bar — this is what the user sees */
  title: string;
  /** Card accent color used for the first dot + hover tint */
  accent?: string;
  children: React.ReactNode;
}

/**
 * Window-style chrome shared by every feature mockup: three traffic-light
 * dots (first one tinted with the card accent) and the mockup title.
 * The body carries a faint dot-grid so panels feel alive even when static.
 */
export default function MockupFrame({ title, accent = '#C9A15A', children }: MockupFrameProps) {
  return (
    <div className="mockup-frame" style={{ '--frame-accent': accent } as CSSProperties}>
      <div className="mockup-frame-bar">
        <span className="frame-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="frame-title">{title}</span>
      </div>
      <div className="mockup-frame-body">{children}</div>
    </div>
  );
}
