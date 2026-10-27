import { Mail, ShieldCheck, UserCog, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  LoadBar,
  PageHeader,
  Row,
  Rows,
  Section,
  StatTile,
  StatTiles,
} from "@/components/staff";
import { StatusPill } from "@/components/ui/StatusPill";
import { ReauthAction } from "@/components/app/ReauthAction";
import { setStaffStatusAction } from "@/lib/actions/super";
import { getAdminCapacity } from "@/lib/settings";
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

type AdminLoad = { id: string; full_name: string; worker_count: number; last_login: string | null };

export default async function SuperAdminsPage() {
  const { supabase, profile } = await requireRole(["super_admin"]);

  const [directoryResult, loadsResult, skillsResult, districtsResult, scopesResult, capacity] =
    await Promise.all([
      supabase.rpc("staff_directory"),
      supabase.rpc("admin_loads"),
      supabase.from("skills").select("*").order("sort_order"),
      supabase.from("districts").select("*").order("name"),
      supabase.from("admin_scopes").select("*"),
      getAdminCapacity(),
    ]);

  const staff = (directoryResult.data as StaffRow[] | null) ?? [];
  const loads = (loadsResult.data as AdminLoad[] | null) ?? [];
  const loadById = new Map(loads.map((row) => [row.id, row.worker_count]));
  const admins = loads.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    load: row.worker_count,
  }));
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

  const totalLoad = loads.reduce((sum, row) => sum + row.worker_count, 0);

  return (
    <>
      <PageHeader
        title="Админууд"
        subtitle={`Идэвхтэй ${loads.length} админ · нийт ${staff.length} ажилтан`}
      />

      <StatTiles>
        <StatTile label="Ажилтнууд" value={staff.length} icon={ShieldCheck} />
        <StatTile label="Идэвхтэй админ" value={loads.length} icon={UserCog} />
        <StatTile label="Нийт ачаалал" value={totalLoad} icon={Users} />
        <StatTile
          label="Түр хаагдсан / хүлээгдэж буй"
          value={staff.length - loads.length}
          attention={staff.length - loads.length > 0}
          icon={Mail}
        />
      </StatTiles>

      <InviteSection />
      <TransferWorkers admins={admins} />

      <Section title="Бүх ажилтнууд" count={staff.length}>
        {staff.length === 0 ? (
          <p className="st-note">Ажилтан байхгүй. Урилгын код үүсгэнэ үү.</p>
        ) : (
          <Rows label="Ажилтнууд">
            {staff.map((row) => {
              const isSelf = row.id === profile.id;
              const own = scopesFor(row.id);
              const load = loadById.get(row.id) ?? row.load;
              return (
                <Row
                  key={row.id}
                  title={row.full_name || "Нэргүй"}
                  pill={<StatusPill status={row.status} table={profileStatus} />}
                  meta={
                    <>
                      <span className="inline-flex items-center gap-1">
                        <Mail aria-hidden className="size-3.5" />
                        {row.email ?? "—"}
                      </span>
                      <span>{row.phone ?? "Утасгүй"}</span>
                      <span>{row.role === "super_admin" ? "Супер админ" : "Админ"}</span>
                      <span>Сүүлд: {row.last_sign_in_at ? formatDateTimeMn(row.last_sign_in_at) : "хэзээ ч"}</span>
                    </>
                  }
                >
                  {row.role === "admin" ? (
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] text-[color:var(--st-muted)]">
                        {load} ажилтан
                      </span>
                      <span className="w-40">
                        <LoadBar value={load} capacity={capacity} />
                      </span>
                    </span>
                  ) : null}
                  <span className="mt-2 flex flex-wrap gap-2">
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
                      <span className="flex min-h-10 items-center text-[13px] text-[color:var(--st-muted)]">
                        Өөрийн эрхийг өөрчлөх боломжгүй
                      </span>
                    ) : (
                      <ReauthAction
                        label={row.status === "active" ? "Эрхийг түр хаах" : "Эрхийг сэргээх"}
                        variant={row.status === "active" ? "outline" : "filled"}
                        icon={<UserCog aria-hidden className="size-4" />}
                        action={() =>
                          setStaffStatusAction(
                            row.id,
                            row.status === "active" ? "suspended" : "active",
                          )
                        }
                      />
                    )}
                  </span>
                </Row>
              );
            })}
          </Rows>
        )}
      </Section>
    </>
  );
}
