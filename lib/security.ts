import { createHmac, timingSafeEqual, randomBytes } from 'crypto'

// ─── HMAC-SHA256 Webhook Signature Verification ───────────────────────────────
// Stripe signs webhook payloads with HMAC-SHA256 (stronger than SHA-224).
// We use timingSafeEqual to prevent timing-attack side-channels.
export function verifyStripeSignature(
  rawBody: string,
  header: string,
  secret: string,
  toleranceSeconds = 300 // reject events older than 5 minutes (replay attack protection)
): boolean {
  try {
    const parts = Object.fromEntries(
      header.split(',').map((p) => p.split('=') as [string, string])
    )
    const timestamp = parts['t']
    const signature = parts['v1']
    if (!timestamp || !signature) return false

    // Replay attack window
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
    if (age > toleranceSeconds || age < -30) return false

    const payload = `${timestamp}.${rawBody}`
    const expected = createHmac('sha256', secret).update(payload, 'utf8').digest('hex')

    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch {
    return false
  }
}

// ─── HMAC-SHA256 for internal tokens ─────────────────────────────────────────
export function signToken(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}

// ─── Sliding-window rate limiter (in-process) ─────────────────────────────────
// For multi-instance deployments swap this map for a Redis/Upstash store.
const _rateStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = _rateStore.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    _rateStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// ─── Input Sanitization ───────────────────────────────────────────────────────
export function sanitizeString(input: unknown, maxLen = 500): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, maxLen)
    .replace(/[<>'`\\]/g, '') // strip XSS chars — intentionally keeps " for inch symbols (e.g. 8x10")
    .replace(/\s+/g, ' ')
}

// For size strings like 8x10", 24x30" — only allow safe print-size characters
export function sanitizeSize(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.trim().slice(0, 30).replace(/[^a-zA-Z0-9x×\s"'×.×/–-]/g, '')
}

export function sanitizePositiveInt(input: unknown, min = 1, max = 99): number {
  const n = parseInt(String(input), 10)
  if (!Number.isFinite(n)) return min
  return Math.min(Math.max(n, min), max)
}

export function isValidUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 254
}

// ─── Secure response headers ──────────────────────────────────────────────────
export const SECURE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
} as const
