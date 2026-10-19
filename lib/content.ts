// Shared checks for the hand-written files under content/. Each reader reports
// problems with the file, entry and field, so a bad edit fails the build (and
// the PR check) with a message saying exactly what to fix.

export const DAY = /^\d{4}-\d{2}-\d{2}$/;

export type Reader = {
  where: string;
  raw: Record<string, unknown>;
  str(key: string): string | null;
  need(key: string): string;
  day(key: string): string | null;
  bool(key: string): boolean | null;
  strings(key: string): string[];
  oneOf<T extends string>(key: string, values: readonly T[]): T | null;
  fail(message: string): never;
};

/** Wraps one entry of a content file. `where` names it in error messages. */
export function reader(raw: unknown, where: string): Reader {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`${where}: must be an object`);
  const e = raw as Record<string, unknown>;
  const fail = (message: string): never => {
    throw new Error(`${where}: ${message}`);
  };
  const str = (key: string): string | null => {
    const v = e[key];
    if (v === undefined || v === null || v === "") return null;
    if (typeof v !== "string") fail(`"${key}" must be a string`);
    return v as string;
  };
  return {
    where,
    raw: e,
    fail,
    str,
    need: (key) => str(key) ?? fail(`"${key}" is required`),
    day: (key) => {
      const v = str(key);
      if (v !== null && (!DAY.test(v) || Number.isNaN(Date.parse(v)))) fail(`"${key}" must be a date like 2026-11-04`);
      return v;
    },
    bool: (key) => {
      const v = e[key];
      if (v === undefined || v === null) return null;
      if (typeof v !== "boolean") fail(`"${key}" must be true or false`);
      return v as boolean;
    },
    strings: (key) => {
      const v = e[key] ?? [];
      if (!Array.isArray(v) || v.some((t) => typeof t !== "string")) fail(`"${key}" must be a list of strings`);
      return v as string[];
    },
    oneOf: (key, values) => {
      const v = str(key);
      if (v !== null && !values.includes(v as never)) fail(`"${key}" must be one of: ${values.join(", ")}`);
      return v as never;
    },
  };
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
