import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isStaffRole, loadProfile, roleHome, safeNextPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next");
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  const supabase = await createClient();

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) throw error;
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  const profile = await loadProfile(user.id);
  if (!profile) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  // Staff sessions belong to the staff host only.
  if (isStaffRole(profile.role)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=host", request.url));
  }

  const target =
    next === "/reset-password"
      ? next
      : (safeNextPath(next, profile.role, false) ?? roleHome(profile.role));

  return NextResponse.redirect(new URL(target, request.url));
}
