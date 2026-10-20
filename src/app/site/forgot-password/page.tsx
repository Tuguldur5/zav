import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Нууц үг сэргээх"
      subtitle="Бүртгэлтэй и-мэйлээ оруулахад сэргээх холбоос илгээнэ."
    >
      <ForgotForm />
    </AuthShell>
  );
}
