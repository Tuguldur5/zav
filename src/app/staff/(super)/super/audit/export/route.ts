import { NextResponse, type NextRequest } from "next/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * The only bulk export in the product: audit log CSV, super admin only.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Not Found", { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "super_admin" || profile.status !== "active") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity") ?? "";
  const action = url.searchParams.get("action") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (entity) query = query.eq("entity", entity);
  if (action) query = query.eq("action", action);
  if (from) query = query.gte("created_at", `${from}T00:00:00+08:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59+08:00`);

  const { data } = await query;
  const rows = (data as Array<Record<string, unknown>> | null) ?? [];

  const lines = [
    ["created_at", "actor_id", "action", "entity", "entity_id", "meta"].join(","),
    ...rows.map((row) =>
      [
        escapeCsv(row.created_at),
        escapeCsv(row.actor_id),
        escapeCsv(row.action),
        escapeCsv(row.entity),
        escapeCsv(row.entity_id),
        escapeCsv(JSON.stringify(row.meta ?? {})),
      ].join(","),
    ),
  ];

  const csv = `\uFEFF${lines.join("\r\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
