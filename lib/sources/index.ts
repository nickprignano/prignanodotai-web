import type { Source } from "../items";
import { eventsSource } from "./events";
import { githubSource } from "./github";
import { manualSource } from "./manual";

// Every source that feeds the carousel. Pinned items keep this order, so
// upcoming events come first, then pinned manual items, then featured repos.
// To add a source (an RSS or API feed, say), write a Source that returns
// ProjectItems and list it here.
export function getSources(username: string): Source[] {
  return [eventsSource, manualSource, githubSource(username)];
}
