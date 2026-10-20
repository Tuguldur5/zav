"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import { cx } from "./styles";

export type RailItem = { href: string; label: string; icon: LucideIcon };

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Home-like entries only match exactly, so every child page is not "active".
  if (href === "/today" || href === "/super" || href === "/c" || href === "/w") return false;
  return pathname.startsWith(`${href}/`);
}

const STORAGE_KEY = "zav.staff.rail";

/**
 * Tablet: a 72px icon rail. Desktop: a 248px sidebar that can be collapsed to
 * 72px. The collapsed state lives in a data attribute (CSS does the layout) and
 * is read from localStorage after mount, so rendering stays hydration-safe.
 */
export function NavRail({
  items,
  title,
  footer,
}: {
  items: RailItem[];
  title: string;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const sidebar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sidebar.current;
    if (!element) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") element.dataset.collapsed = "1";
    } catch {
      // private mode: the sidebar simply stays expanded
    }
  }, []);

  const toggle = useCallback(() => {
    const element = sidebar.current;
    if (!element) return;
    const next = element.dataset.collapsed === "1" ? "0" : "1";
    element.dataset.collapsed = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore: the layout change still applies for this visit
    }
  }, []);

  const links = items.map((item) => {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          title={item.label}
          className={cx(
            "nav-item press flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.9em] font-medium",
            active
              ? "bg-primary-container text-on-primary-container"
              : "text-ink hover:bg-surface2",
          )}
        >
          <Icon aria-hidden className="size-5 shrink-0" />
          <span className="nav-label truncate">{item.label}</span>
        </Link>
      </li>
    );
  });

  return (
    <>
      <div className="flex h-dvh w-[var(--rail-w)] flex-col gap-2 py-3 lg:hidden">
        <p className="nav-label px-2 text-center text-[0.7em] font-semibold leading-tight text-muted">
          {title}
        </p>
        <nav aria-label="Цэс" className="flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-1 px-1.5">{links}</ul>
        </nav>
        {footer ? <div className="px-1.5">{footer}</div> : null}
      </div>

      <div ref={sidebar} data-staff-nav="" className="hidden h-dvh flex-col gap-2 py-4 lg:flex">
        <div className="nav-head flex items-center gap-2 px-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-[0.8em] font-semibold text-on-primary">
            ЗБ
          </span>
          <span className="nav-label truncate text-[0.95em] font-semibold">{title}</span>
        </div>
        <nav aria-label="Цэс" className="flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-1 px-2">{links}</ul>
        </nav>
        <div className="nav-foot px-2">
          {footer}
          <button
            type="button"
            onClick={toggle}
            className="nav-item press mt-2 flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-[0.85em] text-muted hover:bg-surface2"
          >
            <PanelLeftClose aria-hidden className="nav-icon-open size-5 shrink-0" />
            <PanelLeftOpen aria-hidden className="nav-icon-closed hidden size-5 shrink-0" />
            <span className="nav-label">Цэс хумих</span>
          </button>
        </div>
      </div>
    </>
  );
}
