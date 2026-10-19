import { getRepos } from "../github";
import type { ProjectItem, Source } from "../items";

/** Public repos, with the ones in PORTFOLIO_FEATURED pinned and labeled. */
export function githubSource(username: string): Source {
  return {
    name: "github",
    load: async () =>
      (await getRepos(username)).map(
        (r): ProjectItem => ({
          id: `github:${r.fullName}`,
          title: r.name,
          description: r.description,
          href: r.url,
          artHref: r.homepage ?? r.url,
          links: [{ label: "Code", href: r.url }, ...(r.homepage ? [{ label: "Live ↗", href: r.homepage }] : [])],
          seed: r.fullName,
          color: null,
          image: r.image,
          badge: r.featured ? "Featured research" : null,
          pinned: r.featured,
          date: r.pushedAt,
          dateStyle: "relative",
          showUntil: null,
          topics: r.topics,
          language: r.language,
          stars: r.stars,
          forks: r.forks,
        }),
      ),
  };
}
