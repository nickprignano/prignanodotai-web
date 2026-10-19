// Events from content/events/<year>.json: parsing, checks, and the derived
// facts the pages need (upcoming or past, date labels, link groups, JSON-LD).
// Whether an event is upcoming or past is never stored; it comes from today's
// date, so nothing goes stale. This file has no Next.js imports so the content
// check (scripts/check-content.ts) can run it under plain Node.

import { addDays, DAY, reader } from "./content.ts";

export const ROLES = ["speaker", "panelist", "host", "organizer", "attendee"] as const;
export const STATUSES = ["scheduled", "cancelled", "postponed"] as const;
export const LINK_TYPES = ["photos", "video", "post", "slides", "notes", "recording", "code", "article", "other"] as const;

export type Role = (typeof ROLES)[number];
export type Status = (typeof STATUSES)[number];
export type LinkType = (typeof LINK_TYPES)[number];

export type EventLink = {
  type: LinkType;
  url: string;
  label: string;
  /** Where the link goes, in words, like "YouTube" or "Google Photos". */
  site: string;
  /** A Wayback Machine copy to use once the original is gone. */
  archived: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  /** YYYY-MM-DD, in the event's own time zone. */
  start: string;
  /** YYYY-MM-DD; the same as start for a one-day event. */
  end: string;
  /** Local start and end time ("12:00", "15:00"); null for all day. */
  time: { from: string; to: string | null } | null;
  timeZone: string;
  status: Status;
  role: Role | null;
  organizer: { name: string; url: string | null } | null;
  /** Sponsors as the event lists them. Never Nick's employer or customers (repo rule). */
  sponsors: string[];
  location: { venue: string | null; city: string; region: string | null; country: string } | null;
  online: boolean;
  /** The official event page. */
  url: string | null;
  description: string | null;
  talk: { title: string; abstract: string | null } | null;
  links: EventLink[];
  carousel: boolean;
  pinned: boolean;
  topics: string[];
};

const DEFAULT_TIME_ZONE = "America/New_York";
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Parses every year file and checks the whole set. Throws on the first problem. */
export function loadEvents(files: Record<string, unknown>): EventItem[] {
  const events: EventItem[] = [];
  const seen = new Map<string, string>();
  for (const [year, entries] of Object.entries(files)) {
    const file = `content/events/${year}.json`;
    if (!Array.isArray(entries)) throw new Error(`${file}: must be a list of events`);
    entries.forEach((raw, index) => {
      const event = parseEvent(raw, `${file} entry ${index}`);
      if (event.start.slice(0, 4) !== year) {
        throw new Error(`${file} entry ${index} (${event.id}): starts in ${event.start.slice(0, 4)}, so it belongs in content/events/${event.start.slice(0, 4)}.json`);
      }
      const other = seen.get(event.id);
      if (other) throw new Error(`${file} entry ${index}: id "${event.id}" is already used in ${other}`);
      seen.set(event.id, file);
      events.push(event);
    });
  }
  return events.sort(byStart);
}

export function parseEvent(raw: unknown, where: string): EventItem {
  const id = (raw as { id?: unknown })?.id;
  const r = reader(raw, `${where}${typeof id === "string" ? ` (${id})` : ""}`);

  const eventId = r.need("id");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(eventId)) r.fail(`"id" must be lowercase words joined by dashes, like weuc-chicago-2026`);
  const start = r.day("start") ?? r.fail(`"start" is required`);
  const end = r.day("end") ?? start;
  if (end < start) r.fail(`"end" is before "start"`);

  let time: EventItem["time"] = null;
  const rawTime = r.str("time");
  if (rawTime) {
    const [from, to = null, extra] = rawTime.split("-");
    if (extra !== undefined || !TIME.test(from) || (to !== null && !TIME.test(to))) {
      r.fail(`"time" must look like 18:30 or 12:00-15:00 (24-hour, local time)`);
    }
    time = { from, to };
  }

  const timeZone = r.str("timeZone") ?? DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    r.fail(`"timeZone" must be a name like America/Chicago`);
  }

  const online = r.bool("online") === true;
  let location: EventItem["location"] = null;
  if (r.raw.location !== undefined && r.raw.location !== null) {
    const l = reader(r.raw.location, `${r.where} location`);
    location = { venue: l.str("venue"), city: l.need("city"), region: l.str("region"), country: l.str("country") ?? "US" };
  } else if (!online) {
    r.fail(`needs a "location" with at least a city, or "online": true`);
  }

  let organizer: EventItem["organizer"] = null;
  const organizerName = r.str("organizer");
  if (organizerName) organizer = { name: organizerName, url: r.str("organizerUrl") };

  let talk: EventItem["talk"] = null;
  if (r.raw.talk !== undefined && r.raw.talk !== null) {
    const t = reader(r.raw.talk, `${r.where} talk`);
    talk = { title: t.need("title"), abstract: t.str("abstract") };
  }

  const url = r.str("url");
  if (url) checkUrl(url, `${r.where}: "url"`);

  const rawLinks = r.raw.links ?? [];
  if (!Array.isArray(rawLinks)) r.fail(`"links" must be a list`);
  const links = (rawLinks as unknown[]).map((raw, i) => parseLink(raw, `${r.where} link ${i}`));

  return {
    id: eventId,
    title: r.need("title"),
    start,
    end,
    time,
    timeZone,
    status: r.oneOf("status", STATUSES) ?? "scheduled",
    role: r.oneOf("role", ROLES),
    organizer,
    sponsors: r.strings("sponsors"),
    location,
    online,
    url,
    description: r.str("description"),
    talk,
    links,
    carousel: r.bool("carousel") ?? true,
    pinned: r.bool("pinned") ?? true,
    topics: r.strings("topics"),
  };
}

