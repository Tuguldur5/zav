import { requireRole } from "@/lib/auth";
import { TopAppBar } from "@/components/ui/TopAppBar";
import type { DayMark } from "@/components/ui/Calendar";
import type { Availability } from "@/lib/types";
import { WorkerCalendar } from "./WorkerCalendar";

export const dynamic = "force-dynamic";

export default async function WorkerCalendarPage() {
  const { supabase, user } = await requireRole(["worker"]);

  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("worker_id", user.id)
    .order("day");

  const rows = (data as Availability[] | null) ?? [];
  const marks: Record<string, DayMark> = {};
  for (const row of rows) {
    marks[row.day] = {
      slot: row.slot,
      status: row.status,
      createdByStaff: row.created_by_staff,
    };
  }

  return (
    <>
      <TopAppBar title="Миний календар" subtitle="Чөлөөт өдрөө тэмдэглэнэ" />
      <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-4">
        <WorkerCalendar initialMarks={marks} />
      </main>
    </>
  );
}
