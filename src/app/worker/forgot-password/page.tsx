import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotForm } from "@/components/auth/ForgotForm";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthLayout
      title="Нууц үг сэргээх"
      lead="Бүртгэлдээ ашигласан и-мэйлээ оруулна уу. Сэргээх холбоос илгээнэ."
    >
      <ForgotForm linkError={params.error === "link"} />
    </AuthLayout>
  );
}
