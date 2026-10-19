import {
  dateBlock,
  formatRange,
  formatTime,
  groupLinks,
  LINK_GROUPS,
  place,
  ROLE_LABELS,
  type EventItem,
  type EventLink,
} from "@/lib/events";

// Pieces shared by the events page and the year archives.

const External = () => <span className="sr-only"> (external site)</span>;

/** "Next up", "Past", "Cancelled" or "Postponed"; always a word, never just a color. */
export function statusLabel(event: EventItem, past: boolean, next: boolean): string | null {
  if (event.status === "cancelled") return "Cancelled";
  if (event.status === "postponed") return "Postponed";
  if (next) return "Next up";
  return past ? "Past" : null;
}

export function EventTitle({ event, as: Tag = "h3" }: { event: EventItem; as?: "h2" | "h3" }) {
  return (
    <Tag className="ev-title">
      {event.url ? (
        <a href={event.url}>
          {event.title} <span aria-hidden>↗</span>
          <External />
        </a>
      ) : (
        event.title
      )}
    </Tag>
  );
}

/** Where and when, under the title. */
export function EventFacts({ event }: { event: EventItem }) {
  const time = formatTime(event);
  return (
    <p className="ev-facts">
      <time dateTime={event.start}>{formatRange(event, true)}</time>
      {time && <> · {time}</>}
      <br />
      {place(event)}
      {event.location?.venue && <> · {event.location.venue}</>}
      {event.organizer && (
        <>
          {" "}· by{" "}
          {event.organizer.url ? (
            <a href={event.organizer.url}>
              {event.organizer.name}
              <External />
            </a>
          ) : (
            event.organizer.name
          )}
        </>
      )}
      {event.sponsors.length > 0 && (
        <>
          <br />
          Sponsored by {event.sponsors.join(", ")}
        </>
      )}
    </p>
  );
}

export function RolePill({ event }: { event: EventItem }) {
  return event.role ? <span className="pill">{ROLE_LABELS[event.role]}</span> : null;
}

function iconFor(link: EventLink): string {
  return LINK_GROUPS.find((g) => g.types.includes(link.type))?.icon ?? "↗";
}

function LinkTile({ link, event }: { link: EventLink; event: EventItem }) {
  return (
    <span className="tile-wrap">
      <a className="tile" href={link.url}>
        <span className="tile-icon" aria-hidden>
          {iconFor(link)}
        </span>
        {link.label}
        <span className="sr-only">
          {" "}from {event.title} on {link.site}
        </span>
        <span className="tile-site" aria-hidden>
          {link.site}
        </span>
      </a>
      {link.archived && (
        <a className="tile-archived" href={link.archived}>
          archived copy<span className="sr-only"> of {link.label}</span>
        </a>
      )}
    </span>
  );
}

/** Links as one row of tiles, for the schedule. */
export function LinkRow({ event }: { event: EventItem }) {
  if (event.links.length === 0) return null;
  return (
    <ul className="tiles" aria-label={`Links from ${event.title}`}>
      {event.links.map((link) => (
        <li key={link.url}>
          <LinkTile link={link} event={event} />
        </li>
      ))}
    </ul>
  );
}

/** Links grouped by kind (photos, video, posts...), for the scrapbook. */
export function LinkGroups({ event }: { event: EventItem }) {
  const groups = groupLinks(event.links);
  if (groups.length === 0) return null;
  return (
    <div className="groups">
      {groups.map((g) => (
        <div key={g.name} className="group">
          <h4>
            {g.name}
            {g.links.length > 1 && <span className="group-count"> ({g.links.length})</span>}
          </h4>
          <ul className="tiles">
            {g.links.map((link) => (
              <li key={link.url}>
                <LinkTile link={link} event={event} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** One row of the tour schedule. */
export function EventRow({ event, past, next }: { event: EventItem; past: boolean; next: boolean }) {
  const block = dateBlock(event);
  const status = statusLabel(event, past, next);
  const classes = ["ev-row", past && "is-past", next && "is-next", event.status === "cancelled" && "is-cancelled"];
  return (
    <li>
      <article id={event.id} className={classes.filter(Boolean).join(" ")}>
        <div className="ev-date" aria-hidden>
          <span className="ev-month">{block.month}</span>
          <span className="ev-days">{block.days}</span>
        </div>
        <div className="ev-main">
          <EventTitle event={event} />
          <EventFacts event={event} />
          {event.talk && <p className="ev-talk">Talk: {event.talk.title}</p>}
          <LinkRow event={event} />
        </div>
        <div className="ev-side">
          {status && <span className={`status status-${status.toLowerCase().replace(" ", "-")}`}>{status}</span>}
          <RolePill event={event} />
        </div>
      </article>
    </li>
  );
}
