import entries from "@/content/manual-items.json";
import type { ProjectItem, Source } from "../items";

// Hand-written carousel items from content/manual-items.json. The file is
// bundled with the site, so this source never makes a network request.

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const manualSource: Source = {
  name: "manual",
  load: async () => (entries as unknown[]).map(parseEntry),
};

/** Checks one entry and fills in defaults. A bad entry fails the build with a clear message. */
export function parseEntry(raw: unknown, index: number): ProjectItem {
  const e = (raw ?? {}) as Record<string, unknown>;
  const where = `content/manual-items.json entry ${index}${typeof e.id === "string" ? ` (${e.id})` : ""}`;
  const str = (key: string, required = false): string | null => {
    const v = e[key];
    if (v === undefined || v === null || v === "") {
      if (required) throw new Error(`${where}: "${key}" is required`);
      return null;
    }
    if (typeof v !== "string") throw new Error(`${where}: "${key}" must be a string`);
    return v;
  };

  const id = str("id", true)!;
  const url = str("url", true)!;
  const date = str("date", true)!;
  if (Number.isNaN(Date.parse(date))) throw new Error(`${where}: "date" must be a date like 2026-11-04`);
  const showUntil = str("showUntil");
  if (showUntil && !DAY.test(showUntil)) throw new Error(`${where}: "showUntil" must look like 2026-11-04`);
  if (e.pinned !== undefined && typeof e.pinned !== "boolean") throw new Error(`${where}: "pinned" must be true or false`);
  const topics = e.topics ?? [];
  if (!Array.isArray(topics) || topics.some((t) => typeof t !== "string")) {
    throw new Error(`${where}: "topics" must be a list of strings`);
  }

  return {
    id: `manual:${id}`,
    title: str("title", true)!,
    description: str("description"),
    href: url,
    artHref: url,
    links: [{ label: `${str("linkLabel") ?? "Visit"} ↗`, href: url }],
    seed: str("seed") ?? id,
    color: str("color"),
    image: str("image"),
    badge: str("badge"),
    pinned: e.pinned === true,
    // A bare day is read as noon UTC so it lands on that day in US time zones.
    date: DAY.test(date) ? `${date}T12:00:00Z` : date,
    dateStyle: "calendar",
    showUntil,
    topics,
    language: null,
    stars: 0,
    forks: 0,
  };
}
