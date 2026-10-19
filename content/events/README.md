# Events

Each file here holds one year's events, named by the year they start in (`2026.json`). They feed three places:

- **/events**: this year's schedule, upcoming events highlighted and past ones marked, plus anything already announced for later.
- **/events/2025** and other past years: a scrapbook, one card per event with its photos, videos, posts and slides.
- **The home carousel**: upcoming events, pinned first, until the day they end.

Whether an event is upcoming or past comes from today's date, so nothing needs updating after an event except adding links.

## Adding an event

Add an entry to the year's file and open a PR. The PR check validates the file and fails with the entry and field named if something's off.

```json
{
  "id": "weuc-chicago-2026",
  "title": "Chicago WEUC Meet-Up",
  "start": "2026-11-04",
  "time": "12:00-15:00",
  "timeZone": "America/Chicago",
  "role": "attendee",
  "organizer": "World of EUC",
  "organizerUrl": "https://worldofeuc.org/",
  "location": { "venue": "Andretti Indoor Karting and Games", "city": "Schaumburg", "region": "IL", "country": "US" },
  "url": "https://worldofeuc.org/event-6842635",
  "description": "One short paragraph.",
  "topics": ["world-of-euc", "meetup"]
}
```

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Lowercase words joined by dashes, unique across all years. **Never change it** once published: it's the anchor in links like `/events#weuc-chicago-2026` |
| `title` | yes | Event name |
| `start` | yes | First day, `YYYY-MM-DD`, in the event's local time. Decides which year file the event goes in |
| `end` | no | Last day, for multi-day events (defaults to `start`) |
| `time` | no | Local time, 24-hour: `18:30` or `12:00-15:00`. Leave out for all-day events |
| `timeZone` | no | Like `America/Chicago` (default `America/New_York`) |
| `location` | yes, unless online | `city` required; `venue`, `region` and `country` (default `US`) optional |
| `online` | no | `true` for virtual events; with a `location` too, it's hybrid |
| `role` | no | `speaker`, `panelist`, `host`, `organizer` or `attendee` |
| `talk` | no | `{ "title": "...", "abstract": "..." }` when you're presenting |
| `organizer`, `organizerUrl` | no | Who runs it, as they name themselves |
| `sponsors` | no | List of sponsor names, as the event lists them |
| `url` | no | The official event page |
| `description` | no | One short paragraph |
| `status` | no | `scheduled` (default), `postponed` or `cancelled`. Cancelled events stay listed, struck through |
| `links` | no | The scrapbook; see below |
| `carousel` | no | `false` keeps it off the home page |
| `pinned` | no | `false` sorts it by date in the carousel instead of first |
| `topics` | no | Chips on the carousel card |

**Never put your employer's or customers' names anywhere in these files**, including sponsors, titles, descriptions and URLs (repo rule).

## Adding photos, videos and posts

Add to the event's `links` any time, even years later:

```json
"links": [
  { "type": "photos", "url": "https://photos.app.goo.gl/..." },
  { "type": "video", "url": "https://youtu.be/...", "label": "Talk recording" },
  { "type": "post", "url": "https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/" },
  { "type": "slides", "url": "https://...", "archived": "https://web.archive.org/web/2026/https://..." }
]
```

- `type`: `photos`, `video`, `recording`, `post`, `article`, `slides`, `notes`, `code` or `other`. The scrapbook groups them as Photos, Video, Posts, Slides & notes, and More.
- `label` is optional; it defaults to the type ("LinkedIn post" for LinkedIn).
- Links must be `https://`.
- **LinkedIn posts** must use the short form, `https://www.linkedin.com/feed/update/urn:li:activity:<number>/`. The long share link (`/posts/name_text-activity-...`) carries the post's text in the URL, so the check rejects it and prints the short form to paste instead.
- **`archived`**: when the weekly link check reports a link as gone, add a Wayback Machine copy here instead of deleting the link. The page shows both.
- Link out rather than embedding, and prefer albums and posts you control. Don't add links that tag or name people who haven't agreed to it.

## Starting a new year

Create `2027.json` (a list, `[]` to start) and add two lines to `index.ts`: `import y2027 from "./2027.json";` and `"2027": y2027,` in `FILES`. The check fails if you forget. The previous year's archive page appears on its own on January 1.
