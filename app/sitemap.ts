import type { MetadataRoute } from "next";
import { EVENTS } from "@/content/events";
import { today } from "@/lib/items";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const current = today().slice(0, 4);
  const pastYears = [...new Set(EVENTS.map((e) => e.start.slice(0, 4)))].filter((y) => y < current).sort().reverse();
  return [
    { url: `${SITE.url}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/projects`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/events`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/resume`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/contact`, changeFrequency: "yearly", priority: 0.6 },
    ...pastYears.map((y) => ({ url: `${SITE.url}/events/${y}`, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
