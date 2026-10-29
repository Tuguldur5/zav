import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { TERMS_VERSION } from "@/lib/consent";
import type { Profile, Role } from "@/lib/types";

const REAUTH_COOKIE = "zav_reauth_at";
const REAUTH_MAX_AGE_MS = 10 * 60 * 1000;

const STAFF_ROLES: Role[] = ["admin", "super_admin"];

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

/** Path after login, relative to the host the role belongs to. */
export function roleHome(role: Role): string {
  switch (role) {
    case "customer":
      return "/c";
    case "worker":
      return "/home";
    case "admin":
      return "/today";
    case "super_admin":
      return "/super";
  }
}

/**
 * The caller's profile row. Wrapped in React `cache` so the staff layout and
 * the page it renders share ONE round trip per request instead of two (the
 * profile query costs ~200 ms against the hosted database). `cache` is
 * request-scoped, so nothing is shared between users or requests.
 */
export const loadProfile = cache(async (id: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, district_id, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load profile: ${error.message}`);
  if (!data) return null;

  const profile = data as Omit<Profile, "terms_version" | "terms_accepted_at">;
  if (isStaffRole(profile.role)) {
    return { ...profile, terms_version: null, terms_accepted_at: null };
  }

  const { data: consent, error: consentError } = await supabase
    .from("profiles")
    .select("terms_version, terms_accepted_at")
    .eq("id", id)
    .maybeSingle();
  if (consentError) throw new Error(`Unable to load profile consent: ${consentError.message}`);

  return { ...profile, ...consent } as Profile;
});

/** For pages that only need a signed-in user (auth screens, callback). */
export async function getViewer() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { supabase, user: null, profile: null };
  const profile = await loadProfile(user.id);
  return { supabase, user, profile };
}

/** Customers and workers must accept the current terms before using the app. */
export function needsConsent(profile: Profile): boolean {
  if (isStaffRole(profile.role)) return false;
  return !profile.terms_version || profile.terms_version !== TERMS_VERSION;
}

export async function requireRole(roles: Role[], options?: { skipConsent?: boolean }) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const profile = await loadProfile(user.id);
  if (!profile || profile.status === "suspended" || !roles.includes(profile.role)) {
    notFound();
  }

  if (isStaffRole(profile.role)) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") redirect("/security");
  } else if (!options?.skipConsent && needsConsent(profile)) {
    redirect("/consent");
  }

  return { supabase, user, profile };
}

/** Staff page helper that does NOT require aal2 (used by /security itself). */
export async function requireStaffBase() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const profile = await loadProfile(user.id);
  if (!profile || !isStaffRole(profile.role) || profile.status !== "active") {
    notFound();
  }

  return { supabase, user, profile };
}

/**
 * `next` is accepted only as a same-host relative path the role may open.
 * Absolute URLs, protocol-relative paths and traversal are rejected.
 */
export function safeNextPath(next: string | null | undefined, role: Role): string | null {
  if (!next) return null;
  if (next.length > 200) return null;
  // A scheme, a backslash or a control character is never a same-host path.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(next)) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return null;
  }
  if (decoded.length > 200) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(decoded)) return null;
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;
  if (decoded.includes("//") || decoded.includes("..")) return null;
  if (decoded === "/reset-password") return decoded;

  const allowedByRole: Record<Role, string[]> = {
    customer: ["/c", "/consent"],
    worker: ["/home", "/calendar", "/offers", "/me", "/consent"],
    admin: [
      "/today",
      "/jobs",
      "/workers",
      "/calendar",
      "/notifications",
      "/profile",
      "/security",
    ],
    super_admin: ["/super", "/notifications", "/profile", "/security"],
  };

  const pathOnly = decoded.split(/[?#]/)[0];
  const permitted = allowedByRole[role].some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
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
