import { createHash } from "node:crypto";

/**
 * In-memory counters for auth attempts. This is intentionally per-process:
 * the app runs as ONE instance (no PM2 cluster). Redis replaces this map when
 * the app is scaled out — the call sites do not change.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type LimitResult = { ok: boolean; retryAfterSeconds: number };

function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/** Count one attempt for a key. */
export function hit(key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Short, stable hash so an email never lands in a log or a counter name. */
export function hashKey(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 16);
}

export const LOGIN_PER_MINUTE = 5;
export const LOGIN_PER_EMAIL = 10;
export const LOGIN_EMAIL_WINDOW_MS = 15 * 60 * 1000;
export const REGISTER_WINDOW_MS = 10 * 60 * 1000;
export const FORGOT_WINDOW_MS = 60 * 60 * 1000;

export function limitLoginIp(ip: string): LimitResult {
  return hit(`login:ip:${ip}`, LOGIN_PER_MINUTE, 60_000);
}

export function limitLoginEmail(email: string): LimitResult {
  return hit(`login:mail:${hashKey(email)}`, LOGIN_PER_EMAIL, LOGIN_EMAIL_WINDOW_MS);
}

export function limitRegisterIp(ip: string): LimitResult {
  return hit(`register:ip:${ip}`, 3, REGISTER_WINDOW_MS);
}

export function limitForgot(ip: string, email: string): LimitResult {
  return hit(`forgot:${ip}:${hashKey(email)}`, 3, FORGOT_WINDOW_MS);
}
