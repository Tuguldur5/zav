import { requireStaffBase } from "@/lib/auth";
import { StaffAuthFrame } from "@/components/staff/StaffAuthFrame";
import { SecurityClient } from "./SecurityClient";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const { supabase, profile } = await requireStaffBase();

  const [{ data: aal }, { data: factorData }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  const factors = (factorData?.totp ?? [])
    .filter((factor) => factor.status === "verified")
    .map((factor) => ({
      id: factor.id,
      name: factor.friendly_name ?? "Authenticator",
      createdAt: factor.created_at ?? "",
    }));

  return (
    <StaffAuthFrame
      title="Аюулгүй байдал"
      subtitle="Хоёр шатлалт баталгаажуулалтыг идэвхжүүлнэ үү."
      footer="Нууц үгээ мартвал супер админ шинэчилж өгнө."
    >
      <SecurityClient
        role={profile.role}
        factors={factors}
        currentLevel={aal?.currentLevel ?? "aal1"}
      />
    </StaffAuthFrame>
  );
}
