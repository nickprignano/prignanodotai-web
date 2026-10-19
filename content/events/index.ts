import { loadEvents } from "@/lib/events";
import y2026 from "./2026.json";

// Every year file, by the year its events start in. When you start a new
// year's file, import it and add it here; the content check fails if a file
// is missing from this list.
const FILES: Record<string, unknown> = {
  "2026": y2026,
};

/** All events, oldest first. A bad entry fails the build with a clear message. */
export const EVENTS = loadEvents(FILES);
