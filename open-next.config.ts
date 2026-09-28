import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// KV stores the rendered page and GitHub fetch results between requests;
// the queue triggers the hourly background regeneration (ISR).
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
});
