import type { Featured } from "@/lib/featured";
import { languageColor } from "@/lib/format";
import { TIME_ZONE } from "@/lib/items";
import type { Slide } from "@/lib/portfolio";
import EventArt from "../events/event-art";
import Countdown from "./countdown";

// The nominated item from content/featured.json, shown big at the top of
// /projects with Nick's note, an optional button and an optional countdown.
export default function FeaturedBox({ featured, item }: { featured: Featured; item: Slide }) {
  const countdown = featured.countdown && Date.parse(featured.countdown.to) > Date.now() ? featured.countdown : null;
  const date = countdown
    ? new Date(countdown.to).toLocaleString("en-US", {
        timeZone: TIME_ZONE,
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "";

  return (
    <section className="spotlight" aria-labelledby="spotlight-title">
      <a className="spotlight-art" href={item.artHref} tabIndex={-1} aria-hidden>
        <EventArt seed={item.seed} color={item.color ?? (item.language ? languageColor(item.language) : null)} always />
      </a>
      <div className="spotlight-body">
        <p className="eyebrow">{featured.heading}</p>
        <h2 id="spotlight-title" className="spotlight-title">
          <a href={item.href}>{item.title}</a>
        </h2>
        {(featured.message ?? item.description) && <p className="spotlight-message">{featured.message ?? item.description}</p>}
        {countdown && <Countdown to={countdown.to} label={countdown.label} date={date} />}
        <div className="spotlight-actions">
          {featured.cta && (
            <a className="speak-button spotlight-cta" href={featured.cta.href}>
              {featured.cta.label} <span aria-hidden>→</span>
            </a>
          )}
          {item.links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
