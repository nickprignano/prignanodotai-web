import type { Metadata } from "next";
import { getProfile, getRepos, getUsername, type Profile, type Repo } from "@/lib/github";
import { timeAgo } from "@/lib/format";
import Carousel from "./carousel";
import SiteHeader from "./site-header";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Regenerate the page at most once an hour so new pushes show up automatically.
export const revalidate = 3600;

const ACTIVE_WINDOW_MS = 30 * 24 * 3600 * 1000;

export default async function Home() {
  const username = getUsername();
  let profile: Profile | null = null;
  let repos: Repo[] = [];
  let error: string | null = null;

  try {
    [profile, repos] = await Promise.all([getProfile(username), getRepos(username)]);
  } catch (e) {
    // During a background refresh, throwing makes Next.js keep serving the
    // last good page instead of caching an error. Only the very first build,
    // which has no previous page, renders the error message.
    if (process.env.NEXT_PHASE !== "phase-production-build") throw e;
    console.error(e);
    error = "Couldn't load projects from GitHub right now. Please check back shortly.";
  }

  const now = Date.now();
  const slides = repos.map((repo) => ({
    ...repo,
    updated: timeAgo(repo.pushedAt, now),
    active: now - Date.parse(repo.pushedAt) < ACTIVE_WINDOW_MS,
  }));

  return (
    <main className="page">
      <SiteHeader current="projects" bio={profile?.bio} />

      {error || slides.length === 0 ? (
        <p className="notice">{error ?? "No public projects yet."}</p>
      ) : (
        <Carousel slides={slides} />
      )}

      <footer>Featured research first, then projects by recent activity · refreshed hourly from GitHub</footer>
    </main>
  );
}
