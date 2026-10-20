import Link from "next/link";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageTitle, SectionHeader } from "@/components/staff";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
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

export default async function SuperWorkersPage() {
  const { supabase } = await requireRole(["super_admin"]);

  const [detailsResult, directoryResult, districtsResult] = await Promise.all([
    supabase.from("worker_details").select("*"),
    supabase.rpc("staff_directory"),
    supabase.from("districts").select("*"),
  ]);

  const details =
    (detailsResult.data as Array<{
      worker_id: string;
      admin_id: string | null;
      intake_status: string;
    }> | null) ?? [];
  const directory = (directoryResult.data as Array<{ id: string; full_name: string }> | null) ?? [];
  const districts = (districtsResult.data as Array<{ id: string; name: string }> | null) ?? [];
  const adminName = new Map(directory.map((row) => [row.id, row.full_name]));
  const districtName = new Map(districts.map((row) => [row.id, row.name]));
  const ids = details.map((row) => row.worker_id);

  let profiles: Profile[] = [];
  if (ids.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", ids);
    profiles = (data as Profile[] | null) ?? [];
  }
  const profileMap = new Map(profiles.map((row) => [row.id, row]));

  const rows: Row[] = details
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

  const unassigned = rows.filter((row) => row.intakeStatus !== "assigned").length;
  const suspended = rows.filter((row) => row.profile.status !== "active").length;

  return (
    <>
      <PageTitle
        title="Бүх ажилчид"
        emoji="👥"
        subtitle={`Нийт ${rows.length} · хуваариалаагүй ${unassigned} · идэвхгүй ${suspended}`}
        search={
          <Link
            href="/super/intake"
            className="press flex min-h-[var(--control-h)] items-center rounded-[10px] bg-primary px-4 text-[0.9em] font-medium text-on-primary"
          >
            Шинэ ажилчид
          </Link>
        }
      />

      <SectionHeader title="Жагсаалт" count={rows.length} href="/super" hrefLabel="Самбар" />

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
          <EmptyState
            icon={Users}
            title="Ажилтан байхгүй"
            body="Шинэ ажилтан бүртгүүлмэгц энд харагдана."
          />
        }
      />
    </>
  );
}
