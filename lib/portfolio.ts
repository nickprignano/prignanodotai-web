import { getProfile, getUsername, type Profile } from "./github";
import { formatDate, timeAgo } from "./format";
import { loadItems, today, type ProjectItem } from "./items";
import { getSources } from "./sources";

// Everything the home carousel and /projects show: the GitHub profile and
// every item from every source, with its date already put into words.

export type Slide = ProjectItem & { when: string; whenTitle: string | null; active: boolean };

const ACTIVE_WINDOW_MS = 30 * 24 * 3600 * 1000;

export async function loadPortfolio(): Promise<{ profile: Profile | null; slides: Slide[]; error: string | null }> {
  const username = getUsername();
  let profile: Profile | null = null;
  let items: ProjectItem[] = [];
  let error: string | null = null;

  try {
    [profile, items] = await Promise.all([getProfile(username), loadItems(getSources(username))]);
  } catch (e) {
    // During a background refresh, throwing makes Next.js keep serving the
    // last good page instead of caching an error. Only the very first build,
    // which has no previous page, renders the error message. PR previews have
    // no page cache either, so they show the error, with its cause.
    const preview = process.env.PORTFOLIO_PREVIEW === "true";
    if (process.env.NEXT_PHASE !== "phase-production-build" && !preview) throw e;
    console.error(e);
    error = "Couldn't load projects from GitHub right now. Please check back shortly.";
    if (preview) error += ` (${e instanceof Error ? e.message : String(e)})`;
  }

  const now = Date.now();
  const day = today();
  const slides = items.map((item) =>
    item.dateStyle === "relative"
      ? {
          ...item,
          when: timeAgo(item.date, now),
          whenTitle: `Last push ${formatDate(item.date)}`,
          active: now - Date.parse(item.date) < ACTIVE_WINDOW_MS,
        }
      : {
          ...item,
          when: formatDate(item.date),
          whenTitle: null,
          // Highlight an event until it's over (its last day, for multi-day events).
          active: (item.showUntil ?? item.date.slice(0, 10)) >= day,
        },
  );
  return { profile, slides, error };
}
