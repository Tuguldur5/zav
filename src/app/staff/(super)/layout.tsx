import { StaffFrame } from "@/components/staff/StaffFrame";

export const dynamic = "force-dynamic";

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  return <StaffFrame roles={["super_admin"]}>{children}</StaffFrame>;
}
