import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "prignano-theme";
import { getUsername } from "@/lib/github";
import ThemeToggle from "./theme-toggle";
import "prignano-theme/theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nick Prignano — Projects",
  description: `Open-source projects by ${getUsername()}, ordered by recent activity.`,
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
      </body>
    </html>
  );
}
