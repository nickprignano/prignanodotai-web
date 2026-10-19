"use client";

import { useState } from "react";
import ProjectArt from "../project-art";

// Line art for an event card. It holds a still frame until the pointer
// is over it, so a page of cards doesn't animate all at once.
// ProjectArt itself stays still when the reader prefers reduced motion.
export default function EventArt({ seed, always = false }: { seed: string; always?: boolean }) {
  const [active, setActive] = useState(false);
  return (
    <div
      className="ev-art"
      aria-hidden
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <ProjectArt seed={seed} color={null} animate={always || active} />
    </div>
  );
}
