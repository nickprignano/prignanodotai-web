"use client";

import { useEffect, useRef } from "react";
import { createPiece } from "prignano-theme/art/index.js";

// Animated line art for a project, from prignano-theme's line-art library (the
// same one Vibes plays). The seed (repo name) shapes the piece and the language
// color sets the palette, so a project always looks the same. `style` comes
// from the list the card is in (pick() in the library), so neighbours differ.
// Only the active slide animates; the others hold a still frame.

type Props = { seed: string; color: string | null; animate: boolean; style?: string };

export default function ProjectArt({ seed, color, animate, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let piece: ReturnType<typeof createPiece> = null;
    let frame = 0;

    const setup = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // A still frame for inactive slides, reduced motion, and the first paint.
      piece = createPiece(canvas, { seed, color, style, mode: "card" });
      piece?.step(0);
    };

    let last = 0;
    const tick = (now: number) => {
      // Clamp the step so a backgrounded tab doesn't jump when it returns.
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0;
      last = now;
      piece?.step(dt);
      frame = requestAnimationFrame(tick);
    };

    setup();
    if (animate && !reduceMotion) frame = requestAnimationFrame(tick);

    const observer = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (Math.round(width * dpr) !== canvas.width || Math.round(height * dpr) !== canvas.height) setup();
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [seed, color, animate, style]);

  return <canvas ref={canvasRef} className="art" aria-hidden />;
}
