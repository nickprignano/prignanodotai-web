import { getProfile, getRepos, getUsername, type Profile, type Repo } from "@/lib/github";
import { formatDate, languageColor, timeAgo } from "@/lib/format";

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

  return (
    <main className="container">
      <header className="hero">
        {profile && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={profile.avatarUrl} alt="" width={88} height={88} />
        )}
        <div>
          <h1>{profile?.name ?? username}</h1>
          {profile?.bio && <p className="bio">{profile.bio}</p>}
          <p className="links">
            <a href={profile?.url ?? `https://github.com/${username}`}>github.com/{username}</a>
            {profile?.location && <span>{profile.location}</span>}
          </p>
        </div>
      </header>

      <section>
        <div className="section-head">
          <h2>Projects</h2>
          <span className="muted">Sorted by most recent activity</span>
        </div>

        {error && <p className="notice">{error}</p>}
        {!error && repos.length === 0 && <p className="notice">No public projects yet.</p>}

        <ol className="repos">
          {repos.map((repo) => {
            const active = now - Date.parse(repo.pushedAt) < ACTIVE_WINDOW_MS;
            return (
              <li key={repo.id} className="card">
                <div className="card-head">
                  <h3>
                    <a href={repo.url}>{repo.name}</a>
                  </h3>
                  <time
                    dateTime={repo.pushedAt}
                    title={`Last push ${formatDate(repo.pushedAt)}`}
                    className={active ? "activity active" : "activity"}
                  >
                    {timeAgo(repo.pushedAt, now)}
                  </time>
                </div>

                {repo.description && <p className="desc">{repo.description}</p>}

                {repo.topics.length > 0 && (
                  <ul className="topics">
                    {repo.topics.map((t) => (
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
                  {repo.isFork && <span>fork</span>}
                  {repo.homepage && (
                    <a className="live" href={repo.homepage}>
                      Live ↗
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="muted">Generated from GitHub · refreshed hourly</footer>
    </main>
  );
}
