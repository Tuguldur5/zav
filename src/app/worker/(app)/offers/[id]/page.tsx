import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Container, Card, Note, StatusTag } from "@/components/public/ui";
import { OfferActions } from "@/components/app/OfferActions";
import { formatDateMn, formatMoney } from "@/lib/dates";
import { assignmentStatus, slotLabels } from "@/lib/status";
import type { WorkerJobRow } from "../../types";

export const dynamic = "force-dynamic";

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole(["worker"]);

  const { data } = await supabase.rpc("worker_jobs");
  const rows = (data as WorkerJobRow[] | null) ?? [];
  const offer = rows.find((row) => row.assignment_id === id);
  if (!offer) notFound();

  const { data: district } = await supabase
    .from("districts")
    .select("name")
    .eq("id", offer.district_id)
    .maybeSingle();
  const { data: skill } = await supabase
    .from("skills")
    .select("name")
    .eq("id", offer.skill_id)
    .maybeSingle();

  const meta = assignmentStatus[offer.assignment_status] ?? assignmentStatus.offered;
  const addressVisible = ["confirmed", "completed"].includes(offer.assignment_status);

  return (
    <Container className="max-w-[720px] py-6 sm:py-8">
      <Link href="/offers" className="text-[0.9em] text-muted hover:text-primary">
        ← Санал
      </Link>

      <div className="mt-3">
        <h1 className="text-[24px] font-semibold leading-[30px] sm:text-[28px] sm:leading-[32px]">
          {offer.title}
        </h1>
        <div className="mt-2"><StatusTag tone={meta.tone}>{meta.label}</StatusTag></div>
      </div>

      <Card className="mt-5 flex flex-col gap-3 p-4">
        <p className="flex items-center gap-2">
          <CalendarDays aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
          {formatDateMn(offer.job_date)}
        </p>
        <p className="flex items-center gap-2">
          <Clock aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
          {slotLabels[offer.job_slot]}
        </p>
        <p className="flex items-center gap-2">
          <MapPin aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
          {district?.name ?? "Дүүрэг"}
        </p>
        <p className="flex items-center gap-2">
          <Wallet aria-hidden className="size-4 text-primary" strokeWidth={1.75} />
          {formatMoney(offer.pay_offer)}
        </p>
        <p className="text-[0.9em] text-muted">
          Мэргэжил: {skill?.name ?? "—"} · {offer.workers_needed} ажилтан
        </p>
        {offer.description ? (
          <p className="rounded-[8px] bg-surface2 px-3 py-2 text-[0.92em]">{offer.description}</p>
        ) : null}
      </Card>

      <div className="mt-4">
        {addressVisible ? (
          <Note tone="ok">Хаяг: {offer.address_note}</Note>
        ) : (
          <Note>Ажлын хаяг зөвхөн баталгаажсаны дараа харагдана.</Note>
        )}
      </div>

      <div className="mt-4">
        {offer.assignment_status === "offered" ? <OfferActions assignmentId={offer.assignment_id} /> : null}
      </div>
    </Container>
  );
}
