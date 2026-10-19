"use client";

import { useEffect, useState } from "react";

// A live countdown to a release. The server renders only the date, so the
// numbers appear once the page is running in the browser, and the whole
// thing disappears when the time is reached.

const UNITS = [
  ["days", 86_400_000],
  ["hours", 3_600_000],
  ["minutes", 60_000],
  ["seconds", 1_000],
] as const;

export default function Countdown({ to, label, date }: { to: string; label: string; date: string }) {
  const target = Date.parse(to);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now !== null && now >= target) return null;

  let left = now === null ? 0 : target - now;
  const parts = UNITS.map(([unit, size]) => {
    const n = Math.floor(left / size);
    left -= n * size;
    return { unit, n };
  });

  return (
    <div className="countdown">
      <p className="countdown-label">
        {label} · <time dateTime={to}>{date}</time>
      </p>
      {now !== null && (
        <ol className="countdown-units" aria-hidden>
          {parts.map(({ unit, n }) => (
            <li key={unit}>
              <b>{unit === "days" ? n : String(n).padStart(2, "0")}</b>
              <span>{unit}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
