import { Mail, ShieldCheck, UserCog, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageTitle, PanelSection, StatRow, StatTile } from "@/components/staff";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { StatusPill } from "@/components/ui/StatusPill";
import { ReauthAction } from "@/components/app/ReauthAction";
import { setStaffStatusAction } from "@/lib/actions/super";
import { formatDateTimeMn } from "@/lib/dates";
import { profileStatus } from "@/lib/status";
import type { District, Skill } from "@/lib/types";
import { InviteSection } from "./InviteSection";
import { ScopesEditor } from "./ScopesEditor";
import { TransferWorkers } from "./TransferWorkers";

export const dynamic = "force-dynamic";

type StaffRow = {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
  last_sign_in_at: string | null;
  load: number;
};

export default async function SuperAdminsPage() {
  const { supabase, profile } = await requireRole(["super_admin"]);

  const [directoryResult, skillsResult, districtsResult, scopesResult] = await Promise.all([
    supabase.rpc("staff_directory"),
    supabase.from("skills").select("*").order("sort_order"),
    supabase.from("districts").select("*").order("name"),
    supabase.from("admin_scopes").select("*"),
  ]);

  const staff = (directoryResult.data as StaffRow[] | null) ?? [];
  const admins = staff
    .filter((row) => row.role === "admin" && row.status === "active")
    .map((row) => ({ id: row.id, full_name: row.full_name, load: row.load }));
  const skills = (skillsResult.data as Skill[] | null) ?? [];
  const districts = (districtsResult.data as District[] | null) ?? [];
  const scopes =
    (scopesResult.data as Array<{
      admin_id: string;
      skill_id: string | null;
      district_id: string | null;
    }> | null) ?? [];

  const scopesFor = (adminId: string) => {
    const rows = scopes.filter((row) => row.admin_id === adminId);
    return {
      skillIds: rows.filter((row) => row.skill_id).map((row) => row.skill_id as string),
      districtIds: rows.filter((row) => row.district_id).map((row) => row.district_id as string),
    };
  };

  const activeAdmins = admins.length;
  const totalLoad = admins.reduce((sum, row) => sum + row.load, 0);

  return (
    <>
      <PageTitle
        title="Админууд"
        emoji="🛡️"
        subtitle={`Нийт ${staff.length} ажилтан, идэвхтэй ${activeAdmins} админ`}
      />

      <StatRow>
        <StatTile featured label="Ажилтнууд" value={staff.length} icon={ShieldCheck} />
        <StatTile label="Идэвхтэй админ" value={activeAdmins} icon={UserCog} />
        <StatTile label="Нийт ачаалал" value={totalLoad} icon={Users} />
        <StatTile
          attention={staff.length - activeAdmins > 0}
          label="Түр хаагдсан / хүлээгдэж буй"
          value={staff.length - activeAdmins}
          href="/super/intake"
          icon={Mail}
        />
      </StatRow>

      <InviteSection />
      <TransferWorkers admins={admins} />

      <PanelSection title="Бүх ажилтнууд" count={staff.length} href="/super" hrefLabel="Самбар">
        {staff.length === 0 ? (
          <Card className="text-[0.9em] text-muted">
            Ажилтан байхгүй. Дээрээс урилгын код үүсгэнэ үү.
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
              {staff.map((row) => {
                const isSelf = row.id === profile.id;
                const own = scopesFor(row.id);
                return (
                  <li key={row.id}>
                    <Card className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[1.05em] font-semibold">{row.full_name || "Нэргүй"}</p>
                          <p className="flex items-center gap-1 break-all text-[0.9em] text-muted">
                            <Mail aria-hidden className="size-4" />
                            {row.email}
                          </p>
                          <p className="text-[0.9em] text-muted">{row.phone ?? "Утасгүй"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Chip tone={row.role === "super_admin" ? "warm" : "primary"}>
                            {row.role === "super_admin" ? "Супер админ" : "Админ"}
                          </Chip>
                          <StatusPill status={row.status} table={profileStatus} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[0.9em] sm:grid-cols-3">
                        <p className="text-muted">
                          Ачаалал:{" "}
                          <span className="font-semibold text-ink">{row.load} ажилтан</span>
                        </p>
                        <p className="text-muted">
                          Эхэлсэн:{" "}
                          <span className="text-ink">{formatDateTimeMn(row.created_at)}</span>
                        </p>
                        <p className="text-muted">
                          Сүүлд нэвтэрсэн:{" "}
                          <span className="text-ink">
                            {row.last_sign_in_at
                              ? formatDateTimeMn(row.last_sign_in_at)
                              : "хэзээ ч"}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <ScopesEditor
                          adminId={row.id}
                          skills={skills.map((skill) => ({ id: skill.id, name: skill.name }))}
                          districts={districts.map((district) => ({
                            id: district.id,
                            name: district.name,
                          }))}
                          initialSkillIds={own.skillIds}
                          initialDistrictIds={own.districtIds}
                        />
                        {isSelf ? (
                          <span className="flex min-h-11 items-center rounded-md bg-container px-3 text-[0.9em] text-muted">
                            Өөрийн эрхийг өөрчлөх боломжгүй
                          </span>
                        ) : (
                          <ReauthAction
                            label={row.status === "active" ? "Эрхийг түр хаах" : "Эрхийг сэргээх"}
                            variant={row.status === "active" ? "outline" : "filled"}
                            icon={<UserCog aria-hidden className="size-5" />}
                            action={() =>
                              setStaffStatusAction(
                                row.id,
                                row.status === "active" ? "suspended" : "active",
                              )
                            }
                          />
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
        )}
      </PanelSection>
    </>
  );
}
