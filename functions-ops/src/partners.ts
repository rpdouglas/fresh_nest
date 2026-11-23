// Partners worked out from the schedule itself, in place of Camelo's `shiftPartners` field.
// On 2026-10-17 that field made a day of shifts take 15-20 s to come back from Camelo (0.6 s without it), longer
// than our 15 s limit, so the week reports and the Live board failed. Cleaners at the same client (or the same site
// when there is no client) at overlapping times are partners, as the schedule check already counts a team. Each
// partner is given as `{ id, assignee }`, the partner's own shift id, as Camelo gave it, so the site needs no change.

type Named = { id: string; name: string | null } | null | undefined;
type Place = { id?: string | null; address?: string | null } | null | undefined;
/** The fields read here; Camelo's shifts carry more, which pass through untouched. */
type Shift = { id: string; startTime: string } & Record<string, unknown>;

/** Where a shift is: its client, else its site; null when it has neither, which then has no partners. */
function placeOf(s: Shift): string | null {
  const client = s.client as { id?: string | null } | null | undefined;
  const site = s.jobSite as Place;
  return client?.id ? `client:${client.id}` : site?.id ? `site:${site.id}` : site?.address ? `address:${site.address}` : null;
}

const assigneeOf = (s: Shift) => s.assignee as Named;
const endOf = (s: Shift) => Date.parse(String(s.endTime));

/** Each shift with `shiftPartners`: the other assigned shifts at the same place whose times overlap its own. */
export function withPartners<T extends Shift>(shifts: readonly T[]): (T & { shiftPartners: { id: string; assignee: Named }[] })[] {
  const byPlace = new Map<string, T[]>();
  for (const s of shifts) {
    const place = placeOf(s);
    if (place && assigneeOf(s)) byPlace.set(place, [...(byPlace.get(place) ?? []), s]);
  }
  return shifts.map((s) => {
    const place = placeOf(s);
    const me = assigneeOf(s);
    const start = Date.parse(s.startTime);
    const end = endOf(s);
    const partners = (place && me ? (byPlace.get(place) ?? []) : [])
      .filter((o) => o.id !== s.id && assigneeOf(o)?.id !== me?.id && Date.parse(o.startTime) < end && start < endOf(o))
      .map((o) => ({ id: o.id, assignee: assigneeOf(o) }));
    return { ...s, shiftPartners: partners };
  });
}
