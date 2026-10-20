import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * Server-side Supabase client. Cookies are always host-only: we strip any
 * `domain` option so the user host and the staff host keep separate sessions.
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
