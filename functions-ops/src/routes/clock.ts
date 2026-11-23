// POST /api/clock: connects a cleaner's own Camelo account once (decision 0044, item 2.4.7),
// and records their clock-in and clock-out punches with a door photo and GPS (item 2.4.8).
// The cleaner's Camelo token is encrypted with a key derived from CAMELO_TOKEN and kept only
// in Firestore (scheduleCleanerTokens); it never leaves the server.
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { z } from "zod";
import { type ApiRequest, type ApiResponse, type Deps } from "../api.js";
import { camelo, cameloRetry } from "../camelo.js";
import type { CleanerToken } from "../stores.js";
import { id, parse } from "../validate.js";
import { CLEANER_SESSION_TTL_MS, requireStaff, resolveActiveCleaner, signCleanerSession } from "../who.js";

const KEY_INFO = "fnc-schedule-cleaner-camelo-token-v1";
const DEFAULT_TOKEN_TTL_MS = 30 * 86_400_000;
const MAX_IMAGE_CHARS = 2_200_000;

function deriveKey(camelToken: string, employeeId: string): Buffer {
  return Buffer.from(hkdfSync("sha256", camelToken, employeeId, KEY_INFO, 32));
}

/** Encrypts a cleaner's Camelo access token with AES-256-GCM using a per-cleaner key derived from CAMELO_TOKEN. */
export function encryptToken(rawToken: string, camelToken: string, employeeId: string): { ciphertext: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(camelToken, employeeId), iv);
  const encrypted = Buffer.concat([cipher.update(rawToken, "utf8"), cipher.final()]);
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

/** Decrypts a cleaner's stored Camelo token, or returns null if tampered with or if CAMELO_TOKEN changed. */
export function decryptToken(rec: Pick<CleanerToken, "employeeId" | "ciphertext" | "iv" | "tag">, camelToken: string): string | null {
  try {
    const iv = Buffer.from(rec.iv, "base64");
    const tag = Buffer.from(rec.tag, "base64");
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(camelToken, rec.employeeId), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(Buffer.from(rec.ciphertext, "base64")), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}

/** Whether a cleaner has an unexpired, decryptable Camelo token on the server. */
export function hasValidCleanerToken(rec: CleanerToken | null | undefined, camelToken: string, now: number): boolean {
  return !!rec && rec.expireAt > now && decryptToken(rec, camelToken) !== null;
}

const REQUEST_LOGIN_SESSION = `
mutation RequestLoginSession($input: RequestLoginSessionInput!) {
  requestLoginSession(input: $input) {
    errors { attribute fullMessage type }
    result { id }
  }
}`;

const VERIFY_OTP = `
mutation VerifyOtp($input: VerifyOtpInput!) {
  verifyOtp(input: $input) {
    errors { attribute fullMessage type }
    result {
      jwtToken
      expiredAt
      whoami { id email }
    }
  }
}`;

const SHIFT_TIMECARD_QUERY = `
query ShiftTimeCard($id: ID!) {
  shift(id: $id) {
    id
    assignee { id }
    timeCard {
      id
      state
      punches {
        punchType
        atTime
        note
        attachment {
          geoLat
          geoLong
          photoToken
          wifiSsid
          wifiBssid
        }
      }
    }
  }
}`;

const SYNC_TIMECARD_PUNCHES = `
mutation SyncTimeCardPunches($input: SyncTimeCardPunchesInput!) {
  syncTimeCardPunches(input: $input) {
    errors { attribute fullMessage type }
    result { id punchType atTime }
  }
}`;

const GENERATE_UPLOAD_URL = `
mutation GenerateUploadUrl($input: GenerateDirectUploadUrlInput!) {
  generateUploadUrl(input: $input) {
    errors { attribute fullMessage type }
    result {
      acl
      key
      policy
      uri
      xAmzAlgorithm
      xAmzCredential
      xAmzDate
      xAmzSignature
    }
  }
}`;

const SYNC_TIMECARD_PUNCH_ATTACHMENT = `
mutation SyncTimeCardPunchAttachment($input: SyncTimeCardPunchAttachmentInput!) {
  syncTimeCardPunchAttachment(input: $input) {
    errors { attribute fullMessage type }
    result { id photo }
  }
}`;

type MutationError = { attribute: string | null; fullMessage: string | null; type: string | null };
type ExistingPunch = {
  punchType: string;
  atTime: string;
  note: string | null;
  attachment: {
    geoLat: number | null;
    geoLong: number | null;
    photoToken: string | null;
    wifiSsid: string | null;
    wifiBssid: string | null;
  } | null;
};

const sayNo = (errors: MutationError[] | null | undefined) =>
  errors?.length ? errors.map((e) => e.fullMessage || e.type || "refused").join("; ") : null;

const EmailField = z.string().trim().toLowerCase().email().max(254);

const CodeField = z
  .string()
  .transform((s) => s.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{4,8}$/));

