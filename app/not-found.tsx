import type { Metadata } from "next";
import SiteHeader from "./site-header";

export const metadata: Metadata = {
  title: "Page not found — Nick Prignano",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="resume not-found">
      <SiteHeader current="projects" />
      <h1>Page not found</h1>
      <p>
        That page doesn&apos;t exist. <a href="/">Back to the projects</a>, or try the{" "}
        <a href="https://blog.prignano.ai/">blog</a>.
      </p>
    </main>
  );
}
