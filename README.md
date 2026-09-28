# prignanodotai-web

A personal portfolio site generated from GitHub. It lists public repos, most recently pushed first, and refreshes itself automatically.

## How it works

- `lib/github.ts` fetches the profile and all public repos for `GITHUB_USERNAME` from the GitHub REST API.
- It filters out forks, archived repos, the `<username>/<username>` profile-README repo and anything in `PORTFOLIO_EXCLUDE`, then sorts by `pushed_at` (newest first).
- `app/page.tsx` renders the list with Next.js Incremental Static Regeneration (`revalidate = 3600`). The page is served statically and rebuilt in the background at most once an hour, so new activity shows up without redeploying.
- Repo metadata comes straight from GitHub, so edit a repo's **description**, **website** (shown as "Live ↗") and **topics** on GitHub to change how it appears here.

## Development

```bash
cp .env.example .env.local   # optional
npm install
npm run dev                  # http://localhost:3000
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `GITHUB_USERNAME` | `nickprignano` | Whose repos to show |
| `GITHUB_TOKEN` | – | Optional; raises the API rate limit (no scopes needed) |
| `PORTFOLIO_EXCLUDE` | – | Comma-separated repo names to hide |
| `PORTFOLIO_INCLUDE_FORKS` | `false` | Show forked repos |

## Deploy

Deploy to any host that supports Next.js ISR, such as Vercel (import the repo; it needs no extra config). Set `GITHUB_TOKEN` in the host's environment for reliable rate limits.
