import { footerHtml } from "prignano-theme";

// The footer shared by every prignano.ai site, rendered from prignano-theme.
// The home page keeps its own one-line footer, since it fits in one screen.
export default function SiteFooter() {
  const html = footerHtml({ links: [{ label: "Blog", href: "https://blog.prignano.ai/" }] });
  return <div className="site-footer" dangerouslySetInnerHTML={{ __html: html }} />;
}
