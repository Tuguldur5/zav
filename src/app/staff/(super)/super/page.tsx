import Link from "next/link";
import { AlertTriangle, Briefcase, ShieldCheck, UserPlus, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import {
  ButtonLink,
  LoadBar,
  PageHeader,
  Row,
  Rows,
  Section,
  StaffEmpty,
  StatTile,
  StatTiles,
} from "@/components/staff";
import { getAdminCapacity } from "@/lib/settings";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

type Stats = {
  pool_new?: number;
  unclaimed_24h?: number;
  unassigned_workers?: number;
};

type AdminLoad = {
  id: string;
  full_name: string;
  worker_count: number;
  last_login: string | null;
};

type UnassignedWorker = { worker_id: string; created_at: string | null };

export default async function SuperDashboardPage() {
  const { supabase } = await requireRole(["super_admin"]);
  const [statsResult, loadsResult, capacity, staleResult, intakeResult] = await Promise.all([
    supabase.rpc("stats"),
    supabase.rpc("admin_loads"),
    getAdminCapacity(),
    supabase
      .from("jobs")
      .select("id, title, created_at")
      .eq("status", "new")
      .is("claimed_by", null)
      .lt("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order("created_at")
      .limit(5),
    supabase
      .from("worker_details")
      .select("worker_id, assigned_at")
      .eq("intake_status", "new")
      .order("assigned_at", { ascending: true, nullsFirst: true })
      .limit(5),
  ]);

  const stats = (statsResult.data ?? {}) as Stats;
  const loads = (loadsResult.data as AdminLoad[] | null) ?? [];
  const staleJobs = (staleResult.data as Pick<Job, "id" | "title" | "created_at">[] | null) ?? [];
  const intake = (intakeResult.data as UnassignedWorker[] | null) ?? [];
  const idleAdmins = loads.filter((row) => row.worker_count === 0);

  const averageLoad = loads.length
    ? Math.round((loads.reduce((sum, row) => sum + row.worker_count, 0) / loads.length) * 10) / 10
    : 0;

  const attentionCount = staleJobs.length + intake.length + idleAdmins.length;

  return (
    <>
      <PageHeader
        subtitle="Шинэ ажилтан, админы ачаалал, авагдаагүй зар"
        actions={
          <ButtonLink href="/super/intake" variant="primary" icon={UserPlus}>
            Ажилтан хуваарилах
          </ButtonLink>
        }
      />

      <StatTiles>
        <StatTile
          label="Шинэ ажилчид"
          value={stats.unassigned_workers ?? 0}
          href="/super/intake"
          icon={UserPlus}
          attention={(stats.unassigned_workers ?? 0) > 0}
        />
        <StatTile label="Идэвхтэй админ" value={loads.length} href="/super/admins" icon={ShieldCheck} />
        <StatTile
          label="Хуваарилагдаагүй зар"
          value={stats.pool_new ?? 0}
          href="/super/jobs?tab=unclaimed"
          icon={Briefcase}
        />
        <StatTile
          label="24 цагаас дээш авагдаагүй зар"
          value={stats.unclaimed_24h ?? 0}
          href="/super/jobs?tab=unclaimed"
          icon={AlertTriangle}
          attention={(stats.unclaimed_24h ?? 0) > 0}
        />
      </StatTiles>

      <Section
        title="Админуудын ачаалал"
        count={loads.length}
        href="/super/admins"
        hrefLabel="Админууд"
      >
        <p className="text-[13px] text-[color:var(--st-muted)]">
          Дундаж ачаалал: {averageLoad} · багтаамж {capacity}
        </p>
        {loads.length === 0 ? (
          <StaffEmpty
            title="Админ байхгүй байна"
            body="Админ урилга үүсгээд ажилчдыг хуваарилна уу."
            action={<ButtonLink href="/super/admins">Админууд</ButtonLink>}
          />
        ) : (
          <Rows label="Админуудын ачаалал">
            {loads.map((row) => (
              <Row
                key={row.id}
                title={row.full_name || "Админ"}
                href={`/super/admins#${row.id}`}
                meta={
                  <>
                    <span>{row.worker_count} ажилтан</span>
                    <span>
                      {row.last_login
                        ? `Сүүлд нэвтэрсэн ${new Date(row.last_login).toLocaleDateString("mn-MN")}`
                        : "Хэзээ ч нэвтрээгүй"}
                    </span>
                  </>
                }
              >
                <span className="mt-1 block max-w-[420px]">
                  <LoadBar value={row.worker_count} capacity={capacity} />
                </span>
              </Row>
            ))}
          </Rows>
        )}
      </Section>

      <Section title="Анхаарах зүйлс" count={attentionCount}>
        {attentionCount === 0 ? (
          <StaffEmpty title="Бүх зүйл хэвийн" body="Одоогоор анхаарах зүйл алга." />
        ) : (
          <Rows label="Анхаарах зүйлс">
            {stats.unclaimed_24h ? (
              <Row
                title="24 цагаас дээш авагдаагүй зар"
                href="/super/jobs?tab=unclaimed"
                pill={
                  <span className="st-nav-badge" data-attention>
                    {stats.unclaimed_24h}
                  </span>
                }
                meta={staleJobs.map((job) => (
                  <span key={job.id}>{job.title}</span>
                ))}
                action={
                  <Link href="/super/jobs?tab=unclaimed" className="st-btn" data-variant="outline">
                    Нээх
                  </Link>
                }
              />
            ) : null}

            {intake.length > 0 ? (
              <Row
                title="Хуваарилалт хүлээж буй шинэ ажилчид"
                href="/super/intake"
                pill={
                  <span className="st-nav-badge" data-attention>
                    {stats.unassigned_workers ?? intake.length}
                  </span>
                }
                meta={<span>Ажилтан хуваарилах</span>}
                action={
                  <Link href="/super/intake" className="st-btn" data-variant="outline">
                    Нээх
                  </Link>
                }
              />
            ) : null}

            {idleAdmins.map((admin) => (
              <Row
                key={`idle-${admin.id}`}
                title={`${admin.full_name || "Админ"} — ажилтангүй`}
                href="/super/admins"
                pill={<Users aria-hidden className="size-4 text-[color:var(--st-warn)]" />}
                meta={<span>Ажилтан хуваарилах эсвэл эрхийг шалгах</span>}
                action={
                  <Link href="/super/admins" className="st-btn" data-variant="outline">
                    Нээх
                  </Link>
                }
              />
            ))}
          </Rows>
        )}
      </Section>
    </>
  );
}
