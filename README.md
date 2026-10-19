# prignanodotai-web

A personal portfolio site generated from GitHub. It shows public repos, plus upcoming events and other hand-added items, in a full-screen carousel, and refreshes itself automatically.

## How it works

- The carousel merges items from several **sources** (`lib/sources/`). Each source turns its own data into the same `ProjectItem` shape (`lib/items.ts`), and `loadItems` merges them: pinned items first, in source order, then everything else by date, newest first. Items past their `showUntil` day are dropped. Today there are three sources, listed in `lib/sources/index.ts`: upcoming events from `content/events/`, manual items from `content/manual-items.json`, then GitHub repos. To add another (an RSS or API feed, say), write a `Source` that returns `ProjectItem`s and add it to that list.
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

## Events

Events live in `content/events/<year>.json` and feed the **/events** schedule, a scrapbook page for each past year (**/events/2025**) and the home carousel. To add an event, or photos, videos and posts from one, see [content/events/README.md](content/events/README.md).

## Adding a manual item

To show something in the carousel that is neither a repo nor an event (an article, a recording), add an entry to `content/manual-items.json` and open a PR:

```json
{
  "id": "some-article-2026",
  "title": "An article I wrote",
  "badge": "Article",
  "description": "One or two sentences for the card.",
  "url": "https://example.com/article",
  "linkLabel": "Read it",
  "date": "2026-11-04",
  "pinned": false,
  "topics": ["writing"]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Unique name for the item; also seeds its line art |
| `title` | yes | Card title |
| `url` | yes | Where the title, artwork and button link |
| `date` | yes | `YYYY-MM-DD`; shown on the card and used to sort unpinned items |
| `description` | no | Card text |
| `badge` | no | Small label above the title, like "Article" |
| `linkLabel` | no | Button text (default "Visit") |
| `showUntil` | no | Last day the item is shown, `YYYY-MM-DD` in America/New_York. It disappears the next day, within an hour of midnight, with no redeploy. Leave it out to keep the item forever |
| `pinned` | no | `true` puts it at the front, after upcoming events and ahead of featured repos (pinned items keep their order in the file) |
| `topics` | no | Chips under the description |
| `image` | no | Screenshot URL shown instead of the line art (at least 800px wide and landscape) |
| `color` | no | Hex color for the line art palette |

A malformed entry fails the build with a message naming the entry and field. Remove expired entries whenever convenient; they're already hidden.

## Projects page and the featured box

`/projects` (`app/projects/page.tsx`) lists every item from the carousel as a grid of cards, refreshed hourly like the home page. The header's **Projects** link points here.

To give one item special attention (asking for help, a release coming up), nominate it in `content/featured.json` and open a PR:

```json
{
  "item": "nerdio-hcl",
  "heading": "Help wanted",
  "message": "v1.0 is close. Looking for people to try the beta and tell me what breaks.",
  "cta": { "label": "Try the beta", "href": "https://github.com/nickprignano/nerdio-hcl/issues" },
  "countdown": { "to": "2026-11-15T09:00", "label": "v1.0 release" }
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `item` | yes | Which item: a repo name (`nerdio-hcl`), a manual item or event `id`, or a full item id like `github:nickprignano/nerdio-hcl`. Case doesn't matter. Empty (`""`) turns the box off |
| `heading` | no | Small label above the title (default "Featured") |
| `message` | no | Your note; the item's own description shows when it's empty |
| `cta` | no | A button: `label` and `href` (`https://…` or a path like `/contact`). `null` for none |
| `countdown` | no | `to` is `YYYY-MM-DD` (midnight) or `YYYY-MM-DDTHH:MM`, both in America/New_York, or an ISO time with an offset; `label` defaults to "Release". It ticks live and disappears once the time passes. `null` for none |

The item stays in the grid below too. If `item` matches nothing (a typo, an expired event), the box is simply left out and the server logs a warning; `npm run check:content` checks the file's shape.

## Contact page and form

`/contact` lists Nick's socials (`SOCIALS` in `lib/site.ts`) and has a message form. `/contact?topic=speaking` opens with the speaking topic picked. The form posts to `/api/contact` (`app/api/contact/route.ts`), which emails good messages to Nick through Cloudflare Email Routing. The reply-to is the sender, so answering is just Reply.

Every message goes through, in order:

1. **Same-site check and a rate limit**: 3 messages a minute per IP and per sender address (the `CONTACT_RATE_LIMIT` binding).
2. **Bot traps**: a hidden honeypot field, and a minimum of 3 seconds between page load and submit.
3. **[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)**, verified on the server. It's invisible for most people.
4. **Junk rules** (`lib/contact.ts`): link dumps, SEO and backlink pitches, sales and lead-gen pitches, crypto and money offers, and text written to steer the AI check. These can't be talked out of a verdict.
5. **An AI check** with [Workers AI](https://developers.cloudflare.com/workers-ai/) (`AI_MODEL` in `lib/contact.ts`). It asks whether a person wrote to Nick in particular, rather than whether the text sounds machine-written, since plenty of real people draft with AI. The message is passed as data the model is told never to obey.

Junk gets the same "sent" answer as a real message, so bots learn nothing, and is logged instead of emailed (Workers & Pages → prignanodotai-web → Observability, search for `"contact":"dropped"`). A message the AI is unsure about, or that arrives while the AI is down, is delivered with `[Check]` in the subject. Every email ends with a "Screening" line saying why it got through.

### Turning it on

The form stays hidden, with an email link in its place, until `turnstileSiteKey` in `lib/site.ts` is set. In the Cloudflare dashboard:

1. **Email → Email Routing** for prignano.ai: under **Destination addresses**, check that the inbox nick@prignano.ai forwards to is listed and **Verified**.
2. **Turnstile → Add widget**: name it "prignano.ai contact", add the hostname `prignano.ai`, mode **Managed**. Put the **site key** in `lib/site.ts` (it's public).
3. **Workers & Pages → prignanodotai-web → Settings → Variables and Secrets**, add two **secrets**:
   - `TURNSTILE_SECRET_KEY`: the widget's secret key.
   - `CONTACT_TO`: the verified destination address from step 1. It's a secret so no inbox address lives in this public repo.
4. Deploy, send yourself a message from `/contact`, and send one that should be junk to see it in the logs.

Workers AI and the rate limiter need no setup; their bindings are in `wrangler.jsonc`. The AI check costs a few dozen of the free plan's 10,000 daily Workers AI neurons per message. PR previews have none of these bindings, so the form there answers that it isn't switched on.

Locally, `.dev.vars.example` has Cloudflare's always-pass Turnstile test keys, and `next dev` shows the form with the test site key. Sending is simulated, and there's no AI check locally, so messages show as `ai:unavailable`.

## Checks and the link checker

- Every PR runs `.github/workflows/check.yml`: typecheck, `npm test`, `npm run check:content` (validates `content/`), and a check that fails only on links in `content/` that are clearly gone (404, 410, a domain that no longer resolves).
- `.github/workflows/links.yml` checks every link on prignano.ai and blog.prignano.ai each Monday, plus the links in `content/` and the blog's posts, using [lychee](https://lychee.cli.rs/) (settings in `.github/lychee.toml`). Results go to one GitHub issue, "Link check report", which reopens when something breaks and closes when everything passes. It skips the run if either site is down rather than reporting every link as dead. LinkedIn, Instagram, X and Facebook block automated checks, so their links can't be verified; YouTube links are checked through YouTube's oEmbed endpoint, which reports deleted videos. GitHub pauses scheduled workflows after 60 days without commits; any commit or a manual run turns it back on.

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
