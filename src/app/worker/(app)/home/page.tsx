import Link from "next/link";
import { CalendarDays, MapPin, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Container, Card, EmptyBox, PageTitle, StatusTag, buttonCls } from "@/components/public/ui";
import { OfferActions } from "@/components/app/OfferActions";
import { PushCard } from "@/components/push/PushCard";
import { InstallHint } from "@/components/public/InstallHint";
import { formatDateMn, formatMoney, todayISO } from "@/lib/dates";
import { slotLabels } from "@/lib/status";
import type { WorkerJobRow, WorkerAdminContact } from "../types";

export const dynamic = "force-dynamic";

export default async function WorkerHomePage() {
  const { supabase, profile } = await requireRole(["worker"]);

  const [jobsResult, contactResult] = await Promise.all([
    supabase.rpc("worker_jobs"),
    supabase.rpc("worker_admin_contact"),
  ]);

  const rows = (jobsResult.data as WorkerJobRow[] | null) ?? [];
  const admin = (contactResult.data as WorkerAdminContact[] | null)?.[0];
  const offers = rows.filter((row) => row.assignment_status === "offered");
  const awaiting = rows.filter((row) => row.assignment_status === "accepted");
  const confirmed = rows
    .filter(
      (row) =>
        row.assignment_status === "confirmed" &&
        row.job_status !== "cancelled" &&
        row.job_date >= todayISO(),
    )
    .sort((a, b) => a.job_date.localeCompare(b.job_date));
  const nextJob = confirmed[0] ?? null;

  return (
    <Container className="py-6 sm:py-8">
      <PageTitle
        title="Нүүр"
        lead={
          profile.status === "pending"
            ? "Таны бүртгэлийг админ шалгаж байна. Түр хүлээнэ үү."
            : "Шинэ саналаа хурдан хариулаарай. Чөлөөт өдрөө тэмдэглэснээр ажил ирнэ."
        }
        action={
          <Link href="/calendar" className={buttonCls("secondary")}>
            <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
            Календарь
          </Link>
        }
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {offers.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-[0.92em] font-semibold text-muted">Шинэ санал ({offers.length})</h2>
              {offers.map((offer) => (
                <Card key={offer.assignment_id} className="border-primary p-4">
                  <p className="font-medium">{offer.title}</p>
                  <p className="mt-1 flex items-center gap-2 text-[0.9em] text-muted">
                    <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
                    {formatDateMn(offer.job_date)} · {slotLabels[offer.job_slot]}
                  </p>
                  <p className="mt-1 font-medium">{formatMoney(offer.pay_offer)}</p>
                  <div className="mt-3">
                    <OfferActions assignmentId={offer.assignment_id} />
                  </div>
                  <Link
                    href={`/offers/${offer.assignment_id}`}
                    className="mt-3 inline-block text-[0.88em] text-primary underline underline-offset-2"
                  >
                    Дэлгэрэнгүй харах
                  </Link>
                </Card>
              ))}
            </section>
          ) : null}

          {awaiting.length > 0 ? (
            <Card className="p-4">
              <StatusTag tone="warm">Хариу хүлээж байна</StatusTag>
              {awaiting.map((row) => (
                <p key={row.assignment_id} className="mt-1 text-[0.9em] text-muted">
                  {row.title} · {formatDateMn(row.job_date)} — админ баталгаажуулна.
                </p>
              ))}
            </Card>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-[0.92em] font-semibold text-muted">Дараагийн ажил</h2>
            {nextJob ? (
              <Card className="p-4">
                <StatusTag tone="success">Баталгаажсан</StatusTag>
                <p className="mt-2 font-medium">{nextJob.title}</p>
                <p className="mt-1 flex items-center gap-2 text-[0.9em] text-muted">
                  <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
                  {formatDateMn(nextJob.job_date)} · {slotLabels[nextJob.job_slot]}
                </p>
                <p className="mt-2 flex items-start gap-2 rounded-[8px] bg-surface2 px-3 py-2 text-[0.92em]">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.75} />
                  {nextJob.address_note}
                </p>
                <p className="mt-2 font-medium">{formatMoney(nextJob.pay_offer)}</p>
              </Card>
            ) : (
              <EmptyBox
                title="Одоогоор баталгаажсан ажил байхгүй"
                body="Чөлөөт өдрөө тэмдэглэвэл админ тань тохирох ажлын санал илгээнэ."
                action={
                  <Link href="/calendar" className={buttonCls("primary")}>
                    Чөлөөт өдрөө тэмдэглэх
                  </Link>
                }
              />
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <p className="font-medium">Таны админ</p>
            {admin?.admin_name ? (
              <>
                <p className="mt-1 text-[0.95em]">{admin.admin_name}</p>
                {admin.admin_phone ? (
                  <a
                    href={`tel:${admin.admin_phone.replace(/[^\d+]/g, "")}`}
                    className={`${buttonCls("secondary", true)} mt-3`}
                  >
                    <Phone aria-hidden className="size-4" strokeWidth={1.75} />
                    Залгах
                  </a>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-[0.9em] text-muted">
                Таныг админд хуваарилж байна, түр хүлээнэ үү.
              </p>
            )}
          </Card>

          <PushCard />
          <InstallHint compact />
        </aside>
      </div>
    </Container>
  );
}