function parseLink(raw: unknown, where: string): EventLink {
  const r = reader(raw, where);
  const type = r.oneOf("type", LINK_TYPES) ?? r.fail(`"type" is required (${LINK_TYPES.join(", ")})`);
  const url = r.need("url");
  checkUrl(url, `${where}: "url"`);
  const archived = r.str("archived");
  if (archived) checkUrl(archived, `${where}: "archived"`);
  const site = siteName(url);
  return { type, url, label: r.str("label") ?? defaultLabel(type, site), site, archived };
}

/** Rejects links that would leak more than they should or break soon. */
function checkUrl(url: string, where: string): void {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error(`${where} isn't a valid URL`);
  }
  if (u.protocol !== "https:") throw new Error(`${where} must start with https://`);
  // LinkedIn share links carry the author's name and the post's text in the
  // URL (company names included). The short form points at the same post.
  if (/(^|\.)linkedin\.com$/.test(u.hostname) && u.pathname.startsWith("/posts/")) {
    const activity = u.pathname.match(/activity-(\d+)/)?.[1];
    throw new Error(
      `${where} is a long LinkedIn share link; use the short form` +
        (activity ? `: https://www.linkedin.com/feed/update/urn:li:activity:${activity}/` : ` (https://www.linkedin.com/feed/update/urn:li:activity:<id>/)`),
    );
  }
}

const SITES: [RegExp, string][] = [
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/^photos\.google\.com$|^photos\.app\.goo\.gl$/, "Google Photos"],
  [/^docs\.google\.com$/, "Google Docs"],
  [/^drive\.google\.com$/, "Google Drive"],
  [/(^|\.)icloud\.com$/, "iCloud"],
  [/(^|\.)flickr\.com$|^flic\.kr$/, "Flickr"],
  [/(^|\.)vimeo\.com$/, "Vimeo"],
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)speakerdeck\.com$/, "Speaker Deck"],
  [/(^|\.)slideshare\.net$/, "SlideShare"],
  [/^blog\.prignano\.ai$/, "the blog"],
  [/^web\.archive\.org$/, "the Wayback Machine"],
];

/** A readable name for where a link goes. */
export function siteName(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return SITES.find(([re]) => re.test(host))?.[1] ?? host;
}

function defaultLabel(type: LinkType, site: string): string {
  if (type === "post" && site === "LinkedIn") return "LinkedIn post";
  return { photos: "Photos", video: "Video", post: "Post", slides: "Slides", notes: "Notes", recording: "Recording", code: "Code", article: "Article", other: "Link" }[type];
}

/** How link types are grouped into tiles on the pages. */
export const LINK_GROUPS: { name: string; icon: string; types: LinkType[] }[] = [
  { name: "Photos", icon: "◫", types: ["photos"] },
  { name: "Video", icon: "▶", types: ["video", "recording"] },
  { name: "Posts", icon: "✎", types: ["post", "article"] },
  { name: "Slides & notes", icon: "▤", types: ["slides", "notes", "code"] },
  { name: "More", icon: "↗", types: ["other"] },
];

export function groupLinks(links: EventLink[]) {
  return LINK_GROUPS.map((g) => ({ ...g, links: links.filter((l) => g.types.includes(l.type)) })).filter((g) => g.links.length > 0);
}

export function byStart(a: EventItem, b: EventItem): number {
  return a.start.localeCompare(b.start) || (a.time?.from ?? "").localeCompare(b.time?.from ?? "") || a.id.localeCompare(b.id);
}

/** True once the event's last day has passed. `day` is today as YYYY-MM-DD. */
export function isOver(event: EventItem, day: string): boolean {
  return day > event.end;
}

/** The last day an event stays on the home carousel: the day it ends. */
export function carouselUntil(event: EventItem): string {
  return event.end;
}

