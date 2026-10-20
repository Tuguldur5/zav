import crypto from "node:crypto";
import { loadEnv } from "../env.mjs";

// ESM hoists imports, so the env file must be read here before the constants below.
loadEnv();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function hasCredentials() {
  return Boolean(SUPABASE_URL && ANON);
}

export const configError =
  "verify needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and DATABASE_POOLER_URL set in .env.local.";

export async function rest(path, { method = "GET", token, body, headers = {} } = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token || ANON}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: response.ok, status: response.status, data };
}

export async function auth(path, body, token) {
  return rest(`/auth/v1${path}`, { method: "POST", body, token });
}

export async function signUp(email, password, metadata) {
  const result = await auth("/signup", { email, password, data: metadata });
  if (!result.ok && !String(result.data?.msg ?? result.data?.message ?? "").includes("already")) {
    throw new Error(`signup failed for ${email}: ${result.status} ${JSON.stringify(result.data)}`);
  }
  return result;
}

export async function signInSession(email, password) {
  const result = await auth("/token?grant_type=password", { email, password });
  if (!result.ok) {
    throw new Error(`signin failed for ${email}: ${result.status} ${JSON.stringify(result.data)}`);
  }
  return result.data;
}

export async function signIn(email, password) {
  return (await signInSession(email, password)).access_token;
}

export async function enrollTotp(token) {
  const enroll = await rest("/auth/v1/factors", {
    method: "POST",
    token,
    body: { factor_type: "totp", friendly_name: "verify" },
  });
  if (!enroll.ok) throw new Error(`mfa enroll failed: ${JSON.stringify(enroll.data)}`);
  const factorId = enroll.data.id;
  const secret = enroll.data.totp?.secret;
  const challenge = await rest(`/auth/v1/factors/${factorId}/challenge`, {
    method: "POST",
    token,
    body: {},
  });
  if (!challenge.ok) throw new Error(`mfa challenge failed: ${JSON.stringify(challenge.data)}`);
  const verify = await rest(`/auth/v1/factors/${factorId}/verify`, {
    method: "POST",
    token,
    body: { challenge_id: challenge.data.id, code: totp(secret) },
  });
  if (!verify.ok) throw new Error(`mfa verify failed: ${JSON.stringify(verify.data)}`);
  return verify.data;
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function totp(secret, digits = 6, step = 30) {
  let bits = "";
  for (const char of secret.toUpperCase().replace(/=+$/, "")) {
    const index = B32.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  const counter = Math.floor(Date.now() / 1000 / step);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", Buffer.from(bytes)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(value % 10 ** digits).padStart(digits, "0");
}

/**
 * Cookie header value matching the @supabase/ssr cookie format:
 * `sb-<ref>-auth-token` = "base64-" + base64url(JSON session), chunked >3180.
 */
export function sessionCookieHeader(session) {
  const raw = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const ref = new URL(SUPABASE_URL).host.split(".")[0];
  const name = `sb-${ref}-auth-token`;
  if (raw.length <= 3180) return `${name}=${raw}`;
  const size = 3000;
  const parts = [];
  for (let i = 0; i < raw.length; i += size) parts.push(raw.slice(i, i + size));
  return parts.map((part, index) => `${name}.${index}=${part}`).join("; ");
}

export function randomPassword() {
  return `${crypto.randomBytes(12).toString("base64url")}Aa1!`;
}

let failures = 0;

export function check(label, passed, detail = "") {
  if (!passed) failures += 1;
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

export function failedCount() {
  return failures;
}

export function tomorrowISO() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
