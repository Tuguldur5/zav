export type StaffTone = "admin" | "super";

export type StaffNavItem = {
  href: string;
  label: string;
  /** Extra path prefixes that also mark this item active. */
  match?: string[];
  badge?: "jobs" | "newWorkers" | "staleJobs";
  attention?: boolean;
};

export type StaffCounts = {
  jobs: number;
  newWorkers: number;
  staleJobs: number;
  alerts: number;
};

export type StaffNotice = {
  id: string;
  title: string;
  href: string;
  read: boolean;
  time: string;
};

export type { Role } from "@/lib/types";
