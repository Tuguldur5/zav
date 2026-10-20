import Link from "next/link";
import { Briefcase, CalendarDays, Check, MapPin, Phone, Smartphone, UserCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { Card } from "@/components/ui/Card";
import { PhoneButton } from "@/components/ui/PhoneButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer, SectionLabel } from "@/components/ui/Layout";
import { EmptyCalendar } from "@/components/art/EmptyArts";
import { buttonClass, cx } from "@/components/ui/styles";
import { OfferActions } from "@/components/app/OfferActions";
import { MiniMonth } from "@/components/app/MiniMonth";
import type { DayMark } from "@/components/ui/Calendar";
import { slotLabels } from "@/lib/status";
import { formatDateMn, formatMoney, todayISO } from "@/lib/dates";
import type { WorkerJobRow, WorkerAdminContact, AvailabilityRow } from "./types";

export const dynamic = "force-dynamic";

export default async function WorkerHomePage() {
  const { supabase, profile } = await requireRole(["worker"]);

  const [jobsResult, contactResult, availabilityResult] = await Promise.all([
    supabase.rpc("worker_jobs"),
    supabase.rpc("worker_admin_contact"),
    supabase.from("availability").select("day, slot, status, confirmed_at, created_by_staff"),
  ]);

  const rows = (jobsResult.data as WorkerJobRow[] | null) ?? [];
  const admin = (contactResult.data as WorkerAdminContact[] | null)?.[0];
  const availability = (availabilityResult.data as AvailabilityRow[] | null) ?? [];
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
  const firstName = profile.full_name.split(" ")[0] || "найз";

  const marks: Record<string, DayMark> = {};
  for (const row of availability) {
    marks[row.day] = {
      slot: row.slot,
      status: row.status,
      createdByStaff: Boolean(row.created_by_staff),
    };
  }
  const today = new Date();
  const todayInUB = new Date(today.getTime() + 8 * 60 * 60 * 1000);

  const offersAndNext = (
    <>
      {offers.length > 0 ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>Шинэ санал ({offers.length})</SectionLabel>
          <div className="flex flex-col gap-3">
            {offers.map((offer) => (
              <Card key={offer.assignment_id} className="flex flex-col gap-3 border-primary">
                <p className="text-[1.05em] font-semibold">{offer.title}</p>
                <p className="flex items-center gap-2 text-[0.9em]">
                  <CalendarDays aria-hidden className="size-4 text-primary" />
                  {formatDateMn(offer.job_date)} · {slotLabels[offer.job_slot]}
                </p>
                <p className="font-semibold">{formatMoney(offer.pay_offer)}</p>
                <OfferActions assignmentId={offer.assignment_id} />
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {awaiting.length > 0 ? (
        <Card className="flex flex-col gap-2 border-warm-ink bg-warm text-warm-ink">
          <p className="font-semibold">Хариу хүлээж байна</p>
          {awaiting.map((row) => (
            <p key={row.assignment_id} className="text-[0.9em]">
              {row.title} · {formatDateMn(row.job_date)} — админ баталгаажуулна.
            </p>
          ))}
        </Card>
      ) : null}

      <div className="flex flex-col gap-3">
        <SectionLabel>Дараагийн ажил</SectionLabel>
        {nextJob ? (
          <Card className="flex flex-col gap-3">
            <p className="inline-flex items-center gap-2 text-[0.9em] font-medium text-success">
              <Check aria-hidden className="size-4" />
              Баталгаажсан
            </p>
            <p className="text-[1.05em] font-semibold">{nextJob.title}</p>
            <p className="flex items-center gap-2 text-[0.9em]">
              <CalendarDays aria-hidden className="size-4 text-primary" />
              {formatDateMn(nextJob.job_date)} · {slotLabels[nextJob.job_slot]}
            </p>
            <p className="flex items-start gap-2 rounded-md bg-surface2 px-3 py-2">
              <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>{nextJob.address_note}</span>
            </p>
            <p className="font-semibold">{formatMoney(nextJob.pay_offer)}</p>
          </Card>
        ) : (
          <EmptyState
            art={<EmptyCalendar className="h-auto w-full" />}
            title="Одоогоор ажил байхгүй"
            body="Чөлөөт өдрөө тэмдэглэвэл админ тань тохирох ажилд санал болгоно."
            action={
              <Link href="/w/calendar" className="w-full sm:w-auto">
                <Button full>Чөлөөт өдрөө тэмдэглэх</Button>
              </Link>
            }
          />
        )}
      </div>
    </>
  );

  const sideColumn = (
    <>
      <Card className="flex flex-col gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Briefcase aria-hidden className="size-5 text-primary" />
          Таны админ
        </p>
        {admin?.admin_name ? (
          <>
            <p className="text-[0.95em]">{admin.admin_name}</p>
            <PhoneButton
              phone={admin.admin_phone}
              label="Админд залгах"
              name={admin.admin_name}
              full
            />
          </>
        ) : (
          <p className="text-[0.9em] text-muted">Таныг админд хуваарилж байна, түр хүлээнэ үү.</p>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">Миний чөлөөт өдөр</p>
          <Link href="/w/calendar" className="text-[0.9em] font-medium text-primary">
            Засах
          </Link>
        </div>
        <MiniMonth
          year={todayInUB.getUTCFullYear()}
          month={todayInUB.getUTCMonth() + 1}
          marks={marks}
        />
        <ul className="flex flex-wrap gap-2 text-[0.8em]">
          <li className="flex items-center gap-1.5 rounded-full bg-primary-container px-2.5 py-1 text-on-primary-container">
            <UserCheck aria-hidden className="size-3.5" /> Чөлөөтэй
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-success-container px-2.5 py-1 text-success">
            <Check aria-hidden className="size-3.5" /> Баталгаажсан
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-warm px-2.5 py-1 text-warm-ink">
            <Briefcase aria-hidden className="size-3.5" /> Ажилтай
          </li>
        </ul>
      </Card>

      <Card className="flex items-start gap-3">
        <Smartphone aria-hidden className="size-6 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="font-semibold">Нүүр дэлгэцэнд нэмэх</p>
          <p className="text-[0.9em] text-muted">
            Safari эсвэл Chrome-оос нүүр дэлгэцэнд нэмээд шууд нээх боломжтой.
          </p>
          <Link
            href="/help#install"
            className="mt-1 inline-flex min-h-11 items-center gap-1 text-[0.9em] font-medium text-primary underline underline-offset-2"
          >
            <Phone aria-hidden className="size-4" />
            Хэрхэн нэмэх вэ?
          </Link>
        </div>
      </Card>
    </>
  );

  return (
    <>
      <TopAppBar title={`Сайн байна уу, ${firstName}`} subtitle="Өнөөдрийн байдал" />
      <PageContainer>
        <Card className="greeting-band flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Сайн байна уу</p>
            <p className="mt-1 text-[1.35em] font-semibold">{firstName}</p>
            <p className="mt-1 max-w-xl text-[0.9em] text-muted">
              Шинэ саналыг хурдан хариулаарай. Чөлөөт өдрөө тэмдэглэснээр шинэ ажил ирнэ.
            </p>
          </div>
          <Link href="/w/calendar" className={cx(buttonClass("filled"), "shrink-0")}>
            <CalendarDays aria-hidden className="size-4" />
            Чөлөөт өдөр тэмдэглэх
          </Link>
        </Card>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">{offersAndNext}</div>
          <div className="flex flex-col gap-5">{sideColumn}</div>
        </div>
      </PageContainer>
    </>
  );
}
