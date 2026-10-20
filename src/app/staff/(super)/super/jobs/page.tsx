import Link from "next/link";
import { Briefcase, Inbox } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageTitle, QueueGrid } from "@/components/staff";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobCard } from "@/app/staff/(admin)/jobs/JobCard";
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

  const [directoryResult, districtResult, skillResult] = await Promise.all([
    supabase.rpc("staff_directory"),
    supabase.from("districts").select("id, name"),
    supabase.from("skills").select("id, name"),
  ]);
  const admins = (
    (directoryResult.data as Array<{
      id: string;
      full_name: string;
      role: string;
      status: string;
    }> | null) ?? []
  )
    .filter((row) => row.role === "admin" && row.status === "active")
    .map((row) => ({ id: row.id, full_name: row.full_name }));
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
      <PageTitle
        title="Бүх зарууд"
        emoji="📋"
        subtitle={tab === "active" ? `Идэвхтэй ${jobs.length} зар` : `Авагдаагүй ${jobs.length} зар`}
        search={
          <nav aria-label="Зарын төрөл" className="staff-seg w-full sm:w-auto">
            {tabs.map((item) => (
              <Link
                key={item.id}
                href={`/super/jobs?tab=${item.id}`}
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
          icon={tab === "active" ? Briefcase : Inbox}
          title={tab === "active" ? "Идэвхтэй зар байхгүй" : "Авагдаагүй зар байхгүй"}
          body="Энэ төрөлд одоогоор зар байхгүй."
        />
      ) : (
        <QueueGrid>
          {jobs.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              featured={tab === "unclaimed" && index === 0}
              districtName={districtMap.get(job.district_id)}
              skillName={skillMap.get(job.skill_id)}
            >
              <JobControls jobId={job.id} admins={admins} status={job.status} />
            </JobCard>
          ))}
        </QueueGrid>
      )}
    </>
  );
}