const SignInRequestAsked = z.object({
  action: z.literal("signInRequestCode"),
  email: EmailField,
});

const SignInVerifyAsked = z.object({
  action: z.literal("signInVerifyCode"),
  email: EmailField,
  sessionToken: z.string().trim().min(1).max(500),
  code: CodeField,
});

const VerifyAsked = z.object({
  action: z.literal("verifyCode"),
  sessionToken: z.string().trim().min(1).max(500),
  code: CodeField,
});

const PunchAsked = z.object({
  action: z.literal("punch"),
  shiftId: id,
  type: z.enum(["in", "out"]),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lon: z.number().min(-180).max(180).nullable().optional(),
  image: z.string().min(100).max(MAX_IMAGE_CHARS).nullable().optional(),
});

const PhotoAsked = z.object({
  action: z.literal("photo"),
  shiftId: id,
  type: z.enum(["in", "out"]),
  image: z.string().min(100).max(MAX_IMAGE_CHARS),
});

function decodeJpeg(base64: string): Buffer | null {
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return null;
  return bytes;
}

function toPunchInput(timeCardId: string, p: ExistingPunch) {
  const att = p.attachment;
  const attachment = att
    ? {
        ...(typeof att.geoLat === "number" ? { geoLat: att.geoLat } : {}),
        ...(typeof att.geoLong === "number" ? { geoLong: att.geoLong } : {}),
        ...(att.photoToken ? { photoToken: att.photoToken } : {}),
        ...(att.wifiSsid ? { wifiSsid: att.wifiSsid } : {}),
        ...(att.wifiBssid ? { wifiBssid: att.wifiBssid } : {}),
      }
    : undefined;
  return {
    timeCardId,
    punchType: p.punchType,
    atTime: p.atTime,
    ...(p.note ? { note: p.note } : {}),
    ...(attachment && Object.keys(attachment).length ? { attachment } : {}),
  };
}

/** Uploads a door JPEG to Camelo's S3 presigned form and attaches its key to the punch at `atTime`. */
async function uploadAndAttachDoorPhoto(
  deps: Deps,
  cleanerToken: string,
  timeCardId: string,
  atTime: string,
  jpegBytes: Buffer,
): Promise<void> {
  const up = await camelo<{
    generateUploadUrl: {
      errors: MutationError[] | null;
      result: {
        acl: string | null;
        key: string;
        policy: string;
        uri: string;
        xAmzAlgorithm: string;
        xAmzCredential: string;
        xAmzDate: string;
        xAmzSignature: string;
      } | null;
    };
  }>(deps, GENERATE_UPLOAD_URL, { input: { uploader: "PHOTO" } }, cleanerToken);

  const upErr = sayNo(up.generateUploadUrl.errors);
  const s3 = up.generateUploadUrl.result;
  if (upErr || !s3) throw new Error(upErr ?? "Could not get upload URL from Camelo");

  const photoKey = s3.key.includes("${filename}") ? s3.key.replace("${filename}", "door.jpg") : s3.key;
  // Camelo's S3 policy requires a file of at least 1 KB (1024 bytes).
  const payload = jpegBytes.length >= 1024 ? jpegBytes : Buffer.concat([jpegBytes, Buffer.alloc(1024 - jpegBytes.length)]);

  const form = new FormData();
  form.append("key", photoKey);
  if (s3.acl) form.append("acl", s3.acl);
  form.append("success_action_status", "200");
  form.append("policy", s3.policy);
  form.append("x-amz-algorithm", s3.xAmzAlgorithm);
  form.append("x-amz-credential", s3.xAmzCredential);
  form.append("x-amz-date", s3.xAmzDate);
  form.append("x-amz-signature", s3.xAmzSignature);
  form.append("file", new Blob([new Uint8Array(payload)], { type: "image/jpeg" }), "door.jpg");

  const s3Res = await (deps.fetchImpl ?? fetch)(s3.uri, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(cameloRetry.timeoutMs),
  });
  if (!s3Res.ok) throw new Error(`S3 upload HTTP ${s3Res.status}`);

  const att = await camelo<{
    syncTimeCardPunchAttachment: {
      errors: MutationError[] | null;
      result: { id: string; photo: string | null } | null;
    };
  }>(deps, SYNC_TIMECARD_PUNCH_ATTACHMENT, { input: { timeCardId, atTime, photoKey } }, cleanerToken);

  const attErr = sayNo(att.syncTimeCardPunchAttachment.errors);
  if (attErr || !att.syncTimeCardPunchAttachment.result?.photo) {
    throw new Error(attErr ?? "Camelo did not attach the door photo");
  }
}

