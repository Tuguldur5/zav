import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed render-time token: a naive bot that posts a form without loading it,
 * or posts instantly, is rejected. The check is intentionally soft — the
 * secret may be unset in local development, which disables it with a warning
 * (see PROGRESS.md "what I must do manually").
 */
const MIN_MS = 2_000;
const MAX_MS = 2 * 60 * 60 * 1000;

let warned = false;

function secret(): string {
  const value = process.env.FORM_TOKEN_SECRET ?? "";
  if (!value && !warned) {
    warned = true;
    // Never print the value; there is none. Event name only.
    console.warn("FORM_TOKEN_SECRET is not set: form time-token check is disabled.");
  }
  return value;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

/** Token for a form rendered on the server right now. */
export function issueFormToken(now = Date.now()): string {
  const key = secret();
  if (!key) return "";
  const payload = String(now);
  return `${payload}.${sign(payload, key)}`;
}

/** True when the token is ours and was issued 2s–2h ago. */
export function verifyFormToken(token: string | null | undefined): boolean {
  const key = secret();
  if (!key) return true;
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload, key);
  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt)) return false;
  const age = Date.now() - issuedAt;
  return age >= MIN_MS && age <= MAX_MS;
}

/** Honeypot: a real browser leaves this field empty and invisible. */
export function honeypotTripped(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
