import { redirect } from "next/navigation";
import { StaffAuthFrame } from "@/components/staff/StaffAuthFrame";
import { LoginForm } from "@/components/auth/LoginForm";
import { staffLoginAction } from "./actions";
import { getViewer, isStaffRole, roleHome } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; timeout?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await getViewer();

  if (user && profile && isStaffRole(profile.role) && profile.status === "active") {
    const supabase = await createClient();
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    redirect(aal?.currentLevel === "aal2" ? roleHome(profile.role) : "/security");
  }

  return (
    <StaffAuthFrame
      title="Ажилтны нэвтрэх"
      subtitle="Ажилтны бүртгэлээр нэвтэрнэ үү."
      steps={["Нэвтрэх", "Хамгаалалт"]}
      currentStep={0}
      footer="Хандах эрхгүй бол тусламжийн утсаар холбогдоно уу."
    >
      <LoginForm
        action={staffLoginAction}
        next={params.next}
        timeout={params.timeout === "1"}
        authError={params.error === "auth" || params.error === "host"}
        reset={params.reset === "1"}
        staff
      />
    </StaffAuthFrame>
  );
}
