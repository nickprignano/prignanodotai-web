// Checks the hand-written content files with the same parsers the site uses,
// so a bad edit fails the PR check with a readable message instead of failing
// the Cloudflare deploy. Run with `npm run check:content`.

import { readdirSync, readFileSync } from "node:fs";
import { loadEvents } from "../lib/events.ts";
import { parseFeatured } from "../lib/featured.ts";

const problems: string[] = [];
const dir = "content/events";

// Every year file must be valid JSON and listed in content/events/index.ts.
const index = readFileSync(`${dir}/index.ts`, "utf8");
const files: Record<string, unknown> = {};
for (const name of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const year = name.replace(/\.json$/, "");
  if (!/^\d{4}$/.test(year)) {
    problems.push(`${dir}/${name}: event files are named by year, like 2026.json`);
    continue;
  }
  try {
    files[year] = JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));
  } catch (e) {
    problems.push(`${dir}/${name}: not valid JSON (${(e as Error).message})`);
    continue;
  }
  if (!index.includes(`"./${name}"`) || !new RegExp(`"${year}":`).test(index)) {
    problems.push(`${dir}/${name}: not listed in ${dir}/index.ts; import it and add it to FILES`);
  }
}

let count = 0;
try {
  count = loadEvents(files).length;
} catch (e) {
  problems.push((e as Error).message);
}

try {
  const manual = JSON.parse(readFileSync("content/manual-items.json", "utf8"));
  if (!Array.isArray(manual)) problems.push("content/manual-items.json: must be a list");
} catch (e) {
  problems.push(`content/manual-items.json: not valid JSON (${(e as Error).message})`);
}

try {
  parseFeatured(JSON.parse(readFileSync("content/featured.json", "utf8")));
} catch (e) {
  problems.push(e instanceof SyntaxError ? `content/featured.json: not valid JSON (${e.message})` : (e as Error).message);
}

if (problems.length > 0) {
  console.error(`Content check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`Content OK: ${count} event(s) in ${Object.keys(files).length} year file(s).`);
