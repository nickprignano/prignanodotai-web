import { summarizeReadme } from "./readme";

const API = "https://api.github.com";

// How long (seconds) fetched GitHub data is cached before Next.js refetches it.
export const REVALIDATE_SECONDS = 3600;

export type Repo = {
  id: number;
  name: string;
  fullName: string;
  /** Summary from the README, falling back to the repo's GitHub description. */
  description: string | null;
  /** First non-badge image in the README, else GitHub's generated social card. */
  image: string;
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

function ghFetch(path: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API}${path}`, {
    headers,
    next: { revalidate: REVALIDATE_SECONDS },
  });
}

async function gh<T>(path: string): Promise<T> {
  const res = await ghFetch(path);
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
  // Each repo costs one extra request for its README. Cloudflare's free plan
  // allows 50 outbound requests per render, so keep this comfortably below it.
  const limit = Number(process.env.PORTFOLIO_LIMIT) || 24;

  const all: ApiRepo[] = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await gh<ApiRepo[]>(
      `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100) break;
  }

  const repos = all
    .filter((r) => !r.private && !r.archived)
    .filter((r) => includeForks || !r.fork)
    // The special <username>/<username> repo is the profile README, not a project.
    .filter((r) => r.name.toLowerCase() !== username.toLowerCase())
    .filter((r) => !exclude.has(r.name.toLowerCase()))
    .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, limit);

  return Promise.all(
    repos.map(async (r) => {
      const readme = await getReadme(r.full_name);
      return {
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: readme?.description ?? r.description,
        image: readme?.image ?? `https://opengraph.githubassets.com/1/${r.full_name}`,
        url: r.html_url,
        homepage: r.homepage || null,
        language: r.language,
        topics: r.topics ?? [],
        stars: r.stargazers_count,
        forks: r.forks_count,
        isFork: r.fork,
        pushedAt: r.pushed_at,
      };
    }),
  );
}

async function getReadme(fullName: string) {
  try {
    const res = await ghFetch(`/repos/${fullName}/readme`);
    if (!res.ok) return null;
    const data = (await res.json()) as { content: string; encoding: string; download_url: string };
    if (data.encoding !== "base64") return null;
    const bytes = Uint8Array.from(atob(data.content.replace(/\s/g, "")), (c) => c.charCodeAt(0));
    return summarizeReadme(new TextDecoder().decode(bytes), data.download_url);
  } catch (e) {
    console.error(`README for ${fullName} failed`, e);
    return null;
  }
}
