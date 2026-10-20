"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StaffCounts } from "./types";
import type { StaffNavItem } from "./nav";

function isActive(pathname: string, href: string): boolean {
  // Home-like entries match exactly, so child pages are not "home".
  if (href === "/today" || href === "/super") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The current page name for the compact (<640px) header. */
export function currentPageLabel(items: StaffNavItem[], pathname: string): string {
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find((item) => isActive(pathname, item.href));
  return match?.label ?? "Ажилтны хэсэг";
}

/**
 * Pill container of round icon links. The active link expands into a dark pill
 * showing its Mongolian name; every other link is icon-only with a title and a
 * focus-visible tooltip. Width change is animated in CSS (no layout jump).
 */
export function TabNav({
  items,
  counts,
  activeHref,
}: {
  items: StaffNavItem[];
  counts: StaffCounts;
  /** Dev previews force the active pill; real pages use the path. */
  activeHref?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Үндсэн цэс" className="staff-tabnav">
      {items.map((item) => {
        const active = activeHref ? item.href === activeHref : isActive(pathname, item.href);
        const Icon = item.icon;
        const badge =
          item.badge === "jobs" ? counts.jobs : item.badge === "alerts" ? counts.alerts : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            className="staff-tab press"
            data-tab={item.href}
          >
            <Icon aria-hidden className="size-5 shrink-0" />
            <span className="staff-tab-label">{item.label}</span>
            {badge > 0 ? (
              <span className="staff-tab-badge" aria-hidden>
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
            <span className="staff-tab-tip" role="tooltip" aria-hidden>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
