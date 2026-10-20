import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffAuthFrame } from "@/components/staff/StaffAuthFrame";
import { getViewer, isStaffRole, roleHome } from "@/lib/auth";
import { JoinForm, RedeemForm } from "./JoinForms";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = params.code ?? "";
  const { user, profile } = await getViewer();

  if (user && profile && isStaffRole(profile.role) && profile.status === "active") {
    redirect(roleHome(profile.role));
  }

  if (user && profile && profile.role === "worker") {
    return (
      <StaffAuthFrame title="Урилга" subtitle="Ажил хийгчийн бүртгэлээр админ болох боломжгүй.">
        <Link href="/login" className="text-primary underline underline-offset-2">
          Нэвтрэх хуудас
        </Link>
      </StaffAuthFrame>
    );
  }

  return (
    <StaffAuthFrame
      title="Ажилтны урилга"
      subtitle="Урилгын кодоор бүртгүүлж, админ эрхээ идэвхжүүлнэ үү."
      steps={["Урилга", "Бүртгэл"]}
      currentStep={user ? 1 : 0}
      footer="Код 48 цагийн дотор хүчинтэй."
    >
      {user && profile ? <RedeemForm code={code} /> : <JoinForm code={code} />}
    </StaffAuthFrame>
  );
}
