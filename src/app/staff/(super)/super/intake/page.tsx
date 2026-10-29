import { requireRole } from "@/lib/auth";
import { PageHeader, StaffEmpty } from "@/components/staff";
import { IntakeClient } from "./IntakeClient";
import type { District, Profile, Skill } from "@/lib/types";

export const dynamic = "force-dynamic";

type IntakeWorker = {
  id: string;
  name: string;
  phone: string | null;
  districtName: string;
  skillNames: string[];
  suggestedAdminId: string | null;
  suggestedAdminName: string | null;
};

type AdminOption = { id: string; full_name: string; load: number };

export default async function IntakePage() {
  const { supabase } = await requireRole(["super_admin"]);

  const [detailsResult, loadsResult, skillResult, districtResult] = await Promise.all([
    supabase.from("worker_details").select("*").eq("intake_status", "new"),
    supabase.rpc("admin_loads"),
    supabase.from("skills").select("*"),
    supabase.from("districts").select("*"),
  ]);

  const details = (detailsResult.data as Array<{ worker_id: string }> | null) ?? [];
  const loads = (loadsResult.data as AdminOption[] | null) ?? [];
  const admins: AdminOption[] = loads.map((row) => ({
    id: row.id,
    full_name: row.full_name,
    load: row.load,
  }));
  const adminNameById = new Map(loads.map((row) => [row.id, row.full_name]));
  const skills = (skillResult.data as Skill[] | null) ?? [];
  const districts = (districtResult.data as District[] | null) ?? [];
  const districtById = new Map(districts.map((row) => [row.id, row.name]));
  const skillById = new Map(skills.map((row) => [row.id, row.name]));

  const ids = details.map((row) => row.worker_id);
  let profiles: Profile[] = [];
  let workerSkills: Array<{ worker_id: string; skill_id: string }> = [];
  if (ids.length > 0) {
    const [profilesResult, skillsResult] = await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase.from("worker_skills").select("*").in("worker_id", ids),
    ]);
    profiles = (profilesResult.data as Profile[] | null) ?? [];
    workerSkills =
      (skillsResult.data as Array<{ worker_id: string; skill_id: string }> | null) ?? [];
  }
  const profileMap = new Map(profiles.map((row) => [row.id, row]));

  const rows: IntakeWorker[] = [];
  for (const detail of details) {
    const profile = profileMap.get(detail.worker_id);
    if (!profile) continue;
    let suggestedAdminId: string | null = null;
    try {
      const { data } = await supabase.rpc("suggest_admin", { p_worker: profile.id });
      suggestedAdminId = (data as string | null) ?? null;
    } catch {
      suggestedAdminId = null;
    }
    rows.push({
      id: profile.id,
      name: profile.full_name,
      phone: profile.phone,
      districtName: districtById.get(profile.district_id ?? "") ?? "—",
      skillNames: workerSkills
        .filter((row) => row.worker_id === profile.id)
        .map((row) => skillById.get(row.skill_id) ?? "")
        .filter(Boolean),
      suggestedAdminId,
      suggestedAdminName: suggestedAdminId ? (adminNameById.get(suggestedAdminId) ?? null) : null,
    });
  }

  return (
    <>
      <PageHeader
        subtitle={`Хуваарилаагүй ${rows.length}. Санал нь хамгийн бага ачаалалтай, хүрээ таарсан админ байна.`}
      />

      {rows.length === 0 ? (
        <StaffEmpty
          title="Хуваарилаагүй шинэ ажилтан байхгүй"
          body="Шинэ ажилтан бүртгүүлмэгц энд харагдана."
        />
      ) : (
        <IntakeClient rows={rows} admins={admins} />
      )}
    </>
  );
}
