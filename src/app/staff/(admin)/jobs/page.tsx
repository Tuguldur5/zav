import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader, PageTabs, StaffEmpty } from "@/components/staff";
import { DataTable } from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatusPill";
import { jobStatus, slotLabels } from "@/lib/status";
import { formatDateMn } from "@/lib/dates";
import type { Job } from "@/lib/types";
import { ClaimJobButton } from "./ClaimJobButton";

export const dynamic = "force-dynamic";

const tabs = [
  { id: "new", label: "Шинэ" },
  { id: "mine", label: "Миний" },
  { id: "matched", label: "Холбогдсон" },
  { id: "done", label: "Дууссан" },
] as const;

type TabId = (typeof tabs)[number]["id"];

type PoolJob = Pick<
  Job,
  | "id"
  | "title"
  | "status"
  | "job_date"
  | "job_slot"
  | "workers_needed"
  | "pay_offer"
  | "skill_id"
  | "district_id"
>;

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab: TabId = tabs.some((item) => item.id === params.tab) ? (params.tab as TabId) : "new";
  const { supabase, user } = await requireRole(["admin"]);

  const [districtResult, skillResult] = await Promise.all([
    supabase.from("districts").select("id, name"),
    supabase.from("skills").select("id, name"),
  ]);
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

  let jobs: PoolJob[] = [];
  if (tab === "new") {
    const { data } = await supabase.rpc("pool_jobs");
    jobs = (data as PoolJob[] | null) ?? [];
  } else {
    let query = supabase.from("jobs").select("*").eq("claimed_by", user.id);
    if (tab === "mine") query = query.in("status", ["claimed", "matched"]);
    if (tab === "matched") query = query.in("status", ["matched", "confirmed"]);
    if (tab === "done") query = query.in("status", ["done", "cancelled"]);
    const { data } = await query.order("job_date", { ascending: true });
    jobs = (data as PoolJob[] | null) ?? [];
  }

  return (
    <>
      <PageHeader
        title="Зарууд"
        subtitle={tab === "new" ? "Шинэ зарын пул — эхлээд авна уу" : `Нийт ${jobs.length} зар`}
      />

      <PageTabs
        label="Зарын төлөв"
        active={`/jobs?tab=${tab}`}
        tabs={tabs.map((item) => ({ href: `/jobs?tab=${item.id}`, label: item.label }))}
      />

      <DataTable
        caption="Зарууд"
        columns={[
          { key: "title", header: "Зар", primary: true },
          { key: "skill", header: "Мэргэжил", secondary: true },
          { key: "district", header: "Дүүрэг" },
          { key: "date", header: "Огноо" },
          { key: "status", header: "Төлөв" },
          { key: "action", header: "Үйлдэл", align: "right" },
        ]}
        rows={jobs.map((job) => ({
          id: job.id,
          href: `/jobs/${job.id}`,
          cells: [
            job.title,
            skillMap.get(job.skill_id) ?? "—",
            districtMap.get(job.district_id) ?? "—",
            `${formatDateMn(job.job_date, false)} · ${slotLabels[job.job_slot] ?? ""}`,
            <StatusPill key="status" status={job.status} table={jobStatus} />,
            tab === "new" ? (
              <ClaimJobButton key="claim" jobId={job.id} />
            ) : (
              <Link key="open" href={`/jobs/${job.id}`} className="st-btn" data-variant="ghost">
                Нээх
              </Link>
            ),
          ],
        }))}
        empty={
          <StaffEmpty
            title="Энд зар байхгүй"
            body={
              tab === "new"
                ? "Шинэ зар ирмэгц энд харагдана."
                : "Энэ төлөвт зар байхгүй байна."
            }
            action={
              tab === "new" ? (
                <Link href="/today" className="st-btn" data-variant="outline">
                  <Inbox aria-hidden className="size-4" />
                  Өнөөдөр
                </Link>
              ) : undefined
            }
          />
        }
      />

      <p className="st-note">
        Дэлгэц дээр хүснэгт, утас дээр карт харагдана. Зар нээхэд дэлгэрэнгүй тусдаа хуудсандаа
        гарна.
      </p>
    </>
  );
}
