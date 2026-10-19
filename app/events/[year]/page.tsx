import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EVENTS } from "@/content/events";
import { dateBlock, eventJsonLd, jsonLdScript, place, type EventItem } from "@/lib/events";
import { today } from "@/lib/items";
import { SITE } from "@/lib/site";
import SiteHeader from "../../site-header";
import EventArt from "../event-art";
import { EventFacts, EventTitle, LinkGroups, RolePill, statusLabel } from "../event-parts";

// A past year's events as a scrapbook: one card per event with links out to
// the photos, videos, posts and slides that came from it. This year and later
// live on /events, so those years redirect there.

type Params = { params: Promise<{ year: string }> };

// Nothing here changes during the day; re-render daily so a year that has
// just ended turns into an archive page without a redeploy.
export const revalidate = 86400;

const eventsIn = (year: string) => EVENTS.filter((e) => e.start.slice(0, 4) === year);

export function generateStaticParams() {
  const current = today().slice(0, 4);
  return [...new Set(EVENTS.map((e) => e.start.slice(0, 4)))].filter((y) => y < current).map((year) => ({ year }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { year } = await params;
  const title = `${year} events — ${SITE.name}`;
  const description = `A scrapbook of the events ${SITE.name} spoke at and attended in ${year}, with photos, videos and posts.`;
  return {
    title,
    description,
    alternates: { canonical: `/events/${year}` },
    openGraph: { type: "website", siteName: SITE.name, title, description, url: `/events/${year}`, images: SITE.image },
    twitter: { card: "summary_large_image", title, description, images: SITE.image },
  };
}

function summary(events: EventItem[]): string {
  const held = events.filter((e) => e.status !== "cancelled");
  const talks = held.filter((e) => e.role === "speaker" || e.role === "panelist" || e.role === "host").length;
  const cities = new Set(held.filter((e) => e.location).map((e) => place(e))).size;
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  return [n(held.length, "event", "events"), talks > 0 && n(talks, "talk", "talks"), cities > 0 && n(cities, "city", "cities")]
    .filter(Boolean)
    .join(" · ");
}

export default async function YearArchive({ params }: Params) {
  const { year } = await params;
  if (!/^\d{4}$/.test(year)) notFound();
  if (year >= today().slice(0, 4)) redirect("/events");
  const events = eventsIn(year);
  if (events.length === 0) notFound();

  return (
    <main className="events scrapbook">
      <SiteHeader current="events" />

      <header className="events-head">
        <p className="eyebrow">
          <a href="/events">Events</a> / {year}
        </p>
        <h1>{year} in events</h1>
        <p>{summary(events)}</p>
      </header>

      <ol className="cards">
        {events.map((e) => {
          const status = statusLabel(e, true, false);
          return (
            <li key={e.id}>
              <article id={e.id} className={e.status === "cancelled" ? "card is-cancelled" : "card"}>
                <div className="card-cover">
                  <EventArt seed={e.id} />
                  <span className="stamp" aria-hidden>
                    <span>{dateBlock(e).month}</span>
                    <b>{dateBlock(e).days}</b>
                  </span>
                </div>
                <div className="card-body">
                  {status && status !== "Past" && <span className={`status status-${status.toLowerCase()}`}>{status}</span>}
                  <EventTitle event={e} as="h2" />
                  <EventFacts event={e} />
                  {e.talk && <p className="ev-talk">Talk: {e.talk.title}</p>}
                  {e.description && <p className="card-desc">{e.description}</p>}
                  <p className="card-meta">
                    <RolePill event={e} />
                  </p>
                  <LinkGroups event={e} />
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <p className="back">
        <a href="/events">← This year&apos;s events</a>
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(events.map((e) => eventJsonLd(e, { name: SITE.name, url: SITE.url }))) }}
      />
    </main>
  );
}
