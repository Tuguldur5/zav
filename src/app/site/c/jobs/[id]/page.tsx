import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Check, Circle, Clock, MapPin, Phone, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSupportPhone } from "@/lib/settings";
import { Container, Card, Note, StatusTag, buttonCls } from "@/components/public/ui";
import { formatDateMn, formatDateTimeMn, formatMoney } from "@/lib/dates";
import { orderStatus, slotLabels } from "@/lib/status";
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

const STEPS = ["Хүлээн авсан", "Админ авсан", "Ажилтан олдлоо", "Баталгаажсан", "Дууссан"];

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
  const meta = orderStatus[job.status] ?? orderStatus.new;

  return (
    <Container className="py-6 sm:py-8">
      <Link href="/c" className="text-[0.9em] text-muted hover:text-primary">
        ← Миний захиалгууд
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <h1 className="text-[24px] font-semibold leading-[30px] sm:text-[28px] sm:leading-[32px]">
              {job.title}
            </h1>
            <p className="mt-1 text-[0.9em] text-muted">
              <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
              <span> · Илгээсэн: {formatDateTimeMn(job.created_at)}</span>
            </p>
          </div>

          {job.status === "cancelled" ? (
            <Note tone="err">Энэ захиалга цуцлагдсан.</Note>
          ) : null}

          <Card className="flex flex-col gap-3 p-4">
            <p className="flex items-center gap-2">
              <CalendarDays aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
              {formatDateMn(job.job_date)}
              <span className="flex items-center gap-1 text-[0.9em] text-muted">
                <Clock aria-hidden className="size-4" strokeWidth={1.75} />
                {slotLabels[job.job_slot]}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
              <span>
                {district ?? "Дүүрэг"}, {job.address_note}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Users aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
              {job.workers_needed} ажилтан · {formatMoney(job.pay_offer)}
            </p>
            {job.description ? (
              <p className="rounded-[8px] bg-surface2 px-3 py-2 text-[0.9em]">{job.description}</p>
            ) : null}
          </Card>

          <Card className="p-4">
            <h2 className="text-[0.95em] font-semibold">Явц</h2>
            <ol className="mt-3 flex flex-col">
              {STEPS.map((label, index) => {
                const done = current > index || job.status === "done";
                const active = current === index && job.status !== "done";
                return (
                  <li key={label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex size-6 items-center justify-center rounded-full ${
                          done
                            ? "bg-ok text-white"
                            : active
                              ? "bg-primary text-on-primary"
                              : "bg-surface2 text-muted"
                        }`}
                      >
                        {done ? (
                          <Check aria-hidden className="size-3.5" strokeWidth={2} />
                        ) : (
                          <Circle aria-hidden className="size-3" strokeWidth={2} />
                        )}
                      </span>
                      {index < STEPS.length - 1 ? (
                        <span className={`h-6 w-px ${done ? "bg-ok" : "bg-divider"}`} />
                      ) : null}
                    </div>
                    <p
                      className={`pb-3 text-[0.92em] ${
                        active ? "font-medium" : done ? "text-ink" : "text-muted"
                      }`}
                    >
                      {label}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Card>

          {canCancel ? <CancelJobButton jobId={job.id} /> : null}
        </div>

        <aside className="flex flex-col gap-4">
          {assignments.length > 0 ? (
            <Card className="p-4">
              <h2 className="text-[0.95em] font-semibold">Таны ажилтан</h2>
              <div className="mt-3 flex flex-col gap-3">
                {assignments.map((assignment) => (
                  <div key={assignment.assignment_id}>
                    <p className="font-medium">{assignment.worker_first_name}</p>
                    <p className="text-[0.88em] text-muted">{assignment.skill}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="p-4">
            <h2 className="text-[0.95em] font-semibold">Хариуцсан админ</h2>
            {admin?.admin_name ? (
              <>
                <p className="mt-2 font-medium">{admin.admin_name}</p>
                {admin.admin_phone ? (
                  <a
                    href={`tel:${admin.admin_phone.replace(/[^\d+]/g, "")}`}
                    className={`${buttonCls("primary", true)} mt-3`}
                  >
                    <Phone aria-hidden className="size-4" strokeWidth={1.75} />
                    Админд залгах
                  </a>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-[0.9em] text-muted">
                Манай админ захиалгыг удахгүй хүлээж авна. Түр хүлээнэ үү.
              </p>
            )}
            {supportPhone ? (
              <a href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`} className="mt-3 block text-[0.88em] text-muted">
                Тусламж: {supportPhone}
              </a>
            ) : null}
          </Card>

          <Card className="p-4 text-[0.88em] text-muted">
            Ажилтны утас танд харагдахгүй. Асуудал гарвал админтай холбогдоно уу.
          </Card>
        </aside>
      </div>
    </Container>
  );
}
