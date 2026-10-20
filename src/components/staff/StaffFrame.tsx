import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { loadStaffDesk } from "@/lib/staff-desk";
import { relativeHourLabel } from "@/lib/dates";
import { adminNav, superNav } from "./nav";
import { StaffShell } from "./StaffShell";
import type { Role } from "@/lib/types";
import type { StaffNotice, StaffPaletteItem, StaffTone } from "./types";

type Supabase = Awaited<ReturnType<typeof requireRole>>["supabase"];

type JobTitle = { id: string; title: string };

/**
 * Palette rows are limited to what staff may already see on their screens:
 * page names, job titles and worker names. No email, phone or private note.
 */
async function loadPalette(
  supabase: Supabase,
  role: Role,
  userId: string,
  path: string,
): Promise<StaffPaletteItem[]> {
  const superAdmin = role === "super_admin";
  const navItems = superAdmin ? superNav : adminNav;
  const pages: StaffPaletteItem[] = navItems.map((item) => ({
    label: item.label,
    href: item.href,
    kind: "Хуудас",
  }));

  let jobs: JobTitle[] = [];
  if (superAdmin) {
    const { data } = await supabase
      .from("jobs")
      .select("id, title")
      .order("created_at", { ascending: false })
      .limit(12);
    jobs = (data as JobTitle[] | null) ?? [];
  } else if (path.startsWith("/jobs")) {
    const [{ data: pool }, { data: mine }] = await Promise.all([
      supabase.rpc("pool_jobs"),
      supabase.from("jobs").select("id, title").eq("claimed_by", userId).limit(12),
    ]);
    jobs = [
      ...((pool as JobTitle[] | null) ?? []),
      ...((mine as JobTitle[] | null) ?? []),
    ];
  }

  let detailsQuery = supabase.from("worker_details").select("worker_id");
  if (!superAdmin) detailsQuery = detailsQuery.eq("admin_id", userId);
  const { data: details } = await detailsQuery.limit(150);
  const ids = ((details as Array<{ worker_id: string }> | null) ?? []).map(
    (row) => row.worker_id,
  );

  let workers: Array<{ id: string; full_name: string }> = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids)
      .limit(24);
    workers = (data as Array<{ id: string; full_name: string }> | null) ?? [];
  }

  return [
    ...pages,
    ...jobs.map((job) => ({ label: job.title, href: `/jobs/${job.id}`, kind: "Зар" as const })),
    ...workers.map((worker) => ({
      label: worker.full_name,
      href: `/workers/${worker.id}`,
      kind: "Ажилтан" as const,
    })),
  ];
}

/**
 * Server side of the shell: signed-in profile, real counts, the desk built from
 * real rows, the palette and the latest five notifications. The tone matches
 * what middleware already put on <html>, so frame and paper agree.
 */
export async function StaffFrame({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { supabase, user, profile } = await requireRole(roles);
  const path = (await headers()).get("x-zav-path") ?? "/";
  const tone: StaffTone = path.startsWith("/super") ? "super" : "admin";
  const isSuper = profile.role === "super_admin";

  const [statsResult, unreadResult, noticesResult, desk, palette] = await Promise.all([
    supabase.rpc("stats"),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false),
    supabase
      .from("notifications")
      .select("id, title, link, read, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    loadStaffDesk({
      supabase,
      role: isSuper ? "super_admin" : "admin",
      userId: user.id,
      path,
    }),
    loadPalette(supabase, profile.role, user.id, path),
  ]);

  const stats = (statsResult.data ?? {}) as { pool_new?: number; workers_pending?: number };
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

  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  const lastSignInLabel = lastSignIn
    ? new Intl.DateTimeFormat("mn-MN", {
        timeZone: "Asia/Ulaanbaatar",
        dateStyle: "short",
        timeStyle: "short",
      }).format(lastSignIn)
    : null;

  return (
    <StaffShell
      tone={tone}
      role={profile.role}
      name={profile.full_name || user.email || "Админ"}
      email={user.email ?? ""}
      lastSignIn={lastSignInLabel}
      counts={{
        jobs: stats.pool_new ?? 0,
        alerts: unreadResult.count ?? 0,
      }}
      desk={desk}
      palette={palette}
      notices={notices}
    >
      {children}
    </StaffShell>
  );
}
