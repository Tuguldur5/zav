"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MoreHorizontal, Plus } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { logoutAction } from "@/lib/actions/session";
import type { StaffDockItem } from "./nav";
import type { StaffPlusAction } from "./types";

function isActive(pathname: string, match: string): boolean {
  if (match === "/super") return pathname === "/super";
  return pathname === match || pathname.startsWith(`${match}/`);
}

function DockButton({
  item,
  active,
  tint,
}: {
  item: StaffDockItem;
  active: boolean;
  tint: 1 | 2 | 3 | 4;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      aria-label={item.label}
      data-active={active ? "1" : undefined}
      data-tint={String(tint)}
      className="staff-dock-btn press"
    >
      <Icon aria-hidden className="size-5" />
      <span className="sr-only">{item.label}</span>
    </Link>
  );
}

/**
 * Desktop: a floating dark pill of tinted round buttons plus "+". Phones: the
 * same component becomes a full-width bottom navigation with icon + label and
 * an extra "Бусад" sheet (remaining destinations, notifications, profile,
 * security, logout). CSS decides which one is visible.
 */
export function Dock({
  items,
  phoneItems,
  plus,
  more,
  onOpenDesk,
}: {
  items: StaffDockItem[];
  phoneItems: StaffDockItem[];
  plus: StaffPlusAction[];
  more: StaffPlusAction[];
  onOpenDesk: () => void;
}) {
  const pathname = usePathname();
  const [plusOpen, setPlusOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Any navigation closes both sheets.
  useEffect(() => {
    setPlusOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <nav aria-label="Хурдан цэс" className="staff-dock" data-staff-dock="">
        {items.map((item, index) => (
          <DockButton
            key={`${item.href}-${item.label}`}
            item={item}
            active={isActive(pathname, item.match)}
            tint={((index % 4) + 1) as 1 | 2 | 3 | 4}
          />
        ))}
        <button
          type="button"
          onClick={() => setPlusOpen(true)}
          aria-label="Нэмэлт үйлдэл"
          title="Нэмэлт үйлдэл"
          className="staff-dock-btn staff-dock-plus press"
        >
          <Plus aria-hidden className="size-5" />
        </button>
      </nav>

      <nav aria-label="Үндсэн цэс" className="staff-bottomnav" data-staff-bottomnav="">
        {phoneItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              data-active={active ? "1" : undefined}
              className="press"
            >
              <Icon aria-hidden className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="Бусад"
          aria-expanded={moreOpen}
          className="press"
        >
          <MoreHorizontal aria-hidden className="size-5" />
          <span>Бусад</span>
        </button>
      </nav>

      <Sheet open={plusOpen} onClose={() => setPlusOpen(false)} title="Нэмэлт үйлдэл">
        <ul className="flex flex-col gap-2 pb-2">
          {plus.map((action) => (
            <li key={`${action.href}-${action.label}`}>
              <Link
                href={action.href}
                onClick={() => setPlusOpen(false)}
                className="press flex min-h-12 items-center rounded-xl bg-tint-1 px-4 text-[15px] font-medium"
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Бусад">
        <ul className="flex flex-col gap-2 pb-2">
          <li>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                onOpenDesk();
              }}
              className="press flex min-h-12 w-full items-center rounded-xl bg-tint-1 px-4 text-left text-[15px] font-medium"
            >
              Админы самбар
            </button>
          </li>
          {more.map((action) => (
            <li key={`${action.href}-${action.label}`}>
              <Link
                href={action.href}
                onClick={() => setMoreOpen(false)}
                className="press flex min-h-12 items-center rounded-xl bg-tint-1 px-4 text-[15px] font-medium"
              >
                {action.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/notifications"
              className="press flex min-h-12 items-center rounded-xl bg-tint-1 px-4 text-[15px] font-medium"
            >
              Мэдэгдэл
            </Link>
          </li>
          <li>
            <Link
              href="/profile"
              className="press flex min-h-12 items-center rounded-xl bg-tint-1 px-4 text-[15px] font-medium"
            >
              Профайл
            </Link>
          </li>
          <li>
            <Link
              href="/security"
              className="press flex min-h-12 items-center rounded-xl bg-tint-1 px-4 text-[15px] font-medium"
            >
              Аюулгүй байдал
            </Link>
          </li>
          <li>
            <form action={logoutAction}>
              <button
                type="submit"
                className="press flex min-h-12 w-full items-center gap-2 rounded-xl bg-error-container px-4 text-[15px] font-medium text-error"
              >
                <LogOut aria-hidden className="size-4" />
                Гарах
              </button>
            </form>
          </li>
        </ul>
      </Sheet>
    </>
  );
}
