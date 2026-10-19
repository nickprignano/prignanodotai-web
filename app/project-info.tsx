import { languageColor } from "@/lib/format";
import type { Slide } from "@/lib/portfolio";

// The text half of a project card: badge, title, date, description, topics
// and links. Shared by the home carousel and the /projects grid.
export default function ProjectInfo({ item, level = 2 }: { item: Slide; level?: 2 | 3 }) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="info">
      <div className="info-head">
        {item.badge && <span className="featured">{item.badge}</span>}
        <Heading>
          <a href={item.href}>{item.title}</a>
        </Heading>
        <time
          dateTime={item.date}
          title={item.whenTitle ?? undefined}
          className={item.active ? "activity active" : "activity"}
        >
          {item.when}
        </time>
      </div>

      {item.description && <p className="desc">{item.description}</p>}

      {item.topics.length > 0 && (
        <ul className="topics">
          {item.topics.slice(0, 6).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}

      <div className="meta">
        {item.language && (
          <span>
            <span className="lang-dot" style={{ background: languageColor(item.language) }} />
            {item.language}
          </span>
        )}
        {item.stars > 0 && <span>★ {item.stars}</span>}
        {item.forks > 0 && <span>⑂ {item.forks}</span>}
        <span className="actions">
          {item.links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </span>
      </div>
    </div>
  );
}
