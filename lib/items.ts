// Everything in the carousel is a ProjectItem. Each source (GitHub repos,
// hand-written entries in content/manual-items.json, and later perhaps a
// feed) turns its own data into this shape, and loadItems merges them.

export type ProjectItem = {
  /** Unique across sources, so prefix it with the source name. */
  id: string;
  title: string;
  description: string | null;
  /** Where the title links. */
  href: string;
  /** Where the artwork links. */
  artHref: string;
  /** Buttons at the bottom right of the card. */
  links: { label: string; href: string }[];
  /** Seeds the generated line art, so an item always looks the same. */
  seed: string;
  /** Sets the line art palette; null lets the seed pick one. */
  color: string | null;
  /** Shown over the line art if it's a real screenshot (large and landscape). */
  image: string | null;
  /** Small label above the title, like "Featured research" or "Event". */
  badge: string | null;
  /** Pinned items come first, in source order, before everything sorted by date. */
  pinned: boolean;
  /** Last push for a repo, the day itself for an event. Unpinned items sort by it, newest first. */
  date: string;
  /** "relative" shows "3 days ago" (repos); "calendar" shows "Nov 4, 2026" (events). */
  dateStyle: "relative" | "calendar";
  /** Last day (YYYY-MM-DD, in TIME_ZONE) the item is shown. It's hidden from the next day on. */
  showUntil: string | null;
  topics: string[];
  language: string | null;
  stars: number;
  forks: number;
};

export type Source = {
  name: string;
  load: () => Promise<ProjectItem[]>;
};

// The day used for showUntil. The page re-renders hourly, so an expired
// item drops off within an hour of midnight here, without a redeploy.
export const TIME_ZONE = "America/New_York";

/** Today's date as YYYY-MM-DD in the given time zone. */
export function today(timeZone = TIME_ZONE, now = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isExpired(item: ProjectItem, now = new Date()): boolean {
  return item.showUntil !== null && today(TIME_ZONE, now) > item.showUntil;
}

/** Loads every source and merges them: pinned items first, then the rest by date. */
export async function loadItems(sources: Source[], now = new Date()): Promise<ProjectItem[]> {
  // A failing source fails the render, so Next.js keeps serving the last good page.
  const lists = await Promise.all(sources.map((s) => s.load()));
  const items = lists.flat().filter((item) => !isExpired(item, now));
  const pinned = items.filter((item) => item.pinned);
  const rest = items.filter((item) => !item.pinned).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return [...pinned, ...rest];
}
