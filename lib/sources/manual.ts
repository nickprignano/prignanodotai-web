import entries from "@/content/manual-items.json";
import { DAY, reader } from "../content";
import type { ProjectItem, Source } from "../items";

// Hand-written carousel items from content/manual-items.json, for things that
// are neither repos nor events. The file is bundled with the site, so this
// source never makes a network request.

export const manualSource: Source = {
  name: "manual",
  load: async () => (entries as unknown[]).map(parseEntry),
};

/** Checks one entry and fills in defaults. A bad entry fails the build with a clear message. */
export function parseEntry(raw: unknown, index: number): ProjectItem {
  const id = (raw as { id?: unknown })?.id;
  const r = reader(raw, `content/manual-items.json entry ${index}${typeof id === "string" ? ` (${id})` : ""}`);
  const url = r.need("url");
  const date = r.need("date");
  if (Number.isNaN(Date.parse(date))) r.fail(`"date" must be a date like 2026-11-04`);
  const seedId = r.need("id");

  return {
    id: `manual:${seedId}`,
    title: r.need("title"),
    description: r.str("description"),
    href: url,
    artHref: url,
    links: [{ label: `${r.str("linkLabel") ?? "Visit"} ↗`, href: url }],
    seed: r.str("seed") ?? seedId,
    color: r.str("color"),
    image: r.str("image"),
    badge: r.str("badge"),
    pinned: r.bool("pinned") === true,
    // A bare day is read as noon UTC so it lands on that day in US time zones.
    date: DAY.test(date) ? `${date}T12:00:00Z` : date,
    dateStyle: "calendar",
    showUntil: r.day("showUntil"),
    topics: r.strings("topics"),
    language: null,
    stars: 0,
    forks: 0,
  };
}
