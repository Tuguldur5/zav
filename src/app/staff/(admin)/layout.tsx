import { StaffFrame } from "@/components/staff/StaffFrame";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StaffFrame roles={["admin", "super_admin"]}>{children}</StaffFrame>;
}
