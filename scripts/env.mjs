import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

/** Minimal .env loader (scripts only; the app gets env from the process). */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(process.cwd(), file);
    if (!existsSync(full)) continue;
    const text = readFileSync(full, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const index = line.indexOf("=");
      if (index < 1) continue;
      const key = line
        .slice(0, index)
        .trim()
        .replace(/^export\s+/, "");
      let value = line.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined && value) process.env[key] = value;
    }
  }
}

export function getConnectionString() {
  loadEnv();
  const url = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_POOLER_URL or DATABASE_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  return url;
}

function hint(error) {
  const code = error?.code ?? "";
  if (["ENETUNREACH", "ETIMEDOUT", "EHOSTUNREACH"].includes(code)) {
    console.error(
      "\nNetwork unreachable. Use the Session pooler (IPv4) connection string from " +
        "Supabase → Project settings → Database → Connect (Session pooler).",
    );
  }
  if (code === "28P01") {
    console.error(
      "\nThe database password was rejected (28P01). Update DATABASE_POOLER_URL in " +
        ".env.local with the current Session pooler string; scripts cannot run without it.",
    );
  }
  console.error(`Connection failed (${code || "unknown"}). Check your network and credentials.`);
}

/**
 * One fresh client per attempt: a pg client cannot be reconnected after a
 * failed connect, so the old retry loop hid the real error behind
 * "Client has already been connected".
 */
export async function withDb(fn) {
  const connectionString = getConnectionString();
  const local = /localhost|127\.0\.0\.1/.test(connectionString);
  const retryable = ["ENETUNREACH", "ETIMEDOUT", "EHOSTUNREACH", "ECONNREFUSED"];
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const client = new pg.Client({
      connectionString,
      ssl: local ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    try {
      await client.connect();
      try {
        return await fn(client);
      } finally {
        await client.end().catch(() => {});
      }
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});
      if (!retryable.includes(error.code) || attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }

  hint(lastError);
  throw lastError;
}

/**
 * APP_URL may use a `*.localhost` name, which resolves in a browser but not in
 * Node. Connect to loopback instead and let the scripts send the Host header.
 */
export function resolveAppBase(raw = process.env.APP_URL) {
  const value = (raw || "http://127.0.0.1:3000").replace(/\/$/, "");
  try {
    const url = new URL(value);
    if (url.hostname.endsWith(".localhost") || url.hostname === "localhost") {
      const port = url.port || "3000";
      return `${url.protocol}//127.0.0.1:${port}`;
    }
  } catch {
    return value;
  }
  return value;
}

export function requireEmail() {
  const email = process.argv[2];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Usage: npm run super:make -- you@mail.com");
    process.exit(1);
  }
  return email;
}
