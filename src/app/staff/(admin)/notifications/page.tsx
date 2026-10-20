import { ArrowUpRight, Bell } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageTitle, PanelSection, QueueCard, QueueGrid, RoundAction } from "@/components/staff";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarkAllReadButton } from "./MarkAllReadButton";
import { formatDateTimeMn, relativeHourLabel } from "@/lib/dates";
import type { Notification } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
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
      <PageTitle
        title="Мэдэгдэл"
        emoji="🔔"
        subtitle={unread > 0 ? `Уншаагүй ${unread} мэдэгдэл` : "Бүгд уншсан"}
        actions={notifications.length > 0 ? <MarkAllReadButton /> : undefined}
      />

      <PanelSection title="Сүүлийн мэдэгдлүүд" count={notifications.length}>
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Мэдэгдэл байхгүй"
            body="Ажилтан, санал, чөлөөт өдөртэй холбоотой мэдэгдэл энд ирнэ."
          />
        ) : (
          <QueueGrid>
            {notifications.map((row, index) => (
              <QueueCard
                key={row.id}
                featured={index === 0 && !row.read}
                title={row.title}
                description={row.body ?? undefined}
                icon={Bell}
                meta={
                  <span>
                    {formatDateTimeMn(row.created_at)} · {relativeHourLabel(row.created_at)}
                  </span>
                }
                status={
                  row.read
                    ? undefined
                    : {
                        status: "new",
                        table: {
                          new: {
                            label: "Шинэ",
                            tone: "primary" as const,
                            icon: Bell,
                          },
                        },
                      }
                }
                actions={
                  row.link ? (
                    <RoundAction href={row.link} label="Нээх" icon={ArrowUpRight} />
                  ) : undefined
                }
              />
            ))}
          </QueueGrid>
        )}
      </PanelSection>
    </>
  );
}
