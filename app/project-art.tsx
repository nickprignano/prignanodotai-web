"use client";

import { useEffect, useRef } from "react";

// Animated line art for a project. The repo name seeds the piece (which of
// the styles below, its shapes and motion) and the language colour sets the
// palette, so a project always looks the same and no two look alike. Only the
// active slide animates; the others hold a still frame.

type Props = { seed: string; color: string | null; animate: boolean };

type Scene = {
  // Advances the piece by dt seconds and draws it.
  step: (dt: number) => void;
};

export default function ProjectArt({ seed, color, animate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scene: Scene | null = null;
    let frame = 0;

    const setup = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      scene = createScene(canvas, seed, color);
      // A still frame for inactive slides, reduced motion, and the first paint.
      scene?.step(0);
    };

    let last = 0;
    const tick = (now: number) => {
      // Clamp the step so a backgrounded tab doesn't jump when it returns.
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0;
      last = now;
      scene?.step(dt);
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
  }, [seed, color, animate]);

  return <canvas ref={canvasRef} className="art" aria-hidden />;
}

function createScene(canvas: HTMLCanvasElement, seed: string, color: string | null): Scene | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const rand = mulberry32(hash(seed));
  const { width: w, height: h } = canvas;
  const baseHue = color ? hexToHue(color) : rand() * 360;
  const spread = 25 + rand() * 45;
  const palette = {
    hues: [baseHue, baseHue + spread, baseHue - spread, baseHue + 180 + (rand() - 0.5) * 40],
    bg: background(ctx, w, h, baseHue, rand),
  };
  const styles = [flowTrails, waveLines, harmonograph];
  return styles[Math.floor(rand() * styles.length)](ctx, w, h, rand, palette);
}

type Palette = { hues: number[]; bg: CanvasGradient };
type Style = (ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, p: Palette) => Scene;

// Particles drift through a slowly shifting vector field, each trailing a
// line that fades out behind it.
const flowTrails: Style = (ctx, w, h, rand, { hues, bg }) => {
  const scale = Math.min(w, h);
  const f1 = (1.2 + rand() * 2.5) / scale;
  const f2 = (1.2 + rand() * 2.5) / scale;
  const p1 = rand() * 100;
  const p2 = rand() * 100;
  const twist = 1 + rand() * 2;
  const drift = 0.05 + rand() * 0.1;
  const speed = scale * (0.12 + rand() * 0.1);
  const field = (x: number, y: number, t: number) =>
    (Math.sin(x * f1 + p1 + t * drift) + Math.cos(y * f2 + p2 - t * drift * 0.7) + Math.sin((x + y) * f1 * 0.5 + t * drift * 0.5)) * twist;

  const count = Math.min(900, Math.round((w * h) / 1800));
  const tail = 40;
  const particles = Array.from({ length: count }, () => spawn());
  function spawn() {
    return { xs: [rand() * w], ys: [rand() * h], life: 2 + rand() * 6, band: Math.floor(rand() * hues.length) };
  }
  let t = rand() * 100;

  const advance = (dt: number) => {
    t += dt;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const x = p.xs[p.xs.length - 1];
      const y = p.ys[p.ys.length - 1];
      const a = field(x, y, t);
      const nx = x + Math.cos(a) * speed * dt;
      const ny = y + Math.sin(a) * speed * dt;
      p.life -= dt;
      if (p.life <= 0 || nx < 0 || ny < 0 || nx > w || ny > h) {
        // Let the tail run out before respawning, so lines don't vanish at once.
        p.xs.shift();
        p.ys.shift();
        if (p.xs.length === 0) particles[i] = spawn();
        continue;
      }
      p.xs.push(nx);
      p.ys.push(ny);
      if (p.xs.length > tail) {
        p.xs.shift();
        p.ys.shift();
      }
    }
  };

  // Each tail is drawn in three segments, faint at the back and bright at the
  // head. Batching by colour and segment keeps it to a dozen strokes a frame.
  const draw = () => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = Math.max(1, scale * 0.0022);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const segments = 3;
    for (let band = 0; band < hues.length; band++) {
      for (let seg = 0; seg < segments; seg++) {
        ctx.beginPath();
        for (const p of particles) {
          if (p.band !== band) continue;
          const n = p.xs.length;
          const from = Math.floor((n * seg) / segments);
          const to = Math.min(n - 1, Math.floor((n * (seg + 1)) / segments));
          if (to <= from) continue;
          ctx.moveTo(p.xs[from], p.ys[from]);
          for (let k = from + 1; k <= to; k++) ctx.lineTo(p.xs[k], p.ys[k]);
        }
        ctx.strokeStyle = hsl(hues[band], 85, 55 + seg * 10, 0.15 + seg * 0.3);
        ctx.stroke();
      }
    }
  };

  // Run the simulation for a moment up front so the still frame already
  // shows full trails.
  for (let i = 0; i < tail; i++) advance(1 / 30);

  return {
    step: (dt) => {
      if (dt > 0) advance(dt);
      draw();
    },
  };
};

