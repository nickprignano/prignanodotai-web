import { reader } from "./content.ts";
import { TIME_ZONE, type ProjectItem } from "./items.ts";

// The "Featured" box at the top of /projects: one item Nick nominates in
// content/featured.json, to ask for help with it or give it special
// attention, optionally with a countdown to a release. An empty `item`
// means nothing is nominated and the box doesn't render.

export type Featured = {
  /** Which item: a repo name ("nerdio-hcl"), a manual item or event id, or a full item id ("github:owner/repo"). */
  item: string;
  /** Small label above the title; "Featured" by default. */
  heading: string;
  /** Why it's featured. The item's own description shows when this is empty. */
  message: string | null;
  /** A button, like "Try the beta" or "Open an issue". */
  cta: { label: string; href: string } | null;
  /** Counts down to `to` (an ISO time); hidden once it's reached. */
  countdown: { to: string; label: string } | null;
};

const LOCAL_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/;

/** Checks content/featured.json. A bad file fails the build with a clear message. */
export function parseFeatured(raw: unknown): Featured | null {
  const r = reader(raw, "content/featured.json");
  const item = r.str("item");
  if (item === null) return null;

  let cta: Featured["cta"] = null;
  if (r.raw.cta !== undefined && r.raw.cta !== null) {
    const c = reader(r.raw.cta, "content/featured.json cta");
    cta = { label: c.need("label"), href: c.need("href") };
    if (!/^(https?:\/\/|\/)/.test(cta.href)) c.fail(`"href" must start with https:// or /`);
  }

  let countdown: Featured["countdown"] = null;
  if (r.raw.countdown !== undefined && r.raw.countdown !== null) {
    const c = reader(r.raw.countdown, "content/featured.json countdown");
    const to = toInstant(c.need("to"));
    if (to === null) c.fail(`"to" must be a date like 2026-12-01, a time like 2026-12-01T09:00 (America/New_York), or an ISO time with an offset`);
    countdown = { to: to as string, label: c.str("label") ?? "Release" };
  }

  return { item, heading: r.str("heading") ?? "Featured", message: r.str("message"), cta, countdown };
}

/**
 * Turns "2026-12-01" (midnight) or "2026-12-01T09:00" in America/New_York, or
 * any ISO time with an offset, into an ISO UTC time. Null if it isn't one.
 */
export function toInstant(value: string): string | null {
  const m = LOCAL_TIME.exec(value);
  if (!m) {
    const t = Date.parse(value);
    return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) && !Number.isNaN(t) ? new Date(t).toISOString() : null;
  }
  const [, y, mo, d, h = "00", mi = "00"] = m;
  const wall = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  if (Number.isNaN(wall) || new Date(wall).toISOString().slice(0, 10) !== `${y}-${mo}-${d}`) return null;
  // The zone's offset at that moment, read twice so a DST change between the
  // guess and the answer still lands on the right hour.
  let t = wall - offsetMs(wall);
  t = wall - offsetMs(t);
  return new Date(t).toISOString();
}

function offsetMs(t: number): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(t)
    .find((p) => p.type === "timeZoneName")!.value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  return m ? (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + +m[3]) * 60_000 : 0;
}

/** Finds the nominated item. Matching ignores case, and a repo can be named without its owner. */
export function findFeatured<T extends ProjectItem>(items: T[], key: string): T | null {
  const k = key.toLowerCase();
  return (
    items.find((i) => {
      const id = i.id.toLowerCase();
      const name = id.slice(id.indexOf(":") + 1);
      return id === k || name === k || name.endsWith(`/${k}`);
    }) ?? null
  );
}
