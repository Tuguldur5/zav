import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "./ResetForm";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const { user } = await getViewer();

  return (
    <AuthShell title="Шинэ нууц үг" subtitle="Доор шинэ нууц үгээ оруулна уу.">
      {user ? (
        <ResetForm />
      ) : (
        <div className="flex flex-col gap-3 text-center">
          <p className="rounded-md bg-warm px-3 py-3 text-[0.9em] text-warm-ink">
            Холбоосын хугацаа дууссан эсвэл буруу байна. Нууц үг сэргээх хүсэлтийг дахин гаргана уу.
          </p>
          <Link href="/forgot-password" className="text-primary underline underline-offset-2">
            Дахин хүсэлт гаргах
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
