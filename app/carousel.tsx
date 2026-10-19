"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { languageColor } from "@/lib/format";
import type { Slide } from "@/lib/portfolio";
import ProjectArt from "./project-art";
import ProjectInfo from "./project-info";

// Images for slides this far from the current one are loaded ahead of time.
const PRELOAD_DISTANCE = 1;

export default function Carousel({ slides }: { slides: Slide[] }) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0, 1]));
  const wheelLock = useRef(false);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const target = Math.max(0, Math.min(slides.length - 1, i));
      const slide = track?.children[target] as HTMLElement | undefined;
      if (!track || !slide) return;
      track.scrollTo({
        left: slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2,
        behavior: "smooth",
      });
    },
    [slides.length],
  );

  // Track which slide is centered as the user swipes or scrolls.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setIndex(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: track, threshold: 0.6 },
    );
    for (const child of Array.from(track.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [slides.length]);

  // Render images for the current slide and its neighbors, keeping ones already shown.
  useEffect(() => {
    setLoaded((prev) => {
      const next = new Set(prev);
      for (let d = -PRELOAD_DISTANCE; d <= PRELOAD_DISTANCE; d++) {
        if (index + d >= 0 && index + d < slides.length) next.add(index + d);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [index, slides.length]);

  // The page never scrolls vertically, so a vertical wheel moves the carousel instead.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // native horizontal scroll
      e.preventDefault();
      if (wheelLock.current || Math.abs(e.deltaY) < 10) return;
      wheelLock.current = true;
      goTo(index + (e.deltaY > 0 ? 1 : -1));
      setTimeout(() => (wheelLock.current = false), 450);
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, [goTo, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(slides.length - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, slides.length]);

  return (
    <section className="carousel" aria-roledescription="carousel" aria-label="Projects">
      <ol className="track" ref={trackRef}>
        {slides.map((item, i) => (
          <li
            key={item.id}
            className="slide"
            data-index={i}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}: ${item.title}`}
            aria-current={i === index}
          >
            <a className="shot" href={item.artHref} tabIndex={-1} aria-hidden>
              <ProjectArt
                seed={item.seed}
                color={item.color ?? (item.language ? languageColor(item.language) : null)}
                animate={i === index}
              />
              {item.image && loaded.has(i) && <Screenshot src={item.image} />}
            </a>

            <ProjectInfo item={item} />
          </li>
        ))}
      </ol>

      <div className="controls">
        <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous project">
          ←
        </button>
        <div className="dots" role="tablist" aria-label="Choose project">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={item.title}
              className={i === index ? "dot current" : "dot"}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <span className="count">
          {index + 1} / {slides.length}
        </span>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === slides.length - 1}
          aria-label="Next project"
        >
          →
        </button>
      </div>
    </section>
  );
}

// A README image replaces the artwork only when it looks like a real
// screenshot (large and landscape); logos and icons are skipped.
export function Screenshot({ src, lazy = false }: { src: string; lazy?: boolean }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  const check = () => {
    const img = ref.current;
    if (img) setShow(img.naturalWidth >= 800 && img.naturalWidth / img.naturalHeight >= 1.2);
  };

  // A server-rendered image can finish loading before React attaches onLoad.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) check();
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt=""
      decoding="async"
      loading={lazy ? "lazy" : undefined}
      className={show ? "screenshot ready" : "screenshot"}
      onLoad={check}
      onError={() => setShow(false)}
    />
  );
}
