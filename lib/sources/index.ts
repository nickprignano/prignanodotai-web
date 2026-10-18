import type { Source } from "../items";
import { githubSource } from "./github";
import { manualSource } from "./manual";

// Every source that feeds the carousel. Pinned items keep this order, so
// pinned manual items come before featured repos. To add a source (an RSS
// or API feed, say), write a Source that returns ProjectItems and list it here.
export function getSources(username: string): Source[] {
  return [manualSource, githubSource(username)];
}
