import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient, dropSessionCookies, getCurrentUser } from "@/lib/supabase/server";
import { isStaffRole, loadProfile, needsConsent, roleHome } from "@/lib/auth";
import { hostKind, hostOf, hostOrigin } from "@/lib/hosts";
import { RECOVERY_COOKIE, recoveryCookieOptions } from "@/lib/recovery";

/** Only the email-link types we actually send. Anything else is rejected. */
const ALLOWED_TYPES: EmailOtpType[] = [
  "recovery",
  "email",
  "signup",
  "invite",
  "magiclink",
  "email_change",
];

/**
 * Shared `/auth/confirm` handler: mounted on the customer, worker and staff
 * hosts. It verifies `token_hash` instead of exchanging a PKCE code, so the link
 * works in any browser or device — no verifier cookie needed.
 *
 * Redirect targets are FIXED internal paths chosen by `type`; a query value can
 * never decide where the visitor goes next, and the route never returns 500.
 */
export async function handleAuthConfirm(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const origin = hostOrigin(hostOf(request.headers)) ?? url.origin;
  const to = (path: string) => NextResponse.redirect(new URL(path, origin));

  const tokenHash = (url.searchParams.get("token_hash") ?? "").trim();
  const type = ALLOWED_TYPES.find((item) => item === url.searchParams.get("type"));
  const recovery = type === "recovery";
  const failPath = recovery ? "/forgot-password?error=link" : "/login?error=link";

  if (!tokenHash || !type) return to(failPath);

  try {
    // A cookie left behind by a deleted session must not block the link.
    await dropSessionCookies();
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return to(failPath);
  } catch {
    return to(failPath);
  }

  if (recovery) {
    // Only this browser may set the new password, and only for 15 minutes.
    const res = to("/reset-password");
    res.cookies.set(RECOVERY_COOKIE, "1", recoveryCookieOptions());
    return res;
  }

  try {
    const user = await getCurrentUser();
    if (!user) return to(failPath);

    const profile = await loadProfile(user.id);
    if (!profile) return to("/login?error=auth");

    const kind = hostKind(hostOf(request.headers));
    // An invited team member confirms on the staff host as a plain customer
    // account; the invite code is redeemed on /join, which is the only staff
    // page such a session may open.
    if (kind === "staff" && profile.role === "customer") return to("/join");

    const expected = isStaffRole(profile.role) ? "staff" : profile.role;
    if (kind !== expected) {
      const supabase = await createClient();
      await supabase.auth.signOut();
      return to("/login?error=host");
    }

    if (needsConsent(profile)) return to("/consent");
    return to(roleHome(profile.role));
  } catch {
    return to(failPath);
  }
}
