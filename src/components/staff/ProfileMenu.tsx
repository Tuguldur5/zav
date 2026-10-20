"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/session";
import { TextSizeSwitch } from "@/components/ui/TextSizeSwitch";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Avatar + name + own email on the frame, opening a white dropdown. Esc and an
 * outside click close it; items are a real menu for keyboard users.
 */
export function ProfileMenu({
  name,
  email,
  lastSignIn,
  roleLabel,
  showSuperLink,
}: {
  name: string;
  email: string;
  lastSignIn: string | null;
  roleLabel: string;
  showSuperLink: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocumentClick(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKey);
    // Focus the first item so the menu is reachable without a mouse.
    menu.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="staff-profile" ref={root}>
      <button
        type="button"
        className="staff-profile-button press"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Профайл: ${name}`}
        onClick={() => setOpen((value) => !value)}
        data-profile-menu=""
      >
        <span className="staff-avatar" aria-hidden>
          {initials(name)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="staff-profile-name">{name}</span>
          <span className="staff-profile-mail">{email}</span>
        </span>
        <ChevronDown aria-hidden className="size-4 shrink-0 opacity-80" />
      </button>

      {open ? (
        <div className="staff-profile-menu" role="menu" aria-label="Профайлын цэс" ref={menu}>
          <div className="staff-profile-head">
            <p className="truncate text-[14px] font-semibold">{name}</p>
            <p className="truncate text-[12px] text-muted">{email}</p>
            <span className="staff-role mt-2 inline-flex">{roleLabel}</span>
            <p className="staff-profile-meta !px-0">
              {lastSignIn ? `Сүүлд нэвтэрсэн: ${lastSignIn}` : "Сүүлд нэвтэрсэн: хэзээ ч"}
            </p>
          </div>

          <Link href="/profile" role="menuitem" className="press">
            <UserRound aria-hidden className="size-4" />
            Миний профайл
          </Link>
          <Link href="/security" role="menuitem" className="press">
            <ShieldCheck aria-hidden className="size-4" />
            Аюулгүй байдал
          </Link>
          {showSuperLink ? (
            <Link href="/super" role="menuitem" className="press">
              <LayoutDashboard aria-hidden className="size-4" />
              Супер админы самбар
            </Link>
          ) : null}

          <div className="mt-1 border-t border-line px-2 pb-2 pt-3">
            <TextSizeSwitch />
          </div>

          <div className="border-t border-line pt-1">
            <form action={logoutAction}>
              <button type="submit" role="menuitem" data-danger className="press w-full">
                <LogOut aria-hidden className="size-4" />
                Гарах
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
