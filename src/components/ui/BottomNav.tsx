"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cx } from "./styles";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

/** Phones only (below 640px): flat items, active = primary icon + label. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Үндсэн цэс"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-[var(--row-h)] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[0.72em] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon aria-hidden className={cx("size-5", active && "stroke-[2.5]")} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
