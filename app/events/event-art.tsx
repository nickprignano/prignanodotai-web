"use client";

import { useState, type ReactNode } from "react";
import ProjectArt from "../project-art";

// Line art for an event or project card. It holds a still frame until the pointer
// is over it, so a page of cards doesn't animate all at once.
// ProjectArt itself stays still when the reader prefers reduced motion.
export default function EventArt({
  seed,
  color = null,
  always = false,
  children,
}: {
  seed: string;
  color?: string | null;
  always?: boolean;
  children?: ReactNode;
}) {
  const [active, setActive] = useState(false);
  return (
    <div
      className="ev-art"
      aria-hidden
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <ProjectArt seed={seed} color={color} animate={always || active} />
      {children}
    </div>
  );
}
