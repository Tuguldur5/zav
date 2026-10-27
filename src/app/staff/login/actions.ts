"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaffRole, roleHome, safeNextPath } from "@/lib/auth";
import { mapAuthError } from "@/lib/auth-errors";
import { fieldErrors, loginSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";

export async function staffLoginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: mapAuthError(error.message) };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Нэвтрэх эрхгүй" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  // Customers and workers can never use the staff host: sign out of this host
  // and show only the generic message.
  if (!profile || !isStaffRole(profile.role) || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: "Нэвтрэх эрхгүй" };
  }

  const store = await cookies();
  store.set("zav_staff_seen", String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  });

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") redirect("/security");

  const next = safeNextPath(String(formData.get("next") ?? ""), profile.role);
  redirect(next ?? roleHome(profile.role));
}
