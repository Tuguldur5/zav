import { StaffFrame } from "@/components/staff/StaffFrame";

export const dynamic = "force-dynamic";

/**
 * Shared staff pages (/profile, /notifications). The shell follows the signed-in
 * ROLE, so a super admin keeps the super header and tone here.
 */
export default async function SharedStaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffFrame roles={["admin", "super_admin"]}>{children}</StaffFrame>;
}
