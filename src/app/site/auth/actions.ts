"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentOrigin } from "@/lib/request";
import { isStaffRole, roleHome, safeNextPath } from "@/lib/auth";
import { mapAuthError } from "@/lib/auth-errors";
import {
  fieldErrors,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
} from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";
import type { Role } from "@/lib/types";

async function profileOf(id: string): Promise<{ role: Role; status: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", id)
    .maybeSingle();
  return data as { role: Role; status: string } | null;
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    role: formData.get("role"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    districtId: String(formData.get("districtId") ?? "") || undefined,
    skills: formData.getAll("skills").map(String).filter(Boolean),
    experienceNote: String(formData.get("experienceNote") ?? "") || undefined,
    consent: formData.get("consent") === "on",
  });

  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const supabase = await createClient();
  const origin = await currentOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role: input.role,
        full_name: input.fullName,
        phone: input.phone,
        district_id: input.role === "worker" ? input.districtId : undefined,
        skills: input.role === "worker" ? input.skills : [],
        experience_note: input.role === "worker" ? (input.experienceNote ?? "") : "",
      },
    },
  });

  if (error) return { error: mapAuthError(error.message) };

  if (!data.session) {
    return { ok: true, needsConfirm: true, role: input.role };
  }

  redirect(input.role === "worker" ? "/w" : "/c");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
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
  } = await supabase.auth.getUser();
  if (!user) return { error: "Нэвтрэх эрхгүй" };

  const profile = await profileOf(user.id);
  if (!profile || isStaffRole(profile.role)) {
    await supabase.auth.signOut();
    return { error: "Нэвтрэх эрхгүй" };
  }
  if (profile.status === "suspended") {
    await supabase.auth.signOut();
    return { error: "Бүртгэл түр хаагдсан байна. Тусламжийн утсаар холбогдоно уу." };
  }

  const next = safeNextPath(String(formData.get("next") ?? ""), profile.role, false);
  redirect(next ?? roleHome(profile.role));
}

export async function forgotAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const origin = await currentOrigin();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always generic: never reveal whether the address exists.
  return { ok: true };
}

export async function resetAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: "Холбоосын хугацаа дууссан байна. Дахин хүсэлт гаргана уу." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profile = await profileOf(user.id);
  if (!profile || isStaffRole(profile.role)) {
    await supabase.auth.signOut();
    redirect("/login");
  }
  redirect(roleHome(profile.role));
}
