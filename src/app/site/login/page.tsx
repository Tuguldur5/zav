import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { loginAction } from "@/app/site/auth/actions";
import { AuthAside } from "@/components/auth/AuthAside";
import { getViewer, isStaffRole, roleHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; timeout?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await getViewer();
  if (user && profile && !isStaffRole(profile.role) && profile.status !== "suspended") {
    redirect(roleHome(profile.role));
  }

  return (
    <AuthShell
      title="Нэвтрэх"
      subtitle="И-мэйл, нууц үгээрээ нэвтэрнэ үү"
      footer={
        <span>
          Бүртгэл байхгүй юу?{" "}
          <Link href="/register" className="text-primary underline underline-offset-2">
            Бүртгүүлэх
          </Link>
        </span>
      }
      aside={
        <AuthAside
          steps={[
            {
              title: "И-мэйл, нууц үг",
              body: "Бүртгэлдээ ашигласан и-мэйлээрээ нэвтэрнэ үү.",
            },
            {
              title: "Нууц үгээ мартсан уу?",
              body: "«Нууц үг мартсан» товч дээр дарж шинэ нууц үг авна.",
            },
            {
              title: "Аюулгүй байдал",
              body: "Ажилтны бүртгэлд давхар баталгаажуулалт шаардлагатай.",
            },
          ]}
        />
      }
    >
      <LoginForm action={loginAction} next={params.next} timeout={params.timeout === "1"} />
    </AuthShell>
  );
}
