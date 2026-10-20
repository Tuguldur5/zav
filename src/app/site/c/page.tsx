import Link from "next/link";
import { Briefcase, CalendarDays, ChevronRight, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer, SectionLabel, Grid } from "@/components/ui/Layout";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyJobs } from "@/components/art/EmptyArts";
import { buttonClass, cx } from "@/components/ui/styles";
import { jobStatus, slotLabels } from "@/lib/status";
import { formatShortDateMn, formatMoney } from "@/lib/dates";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomerHomePage() {
  const { supabase, user, profile } = await requireRole(["customer"]);

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const jobs = (data as Job[] | null) ?? [];
  const active = jobs.filter((job) => !["done", "cancelled"].includes(job.status));
  const firstName = profile.full_name.split(" ")[0] || "найз";

  return (
    <>
      <TopAppBar title={`Сайн байна уу, ${firstName}`} subtitle="Ажил захиалахад хялбар" />
      <PageContainer>
        <Card className="greeting-band flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Сайн байна уу</p>
            <p className="mt-1 text-[1.35em] font-semibold">{firstName}</p>
            <p className="mt-1 max-w-xl text-[0.9em] text-muted">
              Мэргэжлээ сонгоод өдрөө тодорхойлоход л хангалттай. Манай админ тохирох
              ажилтныг олж, тантай холбогдоно.
            </p>
          </div>
          <Link href="/c/new" className={cx(buttonClass("filled"), "shrink-0")}>
            <Plus aria-hidden className="size-4" />
            Зар үүсгэх
          </Link>
        </Card>

        <div className="flex flex-col gap-3">
          <SectionLabel
            action={
              <Link
                href="/c/jobs"
                className="flex min-h-11 items-center gap-1 text-[0.9em] font-medium text-primary"
              >
                Бүгдийг харах
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            }
          >
            Идэвхтэй зарууд
          </SectionLabel>
          {active.length === 0 ? (
            <EmptyState
              art={<EmptyJobs className="h-auto w-full" />}
              title="Одоогоор идэвхтэй зар байхгүй"
              body="Эхний ажлаа зарлаад, тохирох ажилтнаа олоорой."
              action={
                <Link href="/c/new" className={buttonClass("filled")}>
                  Зар үүсгэх
                </Link>
              }
            />
          ) : (
            <Grid columns={3}>
              {active.slice(0, 6).map((job) => (
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
        </div>

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Briefcase aria-hidden className="size-5" />
            </span>
            <p className="text-[0.95em] text-muted">
              Ажил хийлгэх бүрдээ шинэ зар үүсгээд, админаа хүлээгээрэй.
            </p>
          </div>
          <Link href="/help" className={buttonClass("outline")}>
            Хэрхэн ажилладаг
          </Link>
        </Card>
      </PageContainer>

      {/* Phone-only sticky primary action above the bottom nav (no FAB). */}
      <div className="fixed inset-x-0 bottom-[calc(var(--row-h)+env(safe-area-inset-bottom))] z-30 border-t border-divider bg-surface p-3 sm:hidden">
        <Link href="/c/new" className={buttonClass("filled", true)}>
          <Plus aria-hidden className="size-4" />
          Зар үүсгэх
        </Link>
      </div>
    </>
  );
}
