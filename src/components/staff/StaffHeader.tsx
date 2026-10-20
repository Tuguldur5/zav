"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Check, PanelRight } from "lucide-react";
import { ProfileMenu } from "./ProfileMenu";
import { TabNav, currentPageLabel } from "./TabNav";
import type { StaffNavItem } from "./nav";
import type { Role } from "@/lib/types";
import type { StaffCounts, StaffTone } from "./types";

/**
 * The header sits on the blue frame. Left: white logo mark, "Зав", a green dot
 * and the role chip. Centre: tabs (>=640) or the current page name (<640).
 * Right: desk button (1024-1279), bell (<1024) and the profile menu.
 */
export function StaffHeader({
  tone,
  role,
  nav,
  counts,
  name,
  email,
  lastSignIn,
  activeHref,
  onOpenDesk,
}: {
  tone: StaffTone;
  role: Role;
  nav: StaffNavItem[];
  counts: StaffCounts;
  name: string;
  email: string;
  lastSignIn: string | null;
  activeHref?: string;
  onOpenDesk: () => void;
}) {
  const pathname = usePathname();
  const roleLabel = role === "super_admin" ? "Супер админ" : "Админ";
  const pageLabel = currentPageLabel(nav, activeHref ?? pathname);

  return (
    <header className="staff-header" data-staff-header="">
      <Link href={tone === "super" ? "/super" : "/today"} className="staff-brand press">
        <span className="staff-logo" aria-hidden>
          <Check className="size-5" strokeWidth={3} />
        </span>
        <span className="staff-brand-name">Зав</span>
        <span className="staff-dot" aria-hidden />
        <span className="staff-role" data-staff-role="">
          {roleLabel}
        </span>
      </Link>

      <span className="staff-mobile-title text-[17px] font-semibold">{pageLabel}</span>

      <TabNav items={nav} counts={counts} activeHref={activeHref} />

      <div className="staff-header-right">
        <button
          type="button"
          onClick={onOpenDesk}
          className="staff-iconbtn press hidden lg:grid xl:hidden"
          aria-label="Самбар"
          title="Самбар"
        >
          <PanelRight aria-hidden className="size-5" />
          {counts.alerts > 0 ? (
            <span className="staff-tab-badge">{counts.alerts > 99 ? "99+" : counts.alerts}</span>
          ) : null}
        </button>

        <Link
          href="/notifications"
          aria-label={counts.alerts > 0 ? `Мэдэгдэл (${counts.alerts})` : "Мэдэгдэл"}
          title="Мэдэгдэл"
          className="staff-iconbtn press relative lg:hidden"
        >
          <Bell aria-hidden className="size-5" />
          {counts.alerts > 0 ? <span className="staff-tab-badge">{counts.alerts}</span> : null}
        </Link>

        <ProfileMenu
          name={name}
          email={email}
          lastSignIn={lastSignIn}
          roleLabel={roleLabel}
          showSuperLink={role === "super_admin" && tone === "admin"}
        />
      </div>
    </header>
  );
}
