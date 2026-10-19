# prignanodotai-web

A personal portfolio site generated from GitHub. It shows public repos, plus hand-added items like events, in a full-screen carousel, and refreshes itself automatically.

## How it works

- The carousel merges items from several **sources** (`lib/sources/`). Each source turns its own data into the same `ProjectItem` shape (`lib/items.ts`), and `loadItems` merges them: pinned items first, in source order, then everything else by date, newest first. Items past their `showUntil` day are dropped. Today there are two sources, listed in `lib/sources/index.ts`: manual items from `content/manual-items.json`, then GitHub repos. To add another (an RSS or API feed, say), write a `Source` that returns `ProjectItem`s and add it to that list.
- `lib/github.ts` fetches the profile and all public repos for `GITHUB_USERNAME` from the GitHub REST API.
- It filters out forks, archived repos, the `<username>/<username>` profile-README repo and anything in `PORTFOLIO_EXCLUDE`, then puts the repos named in `PORTFOLIO_FEATURED` first (in that order) and sorts the rest by `pushed_at` (newest first).
- For each repo it also fetches the README. Its opening prose paragraphs become the description.
- Each project gets animated line art (`app/project-art.tsx`), drawn on a canvas. The repo name picks one of three styles (drifting flow-field trails, rippling wave lines, or a slowly turning harmonograph) and seeds its shape and motion; the palette comes from the repo's language. Only the slide in view animates, and with "reduce motion" on it shows a still frame. If the README contains a real screenshot (the first non-badge image, at least 800px wide and landscape), that is shown instead.
- `app/carousel.tsx` shows one project at a time in a page that never scrolls vertically. The mouse wheel, arrow keys, swipes, the arrow buttons and the dots all move between projects. Images load only as their slide comes near.
- `app/page.tsx` renders the list with Next.js Incremental Static Regeneration (`revalidate = 3600`). The page is served statically and rebuilt in the background at most once an hour, so new activity shows up without redeploying.
- The header, colors and dark-mode toggle come from [prignano-theme](https://github.com/nickprignano/prignano-theme), shared by every prignano.ai site. `app/site-header.tsx` renders the header and `app/theme-toggle.tsx` wires up the toggle. To pick up a theme change, install the new tag as its README describes.
- `lib/site.ts` holds the site URL, the link preview card (`public/og.png`) and the Cloudflare Web Analytics token. `app/sitemap.ts`, `app/robots.ts`, `app/icon.svg` and `app/apple-icon.png` produce the sitemap, robots.txt and icons, and every page sets its canonical URL. `public/.well-known/security.txt` says where to report security issues; renew its `Expires` date each year.
- `next.config.ts` adds HSTS and the other security headers to every page, and `public/_headers` does the same for static files.
- Repos come straight from GitHub. To change how a project appears, edit its **README** (opening paragraph, plus a screenshot if you want one instead of the artwork), **website** (shown as "Live ↗") and **topics**.

## Adding a manual item

To show something that isn't a GitHub repo, such as an event, add an entry to `content/manual-items.json` and open a PR:

```json
{
  "id": "weuc-chicago-2026",
  "title": "Chicago WEUC Meet-Up",
  "badge": "Event",
  "description": "One or two sentences for the card.",
  "url": "https://worldofeuc.org/event-6842635",
  "linkLabel": "Event page",
  "date": "2026-11-04",
  "showUntil": "2026-11-04",
  "pinned": true,
  "topics": ["world-of-euc", "meetup"]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Unique name for the item; also seeds its line art |
| `title` | yes | Card title |
| `url` | yes | Where the title, artwork and button link |
| `date` | yes | `YYYY-MM-DD`; shown on the card and used to sort unpinned items |
| `description` | no | Card text |
| `badge` | no | Small label above the title, like "Event" |
| `linkLabel` | no | Button text (default "Visit") |
| `showUntil` | no | Last day the item is shown, `YYYY-MM-DD` in America/New_York. It disappears the next day, within an hour of midnight, with no redeploy. Leave it out to keep the item forever |
| `pinned` | no | `true` puts it at the front, ahead of featured repos (pinned items keep their order in the file) |
| `topics` | no | Chips under the description |
| `image` | no | Screenshot URL shown instead of the line art (at least 800px wide and landscape) |
| `color` | no | Hex color for the line art palette |

A malformed entry fails the build with a message naming the entry and field. Remove expired entries whenever convenient; they're already hidden.

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
| `PORTFOLIO_FEATURED` | – | Comma-separated repo names pinned to the front in that order and labeled "Featured research" |
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
   Pull requests get a preview deployment through Cloudflare's non-production deploy command, `npx wrangler preview`. Its settings live in the `previews` block of `wrangler.jsonc`. The `build` command there builds the Worker for it, because preview builds skip the dashboard build step. Previews have no KV cache, so they render fresh on every request and never touch the production cache.
3. Under **Settings → Variables and Secrets**, add `GITHUB_TOKEN` as a secret (optional, but recommended). Add it as a **build** variable too, because the page is also rendered once during the build.
4. Attach your domain under **Settings → Domains & Routes**.

### Option B: From your machine

```bash
npx wrangler login
npm run build:cf && npm run deploy
npx wrangler secret put GITHUB_TOKEN   # optional
```

On the first deploy wrangler creates the `NEXT_INC_CACHE_KV` namespace automatically. Non-secret settings (`GITHUB_USERNAME`, `PORTFOLIO_FEATURED`, `PORTFOLIO_EXCLUDE`, `PORTFOLIO_INCLUDE_FORKS`) live under `vars` in `wrangler.jsonc`.

To test the Workers build locally, run `npm run preview` (put secrets in `.dev.vars`; see `.dev.vars.example`).
