import Link from "next/link";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader, StaffNote } from "@/components/staff";
import { Card } from "@/components/ui/Card";
import { ProfileForm, PasswordForm } from "./ProfileForms";

export const dynamic = "force-dynamic";

/**
 * Shared staff profile: only the signed-in user's own row (name, phone), never
 * role or status. The shell is chosen by the layout from the real role.
 */
export default async function StaffProfilePage() {
  const { supabase, user, profile } = await requireRole(["admin", "super_admin"]);

  const [{ data: aal }, { data: factorData }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  const factors = (factorData?.totp ?? []).filter((factor) => factor.status === "verified");
  const lastSignIn = user.last_sign_in_at
    ? new Intl.DateTimeFormat("mn-MN", {
        timeZone: "Asia/Ulaanbaatar",
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(user.last_sign_in_at))
    : "Хэзээ ч";

  const initials =
    profile.full_name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <>
      <PageHeader title="Профайл" subtitle="Зөвхөн таны өөрийн мэдээлэл" />

      <div className="flex flex-wrap items-center gap-3">
        <span className="st-avatar !size-12 !text-[16px]" aria-hidden>
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-[18px] font-semibold">{profile.full_name || "Нэргүй"}</p>
          <p className="text-[13px] text-[color:var(--st-muted)]">{user.email}</p>
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <UserRound aria-hidden className="size-5" />
          Хувийн мэдээлэл
        </h2>
        <ProfileForm fullName={profile.full_name} phone={profile.phone ?? ""} />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <KeyRound aria-hidden className="size-5" />
          Нууц үг солих
        </h2>
        <PasswordForm />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <ShieldCheck aria-hidden className="size-5" />
          Аюулгүй байдал
        </h2>
        <StaffNote>
          {factors.length > 0
            ? `Хоёр шатлалт баталгаажуулалт идэвхтэй (${factors.length} төхөөрөмж). Одоогийн түвшин: ${aal?.currentLevel ?? "aal1"}.`
            : "Хоёр шатлалт баталгаажуулалт идэвхгүй байна."}
        </StaffNote>
        <Link href="/security" className="st-btn w-fit" data-variant="outline">
          Аюулгүй байдлын тохиргоо
        </Link>
      </Card>

      <Card className="flex flex-col gap-1">
        <h2 className="text-[16px] font-semibold">Сүүлд нэвтэрсэн</h2>
        <p className="text-[14px] text-[color:var(--st-muted)]">{lastSignIn}</p>
      </Card>

      <p className="st-note">
        Нэр, утас нь зөвхөн таны профайл дээр өөрчлөгдөнө. Эрх, төлөвийг супер админ удирдана.
      </p>
    </>
  );
}
