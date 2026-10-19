import type { Metadata } from "next";
import { getProfile, getUsername, type Profile } from "@/lib/github";
import { formatDate, timeAgo } from "@/lib/format";
import { loadItems, today, type ProjectItem } from "@/lib/items";
import { getSources } from "@/lib/sources";
import Carousel from "./carousel";
import SiteHeader from "./site-header";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Regenerate the page at most once an hour so new pushes show up and expired items drop off automatically.
export const revalidate = 3600;

const ACTIVE_WINDOW_MS = 30 * 24 * 3600 * 1000;

export default async function Home() {
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
          // Highlight an event until it's over.
          active: item.date.slice(0, 10) >= day,
        },
  );

  return (
    <main className="page">
      <SiteHeader current="projects" bio={profile?.bio} />

      {error || slides.length === 0 ? (
        <p className="notice">{error ?? "No public projects yet."}</p>
      ) : (
        <Carousel slides={slides} />
      )}

      <footer>Pinned items first, then projects by recent activity · refreshed hourly from GitHub</footer>
    </main>
  );
}
