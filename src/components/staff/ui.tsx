import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
/** Page title, one muted line and at most two actions (stacked on phones). */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="st-page-head">
      <div className="min-w-0">
        <h1 className="st-title">{title}</h1>
        {subtitle ? <p className="st-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="st-head-actions">{actions}</div> : null}
    </div>
  );
}

export function Section({
  title,
  count,
  href,
  hrefLabel = "Бүгд",
  children,
  actions,
}: {
  title: string;
  count?: number;
  href?: string;
  hrefLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="st-section">
      <div className="st-section-head">
        <h2 className="st-section-title">
          {title}
          {typeof count === "number" ? <span className="st-section-count">{count}</span> : null}
        </h2>
        {actions ??
          (href ? (
            <Link href={href} className="st-section-link">
              {hrefLabel}
            </Link>
          ) : null)}
      </div>
      {children}
    </section>
  );
}

/** White tile, label above a big number. `attention` only when count > 0. */
export function StatTile({
  label,
  value,
  icon: Icon,
  href,
  attention = false,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  href?: string;
  attention?: boolean;
}) {
  const body = (
    <>
      <span className="st-tile-label">{label}</span>
      <span className="st-tile-value">{value}</span>
      {Icon ? <Icon aria-hidden className="st-tile-icon size-4" /> : null}
    </>
  );
  return (
    <div className="st-tile" data-attention={attention ? "" : undefined}>
      {href ? (
        <Link href={href} className="flex flex-col gap-1.5">
          {body}
        </Link>
      ) : (
        body
      )}
    </div>
  );
}

export function StatTiles({ children }: { children: ReactNode }) {
  return <div className="st-tiles">{children}</div>;
}

/** Flat list container (rows with 1px separators, not cards). */
export function Rows({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="st-rows" role={label ? "list" : undefined} aria-label={label}>
      {children}
    </div>
  );
}

export function Row({
  title,
  meta,
  pill,
  action,
  href,
  children,
}: {
  title: ReactNode;
  meta?: ReactNode;
  pill?: ReactNode;
  action?: ReactNode;
  href?: string;
  children?: ReactNode;
}) {
  return (
    <div className="st-row" data-row="" role="listitem">
      <div className="st-row-main">
        <span className="st-row-title">{href ? <Link href={href}>{title}</Link> : title}</span>
        {meta ? <span className="st-row-meta">{meta}</span> : null}
        {children}
      </div>
      {pill}
      {action ? <div className="st-row-action">{action}</div> : null}
    </div>
  );
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return <div className="st-group-label">{children}</div>;
}

/** Progress bar scaled by capacity, never by the largest row. */
export function LoadBar({ value, capacity }: { value: number; capacity: number }) {
  const percent = capacity > 0 ? Math.min(100, Math.round((value / capacity) * 100)) : 0;
  return (
    <span
      className="st-loadbar"
      role="img"
      aria-label={`${value} / ${capacity}`}
      title={`${value} / ${capacity}`}
    >
      <span style={{ width: `${percent}%` }} />
    </span>
  );
}

export function StaffNote({ children }: { children: ReactNode }) {
  return <p className="st-note">{children}</p>;
}

export function StaffEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="st-empty">
      <p className="st-empty-title">{title}</p>
      {body ? <p className="st-empty-body">{body}</p> : null}
      {action}
    </div>
  );
}

/** Underline tabs used for in-page sections (server rendered links). */
export function PageTabs({
  tabs,
  active,
  label,
}: {
  tabs: Array<{ href: string; label: string }>;
  active: string;
  label: string;
}) {
  return (
    <nav className="st-tabs" aria-label={label}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "outline",
  icon: Icon,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost";
  icon?: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="st-btn"
      data-variant={variant}
      data-primary={variant === "primary" ? "" : undefined}
    >
      {Icon ? <Icon aria-hidden className="size-4" /> : null}
      {children}
    </Link>
  );
}