async function requestCameloOtp(email: string, deps: Deps): Promise<ApiResponse> {
  try {
    const data = await camelo<{
      requestLoginSession: {
        errors: MutationError[] | null;
        result: { id?: string | null; sessionToken?: string | null; expiresAt?: string | null } | null;
      };
    }>(deps, REQUEST_LOGIN_SESSION, {
      input: { authenticationMethod: "EMAIL", authenticationValue: email },
    });
    const { errors, result } = data.requestLoginSession;
    const problem = sayNo(errors);
    const sessionToken = result?.id ?? result?.sessionToken ?? null;
    if (problem || !sessionToken) {
      return { status: 422, body: { error: problem ?? "Camelo did not send a code" } };
    }
    return { status: 200, body: { sessionToken, expiresAt: result?.expiresAt ?? null } };
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not ask Camelo to email a code" } };
  }
}

async function verifyAndStoreCameloOtp(
  cleaner: { email: string; employeeId: string },
  sessionToken: string,
  code: string,
  deps: Deps,
): Promise<{ ok: true; now: number } | ApiResponse> {
  let verified: {
    errors: MutationError[] | null;
    result: {
      jwtToken?: string | null;
      accessToken?: string | null;
      expiredAt?: string | null;
      expiresAt?: string | null;
      whoami: { id: string; email: string | null } | null;
    } | null;
  };
  try {
    const data = await camelo<{ verifyOtp: typeof verified }>(deps, VERIFY_OTP, {
      input: { loginSessionId: sessionToken, otpCode: code },
    });
    verified = data.verifyOtp;
  } catch (e) {
    console.error(e);
    return { status: 502, body: { error: "Could not check the code with Camelo" } };
  }

  const problem = sayNo(verified.errors);
  const rawToken = verified.result?.jwtToken ?? verified.result?.accessToken ?? null;
  const rawExpiry = verified.result?.expiredAt ?? verified.result?.expiresAt ?? null;
  if (problem || !rawToken) {
    return { status: 422, body: { error: problem ?? "That code was not accepted" } };
  }
  if (verified.result?.whoami?.id !== cleaner.employeeId) {
    return { status: 403, body: { error: "That Camelo account does not match your sign-in" } };
  }

  const now = (deps.now ?? Date.now)();
  const parsedExpiry = rawExpiry ? Date.parse(rawExpiry) : NaN;
  const expireAt = Number.isFinite(parsedExpiry) && parsedExpiry > now ? parsedExpiry : now + DEFAULT_TOKEN_TTL_MS;
  const encrypted = encryptToken(rawToken, deps.camelToken, cleaner.employeeId);

  await deps.cleanerTokens!.put({
    employeeId: cleaner.employeeId,
    email: cleaner.email,
    ...encrypted,
    connectedAt: now,
    expireAt,
  });

  return { ok: true, now };
}

