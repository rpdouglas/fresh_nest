import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** Minimum byte length for private signing link tokens (ADR-021). */
export const TOKEN_BYTE_LENGTH = 32

/** Valid base64url token format (32+ bytes => 43+ base64url chars, bounded to prevent abuse). */
const BASE64URL_TOKEN_RE = /^[A-Za-z0-9_-]{43,128}$/

/** Generates a cryptographically random 32-byte base64url bearer token. Never log this value. */
export function generateAgreementToken(): string {
  return randomBytes(TOKEN_BYTE_LENGTH).toString('base64url')
}

/** Returns the lowercase SHA-256 hex digest of a raw token (stored in Firestore as `tokenHash`). */
export function hashAgreementToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex')
}

/** Returns the lowercase SHA-256 hex digest of the canonical rendered agreement text. */
export function hashAgreementDocument(canonicalText: string): string {
  return createHash('sha256').update(canonicalText, 'utf8').digest('hex')
}

/** Checks that an incoming raw token has the expected base64url shape before hashing/querying. */
export function isValidTokenFormat(rawToken: unknown): rawToken is string {
  return typeof rawToken === 'string' && BASE64URL_TOKEN_RE.test(rawToken)
}

/** Constant-time comparison of two SHA-256 hex digests. */
export function hashesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
