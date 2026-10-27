import { StaffFrame } from "@/components/staff/StaffFrame";

export const dynamic = "force-dynamic";

/** Super-admin-only area: an admin gets 404 from requireRole. */
export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  return <StaffFrame roles={["super_admin"]}>{children}</StaffFrame>;
}
