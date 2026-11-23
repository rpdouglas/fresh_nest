// Checking what a request sends against a Zod schema (trial on two routes: decision 0034).
import { z } from "zod";
import { DAY_MS, validDate } from "./checks.js";

/** A real day, YYYY-MM-DD. */
export const day = z.string().refine(validDate, { abort: true });
/** An id as Camelo and the site's own stores write them. */
export const id = z.string().regex(/^[\w-]{1,64}$/);

const IN_ORDER = "from and to must be dates, in order";
/** What is said about a range of days that is not two days in order. */
export const rangeWords = { from: IN_ORDER, to: IN_ORDER };
/** A range of days, from..to inclusive, at most `maxDays` long. */
export const dayRange = (maxDays: number) =>
  z
    .object({ from: day, to: day })
    .refine((r) => r.to >= r.from, { error: IN_ORDER, abort: true })
    .refine((r) => Date.parse(r.to) - Date.parse(r.from) <= maxDays * DAY_MS, `At most ${maxDays} days at a time`);

/**
 * A request's payload checked against a schema: the clean values, or the first thing wrong
 * with it. `words` says what to tell the person for each field, by name; a message written
 * on the schema itself (a refine's) is used before it. Fields are checked in the order the
 * schema lists them.
 */
export function parse<S extends z.ZodType>(
  schema: S,
  payload: unknown,
  words: Record<string, string>,
): { data: z.infer<S> } | { error: string } {
  const result = schema.safeParse(payload, { error: (issue) => words[String(issue.path?.[0])] });
  return result.success ? { data: result.data } : { error: result.error.issues[0].message };
}
