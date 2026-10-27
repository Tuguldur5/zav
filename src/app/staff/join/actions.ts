"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { hostOf, hostOrigin } from "@/lib/hosts";
import { mapAuthError, mapRpcError } from "@/lib/auth-errors";
import { fieldErrors, staffJoinSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";

async function markSeen() {
  const store = await cookies();
  store.set("zav_staff_seen", String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 60,
  });
}

export async function joinAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const consent = formData.get("consent") === "on";
  if (!consent) {
    return { fieldErrors: { consent: "Үйлчилгээний нөхцөлийг зөвшөөрнө үү" } };
  }

  const parsed = staffJoinSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  // The confirmation link lands on the host that started the signup, as a
  // token_hash link, so it works in any browser (no verifier cookie needed).
  const origin = hostOrigin(hostOf(await headers()));
  if (!origin) return { error: "Энэ хаягаар бүртгүүлэх боломжгүй байна." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        role: "customer",
        full_name: input.fullName,
        phone: input.phone,
      },
    },
  });
  if (error) return { error: mapAuthError(error.message) };

  if (!data.session) {
    return {
      notice: "И-мэйлээ баталгаажуулна уу. Холбоосыг дарсны дараа урилгын кодоо оруулна.",
    };
  }

  const { error: redeemError } = await supabase.rpc("redeem_staff_invite", {
    p_code: input.code,
  });
  if (redeemError) {
    await supabase.auth.signOut();
    return { error: mapRpcError(redeemError.message) };
  }

  await markSeen();
  redirect("/security");
}

export async function redeemAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { fieldErrors: { code: "Кодоо оруулна уу" } };

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: "Эхлээд нэвтэрнэ үү" };

  const { error } = await supabase.rpc("redeem_staff_invite", { p_code: code });
  if (error) return { error: mapRpcError(error.message) };

  await markSeen();
  redirect("/security");
}
