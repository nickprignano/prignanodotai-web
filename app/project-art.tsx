"use client";

import { useEffect, useRef } from "react";

// Draws a unique abstract piece for a project: the repo name seeds the
// composition and the language colour sets the palette. It's drawn
// progressively the first time the slide becomes active.

type Props = { seed: string; color: string | null; animate: boolean };

export default function ProjectArt({ seed, color, animate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawn = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancel = () => {};

    const render = (progressive: boolean) => {
      cancel();
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      cancel = paint(canvas, seed, color, progressive && !reduceMotion);
      drawn.current = true;
    };

    // Wait for the slide to become active before the first draw, so the art
    // "renders in" as the viewer arrives. Redraw instantly on resize.
    if (animate || drawn.current) render(animate && !drawn.current);
    const observer = new ResizeObserver(() => drawn.current && render(false));
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancel();
    };
  }, [seed, color, animate]);

  return <canvas ref={canvasRef} className="art" aria-hidden />;
}

function paint(canvas: HTMLCanvasElement, seed: string, color: string | null, progressive: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const { width: w, height: h } = canvas;
  const rand = mulberry32(hash(seed));
  const scale = Math.min(w, h);

  const baseHue = color ? hexToHue(color) : rand() * 360;
  const spread = 25 + rand() * 50;
  const hues = [baseHue, baseHue + spread, baseHue - spread, baseHue + 180 + (rand() - 0.5) * 40];

  // Background: deep gradient in the base hue.
  const angle = rand() * Math.PI * 2;
  const bg = ctx.createLinearGradient(
    w / 2 - (Math.cos(angle) * w) / 2,
    h / 2 - (Math.sin(angle) * h) / 2,
    w / 2 + (Math.cos(angle) * w) / 2,
    h / 2 + (Math.sin(angle) * h) / 2,
  );
  // Kept very dark so warm hues read as glowing rather than brown.
  bg.addColorStop(0, hsl(baseHue + 200, 35, 5));
  bg.addColorStop(1, hsl(baseHue, 50, 11));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Soft glows.
  ctx.globalCompositeOperation = "screen";
  const glows = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < glows; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = scale * (0.35 + rand() * 0.55);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hsl(hues[i % hues.length], 90, 55, 0.4));
    g.addColorStop(1, hsl(hues[i % hues.length], 90, 55, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // A few rings for structure.
  ctx.globalCompositeOperation = "source-over";
  const rings = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < rings; i++) {
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, scale * (0.12 + rand() * 0.4), 0, Math.PI * 2);
    ctx.strokeStyle = hsl(hues[(i + 1) % hues.length], 70, 75, 0.18);
    ctx.lineWidth = Math.max(1, scale * 0.003);
    ctx.stroke();
  }

  // Flow field: particles trace a smooth, seeded vector field.
  const f1 = (1.2 + rand() * 3) / scale;
  const f2 = (1.2 + rand() * 3) / scale;
  const p1 = rand() * 100;
  const p2 = rand() * 100;
  const twist = 1 + rand() * 2.5;
  const field = (x: number, y: number) =>
    (Math.sin(x * f1 + p1) + Math.cos(y * f2 + p2) + Math.sin((x + y) * f1 * 0.5 + p2)) * twist;

  const count = Math.round((w * h) / 900);
  const steps = 60;
  const stepLen = scale * 0.006;
  ctx.lineWidth = Math.max(1, scale * 0.0022);
  ctx.lineCap = "round";

  const drawParticles = (from: number, to: number) => {
    for (let i = from; i < to; i++) {
      let x = rand() * w;
      let y = rand() * h;
      const hue = hues[Math.floor(rand() * hues.length)];
      ctx.strokeStyle = hsl(hue, 85, 62 + rand() * 25, 0.1 + rand() * 0.25);
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < steps; s++) {
        const a = field(x, y);
        x += Math.cos(a) * stepLen;
        y += Math.sin(a) * stepLen;
        if (x < 0 || y < 0 || x > w || y > h) break;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  if (!progressive) {
    drawParticles(0, count);
    return () => {};
  }

  // Spread the particles over ~1.2s so the piece visibly draws itself.
  let done = 0;
  let frame = 0;
  const perFrame = Math.ceil(count / 70);
  const tick = () => {
    const next = Math.min(count, done + perFrame);
    drawParticles(done, next);
    done = next;
    if (done < count) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hsl(h: number, s: number, l: number, a = 1) {
  return `hsl(${((h % 360) + 360) % 360} ${s}% ${l}% / ${a})`;
}

function hexToHue(hex: string) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 220; // greys (e.g. unknown languages) get a cool blue
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
}
