import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import type { Feature } from "./types";

// Reuse Feature but drop the id — the card itself doesn't need it
type FeatureCardProps = Omit<Feature, "id">;

export default function FeatureCard({
  title,
  description,
  color,
  Icon,
  MockupComponent,
}: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Optional tilt effect (§6). `quickTo` reuses one tween per axis instead
  // of creating a new animation for every pointer event.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) return;

    const rotateY = gsap.quickTo(card, 'rotateY', { duration: 0.32, ease: 'power2.out' });
    const rotateX = gsap.quickTo(card, 'rotateX', { duration: 0.32, ease: 'power2.out' });

    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / 20;
      const y = (e.clientY - rect.top - rect.height / 2) / 20;
      rotateY(x);
      rotateX(-y);
    };

    const handleLeave = () => {
      rotateY(0);
      rotateX(0);
    };

    card.addEventListener("mousemove", handleMove);
    card.addEventListener("mouseleave", handleLeave);
    return () => {
      card.removeEventListener("mousemove", handleMove);
      card.removeEventListener("mouseleave", handleLeave);
      gsap.killTweensOf(card);
    };
  }, []);

  // CSS keyframe entrance (see .feature-card-enter) — content can never
  // get stuck invisible the way scroll-triggered GSAP tweens could.
  return (
    <div
      className="feature-card feature-card-enter"
      ref={cardRef}
      style={{ "--card-accent": color } as React.CSSProperties}
    >
      <div className="feature-icon" style={{ background: `${color}22`, color }}>
        <Icon aria-hidden="true" />
      </div>
      <h3 style={{ fontFamily: "Tajawal" }}>{title}</h3>
      <p>{description}</p>

      <div className="feature-mockup">
        <MockupComponent color={color} Icon={Icon} />
      </div>
    </div>
  );
}
