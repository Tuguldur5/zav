"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { roleHome, safeNextPath } from "@/lib/auth";
import { hostKind, hostOf, hostOrigin } from "@/lib/hosts";
import { clientIp } from "@/lib/request";
import { clearRecoveryCookie, hasRecoveryCookie } from "@/lib/recovery";
import { CUSTOMER_SIGNUP_KINDS, TERMS_VERSION, WORKER_SIGNUP_KINDS } from "@/lib/consent";
import {
  limitForgot,
  limitLoginEmail,
  limitLoginIp,
  limitRegisterIp,
} from "@/lib/auth/rate-limit";
import { honeypotTripped, verifyFormToken } from "@/lib/auth/form-token";
import {
  fieldErrors,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
} from "@/lib/validation";
import { mn } from "@/lib/i18n/mn";
import type { AuthState } from "@/lib/auth-state";
import type { Role } from "@/lib/types";

/**
 * Every failure path returns the SAME text for a given form, so an attacker
 * cannot tell an unknown address from a wrong password or a wrong host. The
 * fixed minimum duration also keeps the two outcomes comparable in time.
 */
const BAD_LOGIN = mn.marketing.auth.badLogin;
const TOO_MANY = mn.marketing.auth.tooMany;
const BAD_REQUEST = mn.marketing.auth.badRequest;
const MIN_AUTH_MS = 400;

async function settle(startedAt: number) {
  const rest = MIN_AUTH_MS - (Date.now() - startedAt);
  if (rest > 0) await new Promise((resolve) => setTimeout(resolve, rest));
}

function logEvent(name: string) {
  // Event names only: no email, no IP, no password, no token.
  console.warn(`auth.event.${name}`);
}

async function audience(): Promise<"customer" | "worker" | null> {
  const headerList = await headers();
  const kind = hostKind(hostOf(headerList));
  return kind === "customer" || kind === "worker" ? kind : null;
}

async function mailOrigin(): Promise<string | null> {
  const headerList = await headers();
  return hostOrigin(hostOf(headerList));
}

function botCheck(formData: FormData): boolean {
  if (honeypotTripped(formData.get("website"))) return true;
  return !verifyFormToken(String(formData.get("formToken") ?? ""));
}

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
  const startedAt = Date.now();
  const host = await audience();
  if (!host) return { error: BAD_REQUEST };
  if (botCheck(formData)) return { error: BAD_REQUEST };

  const headerList = await headers();
  if (!limitRegisterIp(clientIp(headerList)).ok) {
    logEvent("register_rate_limited");
    return { error: TOO_MANY };
  }

  const parsed = registerSchema.safeParse({
    role: host,
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    districtId: String(formData.get("districtId") ?? "") || undefined,
    skills: formData.getAll("skills").map(String).filter(Boolean),
    experienceNote: String(formData.get("experienceNote") ?? "") || undefined,
    consent: formData.get("consent") === "on",
    declaration: formData.get("declaration") === "on",
    phoneCheck: formData.get("phoneCheck") === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;
  const next = safeNextPath(String(formData.get("next") ?? ""), host);

  const origin = await mailOrigin();
  if (!origin) return { error: BAD_REQUEST };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // The token_hash handler needs no PKCE cookie, so the link works in any
      // browser and always lands on the host that created the account.
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        role: host,
        full_name: input.fullName,
        phone: input.phone,
        district_id: host === "worker" ? input.districtId : undefined,
        skills: host === "worker" ? input.skills : [],
        experience_note: host === "worker" ? (input.experienceNote ?? "") : "",
      },
    },
  });

  // "Already registered" is never revealed: the same neutral answer is shown.
  if (error || !data.session) {
    logEvent("register_accepted");
    await settle(startedAt);
    return { ok: true, needsConfirm: true, role: host };
  }

  const kinds = host === "worker" ? WORKER_SIGNUP_KINDS : CUSTOMER_SIGNUP_KINDS;
  const consent = await supabase.rpc("accept_consents", {
    p_kinds: kinds,
    p_version: TERMS_VERSION,
  });
  redirect(consent.error ? "/consent" : (next ?? roleHome(host)));
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const startedAt = Date.now();
  const headerList = await headers();
  if (botCheck(formData)) return { error: BAD_LOGIN };

  const ipLimit = limitLoginIp(clientIp(headerList));
  if (!ipLimit.ok) {
    logEvent("login_rate_limited_ip");
    return { error: TOO_MANY };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  if (!limitLoginEmail(parsed.data.email).ok) {
    logEvent("login_rate_limited_email");
    return { error: TOO_MANY };
  }

  const host = await audience();
  if (!host) return { error: BAD_LOGIN };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    await settle(startedAt);
    return { error: BAD_LOGIN };
  }

  const user = await getCurrentUser();
  if (!user) {
    await supabase.auth.signOut();
    await settle(startedAt);
    return { error: BAD_LOGIN };
  }

  const profile = await profileOf(user.id);
  // Suspended, missing, staff or the wrong host: identical message, and the
  // session is closed on this host so a stale cookie cannot be reused.
  if (!profile || profile.status === "suspended" || profile.role !== host) {
    await supabase.auth.signOut();
    logEvent("login_rejected_role_or_status");
    await settle(startedAt);
    return { error: BAD_LOGIN };
  }

  const next = safeNextPath(String(formData.get("next") ?? ""), profile.role);
  redirect(next ?? roleHome(profile.role));
}

export async function forgotAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const startedAt = Date.now();
  if (botCheck(formData)) return { error: BAD_REQUEST };

  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const headerList = await headers();
  const origin = hostOrigin(hostOf(headerList));
  if (!origin) return { error: BAD_REQUEST };

  if (!limitForgot(clientIp(headerList), parsed.data.email).ok) {
    logEvent("forgot_rate_limited");
    return { error: mn.auth.limit };
  }

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/auth/confirm`,
    });
  } catch {
    // Never reveal whether the address exists — or that Supabase refused.
  }

  await settle(startedAt);
  return { ok: true, notice: mn.auth.forgotSent };
}

export async function resetAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const user = await getCurrentUser();
  if (!user || !(await hasRecoveryCookie())) return { error: mn.auth.resetExpired };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Нууц үг солиход алдаа гарлаа. Холбоосоо дахин авна уу." };

  await supabase.auth.signOut();
  await clearRecoveryCookie();
  redirect("/login?reset=1");
}
