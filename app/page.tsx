import type { Metadata } from "next";
import Link from "next/link";
import { loadPortfolio } from "@/lib/portfolio";
import Carousel from "./carousel";
import SiteHeader from "./site-header";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Regenerate the page at most once an hour so new pushes show up and expired items drop off automatically.
export const revalidate = 3600;

export default async function Home() {
  const { profile, slides, error } = await loadPortfolio();

  return (
    <main className="page">
      <SiteHeader current="home" bio={profile?.bio} />
      <h1 className="sr-only">Projects and events</h1>

      {error || slides.length === 0 ? (
        <p className="notice">{error ?? "No public projects yet."}</p>
      ) : (
        <Carousel slides={slides} />
      )}

      <footer>
        Pinned items first, then projects by recent activity · refreshed hourly from GitHub · <Link href="/projects">See them all</Link>
      </footer>
    </main>
  );
}
