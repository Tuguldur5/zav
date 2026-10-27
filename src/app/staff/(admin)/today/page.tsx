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
  ButtonLink,
  PageHeader,
  Rows,
  Row,
  Section,
  StatTile,
  StatTiles,
  StaffEmpty,
} from "@/components/staff";
import { StatusPill } from "@/components/ui/StatusPill";
import { assignmentStatus, availabilityStatus, jobStatus, slotLabels } from "@/lib/status";
import { formatDateMn, todayISO } from "@/lib/dates";
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
  "id" | "title" | "job_date" | "job_slot" | "workers_needed" | "skill_id" | "district_id"
>;

/** Admin "Today": four real counts and the working queue, as flat rows. */
export default async function AdminTodayPage() {
  const { supabase } = await requireRole(["admin"]);
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
    ...new Set([...availability.map((row) => row.worker_id), ...offers.map((row) => row.worker_id)]),
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

  return (
    <>
      <PageHeader
        title="Өнөөдөр"
        subtitle="Өнөөдөр шийдэх зүйлс"
        actions={<ButtonLink href="/jobs?tab=new" variant="primary">Шинэ зарын пул</ButtonLink>}
      />

      <StatTiles>
        <StatTile label="Шинэ зар" value={stats.pool_new ?? 0} href="/jobs?tab=new" icon={Briefcase} />
        <StatTile
          label="Баталгаажуулах чөлөөт өдөр"
          value={stats.pending_availability ?? 0}
          href="/calendar"
          icon={CalendarCheck}
          attention={(stats.pending_availability ?? 0) > 0}
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
      </StatTiles>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
      <Section title="Хийх зүйлс" count={queueCount} href="/jobs?tab=new" hrefLabel="Бүх зар">
        {queueCount === 0 ? (
          <StaffEmpty
            title="Дараалал хоосон байна"
            body="Шинэ зар, санал эсвэл чөлөөт өдөр ирмэгц энд харагдана."
          />
        ) : (
          <Rows label="Хийх зүйлс">
            {pool.map((job) => (
              <Row
                key={`pool-${job.id}`}
                title={job.title}
                href={`/jobs/${job.id}`}
                pill={<StatusPill status="new" table={jobStatus} />}
                meta={
                  <>
                    <span>{skillMap.get(job.skill_id) ?? "—"}</span>
                    <span>{districtMap.get(job.district_id) ?? "—"}</span>
                    <span>{formatDateMn(job.job_date, false)}</span>
                    <span>{slotLabels[job.job_slot] ?? job.job_slot}</span>
                  </>
                }
                action={
                  <Link href={`/jobs/${job.id}`} className="st-btn" data-variant="primary">
                    Авах
                  </Link>
                }
              />
            ))}

            {offers.map((offer) => {
              const worker = workerMap.get(offer.worker_id);
              const job = offerJobMap.get(offer.job_id);
              return (
                <Row
                  key={`offer-${offer.id}`}
                  title={job?.title ?? "Санал"}
                  href={`/jobs/${offer.job_id}`}
                  pill={<StatusPill status="offered" table={assignmentStatus} />}
                  meta={
                    <>
                      <span>{worker?.full_name ?? "Ажилтан"}</span>
                      {job ? <span>{formatDateMn(job.job_date, false)}</span> : null}
                    </>
                  }
                  action={
                    <Link href={`/jobs/${offer.job_id}`} className="st-btn" data-variant="outline">
                      Хариу бүртгэх
                    </Link>
                  }
                />
              );
            })}

            {availability.slice(0, 8).map((row) => {
              const worker = workerMap.get(row.worker_id);
              return (
                <Row
                  key={`free-${row.id}`}
                  title={worker?.full_name ?? "Ажилтан"}
                  href={`/workers/${row.worker_id}`}
                  pill={<StatusPill status={row.status} table={availabilityStatus} />}
                  meta={
                    <>
                      <span>{formatDateMn(row.day, false)}</span>
                      <span>{slotLabels[row.slot] ?? row.slot}</span>
                      {row.confirmed_by_phone ? <span>Утсаар баталгаажсан</span> : null}
                    </>
                  }
                  action={
                    worker?.phone ? (
                      <a
                        href={`tel:${worker.phone.replace(/[^\d+]/g, "")}`}
                        className="st-btn"
                        data-variant="outline"
                      >
                        <Phone aria-hidden className="size-4" />
                        Утсаар баталгаажуулах
                      </a>
                    ) : (
                      <Link
                        href={`/workers/${row.worker_id}`}
                        className="st-btn"
                        data-variant="outline"
                      >
                        Утасгүй
                      </Link>
                    )
                  }
                />
              );
            })}
          </Rows>
        )}
      </Section>

      <Section
        title="Өнөөдөр чөлөөтэй ажилчид"
        count={availability.filter((row) => row.status !== "booked").length}
        href="/calendar"
        hrefLabel="Календар"
      >
        {availability.length === 0 ? (
          <StaffEmpty
            title="Өнөөдөр чөлөөтэй ажилтан байхгүй"
            body="Ажилтнууд өдрөө тэмдэглэмэгц энд гарна."
            action={<ButtonLink href="/calendar" icon={CalendarDays}>Календар нээх</ButtonLink>}
          />
        ) : (
          <Rows label="Чөлөөтэй ажилчид">
            {availability.slice(0, 8).map((row) => {
              const worker = workerMap.get(row.worker_id);
              return (
                <Row
                  key={`free-list-${row.id}`}
                  title={worker?.full_name ?? "Ажилтан"}
                  href={`/workers/${row.worker_id}`}
                  pill={<StatusPill status={row.status} table={availabilityStatus} />}
                  meta={
                    <>
                      <span>{slotLabels[row.slot] ?? row.slot}</span>
                      <span>Өнөөдөр</span>
                    </>
                  }
                  action={
                    <Link href={`/workers/${row.worker_id}`} className="st-btn" data-variant="outline">
                      Залгах
                    </Link>
                  }
                />
              );
            })}
          </Rows>
        )}
      </Section>
      </div>

      {queueCount === 0 ? (
        <p className="st-note">
          <Inbox aria-hidden className="size-4 shrink-0" />
          Өнөөдрийн дараалал хоосон — шинэ зар, санал ирэхэд энд харагдана.
        </p>
      ) : null}
    </>
  );
}
