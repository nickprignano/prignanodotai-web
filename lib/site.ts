// Site-wide settings used in page metadata, the sitemap and robots.txt.
export const SITE = {
  url: "https://prignano.ai",
  name: "Nick Prignano",
  // Cloudflare Web Analytics (cookieless). Paste the site's token from
  // Cloudflare → Web Analytics → prignano.ai → "Manage site". It isn't a
  // secret: it ends up in every page's HTML. Empty turns analytics off.
  analyticsToken: "",
  // Link preview card for LinkedIn, Slack and the like.
  image: { url: "/og.png", width: 1200, height: 630, alt: "Nick Prignano" },
};
