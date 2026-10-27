import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { isStaleAuthError, isSupabaseCookie } from "./errors";

/**
 * Server-side Supabase client. Cookies are always host-only: we strip any
 * `domain` option so the user hosts and the staff host keep separate sessions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...options, domain: undefined });
          });
        } catch {
          // Called from a Server Component render: middleware already refreshed
          // the session, so this can be safely ignored.
        }
      },
    },
  });
}

/**
 * Drops every `sb-*` cookie of the current response. Works in actions and route
 * handlers; inside a Server Component render it throws and is ignored, because
 * the middleware clears the same cookies on the response there.
 */
export async function dropSessionCookies(): Promise<void> {
  try {
    const store = await cookies();
    for (const cookie of store.getAll()) {
      if (isSupabaseCookie(cookie.name)) store.delete(cookie.name);
    }
  } catch {
    // Read-only cookie store (server component render).
  }
}

/**
 * The signed-in user, or `null`. Wrapped in React `cache` so one request reads
 * the session once, and it never throws: a stale cookie reads as logged out.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) return data.user ?? null;
    if (isStaleAuthError(error)) await dropSessionCookies();
    return null;
  } catch (error) {
    if (isStaleAuthError(error)) await dropSessionCookies();
    return null;
  }
});
