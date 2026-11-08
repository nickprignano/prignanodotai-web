import { reader } from "./content.ts";

// The cards on /games come from content/games.json, one entry per game. Each
// game lives on its own subdomain; this site only links to it. "hidden" keeps
// a game off the page until it's ready, so launching one is a one-word edit.

export const GAME_STATUSES = ["live", "hidden"] as const;

export type Game = {
  /** Short, unique, lowercase; also seeds the line art when there's no image. */
  id: string;
  name: string;
  /** Where Play goes. Required once the game is live. */
  url: string | null;
  /** One line about the game. */
  description: string;
  /** A screenshot or icon: a path under public/ ("/games/pinball.png") or an https URL. Empty uses line art. */
  image: string | null;
  status: (typeof GAME_STATUSES)[number];
};

/** Checks content/games.json. A bad file fails the build with a clear message. */
export function parseGames(raw: unknown): Game[] {
  const file = "content/games.json";
  if (!Array.isArray(raw)) throw new Error(`${file}: must be a list`);
  const seen = new Set<string>();
  return raw.map((entry, i) => {
    const r = reader(entry, `${file} entry ${i + 1}`);
    const id = r.need("id");
    if (!/^[a-z0-9-]+$/.test(id)) r.fail(`"id" must be lowercase letters, digits and dashes`);
    if (seen.has(id)) r.fail(`"id" "${id}" is used twice`);
    seen.add(id);
    const status = r.oneOf("status", GAME_STATUSES) ?? r.fail(`"status" is required (live or hidden)`);
    const url = r.str("url");
    if (url !== null && !url.startsWith("https://")) r.fail(`"url" must start with https://`);
    if (status === "live" && url === null) r.fail(`"url" is required when "status" is live`);
    const image = r.str("image");
    if (image !== null && !/^(https:\/\/|\/)/.test(image)) r.fail(`"image" must start with https:// or /`);
    return { id, name: r.need("name"), url, description: r.need("description"), image, status };
  });
}

/** The games shown on /games, in file order. */
export function liveGames(games: Game[]): (Game & { url: string })[] {
  return games.filter((g): g is Game & { url: string } => g.status === "live" && g.url !== null);
}
