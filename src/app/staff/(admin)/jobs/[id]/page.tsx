import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader, Section, StaffEmpty, StaffNote } from "@/components/staff";
import { CandidateRow } from "./CandidateRow";
import { Card } from "@/components/ui/Card";
import { PhoneButton } from "@/components/ui/PhoneButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { assignmentStatus, jobStatus, slotLabels } from "@/lib/status";
import { formatDateMn, formatMoney } from "@/lib/dates";
import type { Availability, Assignment, Job, Profile } from "@/lib/types";
import { AssignmentActions, ReleaseJobButton } from "./JobDetailActions";
import { ClaimJobButton } from "../ClaimJobButton";

export const dynamic = "force-dynamic";

type ProfileRow = Pick<Profile, "id" | "full_name" | "phone" | "district_id"> & {
  status?: string;
};

type Candidate = {
  profile: ProfileRow;
  availability: Availability;
};

export default async function AdminJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await requireRole(["admin"]);
  const superAdmin = profile.role === "super_admin";

  const { data: jobData } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (!jobData) notFound();
  const job = jobData as Job;
  const canManage = superAdmin || job.claimed_by === user.id;

  const [
    districtResult,
    skillResult,
    customerResult,
    assignmentResult,
    workerDetailsResult,
    skillCatalogResult,
    districtCatalogResult,
  ] = await Promise.all([
    supabase.from("districts").select("name").eq("id", job.district_id).maybeSingle(),
    supabase.from("skills").select("name").eq("id", job.skill_id).maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name, phone, district_id")
      .eq("id", job.customer_id)
      .maybeSingle(),
    supabase.from("assignments").select("*").eq("job_id", job.id).order("created_at"),
    supabase.from("worker_details").select("*").eq("admin_id", user.id).order("intake_status"),
    supabase.from("skills").select("id, name"),
    supabase.from("districts").select("id, name"),
  ]);
  const skillNameMap = new Map(
    ((skillCatalogResult.data as Array<{ id: string; name: string }> | null) ?? []).map((row) => [
      row.id,
      row.name,
    ]),
  );
  const districtNameMap = new Map(
    ((districtCatalogResult.data as Array<{ id: string; name: string }> | null) ?? []).map(
      (row) => [row.id, row.name],
    ),
  );

  const district = districtResult.data?.name as string | undefined;
  const skillName = skillResult.data?.name as string | undefined;
  const customer = customerResult.data as ProfileRow | null;
  const knownAssignments = (assignmentResult.data as Assignment[] | null) ?? [];
  const workerIds = ((workerDetailsResult.data as Array<{ worker_id: string }> | null) ?? []).map(
    (row) => row.worker_id,
  );

  let workers: ProfileRow[] = [];
  let availability: Availability[] = [];
  let skilledWorkerIds = new Set<string>();
  const workerSkillNames = new Map<string, string[]>();
  if (workerIds.length > 0) {
    const [profilesResult, availabilityResult, skillsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, phone, status, district_id")
        .in("id", workerIds),
      supabase.from("availability").select("*").eq("day", job.job_date).in("worker_id", workerIds),
      supabase.from("worker_skills").select("*").in("worker_id", workerIds),
    ]);
    workers = (profilesResult.data as ProfileRow[] | null) ?? [];
    availability = (availabilityResult.data as Availability[] | null) ?? [];
    const skillRows =
      (skillsResult.data as Array<{ skill_id: string; worker_id: string }> | null) ?? [];
    skilledWorkerIds = new Set(
      skillRows.filter((row) => row.skill_id === job.skill_id).map((row) => row.worker_id),
    );
    for (const row of skillRows) {
      const name = skillNameMap.get(row.skill_id);
      if (!name) continue;
      workerSkillNames.set(row.worker_id, [...(workerSkillNames.get(row.worker_id) ?? []), name]);
    }
  }

  const workerMap = new Map(workers.map((worker) => [worker.id, worker]));
  const assignedWorkerIds = new Set(
    knownAssignments
      .filter((assignment) =>
        ["offered", "accepted", "confirmed", "completed"].includes(assignment.status),
      )
      .map((assignment) => assignment.worker_id),
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
    .map((row) => ({ profile: workerMap.get(row.worker_id)!, availability: row }))
    .sort((a, b) => {
      const rank = (value: Candidate) =>
        value.availability.status === "confirmed" ? 0 : value.availability.status === "open" ? 1 : 2;
      return rank(a) - rank(b) || a.profile.full_name.localeCompare(b.profile.full_name);
    });

  const activeAssignments = knownAssignments.filter((assignment) =>
    ["offered", "accepted", "confirmed"].includes(assignment.status),
  );
  const full = activeAssignments.length >= job.workers_needed;
  const canOffer = canManage && ["claimed", "matched"].includes(job.status) && !full;

  return (
    <>
      <Link href="/jobs?tab=mine" className="inline-flex items-center gap-1 text-[13px] font-medium">
        <ArrowLeft aria-hidden className="size-4" />
        Зарууд руу буцах
      </Link>

      <PageHeader
        record={job.title}
        subtitle={`${formatDateMn(job.job_date, false)} · ${slotLabels[job.job_slot]} · ${job.workers_needed} ажилтан`}
        actions={<StatusPill status={job.status} table={jobStatus} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-[color:var(--st-muted)]">
              <span className="inline-flex items-center gap-1">
                <CalendarDays aria-hidden className="size-4" />
                {formatDateMn(job.job_date)} · {slotLabels[job.job_slot]}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="size-4" />
                {district ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden className="size-4" />
                {job.workers_needed} ажилтан
              </span>
            </div>
            <p className="text-[18px] font-semibold">{formatMoney(job.pay_offer)}</p>
            <p className="text-[13px] text-[color:var(--st-muted)]">Мэргэжил: {skillName ?? "—"}</p>
            {job.description ? <p className="text-[14px]">{job.description}</p> : null}
            <p className="st-note">
              <MapPin aria-hidden className="size-4 shrink-0" />
              Хаяг: {job.address_note || "—"}
            </p>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                {job.status === "new" ? <ClaimJobButton jobId={job.id} /> : null}
                {["claimed", "matched"].includes(job.status) ? (
                  <ReleaseJobButton jobId={job.id} />
                ) : null}
              </div>
            ) : (
              <StaffNote>Энэ зарыг өөр админ авсан байна.</StaffNote>
            )}
          </Card>

          <Card className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold">Захиалагч</h2>
            <p className="font-medium">{customer?.full_name ?? "—"}</p>
            <PhoneButton
              phone={customer?.phone}
              label="Захиалагч руу залгах"
              name={customer?.full_name}
            />
          </Card>

          <Section
            title="Томилогдсон ажилтнууд"
            count={activeAssignments.length}
            actions={
              <span className="text-[13px] text-[color:var(--st-muted)]">
                {activeAssignments.length}/{job.workers_needed}
              </span>
            }
          >
            {activeAssignments.length === 0 ? (
              <StaffEmpty title="Одоогоор ажилтан томилогдоогүй" body="Баруун талаас ажилтан сонгоно уу." />
            ) : (
              <div className="st-rows">
                {activeAssignments.map((assignment) => {
                  const worker = workerMap.get(assignment.worker_id);
                  return (
                    <div key={assignment.id} className="st-row">
                      <div className="st-row-main">
                        <span className="st-row-title">
                          <Link href={`/workers/${assignment.worker_id}`}>
                            {worker?.full_name ?? "Ажилтан"}
                          </Link>
                        </span>
                        {worker?.phone ? <span className="st-row-meta">{worker.phone}</span> : null}
                        {canManage ? (
                          <AssignmentActions assignmentId={assignment.id} status={assignment.status} />
                        ) : null}
                      </div>
                      <StatusPill status={assignment.status} table={assignmentStatus} />
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        <Section title="Ажилтан олох" count={candidates.length}>
          <p className="text-[13px] text-[color:var(--st-muted)]">
            Энэ өдөр чөлөөтэй, мэргэжил нь тохирч буй өөрийн ажилтнууд. Баталгаажсан нь эхэнд гарна.
          </p>
          {candidates.length === 0 ? (
            <StaffEmpty
              title="Энэ өдөр тохирох ажилтан олдсонгүй"
              body="Календартаа өөр ажилтны чөлөөт өдрийг шалгана уу."
            />
          ) : (
            <div className="st-rows">
              {candidates.slice(0, 8).map((candidate) => (
                <CandidateRow
                  key={candidate.profile.id}
                  jobId={job.id}
                  workerId={candidate.profile.id}
                  name={candidate.profile.full_name}
                  phone={candidate.profile.phone}
                  skills={workerSkillNames.get(candidate.profile.id) ?? [skillName ?? "Мэргэжил"]}
                  district={
                    candidate.profile.district_id
                      ? (districtNameMap.get(candidate.profile.district_id) ?? null)
                      : null
                  }
                  availabilityLabel={`${slotLabels[candidate.availability.slot]}${
                    candidate.availability.status === "confirmed" ? " · Баталгаажсан" : ""
                  }`}
                  day={job.job_date}
                  confirmed={candidate.availability.status === "confirmed"}
                  canOffer={canOffer}
                />
              ))}
            </div>
          )}
          {candidates.length > 8 ? (
            <StaffNote>
              Эхний 8 ажилтан харагдана. Бусад ажилтныг Календар эсвэл Ажилчид хэсгээс харна уу.
            </StaffNote>
          ) : null}
          {!canOffer ? (
            <StaffNote>
              {full ? "Ажилтны тоо дүүрсэн байна." : "Эхлээд энэ зарыг авах шаардлагатай."}
            </StaffNote>
          ) : null}
        </Section>
      </div>
    </>
  );
}
