import assert from "node:assert/strict";
import { test } from "node:test";
import { carouselUntil, dateBlock, eventJsonLd, formatRange, formatTime, isOver, loadEvents, parseEvent } from "./events.ts";

const base = { id: "demo-2026", title: "Demo", start: "2026-11-04", location: { city: "Schaumburg", region: "IL" } };
const parse = (extra: object = {}) => parseEvent({ ...base, ...extra }, "test");

test("upcoming and past come from the date", () => {
  const e = parse({ end: "2026-11-06" });
  assert.equal(isOver(e, "2026-11-06"), false);
  assert.equal(isOver(e, "2026-11-07"), true);
  assert.equal(carouselUntil(e), "2026-11-06");
});

test("date labels", () => {
  assert.equal(formatRange(parse()), "Nov 4, 2026");
  assert.equal(formatRange(parse({ end: "2026-11-06" })), "Nov 4–6, 2026");
  assert.equal(formatRange(parse({ start: "2026-12-30", end: "2027-01-02" })), "Dec 30, 2026 – Jan 2, 2027");
  assert.deepEqual(dateBlock(parse({ end: "2026-11-06" })), { month: "NOV", days: "4–6" });
  assert.equal(formatTime(parse({ time: "12:00-15:00", timeZone: "America/Chicago" })), "12:00 PM – 3:00 PM CST");
});

test("JSON-LD carries the time zone offset and only claims a performer for talks", () => {
  const person = { name: "Nick Prignano", url: "https://prignano.ai" };
  const attending = eventJsonLd(parse({ time: "12:00-15:00", timeZone: "America/Chicago", role: "attendee" }), person);
  assert.equal(attending.startDate, "2026-11-04T12:00:00-06:00");
  assert.equal(attending.endDate, "2026-11-04T15:00:00-06:00");
  assert.equal("performer" in attending, false);
  assert.equal("performer" in eventJsonLd(parse({ role: "speaker" }), person), true);
});

test("bad entries fail with the entry and field named", () => {
  assert.throws(() => parse({ start: "11/04/2026" }), /"start" must be a date/);
  assert.throws(() => parse({ end: "2026-11-01" }), /"end" is before "start"/);
  assert.throws(() => parse({ links: [{ type: "photos", url: "http://example.com" }] }), /must start with https/);
  assert.throws(() => parse({ links: [{ type: "pics", url: "https://example.com" }] }), /"type" must be one of/);
  assert.throws(() => parse({ location: undefined }), /needs a "location"/);
  assert.throws(
    () => parse({ links: [{ type: "post", url: "https://www.linkedin.com/posts/someone_some-text-activity-7123456789012345678-AbCd" }] }),
    /urn:li:activity:7123456789012345678/,
  );
});

test("links get readable labels and sites", () => {
  const e = parse({ links: [{ type: "post", url: "https://www.linkedin.com/feed/update/urn:li:activity:1/" }, { type: "video", url: "https://youtu.be/abc" }] });
  assert.deepEqual(e.links.map((l) => [l.label, l.site]), [["LinkedIn post", "LinkedIn"], ["Video", "YouTube"]]);
});

test("year files: wrong year and duplicate ids are caught", () => {
  assert.throws(() => loadEvents({ "2025": [base] }), /belongs in content\/events\/2026.json/);
  assert.throws(() => loadEvents({ "2026": [base, base] }), /already used/);
  assert.equal(loadEvents({ "2026": [base] }).length, 1);
});
