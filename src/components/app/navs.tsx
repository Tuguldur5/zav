"use client";

import {
  CalendarDays,
  Home,
  ListChecks,
  User,
} from "lucide-react";
import { BottomNav, type NavItem } from "@/components/ui/BottomNav";
import { NavRail } from "@/components/ui/NavRail";

const customerItems: NavItem[] = [
  { href: "/c", label: "Нүүр", icon: Home },
  { href: "/c/jobs", label: "Миний зарууд", icon: ListChecks },
  { href: "/c/me", label: "Би", icon: User },
];

const workerItems: NavItem[] = [
  { href: "/w", label: "Нүүр", icon: Home },
  { href: "/w/calendar", label: "Календар", icon: CalendarDays },
  { href: "/w/me", label: "Би", icon: User },
];

export function CustomerBottomNav() {
  return <BottomNav items={customerItems} />;
}

export function CustomerSidebar({ footer }: { footer?: React.ReactNode }) {
  return <NavRail items={customerItems} title="Захиалагч" footer={footer} />;
}

export function WorkerBottomNav() {
  return <BottomNav items={workerItems} />;
}

export function WorkerSidebar({ footer }: { footer?: React.ReactNode }) {
  return <NavRail items={workerItems} title="Ажил хийгч" footer={footer} />;
}
