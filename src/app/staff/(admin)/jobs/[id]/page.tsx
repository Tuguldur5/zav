import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, User, Phone, Users, MapPin } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageTitle, QueueCard, QueueGrid, RoundAction } from "@/components/staff";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { PhoneButton } from "@/components/ui/PhoneButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { assignmentStatus, availabilityStatus, jobStatus, slotLabels } from "@/lib/status";
import { formatDateMn, formatMoney } from "@/lib/dates";
import type { Availability, Assignment, Job, Profile } from "@/lib/types";
import {
  AssignmentActions,
  AvailabilityConfirmButton,
  OfferWorkerButton,
  ReleaseJobButton,
} from "./JobDetailActions";
import { ClaimJobButton } from "../ClaimJobButton";
import { buttonClass, cx } from "@/components/ui/styles";

export const dynamic = "force-dynamic";

type ProfileRow = Pick<Profile, "id" | "full_name" | "phone"> & { status?: string };

type Candidate = {
  profile: ProfileRow;
  skills: string[];
  availability: Availability;
};

export default async function AdminJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await requireRole(["admin", "super_admin"]);
  const superAdmin = profile.role === "super_admin";

  const { data: jobData } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (!jobData) notFound();
  const job = jobData as Job;
  const canManage = superAdmin || job.claimed_by === user.id;

  const [districtResult, skillResult, customerResult, assignmentResult, workerDetailsResult] =
    await Promise.all([
      supabase.from("districts").select("name").eq("id", job.district_id).maybeSingle(),
      supabase.from("skills").select("name").eq("id", job.skill_id).maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", job.customer_id)
        .maybeSingle(),
      supabase.from("assignments").select("*").eq("job_id", job.id).order("created_at"),
      (superAdmin
        ? supabase.from("worker_details").select("*")
        : supabase.from("worker_details").select("*").eq("admin_id", user.id)
      ).order("intake_status"),
    ]);

  const district = districtResult.data?.name as string | undefined;
  const skillName = skillResult.data?.name as string | undefined;
  const customer = customerResult.data as ProfileRow | null;
  const knownAssignments = (assignmentResult.data as Assignment[] | null) ?? [];

  const workerRows = (workerDetailsResult.data as Array<{ worker_id: string }> | null) ?? [];
  const workerIds = workerRows.map((row) => row.worker_id);

  let workers: ProfileRow[] = [];
  let availability: Availability[] = [];
  let skilledWorkerIds: Set<string> = new Set();
  if (workerIds.length > 0) {
    const [profilesResult, availabilityResult2, skillsResult2] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, status").in("id", workerIds),
      supabase.from("availability").select("*").eq("day", job.job_date).in("worker_id", workerIds),
      supabase.from("worker_skills").select("*").in("worker_id", workerIds),
    ]);
    workers = (profilesResult.data as ProfileRow[] | null) ?? [];
    availability = (availabilityResult2.data as Availability[] | null) ?? [];
    skilledWorkerIds = new Set(
      ((skillsResult2.data as Array<{ skill_id: string; worker_id: string }> | null) ?? [])
        .filter((row) => row.skill_id === job.skill_id)
        .map((row) => row.worker_id),
    );
  }

  const workerMap = new Map(workers.map((worker) => [worker.id, worker]));
  const assignedWorkerIds = new Set(
    knownAssignments
      .filter((assignment) =>
        ["offered", "accepted", "confirmed", "completed"].includes(assignment.status),
      )
      .map((assignment) => assignment.worker_id),
  );

  const skillListResult = await supabase.from("skills").select("id, name");
  const skillNamesById = new Map(
    ((skillListResult.data as Array<{ id: string; name: string }> | null) ?? []).map((row) => [
      row.id,
      row.name,
    ]),
  );

  const candidates: Candidate[] = availability
    .filter((row) => {
      if (!skilledWorkerIds.has(row.worker_id)) return false;
      if (assignedWorkerIds.has(row.worker_id)) return false;
      const worker = workerMap.get(row.worker_id);
      if (!worker) return false;
      if (job.job_slot === "full") return row.slot === "full";
      return row.slot === job.job_slot || row.slot === "full";
    })
    .map((row) => ({
      profile: workerMap.get(row.worker_id)!,
      skills: [skillNamesById.get(job.skill_id) ?? ""].filter(Boolean),
      availability: row,
    }))
    .sort((a, b) => {
      const rank = (value: Candidate) =>
        value.availability.status === "confirmed"
          ? 0
          : value.availability.status === "open"
            ? 1
            : 2;
      return rank(a) - rank(b) || a.profile.full_name.localeCompare(b.profile.full_name);
    });

  const activeAssignments = knownAssignments.filter((assignment) =>
    ["offered", "accepted", "confirmed"].includes(assignment.status),
  );
  const full = activeAssignments.length >= job.workers_needed;
  const canOffer = canManage && ["claimed", "matched"].includes(job.status) && !full;

  return (
    <>
      <PageTitle
        title={job.title}
        subtitle={`${formatDateMn(job.job_date, false)} · ${slotLabels[job.job_slot]} · ${job.workers_needed} ажилтан`}
        actions={
          <Link
            href="/jobs?tab=mine"
            className={cx(buttonClass("outline", false, "sm"), "shrink-0")}
          >
            Зарууд руу буцах
          </Link>
        }
      />
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[0.9em] font-medium text-muted">Зарын дэлгэрэнгүй</p>
            <StatusPill status={job.status} table={jobStatus} />
          </div>
          <p className="flex flex-wrap items-center gap-2 text-[0.9em] text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden className="size-4" />
              {formatDateMn(job.job_date)} · {slotLabels[job.job_slot]}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-4" />
              {district ?? ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users aria-hidden className="size-4" />
              {job.workers_needed} ажилтан
            </span>
          </p>
          <p className="font-semibold">{formatMoney(job.pay_offer)}</p>
          <p className="text-[0.8em] text-muted">Мэргэжил: {skillName ?? "—"}</p>
          {job.description ? <p className="text-[0.9em]">{job.description}</p> : null}
          <p className="flex items-start gap-2 rounded-md bg-container px-3 py-2 text-[0.9em]">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
            Хаяг: {job.address_note}
          </p>
          {canManage ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {job.status === "new" ? <ClaimJobButton jobId={job.id} /> : null}
              {["claimed", "matched"].includes(job.status) ? (
                <ReleaseJobButton jobId={job.id} />
              ) : null}
            </div>
          ) : (
            <p className="staff-banner">
              <Users aria-hidden className="size-4 shrink-0" />
              Энэ зарыг өөр админ авсан байна.
            </p>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Phone aria-hidden className="size-5 text-primary" />
            Захиалагч
          </h3>
          <p className="font-medium">{customer?.full_name ?? "—"}</p>
          <PhoneButton
            phone={customer?.phone}
            label="Захиалагч руу залгах"
            name={customer?.full_name}
          />
        </Card>

        <Card className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Users aria-hidden className="size-5 text-primary" />
            Томилогдсон ажилтнууд ({activeAssignments.length}/{job.workers_needed})
          </h3>
          {activeAssignments.length === 0 ? (
            <p className="text-[0.9em] text-muted">Одоогоор ажилтан томилогдоогүй байна.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activeAssignments.map((assignment) => {
                const worker = workerMap.get(assignment.worker_id);
                return (
                  <li key={assignment.id} className="rounded-md border border-container p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/workers/${assignment.worker_id}`}
                        className="font-semibold underline-offset-2"
                      >
                        {worker?.full_name ?? "Ажилтан"}
                      </Link>
                      <StatusPill status={assignment.status} table={assignmentStatus} />
                    </div>
                    {worker?.phone ? (
                      <p className="text-[0.9em] text-muted">{worker.phone}</p>
                    ) : null}
                    {canManage ? (
                      <AssignmentActions assignmentId={assignment.id} status={assignment.status} />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <section aria-labelledby="find-worker" className="flex flex-col gap-3">
          <h3 id="find-worker" className="flex items-center gap-2 text-[1.05em] font-semibold">
            <User aria-hidden className="size-5 text-primary" />
            Ажилтан олох
          </h3>
          <p className="text-[0.9em] text-muted">
            Энэ өдөр чөлөөтэй, мэргэжил нь тохирч буй өөрийн ажилтнууд. Баталгаажсан нь эхэнд гарна.
          </p>

          {candidates.length === 0 ? (
            <EmptyState
              icon={User}
              title="Энэ өдөр тохирох ажилтан олдсонгүй"
              body="Календартаа өөр ажилтны чөлөөт өдрийг шалгаана уу."
            />
          ) : (
            <QueueGrid>
              {candidates.map((candidate, index) => {
                const phone = candidate.profile.phone;
                return (
                  <QueueCard
                    key={candidate.profile.id}
                    featured={index === 0}
                    title={candidate.profile.full_name}
                    href={`/workers/${candidate.profile.id}`}
                    description={phone ?? "Утасгүй"}
                    icon={User}
                    status={{
                      status: candidate.availability.status,
                      table: availabilityStatus,
                    }}
                    actions={
                      <>
                        <RoundAction
                          href={`/workers/${candidate.profile.id}`}
                          label="Холбоо харах"
                          icon={Users}
                        />
                        <RoundAction
                          href={phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : `/workers/${candidate.profile.id}`}
                          label={phone ? "Залгах" : "Утасгүй"}
                          icon={Phone}
                          confirm
                        />
                      </>
                    }
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((name) => (
                        <Chip key={name}>{name}</Chip>
                      ))}
                      <Chip tone="primary">{slotLabels[candidate.availability.slot]}</Chip>
                    </div>
                    <PhoneButton
                      phone={candidate.profile.phone}
                      name={candidate.profile.full_name}
                    />
                    <AvailabilityConfirmButton
                      workerId={candidate.profile.id}
                      day={job.job_date}
                      confirmed={candidate.availability.status === "confirmed"}
                    />
                    <OfferWorkerButton
                      jobId={job.id}
                      workerId={candidate.profile.id}
                      day={job.job_date}
                      disabled={!canOffer}
                    />
                    {!canOffer ? (
                      <p className="text-[0.8em] text-muted">
                        {full ? "Ажилтны тоо дүүрсэн." : "Зар үүсгээд авна уу."}
                      </p>
                    ) : null}
                    {candidate.profile.status === "pending" ? (
                      <p className="text-[0.8em] text-muted">
                        Ажилтан одоогоор супер админы анхны бүртгэлд хүлээгдэж байна.
                      </p>
                    ) : null}
                  </QueueCard>
                );
              })}
            </QueueGrid>
          )}
        </section>
      </div>
    </>
  );
}
