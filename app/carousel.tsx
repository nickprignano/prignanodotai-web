"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Repo } from "@/lib/github";
import { formatDate, languageColor } from "@/lib/format";

type Slide = Repo & { updated: string; active: boolean };

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

  // Track which slide is centred as the user swipes or scrolls.
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

  // Render images for the current slide and its neighbours, keeping ones already shown.
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
        {slides.map((repo, i) => (
          <li
            key={repo.id}
            className="slide"
            data-index={i}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}: ${repo.name}`}
            aria-current={i === index}
          >
            <a className="shot" href={repo.homepage ?? repo.url} tabIndex={-1} aria-hidden>
              {loaded.has(i) && <ProjectImage src={repo.image} fallback={fallbackImage(repo)} />}
            </a>

            <div className="info">
              <div className="info-head">
                <h2>
                  <a href={repo.url}>{repo.name}</a>
                </h2>
                <time
                  dateTime={repo.pushedAt}
                  title={`Last push ${formatDate(repo.pushedAt)}`}
                  className={repo.active ? "activity active" : "activity"}
                >
                  {repo.updated}
                </time>
              </div>

              {repo.description && <p className="desc">{repo.description}</p>}

              {repo.topics.length > 0 && (
                <ul className="topics">
                  {repo.topics.slice(0, 6).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}

              <div className="meta">
                {repo.language && (
                  <span>
                    <span className="lang-dot" style={{ background: languageColor(repo.language) }} />
                    {repo.language}
                  </span>
                )}
                {repo.stars > 0 && <span>★ {repo.stars}</span>}
                {repo.forks > 0 && <span>⑂ {repo.forks}</span>}
                <span className="actions">
                  <a href={repo.url}>Code</a>
                  {repo.homepage && <a href={repo.homepage}>Live ↗</a>}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="controls">
        <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous project">
          ←
        </button>
        <div className="dots" role="tablist" aria-label="Choose project">
          {slides.map((repo, i) => (
            <button
              key={repo.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={repo.name}
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

function fallbackImage(repo: Repo) {
  return `https://opengraph.githubassets.com/1/${repo.fullName}`;
}

function ProjectImage({ src, fallback }: { src: string; fallback: string }) {
  const [current, setCurrent] = useState(src);
  const [ready, setReady] = useState(false);
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const ref = useRef<HTMLImageElement>(null);

  const onReady = () => {
    const img = ref.current;
    if (!img) return;
    // Logos and icons look wrong cropped; show them whole instead.
    const small = img.naturalWidth < 640 || img.naturalWidth / img.naturalHeight < 1.15;
    setFit(small ? "contain" : "cover");
    setReady(true);
  };

  // A server-rendered image can finish loading before React attaches onLoad.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) onReady();
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={current}
      alt=""
      decoding="async"
      className={[fit, ready && "ready"].filter(Boolean).join(" ")}
      onLoad={onReady}
      onError={() => current !== fallback && setCurrent(fallback)}
    />
  );
}
