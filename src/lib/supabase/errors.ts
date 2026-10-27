/**
 * Stale-session detection shared by the middleware, the server helper and the
 * auth routes. Kept free of `next/server` so server components can import it.
 */

const STALE_CODES = new Set([
  "refresh_token_not_found",
  "invalid_refresh_token",
  "session_not_found",
  "session_missing",
  "refresh_token_already_used",
]);

/**
 * True for the errors a browser cookie left over from a deleted account
 * produces. Anything else (network, rate limit) is a different problem.
 */
export function isStaleAuthError(error: unknown): boolean {
  if (!error) return false;
  const code = String((error as { code?: unknown }).code ?? "");
  if (STALE_CODES.has(code)) return true;
  const message = String((error as { message?: unknown }).message ?? error);
  return /refresh token/i.test(message);
}

/** Every Supabase session cookie starts with `sb-`. */
export function isSupabaseCookie(name: string): boolean {
  return name.startsWith("sb-");
}

/** `sb-<ref>-auth-token` (and its `.0`, `.1` chunks). */
export function supabaseCookieNames(names: Iterable<string>): string[] {
  const out: string[] = [];
  for (const name of names) if (isSupabaseCookie(name)) out.push(name);
  return out;
}
