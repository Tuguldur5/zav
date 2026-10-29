import Link from "next/link";
import { Bell } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader, Rows, StaffEmpty } from "@/components/staff";
import { MarkAllReadButton } from "./MarkAllReadButton";
import { formatDateTimeMn } from "@/lib/dates";
import type { Notification } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StaffNotificationsPage() {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const notifications = (data as Notification[] | null) ?? [];
  const unread = notifications.filter((row) => !row.read).length;

  return (
    <>
      <PageHeader
        subtitle={unread > 0 ? `Уншаагүй ${unread} мэдэгдэл` : "Бүгд уншсан"}
        actions={notifications.length > 0 ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <StaffEmpty
          title="Мэдэгдэл байхгүй"
          body="Ажилтан, санал, чөлөөт өдөртэй холбоотой мэдэгдэл энд ирнэ."
        />
      ) : (
        <Rows label="Мэдэгдлүүд">
          {notifications.map((row) => {
            const body = (
              <>
                <span className="st-row-title">
                  {row.read ? row.title : <strong>{row.title}</strong>}
                </span>
                <span className="st-row-meta">
                  {row.body ? <span>{row.body}</span> : null}
                  <span>{formatDateTimeMn(row.created_at)}</span>
                </span>
              </>
            );
            return (
              <div key={row.id} className="st-row">
                <Bell aria-hidden className="size-4 shrink-0 text-[color:var(--st-muted)]" />
                <div className="st-row-main">
                  {row.link ? <Link href={row.link}>{body}</Link> : body}
                </div>
                {row.read ? null : (
                  <span className="st-nav-badge" data-attention>
                    Шинэ
                  </span>
                )}
              </div>
            );
          })}
        </Rows>
      )}
    </>
  );
}
