/**
 * Opt-in timing logs, enabled with PERF_LOG=1. One short line per request or
 * per Supabase call; never cookies, user ids, emails or query strings.
 */
export const PERF_LOG = process.env.PERF_LOG === "1";

type Fields = Record<string, string | number | boolean | undefined>;

/** `[perf] key=value ...` on stdout; a no-op unless PERF_LOG=1. */
export function perfLog(fields: Fields): void {
  if (!PERF_LOG) return;
  const parts = ["[perf]"];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    parts.push(`${key}=${String(value).replace(/\s+/g, "_")}`);
  }
  console.log(parts.join(" "));
}

/** Supabase path only (no query string, so no ids can leak into the log). */
function perfPath(raw: string): string {
  try {
    return new URL(raw).pathname.slice(0, 80);
  } catch {
    return "unknown";
  }
}

function perfKind(raw: string): "auth" | "db" {
  return perfPath(raw).startsWith("/auth/v1/") ? "auth" : "db";
}

/**
 * `global.fetch` for the server-side Supabase clients: times the call and logs
 * `kind` (auth or db), the path, duration and status. Behaviour is unchanged.
 */
export function perfFetch(scope: "server" | "anon" | "middleware"): typeof fetch {
  const wrapped: typeof fetch = async (input, init) => {
    if (!PERF_LOG) return fetch(input, init);
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const started = Date.now();
    try {
      const response = await fetch(input, init);
      perfLog({
        scope,
        kind: perfKind(url),
        path: perfPath(url),
        ms: Date.now() - started,
        status: response.status,
      });
      return response;
    } catch (error) {
      perfLog({
        scope,
        kind: perfKind(url),
        path: perfPath(url),
        ms: Date.now() - started,
        status: "error",
        reason: error instanceof Error ? error.name : "unknown",
      });
      throw error;
    }
  };
  return wrapped;
}
