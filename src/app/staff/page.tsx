import { redirect } from "next/navigation";
import { getViewer, isStaffRole, roleHome } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StaffRootPage() {
  const { user, profile } = await getViewer();

  if (!user || !profile) redirect("/login");
  if (!isStaffRole(profile.role) || profile.status !== "active") redirect("/login");

  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  redirect(aal?.currentLevel === "aal2" ? roleHome(profile.role) : "/security");
}
