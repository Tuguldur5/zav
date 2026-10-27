import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabaseConfig } from "./config";
import { isStaleAuthError, supabaseCookieNames } from "./errors";

export { isStaleAuthError, supabaseCookieNames };

/** Cookie shape @supabase/ssr hands back through `setAll`. */
export type PendingCookie = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export type SessionResult = {
  user: User | null;
  /** A stale session cookie was found; the visitor must be treated as logged out. */
  stale: boolean;
  pendingCookies: PendingCookie[];
  /** Null when Supabase is not configured; otherwise the same cookie-bound client. */
  client: SupabaseClient | null;
};

/**
 * Reads the session and NEVER throws. `getUser()` reports an AuthApiError for a
 * cookie whose user was deleted; that reads as "logged out" here, so no page,
 * action or route can crash on it again.
 */
export async function readSession(req: NextRequest): Promise<SessionResult> {
  const pendingCookies: PendingCookie[] = [];
  if (!hasSupabaseConfig()) {
    return { user: null, stale: false, pendingCookies, client: null };
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          pendingCookies.push({ name, value, options: options as Record<string, unknown> });
        }
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return { user: null, stale: isStaleAuthError(error), pendingCookies, client: supabase };
    }
    return { user: data.user ?? null, stale: false, pendingCookies, client: supabase };
  } catch (error) {
    return { user: null, stale: isStaleAuthError(error), pendingCookies, client: supabase };
  }
}

/** Every `sb-*` cookie name present on the request. */
export function requestCookieNames(req: NextRequest): string[] {
  return supabaseCookieNames(req.cookies.getAll().map((cookie) => cookie.name));
}

/**
 * Expires the named session cookies on the response: same path, host-only (no
 * `domain`), so the browser really forgets a dead session.
 */
export function clearSupabaseCookies(res: NextResponse, names: string[]): void {
  for (const name of supabaseCookieNames(names)) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

let lastStaleLog = 0;

/** ONE short line per minute: no stack, no token, no cookie value. */
export function logStaleCookieOnce(): void {
  const now = Date.now();
  if (now - lastStaleLog < 60_000) return;
  lastStaleLog = now;
  console.warn("stale auth cookie cleared");
}
