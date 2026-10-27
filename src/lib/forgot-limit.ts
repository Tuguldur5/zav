import { createHash } from "node:crypto";

/**
 * Password-reset request limit: 3 per hour per (IP + email hash). In memory on
 * purpose — this app runs as ONE instance (see README). Redis replaces it when
 * the app has to scale out or be restarted often.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 3;

const buckets = new Map<string, { count: number; resetAt: number }>();

/** The raw address is never stored: only a short hash of it in the key. */
export function forgotRateLimitKey(ip: string, email: string): string {
  const digest = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return `${ip}:${digest.slice(0, 16)}`;
}

/** Returns false when this (IP, email) pair has used up its hourly budget. */
export function allowForgotRequest(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= MAX_REQUESTS;
}
