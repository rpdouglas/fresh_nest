/**
 * P3-E42: Address-only geocoding via OpenStreetMap Nominatim, reusing the `schedulePlaces`
 * Firestore cache established by FNC decision 0009 (`functions-ops/src/routes/schedule-check.ts`).
 *
 * Privacy rule (FNC 0009 & COMPLIANCE.md §2): ONLY the street address is sent — never client
 * name, email, or phone.
 */
import { createHash } from 'node:crypto'
import type { Firestore } from 'firebase-admin/firestore'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'freshnest-lead-bridge/1.0 (https://www.freshnestco.ca)'
const PLACE_COLLECTION = 'schedulePlaces'
const RETRY_MISS_MS = 30 * 86_400_000

export function normalizePlaceKey(address: string): string {
  return address.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function placeDocId(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export interface GeocodeResult {
  found: boolean
  lat: number | null
  lon: number | null
}

/**
 * Looks up `address` in `schedulePlaces` first, falling back to Nominatim (`countrycodes=ca`).
 * Errors from Nominatim are swallowed cleanly and return `{ found: false, lat: null, lon: null }`
 * so Lauren/Ryan can enter manual coordinates or use the Cornwall fallback pin.
 */
export async function geocodeAddressWithCache(
  address: string,
  db: Firestore,
  opts: { fetchImpl?: typeof fetch; now?: () => number; writeCache?: boolean } = {},
): Promise<GeocodeResult> {
  const cleaned = address.replace(/\s+/g, ' ').trim()
  if (cleaned.length < 5) return { found: false, lat: null, lon: null }

  const key = normalizePlaceKey(cleaned)
  const docRef = db.collection(PLACE_COLLECTION).doc(placeDocId(key))
  const now = (opts.now ?? Date.now)()

  try {
    const cached = await docRef.get()
    if (cached.exists) {
      const data = cached.data() as { lat?: number | null; lon?: number | null; at?: number } | undefined
      if (typeof data?.lat === 'number' && typeof data?.lon === 'number') {
        return { found: true, lat: data.lat, lon: data.lon }
      }
      if (data && typeof data.at === 'number' && now - data.at < RETRY_MISS_MS) {
        return { found: false, lat: null, lon: null }
      }
    }
  } catch {
    // Cache miss or unavailable — proceed to live lookup
  }

  try {
    const url = `${NOMINATIM_URL}?${new URLSearchParams({
      q: cleaned,
      format: 'jsonv2',
      limit: '1',
      countrycodes: 'ca',
    })}`
    const res = await (opts.fetchImpl ?? fetch)(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return { found: false, lat: null, lon: null }
    const hits = (await res.json()) as Array<{ lat?: string; lon?: string }>
    const lat = Number(hits[0]?.lat)
    const lon = Number(hits[0]?.lon)
    const found = hits.length > 0 && Number.isFinite(lat) && Number.isFinite(lon)

    if (opts.writeCache !== false) {
      await docRef
        .set({ key, lat: found ? lat : null, lon: found ? lon : null, at: now })
        .catch(() => {})
    }

    return found ? { found: true, lat, lon } : { found: false, lat: null, lon: null }
  } catch {
    return { found: false, lat: null, lon: null }
  }
}