// Stacked horizontal lines rippling like a sound wave, strongest in the middle.
const waveLines: Style = (ctx, w, h, rand, { hues, bg }) => {
  const scale = Math.min(w, h);
  const lines = 26 + Math.floor(rand() * 18);
  const top = h * 0.12;
  const gap = (h * 0.76) / (lines - 1);
  const amp = gap * (2.5 + rand() * 3);
  const waves = Array.from({ length: 3 }, () => ({
    f: (2 + rand() * 7) / w,
    speed: 0.3 + rand() * 0.6,
    phase: rand() * 10,
    rowShift: 0.15 + rand() * 0.4,
  }));
  const centre = 0.35 + rand() * 0.3;
  const width = 0.18 + rand() * 0.15;
  const points = 140;
  let t = rand() * 100;

  return {
    step: (dt) => {
      t += dt;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = Math.max(1, scale * 0.0028);
      ctx.lineJoin = "round";
      for (let i = 0; i < lines; i++) {
        const y0 = top + i * gap;
        const k = i / (lines - 1);
        ctx.strokeStyle = hsl(hues[0] + (hues[1] - hues[0]) * k, 85, 62 + 18 * Math.sin(k * Math.PI), 0.85);
        const line = new Path2D();
        for (let j = 0; j <= points; j++) {
          const x = (j / points) * w;
          const env = Math.exp(-(((x / w - centre) / width) ** 2));
          let d = 0;
          for (const wv of waves) d += Math.sin(x * wv.f * Math.PI * 2 + t * wv.speed + i * wv.rowShift + wv.phase);
          const y = y0 - Math.abs(d / waves.length) * amp * env;
          if (j === 0) line.moveTo(x, y);
          else line.lineTo(x, y);
        }
        // Fill under each line so the ones in front hide the ones behind.
        const under = new Path2D(line);
        under.lineTo(w, h);
        under.lineTo(0, h);
        under.closePath();
        ctx.fillStyle = bg;
        ctx.fill(under);
        ctx.stroke(line);
      }
    },
  };
};

// Interlocking looping curves, like a pendulum drawing machine, whose phases
// drift so the figure slowly turns and morphs.
const harmonograph: Style = (ctx, w, h, rand, { hues, bg }) => {
  const scale = Math.min(w, h);
  const ratios = [1, 2, 3, 4, 5];
  const pick = () => ratios[Math.floor(rand() * ratios.length)] + (rand() - 0.5) * 0.02;
  const curves = Array.from({ length: 2 }, (_, c) => ({
    fx: pick(),
    fy: pick(),
    fx2: pick(),
    fy2: pick(),
    px: rand() * Math.PI * 2,
    py: rand() * Math.PI * 2,
    drift: (0.08 + rand() * 0.12) * (c ? -1 : 1),
    hue: hues[c],
  }));
  const decay = 0.012 + rand() * 0.01;
  const turns = 60;
  const points = 2400;
  const r = scale * 0.42;
  let t = rand() * 100;

  return {
    step: (dt) => {
      t += dt;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = Math.max(1, scale * 0.0018);
      for (const c of curves) {
        ctx.strokeStyle = hsl(c.hue, 85, 65, 0.55);
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const s = (i / points) * turns;
          const e = Math.exp(-decay * s);
          const x = (Math.sin(c.fx * s + c.px + t * c.drift) + Math.sin(c.fx2 * s + c.py)) * 0.5 * e;
          const y = (Math.sin(c.fy * s + c.py + t * c.drift * 0.6) + Math.sin(c.fy2 * s + c.px)) * 0.5 * e;
          if (i === 0) ctx.moveTo(w / 2 + x * r, h / 2 + y * r);
          else ctx.lineTo(w / 2 + x * r, h / 2 + y * r);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    },
  };
};

function background(ctx: CanvasRenderingContext2D, w: number, h: number, hue: number, rand: () => number) {
  const angle = rand() * Math.PI * 2;
  const bg = ctx.createLinearGradient(
    w / 2 - (Math.cos(angle) * w) / 2,
    h / 2 - (Math.sin(angle) * h) / 2,
    w / 2 + (Math.cos(angle) * w) / 2,
    h / 2 + (Math.sin(angle) * h) / 2,
  );
  // Kept very dark so warm hues read as glowing rather than brown.
  bg.addColorStop(0, hsl(hue + 200, 35, 5));
  bg.addColorStop(1, hsl(hue, 50, 11));
  return bg;
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
