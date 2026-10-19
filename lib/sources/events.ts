import { EVENTS } from "@/content/events";
import { carouselUntil, ROLE_LABELS, type EventItem } from "../events";
import type { ProjectItem, Source } from "../items";

// Upcoming events from content/events/, as carousel cards. Each card stays
// until its event ends (showUntil), then drops off on its own. The data is
// bundled with the site, so this source never makes a network request.

export const eventsSource: Source = {
  name: "events",
  load: async () => EVENTS.filter((e) => e.carousel && e.status !== "cancelled").map(toItem),
};

function toItem(e: EventItem): ProjectItem {
  const page = `/events#${e.id}`;
  return {
    id: `events:${e.id}`,
    title: e.title,
    description: e.talk ? `${e.talk.title}${e.description ? `. ${e.description}` : ""}` : e.description,
    href: page,
    artHref: page,
    links: [...(e.url ? [{ label: "Event page ↗", href: e.url }] : []), { label: "All events", href: "/events" }],
    seed: e.id,
    color: null,
    image: null,
    badge: e.status === "postponed" ? "Postponed" : e.role && e.role !== "attendee" ? ROLE_LABELS[e.role] : "Event",
    pinned: e.pinned,
    // A bare day is read as noon UTC so it lands on that day in US time zones.
    date: `${e.start}T12:00:00Z`,
    dateStyle: "calendar",
    showUntil: carouselUntil(e),
    topics: e.topics,
    language: null,
    stars: 0,
    forks: 0,
  };
}
