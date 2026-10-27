"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { TextSizeSwitch } from "@/components/ui/TextSizeSwitch";
import { logoutAction } from "@/lib/actions/session";
import type { Role } from "@/lib/types";
import { activeItem, badgeValue, navFor, phoneNav, type StaffNavEntry } from "./nav";
import type { StaffCounts, StaffNotice, StaffTone } from "./types";

const SHARED_LABELS: Record<string, string> = {
  "/notifications": "Мэдэгдэл",
  "/profile": "Профайл",
  "/security": "Аюулгүй байдал",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Админ",
  super_admin: "Супер админ",
};

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  return (
    source
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/**
 * The one shell for both staff roles. A white page with a single header
 * (desktop) or top bar + flat bottom tab bar (phones). Notifications live
 * behind the bell; profile, security and sign-out behind the avatar.
 */
export function StaffShell({
  tone,
  role,
  name,
  email,
  counts,
  notices,
  children,
}: {
  tone: StaffTone;
  role: Role;
  name: string;
  email: string;
  counts: StaffCounts;
  notices: StaffNotice[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = navFor(role === "super_admin" ? "super_admin" : "admin");
  const current = activeItem(pathname, nav);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeBell = useCallback(() => setBellOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const bellRef = useDismiss(bellOpen, closeBell);
  const menuRef = useDismiss(menuOpen, closeMenu);
  const menuId = useId();

  // Route changes close every transient layer.
  useEffect(() => {
    setBellOpen(false);
    setMenuOpen(false);
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sheetOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  function onMenuKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    );
    if (items.length === 0) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next = 0;
    if (event.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length;
    if (event.key === "ArrowUp") next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
    if (event.key === "End") next = items.length - 1;
    items[next]?.focus();
  }

  const pageTitle =
    current?.label ?? SHARED_LABELS[pathname] ?? (role === "super_admin" ? "Самбар" : "Ажилтан");
  const phoneItems = phoneNav(role === "super_admin" ? "super_admin" : "admin");
  const phoneHrefs = new Set(phoneItems.map((item) => item.href));
  const moreItems = nav.filter((item) => !phoneHrefs.has(item.href));

  function badge(item: StaffNavEntry) {
    const value = badgeValue(item, counts);
    if (value <= 0) return null;
    return (
      <span className="st-nav-badge" data-attention={item.attention && value > 0 ? "" : undefined}>
        {value > 99 ? "99+" : value}
      </span>
    );
  }

  const avatar = (
    <span className="st-avatar" aria-hidden>
      {initials(name, email)}
    </span>
  );

  return (
    <div className="st-shell staff-theme" data-staff-shell={tone} data-staff-tone={tone}>
      <a href="#staff-main" className="st-skip">
        Үндсэн агуулга руу
      </a>

      <header className="st-header">
        <div className="st-header-inner">
          <Link href={role === "super_admin" ? "/super" : "/today"} aria-label="Нүүр" className="st-mark">
            <Check aria-hidden className="size-4" strokeWidth={3} />
          </Link>

          <nav className="st-nav" aria-label="Үндсэн цэс">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = current?.href === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="st-nav-item"
                  aria-current={active ? "page" : undefined}
                >
                  <Icon aria-hidden className="size-[18px]" />
                  {item.label}
                  {badge(item)}
                </Link>
              );
            })}
          </nav>

          <div className="st-header-actions">
            <div className="st-pop-anchor" ref={bellRef}>
              <button
                type="button"
                className="st-iconbtn press"
                aria-label={counts.alerts > 0 ? `Мэдэгдэл (${counts.alerts})` : "Мэдэгдэл"}
                aria-expanded={bellOpen}
                aria-haspopup="true"
                onClick={() => setBellOpen((value) => !value)}
              >
                <Bell aria-hidden className="size-5" />
                {counts.alerts > 0 ? (
                  <span className="st-iconbtn-count">{counts.alerts > 9 ? "9+" : counts.alerts}</span>
                ) : null}
              </button>
              {bellOpen ? (
                <div className="st-popover" role="dialog" aria-label="Сүүлийн мэдэгдэл">
                  <div className="st-pop-head">
                    <span className="st-pop-title">Мэдэгдэл</span>
                    <button
                      type="button"
                      className="st-iconbtn press !size-8"
                      aria-label="Хаах"
                      onClick={closeBell}
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  </div>
                  {notices.length === 0 ? (
                    <p className="p-4 text-[13px] text-[color:var(--st-muted)]">Мэдэгдэл байхгүй.</p>
                  ) : (
                    <ul>
                      {notices.slice(0, 5).map((notice) => (
                        <li key={notice.id}>
                          <Link
                            href={notice.href}
                            className="st-notice"
                            data-unread={notice.read ? undefined : ""}
                          >
                            <span className="min-w-0">
                              <span className="st-notice-title block">{notice.title}</span>
                              <span className="st-notice-time">{notice.time}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/notifications" className="st-pop-foot">
                    Бүгдийг харах
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="st-pop-anchor" ref={menuRef}>
              <button
                type="button"
                className="st-profile-btn press"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((value) => !value)}
              >
                {avatar}
                <span className="st-profile-text">
                  <span className="st-profile-name">{name || "Ажилтан"}</span>
                  <span className="st-profile-mail">{email}</span>
                </span>
                <ChevronDown aria-hidden className="size-4 text-[color:var(--st-muted)]" />
              </button>
              {menuOpen ? (
                <div
                  className="st-popover st-menu"
                  role="menu"
                  id={menuId}
                  aria-label="Профайл цэс"
                  onKeyDown={onMenuKey}
                >
                  <div className="st-menu-head">
                    <p className="st-profile-name">{name || "Ажилтан"}</p>
                    <p className="st-profile-mail">{email}</p>
                    <p className="st-menu-role">{ROLE_LABEL[role] ?? "Ажилтан"}</p>
                  </div>
                  <Link href="/profile" role="menuitem" className="st-menu-item" tabIndex={0}>
                    <UserRound aria-hidden className="size-4" />
                    Профайл
                  </Link>
                  <Link href="/security" role="menuitem" className="st-menu-item" tabIndex={0}>
                    <ShieldCheck aria-hidden className="size-4" />
                    Аюулгүй байдал
                  </Link>
                  <div className="st-menu-item cursor-default">
                    <TextSizeSwitch />
                  </div>
                  <div className="st-menu-sep" />
                  <form action={logoutAction}>
                    <button type="submit" role="menuitem" className="st-menu-item" data-danger tabIndex={0}>
                      <LogOut aria-hidden className="size-4" />
                      Гарах
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="st-phonebar">
        <Link href={role === "super_admin" ? "/super" : "/today"} aria-label="Нүүр" className="st-mark">
          <Check aria-hidden className="size-4" strokeWidth={3} />
        </Link>
        <span className="st-phonebar-title">{pageTitle}</span>
        <div className="st-phonebar-actions">
          <Link href="/notifications" className="st-iconbtn press" aria-label="Мэдэгдэл">
            <Bell aria-hidden className="size-5" />
            {counts.alerts > 0 ? (
              <span className="st-iconbtn-count">{counts.alerts > 9 ? "9+" : counts.alerts}</span>
            ) : null}
          </Link>
          <button
            type="button"
            className="st-profile-btn press !px-1"
            aria-label="Хуудасны цэс"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
          >
            {avatar}
          </button>
        </div>
      </div>

      <main id="staff-main" className="st-page">
        {children}
      </main>

      <nav className="st-tabbar" aria-label="Доод цэс">
        {phoneItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden className="size-5" />
              <span className="st-tabbar-label">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
          className="press"
        >
          <Menu aria-hidden className="size-5" />
          <span className="st-tabbar-label">Бусад</span>
        </button>
      </nav>

      {sheetOpen ? (
        <>
          <button
            type="button"
            className="st-sheet-scrim"
            aria-label="Хаах"
            onClick={closeSheet}
          />
          <div className="st-sheet" role="dialog" aria-modal="true" aria-label="Бусад хуудас">
            <div className="st-sheet-handle" aria-hidden />
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-[15px] font-semibold">{pageTitle}</span>
              <button type="button" className="st-iconbtn press" aria-label="Хаах" onClick={closeSheet}>
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="flex flex-col">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="st-menu-item">
                    <Icon aria-hidden className="size-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="st-menu-sep" />
              <Link href="/profile" className="st-menu-item">
                <UserRound aria-hidden className="size-5" />
                Профайл
              </Link>
              <Link href="/security" className="st-menu-item">
                <ShieldCheck aria-hidden className="size-5" />
                Аюулгүй байдал
              </Link>
              <div className="px-2 py-2">
                <TextSizeSwitch />
              </div>
              <div className="st-menu-sep" />
              <form action={logoutAction}>
                <button type="submit" className="st-menu-item" data-danger>
                  <LogOut aria-hidden className="size-5" />
                  Гарах
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
