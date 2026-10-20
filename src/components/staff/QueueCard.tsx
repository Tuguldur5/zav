import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusMeta } from "@/lib/status";
import { cx } from "@/components/ui/styles";

type QueueCardProps = {
  title: string;
  href?: string;
  description?: string;
  /** Meta row: date, district, pay — already formatted text. */
  meta?: ReactNode;
  icon: LucideIcon;
  /** Status needs a StatusPill: colour + icon + text, never colour alone. */
  status?: { status: string; table: Record<string, StatusMeta> };
  /** The first/most urgent card of a grid is filled tint-3. */
  featured?: boolean;
  /** Round icon buttons (ghost = more, soft = decline, filled = confirm). */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function QueueCard({
  title,
  href,
  description,
  meta,
  icon: Icon,
  status,
  featured = false,
  actions,
  children,
  className,
}: QueueCardProps) {
  return (
    <article
      className={cx("staff-card", className)}
      data-card=""
      data-featured={featured ? "1" : undefined}
    >
      <span className="staff-card-chip">
        <Icon aria-hidden className="size-4" />
      </span>

      <div className="min-w-0 pr-10">
        {href ? (
          <Link href={href} className="staff-card-title press block hover:underline">
            {title}
          </Link>
        ) : (
          <h3 className="staff-card-title">{title}</h3>
        )}
        {description ? <p className="staff-card-desc mt-1">{description}</p> : null}
      </div>

      {meta ? <div className="staff-card-meta">{meta}</div> : null}
      {children}

      <div className="staff-card-foot">
        <span className="min-w-0">
          {status ? <StatusPill status={status.status} table={status.table} /> : null}
        </span>
        {actions ? <div className="staff-card-actions">{actions}</div> : null}
      </div>
    </article>
  );
}

/** Responsive card grid: 1 / 2 / 3 columns. */
export function QueueGrid({ children }: { children: ReactNode }) {
  return <div className="staff-card-grid">{children}</div>;
}

type RoundActionProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Filled primary = the confirm action of the card. */
  confirm?: boolean;
  variant?: "ghost" | "soft" | "filled";
};

export function RoundAction({
  href,
  label,
  icon: Icon,
  confirm = false,
  variant,
}: RoundActionProps) {
  const resolved = variant ?? (confirm ? "filled" : "soft");
  const shared = {
    "aria-label": label,
    title: label,
    className: "staff-round-btn press",
    "data-variant": resolved,
    children: <Icon aria-hidden className="size-4" />,
  };
  // `tel:` is a device link, never client navigation.
  return href.startsWith("tel:") ? <a href={href} {...shared} /> : <Link href={href} {...shared} />;
}
