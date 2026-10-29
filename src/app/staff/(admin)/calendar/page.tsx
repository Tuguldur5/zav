import { requireRole } from "@/lib/auth";
import { PageHeader, StatTile, StatTiles } from "@/components/staff";
import { AdminCalendar } from "@/components/app/AdminCalendar";
import { CalendarCheck, CalendarDays } from "lucide-react";
import type { DayMark } from "@/components/ui/Calendar";
import type { Availability, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const { supabase, user, profile } = await requireRole(["admin"]);
  const superAdmin = profile.role === "super_admin";

  let detailsQuery = supabase.from("worker_details").select("worker_id");
  if (!superAdmin) detailsQuery = detailsQuery.eq("admin_id", user.id);
  const { data: details } = await detailsQuery;
  const ids = ((details as Array<{ worker_id: string }> | null) ?? []).map((row) => row.worker_id);

  let workers: Profile[] = [];
  let availability: Availability[] = [];
  if (ids.length > 0) {
    const [profilesResult, availabilityResult] = await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase.from("availability").select("*").in("worker_id", ids),
    ]);
    workers = (profilesResult.data as Profile[] | null) ?? [];
    availability = (availabilityResult.data as Availability[] | null) ?? [];
  }

  const workerRows = workers
    .filter((item) => item.role === "worker")
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "mn"))
    .map((item) => {
      const days: Record<string, DayMark> = {};
      for (const row of availability) {
        if (row.worker_id === item.id) {
          days[row.day] = { slot: row.slot, status: row.status };
        }
      }
      return { id: item.id, name: item.full_name, days };
    });

  const confirmedDays = availability.filter((row) => row.status === "confirmed").length;
  const bookedDays = availability.filter((row) => row.status === "booked").length;
  const openDays = availability.filter((row) => row.status === "open").length;

  return (
    <>
      <PageHeader
        subtitle="Квадрат дээр дарж ажилтны өдрийг тэмдэглэнэ уу. Мэдэгдэл шууд ажилтны календарт орно."
      />

      <StatTiles>
        <StatTile label="Ажилтан" value={workerRows.length} icon={CalendarDays} />
        <StatTile label="Баталгаажсан өдөр" value={confirmedDays} icon={CalendarCheck} />
        <StatTile label="Ажилтай өдөр" value={bookedDays} icon={CalendarDays} />
        <StatTile
          attention={openDays > 0}
          label="Баталгаажаагүй өдөр"
          value={openDays}
          href="/today"
          icon={CalendarCheck}
        />
      </StatTiles>

      <AdminCalendar workers={workerRows} />
    </>
  );
}
