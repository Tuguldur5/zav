import { Search, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader, StaffEmpty } from "@/components/staff";
import { DataTable } from "@/components/ui/DataTable";
import { StatusPill } from "@/components/ui/StatusPill";
import { profileStatus } from "@/lib/status";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = {
  profile: Profile;
  adminName: string;
  intakeStatus: string;
  districtName: string;
};

export default async function SuperWorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const { supabase } = await requireRole(["super_admin"]);

  const [detailsResult, loadsResult, districtsResult] = await Promise.all([
    supabase.from("worker_details").select("*"),
    supabase.rpc("admin_loads"),
    supabase.from("districts").select("*"),
  ]);

  const details =
    (detailsResult.data as Array<{
      worker_id: string;
      admin_id: string | null;
      intake_status: string;
    }> | null) ?? [];
  const loads = (loadsResult.data as Array<{ id: string; full_name: string }> | null) ?? [];
  const districts = (districtsResult.data as Array<{ id: string; name: string }> | null) ?? [];
  const adminName = new Map(loads.map((row) => [row.id, row.full_name]));
  const districtName = new Map(districts.map((row) => [row.id, row.name]));
  const ids = details.map((row) => row.worker_id);

  let profiles: Profile[] = [];
  if (ids.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", ids);
    profiles = (data as Profile[] | null) ?? [];
  }
  const profileMap = new Map(profiles.map((row) => [row.id, row]));

  const allRows: Row[] = details
    .map((detail) => {
      const profile = profileMap.get(detail.worker_id);
      if (!profile) return null;
      return {
        profile,
        adminName: detail.admin_id ? (adminName.get(detail.admin_id) ?? "—") : "Хуваариалаагүй",
        intakeStatus: detail.intake_status,
        districtName: districtName.get(profile.district_id ?? "") ?? "—",
      };
    })
    .filter((row): row is Row => row !== null)
    .sort((a, b) => a.profile.full_name.localeCompare(b.profile.full_name, "mn"));

  const rows = q
    ? allRows.filter(
        (row) =>
          row.profile.full_name.toLowerCase().includes(q) ||
          row.districtName.toLowerCase().includes(q),
      )
    : allRows;
  const unassigned = allRows.filter((row) => row.intakeStatus !== "assigned").length;
  const inactive = allRows.filter((row) => row.profile.status !== "active").length;

  return (
    <>
      <PageHeader
        title="Ажилчид"
        subtitle={`Нийт ${allRows.length} · хуваарилаагүй ${unassigned} · идэвхгүй ${inactive}`}
        actions={
          <form method="GET" className="st-note w-full sm:w-72">
            <Search aria-hidden className="size-4 shrink-0" />
            <label htmlFor="q" className="sr-only">
              Ажилтан хайх
            </label>
            <input
              id="q"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Нэр эсвэл дүүрэг"
              className="min-w-0 flex-1 bg-transparent outline-none"
              autoComplete="off"
            />
            <button type="submit" className="press shrink-0 text-[13px] font-semibold">
              Хайх
            </button>
          </form>
        }
      />

      <DataTable
        caption="Ажилчид"
        columns={[
          { key: "name", header: "Нэр", primary: true },
          { key: "phone", header: "Утас" },
          { key: "district", header: "Дүүрэг" },
          { key: "admin", header: "Админ" },
          { key: "status", header: "Төлөв" },
          { key: "intake", header: "Анхны төлөв", secondary: true },
        ]}
        rows={rows.map((row) => ({
          id: row.profile.id,
          href: `/workers/${row.profile.id}`,
          cells: [
            row.profile.full_name,
            row.profile.phone ?? "—",
            row.districtName,
            row.adminName,
            <StatusPill key="status" status={row.profile.status} table={profileStatus} />,
            row.intakeStatus === "assigned" ? "Хуваарилагдсан" : "Шинэ",
          ],
        }))}
        empty={
          <StaffEmpty
            title={q ? "Тохирох ажилтан олдсонгүй" : "Ажилтан байхгүй"}
            body={q ? "Өөр нэрээр хайна уу." : "Шинэ ажилтан бүртгүүлмэгц энд харагдана."}
          />
        }
      />

      <p className="st-note">
        <Users aria-hidden className="size-4 shrink-0" />
        Ажилтны дэлгэрэнгүй хуудас нь тухайн ажилтныг хариуцаж буй админд нээгдэнэ.
      </p>
    </>
  );
}
