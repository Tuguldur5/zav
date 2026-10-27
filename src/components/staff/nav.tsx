import {
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

/** Admin navigation: four destinations, no duplicates. */
export const adminNav: StaffNavEntry[] = [
  { href: "/today", label: "Өнөөдөр", icon: LayoutDashboard },
  { href: "/jobs", label: "Зарууд", icon: ClipboardList, badge: "jobs" },
  { href: "/workers", label: "Ажилчид", icon: Users },
  { href: "/calendar", label: "Календар", icon: CalendarDays },
];

/** Super navigation: six destinations; catalog/audit live inside Тохиргоо. */
export const superNav: StaffNavEntry[] = [
  { href: "/super", label: "Самбар", icon: LayoutDashboard },
  { href: "/super/intake", label: "Шинэ ажилчид", icon: UserPlus, badge: "newWorkers" },
  { href: "/super/admins", label: "Админууд", icon: ShieldCheck },
  { href: "/super/workers", label: "Ажилчид", icon: Users },
  { href: "/super/jobs", label: "Зарууд", icon: Briefcase, badge: "staleJobs", attention: true },
  {
    href: "/super/settings",
    label: "Тохиргоо",
    icon: Settings,
    match: ["/super/settings", "/super/catalog", "/super/audit"],
  },
];

export const settingsTabs = [
  { href: "/super/settings", label: "Ерөнхий" },
  { href: "/super/catalog", label: "Каталог" },
  { href: "/super/audit", label: "Аудит" },
];

/**
 * Four primary phone tabs; the fifth opens the "Бусад" sheet. Super keeps
 * Самбар / Шинэ ажилчид / Админууд / Зарууд visible, everything else in Бусад.
 */
export function phoneNav(role: "admin" | "super_admin"): StaffNavEntry[] {
  if (role !== "super_admin") return adminNav;
  return superNav.filter((item) =>
    ["/super", "/super/intake", "/super/admins", "/super/jobs"].includes(item.href),
  );
}

export function navFor(role: "admin" | "super_admin"): StaffNavEntry[] {
  return role === "super_admin" ? superNav : adminNav;
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

type StaffCountsSource = { jobs: number; newWorkers: number; staleJobs: number };
