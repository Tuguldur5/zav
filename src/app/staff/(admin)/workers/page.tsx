import { Search } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageTitle } from "@/components/staff";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyWorkers } from "@/components/art/EmptyArts";
import { profileStatus } from "@/lib/status";
import type { Availability, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type WorkerRow = {
  profile: Profile;
  hasTransport: boolean;
  experience: string | null;
  intakeStatus: string;
};

export default async function AdminWorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; focus?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const focus = params.focus === "q";
  const { supabase, user, profile } = await requireRole(["admin", "super_admin"]);
  const superAdmin = profile.role === "super_admin";

  let query = supabase
    .from("worker_details")
    .select("worker_id, has_transport, experience_note, intake_status");
  if (!superAdmin) query = query.eq("admin_id", user.id);
  const { data: details } = await query;
  const rows =
    (details as Array<{
      worker_id: string;
      has_transport: boolean;
      experience_note: string | null;
      intake_status: string;
    }> | null) ?? [];
  const ids = rows.map((row) => row.worker_id);

  let profiles: Profile[] = [];
  let availability: Availability[] = [];
  if (ids.length > 0) {
    const [profilesResult, availabilityResult] = await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase
        .from("availability")
        .select("*")
        .in("worker_id", ids)
        .gte(
          "day",
          new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ulaanbaatar",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date()),
        ),
    ]);
    profiles = (profilesResult.data as Profile[] | null) ?? [];
    availability = (availabilityResult.data as Availability[] | null) ?? [];
  }

  const detailMap = new Map(rows.map((row) => [row.worker_id, row]));
  let workers: WorkerRow[] = profiles
    .filter((item) => item.role === "worker")
    .filter((item) => !q || item.full_name.toLowerCase().includes(q.toLowerCase()))
    .map((item) => ({
      profile: item,
      hasTransport: detailMap.get(item.id)?.has_transport ?? false,
      experience: detailMap.get(item.id)?.experience_note ?? null,
      intakeStatus: detailMap.get(item.id)?.intake_status ?? "new",
    }));
  workers = workers.sort((a, b) => a.profile.full_name.localeCompare(b.profile.full_name, "mn"));

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const freeCount = (workerId: string) =>
    availability.filter(
      (row) => row.worker_id === workerId && row.day >= today && row.status !== "booked",
    ).length;

  return (
    <>
      <PageTitle
        title="Миний ажилчид"
        emoji="👥"
        subtitle={`Нийт ${workers.length} ажилтан${q ? ` · хайлт: ${q}` : ""}`}
        search={
          <form method="GET" className="staff-search w-full sm:w-72">
            <Search aria-hidden className="size-4 shrink-0" />
            <label htmlFor="q" className="sr-only">
              Ажилтан хайх
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Нэрээр хайх"
              autoFocus={focus}
              autoComplete="off"
            />
            <button type="submit" className="press shrink-0 text-[0.85em] font-semibold">
              Хайх
            </button>
          </form>
        }
      />

      <DataTable
        caption="Ажилтнууд"
        columns={[
          { key: "name", header: "Нэр", primary: true },
          { key: "phone", header: "Утас" },
          { key: "status", header: "Төлөв" },
          { key: "intake", header: "Анхны төлөв", secondary: true },
          { key: "free", header: "Чөлөөт өдөр", secondary: true },
        ]}
        rows={workers.map((row) => ({
          id: row.profile.id,
          href: `/workers/${row.profile.id}`,
          cells: [
            row.profile.full_name,
            row.profile.phone ?? "—",
            <StatusPill key="status" status={row.profile.status} table={profileStatus} />,
            row.intakeStatus === "assigned" ? "Хуваарилагдсан" : "Шинэ",
            `${freeCount(row.profile.id)} өдөр`,
          ],
        }))}
        empty={
          <EmptyState
            art={<EmptyWorkers className="h-auto w-full" />}
            title={q ? "Тохирох ажилтан олдсонгүй" : "Ажилтан байхгүй байна"}
            body={
              q ? "Өөр нэрээр эсвэл цэвэрлээд хайна уу." : "Супер админ таныг ажилтанд хуваарилна."
            }
          />
        }
      />

      <p className="staff-banner">
        <Search aria-hidden className="size-4 shrink-0" />
        Мөр дээр дарж ажилтны хуудас руу орно. Дэлгэц дээр хүснэгт, утас дээр карт харагдана.
      </p>
    </>
  );
}
