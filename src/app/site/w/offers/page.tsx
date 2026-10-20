import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { OfferActions } from "@/components/app/OfferActions";
import { EmptyOffers } from "@/components/art/EmptyArts";
import { slotLabels } from "@/lib/status";
import { formatDateMn, formatMoney } from "@/lib/dates";
import type { WorkerJobRow } from "../types";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const { supabase } = await requireRole(["worker"]);
  const { data } = await supabase.rpc("worker_jobs");
  const rows = ((data as WorkerJobRow[] | null) ?? []).filter(
    (row) => row.assignment_status === "offered",
  );

  return (
    <>
      <TopAppBar title="Санал" subtitle="Хариу өгөхөө мартуузай" backHref="/w" />
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-4 py-4">
        {rows.length === 0 ? (
          <EmptyState
            art={<EmptyOffers className="h-auto w-full" />}
            title="Одоогоор санал байхгүй"
            body="Чөлөөт өдрөө тэмдэглэсэн бол админ тань тохирох ажилд санал болгоно."
            action={
              <Link href="/w/calendar">
                <Button>Чөлөөт өдөр тэмдэглэх</Button>
              </Link>
            }
          />
        ) : (
          rows.map((offer) => (
            <Card key={offer.assignment_id} className="flex flex-col gap-3">
              <p className="text-[1.05em] font-semibold">{offer.title}</p>
              <p className="flex items-center gap-2 text-[0.9em]">
                <CalendarDays aria-hidden className="size-4 text-primary" />
                {formatDateMn(offer.job_date)} · {slotLabels[offer.job_slot]}
              </p>
              <p className="font-semibold">{formatMoney(offer.pay_offer)}</p>
              <OfferActions assignmentId={offer.assignment_id} />
            </Card>
          ))
        )}
      </main>
    </>
  );
}
