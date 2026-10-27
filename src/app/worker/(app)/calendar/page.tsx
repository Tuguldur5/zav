import { requireRole } from "@/lib/auth";
import { Container, PageTitle } from "@/components/public/ui";
import { FreeCalendar, type Mark } from "@/components/public/FreeCalendar";
import { todayISO } from "@/lib/dates";
import type { Availability } from "@/lib/types";
import { mn } from "@/lib/i18n/mn";

export const dynamic = "force-dynamic";

export default async function WorkerCalendarPage() {
  const { supabase, user } = await requireRole(["worker"]);

  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("worker_id", user.id)
    .order("day");

  const rows = (data as Availability[] | null) ?? [];
  const marks: Record<string, Mark> = {};
  for (const row of rows) {
    marks[row.day] = {
      slot: row.slot,
      status: row.status,
      createdByStaff: row.created_by_staff,
    };
  }

  return (
    <Container className="py-6 sm:py-8">
      <PageTitle
        title={mn.app.calendar.pageTitle}
        lead={mn.app.calendar.pageLead}
      />
      <div className="mt-6">
        <FreeCalendar initialMarks={marks} today={todayISO()} />
      </div>
    </Container>
  );
}
