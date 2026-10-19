import assert from "node:assert/strict";
import { test } from "node:test";
import { findFeatured, parseFeatured, toInstant } from "./featured.ts";
import type { ProjectItem } from "./items.ts";

test("an empty item means nothing is featured", () => {
  assert.equal(parseFeatured({ item: "" }), null);
  assert.equal(parseFeatured({}), null);
});

test("fills in defaults and reads the call to action and countdown", () => {
  assert.deepEqual(parseFeatured({ item: "nerdio-hcl" }), {
    item: "nerdio-hcl", heading: "Featured", message: null, cta: null, countdown: null,
  });
  const f = parseFeatured({
    item: "nerdio-hcl",
    heading: "Help wanted",
    cta: { label: "Open an issue", href: "https://github.com/x/y/issues" },
    countdown: { to: "2026-12-01" },
  });
  assert.deepEqual(f?.cta, { label: "Open an issue", href: "https://github.com/x/y/issues" });
  assert.deepEqual(f?.countdown, { to: "2026-12-01T05:00:00.000Z", label: "Release" });
});

test("rejects a bad countdown or link with the field named", () => {
  assert.throws(() => parseFeatured({ item: "x", countdown: { to: "Dec 1" } }), /countdown: "to" must be/);
  assert.throws(() => parseFeatured({ item: "x", cta: { label: "Go", href: "javascript:alert(1)" } }), /cta: "href" must start/);
  assert.throws(() => parseFeatured({ item: "x", cta: { href: "/x" } }), /cta: "label" is required/);
});

test("reads countdown times in New York time unless an offset is given", () => {
  assert.equal(toInstant("2026-07-04T09:30"), "2026-07-04T13:30:00.000Z");
  assert.equal(toInstant("2026-11-01T01:30"), "2026-11-01T05:30:00.000Z");
  assert.equal(toInstant("2026-03-08T12:00"), "2026-03-08T16:00:00.000Z");
  assert.equal(toInstant("2026-12-01T09:00:00Z"), "2026-12-01T09:00:00.000Z");
  assert.equal(toInstant("2026-02-30"), null);
  assert.equal(toInstant("2026-12-01T09:00:00"), null);
});

test("finds the item by repo name, id or full id, ignoring case", () => {
  const items = [
    { id: "github:nickprignano/Nerdio-HCL" },
    { id: "manual:some-article" },
    { id: "events:weuc-chicago-2026" },
  ] as ProjectItem[];
  assert.equal(findFeatured(items, "nerdio-hcl")?.id, "github:nickprignano/Nerdio-HCL");
  assert.equal(findFeatured(items, "nickprignano/nerdio-hcl")?.id, "github:nickprignano/Nerdio-HCL");
  assert.equal(findFeatured(items, "some-article")?.id, "manual:some-article");
  assert.equal(findFeatured(items, "events:weuc-chicago-2026")?.id, "events:weuc-chicago-2026");
  assert.equal(findFeatured(items, "hcl"), null);
});
