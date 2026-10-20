import {
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Download,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Plus,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Tags,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type StaffNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Counts are drawn on Зарууд and Мэдэгдэл only. */
  badge?: "jobs" | "alerts";
};

export type StaffDockItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Path prefix that marks the item active. */
  match: string;
};

export type StaffQuickAction = { label: string; href: string };

/** Admin header tabs (>= 640px; icons only below 1024). */
export const adminNav: StaffNavItem[] = [
  { href: "/today", label: "Өнөөдөр", icon: LayoutDashboard },
  { href: "/jobs", label: "Зарууд", icon: ClipboardList, badge: "jobs" },
  { href: "/workers", label: "Ажилчид", icon: Users },
  { href: "/calendar", label: "Календар", icon: CalendarDays },
  { href: "/notifications", label: "Мэдэгдэл", icon: Bell, badge: "alerts" },
];

/** Super admin header tabs: eight sections, all icons + one expanding label. */
export const superNav: StaffNavItem[] = [
  { href: "/super", label: "Хянах самбар", icon: LayoutDashboard },
  { href: "/super/intake", label: "Шинэ ажилчид", icon: UserPlus },
  { href: "/super/admins", label: "Админууд", icon: Users },
  { href: "/super/workers", label: "Ажилчид", icon: User },
  { href: "/super/jobs", label: "Зарууд", icon: Briefcase, badge: "jobs" },
  { href: "/super/catalog", label: "Каталог", icon: Tags },
  { href: "/super/settings", label: "Тохиргоо", icon: Settings },
  { href: "/super/audit", label: "Аудит", icon: ScrollText },
];

/** Desktop dock (floating pill at the bottom centre). */
export const adminDock: StaffDockItem[] = [
  { href: "/jobs?tab=new", label: "Зар авах", icon: ClipboardList, match: "/jobs" },
  { href: "/workers", label: "Ажилтан хайх", icon: Search, match: "/workers" },
  { href: "/calendar", label: "Өнөөдөр чөлөөтэй", icon: CalendarDays, match: "/calendar" },
  { href: "/workers", label: "Тэмдэглэл", icon: NotebookPen, match: "/workers" },
];

export const superDock: StaffDockItem[] = [
  { href: "/super/intake", label: "Хуваарилах", icon: UserPlus, match: "/super/intake" },
  { href: "/super/admins", label: "Админ урих", icon: Users, match: "/super/admins" },
  { href: "/super/admins", label: "Шилжүүлэх", icon: ShieldCheck, match: "/super/admins" },
  { href: "/super/audit/export", label: "Аудит CSV", icon: Download, match: "/super/audit" },
];

/** Phone bottom navigation (< 640px). The last item opens "Бусад". */
export const adminPhone: StaffDockItem[] = [
  { href: "/today", label: "Өнөөдөр", icon: LayoutDashboard, match: "/today" },
  { href: "/jobs", label: "Зарууд", icon: ClipboardList, match: "/jobs" },
  { href: "/workers", label: "Ажилчид", icon: Users, match: "/workers" },
  { href: "/calendar", label: "Календар", icon: CalendarDays, match: "/calendar" },
];

export const superPhone: StaffDockItem[] = [
  { href: "/super", label: "Самбар", icon: LayoutDashboard, match: "/super" },
  { href: "/super/intake", label: "Шинэ ажилчид", icon: UserPlus, match: "/super/intake" },
  { href: "/super/admins", label: "Админууд", icon: Users, match: "/super/admins" },
  { href: "/super/workers", label: "Ажилчид", icon: User, match: "/super/workers" },
];

/** Menu behind the dock "+" (real destinations only). */
export const adminPlus: StaffQuickAction[] = [
  { label: "Мэдэгдэл харах", href: "/notifications" },
  { label: "Миний профайл", href: "/profile" },
  { label: "Аюулгүй байдал", href: "/security" },
];

export const superPlus: StaffQuickAction[] = [
  { label: "Админ урих", href: "/super/admins" },
  { label: "Каталог", href: "/super/catalog" },
  { label: "Аудитын бүртгэл", href: "/super/audit" },
  { label: "Миний профайл", href: "/profile" },
];

export const plusIcon = Plus;
export const auditIcon = ListChecks;
