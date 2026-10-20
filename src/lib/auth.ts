import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

const REAUTH_COOKIE = "zav_reauth_at";
const REAUTH_MAX_AGE_MS = 10 * 60 * 1000;

const STAFF_ROLES: Role[] = ["admin", "super_admin"];

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function roleHome(role: Role): string {
  switch (role) {
    case "customer":
      return "/c";
    case "worker":
      return "/w";
    case "admin":
      return "/today";
    case "super_admin":
      return "/super";
  }
}

export async function loadProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, district_id, status, created_at")
    .eq("id", id)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

/** For pages that only need a signed-in user (auth screens, callback). */
export async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const profile = await loadProfile(user.id);
  return { supabase, user, profile };
}

export async function requireRole(roles: Role[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await loadProfile(user.id);
  if (!profile || profile.status === "suspended" || !roles.includes(profile.role)) {
    notFound();
  }

  if (isStaffRole(profile.role)) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") redirect("/security");
  }

  return { supabase, user, profile };
}

/** Staff page helper that does NOT require aal2 (used by /security itself). */
export async function requireStaffBase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await loadProfile(user.id);
  if (!profile || !isStaffRole(profile.role) || profile.status !== "active") {
    notFound();
  }

  return { supabase, user, profile };
}

/** Only same-host relative paths the role is allowed to open. */
export function safeNextPath(
  next: string | null | undefined,
  role: Role,
  staffHost: boolean,
): string | null {
  if (!next) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("..")) {
    return null;
  }
  if (decoded === "/reset-password") return decoded;

  const allowedByRole: Record<Role, string[]> = {
    customer: ["/c", "/help"],
    worker: ["/w", "/help"],
    admin: ["/today", "/jobs", "/workers", "/calendar", "/notifications", "/security"],
    super_admin: [
      "/today",
      "/jobs",
      "/workers",
      "/calendar",
      "/notifications",
      "/security",
      "/super",
    ],
  };

  const prefixes = staffHost
    ? allowedByRole[role]
    : ["/c", "/w", "/help"].filter(
        (prefix) => roleHome(role).startsWith(prefix) || prefix === "/help",
      );

  const permitted = prefixes.some(
    (prefix) => decoded === prefix || decoded.startsWith(`${prefix}/`),
  );
  return permitted ? decoded : null;
}

export async function hasRecentReauth(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(REAUTH_COOKIE)?.value;
  if (!raw) return false;
  const timestamp = Number(raw);
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp < REAUTH_MAX_AGE_MS;
}

export const reauthCookieName = REAUTH_COOKIE;
