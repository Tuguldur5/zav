"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { MoreHorizontal, Rows3, Search, Table2, PanelRight } from "lucide-react";

/** Opens the shell's command palette from a page (custom DOM event). */
export function SearchPill({ placeholder = "Хайх" }: { placeholder?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("zav:staff-palette"))}
      className="staff-search press w-full text-left sm:w-80"
      aria-label="Хайлт нээх"
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span className="truncate text-[14px]">{placeholder}</span>
      <kbd className="ml-auto rounded-md px-1.5 text-[11px] opacity-60">/</kbd>
    </button>
  );
}

/** "⋯" menu that carries the rail actions on screens below 1024px. */
export function PageMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

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
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function run(name: "zav:staff-palette" | "zav:staff-view" | "zav:staff-density" | "zav:staff-desk") {
    setOpen(false);
    window.dispatchEvent(new Event(name));
  }

  return (
    <div className="relative lg:hidden" ref={root}>
      <button
        type="button"
        className="staff-iconbtn press !text-ink"
        style={{ background: "var(--adm-surface)", boxShadow: "inset 0 0 0 1px var(--adm-divider)" }}
        aria-label="Илүү үйлдэл"
        title="Илүү үйлдэл"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal aria-hidden className="size-5" />
      </button>
      {open ? (
        <div className="staff-profile-menu" role="menu" aria-label="Хуудасны үйлдэл">
          <button type="button" role="menuitem" onClick={() => run("zav:staff-palette")} className="press">
            <Search aria-hidden className="size-4" />
            Хайх
          </button>
          <button type="button" role="menuitem" onClick={() => run("zav:staff-view")} className="press">
            <Table2 aria-hidden className="size-4" />
            Харагдац солих
          </button>
          <button type="button" role="menuitem" onClick={() => run("zav:staff-density")} className="press">
            <Rows3 aria-hidden className="size-4" />
            Нягтрал
          </button>
          <button type="button" role="menuitem" onClick={() => run("zav:staff-desk")} className="press">
            <PanelRight aria-hidden className="size-4" />
            Самбар
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** H1 with an optional emoji, a muted subtitle and the search/actions row. */
export function PageTitle({
  title,
  subtitle,
  emoji,
  search,
  actions,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  search?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="staff-page-head">
      <div className="min-w-0">
        <h1 className="staff-title">
          {title}
          {emoji ? (
            <span aria-hidden className="ml-1.5 align-middle text-[0.8em]">
              {emoji}
            </span>
          ) : null}
        </h1>
        {subtitle ? <p className="staff-subtitle">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {search}
        <div className="flex items-center gap-2">
          {actions}
          <PageMenu />
        </div>
      </div>
    </div>
  );
}

/** Section title with a round count badge and an optional pill link. */
export function SectionHeader({
  title,
  count,
  href,
  hrefLabel = "Бүгд",
}: {
  title: string;
  count?: number;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="staff-section-head">
      <h2 className="staff-section-title">{title}</h2>
      {typeof count === "number" ? <span className="staff-count">{count}</span> : null}
      {href ? (
        <Link href={href} className="staff-all-link press">
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function PanelSection({
  title,
  count,
  href,
  hrefLabel,
  children,
}: {
  title: string;
  count?: number;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="staff-section">
      <SectionHeader title={title} count={count} href={href} hrefLabel={hrefLabel} />
      {children}
    </section>
  );
}
