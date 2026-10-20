import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Check, Circle, Clock, MapPin, Phone, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSupportPhone } from "@/lib/settings";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { Card } from "@/components/ui/Card";
import { PhoneButton } from "@/components/ui/PhoneButton";
import { StatusPill } from "@/components/ui/StatusPill";
import { jobStatus, slotLabels } from "@/lib/status";
import { formatDateMn, formatDateTimeMn, formatMoney } from "@/lib/dates";
import type { Job } from "@/lib/types";
import { CancelJobButton } from "./CancelJobButton";

export const dynamic = "force-dynamic";

type CustomerAssignment = {
  assignment_id: string;
  worker_first_name: string;
  skill: string;
  admin_name: string | null;
  admin_phone: string | null;
  status: string;
};

const steps = [
  "Зар илгээсэн",
  "Админ хүлээж авсан",
  "Ажилтан хайж байна",
  "Ажилтан баталгаажсан",
  "Ажил дууссан",
];

function stepIndex(status: string): number {
  if (status === "new") return 0;
  if (status === "claimed") return 1;
  if (status === "matched") return 2;
  if (status === "confirmed") return 3;
  if (status === "done") return 4;
  return -1;
}

export default async function CustomerJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole(["customer"]);

  const { data: jobData } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (!jobData) notFound();
  const job = jobData as Job;

  const [districtResult, workersResult, adminResult, supportPhone] = await Promise.all([
    supabase.from("districts").select("name").eq("id", job.district_id).maybeSingle(),
    supabase.rpc("customer_job_assignments", { p_job: id }),
    supabase.rpc("customer_job_admin", { p_job: id }),
    getSupportPhone(),
  ]);

  const district = districtResult.data?.name as string | undefined;
  const assignments = (workersResult.data as CustomerAssignment[] | null) ?? [];
  const admin = (
    adminResult.data as Array<{ admin_name: string | null; admin_phone: string | null }> | null
  )?.[0];
  const current = stepIndex(job.status);
  const canCancel = ["new", "claimed", "matched"].includes(job.status);

  return (
    <>
      <TopAppBar title="Зарын дэлгэрэнгүй" backHref="/c/jobs" />
      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[1.2em] font-semibold">{job.title}</h2>
              <StatusPill status={job.status} table={jobStatus} />
            </div>
            <p className="text-[0.9em] text-muted">Илгээсэн: {formatDateTimeMn(job.created_at)}</p>
          </Card>

          {job.status === "done" ? (
            <Card className="flex items-center gap-3 bg-success-container text-success">
              <span className="flex size-12 items-center justify-center rounded-full bg-surface">
                <Check aria-hidden className="size-7" />
              </span>
              <div>
                <p className="font-semibold">Ажил амжилттай дууссан</p>
                <p className="text-[0.9em]">Баярлалаа. Дараагийн ажилдаа бидэнтэй хамтраарай.</p>
              </div>
            </Card>
          ) : null}

          <Card className="grid gap-3">
            <p className="flex items-center gap-2">
              <CalendarDays aria-hidden className="size-5 text-primary" />
              <span>{formatDateMn(job.job_date)}</span>
              <span className="flex items-center gap-1 text-[0.9em] text-muted">
                <Clock aria-hidden className="size-4" />
                {slotLabels[job.job_slot]}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>
                {district ?? "Дүүрэг"}, {job.address_note}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Users aria-hidden className="size-5 text-primary" />
              {job.workers_needed} ажилтан · {formatMoney(job.pay_offer)}
            </p>
            {job.description ? (
              <p className="rounded-md bg-bg px-3 py-2 text-[0.9em]">{job.description}</p>
            ) : null}
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold">Явц</h3>
            <ol className="flex flex-col gap-0">
              {steps.map((label, index) => {
                const done = current > index || job.status === "done";
                const active = current === index && job.status !== "done";
                return (
                  <li key={label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex size-7 items-center justify-center rounded-full ${
                          done
                            ? "bg-success text-white"
                            : active
                              ? "bg-primary text-on-primary"
                              : "bg-container text-muted"
                        }`}
                      >
                        {done ? (
                          <Check aria-hidden className="size-4" />
                        ) : (
                          <Circle aria-hidden className="size-4" />
                        )}
                      </span>
                      {index < steps.length - 1 ? (
                        <span className={`h-6 w-0.5 ${done ? "bg-success" : "bg-container"}`} />
                      ) : null}
                    </div>
                    <p
                      className={`pb-3 text-[0.9em] ${active ? "font-semibold" : done ? "text-ink" : "text-muted"}`}
                    >
                      {label}
                    </p>
                  </li>
                );
              })}
            </ol>
            {job.status === "cancelled" ? (
              <p className="mt-2 rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
                Энэ зар цуцлагдсан.
              </p>
            ) : null}
          </Card>

          {canCancel ? <CancelJobButton jobId={job.id} /> : null}

          <Link
            href="/c/jobs"
            className="text-center text-[0.9em] text-primary underline underline-offset-2"
          >
            Миний зарууд руу буцах
          </Link>
        </div>

        {/* Sticky contact column on >=1024px; stacks below on phones. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          {assignments.length > 0 ? (
            <Card className="flex flex-col gap-3">
              <h3 className="font-semibold">Таны ажилтан</h3>
              {assignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="rounded-md border border-container p-3"
                >
                  <p className="font-semibold">{assignment.worker_first_name}</p>
                  <p className="text-[0.9em] text-muted">{assignment.skill}</p>
                </div>
              ))}
            </Card>
          ) : null}

          <Card className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Phone aria-hidden className="size-5 text-primary" />
              Хариуцсан админ
            </h3>
            {admin?.admin_name ? (
              <>
                <p className="font-medium">{admin.admin_name}</p>
                <PhoneButton
                  phone={admin.admin_phone}
                  label="Админд залгах"
                  name={admin.admin_name}
                  full
                />
              </>
            ) : (
              <p className="text-[0.9em] text-muted">
                Манай админ зарыг удахгүй хүлээж авна. Түр хүлээнэ үү.
              </p>
            )}
            {supportPhone ? (
              <a
                href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`}
                className="text-[0.9em] text-primary underline"
              >
                Тусламжийн утас: {supportPhone}
              </a>
            ) : null}
          </Card>
        </aside>
      </main>
    </>
  );
}
