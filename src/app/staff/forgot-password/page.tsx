import { ForgotForm } from "@/components/auth/ForgotForm";
import { StaffAuthFrame } from "@/components/staff/StaffAuthFrame";

export const dynamic = "force-dynamic";

export default async function StaffForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <StaffAuthFrame
      title="Нууц үг сэргээх"
      subtitle="Ажилтны бүртгэлд ашигладаг и-мэйлээ оруулна уу."
      footer="Холбоос зөвхөн admin домэйн дээр хүчинтэй."
    >
      <ForgotForm linkError={params.error === "link"} />
    </StaffAuthFrame>
  );
}
