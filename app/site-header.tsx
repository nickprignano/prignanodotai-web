import { headerHtml } from "prignano-theme";

// The header shared by every prignano.ai site, rendered from prignano-theme.
// Links to pages on this site stay relative so previews link to themselves.
// Events lives only on this site, so it's a site link rather than a shared one.
export default function SiteHeader({ current, bio }: { current: string; bio?: string | null }) {
  const html = headerHtml({
    current,
    bio,
    home: "/",
    links: [{ id: "events", label: "Events", href: "/events" }],
    local: { projects: "/", resume: "/resume", contact: "/contact" },
  });
  return <div className="site-header" dangerouslySetInnerHTML={{ __html: html }} />;
}
