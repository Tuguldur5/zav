import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer, PageHeader, Grid } from "@/components/ui/Layout";
import { Tabs } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyJobs } from "@/components/art/EmptyArts";
import { buttonClass } from "@/components/ui/styles";
import { jobStatus, slotLabels } from "@/lib/status";
import { formatMoney, formatShortDateMn } from "@/lib/dates";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

const filters = [
  { id: "active", label: "Идэвхтэй" },
  { id: "done", label: "Дууссан" },
  { id: "cancelled", label: "Цуцлагдсан" },
  { id: "all", label: "Бүгд" },
];

export default async function CustomerJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase, user } = await requireRole(["customer"]);
  const params = await searchParams;
  const filter = filters.some((item) => item.id === params.status) ? params.status! : "active";

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const all = (data as Job[] | null) ?? [];
  const jobs = all.filter((job) => {
    if (filter === "all") return true;
    if (filter === "active") return !["done", "cancelled"].includes(job.status);
    return job.status === filter;
  });

  return (
    <>
      <TopAppBar title="Миний зарууд" subtitle={`Нийт ${all.length} зар`} />
      <PageContainer>
        <PageHeader
          title="Миний зарууд"
          description="Эндхийн заруудыг админ хүлээж аваад ажилтан хайж эхэлнэ."
          actions={
            <Link href="/c/new" className={buttonClass("filled")}>
              <Plus aria-hidden className="size-4" />
              Зар үүсгэх
            </Link>
          }
        />

        <Tabs
          items={filters.map((item) => ({
            href: `/c/jobs?status=${item.id}`,
            label: item.label,
            active: item.id === filter,
            count:
              item.id === "all"
                ? all.length
                : all.filter((job) =>
                    item.id === "active"
                      ? !["done", "cancelled"].includes(job.status)
                      : job.status === item.id,
                  ).length,
          }))}
        />

        {jobs.length === 0 ? (
          <EmptyState
            art={<EmptyJobs className="h-auto w-full" />}
            title="Энд зар байхгүй байна"
            body="Шинэ ажил зарлаад тохирох ажилтнаа олоорой."
            action={
              <Link href="/c/new" className={buttonClass("filled")}>
                Зар үүсгэх
              </Link>
            }
          />
        ) : (
          <Grid columns={3}>
            {jobs.map((job) => (
              <Link key={job.id} href={`/c/jobs/${job.id}`} className="block">
                <Card className="press flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{job.title}</p>
                    <StatusPill status={job.status} table={jobStatus} />
                  </div>
                  <p className="flex items-center gap-2 text-[0.9em] text-muted">
                    <CalendarDays aria-hidden className="size-4" />
                    {formatShortDateMn(job.job_date)} · {slotLabels[job.job_slot]}
                  </p>
                  <p className="text-[0.9em] text-muted">{formatMoney(job.pay_offer)}</p>
                </Card>
              </Link>
            ))}
          </Grid>
        )}
      </PageContainer>

      {/* Phones get the page action as a sticky full-width button, never a FAB. */}
      <div className="fixed inset-x-0 bottom-[calc(var(--row-h)+env(safe-area-inset-bottom))] z-30 border-t border-divider bg-surface p-3 sm:hidden">
        <Link href="/c/new" className={buttonClass("filled", true)}>
          <Plus aria-hidden className="size-4" />
          Зар үүсгэх
        </Link>
      </div>
    </>
  );
}
