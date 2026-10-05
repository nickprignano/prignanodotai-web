# prignanodotai-web

A personal portfolio site generated from GitHub. It shows public repos in a full-screen carousel, most recently pushed first, and refreshes itself automatically.

## How it works

- `lib/github.ts` fetches the profile and all public repos for `GITHUB_USERNAME` from the GitHub REST API.
- It filters out forks, archived repos, the `<username>/<username>` profile-README repo and anything in `PORTFOLIO_EXCLUDE`, then sorts by `pushed_at` (newest first).
- For each repo it also fetches the README. Its opening prose paragraphs become the description.
- Each project gets animated line art (`app/project-art.tsx`), drawn on a canvas. The repo name picks one of three styles (drifting flow-field trails, rippling wave lines, or a slowly turning harmonograph) and seeds its shape and motion; the palette comes from the repo's language. Only the slide in view animates, and with "reduce motion" on it shows a still frame. If the README contains a real screenshot (the first non-badge image, at least 800px wide and landscape), that is shown instead.
- `app/carousel.tsx` shows one project at a time in a page that never scrolls vertically. The mouse wheel, arrow keys, swipes, the arrow buttons and the dots all move between projects. Images load only as their slide comes near.
- `app/page.tsx` renders the list with Next.js Incremental Static Regeneration (`revalidate = 3600`). The page is served statically and rebuilt in the background at most once an hour, so new activity shows up without redeploying.
- Everything comes straight from GitHub. To change how a project appears, edit its **README** (opening paragraph, plus a screenshot if you want one instead of the artwork), **website** (shown as "Live ↗") and **topics**.

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
| `PORTFOLIO_LIMIT` | `24` | Max projects shown. Each costs one README request, and Cloudflare's free plan allows 50 outbound requests per render |

## Deploy to Cloudflare

The site runs on Cloudflare Workers through the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare). Rendered pages are cached in Workers KV, and they regenerate in the background once they're an hour old.

### Option A: Git integration (auto-deploy on push)

1. In the Cloudflare dashboard go to **Workers & Pages → Create → Import a repository** and pick this repo.
2. Under **Settings → Build**, set:
   - Build command: `npm run build:cf`
   - Deploy command: `npm run deploy`
   - Production branch: `main`

   `npm run deploy` uploads the Worker first, which makes wrangler create the KV namespace on the first deploy. Then it fills the KV cache with the pre-rendered page. Don't use the default `npx wrangler deploy`: it hands off to `opennextjs-cloudflare deploy`, which fills the cache *before* uploading, so the first deploy fails with "No KV namespace ID found for binding NEXT_INC_CACHE_KV".
3. Under **Settings → Variables and Secrets**, add `GITHUB_TOKEN` as a secret (optional, but recommended). Add it as a **build** variable too, because the page is also rendered once during the build.
4. Attach your domain under **Settings → Domains & Routes**.

### Option B: From your machine

```bash
npx wrangler login
npm run build:cf && npm run deploy
npx wrangler secret put GITHUB_TOKEN   # optional
```

On the first deploy wrangler creates the `NEXT_INC_CACHE_KV` namespace automatically. Non-secret settings (`GITHUB_USERNAME`, `PORTFOLIO_EXCLUDE`, `PORTFOLIO_INCLUDE_FORKS`) live under `vars` in `wrangler.jsonc`.

To test the Workers build locally, run `npm run preview` (put secrets in `.dev.vars`; see `.dev.vars.example`).
