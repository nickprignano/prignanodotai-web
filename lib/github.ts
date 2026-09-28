const API = "https://api.github.com";

// How long (seconds) fetched GitHub data is cached before Next.js refetches it.
export const REVALIDATE_SECONDS = 3600;

export type Repo = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  isFork: boolean;
  pushedAt: string;
};

export type Profile = {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  url: string;
  blog: string | null;
  location: string | null;
};

type ApiRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  private: boolean;
  pushed_at: string;
};

export function getUsername(): string {
  return process.env.GITHUB_USERNAME?.trim() || "nickprignano";
}

async function gh<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    headers,
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getProfile(username = getUsername()): Promise<Profile> {
  const u = await gh<{
    login: string;
    name: string | null;
    bio: string | null;
    avatar_url: string;
    html_url: string;
    blog: string | null;
    location: string | null;
  }>(`/users/${encodeURIComponent(username)}`);
  return {
    login: u.login,
    name: u.name,
    bio: u.bio,
    avatarUrl: u.avatar_url,
    url: u.html_url,
    blog: u.blog || null,
    location: u.location,
  };
}

/** Public repos owned by the user, most recently pushed first. */
export async function getRepos(username = getUsername()): Promise<Repo[]> {
  const exclude = new Set(
    (process.env.PORTFOLIO_EXCLUDE ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  const includeForks = process.env.PORTFOLIO_INCLUDE_FORKS === "true";

  const all: ApiRepo[] = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await gh<ApiRepo[]>(
      `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100) break;
  }

  return all
    .filter((r) => !r.private && !r.archived)
    .filter((r) => includeForks || !r.fork)
    // The special <username>/<username> repo is the profile README, not a project.
    .filter((r) => r.name.toLowerCase() !== username.toLowerCase())
    .filter((r) => !exclude.has(r.name.toLowerCase()))
    .map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      homepage: r.homepage || null,
      language: r.language,
      topics: r.topics ?? [],
      stars: r.stargazers_count,
      forks: r.forks_count,
      isFork: r.fork,
      pushedAt: r.pushed_at,
    }))
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt));
}
