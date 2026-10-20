"use server";

import { requireStaffBase } from "@/lib/auth";

export async function removeFactorAction(
  factorId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireStaffBase();

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return { ok: false, error: "Эхлээд хоёр шатлалт баталгаажуулалтаа хийнэ үү" };
  }

  const { data } = await supabase.auth.mfa.listFactors();
  const verified = (data?.totp ?? []).filter((factor) => factor.status === "verified");
  if (verified.length <= 1) {
    return { ok: false, error: "Ганц төхөөрөмжийг устгах боломжгүй" };
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { ok: false, error: "Төхөөрөмжийг устгах боломжгүй" };
  return { ok: true };
}
