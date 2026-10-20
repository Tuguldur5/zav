import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageTitle, QueueGrid } from "@/components/staff";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobCard } from "./JobCard";
import { ClaimJobButton } from "./ClaimJobButton";
import type { Job } from "@/lib/types";

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
  const { supabase, user } = await requireRole(["admin", "super_admin"]);

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
      <PageTitle
        title="Зарууд"
        emoji="📋"
        subtitle={tab === "new" ? "Шинэ зарын пул — эхлээд авна уу" : `Нийт ${jobs.length} зар`}
        search={
          <nav aria-label="Зарын төлөв" className="staff-seg w-full sm:w-auto">
            {tabs.map((item) => (
              <Link
                key={item.id}
                href={`/jobs?tab=${item.id}`}
                aria-current={tab === item.id ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        }
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Энд зар байхгүй"
          body={tab === "new" ? "Шинэ зар ирмэгц энд харагдана." : "Энэ төлөвт зар байхгүй байна."}
        />
      ) : (
        <QueueGrid>
          {jobs.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              featured={tab === "new" && index === 0}
              districtName={districtMap.get(job.district_id)}
              skillName={skillMap.get(job.skill_id)}
            >
              {tab === "new" ? <ClaimJobButton jobId={job.id} /> : null}
            </JobCard>
          ))}
        </QueueGrid>
      )}
    </>
  );
}
