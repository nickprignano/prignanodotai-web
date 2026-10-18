import { headerHtml, type NavId } from "prignano-theme";

// The header shared by every prignano.ai site, rendered from prignano-theme.
// Links to pages on this site stay relative so previews link to themselves.
export default function SiteHeader({ current, bio }: { current: NavId; bio?: string | null }) {
  const html = headerHtml({ current, bio, home: "/", local: { projects: "/", resume: "/resume" } });
  return <div className="site-header" dangerouslySetInnerHTML={{ __html: html }} />;
}