export const ROLE_LABELS: Record<Role, string> = {
  speaker: "Speaking",
  panelist: "Panel",
  host: "Hosting",
  organizer: "Organizing",
  attendee: "Attending",
};

const parts = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", { timeZone: "UTC", ...o });
  return { year: day.slice(0, 4), month: f({ month: "short" }), monthLong: f({ month: "long" }), day: String(d.getUTCDate()) };
};

/** "Nov 4, 2026", "Nov 4–6, 2026" or "Dec 30, 2026 – Jan 2, 2027". */
export function formatRange(event: EventItem, long = false): string {
  const s = parts(event.start);
  const e = parts(event.end);
  const m = (p: ReturnType<typeof parts>) => (long ? p.monthLong : p.month);
  if (event.start === event.end) return `${m(s)} ${s.day}, ${s.year}`;
  if (s.year !== e.year) return `${m(s)} ${s.day}, ${s.year} – ${m(e)} ${e.day}, ${e.year}`;
  if (s.month !== e.month) return `${m(s)} ${s.day} – ${m(e)} ${e.day}, ${s.year}`;
  return `${m(s)} ${s.day}–${e.day}, ${s.year}`;
}

/** The big date block on a row: "NOV" over "4" or "4–6". */
export function dateBlock(event: EventItem): { month: string; days: string } {
  const s = parts(event.start);
  const e = parts(event.end);
  if (event.start === event.end) return { month: s.month.toUpperCase(), days: s.day };
  if (s.month !== e.month) return { month: `${s.month} – ${e.month}`.toUpperCase(), days: `${s.day}–${e.day}` };
  return { month: s.month.toUpperCase(), days: `${s.day}–${e.day}` };
}

/** "12:00 PM – 3:00 PM CST", or null for an all-day event. */
export function formatTime(event: EventItem): string | null {
  if (!event.time) return null;
  const at = (hm: string) => new Date(`${event.start}T${hm}:00${offset(event.start, hm, event.timeZone)}`);
  const f = (d: Date, zone: boolean) =>
    d.toLocaleTimeString("en-US", { timeZone: event.timeZone, hour: "numeric", minute: "2-digit", ...(zone ? { timeZoneName: "short" } : {}) });
  const from = at(event.time.from);
  return event.time.to ? `${f(from, false)} – ${f(at(event.time.to), true)}` : f(from, true);
}

/** "Schaumburg, IL" or "Online". */
export function place(event: EventItem): string {
  const l = event.location;
  const city = l ? [l.city, l.region ?? (l.country !== "US" ? l.country : null)].filter(Boolean).join(", ") : null;
  if (city && event.online) return `${city} and online`;
  return city ?? "Online";
}

/** The UTC offset ("-05:00") of a time zone at a local date and time. */
export function offset(day: string, hm: string, timeZone: string): string {
  // Guess with the offset at noon UTC that day, which is right except in the
  // hours around a daylight saving switch.
  const probe = new Date(`${day}T${hm}:00Z`);
  const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(probe)
    .find((p) => p.type === "timeZoneName")?.value;
  const m = name?.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return m ? `${m[1]}:${m[2] ?? "00"}` : "+00:00";
}

/** schema.org Event data for search engines. */
export function eventJsonLd(event: EventItem, person: { name: string; url: string }) {
  const when = (day: string, hm: string | null | undefined) => (hm ? `${day}T${hm}:00${offset(day, hm, event.timeZone)}` : day);
  const physical = event.location && {
    "@type": "Place",
    name: event.location.venue ?? event.location.city,
    address: {
      "@type": "PostalAddress",
      addressLocality: event.location.city,
      ...(event.location.region ? { addressRegion: event.location.region } : {}),
      addressCountry: event.location.country,
    },
  };
  const virtual = event.online && { "@type": "VirtualLocation", url: event.url ?? undefined };
  const presenting = event.role === "speaker" || event.role === "panelist" || event.role === "host";
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: when(event.start, event.time?.from),
    endDate: when(event.end, event.time?.to ?? (event.end === event.start ? event.time?.from : null)),
    eventStatus: `https://schema.org/Event${event.status === "cancelled" ? "Cancelled" : event.status === "postponed" ? "Postponed" : "Scheduled"}`,
    eventAttendanceMode: `https://schema.org/${physical && virtual ? "Mixed" : virtual ? "Online" : "Offline"}EventAttendanceMode`,
    location: physical && virtual ? [physical, virtual] : (physical || virtual || undefined),
    ...(event.description ? { description: event.description } : {}),
    ...(event.url ? { url: event.url } : {}),
    ...(event.organizer ? { organizer: { "@type": "Organization", name: event.organizer.name, ...(event.organizer.url ? { url: event.organizer.url } : {}) } } : {}),
    ...(presenting ? { performer: { "@type": "Person", name: person.name, url: person.url } } : {}),
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export { addDays, DAY };
