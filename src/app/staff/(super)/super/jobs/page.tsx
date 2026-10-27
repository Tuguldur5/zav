import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader, PageTabs, StaffEmpty } from "@/components/staff";
import { DataTable } from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatusPill";
import { jobStatus, slotLabels } from "@/lib/status";
import { formatDateMn } from "@/lib/dates";
import type { Job } from "@/lib/types";
import { JobControls } from "./JobControls";

export const dynamic = "force-dynamic";

const tabs = [
  { id: "active", label: "Идэвхтэй" },
  { id: "unclaimed", label: "Авагдаагүй" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default async function SuperJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab: TabId = tabs.some((item) => item.id === params.tab) ? (params.tab as TabId) : "active";
  const { supabase } = await requireRole(["super_admin"]);

  const [loadsResult, districtResult, skillResult] = await Promise.all([
    supabase.rpc("admin_loads"),
    supabase.from("districts").select("id, name"),
    supabase.from("skills").select("id, name"),
  ]);
  const admins = (
    (loadsResult.data as Array<{ id: string; full_name: string }> | null) ?? []
  ).map((row) => ({ id: row.id, full_name: row.full_name }));
  const districtMap = new Map(
    ((districtResult.data as Array<{ id: string; name: string }> | null) ?? []).map((row) => [
      row.id,
      row.name,
    ]),
  );
  const skillMap = new Map(
    ((skillResult.data as Array<{ id: string; name: string }> | null) ?? []).map((row) => [
      row.id,
      row.name,
    ]),
  );

  let query = supabase.from("jobs").select("*");
  if (tab === "active") query = query.in("status", ["claimed", "matched", "confirmed"]);
  else query = query.eq("status", "new");
  const { data } = await query.order("created_at", { ascending: false }).limit(100);
  const jobs = (data as Job[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Зарууд"
        subtitle={tab === "active" ? `Идэвхтэй ${jobs.length} зар` : `Авагдаагүй ${jobs.length} зар`}
      />

      <PageTabs
        label="Зарын төрөл"
        active={`/super/jobs?tab=${tab}`}
        tabs={tabs.map((item) => ({ href: `/super/jobs?tab=${item.id}`, label: item.label }))}
      />

      <DataTable
        caption="Зарууд"
        columns={[
          { key: "title", header: "Зар", primary: true },
          { key: "district", header: "Дүүрэг" },
          { key: "skill", header: "Мэргэжил", secondary: true },
          { key: "date", header: "Огноо" },
          { key: "status", header: "Төлөв" },
          { key: "admin", header: "Админ" },
        ]}
        rows={jobs.map((job) => ({
          id: job.id,
          cells: [
            job.title,
            districtMap.get(job.district_id) ?? "—",
            skillMap.get(job.skill_id) ?? "—",
            `${formatDateMn(job.job_date, false)} · ${slotLabels[job.job_slot] ?? ""}`,
            <StatusPill key="status" status={job.status} table={jobStatus} />,
            <JobControls key="controls" jobId={job.id} admins={admins} status={job.status} />,
          ],
        }))}
        empty={
          <StaffEmpty
            title={tab === "active" ? "Идэвхтэй зар байхгүй" : "Авагдаагүй зар байхгүй"}
            body="Энэ төрөлд одоогоор зар байхгүй."
            action={
              <Link href="/super" className="st-btn" data-variant="outline">
                Самбар
              </Link>
            }
          />
        }
      />
    </>
  );
}
