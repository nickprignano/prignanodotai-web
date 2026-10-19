import { headerHtml } from "prignano-theme";

// The header shared by every prignano.ai site, rendered from prignano-theme.
// Links to pages on this site stay relative so previews link to themselves.
// Events and the speaking invitation live only on this site, so they're site
// links rather than shared ones.
export default function SiteHeader({ current, bio }: { current: string; bio?: string | null }) {
  const html = headerHtml({
    current,
    bio,
    home: "/",
    links: [
      { id: "events", label: "Events", href: "/events" },
      { id: "speak", label: "Book me to speak", href: "/events#speak" },
    ],
    local: { projects: "/", resume: "/resume" },
  });
  return <div className="site-header" dangerouslySetInnerHTML={{ __html: html }} />;
}
