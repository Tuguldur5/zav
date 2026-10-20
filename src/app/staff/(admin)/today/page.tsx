import Link from "next/link";
import {
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Inbox,
  MailQuestion,
  Phone,
} from "lucide-react";
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
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { assignmentStatus, availabilityStatus, jobStatus, slotLabels } from "@/lib/status";
import { formatDateMn, formatMoney, todayISO } from "@/lib/dates";
import type { Assignment, Availability, Job } from "@/lib/types";

export const dynamic = "force-dynamic";

type Stats = {
  pool_new: number;
  pending_availability: number;
  offers_waiting: number;
  today_jobs: number;
};

type PoolJob = Pick<
  Job,
  "id" | "title" | "job_date" | "job_slot" | "workers_needed" | "pay_offer" | "skill_id" | "district_id"
>;

/**
 * Admin "Control Center": four real tiles and the working queue — pool jobs to
 * claim, offers waiting for an answer, and availability to confirm today.
 */
export default async function AdminTodayPage() {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const today = todayISO();
  const { data: statsData } = await supabase.rpc("stats");
  const stats = (statsData ?? {}) as Stats;

  const [poolResult, availabilityResult, offersResult, districtResult, skillResult] =
    await Promise.all([
      supabase.rpc("pool_jobs"),
      supabase.from("availability").select("*").eq("day", today).order("status"),
      supabase
        .from("assignments")
        .select("*")
        .eq("status", "offered")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("districts").select("id, name"),
      supabase.from("skills").select("id, name"),
    ]);

  const pool = ((poolResult.data as PoolJob[] | null) ?? []).slice(0, 6);
  const availability = (availabilityResult.data as Availability[] | null) ?? [];
  const offers = (offersResult.data as Assignment[] | null) ?? [];

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

  const workerIds = [
    ...new Set([
      ...availability.map((row) => row.worker_id),
      ...offers.map((row) => row.worker_id),
    ]),
  ];
  const jobIds = [...new Set(offers.map((row) => row.job_id))];

  const [workersResult, offerJobsResult] = await Promise.all([
    workerIds.length > 0
      ? supabase.from("profiles").select("id, full_name, phone").in("id", workerIds)
      : Promise.resolve({ data: [] }),
    jobIds.length > 0
      ? supabase.from("jobs").select("id, title, job_date, job_slot").in("id", jobIds)
      : Promise.resolve({ data: [] }),
  ]);

  const workerMap = new Map(
    ((workersResult.data as Array<{ id: string; full_name: string; phone: string | null }> | null) ??
      []).map((row) => [row.id, row]),
  );
  const offerJobMap = new Map(
    ((offerJobsResult.data as Array<{
      id: string;
      title: string;
      job_date: string;
      job_slot: string;
    }> | null) ?? []).map((row) => [row.id, row]),
  );

  const queueCount = pool.length + offers.length + availability.length;
  const freeCount = availability.filter((row) => row.status !== "booked").length;

  return (
    <>
      <PageTitle
        title="Хяналтын төв"
        emoji="⏰"
        subtitle="Өнөөдөр шийдэх шаардлагатай бүх зүйл"
        search={<SearchPill placeholder="Зар, ажилтан хайх" />}
        actions={
          <Link
            href="/jobs?tab=new"
            className="press inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-[13px] font-semibold text-on-primary"
          >
            Шинэ зарын пул
          </Link>
        }
      />

      <StatRow>
        <StatTile label="Шинэ зар" value={stats.pool_new ?? 0} href="/jobs?tab=new" icon={Briefcase} />
        <StatTile
          attention={(stats.pending_availability ?? 0) > 0}
          label="Баталгаажуулах чөлөөт өдөр"
          value={stats.pending_availability ?? 0}
          href="/calendar"
          icon={CalendarCheck}
        />
        <StatTile
          label="Хариу хүлээж буй санал"
          value={stats.offers_waiting ?? 0}
          href="/jobs?tab=mine"
          icon={MailQuestion}
        />
        <StatTile
          label="Өнөөдрийн ажил"
          value={stats.today_jobs ?? 0}
          href="/jobs?tab=matched"
          icon={CheckCircle2}
        />
      </StatRow>

      <PanelSection
        title="Ажлын дараалал"
        count={queueCount}
        href="/jobs?tab=new"
        hrefLabel="Бүх зар"
      >
        {queueCount === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Дараалал хоосон байна"
            body="Шинэ зар, санал эсвэл чөлөөт өдөр ирмэгц энд харагдана."
          />
        ) : (
          <QueueGrid>
            {pool.map((job, index) => (
              <QueueCard
                key={`pool-${job.id}`}
                featured={index === 0}
                title={job.title}
                href={`/jobs/${job.id}`}
                description={`Мэргэжил: ${skillMap.get(job.skill_id) ?? "—"}`}
                icon={Briefcase}
                status={{ status: "new", table: jobStatus }}
                meta={
                  <>
                    <span>{formatDateMn(job.job_date, false)}</span>
                    <span>{slotLabels[job.job_slot] ?? job.job_slot}</span>
                    <span>{districtMap.get(job.district_id) ?? "—"}</span>
                    <span className="font-semibold text-ink">{formatMoney(job.pay_offer)}</span>
                  </>
                }
                actions={
                  <>
                    <RoundAction href={`/jobs/${job.id}`} label="Зарыг нээх" icon={CheckCircle2} />
                    <RoundAction
                      href="/jobs?tab=new"
                      label="Зарыг авах"
                      icon={Briefcase}
                      confirm
                    />
                  </>
                }
              />
            ))}

            {offers.map((offer) => {
              const worker = workerMap.get(offer.worker_id);
              const job = offerJobMap.get(offer.job_id);
              return (
                <QueueCard
                  key={`offer-${offer.id}`}
                  title={job?.title ?? "Санал"}
                  href={`/jobs/${offer.job_id}`}
                  description={worker ? `${worker.full_name} — хариу хүлээж байна` : "Хариу хүлээж байна"}
                  icon={MailQuestion}
                  status={{ status: "offered", table: assignmentStatus }}
                  meta={job ? <span>{formatDateMn(job.job_date, false)} · {slotLabels[job.job_slot] ?? ""}</span> : undefined}
                  actions={
                    <RoundAction
                      href={worker?.phone ? `tel:${worker.phone.replace(/[^\d+]/g, "")}` : `/workers/${offer.worker_id}`}
                      label={worker?.phone ? "Залгах" : "Ажилтныг нээх"}
                      icon={Phone}
                      confirm
                    />
                  }
                />
              );
            })}

            {availability.map((row) => {
              const worker = workerMap.get(row.worker_id);
              return (
                <QueueCard
                  key={`free-${row.id}`}
                  title={worker?.full_name ?? "Ажилтан"}
                  href={`/workers/${row.worker_id}`}
                  description={`${formatDateMn(row.day, false)} · ${slotLabels[row.slot] ?? row.slot}`}
                  icon={CalendarDays}
                  status={{ status: row.status, table: availabilityStatus }}
                  meta={
                    <>
                      <span>{slotLabels[row.slot]}</span>
                      {row.created_by_staff ? <Chip tone="primary">Админ тэмдэглэсэн</Chip> : null}
                      {row.confirmed_by_phone ? <Chip tone="primary">Утсаар баталгаажсан</Chip> : null}
                    </>
                  }
                  actions={
                    <>
                      <RoundAction href={`/workers/${row.worker_id}`} label="Холбоо харах" icon={Phone} />
                      <RoundAction
                        href={worker?.phone ? `tel:${worker.phone.replace(/[^\d+]/g, "")}` : `/workers/${row.worker_id}`}
                        label={worker?.phone ? "Залгах" : "Утасгүй"}
                        icon={Phone}
                        confirm
                      />
                    </>
                  }
                />
              );
            })}
          </QueueGrid>
        )}
      </PanelSection>

      <div className="staff-banner">
        <CalendarCheck aria-hidden className="size-4 shrink-0" />
        Өнөөдөр {freeCount} ажилтан чөлөөтэй байна.
        <Link href="/calendar" className="press font-semibold text-ink">
          Долоо хоногийн календар
        </Link>
      </div>
    </>
  );
}
