import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetForm } from "@/components/auth/ResetForm";
import { getViewer } from "@/lib/auth";
import { hasRecoveryCookie } from "@/lib/recovery";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const { user } = await getViewer();
  // A session alone is not enough: only a fresh recovery link opens this page.
  if (!user || !(await hasRecoveryCookie())) redirect("/forgot-password?error=link");
  return (
    <AuthLayout title="Шинэ нууц үг" lead="Шинэ нууц үгээ хоёр удаа оруулна уу.">
      <ResetForm />
    </AuthLayout>
  );
}
