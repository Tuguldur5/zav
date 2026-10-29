import {
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { StaffNavItem } from "./types";

export type StaffNavEntry = StaffNavItem & { icon: LucideIcon };

/** A labelled block of destinations in the sidebar. */
export type StaffNavGroup = { label: string; items: StaffNavEntry[] };

/** Admin navigation: four work destinations, then the shared inbox. */
export const adminGroups: StaffNavGroup[] = [
  {
    label: "Ажил",
    items: [
      { href: "/today", label: "Өнөөдөр", icon: LayoutDashboard },
      { href: "/jobs", label: "Зарууд", icon: ClipboardList, badge: "jobs" },
      { href: "/workers", label: "Ажилчид", icon: Users },
      { href: "/calendar", label: "Календар", icon: CalendarDays },
    ],
  },
  {
    label: "Харилцаа",
    items: [{ href: "/notifications", label: "Мэдэгдэл", icon: Bell, badge: "alerts" }],
  },
];

/** Super navigation: four groups; catalog/audit live inside Тохиргоо. */
export const superGroups: StaffNavGroup[] = [
  {
    label: "Хяналт",
    items: [{ href: "/super", label: "Самбар", icon: LayoutDashboard }],
  },
  {
    label: "Ажилтан",
    items: [
      { href: "/super/intake", label: "Шинэ ажилчид", icon: UserPlus, badge: "newWorkers", attention: true },
      { href: "/super/workers", label: "Ажилчид", icon: Users },
      { href: "/super/admins", label: "Админууд", icon: ShieldCheck },
    ],
  },
  {
    label: "Зар",
    items: [{ href: "/super/jobs", label: "Зарууд", icon: Briefcase, badge: "staleJobs", attention: true }],
  },
  {
    label: "Систем",
    items: [
      {
        href: "/super/settings",
        label: "Тохиргоо",
        icon: Settings,
        match: ["/super/settings", "/super/catalog", "/super/audit"],
      },
      { href: "/notifications", label: "Мэдэгдэл", icon: Bell, badge: "alerts" },
    ],
  },
];

export const settingsTabs = [
  { href: "/super/settings", label: "Ерөнхий" },
  { href: "/super/catalog", label: "Каталог" },
  { href: "/super/audit", label: "Аудит" },
];

/** Backwards-compatible flat lists (exported through components/staff). */
export const adminNav: StaffNavEntry[] = adminGroups.flatMap((group) => group.items);
export const superNav: StaffNavEntry[] = superGroups.flatMap((group) => group.items);

/**
 * Four primary phone tabs; the fifth opens the full sidebar drawer. Super keeps
 * Самбар / Шинэ ажилчид / Админууд / Зарууд visible.
 */
export function phoneNav(role: "admin" | "super_admin"): StaffNavEntry[] {
  const nav = navFor(role);
  if (role !== "super_admin") return nav.slice(0, 4);
  return nav.filter((item) =>
    ["/super", "/super/intake", "/super/admins", "/super/jobs"].includes(item.href),
  );
}

export function navFor(role: "admin" | "super_admin"): StaffNavEntry[] {
  return role === "super_admin" ? superNav : adminNav;
}

export function navGroupsFor(role: "admin" | "super_admin"): StaffNavGroup[] {
  return role === "super_admin" ? superGroups : adminGroups;
}

export function activeItem(pathname: string, nav: StaffNavEntry[]): StaffNavEntry | null {
  let best: StaffNavEntry | null = null;
  let bestLength = -1;
  for (const item of nav) {
    const prefixes = [item.href, ...(item.match ?? [])];
    for (const prefix of prefixes) {
      const exact = pathname === prefix;
      const nested = pathname.startsWith(`${prefix}/`);
      if ((exact || nested) && prefix.length > bestLength) {
        best = item;
        bestLength = prefix.length;
      }
    }
  }
  return best;
}

export function badgeValue(item: StaffNavEntry, counts: StaffCountsSource): number {
  if (!item.badge) return 0;
  return counts[item.badge] ?? 0;
}

type StaffCountsSource = { jobs: number; newWorkers: number; staleJobs: number; alerts: number };
