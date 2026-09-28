import type { Metadata } from "next";
import { getUsername } from "@/lib/github";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nick Prignano — Projects",
  description: `Open-source projects by ${getUsername()}, ordered by recent activity.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