export async function handleClock(req: ApiRequest, deps: Deps): Promise<ApiResponse> {
  if (req.method !== "POST") return { status: 405, body: { error: "Method Not Allowed" } };

  const p = (req.payload && typeof req.payload === "object" ? req.payload : {}) as Record<string, unknown>;
  const action = p.action ?? req.action;

  // One-step cleaner sign-in by emailed Camelo code (decision 0045): checks SCHEDULE_STAFF and the active
  // Camelo roster first (refusing office accounts and anyone not allowed before calling Camelo), then verifies
  // the 6-digit code, saves the encrypted Camelo token for clocking in, and issues a 30-day cleaner session token.
  if (action === "signInRequestCode") {
    if (!deps.cleanerTokens) {
      return { status: 503, body: { error: "Cleaner token store is not configured" } };
    }
    const asked = parse(SignInRequestAsked, { ...p, action }, { email: "Enter your work email address" });
    if ("error" in asked) return { status: 400, body: { error: asked.error } };
    const cleaner = await resolveActiveCleaner(asked.data.email, deps);
    if ("status" in cleaner) return cleaner;
    return requestCameloOtp(cleaner.email, deps);
  }

  if (action === "signInVerifyCode") {
    if (!deps.cleanerTokens) {
      return { status: 503, body: { error: "Cleaner token store is not configured" } };
    }
    const asked = parse(
      SignInVerifyAsked,
      { ...p, action },
      {
        email: "Enter your work email address",
        sessionToken: "Request a new code first",
        code: "Enter the code from the email",
      },
    );
    if ("error" in asked) return { status: 400, body: { error: asked.error } };
    const cleaner = await resolveActiveCleaner(asked.data.email, deps);
    if ("status" in cleaner) return cleaner;

    const stored = await verifyAndStoreCameloOtp(cleaner, asked.data.sessionToken, asked.data.code, deps);
    if ("status" in stored) return stored;

    const expSec = Math.floor((stored.now + CLEANER_SESSION_TTL_MS) / 1000);
    const token = signCleanerSession(cleaner.email, cleaner.employeeId, expSec, deps.camelToken);
    return {
      status: 200,
      body: { ok: true, token, email: cleaner.email, role: "cleaner", name: cleaner.name, cameloConnected: true },
    };
  }

  const who = await requireStaff(req, deps);
  if ("status" in who) return who;
  if (who.role !== "cleaner") {
    return { status: 403, body: { error: "Only a signed-in cleaner can connect their Camelo account or clock in" } };
  }
  if (!deps.cleanerTokens) {
    return { status: 503, body: { error: "Cleaner token store is not configured" } };
  }

  if (action === "requestCode") {
    // The email is always the signed-in cleaner's verified email, never taken from the request.
    return requestCameloOtp(who.email, deps);
  }

  if (action === "verifyCode") {
    const asked = parse(
      VerifyAsked,
      { ...p, action },
      {
        sessionToken: "Request a new code first",
        code: "Enter the code from the email",
      },
    );
    if ("error" in asked) return { status: 400, body: { error: asked.error } };

    const stored = await verifyAndStoreCameloOtp(who, asked.data.sessionToken, asked.data.code, deps);
    if ("status" in stored) return stored;

    return { status: 200, body: { ok: true, cameloConnected: true } };
  }

  if (action === "punch" || action === "photo") {
    const now = (deps.now ?? Date.now)();
    const stored = await deps.cleanerTokens.get(who.employeeId);
    const cleanerToken = stored && stored.expireAt > now ? decryptToken(stored, deps.camelToken) : null;
    if (!cleanerToken) {
      return { status: 409, body: { error: "Connect your Camelo account first" } };
    }

    if (action === "punch") {
      const asked = parse(
        PunchAsked,
        { ...p, action },
        {
          shiftId: "shiftId is required",
          type: 'type must be "in" or "out"',
          lat: "lat must be between -90 and 90",
          lon: "lon must be between -180 and 180",
          image: "image must be a JPEG photo, base64, under about 1.6 MB",
        },
      );
      if ("error" in asked) return { status: 400, body: { error: asked.error } };

      let jpegBytes: Buffer | null = null;
      if (asked.data.image) {
        jpegBytes = decodeJpeg(asked.data.image);
        if (!jpegBytes) return { status: 400, body: { error: "image must be a JPEG photo, base64, under about 1.6 MB" } };
      }

      let shift: {
        id: string;
        assignee: { id: string } | null;
        timeCard: { id: string; state: string; punches: ExistingPunch[] | null } | null;
      } | null;
      try {
        const data = await camelo<{ shift: typeof shift }>(deps, SHIFT_TIMECARD_QUERY, { id: asked.data.shiftId });
        shift = data.shift;
      } catch (e) {
        console.error(e);
        return { status: 502, body: { error: "Could not read this visit from Camelo" } };
      }

      if (!shift || shift.assignee?.id !== who.employeeId) {
        return { status: 403, body: { error: "That visit is not yours." } };
      }
      if (!shift.timeCard) {
        return { status: 409, body: { error: "Clock-in is not open for this visit yet (opens 4 hours before start)." } };
      }

      const tc = shift.timeCard;
      const existing = tc.punches ?? [];
      const lastMs = existing.reduce((m, x) => Math.max(m, Date.parse(x.atTime) || 0), 0);
      const punchMs = Math.max(now, lastMs + 1000);
      const atTime = new Date(punchMs).toISOString();
      const hasGps = typeof asked.data.lat === "number" && typeof asked.data.lon === "number";
      const attachment = {
        ...(hasGps ? { geoLat: asked.data.lat!, geoLong: asked.data.lon! } : {}),
        ...(jpegBytes ? { photoToken: atTime } : {}),
      };

      let punches: Record<string, unknown>[];
      if (asked.data.type === "in") {
        if (existing.some((x) => x.punchType === "CLOCK_IN") || tc.state === "CLOCKED_IN" || tc.state === "FINISHED") {
          return { status: 409, body: { error: "You have already clocked in for this visit." } };
        }
        punches = [
          ...existing.map((x) => toPunchInput(tc.id, x)),
          {
            timeCardId: tc.id,
            punchType: "CLOCK_IN",
            atTime,
            ...(Object.keys(attachment).length ? { attachment } : {}),
          },
        ];
      } else {
        if (!existing.some((x) => x.punchType === "CLOCK_IN")) {
          return { status: 409, body: { error: "Clock in to this visit first." } };
        }
        if (existing.some((x) => x.punchType === "FINISH") || tc.state === "FINISHED") {
          return { status: 409, body: { error: "You have already clocked out of this visit." } };
        }
        const finishTime = new Date(punchMs + 500).toISOString();
        punches = [
          ...existing.map((x) => toPunchInput(tc.id, x)),
          {
            timeCardId: tc.id,
            punchType: "CLOCK_OUT",
            atTime,
            ...(Object.keys(attachment).length ? { attachment } : {}),
          },
          {
            timeCardId: tc.id,
            punchType: "FINISH",
            atTime: finishTime,
          },
        ];
      }

      deps.readCache?.clear();
      try {
        const res = await camelo<{
          syncTimeCardPunches: { errors: MutationError[] | null; result: unknown };
        }>(deps, SYNC_TIMECARD_PUNCHES, { input: { punches } }, cleanerToken);
        const problem = sayNo(res.syncTimeCardPunches.errors);
        if (problem) return { status: 422, body: { error: problem } };
      } catch (e) {
        console.error(e);
        return { status: 502, body: { error: "Could not record your clock punch in Camelo" } };
      } finally {
        deps.readCache?.clear();
      }

      let photoAttached = false;
      if (jpegBytes) {
        try {
          await uploadAndAttachDoorPhoto(deps, cleanerToken, tc.id, atTime, jpegBytes);
          photoAttached = true;
        } catch (e) {
          // The punch is already recorded in Camelo; leave it standing so the cleaner can add the door photo next.
          console.error("Door photo upload after punch failed:", e);
        } finally {
          deps.readCache?.clear();
        }
      }

      return { status: 200, body: { ok: true, atTime, photoAttached } };
    }

    const asked = parse(
      PhotoAsked,
      { ...p, action },
      {
        shiftId: "shiftId is required",
        type: 'type must be "in" or "out"',
        image: "image must be a JPEG photo, base64, under about 1.6 MB",
      },
    );
    if ("error" in asked) return { status: 400, body: { error: asked.error } };
    const jpegBytes = decodeJpeg(asked.data.image);
    if (!jpegBytes) return { status: 400, body: { error: "image must be a JPEG photo, base64, under about 1.6 MB" } };

    let shift: {
      id: string;
      assignee: { id: string } | null;
      timeCard: { id: string; state: string; punches: ExistingPunch[] | null } | null;
    } | null;
    try {
      const data = await camelo<{ shift: typeof shift }>(deps, SHIFT_TIMECARD_QUERY, { id: asked.data.shiftId });
      shift = data.shift;
    } catch (e) {
      console.error(e);
      return { status: 502, body: { error: "Could not read this visit from Camelo" } };
    }

    if (!shift || shift.assignee?.id !== who.employeeId) {
      return { status: 403, body: { error: "That visit is not yours." } };
    }
    const targetType = asked.data.type === "in" ? "CLOCK_IN" : "CLOCK_OUT";
    const punch = (shift.timeCard?.punches ?? []).find((x) => x.punchType === targetType);
    if (!shift.timeCard || !punch) {
      return { status: 409, body: { error: "Record that punch first before adding its door photo." } };
    }

    deps.readCache?.clear();
    try {
      await uploadAndAttachDoorPhoto(deps, cleanerToken, shift.timeCard.id, punch.atTime, jpegBytes);
    } catch (e) {
      console.error(e);
      return { status: 502, body: { error: "Could not attach the door photo in Camelo" } };
    } finally {
      deps.readCache?.clear();
    }

    return { status: 200, body: { ok: true, photoAttached: true } };
  }

  return { status: 400, body: { error: "Unknown action" } };
}
