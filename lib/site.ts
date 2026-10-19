// Site-wide settings used in page metadata, the sitemap and robots.txt.
export const SITE = {
  url: "https://prignano.ai",
  name: "Nick Prignano",
  // Cloudflare Web Analytics (cookieless). Paste the site's token from
  // Cloudflare → Web Analytics → prignano.ai → "Manage site". It isn't a
  // secret: it ends up in every page's HTML. Empty turns analytics off.
  analyticsToken: "",
  // Cloudflare Turnstile site key for the contact form (Cloudflare →
  // Turnstile → the prignano.ai widget). Public, like the analytics token.
  // Empty hides the form and leaves the email link.
  turnstileSiteKey: "",
  // Link preview card for LinkedIn, Slack and the like.
  image: { url: "/og.png", width: 1200, height: 630, alt: "Nick Prignano" },
};

// Where to find Nick, in the order shown on /contact. Add new ones here.
export const SOCIALS = [
  { id: "linkedin", label: "LinkedIn", handle: "in/nickprignano", href: "https://www.linkedin.com/in/nickprignano" },
  { id: "github", label: "GitHub", handle: "nickprignano", href: "https://github.com/nickprignano" },
  { id: "blog", label: "Blog", handle: "blog.prignano.ai", href: "https://blog.prignano.ai/" },
];
