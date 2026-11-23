// POST /api/visit-photos: photos of a client's home on a visit, before and after (decision 0044).
// Kept in this app's own private bucket, never in Camelo; a record per photo in Firestore. For the office and for
// cleaners: the office sees and deletes any photo; a cleaner adds photos on their own visits, sees them on their own
// visits and on a partner's shift on a visit they share (owner, 2026-10-22), and deletes one they took on the same
// day. Whose a visit is comes from Camelo, on the server, never from the page.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { camelo } from "../camelo.js";
import { torontoToday } from "../checks.js";
import { type VisitPhoto } from "../stores.js";
import { id, parse } from "../validate.js";
import { type Who, requireStaff } from "../who.js";

/** Kept one year, then deleted by themselves (the owner's choice, 2026-10-17). */
export const PHOTO_DAYS = 365;
/** A photo shrunk on the phone is about 300 KB; this is room for a large one, as base64. */
const MAX_IMAGE_CHARS = 2_200_000;
const MAX_LIST_OFFICE = 300;
/** A cleaner's list is checked against Camelo visit by visit, so it is kept short: 20 visits and their partners. */
const MAX_LIST_CLEANER = 40;

const List = z.object({ shiftIds: z.array(id).min(1).max(MAX_LIST_OFFICE) });
const listWords = { shiftIds: `shiftIds must be 1 to ${MAX_LIST_OFFICE} visit ids` };
const Add = z.object({ shiftId: id, kind: z.enum(["before", "after"]), image: z.string().min(100).max(MAX_IMAGE_CHARS) });
const addWords = {
  shiftId: "shiftId is required",
  kind: 'kind must be "before" or "after"',
  image: "image must be a JPEG photo, base64, under about 1.6 MB",
};
const One = z.object({ id });
const oneWords = { id: "id is required" };

const bad = (error: string): ApiResponse => ({ status: 400, body: { error } });
const notYours: ApiResponse = { status: 403, body: { error: "That visit is not yours." } };
const cameloDown: ApiResponse = { status: 502, body: { error: "Could not check the visit with Camelo. Try again." } };

const SHIFT_PEOPLE = `query($id: ID!) { shift(id: $id) { assignee { id } shiftPartners { assignee { id } } } }`;
type ShiftPeople = { shift: { assignee: { id: string } | null; shiftPartners: { assignee: { id: string } | null }[] | null } | null };

/**
 * Whether these visits are this cleaner's, asked of Camelo: "own" counts only shifts assigned to them (for adding),
 * "shared" also a partner's shift on a visit they work too (for seeing). "unknown" when Camelo could not be asked,
 * which is not the same as no.
 */
async function reach(
  who: Extract<Who, { role: "cleaner" }>,
  shiftIds: string[],
  deps: Deps,
  mode: "own" | "shared",
): Promise<"yes" | "no" | "unknown"> {
  const found = await Promise.all(
    [...new Set(shiftIds)].map((shiftId) =>
      camelo<ShiftPeople>(deps, SHIFT_PEOPLE, { id: shiftId }).then(
        ({ shift }) =>
          shift?.assignee?.id === who.employeeId ||
          (mode === "shared" && (shift?.shiftPartners ?? []).some((x) => x.assignee?.id === who.employeeId)),
        () => null,
      ),
    ),
  );
  return found.includes(false) ? "no" : found.includes(null) ? "unknown" : "yes";
}

/** The answer when a cleaner may not reach a visit, or when Camelo could not say; null when they may. */
const refused = (answer: "yes" | "no" | "unknown"): ApiResponse | null =>
  answer === "yes" ? null : answer === "no" ? notYours : cameloDown;

/** Who may delete a photo: the office any; a cleaner one they took, on the day they took it (Toronto). */
const mayDelete = (who: Who, photo: VisitPhoto, now: number) =>
  who.role === "office" || (photo.takenBy === who.email && torontoToday(photo.takenAt) === torontoToday(now));

/** What the page is told about a photo: never the bucket path. */
const shown = (who: Who, p: VisitPhoto, now: number) => ({
  id: p.id,
  shiftId: p.shiftId,
  kind: p.kind,
  takenAt: p.takenAt,
  takenBy: p.takenBy,
  canDelete: mayDelete(who, p, now),
});

export async function handleVisitPhotos(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  const who = await requireStaff(req, deps);
  if ("status" in who) return who;
  const store = deps.visitPhotos;
  const files = deps.photoFiles;
  if (!store || !files) return { status: 500, body: { error: "Photo storage is not set up" } };
  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const now = (deps.now ?? Date.now)();

  if (p.action === "list") {
    const sent = parse(List, p, listWords);
    if ("error" in sent) return bad(sent.error);
    const { shiftIds } = sent.data;
    if (who.role === "cleaner") {
      if (shiftIds.length > MAX_LIST_CLEANER) return bad(`shiftIds must be 1 to ${MAX_LIST_CLEANER} visit ids`);
      const no = refused(await reach(who, shiftIds, deps, "shared"));
      if (no) return no;
    }
    const photos = await store.list(shiftIds);
    return { status: 200, body: { photos: photos.map((x) => shown(who, x, now)) } };
  }

  if (p.action === "add") {
    const sent = parse(Add, p, addWords);
    if ("error" in sent) return bad(sent.error);
    const bytes = Buffer.from(sent.data.image, "base64");
    // a JPEG starts FF D8 FF; anything else is refused, whatever it is called
    if (bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return bad(addWords.image);
    if (who.role === "cleaner") {
      const no = refused(await reach(who, [sent.data.shiftId], deps, "own"));
      if (no) return no;
    }
    const photoId = randomUUID();
    const photo: VisitPhoto = {
      id: photoId,
      shiftId: sent.data.shiftId,
      kind: sent.data.kind,
      takenAt: now,
      takenBy: who.email,
      path: `visits/${sent.data.shiftId}/${photoId}.jpg`,
      expireAt: now + PHOTO_DAYS * 86_400_000,
    };
    await files.save(photo.path, bytes, "image/jpeg");
    await store.add(photo);
    return { status: 200, body: { photo: shown(who, photo, now) } };
  }

  if (p.action === "view" || p.action === "delete") {
    const sent = parse(One, p, oneWords);
    if ("error" in sent) return bad(sent.error);
    const photo = await store.get(sent.data.id);
    if (!photo) return { status: 404, body: { error: "No such photo." } };
    if (who.role === "cleaner") {
      const no = refused(await reach(who, [photo.shiftId], deps, "shared"));
      if (no) return no;
    }
    if (p.action === "view") {
      const bytes = await files.read(photo.path);
      return { status: 200, body: { image: bytes.toString("base64"), contentType: "image/jpeg" } };
    }
    if (!mayDelete(who, photo, now)) return { status: 403, body: { error: "Only the office can delete this photo now." } };
    await store.remove(photo.id);
    await files.remove(photo.path);
    return { status: 200, body: { ok: true } };
  }

  return bad('action must be "list", "add", "view" or "delete"');
}
