import { getProfile, getRepos, getUsername, type Profile, type Repo } from "@/lib/github";
import { timeAgo } from "@/lib/format";
import Carousel from "./carousel";

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
      <header className="hero">
        {profile && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={profile.avatarUrl} alt="" width={56} height={56} />
        )}
        <div className="hero-text">
          <h1>{profile?.name ?? username}</h1>
          {profile?.bio && <p className="bio">{profile.bio}</p>}
        </div>
        <nav className="links">
          <a href={profile?.url ?? `https://github.com/${username}`}>GitHub</a>
          {profile?.blog && <a href={profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`}>Website</a>}
        </nav>
      </header>

      {error || slides.length === 0 ? (
        <p className="notice">{error ?? "No public projects yet."}</p>
      ) : (
        <Carousel slides={slides} />
      )}

      <footer>Projects from GitHub, most recently active first · refreshed hourly</footer>
    </main>
  );
}
