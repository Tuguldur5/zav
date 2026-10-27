import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Container, Card, EmptyBox, PageTitle, buttonCls } from "@/components/public/ui";
import { OfferActions } from "@/components/app/OfferActions";
import { formatDateMn, formatMoney } from "@/lib/dates";
import { slotLabels } from "@/lib/status";
import type { WorkerJobRow } from "../types";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const { supabase } = await requireRole(["worker"]);
  const { data } = await supabase.rpc("worker_jobs");
  const rows = ((data as WorkerJobRow[] | null) ?? []).filter(
    (row) => row.assignment_status === "offered",
  );

  return (
    <Container className="py-6 sm:py-8">
      <PageTitle title="Санал" lead="Хариу өгөхөө мартуузай. Санал цуцлагдаж болно." />

      <div className="mt-6 flex flex-col gap-3">
        {rows.length === 0 ? (
          <EmptyBox
            title="Одоогоор санал байхгүй"
            body="Чөлөөт өдрөө тэмдэглэсэн бол админ тань тохирох ажилд санал болгоно."
            action={
              <Link href="/calendar" className={buttonCls("primary")}>
                Чөлөөт өдөр тэмдэглэх
              </Link>
            }
          />
        ) : (
          rows.map((offer) => (
            <Card key={offer.assignment_id} className="flex flex-col gap-2 p-4">
              <Link href={`/offers/${offer.assignment_id}`} className="font-medium hover:text-primary">
                {offer.title}
              </Link>
              <p className="flex items-center gap-2 text-[0.9em] text-muted">
                <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
                {formatDateMn(offer.job_date)} · {slotLabels[offer.job_slot]}
              </p>
              <p className="font-medium">{formatMoney(offer.pay_offer)}</p>
              <div className="mt-1">
                <OfferActions assignmentId={offer.assignment_id} />
              </div>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
}
