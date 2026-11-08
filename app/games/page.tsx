import type { Metadata } from "next";
import gamesFile from "@/content/games.json";
import { liveGames, parseGames } from "@/lib/games";
import { SITE } from "@/lib/site";
import EventArt from "../events/event-art";
import SiteHeader from "../site-header";

const title = `Games — ${SITE.name}`;
const description = "Small browser games by Nick Prignano. Free, no sign-up, no tracking, and installable on your phone.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/games" },
  openGraph: { type: "website", siteName: SITE.name, title, description, url: "/games", images: SITE.image },
  twitter: { card: "summary_large_image", title, description, images: SITE.image },
};

// Games live in their own repos and subdomains; this page only links to them.
// Cards come from content/games.json; entries with status "hidden" stay off it.
const games = liveGames(parseGames(gamesFile));

export default function Games() {
  return (
    <main className="projects games">
      <SiteHeader current="games" />

      <header className="projects-head">
        <h1>Games</h1>
        <p>Small games that run in the browser. Each opens in a new tab, with no sign-up and no tracking.</p>
      </header>

      <aside className="install-tip" aria-labelledby="install-tip-title">
        <h2 id="install-tip-title">Add a game to your home screen</h2>
        <p>
          Every game here is an installable web app. On iPhone or iPad, open it in Safari, tap Share, then{" "}
          <b>Add to Home Screen</b>. On Android, open it in Chrome and tap <b>Install</b> (or <b>Add to Home screen</b>) in the menu.
        </p>
      </aside>

      {games.length === 0 ? (
        <p className="notice-inline">No games yet. Check back soon.</p>
      ) : (
        <ul className="project-grid game-grid">
          {games.map((g) => (
            <li key={g.id} className="project-card game-card">
              <div className="project-card-art game-art">
                {g.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.image} alt="" loading="lazy" decoding="async" />
                ) : (
                  <EventArt seed={g.id} />
                )}
              </div>
              <div className="game-body">
                <h2>{g.name}</h2>
                <p>{g.description}</p>
                <a className="game-play" href={g.url} target="_blank" rel="noopener">
                  Play<span className="sr-only"> {g.name} (opens in a new tab)</span>
                  <span aria-hidden> ↗</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
