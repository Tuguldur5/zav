import Link from "next/link";
import { CalendarDays, CalendarCheck, ClipboardList, Phone, UserCog } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/staff";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { PhoneActions } from "@/components/ui/PhoneActions";
import { StatusPill } from "@/components/ui/StatusPill";
import { MonthCalendar } from "@/components/app/MonthCalendar";
import type { DayMark } from "@/components/ui/Calendar";
import { profileStatus, slotLabels } from "@/lib/status";
import { formatDateMn } from "@/lib/dates";
import type { Assignment, Availability, Profile } from "@/lib/types";
import { WorkerNoteEditor } from "./WorkerNoteEditor";
import { ContactLogBar } from "./ContactLogBar";

export const dynamic = "force-dynamic";

export default async function AdminWorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole(["admin"]);

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!profileData || (profileData as Profile).role !== "worker") notFound();
  const worker = profileData as Profile;

  const [
    detailsResult,
    availabilityResult,
    assignmentsResult,
    skillsResult,
    noteResult,
    districtResult,
    pushResult,
  ] = await Promise.all([
    supabase.from("worker_details").select("*").eq("worker_id", id).maybeSingle(),
    supabase.from("availability").select("*").eq("worker_id", id).order("day").limit(90),
    supabase
      .from("assignments")
      .select("*")
      .eq("worker_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("worker_skills").select("*").eq("worker_id", id),
    supabase.rpc("worker_staff_note", { p_worker: id }),
    supabase
      .from("districts")
      .select("name")
      .eq("id", worker.district_id ?? "")
      .maybeSingle(),
    supabase.rpc("worker_push_status", { p_worker_id: id }),
  ]);
  const pushEnabled = Boolean(pushResult.data);

  const details = detailsResult.data as
    | {
        has_transport: boolean;
        experience_note: string | null;
        intake_status: string;
        assigned_at: string | null;
        admin_id: string | null;
      }
    | null
    | undefined;
  const availability = (availabilityResult.data as Availability[] | null) ?? [];
  const assignmentRows = (assignmentsResult.data as Assignment[] | null) ?? [];
  const skillIds = ((skillsResult.data as Array<{ skill_id: string }> | null) ?? []).map(
    (row) => row.skill_id,
  );
  const note = noteResult.data as string | null;
  const district = districtResult.data?.name as string | undefined;

  const skillCatalog = (await supabase.from("skills").select("id, name")).data as Array<{
    id: string;
    name: string;
  }> | null;
  const skillMap = new Map((skillCatalog ?? []).map((row) => [row.id, row.name]));

  const jobIds = [...new Set(assignmentRows.map((row) => row.job_id))];
  let jobTitles = new Map<string, { title: string; job_date: string; status: string }>();
  if (jobIds.length > 0) {
    const { data: jobRows } = await supabase
      .from("jobs")
      .select("id, title, job_date, status")
      .in("id", jobIds);
    jobTitles = new Map(
      (
        (jobRows as Array<{
          id: string;
          title: string;
          job_date: string;
          status: string;
        }> | null) ?? []
      ).map((row) => [row.id, row]),
    );
  }

  const marks: Record<string, DayMark> = {};
  for (const row of availability) {
    marks[row.day] = { slot: row.slot, status: row.status };
  }

  const initials =
    worker.full_name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <>
      <PageHeader
        record={worker.full_name}
        subtitle={`${district ?? "Дүүрэг тодорхойгүй"} · ${assignmentRows.length} ажлын түүх`}
        actions={
          <Link
            href="/workers"
            className="press flex min-h-[var(--control-h)] items-center rounded-[10px] border border-[color:var(--control-line)] px-4 text-[0.9em] font-medium"
          >
            Бүх ажилтан
          </Link>
        }
      />
      <div className="flex flex-col gap-4 pb-40 sm:pb-4">
        <Card className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="st-avatar shrink-0" aria-hidden>
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[1.05em] font-semibold">{worker.full_name}</p>
              <p className="text-[0.9em] text-muted">
                {district ?? "Дүүрэг тодорхойгүй"}
              </p>
            </div>
            <StatusPill status={worker.status} table={profileStatus} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone="primary">Ажил хийгч</Chip>
            {skillIds.map((skillId) => (
              <Chip key={skillId}>{skillMap.get(skillId) ?? "Мэргэжил"}</Chip>
            ))}
            {details?.has_transport ? <Chip tone="primary">Тээврийн хэрэгсэлтэй</Chip> : null}
            <Chip tone={pushEnabled ? "primary" : "default"}>
              Мэдэгдэл: {pushEnabled ? "идэвхтэй" : "идэвхгүй"}
            </Chip>
          </div>
          {pushEnabled ? null : (
            <p className="text-[0.85em] text-muted">
              Мэдэгдэл идэвхгүй тул санал ирэхэд утсаар холбогдоно уу.
            </p>
          )}
          {worker.phone ? (
            <PhoneActions phone={worker.phone} />
          ) : (
            <p className="text-[0.9em] text-muted">Утасгүй байна.</p>
          )}
          {details?.experience_note ? (
            <p className="rounded-md bg-tint-1 px-3 py-2 text-[0.9em]">{details.experience_note}</p>
          ) : null}
          <p className="text-[0.8em] text-muted">
            {details?.intake_status === "assigned"
              ? `Админд хуваарилагдсан: ${details.assigned_at ? formatDateMn(details.assigned_at.slice(0, 10), false) : "—"}`
              : "Шинэ ажилтан: супер админ хуваарилна."}
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarDays aria-hidden className="size-5 text-primary" />
            Чөлөөт өдөр
          </h2>
          <MonthCalendar marks={marks} mode="worker" />
          <div className="flex flex-col gap-1 overflow-x-auto">
            <h3 className="mt-2 font-semibold">Сүүлийн тэмдэглэлүүд</h3>
            {availability.length === 0 ? (
              <p className="text-[0.9em] text-muted">Тэмдэглээ байхгүй.</p>
            ) : (
              availability.slice(-12).map((row) => (
                <p key={row.id} className="flex items-center gap-2 text-[0.9em]">
                  <CalendarCheck aria-hidden className="size-4 text-primary" />
                  {formatDateMn(row.day)}, {slotLabels[row.slot]} ·{" "}
                  <span className="text-[0.8em] text-muted">
                    {row.status === "confirmed"
                      ? "Баталгаажсан"
                      : row.status === "booked"
                        ? "Ажилтай"
                        : "Чөлөөтэй"}
                  </span>
                </p>
              ))
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Phone aria-hidden className="size-5 text-primary" />
            Админ тэмдэглэл
          </h2>
          <WorkerNoteEditor workerId={worker.id} initial={note ?? ""} />
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <ClipboardList aria-hidden className="size-5 text-primary" />
            Ажлын түүх ({assignmentRows.length})
          </h2>
          {assignmentRows.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Ажлын түүх байхгүй"
              body="Томилсон ажлыг энд харна."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {assignmentRows.map((assignment) => {
                const job = jobTitles.get(assignment.job_id);
                return (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-container px-3 py-2 text-[0.9em]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{job?.title ?? "Ажил"}</span>
                      <span className="text-[0.8em] text-muted">
                        {job ? formatDateMn(job.job_date, false) : ""}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-container px-2 py-1 text-[0.8em] font-semibold">
                      {assignment.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="st-note">
          <UserCog aria-hidden className="size-4 shrink-0" />
          Зөвхөн таны ажилтан харагдана.
          <Link href="/calendar" className="press font-semibold text-primary">
            Календар
          </Link>
        </div>
      </div>

      <ContactLogBar workerId={worker.id} note={note ?? ""} />
    </>
  );
}
