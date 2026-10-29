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
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { TextSizeSwitch } from "@/components/ui/TextSizeSwitch";
import { logoutAction } from "@/lib/actions/session";
import type { Role } from "@/lib/types";
import {
  activeItem,
  badgeValue,
  navFor,
  navGroupsFor,
  phoneNav,
  type StaffNavEntry,
} from "./nav";
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

const COLLAPSE_KEY = "zav_staff_nav_collapsed";

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
 * The one shell for both staff roles: a left sidebar with labelled navigation
 * groups, a sticky topbar (page title, notifications, profile) and the page
 * content. Below 1024px the sidebar becomes a drawer and the four primary
 * destinations move to the bottom tab bar.
 */
export function StaffShell({
  tone,
  role,
  name,
  email,
  counts,
  notices,
  mfaEnabled,
  lastSignIn,
  children,
}: {
  tone: StaffTone;
  role: Role;
  name: string;
  email: string;
  counts: StaffCounts;
  notices: StaffNotice[];
  mfaEnabled: boolean;
  lastSignIn: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navRole = role === "super_admin" ? "super_admin" : "admin";
  const nav = navFor(navRole);
  const groups = navGroupsFor(navRole);
  const current = activeItem(pathname, nav);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const closeBell = useCallback(() => setBellOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const bellRef = useDismiss(bellOpen, closeBell);
  const menuRef = useDismiss(menuOpen, closeMenu);
  const menuId = useId();

  // Route changes close every transient layer.
  useEffect(() => {
    setBellOpen(false);
    setMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Rail state is a preference, not data: read it after mount, remember it.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage blocked: stay expanded */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* storage blocked: the state still works for this session */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleCollapsed();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

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
  const groupLabel =
    groups.find((group) => group.items.some((item) => item.href === current?.href))?.label ??
    (role === "super_admin" ? "Хяналт" : "Ажил");
  const homeHref = role === "super_admin" ? "/super" : "/today";
  const phoneItems = phoneNav(navRole);

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

      {drawerOpen ? (
        <button type="button" className="st-scrim" aria-label="Цэс хаах" onClick={closeDrawer} />
      ) : null}

      <aside
        className="st-sidebar"
        data-collapsed={collapsed ? "1" : undefined}
        data-open={drawerOpen ? "1" : undefined}
        aria-label="Хажуугийн цэс"
      >
        <div className="st-sidebar-head">
          <Link href={homeHref} aria-label="Нүүр" className="st-brand">
            <span className="st-mark">
              <Check aria-hidden className="size-5" strokeWidth={3} />
            </span>
            <span className="st-brand-text">
              <span className="st-brand-name">Зав байна</span>
              <span className="st-brand-sub">{ROLE_LABEL[role] ?? "Ажилтан"}</span>
            </span>
          </Link>
          <button
            type="button"
            className="st-collapse"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Цэс дэлгэх" : "Цэс хумих"}
            title={collapsed ? "Цэс дэлгэх (Ctrl+B)" : "Цэс хумих (Ctrl+B)"}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="size-4" />
            ) : (
              <PanelLeftClose aria-hidden className="size-4" />
            )}
          </button>
        </div>

        <nav className="st-sidebar-nav" aria-label="Үндсэн цэс">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="st-nav-label">{group.label}</p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = current?.href === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="st-nav-item"
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon aria-hidden className="st-nav-icon size-[18px]" />
                      <span className="st-nav-text">{item.label}</span>
                      {badge(item)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="st-sidebar-foot">
          {/* Phone only: the drawer carries the account links the desktop topbar
              already has in the profile menu. */}
          <div className="st-sidebar-account">
            <Link href="/profile" className="st-nav-item">
              <UserRound aria-hidden className="st-nav-icon size-[18px]" />
              <span className="st-nav-text">Профайл</span>
            </Link>
            <Link href="/security" className="st-nav-item">
              <ShieldCheck aria-hidden className="st-nav-icon size-[18px]" />
              <span className="st-nav-text">Аюулгүй байдал</span>
            </Link>
            <div className="st-nav-item cursor-default">
              <TextSizeSwitch />
            </div>
            <form action={logoutAction}>
              <button type="submit" className="st-nav-item w-full" data-danger>
                <LogOut aria-hidden className="st-nav-icon size-[18px]" />
                <span className="st-nav-text">Гарах</span>
              </button>
            </form>
          </div>

          <div className="st-status-card" data-warn={mfaEnabled ? undefined : ""}>
            <span className="st-status-row">
              <span className="st-status-dot" aria-hidden />
              {mfaEnabled ? "MFA идэвхтэй" : "MFA идэвхгүй"}
            </span>
            <span className="st-status-line">
              {mfaEnabled ? (
                lastSignIn ? `Сүүлд нэвтэрсэн: ${lastSignIn}` : "Энэ төхөөрөмжөөс нэвтэрсэн"
              ) : (
                <Link href="/security">Идэвхжүүлэх</Link>
              )}
            </span>
          </div>
        </div>
      </aside>

      <div className="st-main">
        <header className="st-topbar">
          <div className="st-topbar-inner">
            <button
              type="button"
              className="st-iconbtn st-topbar-menu"
              aria-label="Цэс нээх"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu aria-hidden className="size-5" />
            </button>

            {/* The only page title on a staff screen: the content below starts
                with the description and the actions, never with a second H1. */}
            <div className="st-crumb">
              <span className="st-crumb-label">{groupLabel}</span>
              <h1 className="st-crumb-title">{pageTitle}</h1>
            </div>

            <div className="st-topbar-actions">
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
                              <span className="st-notice-title block">{notice.title}</span>
                              <span className="st-notice-time">{notice.time}</span>
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

        <main id="staff-main" className="st-page">
          {children}
        </main>
      </div>

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
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="press"
        >
          <Menu aria-hidden className="size-5" />
          <span className="st-tabbar-label">Бусад</span>
        </button>
      </nav>
    </div>
  );
}
