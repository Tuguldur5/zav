"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  LayoutList,
  Plus,
  Rows3,
  Search,
  Table2,
  X,
} from "lucide-react";
import type { StaffNotice, StaffPlusAction } from "./types";

/**
 * The floating rail inside the paper (>=1024px). Top: search, view switch and
 * (when the page has one) filters. Bottom: notifications, quick create and the
 * density switch. Every button has a title tooltip; menus close on Esc/outside.
 */
export function FloatingRail({
  onOpenPalette,
  hasLists,
  view,
  onToggleView,
  compact,
  onToggleDensity,
  unread,
  notices,
  quick,
}: {
  onOpenPalette: () => void;
  hasLists: boolean;
  view: "table" | "cards";
  onToggleView: () => void;
  compact: boolean;
  onToggleDensity: () => void;
  unread: number;
  notices: StaffNotice[];
  quick: StaffPlusAction[];
}) {
  const [menu, setMenu] = useState<"new" | "notices" | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    function onDocumentClick(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setMenu(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(null);
    }
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <div className="staff-rail" aria-label="Багаж" ref={root} data-staff-rail="">
      <button
        type="button"
        onClick={onOpenPalette}
        className="staff-rail-btn press"
        aria-label="Хайх (/)"
        title="Хайх (/)"
      >
        <Search aria-hidden className="size-5" />
      </button>

      {hasLists ? (
        <button
          type="button"
          onClick={onToggleView}
          className="staff-rail-btn press"
          aria-label={view === "cards" ? "Хүснэгтээр харах" : "Картаар харах"}
          title={view === "cards" ? "Хүснэгтээр харах" : "Картаар харах"}
        >
          {view === "cards" ? (
            <Table2 aria-hidden className="size-5" />
          ) : (
            <LayoutList aria-hidden className="size-5" />
          )}
        </button>
      ) : null}

      <span className="staff-rail-sep" aria-hidden />

      <div className="staff-rail-bottom">
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => setMenu(menu === "notices" ? null : "notices")}
            className="staff-rail-btn press"
            aria-label={unread > 0 ? `Мэдэгдэл (${unread})` : "Мэдэгдэл"}
            title="Мэдэгдэл"
            aria-expanded={menu === "notices"}
          >
            <Bell aria-hidden className="size-5" />
            {unread > 0 ? (
              <span className="staff-rail-badge">{unread > 99 ? "99+" : unread}</span>
            ) : null}
          </button>

          {menu === "notices" ? (
            <div className="staff-rail-menu" role="dialog" aria-label="Сүүлийн мэдэгдэл">
              <div className="flex items-center justify-between">
                <p className="staff-rail-menu-title">Мэдэгдэл</p>
                <button
                  type="button"
                  onClick={() => setMenu(null)}
                  aria-label="Хаах"
                  className="press grid size-9 place-items-center rounded-full"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
              {notices.length === 0 ? (
                <p className="px-2 pb-2 text-[13px] text-muted">Шинэ мэдэгдэл байхгүй.</p>
              ) : (
                notices.slice(0, 5).map((notice) => (
                  <Link
                    key={notice.id}
                    href={notice.href}
                    onClick={() => setMenu(null)}
                    className="press"
                  >
                    <span className="min-w-0 flex-1 truncate">{notice.title}</span>
                    <span className="shrink-0 text-[11px] text-muted">{notice.time}</span>
                  </Link>
                ))
              )}
              <Link
                href="/notifications"
                onClick={() => setMenu(null)}
                className="press font-semibold"
              >
                Бүгдийг харах
              </Link>
            </div>
          ) : null}
        </div>

        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => setMenu(menu === "new" ? null : "new")}
            className="staff-rail-btn press"
            aria-label="Шинэ"
            title="Шинэ"
            aria-expanded={menu === "new"}
          >
            <Plus aria-hidden className="size-5" />
          </button>

          {menu === "new" ? (
            <div className="staff-rail-menu" role="menu" aria-label="Шинэ үйлдэл">
              <p className="staff-rail-menu-title">Шинэ</p>
              {quick.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  role="menuitem"
                  onClick={() => setMenu(null)}
                  className="press"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onToggleDensity}
          className="staff-rail-btn press"
          aria-label={compact ? "Энгийн нягтрал" : "Нягт харагдац"}
          title={compact ? "Энгийн нягтрал" : "Нягт харагдац"}
          aria-pressed={compact}
        >
          <Rows3 aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}
