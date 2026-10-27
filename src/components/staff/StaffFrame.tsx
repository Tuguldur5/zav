import { requireRole } from "@/lib/auth";
import { relativeHourLabel } from "@/lib/dates";
import { StaffShell } from "./StaffShell";
import type { Role } from "@/lib/types";
import type { StaffNotice } from "./types";

type Stats = {
  pool_new?: number;
  unassigned_workers?: number;
  unclaimed_24h?: number;
};

/**
 * Server side of the shell: the real signed-in profile, real counts for the
 * navigation badges and the latest five notifications. The tone follows the
 * ROLE, so a super admin keeps the super header on shared pages too.
 */
export async function StaffFrame({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { supabase, user, profile } = await requireRole(roles);
  const isSuper = profile.role === "super_admin";

  const [statsResult, unreadResult, noticesResult] = await Promise.all([
    supabase.rpc("stats"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false),
    supabase
      .from("notifications")
      .select("id, title, link, read, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats = (statsResult.data ?? {}) as Stats;
  const notices: StaffNotice[] = (
    (noticesResult.data as Array<{
      id: string;
      title: string;
      link: string | null;
      read: boolean;
      created_at: string;
    }> | null) ?? []
  ).map((row) => ({
    id: row.id,
    title: row.title,
    href: row.link ?? "/notifications",
    read: row.read,
    time: relativeHourLabel(row.created_at),
  }));

  return (
    <StaffShell
      tone={isSuper ? "super" : "admin"}
      role={profile.role}
      name={profile.full_name || "Ажилтан"}
      email={user.email ?? ""}
      counts={{
        jobs: stats.pool_new ?? 0,
        newWorkers: stats.unassigned_workers ?? 0,
        staleJobs: stats.unclaimed_24h ?? 0,
        alerts: unreadResult.count ?? 0,
      }}
      notices={notices}
    >
      {children}
    </StaffShell>
  );
}
