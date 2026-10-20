import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Briefcase, ClipboardList, UserPlus, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  PageTitle,
  PanelSection,
  QueueCard,
  QueueGrid,
  RoundAction,
  SearchPill,
  StatRow,
  StatTile,
} from "@/components/staff";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeHourLabel } from "@/lib/dates";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

type Stats = {
  pool_new: number;
  unclaimed_24h: number;
  unassigned_workers: number;
  workers_pending: number;
  workers_active: number;
  workers_suspended: number;
  admins_load: Array<{ id: string; name: string; status: string; load: number }>;
};

export default async function SuperDashboardPage() {
  const { supabase } = await requireRole(["super_admin"]);
  const { data: statsData } = await supabase.rpc("stats");
  const stats = (statsData ?? {}) as Stats;

  const staleJobs = (
    await supabase
      .from("jobs")
      .select("id, title, job_date, created_at, workers_needed, pay_offer")
      .eq("status", "new")
      .order("created_at", { ascending: true })
      .limit(10)
  ).data as Job[] | null;

  const loads = stats.admins_load ?? [];
  const maxLoad = Math.max(1, ...loads.map((row) => row.load));
  const averageLoad = loads.length
    ? Math.round((loads.reduce((sum, row) => sum + row.load, 0) / loads.length) * 10) / 10
    : 0;

  return (
    <>
      <PageTitle
        title="Хянах самбар"
        emoji="🛰️"
        subtitle="Шинэ ажилтан, ачаалал, авагдаагүй зар — нэг дороос"
        search={<SearchPill placeholder="Админ, зар, ажилтан хайх" />}
        actions={
          <Link
            href="/super/intake"
            className="press flex min-h-[var(--control-h)] items-center rounded-[10px] bg-primary px-4 text-[0.9em] font-medium text-on-primary"
          >
            Хуваарилах
          </Link>
        }
      />

      <StatRow>
        <StatTile
          label="Шинэ ажилчид"
          value={stats.unassigned_workers ?? 0}
          href="/super/intake"
          icon={UserPlus}
        />
        <StatTile
          label="Админы дундаж ачаалал"
          value={averageLoad}
          href="/super/admins"
          icon={ClipboardList}
        />
        <StatTile
          label="Хуваарилагдаагүй зар"
          value={stats.pool_new ?? 0}
          href="/super/jobs?tab=unclaimed"
          icon={Briefcase}
        />
        <StatTile
          attention={(stats.unclaimed_24h ?? 0) > 0}
          label="24 цагаас дээш авагдаагүй зар"
          value={stats.unclaimed_24h ?? 0}
          href="/super/jobs?tab=unclaimed"
          icon={AlertTriangle}
        />
      </StatRow>

      <PanelSection
        title="Админуудын ачаалал"
        count={loads.length}
        href="/super/admins"
        hrefLabel="Админууд"
      >
        <Card className="flex flex-col gap-3">
          {loads.length === 0 ? (
            <p className="text-[0.9em] text-muted">
              Админ байхгүй байна. Урилга үүсгэнэ үү.
            </p>
          ) : (
            loads.map((row) => (
              <div key={row.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[0.9em]">
                  <span className="font-medium">{row.name || "Админ"}</span>
                  <span className="text-muted">{row.load} ажилтан</span>
                </div>
                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-tint-1"
                  role="img"
                  aria-label={`${row.name} ${row.load}`}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(4, Math.round((row.load / maxLoad) * 100))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </Card>
      </PanelSection>

      <PanelSection title="Анхаарах зүйлс">
        <QueueGrid>
          <QueueCard
            featured
            title="Шинэ ажилтан хуваарилагдаагүй"
            href="/super/intake"
            description="Анхны бүртгэлтэй ажилтнуудыг админд хуваарилна уу."
            icon={UserPlus}
            actions={<RoundAction href="/super/intake" label="Нээх" icon={ArrowUpRight} confirm />}
          />
          <QueueCard
            title="Удаан авагдаагүй зарууд"
            href="/super/jobs?tab=unclaimed"
            description={`${stats.unclaimed_24h ?? 0} зар 24 цагаас удаан байна.`}
            icon={AlertTriangle}
            actions={
              <RoundAction
                href="/super/jobs?tab=unclaimed"
                label="Нээх"
                icon={ArrowUpRight}
                confirm
              />
            }
          />
          <QueueCard
            title="Шинэ ажилтан бүртгэл"
            href="/super/intake"
            description={`${stats.unassigned_workers ?? 0} ажилтан хуваариалаагүй.`}
            icon={Users}
            actions={<RoundAction href="/super/intake" label="Нээх" icon={ArrowUpRight} />}
          />
        </QueueGrid>
      </PanelSection>

      <PanelSection
        title="Удаан авагдсан шинэ зарууд"
        count={(staleJobs ?? []).length}
        href="/super/jobs?tab=unclaimed"
        hrefLabel="Бүгд"
      >
        {(staleJobs ?? []).length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Удаан авагдаагүй зар байхгүй"
            body="Бүх зарыг админууд цаг алдалгүй авч байна."
          />
        ) : (
          <QueueGrid>
            {(staleJobs ?? []).map((job) => (
              <QueueCard
                key={job.id}
                title={job.title}
                href={`/jobs/${job.id}`}
                description={`Илгээсэн ${relativeHourLabel(job.created_at)}`}
                icon={Briefcase}
                meta={
                  <span>
                    {job.workers_needed} ажилтан · {job.job_date}
                  </span>
                }
                actions={<RoundAction href={`/jobs/${job.id}`} label="Нээх" icon={ArrowUpRight} />}
              />
            ))}
          </QueueGrid>
        )}
      </PanelSection>
    </>
  );
}
