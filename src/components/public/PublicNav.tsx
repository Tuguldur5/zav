"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, CalendarDays, Home, Inbox, User } from "lucide-react";
import { cx } from "./ui";
import { mn } from "@/lib/i18n/mn";

type Audience = "customer" | "worker";
type NavItem = { href: string; label: string; icon: typeof Home };

/** Customer bottom bar has two primary destinations: home and orders. */
const CUSTOMER_ITEMS: NavItem[] = [
  { href: "/", label: mn.publicNav.home, icon: Home },
  { href: "/c", label: mn.publicNav.orders, icon: Briefcase },
  { href: "/c/me", label: mn.publicNav.profile, icon: User },
];

const WORKER_ITEMS: NavItem[] = [
  { href: "/home", label: mn.publicNav.home, icon: Home },
  { href: "/calendar", label: mn.publicNav.calendar, icon: CalendarDays },
  { href: "/offers", label: mn.publicNav.offers, icon: Inbox },
  { href: "/me", label: mn.publicNav.profile, icon: User },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/c/me") return pathname.startsWith("/c/me") || pathname.startsWith("/c/profile");
  if (href === "/c") return pathname === "/c" || pathname.startsWith("/c/jobs/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicTopNav({ audience }: { audience: Audience }) {
  const pathname = usePathname();
  const items = audience === "customer" ? CUSTOMER_ITEMS : WORKER_ITEMS;
  const roleLabel =
    audience === "customer" ? mn.publicNav.customerRole : mn.publicNav.workerRole;
  const title =
    audience === "customer" && pathname === "/c"
      ? mn.publicNav.orders
      : items.find((item) => isActive(pathname, item.href))?.label;

  return (
    <header className="public-app-topnav">
      <div className="public-app-topnav-inner">
        <Link href="/" className="public-app-brand">
          {mn.appName}
          <span>{roleLabel}</span>
        </Link>

        <p className="public-app-page-label">{title}</p>

        <nav aria-label={mn.publicNav.main} className="public-app-links">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx("public-app-link", active && "is-active")}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/help"
            className="public-app-link"
          >
            {mn.publicNav.help}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicTabBar({ audience }: { audience: Audience }) {
  const pathname = usePathname();
  const items = audience === "customer" ? CUSTOMER_ITEMS : WORKER_ITEMS;

  return (
    <nav
      aria-label={mn.publicNav.bottom}
      className="public-app-tabbar"
    >
      <ul className="grid grid-cols-3 sm:grid-cols-4">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={`${item.href}-${item.label}`}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx("public-app-tab", active && "is-active")}
              >
                <Icon aria-hidden className="size-[20px]" strokeWidth={1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
