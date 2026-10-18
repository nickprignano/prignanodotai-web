import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "prignano-theme";
import { getUsername } from "@/lib/github";
import { SITE } from "@/lib/site";
import ThemeToggle from "./theme-toggle";
import "prignano-theme/theme.css";
import "./globals.css";

const title = "Nick Prignano — Projects";
const description = `Open-source projects by ${getUsername()}, ordered by recent activity.`;

// The icons come from app/icon.svg and app/apple-icon.png. Pages set their own
// canonical URL.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title,
  description,
  openGraph: { type: "website", siteName: SITE.name, title, description, url: "/", images: SITE.image },
  twitter: { card: "summary_large_image", title, description, images: SITE.image },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies a saved theme before first paint so dark mode doesn't flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <ThemeToggle />
        {SITE.analyticsToken && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: SITE.analyticsToken })}
          />
        )}
      </body>
    </html>
  );
}
