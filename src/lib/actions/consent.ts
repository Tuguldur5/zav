"use server";

import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { loadProfile, roleHome } from "@/lib/auth";
import { TERMS_VERSION } from "@/lib/consent";

export type ConsentState = { error?: string; fieldErrors?: Record<string, string> };

/**
 * The /consent gate. Staff never see it; customers and workers record the same
 * kinds as at signup. The `terms` row always carries the current version.
 */
export async function acceptConsentsAction(
  _prev: ConsentState,
  formData: FormData,
): Promise<ConsentState> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await loadProfile(user.id);
  if (!profile) redirect("/login");
  if (profile.role === "admin" || profile.role === "super_admin") redirect(roleHome(profile.role));

  const isWorker = profile.role === "worker";
  const errors: Record<string, string> = {};
  if (formData.get("declaration") !== "on") {
    errors.declaration = "Баталгаажуулалтыг тэмдэглэнэ үү";
  }
  if (formData.get("consent") !== "on") {
    errors.consent = "Үйлчилгээний нөхцөлийг зөвшөөрнө үү";
  }
  if (isWorker && formData.get("phoneCheck") !== "on") {
    errors.phoneCheck = "Утсаар шалгахыг зөвшөөрнө үү";
  }
  if (Object.keys(errors).length > 0) return { fieldErrors: errors };

  const kinds = isWorker
    ? ["terms", "privacy", "worker_declaration", "phone_check"]
    : ["terms", "privacy", "customer_declaration"];

  const { error } = await supabase.rpc("accept_consents", {
    p_kinds: kinds,
    p_version: TERMS_VERSION,
  });
  if (error) {
    return { error: "Хадгалах боломжгүй. Дахин оролдоно уу." };
  }

  redirect(roleHome(profile.role));
}
