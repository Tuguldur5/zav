import { redirect } from "next/navigation";
import { ResetForm } from "@/components/auth/ResetForm";
import { StaffAuthFrame } from "@/components/staff/StaffAuthFrame";
import { getViewer } from "@/lib/auth";
import { hasRecoveryCookie } from "@/lib/recovery";

export const dynamic = "force-dynamic";

export default async function StaffResetPasswordPage() {
  const { user } = await getViewer();
  // A session alone is not enough: only a fresh recovery link opens this page.
  if (!user || !(await hasRecoveryCookie())) redirect("/forgot-password?error=link");

  return (
    <StaffAuthFrame title="Шинэ нууц үг" subtitle="Шинэ нууц үгээ хоёр удаа оруулна уу.">
      <ResetForm />
    </StaffAuthFrame>
  );
}
