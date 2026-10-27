import { redirect } from "next/navigation";
import { StaffFrame } from "@/components/staff/StaffFrame";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Admin-only area. A super admin who opens one of these paths is sent to
 * /super, so the admin shell is never rendered for a super admin.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole(["admin", "super_admin"]);
  if (profile.role === "super_admin") redirect("/super");
  return <StaffFrame roles={["admin"]}>{children}</StaffFrame>;
}
