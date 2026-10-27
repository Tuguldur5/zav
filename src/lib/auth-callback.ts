import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { isStaffRole, loadProfile, needsConsent, roleHome } from "@/lib/auth";
import { hostKind, hostOf, hostOrigin } from "@/lib/hosts";
import { RECOVERY_COOKIE, recoveryCookieOptions } from "@/lib/recovery";

/**
 * Shared `/auth/callback` handler, kept for links already in the wild and for
 * the PKCE code flow. Each audience mounts the route on its own host; the
 * session cookie stays on the host that received the callback.
 *
 * The only path taken from the URL is the literal `/reset-password` (old
 * recovery mails). Everything else is decided here, and nothing throws: a bad
 * or reused link redirects with an error flag instead of answering 500.
 */
export async function handleAuthCallback(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const origin = hostOrigin(hostOf(request.headers)) ?? url.origin;
  const to = (path: string) => NextResponse.redirect(new URL(path, origin));

  const wantsReset = url.searchParams.get("next") === "/reset-password";
  const failPath = wantsReset ? "/forgot-password?error=link" : "/login?error=auth";

  if (url.searchParams.get("error_description")) return to(failPath);

  const code = (url.searchParams.get("code") ?? "").trim();
  const tokenHash = (url.searchParams.get("token_hash") ?? "").trim();
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (!code && !tokenHash) return to("/login");

  try {
    const supabase = await createClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return to(failPath);
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) return to(failPath);
    }
  } catch {
    return to(failPath);
  }

  try {
    const user = await getCurrentUser();
    if (!user) return to(failPath);

    const profile = await loadProfile(user.id);
    if (!profile) return to("/login?error=auth");

    // A staff session belongs to the staff host only; same for the user hosts.
    const kind = hostKind(hostOf(request.headers));
    const expected = isStaffRole(profile.role) ? "staff" : profile.role;
    if (kind !== expected) {
      const supabase = await createClient();
      await supabase.auth.signOut();
      return to("/login?error=host");
    }

    if (wantsReset) {
      const res = to("/reset-password");
      res.cookies.set(RECOVERY_COOKIE, "1", recoveryCookieOptions());
      return res;
    }
    if (needsConsent(profile)) return to("/consent");
    return to(roleHome(profile.role));
  } catch {
    return to(failPath);
  }
}
