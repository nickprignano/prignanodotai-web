import type { Metadata } from "next";
import { EVENTS } from "@/content/events";
import { eventJsonLd, isOver, jsonLdScript, type EventItem } from "@/lib/events";
import { today } from "@/lib/items";
import { SITE } from "@/lib/site";
import SiteHeader from "../site-header";
import EventArt from "./event-art";
import { EventFacts, EventRow, EventTitle, LinkRow, RolePill } from "./event-parts";

const title = `Events — ${SITE.name}`;
const description = `Where ${SITE.name} is speaking and showing up this year, plus a scrapbook of past events.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/events" },
  openGraph: { type: "website", siteName: SITE.name, title, description, url: "/events", images: SITE.image },
  twitter: { card: "summary_large_image", title, description, images: SITE.image },
};

// Re-render at most once an hour so events move from upcoming to past on
// their own, within an hour of midnight in America/New_York.
export const revalidate = 3600;

const monthName = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "long" });

/** Groups events under month headings, in order. */
function byMonth(events: EventItem[]) {
  const months = new Map<string, EventItem[]>();
  for (const e of events) {
    const key = e.start.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), e]);
  }
  return [...months].map(([key, list]) => ({ key, name: monthName(`${key}-01`), events: list }));
}

export default function Events() {
  const day = today();
  const year = day.slice(0, 4);

  // This year: everything starting or ending this year, past events included.
  const thisYear = EVENTS.filter((e) => e.start.slice(0, 4) === year || e.end.slice(0, 4) === year);
  // Already announced for next year or later.
  const later = EVENTS.filter((e) => e.start.slice(0, 4) > year);
  const next = EVENTS.find((e) => !isOver(e, day) && e.status !== "cancelled") ?? null;
  const archive = [...new Set(EVENTS.map((e) => e.start.slice(0, 4)))].filter((y) => y < year).sort().reverse();
  const shown = [...thisYear, ...later];

  const Schedule = ({ events }: { events: EventItem[] }) =>
    byMonth(events).map((m) => (
      <section key={m.key} className="ev-month-group" aria-labelledby={`m-${m.key}`}>
        <h3 id={`m-${m.key}`} className="ev-month-heading">
          {m.name}
        </h3>
        <ol className="ev-list">
          {m.events.map((e) => (
            <EventRow key={e.id} event={e} past={isOver(e, day)} next={e === next} />
          ))}
        </ol>
      </section>
    ));

  return (
    <main className="events">
      <SiteHeader current="events" />

      <header className="events-head">
        <h1>Events</h1>
        <p>Where I&apos;m speaking and showing up in {year}. Past events stay on the list, with links to photos, videos and posts as they come in.</p>
      </header>

      {next ? (
        <section className="next-up" aria-labelledby="next-up">
          <EventArt seed={next.id} always />
          <div className="next-up-body">
            <h2 id="next-up" className="eyebrow">
              Next up
            </h2>
            <EventTitle event={next} as="h3" />
            <EventFacts event={next} />
            {next.talk && <p className="ev-talk">Talk: {next.talk.title}</p>}
            {next.description && <p className="next-up-desc">{next.description}</p>}
            <p className="next-up-meta">
              <RolePill event={next} />
            </p>
            <LinkRow event={next} />
          </div>
        </section>
      ) : (
        <p className="notice-inline">Nothing scheduled right now. Check back soon.</p>
      )}

      <section aria-labelledby="schedule">
        <h2 id="schedule" className="section-heading">
          {year} schedule
        </h2>
        {thisYear.length > 0 ? <Schedule events={thisYear} /> : <p className="muted">No events listed for {year} yet.</p>}
      </section>

      {later.length > 0 && (
        <section aria-labelledby="later">
          <h2 id="later" className="section-heading">
            Coming up later
          </h2>
          <Schedule events={later} />
        </section>
      )}

      {archive.length > 0 && (
        <nav className="years" aria-label="Past years">
          <h2 className="section-heading">Past years</h2>
          <ul>
            {archive.map((y) => (
              <li key={y}>
                <a href={`/events/${y}`}>{y}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {shown.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(shown.map((e) => eventJsonLd(e, { name: SITE.name, url: SITE.url }))) }}
        />
      )}
    </main>
  );
}
