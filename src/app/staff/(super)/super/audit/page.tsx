import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader, PageTabs, settingsTabs } from "@/components/staff";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTimeMn } from "@/lib/dates";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

function exportHref(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return `/super/audit/export${query ? `?${query}` : ""}`;
}

export default async function SuperAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireRole(["super_admin"]);

  let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false });
  if (params.entity) query = query.eq("entity", params.entity);
  if (params.action) query = query.eq("action", params.action);
  if (params.from) query = query.gte("created_at", `${params.from}T00:00:00+08:00`);
  if (params.to) query = query.lte("created_at", `${params.to}T23:59:59+08:00`);
  const { data } = await query.limit(300);
  const rows = (data as AuditRow[] | null) ?? [];

  const actorIds = [...new Set(rows.map((row) => row.actor_id).filter(Boolean))] as string[];
  let actors: Array<{ id: string; full_name: string }> = [];
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    actors = (profiles as Array<{ id: string; full_name: string }> | null) ?? [];
  }
  const actorName = new Map(actors.map((row) => [row.id, row.full_name]));

  const entities = [...new Set(rows.map((row) => row.entity))].sort();
  const actions = [...new Set(rows.map((row) => row.action))].sort();

  return (
    <>
      <PageHeader
        subtitle={`Аудит · сүүлийн ${rows.length} мөр${params.entity ? ` · ${params.entity}` : ""}`}
        actions={
          <Link href={exportHref(params)} className="st-btn" data-variant="outline">
            <Download aria-hidden className="size-4" />
            CSV татаж авах
          </Link>
        }
      />

      <form
        method="GET"
        className="grid gap-2 rounded-[18px] border border-line bg-card p-3 sm:grid-cols-4"
      >
          <label className="flex flex-col gap-1 text-[0.8em] font-medium">
            Объект
            <select
              name="entity"
              defaultValue={params.entity ?? ""}
              className="min-h-11 rounded-md border border-outline bg-surface px-2 text-[0.9em]"
            >
              <option value="">Бүгд</option>
              {entities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[0.8em] font-medium">
            Үйлдэл
            <select
              name="action"
              defaultValue={params.action ?? ""}
              className="min-h-11 rounded-md border border-outline bg-surface px-2 text-[0.9em]"
            >
              <option value="">Бүгд</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[0.8em] font-medium">
            Эхлэх огноо
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ""}
              className="min-h-11 rounded-md border border-outline bg-surface px-2 text-[0.9em]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.8em] font-medium">
            Дуусах огноо
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ""}
              className="min-h-11 rounded-md border border-outline bg-surface px-2 text-[0.9em]"
            />
          </label>
          <div className="flex gap-2 sm:col-span-4">
            <button
              type="submit"
              className="press min-h-11 rounded-[10px] bg-primary px-4 font-medium text-on-primary"
            >
              Шүүх
            </button>
          </div>
        </form>

        <PageTabs label="Тохиргооны хэсэг" active="/super/audit" tabs={settingsTabs} />

        <DataTable
          caption="Аудитын мөрүүд"
          columns={[
            { key: "time", header: "Цаг", primary: true },
            { key: "actor", header: "Хэрэглэгч" },
            { key: "action", header: "Үйлдэл" },
            { key: "entity", header: "Объект" },
            { key: "meta", header: "Мэдээлэл", secondary: true },
          ]}
          rows={rows.map((row) => ({
            id: row.id,
            cells: [
              formatDateTimeMn(row.created_at),
              row.actor_id ? (actorName.get(row.actor_id) ?? row.actor_id.slice(0, 8)) : "—",
              <code key="action" className="text-[0.8em]">
                {row.action}
              </code>,
              `${row.entity}${row.entity_id ? `:${row.entity_id.slice(0, 8)}` : ""}`,
              <span key="meta" className="break-all text-[0.8em]">
                {JSON.stringify(row.meta)}
              </span>,
            ],
          }))}
          empty={
            <EmptyState
              icon={FileText}
              title="Бүртгэл байхгүй"
              body="Шүүлтүүрээ сольж эсвэл бага хугацаа авна уу."
            />
          }
        />
    </>
  );
}
