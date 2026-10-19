import type { Metadata } from "next";
import featuredFile from "@/content/featured.json";
import { findFeatured, parseFeatured } from "@/lib/featured";
import { languageColor } from "@/lib/format";
import { loadPortfolio } from "@/lib/portfolio";
import { SITE } from "@/lib/site";
import { Screenshot } from "../carousel";
import EventArt from "../events/event-art";
import ProjectInfo from "../project-info";
import SiteHeader from "../site-header";
import FeaturedBox from "./featured-box";

const title = `Projects — ${SITE.name}`;
const description = `Everything ${SITE.name} is building, writing and showing up for, in one list.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects" },
  openGraph: { type: "website", siteName: SITE.name, title, description, url: "/projects", images: SITE.image },
  twitter: { card: "summary_large_image", title, description, images: SITE.image },
};

// Same hourly refresh as the home carousel, so both always show the same items.
export const revalidate = 3600;

const featured = parseFeatured(featuredFile);

export default async function Projects() {
  const { profile, slides, error } = await loadPortfolio();
  const spotlight = featured ? findFeatured(slides, featured.item) : null;
  if (featured && !spotlight && !error) console.warn(`content/featured.json: no item matches "${featured.item}"`);

  return (
    <main className="projects">
      <SiteHeader current="projects" bio={profile?.bio} />

      <header className="projects-head">
        <h1>Projects</h1>
        <p>The same things as the home page carousel, all on one page: pinned items first, then by recent activity.</p>
      </header>

      {featured && spotlight && <FeaturedBox featured={featured} item={spotlight} />}

      {error || slides.length === 0 ? (
        <p className="notice-inline">{error ?? "No public projects yet."}</p>
      ) : (
        <>
          <h2 className="section-heading">All projects ({slides.length})</h2>
          <ul className="project-grid">
            {slides.map((item) => (
              <li key={item.id} className="project-card">
                <a className="project-card-art" href={item.artHref} tabIndex={-1} aria-hidden>
                  <EventArt seed={item.seed} color={item.color ?? (item.language ? languageColor(item.language) : null)}>
                    {item.image && <Screenshot src={item.image} lazy />}
                  </EventArt>
                </a>
                <ProjectInfo item={item} level={3} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
